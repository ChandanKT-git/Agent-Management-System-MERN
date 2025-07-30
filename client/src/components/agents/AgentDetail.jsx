import React, { useState, useEffect } from 'react'
import { agentService } from '../../services/agentService'
import { useNotification } from '../../contexts/NotificationContext'
import LoadingSpinner from '../common/LoadingSpinner'

const AgentDetail = ({ agent, onClose, onEdit }) => {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { addNotification } = useNotification()

    useEffect(() => {
        if (agent?._id) {
            loadAgentTasks()
        }
    }, [agent])

    const loadAgentTasks = async () => {
        try {
            setLoading(true)
            setError(null)
            const tasksData = await agentService.getAgentTasks(agent._id)
            setTasks(tasksData)
        } catch (err) {
            setError('Failed to load agent tasks')
            addNotification('Failed to load agent tasks', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!agent) {
        return <div>No agent selected</div>
    }

    return (
        <div className="agent-detail">
            <div className="agent-detail-header">
                <h3>Agent Details</h3>
                <button onClick={onClose} className="close-btn">×</button>
            </div>

            <div className="agent-info-section">
                <div className="agent-basic-info">
                    <h4>{agent.name}</h4>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Email:</label>
                            <span>{agent.email}</span>
                        </div>
                        <div className="info-item">
                            <label>Phone:</label>
                            <span>
                                {agent.mobile?.countryCode} {agent.mobile?.number}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Status:</label>
                            <span className={`status ${agent.isActive ? 'active' : 'inactive'}`}>
                                {agent.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Created:</label>
                            <span>
                                {new Date(agent.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="agent-actions">
                    <button
                        onClick={() => onEdit && onEdit(agent)}
                        className="btn btn-primary"
                    >
                        Edit Agent
                    </button>
                </div>
            </div>

            <div className="agent-tasks-section">
                <h4>Assigned Tasks</h4>

                {loading ? (
                    <div className="tasks-loading">
                        <LoadingSpinner size="small" />
                        <p>Loading tasks...</p>
                    </div>
                ) : error ? (
                    <div className="tasks-error">
                        <p className="error-message">{error}</p>
                        <button onClick={loadAgentTasks} className="retry-btn">
                            Retry
                        </button>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="empty-tasks">
                        <p>No tasks assigned to this agent yet.</p>
                    </div>
                ) : (
                    <div className="tasks-list">
                        <div className="tasks-summary">
                            <p>Total assigned tasks: <strong>{tasks.length}</strong></p>
                        </div>

                        <div className="tasks-table">
                            <div className="table-header">
                                <div className="col-name">Name</div>
                                <div className="col-phone">Phone</div>
                                <div className="col-notes">Notes</div>
                                <div className="col-status">Status</div>
                            </div>

                            <div className="table-body">
                                {tasks.map((task, index) => (
                                    <div key={task._id || index} className="table-row">
                                        <div className="col-name">
                                            {task.firstName || 'N/A'}
                                        </div>
                                        <div className="col-phone">
                                            {task.phone || 'N/A'}
                                        </div>
                                        <div className="col-notes">
                                            {task.notes || 'No notes'}
                                        </div>
                                        <div className="col-status">
                                            <span className={`task-status ${task.status || 'assigned'}`}>
                                                {task.status || 'Assigned'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AgentDetail