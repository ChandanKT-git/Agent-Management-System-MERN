import React, { useState, useCallback } from 'react'
import AgentList from './AgentList'
import AddAgent from './AddAgent'
import EditAgent from './EditAgent'
import AgentDetail from './AgentDetail'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import { agentService } from '../../services/agentService'
import { useNotification } from '../../contexts/NotificationContext'
import './AgentManagement.css'

const AgentManagement = () => {
    const [currentView, setCurrentView] = useState('list') // 'list', 'add', 'edit', 'detail'
    const [selectedAgent, setSelectedAgent] = useState(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [agentToDelete, setAgentToDelete] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const { addNotification } = useNotification()

    // Force refresh of agent list
    const refreshAgentList = useCallback(() => {
        setRefreshTrigger(prev => prev + 1)
    }, [])

    // Handle adding a new agent
    const handleAddAgent = () => {
        setCurrentView('add')
        setSelectedAgent(null)
    }

    // Handle editing an agent
    const handleEditAgent = (agent) => {
        setSelectedAgent(agent)
        setCurrentView('edit')
    }

    // Handle viewing agent details
    const handleViewAgent = (agent) => {
        setSelectedAgent(agent)
        setCurrentView('detail')
    }

    // Handle delete confirmation
    const handleDeleteAgent = (agent) => {
        setAgentToDelete(agent)
        setShowDeleteDialog(true)
    }

    // Confirm delete action
    const confirmDelete = async (agent) => {
        setDeleteLoading(true)
        try {
            await agentService.deleteAgent(agent._id)
            addNotification('Agent deleted successfully', 'success')
            setShowDeleteDialog(false)
            setAgentToDelete(null)
            refreshAgentList()

            // If we're viewing the deleted agent, go back to list
            if (selectedAgent && selectedAgent._id === agent._id) {
                setCurrentView('list')
                setSelectedAgent(null)
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error?.message || 'Failed to delete agent'
            addNotification(errorMessage, 'error')
        } finally {
            setDeleteLoading(false)
        }
    }

    // Cancel delete action
    const cancelDelete = () => {
        setShowDeleteDialog(false)
        setAgentToDelete(null)
    }

    // Handle successful agent creation
    const handleAgentAdded = (newAgent) => {
        refreshAgentList()
        setCurrentView('list')
        addNotification(`Agent ${newAgent.name} created successfully`, 'success')
    }

    // Handle successful agent update
    const handleAgentUpdated = (updatedAgent) => {
        setSelectedAgent(updatedAgent)
        refreshAgentList()
        setCurrentView('detail')
        addNotification(`Agent ${updatedAgent.name} updated successfully`, 'success')
    }

    // Handle cancel actions
    const handleCancel = () => {
        setCurrentView('list')
        setSelectedAgent(null)
    }

    // Handle close detail view
    const handleCloseDetail = () => {
        setCurrentView('list')
        setSelectedAgent(null)
    }

    return (
        <div className="agent-management-container">
            <div className="agent-management-header">
                <h2>Agent Management</h2>

                {currentView === 'list' && (
                    <div className="header-actions">
                        <button
                            onClick={handleAddAgent}
                            className="btn btn-primary"
                        >
                            Add New Agent
                        </button>
                    </div>
                )}

                {currentView !== 'list' && (
                    <div className="breadcrumb">
                        <button
                            onClick={() => setCurrentView('list')}
                            className="breadcrumb-link"
                        >
                            Agents
                        </button>
                        <span className="breadcrumb-separator">›</span>
                        <span className="breadcrumb-current">
                            {currentView === 'add' && 'Add Agent'}
                            {currentView === 'edit' && 'Edit Agent'}
                            {currentView === 'detail' && 'Agent Details'}
                        </span>
                    </div>
                )}
            </div>

            <div className="agent-management-content">
                {currentView === 'list' && (
                    <AgentList
                        key={refreshTrigger}
                        onEditAgent={handleEditAgent}
                        onViewAgent={handleViewAgent}
                        onDeleteAgent={handleDeleteAgent}
                    />
                )}

                {currentView === 'add' && (
                    <AddAgent
                        onAgentAdded={handleAgentAdded}
                        onCancel={handleCancel}
                    />
                )}

                {currentView === 'edit' && selectedAgent && (
                    <EditAgent
                        agent={selectedAgent}
                        onAgentUpdated={handleAgentUpdated}
                        onCancel={handleCancel}
                    />
                )}

                {currentView === 'detail' && selectedAgent && (
                    <AgentDetail
                        agent={selectedAgent}
                        onClose={handleCloseDetail}
                        onEdit={handleEditAgent}
                    />
                )}
            </div>

            <DeleteConfirmDialog
                isOpen={showDeleteDialog}
                agent={agentToDelete}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                loading={deleteLoading}
            />
        </div>
    )
}

export default AgentManagement