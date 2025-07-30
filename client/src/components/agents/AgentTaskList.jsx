import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { agentService } from '../../services/agentService'
import { useNotification } from '../../contexts/NotificationContext'

const AgentTaskList = () => {
    const { id } = useParams()
    const [agent, setAgent] = useState(null)
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState('firstName')
    const [sortOrder, setSortOrder] = useState('asc')
    const [filterText, setFilterText] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const { showNotification } = useNotification()

    useEffect(() => {
        const fetchAgentTasks = async () => {
            try {
                setLoading(true)
                const [agentData, tasksData] = await Promise.all([
                    agentService.getAgent(id),
                    agentService.getAgentTasks(id)
                ])
                setAgent(agentData)
                setTasks(tasksData)
            } catch (error) {
                showNotification('Failed to load agent tasks', 'error')
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchAgentTasks()
        }
    }, [id, showNotification])

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
    }

    const filteredAndSortedTasks = tasks
        .filter(task => {
            const matchesText =
                task.firstName.toLowerCase().includes(filterText.toLowerCase()) ||
                task.phone.includes(filterText) ||
                (task.notes && task.notes.toLowerCase().includes(filterText.toLowerCase()))

            const matchesStatus = statusFilter === 'all' || task.status === statusFilter

            return matchesText && matchesStatus
        })
        .sort((a, b) => {
            let aValue = a[sortBy]
            let bValue = b[sortBy]

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase()
                bValue = bValue.toLowerCase()
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })

    const getSortIcon = (field) => {
        if (sortBy !== field) return '↕️'
        return sortOrder === 'asc' ? '↑' : '↓'
    }

    if (loading) {
        return (
            <div className="agent-task-list-container">
                <div className="loading-spinner">Loading agent tasks...</div>
            </div>
        )
    }

    if (!agent) {
        return (
            <div className="agent-task-list-container">
                <div className="error-state">
                    <h2>Agent not found</h2>
                    <p>The requested agent could not be found.</p>
                    <Link to="/agents" className="btn btn-primary">
                        Back to Agents
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="agent-task-list-container">
            <div className="agent-task-header">
                <div className="header-content">
                    <div className="agent-info">
                        <h1>{agent.name}'s Tasks</h1>
                        <p className="agent-details">
                            {agent.email} • {agent.mobile?.countryCode}{agent.mobile?.number}
                        </p>
                    </div>
                    <Link to="/agents" className="btn btn-outline">
                        ← Back to Agents
                    </Link>
                </div>
            </div>

            <div className="task-stats">
                <div className="stat-card">
                    <h3>Total Tasks</h3>
                    <p className="stat-number">{tasks.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Completed</h3>
                    <p className="stat-number">
                        {tasks.filter(task => task.status === 'completed').length}
                    </p>
                </div>
                <div className="stat-card">
                    <h3>Assigned</h3>
                    <p className="stat-number">
                        {tasks.filter(task => task.status === 'assigned').length}
                    </p>
                </div>
            </div>

            <div className="task-controls">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search tasks by name, phone, or notes..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-container">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="assigned">Assigned</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {filteredAndSortedTasks.length > 0 ? (
                <div className="task-table-container">
                    <table className="task-table">
                        <thead>
                            <tr>
                                <th
                                    onClick={() => handleSort('firstName')}
                                    className="sortable-header"
                                >
                                    Name {getSortIcon('firstName')}
                                </th>
                                <th
                                    onClick={() => handleSort('phone')}
                                    className="sortable-header"
                                >
                                    Phone {getSortIcon('phone')}
                                </th>
                                <th
                                    onClick={() => handleSort('notes')}
                                    className="sortable-header"
                                >
                                    Notes {getSortIcon('notes')}
                                </th>
                                <th
                                    onClick={() => handleSort('status')}
                                    className="sortable-header"
                                >
                                    Status {getSortIcon('status')}
                                </th>
                                <th
                                    onClick={() => handleSort('assignedAt')}
                                    className="sortable-header"
                                >
                                    Assigned At {getSortIcon('assignedAt')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedTasks.map(task => (
                                <tr key={task.id || `${task.firstName}-${task.phone}`}>
                                    <td>
                                        <strong>{task.firstName}</strong>
                                    </td>
                                    <td>{task.phone}</td>
                                    <td>
                                        <div className="notes-cell">
                                            {task.notes || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${task.status || 'assigned'}`}>
                                            {task.status || 'assigned'}
                                        </span>
                                    </td>
                                    <td>
                                        {task.assignedAt
                                            ? new Date(task.assignedAt).toLocaleString()
                                            : '-'
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    {filterText || statusFilter !== 'all' ? (
                        <div>
                            <h3>No tasks found</h3>
                            <p>No tasks match your current filters.</p>
                            <button
                                onClick={() => {
                                    setFilterText('')
                                    setStatusFilter('all')
                                }}
                                className="btn btn-outline"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h3>No tasks assigned</h3>
                            <p>This agent has no tasks assigned yet.</p>
                            <Link to="/upload" className="btn btn-primary">
                                Upload File to Distribute Tasks
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AgentTaskList