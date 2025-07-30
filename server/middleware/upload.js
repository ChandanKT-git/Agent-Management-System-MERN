const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Magic number validation for file types
const fileSignatures = {
    'text/csv': [
        [0x22], // Quote character (common in CSV)
        [0x2C], // Comma character
        [0x0D, 0x0A], // CRLF
        [0x0A], // LF
        // Allow any printable ASCII as CSV can start with various characters
    ],
    'application/vnd.ms-excel': [
        [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] // XLS signature
    ],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        [0x50, 0x4B, 0x03, 0x04], // XLSX signature (ZIP format)
        [0x50, 0x4B, 0x05, 0x06], // Empty ZIP
        [0x50, 0x4B, 0x07, 0x08]  // Spanned ZIP
    ]
};

/**
 * Validate file signature against magic numbers
 */
const validateFileSignature = (buffer, mimetype) => {
    const signatures = fileSignatures[mimetype];
    if (!signatures) return false;

    // For CSV files, we're more lenient as they can start with various characters
    if (mimetype === 'text/csv' || mimetype === 'application/csv' || mimetype === 'text/plain') {
        // Check if file contains only printable ASCII characters in first 1024 bytes
        const sample = buffer.slice(0, Math.min(1024, buffer.length));
        for (let i = 0; i < sample.length; i++) {
            const byte = sample[i];
            // Allow printable ASCII, tabs, carriage returns, and line feeds
            if (!(byte >= 32 && byte <= 126) && byte !== 9 && byte !== 10 && byte !== 13) {
                return false;
            }
        }
        return true;
    }

    // For binary files, check magic numbers
    return signatures.some(signature => {
        if (buffer.length < signature.length) return false;
        return signature.every((byte, index) => buffer[index] === byte);
    });
};

// Enhanced file type validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/csv',
        'text/plain'
    ];

    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    file.originalname = sanitizedFilename;

    // Check file extension and MIME type
    if (!allowedTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
        return cb(new Error('Invalid file type. Only CSV, XLSX, and XLS files are allowed.'), false);
    }

    // Additional filename validation
    if (file.originalname.length > 255) {
        return cb(new Error('Filename too long. Maximum 255 characters allowed.'), false);
    }

    // Check for suspicious patterns in filename
    const suspiciousPatterns = [
        /\.\./,  // Path traversal
        /[<>:"|?*]/,  // Invalid filename characters
        /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i  // Reserved Windows names
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.originalname))) {
        return cb(new Error('Invalid filename. Contains suspicious characters.'), false);
    }

    cb(null, true);
};

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory for processing
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only allow one file at a time
    },
    fileFilter: fileFilter
});

// Enhanced middleware wrapper with security checks
const uploadMiddleware = (req, res, next) => {
    const singleUpload = upload.single('file');

    singleUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'FILE_TOO_LARGE',
                        message: 'File size exceeds 5MB limit'
                    }
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'TOO_MANY_FILES',
                        message: 'Only one file is allowed per upload'
                    }
                });
            }
            return res.status(400).json({
                success: false,
                error: {
                    code: 'UPLOAD_ERROR',
                    message: err.message
                }
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_FILE_TYPE',
                    message: err.message
                }
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILE',
                    message: 'No file was uploaded'
                }
            });
        }

        // Validate file signature against magic numbers
        if (!validateFileSignature(req.file.buffer, req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_FILE_SIGNATURE',
                    message: 'File content does not match the declared file type'
                }
            });
        }

        // Generate unique filename to prevent conflicts
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(req.file.originalname);
        req.file.uniqueFilename = `${timestamp}_${randomString}${extension}`;

        // Add file metadata for logging
        req.file.uploadedAt = new Date();
        req.file.uploadedBy = req.user?.id;

        next();
    });
};

module.exports = uploadMiddleware;