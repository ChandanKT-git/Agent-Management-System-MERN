import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import AgentTaskList from '../AgentTaskList'
import { agentService } from '../../../services/agentService'
import { NotificationProvider } from '../../../contexts/NotificationContext'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useParams: () => ({ id: 'agent1' })
    }
})

// Mock the agent service
vi.mock('../../../services/agentService', () => ({
    agentService: {
        getAgent: vi.fn(),
        getAgentTasks: vi.fn()
    }
}))

const mockAgent = {
    id: 'agent1',
    name: 'John Doe',
    email: 'john@example.com',
    mobile: {
        countryCode: '+1',
        number: '555-123-4567'
    }
}

const mockTasks = [
    {
        id: 'task1',
        firstName: 'Alice',
        phone: '123-456-7890',
        notes: 'Important client',
        status: 'assigned',
        assignedAt: '2024-01-15T10:00:00Z'
    },
    {
        id: 'task2',
        firstName: 'Bob',
        phone: '098-765-4321',
        notes: 'Follow up needed',
        status: 'completed',
        assignedAt: '2024-01-14T09:00:00Z'
    },
    {
        id: 'task3',
        firstName: 'Charlie',
        phone: '555-123-4567',
        notes: null,
        status: 'assigned',
        assignedAt: '2024-01-16T11:00:00Z'
    }
]

const renderWithProviders = (component) => {
    return render(
        <BrowserRouter>
            <NotificationProvider>
                {component}
            </NotificationProvider>
        </BrowserRouter>
    )
}

describe('AgentTaskList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading state initially', () => {
        agentService.getAgent.mockImplementation(() => new Promise(() => { }))
        agentService.getAgentTasks.mockImplementation(() => new Promise(() => { }))

        renderWithProviders(<AgentTaskList />)

        expect(screen.getByText('Loading agent tasks...')).toBeInTheDocument()
    })

    it('renders agent tasks when data is loaded', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText("John Doe's Tasks")).toBeInTheDocument()
        })

        expect(screen.getByText('john@example.com • +1555-123-4567')).toBeInTheDocument()
        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.getByText('Bob')).toBeInTheDocument()
        expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('displays task statistics correctly', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('Total Tasks')).toBeInTheDocument()
        })

        // Check statistics
        expect(screen.getByText('3')).toBeInTheDocument() // Total tasks
        expect(screen.getByText('1')).toBeInTheDocument() // Completed tasks
        expect(screen.getByText('2')).toBeInTheDocument() // Assigned tasks
    })

    it('filters tasks by search text', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('Search tasks by name, phone, or notes...')
        fireEvent.change(searchInput, { target: { value: 'Alice' } })

        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.queryByText('Bob')).not.toBeInTheDocument()
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
    })

    it('filters tasks by status', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument()
        })

        const statusFilter = screen.getByDisplayValue('All Status')
        fireEvent.change(statusFilter, { target: { value: 'completed' } })

        expect(screen.getByText('Bob')).toBeInTheDocument()
        expect(screen.queryByText('Alice')).not.toBeInTheDocument()
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
    })

    it('sorts tasks by name', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument()
        })

        const nameHeader = screen.getByText(/Name/)
        fireEvent.click(nameHeader)

        // Check that sorting icon is present
        expect(nameHeader).toHaveTextContent('↓') // Should be desc since default is asc
    })

    it('shows empty state when agent has no tasks', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue([])

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('No tasks assigned')).toBeInTheDocument()
        })

        expect(screen.getByText('This agent has no tasks assigned yet.')).toBeInTheDocument()
    })

    it('shows filtered empty state when no tasks match filters', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('Search tasks by name, phone, or notes...')
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

        expect(screen.getByText('No tasks found')).toBeInTheDocument()
        expect(screen.getByText('No tasks match your current filters.')).toBeInTheDocument()
    })

    it('clears filters when clear button is clicked', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('Search tasks by name, phone, or notes...')
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

        const clearButton = screen.getByText('Clear Filters')
        fireEvent.click(clearButton)

        expect(searchInput.value).toBe('')
        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.getByText('Bob')).toBeInTheDocument()
        expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('renders error state when agent is not found', async () => {
        agentService.getAgent.mockResolvedValue(null)
        agentService.getAgentTasks.mockResolvedValue([])

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('Agent not found')).toBeInTheDocument()
        })

        expect(screen.getByText('The requested agent could not be found.')).toBeInTheDocument()
    })

    it('displays task notes correctly', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('Important client')).toBeInTheDocument()
        })

        expect(screen.getByText('Follow up needed')).toBeInTheDocument()
        // Charlie has no notes, should show '-'
        const noteCells = screen.getAllByText('-')
        expect(noteCells.length).toBeGreaterThan(0)
    })

    it('displays status badges correctly', async () => {
        agentService.getAgent.mockResolvedValue(mockAgent)
        agentService.getAgentTasks.mockResolvedValue(mockTasks)

        renderWithProviders(<AgentTaskList />)

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument()
        })

        const assignedBadges = screen.getAllByText('assigned')
        const completedBadges = screen.getAllByText('completed')

        expect(assignedBadges).toHaveLength(2)
        expect(completedBadges).toHaveLength(1)
    })
})