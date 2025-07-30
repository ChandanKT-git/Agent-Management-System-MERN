const express = require('express');
const router = express.Router();
const { getDistributions, getDistributionDetails } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Apply authentication middleware to all distribution routes
router.use(authenticateToken);

// GET /api/distributions - Get all distributions
router.get('/', getDistributions);

// GET /api/distributions/:id - Get distribution details
router.get('/:id', validate(schemas.distributionId, 'params'), getDistributionDetails);

module.exports = router;