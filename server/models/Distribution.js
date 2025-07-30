const mongoose = require('mongoose');

const distributionSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: [true, 'Filename is required'],
        trim: true
    },
    originalName: {
        type: String,
        required: [true, 'Original filename is required'],
        trim: true
    },
    totalItems: {
        type: Number,
        required: [true, 'Total items count is required'],
        min: [0, 'Total items cannot be negative']
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader reference is required']
    },
    status: {
        type: String,
        enum: {
            values: ['processing', 'completed', 'failed'],
            message: 'Status must be either processing, completed, or failed'
        },
        default: 'processing'
    },
    processingError: {
        type: String,
        default: null
    },
    distributionSummary: {
        totalAgents: {
            type: Number,
            min: 0
        },
        itemsPerAgent: {
            type: Number,
            min: 0
        },
        remainderItems: {
            type: Number,
            min: 0,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Index for faster queries by uploader
distributionSchema.index({ uploadedBy: 1 });

// Index for status-based queries
distributionSchema.index({ status: 1 });

// Compound index for user's distributions sorted by date
distributionSchema.index({ uploadedBy: 1, createdAt: -1 });

// Index for filename searches
distributionSchema.index({ filename: 1 });

// Virtual for tasks count (populated from Task model)
distributionSchema.virtual('tasksCount', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'distributionId',
    count: true
});

// Static method to find distributions by user
distributionSchema.statics.findByUser = function (userId) {
    return this.find({ uploadedBy: userId })
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'email');
};

// Static method to find completed distributions
distributionSchema.statics.findCompleted = function () {
    return this.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'email');
};

// Instance method to mark as completed
distributionSchema.methods.markCompleted = function (summary) {
    this.status = 'completed';
    if (summary) {
        this.distributionSummary = summary;
    }
    return this.save();
};

// Instance method to mark as failed
distributionSchema.methods.markFailed = function (error) {
    this.status = 'failed';
    this.processingError = error;
    return this.save();
};

// Pre-save middleware to validate distribution summary
distributionSchema.pre('save', function (next) {
    if (this.status === 'completed' && this.distributionSummary) {
        const { totalAgents, itemsPerAgent, remainderItems } = this.distributionSummary;
        const calculatedTotal = (totalAgents * itemsPerAgent) + (remainderItems || 0);

        if (calculatedTotal !== this.totalItems) {
            return next(new Error('Distribution summary does not match total items'));
        }
    }
    next();
});

const Distribution = mongoose.model('Distribution', distributionSchema);

module.exports = Distribution;