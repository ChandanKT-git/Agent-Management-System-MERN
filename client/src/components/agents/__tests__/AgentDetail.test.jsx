import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import AgentDetail from '../AgentDetail'
import { agentService } from '../../../services/agentService'
import { NotificationProvider } from '../../../contexts/NotificationContext'

// Mock the agent service
vi.mock('../../../services/agentService')

// Mock LoadingSpinner
vi.mock('../../common/LoadingSpinner', () => ({
    default: ({ size }) => <div data-testid={`loading-spinner-${size || 'medium'}`}>Loading...</div>
}))

const mockAgent = {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    mobile: { countryCode: '+1', number: '1234567890' },
    isActive: true,
    createdAt: '2023-01-01T00:00:00.000Z'
}

const mockTasks = [
    {
        _id: 'task1',
        firstName: 'Alice',
        phone: '+1-555-0001',
        notes: 'Important client',
        status: 'assigned'
    },
    {
        _id: 'task2',
        firstName: 'Bob',
        phone: '+1-555-0002',
        notes: 'Follow up needed',
        status: 'completed'
    }
]

const renderWithNotification = (component) => {
    return render(
        <NotificationProvider>
            {component}
        </NotificationProvider>
    )
}

describe('AgentDetail', () => {
    const mockProps = {
        agent: mockAgent,
        onClose: vi.fn(),
        onEdit: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders message when no agent is provided', () => {
        renderWithNotification(<AgentDetail {...mockProps} agent={null} />)

        expect(screen.getByText('No agent selected')).toBeInTheDocument()
    })

    it('renders agent information correctly', async () => {
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithNotification(<AgentDetail {...mockProps} />)

        expect(screen.getByText('Agent Details')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('+1 1234567890')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('1/1/2023')).toBeInTheDocument()
    })

    it('shows inactive status for inactive agents', async () => {
        const inactiveAgent = { ...mockAgent, isActive: false }
        agentService.getAgentTasks.mockResolvedValue([])

        renderWithNotification(<AgentDetail {...mockProps} agent={inactiveAgent} />)

        expect(screen.getByText('Inactive')).toBeInTheDocument()
        const statusElement = screen.getByText('Inactive')
        expect(statusElement).toHaveClass('status', 'inactive')
    })

    it('loads and displays agent tasks', async () => {
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithNotification(<AgentDetail {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('Total assigned tasks: 2')).toBeInTheDocument()
        })

        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.getByText('+1-555-0001')).toBeInTheDocument()
        expect(screen.getByText('Important client')).toBeInTheDocument()
        expect(screen.getByText('Assigned')).toBeInTheDocument()

        expect(screen.getByText('Bob')).toBeInTheDocument()
        expect(screen.getByText('+1-555-0002')).toBeInTheDocument()
        expect(screen.getByText('Follow up needed')).toBeInTheDocument()
        expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('shows loading state while fetching tasks', () => {
        agentService.getAgentTasks.mockImplementation(() => new Promise(() => { }))

        renderWithNotification(<AgentDetail {...mockProps} />)

        expect(screen.getByTestId('loading-spinner-small')).toBeInTheDocument()
        expect(screen.getByText('Loading tasks...')).toBeInTheDocument()
    })

    it('shows error state when task loading fails', async () => {
        agentService.getAgentTasks.mockRejectedValue(new Error('Failed to load'))

        renderWithNotification(<AgentDetail {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('Failed to load agent tasks')).toBeInTheDocument()
        })

        expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('retries loading tasks on retry button click', async () => {
        agentService.getAgentTasks
            .mockRejectedValueOnce(new Error('Failed to load'))
            .mockResolvedValueOnce(mockTasks)

        renderWithNotification(<AgentDetail {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('Retry')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Retry'))

        await waitFor(() => {
            expect(screen.getByText('Total assigned tasks: 2')).toBeInTheDocument()
        })

        expect(agentService.getAgentTasks).toHaveBeenCalledTimes(2)
    })

    it('shows empty state when agent has no tasks', async () => {
        agentService.getAgentTasks.mockResolvedValue([])

        renderWithNotification(<AgentDetail {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('No tasks assigned to this agent yet.')).toBeInTheDocument()
        })
    })

    it('handles tasks with missing data gracefully', async () => {
        const tasksWithMissingData = [
            {
                _id: 'task1',
                firstName: null,
                phone: null,
                notes: null,
                status: null
            }
        ]

        agentService.getAgentTasks.mockResolvedValue(tasksWithMissingData)

        renderWithNotification(<AgentDetail {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('Total assigned tasks: 1')).toBeInTheDocument()
        })

        expect(screen.getByText('N/A')).toBeInTheDocument() // firstName
        expect(screen.getByText('No notes')).toBeInTheDocument()
        expect(screen.getByText('Assigned')).toBeInTheDocument() // default status
    })

    it('calls onClose when close button is clicked', () => {
        agentService.getAgentTasks.mockResolvedValue([])

        renderWithNotification(<AgentDetail {...mockProps} />)

        fireEvent.click(screen.getByText('×'))

        expect(mockProps.onClose).toHaveBeenCalled()
    })

    it('calls onEdit when edit button is clicked', async () => {
        agentService.getAgentTasks.mockResolvedValue([])

        renderWithNotification(<AgentDetail {...mockProps} />)

        fireEvent.click(screen.getByText('Edit Agent'))

        expect(mockProps.onEdit).toHaveBeenCalledWith(mockAgent)
    })

    it('reloads tasks when agent changes', async () => {
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        const { rerender } = renderWithNotification(<AgentDetail {...mockProps} />)

        await waitFor(() => {
            expect(agentService.getAgentTasks).toHaveBeenCalledWith('1')
        })

        const newAgent = { ...mockAgent, _id: '2' }

        rerender(
            <NotificationProvider>
                <AgentDetail {...mockProps} agent={newAgent} />
            </NotificationProvider>
        )

        await waitFor(() => {
            expect(agentService.getAgentTasks).toHaveBeenCalledWith('2')
        })

        expect(agentService.getAgentTasks).toHaveBeenCalledTimes(2)
    })

    it('handles agent with missing mobile data', async () => {
        const agentWithoutMobile = {
            ...mockAgent,
            mobile: null
        }

        agentService.getAgentTasks.mockResolvedValue([])

        renderWithNotification(<AgentDetail {...mockProps} agent={agentWithoutMobile} />)

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        // Should handle missing mobile gracefully without crashing
    })

    it('displays task status with correct styling', async () => {
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithNotification(<AgentDetail {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('assigned')).toBeInTheDocument()
            expect(screen.getByText('completed')).toBeInTheDocument()
        })

        const assignedStatus = screen.getByText('assigned')
        const completedStatus = screen.getByText('completed')

        expect(assignedStatus).toHaveClass('task-status', 'assigned')
        expect(completedStatus).toHaveClass('task-status', 'completed')
    })

    it('displays table headers correctly', async () => {
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithNotification(<AgentDetail {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('Name')).toBeInTheDocument()
            expect(screen.getByText('Phone')).toBeInTheDocument()
            expect(screen.getByText('Notes')).toBeInTheDocument()
            expect(screen.getByText('Status')).toBeInTheDocument()
        })
    })
})