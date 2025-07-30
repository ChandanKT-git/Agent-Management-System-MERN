const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    distributionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distribution',
        required: [true, 'Distribution reference is required']
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: [true, 'Agent reference is required']
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [100, 'First name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        default: ''
    },
    status: {
        type: String,
        enum: {
            values: ['assigned', 'completed'],
            message: 'Status must be either assigned or completed'
        },
        default: 'assigned'
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound index for efficient agent task queries
taskSchema.index({ agentId: 1, status: 1 });

// Compound index for distribution task queries
taskSchema.index({ distributionId: 1, agentId: 1 });

// Index for status-based queries
taskSchema.index({ status: 1 });

// Index for assigned date queries
taskSchema.index({ assignedAt: 1 });

// Compound index for agent's tasks sorted by assignment date
taskSchema.index({ agentId: 1, assignedAt: -1 });

// Static method to find tasks by agent
taskSchema.statics.findByAgent = function (agentId, status = null) {
    const query = { agentId };
    if (status) {
        query.status = status;
    }
    return this.find(query)
        .sort({ assignedAt: -1 })
        .populate('distributionId', 'filename originalName createdAt')
        .populate('agentId', 'name email');
};

// Static method to find tasks by distribution
taskSchema.statics.findByDistribution = function (distributionId) {
    return this.find({ distributionId })
        .sort({ agentId: 1, assignedAt: 1 })
        .populate('agentId', 'name email mobile');
};

// Static method to count tasks by agent and status
taskSchema.statics.countByAgentAndStatus = function (agentId, status = null) {
    const query = { agentId };
    if (status) {
        query.status = status;
    }
    return this.countDocuments(query);
};

// Static method to get task distribution summary
taskSchema.statics.getDistributionSummary = function (distributionId) {
    return this.aggregate([
        { $match: { distributionId: new mongoose.Types.ObjectId(distributionId) } },
        {
            $group: {
                _id: '$agentId',
                taskCount: { $sum: 1 },
                completedCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
            }
        },
        {
            $lookup: {
                from: 'agents',
                localField: '_id',
                foreignField: '_id',
                as: 'agent'
            }
        },
        {
            $unwind: '$agent'
        },
        {
            $project: {
                agentId: '$_id',
                agentName: '$agent.name',
                agentEmail: '$agent.email',
                taskCount: 1,
                completedCount: 1,
                pendingCount: { $subtract: ['$taskCount', '$completedCount'] }
            }
        },
        {
            $sort: { agentName: 1 }
        }
    ]);
};

// Instance method to mark task as completed
taskSchema.methods.markCompleted = function () {
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

// Instance method to mark task as assigned (reset completion)
taskSchema.methods.markAssigned = function () {
    this.status = 'assigned';
    this.completedAt = null;
    return this.save();
};

// Pre-save middleware to set completedAt when status changes to completed
taskSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        } else if (this.status === 'assigned') {
            this.completedAt = null;
        }
    }
    next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;