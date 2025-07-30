const Agent = require('../models/Agent');
const Task = require('../models/Task');
const Distribution = require('../models/Distribution');

/**
 * Distributes items equally among available agents
 * @param {Array} items - Array of items to distribute (with FirstName, Phone, Notes)
 * @param {String} distributionId - MongoDB ObjectId of the distribution
 * @param {Number} targetAgentCount - Target number of agents (default: 5)
 * @returns {Promise<Object>} - Distribution result with summary
 */
const distributeItems = async (items, distributionId, targetAgentCount = 5) => {
    try {
        // Validate input
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Items array is required and cannot be empty');
        }

        if (!distributionId) {
            throw new Error('Distribution ID is required');
        }

        // Get active agents
        const activeAgents = await Agent.findActiveAgents();

        if (activeAgents.length === 0) {
            throw new Error('No active agents available for distribution');
        }

        // Use available agents (up to target count)
        const agentsToUse = activeAgents.slice(0, targetAgentCount);
        const totalAgents = agentsToUse.length;
        const totalItems = items.length;

        // Calculate distribution
        const itemsPerAgent = Math.floor(totalItems / totalAgents);
        const remainderItems = totalItems % totalAgents;

        // Create distribution summary
        const distributionSummary = {
            totalAgents,
            itemsPerAgent,
            remainderItems,
            agentDistribution: []
        };

        // Distribute items
        let currentIndex = 0;
        const tasksToCreate = [];

        for (let agentIndex = 0; agentIndex < totalAgents; agentIndex++) {
            const agent = agentsToUse[agentIndex];

            // Calculate items for this agent (base + extra if remainder)
            const itemsForThisAgent = itemsPerAgent + (agentIndex < remainderItems ? 1 : 0);

            // Get items for this agent
            const agentItems = items.slice(currentIndex, currentIndex + itemsForThisAgent);

            // Create task objects for this agent
            const agentTasks = agentItems.map(item => ({
                distributionId,
                agentId: agent._id,
                firstName: item.FirstName,
                phone: item.Phone,
                notes: item.Notes || ''
            }));

            tasksToCreate.push(...agentTasks);

            // Add to distribution summary
            distributionSummary.agentDistribution.push({
                agentId: agent._id,
                agentName: agent.name,
                agentEmail: agent.email,
                itemCount: itemsForThisAgent,
                items: agentItems
            });

            currentIndex += itemsForThisAgent;
        }

        // Save all tasks to database
        const createdTasks = await Task.insertMany(tasksToCreate);

        return {
            success: true,
            summary: distributionSummary,
            tasksCreated: createdTasks.length,
            totalItemsDistributed: currentIndex
        };

    } catch (error) {
        throw new Error(`Distribution failed: ${error.message}`);
    }
};

/**
 * Creates a complete distribution from processed file data
 * @param {Array} items - Processed file data
 * @param {Object} distributionDoc - Distribution document from MongoDB
 * @param {Number} targetAgentCount - Target number of agents (default: 5)
 * @returns {Promise<Object>} - Complete distribution result
 */
const createDistribution = async (items, distributionDoc, targetAgentCount = 5) => {
    try {
        // Perform the distribution
        const distributionResult = await distributeItems(items, distributionDoc._id, targetAgentCount);

        // Update distribution document with summary and mark as completed
        const summaryForDB = {
            totalAgents: distributionResult.summary.totalAgents,
            itemsPerAgent: distributionResult.summary.itemsPerAgent,
            remainderItems: distributionResult.summary.remainderItems
        };

        await distributionDoc.markCompleted(summaryForDB);

        return {
            success: true,
            distributionId: distributionDoc._id,
            summary: distributionResult.summary,
            tasksCreated: distributionResult.tasksCreated
        };

    } catch (error) {
        // Mark distribution as failed
        await distributionDoc.markFailed(error.message);
        throw error;
    }
};

/**
 * Gets distribution summary for a specific distribution
 * @param {String} distributionId - MongoDB ObjectId of the distribution
 * @returns {Promise<Object>} - Distribution summary with agent details
 */
const getDistributionSummary = async (distributionId) => {
    try {
        // Get distribution document
        const distribution = await Distribution.findById(distributionId);
        if (!distribution) {
            throw new Error('Distribution not found');
        }

        // Get task summary using the Task model's static method
        const taskSummary = await Task.getDistributionSummary(distributionId);

        return {
            success: true,
            distribution: {
                id: distribution._id,
                filename: distribution.filename,
                originalName: distribution.originalName,
                totalItems: distribution.totalItems,
                status: distribution.status,
                createdAt: distribution.createdAt,
                distributionSummary: distribution.distributionSummary
            },
            agentSummary: taskSummary
        };

    } catch (error) {
        throw new Error(`Failed to get distribution summary: ${error.message}`);
    }
};

/**
 * Validates distribution parameters
 * @param {Array} items - Items to distribute
 * @param {Number} targetAgentCount - Target agent count
 * @returns {Object} - Validation result
 */
const validateDistributionParams = (items, targetAgentCount = 5) => {
    const errors = [];

    if (!items || !Array.isArray(items)) {
        errors.push('Items must be an array');
    } else if (items.length === 0) {
        errors.push('Items array cannot be empty');
    }

    if (!Number.isInteger(targetAgentCount) || targetAgentCount < 1) {
        errors.push('Target agent count must be a positive integer');
    }

    if (targetAgentCount > 10) {
        errors.push('Target agent count cannot exceed 10');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Calculates distribution preview without saving to database
 * @param {Array} items - Items to distribute
 * @param {Number} targetAgentCount - Target number of agents
 * @returns {Promise<Object>} - Distribution preview
 */
const previewDistribution = async (items, targetAgentCount = 5) => {
    try {
        // Validate parameters
        const validation = validateDistributionParams(items, targetAgentCount);
        if (!validation.isValid) {
            throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
        }

        // Get active agents
        const activeAgents = await Agent.findActiveAgents();

        if (activeAgents.length === 0) {
            throw new Error('No active agents available for distribution');
        }

        // Use available agents (up to target count)
        const agentsToUse = activeAgents.slice(0, targetAgentCount);
        const totalAgents = agentsToUse.length;
        const totalItems = items.length;

        // Calculate distribution
        const itemsPerAgent = Math.floor(totalItems / totalAgents);
        const remainderItems = totalItems % totalAgents;

        // Create preview
        const preview = {
            totalItems,
            totalAgents,
            itemsPerAgent,
            remainderItems,
            agents: agentsToUse.map((agent, index) => ({
                agentId: agent._id,
                agentName: agent.name,
                agentEmail: agent.email,
                itemCount: itemsPerAgent + (index < remainderItems ? 1 : 0)
            }))
        };

        return {
            success: true,
            preview
        };

    } catch (error) {
        throw new Error(`Preview generation failed: ${error.message}`);
    }
};

module.exports = {
    distributeItems,
    createDistribution,
    getDistributionSummary,
    validateDistributionParams,
    previewDistribution
};