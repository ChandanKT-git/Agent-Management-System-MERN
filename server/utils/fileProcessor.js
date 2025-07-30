const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Readable } = require('stream');

/**
 * Validates that required columns exist in the parsed data
 * @param {Array} data - Parsed data array
 * @param {Array} requiredColumns - Array of required column names
 * @returns {Object} - Validation result with success status and errors
 */
const validateColumns = (data, requiredColumns = ['FirstName', 'Phone', 'Notes']) => {
    if (!data || data.length === 0) {
        return {
            success: false,
            error: {
                code: 'EMPTY_FILE',
                message: 'The uploaded file is empty or contains no data'
            }
        };
    }

    const firstRow = data[0];
    const availableColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(col =>
        !availableColumns.some(availableCol =>
            availableCol.toLowerCase().trim() === col.toLowerCase()
        )
    );

    if (missingColumns.length > 0) {
        return {
            success: false,
            error: {
                code: 'MISSING_COLUMNS',
                message: `Missing required columns: ${missingColumns.join(', ')}`,
                details: {
                    missingColumns,
                    availableColumns,
                    requiredColumns
                }
            }
        };
    }

    return { success: true };
};

/**
 * Normalizes column names to match expected format
 * @param {Object} row - Data row object
 * @returns {Object} - Normalized row object
 */
const normalizeRow = (row) => {
    const normalized = {};

    // Create a mapping of lowercase keys to original keys
    const keyMap = {};
    Object.keys(row).forEach(key => {
        keyMap[key.toLowerCase().trim()] = key;
    });

    // Map to expected column names
    const columnMapping = {
        'firstname': 'FirstName',
        'phone': 'Phone',
        'notes': 'Notes'
    };

    Object.entries(columnMapping).forEach(([searchKey, targetKey]) => {
        const originalKey = keyMap[searchKey];
        if (originalKey && row[originalKey] !== undefined) {
            normalized[targetKey] = String(row[originalKey]).trim();
        }
    });

    return normalized;
};

/**
 * Validates individual row data
 * @param {Object} row - Data row object
 * @param {number} rowIndex - Row index for error reporting
 * @returns {Object} - Validation result
 */
const validateRow = (row, rowIndex) => {
    const errors = [];

    if (!row.FirstName || row.FirstName.trim() === '') {
        errors.push(`Row ${rowIndex + 1}: FirstName is required`);
    }

    if (!row.Phone || row.Phone.trim() === '') {
        errors.push(`Row ${rowIndex + 1}: Phone is required`);
    } else {
        // Basic phone validation - should contain digits
        const phoneDigits = row.Phone.replace(/\D/g, '');
        if (phoneDigits.length < 7) {
            errors.push(`Row ${rowIndex + 1}: Phone number appears to be invalid`);
        }
    }

    // Notes can be empty, but if present should be reasonable length
    if (row.Notes && row.Notes.length > 500) {
        errors.push(`Row ${rowIndex + 1}: Notes field is too long (max 500 characters)`);
    }

    return {
        success: errors.length === 0,
        errors
    };
};

/**
 * Processes CSV data from buffer
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<Object>} - Processing result
 */
const processCSV = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const errors = [];

        const stream = Readable.from(buffer.toString());

        stream
            .pipe(csv())
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', () => {
                try {
                    // Validate columns
                    const columnValidation = validateColumns(results);
                    if (!columnValidation.success) {
                        return resolve(columnValidation);
                    }

                    // Normalize and validate each row
                    const processedData = [];
                    const rowErrors = [];

                    results.forEach((row, index) => {
                        const normalizedRow = normalizeRow(row);
                        const rowValidation = validateRow(normalizedRow, index);

                        if (rowValidation.success) {
                            processedData.push(normalizedRow);
                        } else {
                            rowErrors.push(...rowValidation.errors);
                        }
                    });

                    if (rowErrors.length > 0) {
                        return resolve({
                            success: false,
                            error: {
                                code: 'INVALID_DATA',
                                message: 'Some rows contain invalid data',
                                details: {
                                    errors: rowErrors,
                                    totalRows: results.length,
                                    validRows: processedData.length
                                }
                            }
                        });
                    }

                    resolve({
                        success: true,
                        data: processedData,
                        totalRows: processedData.length
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        error: {
                            code: 'PROCESSING_ERROR',
                            message: 'Error processing CSV data',
                            details: error.message
                        }
                    });
                }
            })
            .on('error', (error) => {
                resolve({
                    success: false,
                    error: {
                        code: 'CSV_PARSE_ERROR',
                        message: 'Error parsing CSV file',
                        details: error.message
                    }
                });
            });
    });
};

/**
 * Processes Excel data from buffer
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<Object>} - Processing result
 */
const processExcel = async (buffer) => {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            return {
                success: false,
                error: {
                    code: 'NO_WORKSHEETS',
                    message: 'No worksheets found in the Excel file'
                }
            };
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return {
                success: false,
                error: {
                    code: 'EMPTY_WORKSHEET',
                    message: 'The worksheet is empty or contains no data'
                }
            };
        }

        // Validate columns
        const columnValidation = validateColumns(jsonData);
        if (!columnValidation.success) {
            return columnValidation;
        }

        // Normalize and validate each row
        const processedData = [];
        const rowErrors = [];

        jsonData.forEach((row, index) => {
            const normalizedRow = normalizeRow(row);
            const rowValidation = validateRow(normalizedRow, index);

            if (rowValidation.success) {
                processedData.push(normalizedRow);
            } else {
                rowErrors.push(...rowValidation.errors);
            }
        });

        if (rowErrors.length > 0) {
            return {
                success: false,
                error: {
                    code: 'INVALID_DATA',
                    message: 'Some rows contain invalid data',
                    details: {
                        errors: rowErrors,
                        totalRows: jsonData.length,
                        validRows: processedData.length
                    }
                }
            };
        }

        return {
            success: true,
            data: processedData,
            totalRows: processedData.length
        };
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'EXCEL_PARSE_ERROR',
                message: 'Error parsing Excel file',
                details: error.message
            }
        };
    }
};

/**
 * Main file processing function
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} - Processing result
 */
const processFile = async (file) => {
    if (!file || !file.buffer) {
        return {
            success: false,
            error: {
                code: 'NO_FILE_DATA',
                message: 'No file data provided'
            }
        };
    }

    const fileExtension = file.originalname.toLowerCase().split('.').pop();

    try {
        switch (fileExtension) {
            case 'csv':
                return await processCSV(file.buffer);
            case 'xlsx':
            case 'xls':
                return await processExcel(file.buffer);
            default:
                return {
                    success: false,
                    error: {
                        code: 'UNSUPPORTED_FORMAT',
                        message: 'Unsupported file format. Only CSV, XLSX, and XLS files are supported.'
                    }
                };
        }
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'PROCESSING_ERROR',
                message: 'Unexpected error during file processing',
                details: error.message
            }
        };
    }
};

module.exports = {
    processFile,
    processCSV,
    processExcel,
    validateColumns,
    validateRow,
    normalizeRow
};