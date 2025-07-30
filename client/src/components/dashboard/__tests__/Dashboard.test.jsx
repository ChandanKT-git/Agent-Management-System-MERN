import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Dashboard from '../Dashboard'
import { distributionService } from '../../../services/distributionService'
import { agentService } from '../../../services/agentService'
import { NotificationProvider } from '../../../contexts/NotificationContext'

// Mock the services
vi.mock('../../../services/distributionService', () => ({
    distributionService: {
        getAllDistributions: vi.fn()
    }
}))

vi.mock('../../../services/agentService', () => ({
    agentService: {
        getAllAgents: vi.fn()
    }
}))

const mockDistributions = [
    {
        id: '1',
        filename: 'test-file-1.csv',
        totalItems: 100,
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        agents: [
            {
                agentId: 'agent1',
                tasks: [
                    { firstName: 'Alice', phone: '123-456-7890' },
                    { firstName: 'Bob', phone: '098-765-4321' }
                ]
            }
        ]
    },
    {
        id: '2',
        filename: 'test-file-2.csv',
        totalItems: 50,
        status: 'processing',
        createdAt: '2024-01-16T11:00:00Z',
        agents: [
            {
                agentId: 'agent2',
                tasks: [
                    { firstName: 'Charlie', phone: '555-123-4567' }
                ]
            }
        ]
    }
]

const mockAgents = [
    {
        id: 'agent1',
        name: 'John Doe',
        email: 'john@example.com'
    },
    {
        id: 'agent2',
        name: 'Jane Smith',
        email: 'jane@example.com'
    },
    {
        id: 'agent3',
        name: 'Bob Wilson',
        email: 'bob@example.com'
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

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading state initially', () => {
        distributionService.getAllDistributions.mockImplementation(() => new Promise(() => { }))
        agentService.getAllAgents.mockImplementation(() => new Promise(() => { }))

        renderWithProviders(<Dashboard />)

        expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
    })

    it('renders dashboard with statistics when data is loaded', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('Agent Management Dashboard')).toBeInTheDocument()
        })

        // Check statistics
        expect(screen.getAllByText('3')).toHaveLength(2) // Total agents and assigned tasks
        expect(screen.getByText('2')).toBeInTheDocument() // Total distributions
        expect(screen.getByText('150')).toBeInTheDocument() // Total tasks (100 + 50)
    })

    it('shows active agents count', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('2 active')).toBeInTheDocument()
        })
    })

    it('shows unassigned tasks count', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('147 unassigned')).toBeInTheDocument() // 150 - 3
        })
    })

    it('renders recent distributions with enhanced information', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('Recent Distributions')).toBeInTheDocument()
        })

        expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        expect(screen.getByText('test-file-2.csv')).toBeInTheDocument()

        // Check enhanced distribution information
        expect(screen.getByText('Total Items: 100')).toBeInTheDocument()
        expect(screen.getByText('Total Items: 50')).toBeInTheDocument()
        expect(screen.getByText('Assigned: 2')).toBeInTheDocument()
        expect(screen.getByText('Assigned: 1')).toBeInTheDocument()
        expect(screen.getAllByText('Agents: 1')).toHaveLength(2)
    })

    it('renders agent overview with task counts', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('Agent Overview')).toBeInTheDocument()
        })

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument()

        // Check task counts
        expect(screen.getByText('2 tasks')).toBeInTheDocument() // John Doe
        expect(screen.getByText('1 task')).toBeInTheDocument() // Jane Smith
        expect(screen.getByText('0 tasks')).toBeInTheDocument() // Bob Wilson
    })

    it('shows active indicators for agents with tasks', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        // Check for active indicators (●)
        const activeIndicators = screen.getAllByText('●')
        expect(activeIndicators).toHaveLength(2) // John and Jane have tasks
    })

    it('renders empty state for distributions when none exist', async () => {
        distributionService.getAllDistributions.mockResolvedValue([])
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText(/No distributions yet/)).toBeInTheDocument()
        })

        expect(screen.getByText('Upload a file')).toBeInTheDocument()
    })

    it('renders empty state for agents when none exist', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue([])

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText(/No agents registered/)).toBeInTheDocument()
        })

        expect(screen.getByText('Add agents')).toBeInTheDocument()
    })

    it('renders navigation links', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('Agent Management Dashboard')).toBeInTheDocument()
        })

        expect(screen.getByText('Manage Agents')).toHaveAttribute('href', '/agents')
        expect(screen.getByText('Upload Files')).toHaveAttribute('href', '/upload')
        expect(screen.getByText('View All Distributions')).toHaveAttribute('href', '/distributions')
    })

    it('renders view details links for distributions', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('test-file-1.csv')).toBeInTheDocument()
        })

        const viewDetailsLinks = screen.getAllByText('View Details')
        expect(viewDetailsLinks).toHaveLength(2)

        expect(viewDetailsLinks[0]).toHaveAttribute('href', '/distributions/2')
        expect(viewDetailsLinks[1]).toHaveAttribute('href', '/distributions/1')
    })

    it('renders view tasks links for agents', async () => {
        distributionService.getAllDistributions.mockResolvedValue(mockDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        const viewTasksLinks = screen.getAllByText('View Tasks')
        expect(viewTasksLinks).toHaveLength(3) // All 3 agents

        expect(viewTasksLinks[0]).toHaveAttribute('href', '/agents/agent1/tasks')
        expect(viewTasksLinks[1]).toHaveAttribute('href', '/agents/agent2/tasks')
        expect(viewTasksLinks[2]).toHaveAttribute('href', '/agents/agent3/tasks')
    })

    it('sorts distributions by creation date (newest first)', async () => {
        const unsortedDistributions = [
            {
                id: '1',
                filename: 'older-file.csv',
                totalItems: 100,
                createdAt: '2024-01-10T10:00:00Z',
                agents: []
            },
            {
                id: '2',
                filename: 'newer-file.csv',
                totalItems: 50,
                createdAt: '2024-01-20T10:00:00Z',
                agents: []
            }
        ]

        distributionService.getAllDistributions.mockResolvedValue(unsortedDistributions)
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithProviders(<Dashboard />)

        await waitFor(() => {
            expect(screen.getByText('newer-file.csv')).toBeInTheDocument()
        })

        // The newer file should appear first in the recent distributions
        const distributionCards = screen.getAllByText(/\.csv/)
        expect(distributionCards[0]).toHaveTextContent('newer-file.csv')
    })
})