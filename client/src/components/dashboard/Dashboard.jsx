import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { distributionService } from '../../services/distributionService'
import { agentService } from '../../services/agentService'
import { useNotification } from '../../contexts/NotificationContext'

const Dashboard = () => {
    const [distributions, setDistributions] = useState([])
    const [agents, setAgents] = useState([])
    const [loading, setLoading] = useState(true)
    const { showNotification } = useNotification()

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                const [distributionsData, agentsData] = await Promise.all([
                    distributionService.getAllDistributions(),
                    agentService.getAllAgents()
                ])
                setDistributions(distributionsData)
                setAgents(agentsData)
            } catch (error) {
                showNotification('Failed to load dashboard data', 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [showNotification])

    const totalTasks = distributions.reduce((sum, dist) => sum + (dist.totalItems || 0), 0)
    const totalAssignedTasks = distributions.reduce((sum, dist) => {
        return sum + (dist.agents?.reduce((agentSum, agent) => agentSum + (agent.tasks?.length || 0), 0) || 0)
    }, 0)
    const recentDistributions = distributions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    const activeAgents = agents.filter(agent =>
        distributions.some(dist =>
            dist.agents?.some(distAgent => distAgent.agentId === agent.id)
        )
    )

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">Loading dashboard...</div>
            </div>
        )
    }

    return (
        <div className="dashboard-container">
            <h1>Agent Management Dashboard</h1>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Total Agents</h3>
                    <p className="stat-number">{agents.length}</p>
                    <small>{activeAgents.length} active</small>
                </div>
                <div className="stat-card">
                    <h3>Total Distributions</h3>
                    <p className="stat-number">{distributions.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Tasks</h3>
                    <p className="stat-number">{totalTasks}</p>
                </div>
                <div className="stat-card">
                    <h3>Assigned Tasks</h3>
                    <p className="stat-number">{totalAssignedTasks}</p>
                    <small>{totalTasks - totalAssignedTasks} unassigned</small>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="dashboard-section">
                    <h2>Recent Distributions</h2>
                    {recentDistributions.length > 0 ? (
                        <div className="recent-distributions">
                            {recentDistributions.map(distribution => {
                                const assignedTasks = distribution.agents?.reduce((sum, agent) => sum + (agent.tasks?.length || 0), 0) || 0
                                return (
                                    <div key={distribution.id} className="distribution-card">
                                        <div className="distribution-header">
                                            <h4>{distribution.filename}</h4>
                                            <span className={`status-badge status-${distribution.status || 'completed'}`}>
                                                {distribution.status || 'completed'}
                                            </span>
                                        </div>
                                        <div className="distribution-stats">
                                            <p>Total Items: {distribution.totalItems}</p>
                                            <p>Assigned: {assignedTasks}</p>
                                            <p>Agents: {distribution.agents?.length || 0}</p>
                                        </div>
                                        <p className="distribution-date">
                                            Created: {new Date(distribution.createdAt).toLocaleDateString()}
                                        </p>
                                        <div className="distribution-actions">
                                            <Link to={`/distributions/${distribution.id}`} className="view-link">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No distributions yet. <Link to="/upload">Upload a file</Link> to get started.</p>
                        </div>
                    )}
                </div>

                <div className="dashboard-section">
                    <h2>Agent Overview</h2>
                    {agents.length > 0 ? (
                        <div className="agent-overview">
                            {agents.slice(0, 5).map(agent => {
                                const agentTasks = distributions.reduce((sum, dist) => {
                                    const agentInDist = dist.agents?.find(a => a.agentId === agent.id)
                                    return sum + (agentInDist?.tasks?.length || 0)
                                }, 0)
                                const isActive = agentTasks > 0

                                return (
                                    <div key={agent.id} className={`agent-card ${isActive ? 'active' : ''}`}>
                                        <div className="agent-header">
                                            <h4>{agent.name}</h4>
                                            {isActive && <span className="active-indicator">●</span>}
                                        </div>
                                        <p className="agent-email">{agent.email}</p>
                                        <p className="agent-tasks">
                                            {agentTasks} task{agentTasks !== 1 ? 's' : ''}
                                        </p>
                                        <div className="agent-actions">
                                            <Link to={`/agents/${agent.id}/tasks`} className="view-link">
                                                View Tasks
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No agents registered. <Link to="/agents">Add agents</Link> to start distributing tasks.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-nav">
                <Link to="/agents" className="nav-link">Manage Agents</Link>
                <Link to="/upload" className="nav-link">Upload Files</Link>
                <Link to="/distributions" className="nav-link">View All Distributions</Link>
            </div>
        </div>
    )
}

export default Dashboard