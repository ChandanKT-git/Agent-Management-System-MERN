import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { distributionService } from '../../services/distributionService'
import { useNotification } from '../../contexts/NotificationContext'

const DistributionDetail = () => {
    const { id } = useParams()
    const [distribution, setDistribution] = useState(null)
    const [loading, setLoading] = useState(true)
    const { showNotification } = useNotification()

    useEffect(() => {
        const fetchDistribution = async () => {
            try {
                setLoading(true)
                const data = await distributionService.getDistribution(id)
                setDistribution(data)
            } catch (error) {
                showNotification('Failed to load distribution details', 'error')
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchDistribution()
        }
    }, [id, showNotification])

    if (loading) {
        return (
            <div className="distribution-detail-container">
                <div className="loading-spinner">Loading distribution details...</div>
            </div>
        )
    }

    if (!distribution) {
        return (
            <div className="distribution-detail-container">
                <div className="error-state">
                    <h2>Distribution not found</h2>
                    <p>The requested distribution could not be found.</p>
                    <Link to="/distributions" className="btn btn-primary">
                        Back to Distributions
                    </Link>
                </div>
            </div>
        )
    }

    const totalAssignedTasks = distribution.agents?.reduce((sum, agent) => sum + (agent.tasks?.length || 0), 0) || 0

    return (
        <div className="distribution-detail-container">
            <div className="distribution-header">
                <div className="header-content">
                    <h1>Distribution Details</h1>
                    <Link to="/distributions" className="btn btn-outline">
                        ← Back to Distributions
                    </Link>
                </div>
            </div>

            <div className="distribution-info">
                <div className="info-card">
                    <h2>File Information</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Filename:</label>
                            <span>{distribution.filename}</span>
                        </div>
                        {distribution.originalName && (
                            <div className="info-item">
                                <label>Original Name:</label>
                                <span>{distribution.originalName}</span>
                            </div>
                        )}
                        <div className="info-item">
                            <label>Total Items:</label>
                            <span>{distribution.totalItems}</span>
                        </div>
                        <div className="info-item">
                            <label>Status:</label>
                            <span className={`status-badge status-${distribution.status || 'completed'}`}>
                                {distribution.status || 'completed'}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Created:</label>
                            <span>{new Date(distribution.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="info-item">
                            <label>Assigned Tasks:</label>
                            <span>{totalAssignedTasks}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="agent-assignments">
                <h2>Agent Assignments</h2>
                {distribution.agents && distribution.agents.length > 0 ? (
                    <div className="agent-assignments-grid">
                        {distribution.agents.map(agent => (
                            <div key={agent.agentId} className="agent-assignment-card">
                                <div className="agent-header">
                                    <h3>{agent.name || `Agent ${agent.agentId}`}</h3>
                                    <span className="task-count">
                                        {agent.tasks?.length || 0} tasks
                                    </span>
                                </div>

                                {agent.email && (
                                    <p className="agent-email">{agent.email}</p>
                                )}

                                {agent.tasks && agent.tasks.length > 0 ? (
                                    <div className="task-preview">
                                        <h4>Tasks Preview:</h4>
                                        <div className="task-list-preview">
                                            {agent.tasks.slice(0, 3).map((task, index) => (
                                                <div key={index} className="task-item-preview">
                                                    <span className="task-name">{task.firstName}</span>
                                                    <span className="task-phone">{task.phone}</span>
                                                </div>
                                            ))}
                                            {agent.tasks.length > 3 && (
                                                <div className="task-item-preview more-tasks">
                                                    +{agent.tasks.length - 3} more tasks
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-tasks">
                                        <p>No tasks assigned to this agent</p>
                                    </div>
                                )}

                                <div className="agent-actions">
                                    <Link
                                        to={`/agents/${agent.agentId}/tasks`}
                                        className="btn btn-sm btn-primary"
                                    >
                                        View All Tasks
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <h3>No agent assignments</h3>
                        <p>This distribution has not been assigned to any agents yet.</p>
                    </div>
                )}
            </div>

            <div className="distribution-actions">
                <Link to="/upload" className="btn btn-primary">
                    Upload Another File
                </Link>
                <Link to="/agents" className="btn btn-outline">
                    Manage Agents
                </Link>
            </div>
        </div>
    )
}

export default DistributionDetail