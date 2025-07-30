const { processFile } = require('../utils/fileProcessor');
const { createDistribution } = require('../utils/distributionAlgorithm');
const Distribution = require('../models/Distribution');
const Agent = require('../models/Agent');
const Task = require('../models/Task');

/**
 * Handle file upload and processing with distribution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILE',
                    message: 'No file was uploaded'
                }
            });
        }

        // Process the uploaded file
        const result = await processFile(req.file);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Create distribution document
        const distributionDoc = new Distribution({
            filename: req.file.originalname,
            originalName: req.file.originalname,
            totalItems: result.totalRows,
            uploadedBy: req.user._id,
            status: 'processing'
        });

        await distributionDoc.save();

        // Create distribution and assign tasks
        const distributionResult = await createDistribution(result.data, distributionDoc);

        // Return successful distribution result
        res.status(200).json({
            success: true,
            data: {
                distributionId: distributionResult.distributionId,
                filename: req.file.originalname,
                totalItems: result.totalRows,
                summary: {
                    totalAgents: distributionResult.summary.totalAgents,
                    itemsPerAgent: distributionResult.summary.itemsPerAgent,
                    remainderItems: distributionResult.summary.remainderItems,
                    tasksCreated: distributionResult.tasksCreated,
                    agentDistribution: distributionResult.summary.agentDistribution.map(agent => ({
                        agentId: agent.agentId,
                        agentName: agent.agentName,
                        agentEmail: agent.agentEmail,
                        itemCount: agent.itemCount
                    }))
                }
            }
        });
    } catch (error) {
        console.error('Upload processing error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred while processing the file',
                details: error.message
            }
        });
    }
};

/**
 * Validate file without processing (for preview)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const validateFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_FILE',
                    message: 'No file was uploaded'
                }
            });
        }

        // Process file to validate structure
        const result = await processFile(req.file);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Return validation result with preview data (first 5 rows)
        const previewData = result.data.slice(0, 5);

        res.status(200).json({
            success: true,
            data: {
                filename: req.file.originalname,
                totalRows: result.totalRows,
                preview: previewData,
                columns: previewData.length > 0 ? Object.keys(previewData[0]) : [],
                fileInfo: {
                    size: req.file.size,
                    type: req.file.mimetype,
                    lastModified: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('File validation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred while validating the file'
            }
        });
    }
};

/**
 * Get all distributions for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDistributions = async (req, res) => {
    try {
        const distributions = await Distribution.findByUser(req.user._id);

        res.status(200).json({
            success: true,
            data: distributions.map(dist => ({
                id: dist._id,
                filename: dist.filename,
                originalName: dist.originalName,
                totalItems: dist.totalItems,
                status: dist.status,
                createdAt: dist.createdAt,
                uploadedBy: dist.uploadedBy,
                distributionSummary: dist.distributionSummary
            }))
        });
    } catch (error) {
        console.error('Get distributions error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred while fetching distributions'
            }
        });
    }
};

/**
 * Get distribution details with agent assignments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDistributionDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Get distribution document
        const distribution = await Distribution.findById(id).populate('uploadedBy', 'email');

        if (!distribution) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Distribution not found'
                }
            });
        }

        // Check if user owns this distribution
        if (distribution.uploadedBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied to this distribution'
                }
            });
        }

        // Get tasks grouped by agent
        const tasks = await Task.findByDistribution(id);

        // Group tasks by agent
        const agentTasks = {};
        tasks.forEach(task => {
            // Skip tasks with null agentId (shouldn't happen but defensive programming)
            if (!task.agentId) {
                console.warn('Task found with null agentId:', task._id);
                return;
            }

            const agentId = task.agentId._id.toString();
            if (!agentTasks[agentId]) {
                agentTasks[agentId] = {
                    agent: {
                        id: task.agentId._id,
                        name: task.agentId.name,
                        email: task.agentId.email,
                        mobile: task.agentId.mobile
                    },
                    tasks: []
                };
            }
            agentTasks[agentId].tasks.push({
                id: task._id,
                firstName: task.firstName,
                phone: task.phone,
                notes: task.notes,
                status: task.status,
                assignedAt: task.assignedAt,
                completedAt: task.completedAt
            });
        });

        res.status(200).json({
            success: true,
            data: {
                distribution: {
                    id: distribution._id,
                    filename: distribution.filename,
                    originalName: distribution.originalName,
                    totalItems: distribution.totalItems,
                    status: distribution.status,
                    createdAt: distribution.createdAt,
                    uploadedBy: distribution.uploadedBy,
                    distributionSummary: distribution.distributionSummary
                },
                agents: Object.values(agentTasks)
            }
        });
    } catch (error) {
        console.error('Get distribution details error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred while fetching distribution details'
            }
        });
    }
};

/**
 * Get tasks assigned to a specific agent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAgentTasks = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        // Check if agent exists
        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Agent not found'
                }
            });
        }

        // Get tasks for the agent
        const tasks = await Task.findByAgent(id, status);

        res.status(200).json({
            success: true,
            data: {
                agent: {
                    id: agent._id,
                    name: agent.name,
                    email: agent.email,
                    mobile: agent.mobile
                },
                tasks: tasks.map(task => ({
                    id: task._id,
                    firstName: task.firstName,
                    phone: task.phone,
                    notes: task.notes,
                    status: task.status,
                    assignedAt: task.assignedAt,
                    completedAt: task.completedAt,
                    distribution: task.distributionId ? {
                        id: task.distributionId._id,
                        filename: task.distributionId.filename,
                        originalName: task.distributionId.originalName,
                        createdAt: task.distributionId.createdAt
                    } : null
                })),
                summary: {
                    totalTasks: tasks.length,
                    completedTasks: tasks.filter(task => task.status === 'completed').length,
                    pendingTasks: tasks.filter(task => task.status === 'assigned').length
                }
            }
        });
    } catch (error) {
        console.error('Get agent tasks error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred while fetching agent tasks'
            }
        });
    }
};

module.exports = {
    uploadFile,
    validateFile,
    getDistributions,
    getDistributionDetails,
    getAgentTasks
};