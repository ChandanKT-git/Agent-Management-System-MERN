import React, { useState, useEffect } from 'react'
import { agentService } from '../../services/agentService'
import { useNotification } from '../../contexts/NotificationContext'
import LoadingSpinner from '../common/LoadingSpinner'

const AgentList = ({ onEditAgent, onViewAgent, onDeleteAgent }) => {
    const [agents, setAgents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { addNotification } = useNotification()

    useEffect(() => {
        loadAgents()
    }, [])

    const loadAgents = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await agentService.getAllAgents()
            setAgents(data)
        } catch (err) {
            setError('Failed to load agents')
            addNotification('Failed to load agents', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (agent) => {
        if (onDeleteAgent) {
            onDeleteAgent(agent)
        }
    }

    if (loading) {
        return (
            <div className="agent-list-loading">
                <LoadingSpinner />
                <p>Loading agents...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="agent-list-error">
                <p className="error-message">{error}</p>
                <button onClick={loadAgents} className="retry-btn">
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="agent-list">
            <div className="agent-list-header">
                <h3>Agents ({agents.length})</h3>
            </div>

            {agents.length === 0 ? (
                <div className="empty-state">
                    <p>No agents found. Create your first agent to get started.</p>
                </div>
            ) : (
                <div className="agent-grid">
                    {agents.map(agent => (
                        <div key={agent._id} className="agent-card">
                            <div className="agent-info">
                                <h4>{agent.name}</h4>
                                <p className="agent-email">{agent.email}</p>
                                <p className="agent-mobile">
                                    {agent.mobile?.countryCode} {agent.mobile?.number}
                                </p>
                                <p className="agent-status">
                                    Status: {agent.isActive ? 'Active' : 'Inactive'}
                                </p>
                            </div>

                            <div className="agent-actions">
                                <button
                                    onClick={() => onViewAgent && onViewAgent(agent)}
                                    className="btn btn-secondary"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => onEditAgent && onEditAgent(agent)}
                                    className="btn btn-primary"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(agent)}
                                    className="btn btn-danger"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AgentList