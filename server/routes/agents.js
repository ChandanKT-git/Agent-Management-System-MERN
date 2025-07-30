const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
    createAgent,
    getAllAgents,
    getAgentById,
    updateAgent,
    deleteAgent
} = require('../controllers/agentController');
const { getAgentTasks } = require('../controllers/uploadController');
const { validate, schemas } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply admin role authorization to all routes
router.use(authorizeRoles(['admin']));

/**
 * @route   POST /api/agents
 * @desc    Create a new agent
 * @access  Private (Admin only)
 */
router.post('/', validate(schemas.agent), createAgent);

/**
 * @route   GET /api/agents
 * @desc    Get all agents with pagination and filtering
 * @access  Private (Admin only)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   sortBy - Sort field (default: createdAt)
 * @query   sortOrder - Sort order: asc/desc (default: asc)
 * @query   isActive - Filter by active status: true/false
 */
router.get('/', validate(schemas.pagination, 'query'), getAllAgents);

/**
 * @route   GET /api/agents/:id
 * @desc    Get agent by ID
 * @access  Private (Admin only)
 */
router.get('/:id', validate(schemas.objectId, 'params'), getAgentById);

/**
 * @route   PUT /api/agents/:id
 * @desc    Update agent by ID
 * @access  Private (Admin only)
 */
router.put('/:id',
    validate(schemas.objectId, 'params'),
    validate(schemas.agentUpdate),
    updateAgent
);

/**
 * @route   DELETE /api/agents/:id
 * @desc    Delete agent by ID (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', validate(schemas.objectId, 'params'), deleteAgent);

/**
 * @route   GET /api/agents/:id/tasks
 * @desc    Get tasks assigned to a specific agent
 * @access  Private (Admin only)
 * @query   status - Filter by task status: assigned/completed
 */
router.get('/:id/tasks',
    validate(schemas.agentId, 'params'),
    validate(schemas.agentTasksQuery, 'query'),
    getAgentTasks
);

module.exports = router;