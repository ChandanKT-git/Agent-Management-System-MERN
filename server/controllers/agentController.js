const Agent = require('../models/Agent');
const Joi = require('joi');

// Validation schemas
const createAgentSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Agent name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address'
        }),
    mobile: Joi.object({
        countryCode: Joi.string()
            .pattern(/^\+\d{1,4}$/)
            .required()
            .messages({
                'string.empty': 'Country code is required',
                'string.pattern.base': 'Country code must start with + and contain 1-4 digits'
            }),
        number: Joi.string()
            .pattern(/^\d{6,15}$/)
            .required()
            .messages({
                'string.empty': 'Mobile number is required',
                'string.pattern.base': 'Mobile number must contain 6-15 digits'
            })
    }).required(),
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters long'
        })
});

const updateAgentSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .messages({
            'string.email': 'Please provide a valid email address'
        }),
    mobile: Joi.object({
        countryCode: Joi.string()
            .pattern(/^\+\d{1,4}$/)
            .messages({
                'string.pattern.base': 'Country code must start with + and contain 1-4 digits'
            }),
        number: Joi.string()
            .pattern(/^\d{6,15}$/)
            .messages({
                'string.pattern.base': 'Mobile number must contain 6-15 digits'
            })
    }),
    password: Joi.string()
        .min(6)
        .messages({
            'string.min': 'Password must be at least 6 characters long'
        }),
    isActive: Joi.boolean()
});

/**
 * Create a new agent
 * POST /api/agents
 */
const createAgent = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = createAgentSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: error.details.reduce((acc, detail) => {
                        acc[detail.path.join('.')] = detail.message;
                        return acc;
                    }, {})
                }
            });
        }

        // Check if agent with email already exists
        const existingAgent = await Agent.findByEmail(value.email);
        if (existingAgent) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ERROR',
                    message: 'Agent with this email already exists'
                }
            });
        }

        // Check if mobile number already exists
        const existingMobile = await Agent.findOne({
            'mobile.countryCode': value.mobile.countryCode,
            'mobile.number': value.mobile.number
        });

        if (existingMobile) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ERROR',
                    message: 'Agent with this mobile number already exists'
                }
            });
        }

        // Create new agent
        const agent = new Agent(value);
        await agent.save();

        res.status(201).json({
            success: true,
            data: {
                id: agent._id,
                name: agent.name,
                email: agent.email,
                mobile: agent.mobile,
                isActive: agent.isActive,
                createdAt: agent.createdAt,
                updatedAt: agent.updatedAt
            },
            message: 'Agent created successfully'
        });

    } catch (error) {
        console.error('Create agent error:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ERROR',
                    message: `Agent with this ${field} already exists`
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to create agent'
            }
        });
    }
};

/**
 * Get all agents
 * GET /api/agents
 */
const getAllAgents = async (req, res) => {
    try {
        // Parse query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        const isActive = req.query.isActive;

        // Build filter object
        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder;

        // Get agents with pagination
        const agents = await Agent.find(filter)
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const totalAgents = await Agent.countDocuments(filter);
        const totalPages = Math.ceil(totalAgents / limit);

        res.status(200).json({
            success: true,
            data: agents,
            pagination: {
                currentPage: page,
                totalPages,
                totalAgents,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('Get all agents error:', error);

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve agents'
            }
        });
    }
};

/**
 * Get agent by ID
 * GET /api/agents/:id
 */
const getAgentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid agent ID format'
                }
            });
        }

        const agent = await Agent.findById(id).select('-password');

        if (!agent) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Agent not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: agent
        });

    } catch (error) {
        console.error('Get agent by ID error:', error);

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve agent'
            }
        });
    }
};

/**
 * Update agent by ID
 * PUT /api/agents/:id
 */
const updateAgent = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid agent ID format'
                }
            });
        }

        // Validate request body
        const { error, value } = updateAgentSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: error.details.reduce((acc, detail) => {
                        acc[detail.path.join('.')] = detail.message;
                        return acc;
                    }, {})
                }
            });
        }

        // Check if agent exists
        const existingAgent = await Agent.findById(id);
        if (!existingAgent) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Agent not found'
                }
            });
        }

        // Check for email uniqueness if email is being updated
        if (value.email && value.email !== existingAgent.email) {
            const emailExists = await Agent.findByEmail(value.email);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'DUPLICATE_ERROR',
                        message: 'Agent with this email already exists'
                    }
                });
            }
        }

        // Check for mobile uniqueness if mobile is being updated
        if (value.mobile) {
            const currentMobile = existingAgent.mobile;
            const newMobile = value.mobile;

            if (newMobile.countryCode !== currentMobile.countryCode ||
                newMobile.number !== currentMobile.number) {

                const mobileExists = await Agent.findOne({
                    'mobile.countryCode': newMobile.countryCode,
                    'mobile.number': newMobile.number,
                    _id: { $ne: id }
                });

                if (mobileExists) {
                    return res.status(409).json({
                        success: false,
                        error: {
                            code: 'DUPLICATE_ERROR',
                            message: 'Agent with this mobile number already exists'
                        }
                    });
                }
            }
        }

        // Update agent
        const updatedAgent = await Agent.findByIdAndUpdate(
            id,
            value,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            data: updatedAgent,
            message: 'Agent updated successfully'
        });

    } catch (error) {
        console.error('Update agent error:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ERROR',
                    message: `Agent with this ${field} already exists`
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to update agent'
            }
        });
    }
};

/**
 * Delete agent by ID
 * DELETE /api/agents/:id
 */
const deleteAgent = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid agent ID format'
                }
            });
        }

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

        // Soft delete by setting isActive to false instead of hard delete
        // This preserves data integrity for existing task assignments
        await Agent.findByIdAndUpdate(id, { isActive: false });

        res.status(200).json({
            success: true,
            message: 'Agent deleted successfully'
        });

    } catch (error) {
        console.error('Delete agent error:', error);

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to delete agent'
            }
        });
    }
};

module.exports = {
    createAgent,
    getAllAgents,
    getAgentById,
    updateAgent,
    deleteAgent
};