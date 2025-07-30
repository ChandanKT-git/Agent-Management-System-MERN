import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import AgentManagement from '../AgentManagement'
import { agentService } from '../../../services/agentService'
import { NotificationProvider } from '../../../contexts/NotificationContext'

// Mock the agent service
vi.mock('../../../services/agentService')

// Mock child components to isolate testing
vi.mock('../AgentList', () => ({
    default: ({ onEditAgent, onViewAgent, onDeleteAgent }) => (
        <div data-testid="agent-list">
            <button onClick={() => onEditAgent({ _id: '1', name: 'Test Agent' })}>
                Edit Agent
            </button>
            <button onClick={() => onViewAgent({ _id: '1', name: 'Test Agent' })}>
                View Agent
            </button>
            <button onClick={() => onDeleteAgent({ _id: '1', name: 'Test Agent' })}>
                Delete Agent
            </button>
        </div>
    )
}))

vi.mock('../AddAgent', () => ({
    default: ({ onAgentAdded, onCancel }) => (
        <div data-testid="add-agent">
            <button onClick={() => onAgentAdded({ _id: '2', name: 'New Agent' })}>
                Submit Agent
            </button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    )
}))

vi.mock('../EditAgent', () => ({
    default: ({ agent, onAgentUpdated, onCancel }) => (
        <div data-testid="edit-agent">
            <span>Editing: {agent.name}</span>
            <button onClick={() => onAgentUpdated({ ...agent, name: 'Updated Agent' })}>
                Update Agent
            </button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    )
}))

vi.mock('../AgentDetail', () => ({
    default: ({ agent, onClose, onEdit }) => (
        <div data-testid="agent-detail">
            <span>Viewing: {agent.name}</span>
            <button onClick={onClose}>Close</button>
            <button onClick={() => onEdit(agent)}>Edit</button>
        </div>
    )
}))

vi.mock('../DeleteConfirmDialog', () => ({
    default: ({ isOpen, agent, onConfirm, onCancel, loading }) => (
        isOpen ? (
            <div data-testid="delete-dialog">
                <span>Delete: {agent?.name}</span>
                <button onClick={() => onConfirm(agent)} disabled={loading}>
                    {loading ? 'Deleting...' : 'Confirm'}
                </button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        ) : null
    )
}))

const renderWithNotification = (component) => {
    return render(
        <NotificationProvider>
            {component}
        </NotificationProvider>
    )
}

describe('AgentManagement', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders agent list by default', () => {
        renderWithNotification(<AgentManagement />)

        expect(screen.getByText('Agent Management')).toBeInTheDocument()
        expect(screen.getByText('Add New Agent')).toBeInTheDocument()
        expect(screen.getByTestId('agent-list')).toBeInTheDocument()
    })

    it('shows add agent form when add button is clicked', () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('Add New Agent'))

        expect(screen.getByTestId('add-agent')).toBeInTheDocument()
        expect(screen.queryByTestId('agent-list')).not.toBeInTheDocument()
    })

    it('shows edit agent form when edit is triggered', () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('Edit Agent'))

        expect(screen.getByTestId('edit-agent')).toBeInTheDocument()
        expect(screen.getByText('Editing: Test Agent')).toBeInTheDocument()
    })

    it('shows agent detail when view is triggered', () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('View Agent'))

        expect(screen.getByTestId('agent-detail')).toBeInTheDocument()
        expect(screen.getByText('Viewing: Test Agent')).toBeInTheDocument()
    })

    it('shows delete confirmation dialog when delete is triggered', () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('Delete Agent'))

        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()
        expect(screen.getByText('Delete: Test Agent')).toBeInTheDocument()
    })

    it('handles successful agent creation', async () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('Add New Agent'))
        fireEvent.click(screen.getByText('Submit Agent'))

        await waitFor(() => {
            expect(screen.getByTestId('agent-list')).toBeInTheDocument()
        })
    })

    it('handles successful agent update', async () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('Edit Agent'))
        fireEvent.click(screen.getByText('Update Agent'))

        await waitFor(() => {
            expect(screen.getByTestId('agent-detail')).toBeInTheDocument()
        })
    })

    it('handles successful agent deletion', async () => {
        agentService.deleteAgent.mockResolvedValue({})

        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('Delete Agent'))
        fireEvent.click(screen.getByText('Confirm'))

        await waitFor(() => {
            expect(agentService.deleteAgent).toHaveBeenCalledWith('1')
        })
    })

    it('handles agent deletion error', async () => {
        agentService.deleteAgent.mockRejectedValue(new Error('Delete failed'))

        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('Delete Agent'))
        fireEvent.click(screen.getByText('Confirm'))

        await waitFor(() => {
            expect(agentService.deleteAgent).toHaveBeenCalledWith('1')
        })
    })

    it('cancels delete operation', () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('Delete Agent'))
        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Cancel'))
        expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument()
    })

    it('navigates back to list from forms', () => {
        renderWithNotification(<AgentManagement />)

        // Test from add form
        fireEvent.click(screen.getByText('Add New Agent'))
        expect(screen.getByTestId('add-agent')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Cancel'))
        expect(screen.getByTestId('agent-list')).toBeInTheDocument()

        // Test from edit form
        fireEvent.click(screen.getByText('Edit Agent'))
        expect(screen.getByTestId('edit-agent')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Cancel'))
        expect(screen.getByTestId('agent-list')).toBeInTheDocument()
    })

    it('navigates back to list from detail view', () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('View Agent'))
        expect(screen.getByTestId('agent-detail')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Close'))
        expect(screen.getByTestId('agent-list')).toBeInTheDocument()
    })

    it('navigates from detail to edit', () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('View Agent'))
        expect(screen.getByTestId('agent-detail')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Edit'))
        expect(screen.getByTestId('edit-agent')).toBeInTheDocument()
    })

    it('shows breadcrumb navigation', () => {
        renderWithNotification(<AgentManagement />)

        fireEvent.click(screen.getByText('Add New Agent'))

        expect(screen.getByText('Agents')).toBeInTheDocument()

        // Test breadcrumb navigation
        fireEvent.click(screen.getByText('Agents'))
        expect(screen.getByTestId('agent-list')).toBeInTheDocument()
    })
})