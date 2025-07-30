const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/upload');
const { uploadFile, validateFile } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');
const { uploadRateLimit } = require('../middleware/rateLimiting');

// Apply authentication middleware to all upload routes
router.use(authenticateToken);

// POST /api/upload - Upload and process file with distribution
router.post('/', uploadRateLimit, uploadMiddleware, uploadFile);

// POST /api/upload/validate - Validate file structure and show preview
router.post('/validate', uploadRateLimit, uploadMiddleware, validateFile);

module.exports = router;