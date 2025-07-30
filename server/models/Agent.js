const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Agent name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email address'
        ]
    },
    mobile: {
        countryCode: {
            type: String,
            required: [true, 'Country code is required'],
            match: [/^\+\d{1,4}$/, 'Country code must start with + and contain 1-4 digits']
        },
        number: {
            type: String,
            required: [true, 'Mobile number is required'],
            match: [/^\d{6,15}$/, 'Mobile number must contain 6-15 digits']
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            return ret;
        }
    }
});

// Compound index for faster email lookups
agentSchema.index({ email: 1 });

// Index for active agents (used in distribution)
agentSchema.index({ isActive: 1 });

// Compound index for mobile number uniqueness
agentSchema.index({ 'mobile.countryCode': 1, 'mobile.number': 1 }, { unique: true });

// Virtual for full mobile number
agentSchema.virtual('fullMobile').get(function () {
    return `${this.mobile.countryCode}${this.mobile.number}`;
});

// Hash password before saving
agentSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
agentSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Static method to find active agents
agentSchema.statics.findActiveAgents = function () {
    return this.find({ isActive: true }).sort({ createdAt: 1 });
};

// Static method to find agent by email
agentSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to count active agents
agentSchema.statics.countActiveAgents = function () {
    return this.countDocuments({ isActive: true });
};

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;