import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import DistributionDetail from '../DistributionDetail'
import { distributionService } from '../../../services/distributionService'
import { NotificationProvider } from '../../../contexts/NotificationContext'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useParams: () => ({ id: '1' })
    }
})

// Mock the distribution service
vi.mock('../../../services/distributionService', () => ({
    distributionService: {
        getDistribution: vi.fn()
    }
}))

const mockDistribution = {
    id: '1',
    filename: 'test-file.csv',
    originalName: 'Test File.csv',
    totalItems: 100,
    status: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    agents: [
        {
            agentId: 'agent1',
            name: 'John Doe',
            email: 'john@example.com',
            tasks: [
                { firstName: 'Alice', phone: '123-456-7890' },
                { firstName: 'Bob', phone: '098-765-4321' }
            ]
        },
        {
            agentId: 'agent2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            tasks: [
                { firstName: 'Charlie', phone: '555-123-4567' }
            ]
        }
    ]
}

const renderWithProviders = (component) => {
    return render(
        <BrowserRouter>
            <NotificationProvider>
                {component}
            </NotificationProvider>
        </BrowserRouter>
    )
}

describe('DistributionDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading state initially', () => {
        distributionService.getDistribution.mockImplementation(() => new Promise(() => { }))

        renderWithProviders(<DistributionDetail />)

        expect(screen.getByText('Loading distribution details...')).toBeInTheDocument()
    })

    it('renders distribution details when data is loaded', async () => {
        distributionService.getDistribution.mockResolvedValue(mockDistribution)

        renderWithProviders(<DistributionDetail />)

        await waitFor(() => {
            expect(screen.getByText('Distribution Details')).toBeInTheDocument()
        })

        expect(screen.getByText('test-file.csv')).toBeInTheDocument()
        expect(screen.getByText('Test File.csv')).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('completed')).toBeInTheDocument()
    })

    it('renders agent assignments', async () => {
        distributionService.getDistribution.mockResolvedValue(mockDistribution)

        renderWithProviders(<DistributionDetail />)

        await waitFor(() => {
            expect(screen.getByText('Agent Assignments')).toBeInTheDocument()
        })

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
        expect(screen.getByText('2 tasks')).toBeInTheDocument()
        expect(screen.getByText('1 tasks')).toBeInTheDocument()
    })

    it('shows task previews for agents', async () => {
        distributionService.getDistribution.mockResolvedValue(mockDistribution)

        renderWithProviders(<DistributionDetail />)

        await waitFor(() => {
            expect(screen.getAllByText('Tasks Preview:')).toHaveLength(2)
        })

        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.getByText('123-456-7890')).toBeInTheDocument()
        expect(screen.getByText('Bob')).toBeInTheDocument()
        expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('renders view all tasks links for agents', async () => {
        distributionService.getDistribution.mockResolvedValue(mockDistribution)

        renderWithProviders(<DistributionDetail />)

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        const viewTasksLinks = screen.getAllByText('View All Tasks')
        expect(viewTasksLinks).toHaveLength(2)

        expect(viewTasksLinks[0]).toHaveAttribute('href', '/agents/agent1/tasks')
        expect(viewTasksLinks[1]).toHaveAttribute('href', '/agents/agent2/tasks')
    })

    it('shows empty state when no agents are assigned', async () => {
        const distributionWithoutAgents = {
            ...mockDistribution,
            agents: []
        }
        distributionService.getDistribution.mockResolvedValue(distributionWithoutAgents)

        renderWithProviders(<DistributionDetail />)

        await waitFor(() => {
            expect(screen.getByText('No agent assignments')).toBeInTheDocument()
        })

        expect(screen.getByText('This distribution has not been assigned to any agents yet.')).toBeInTheDocument()
    })

    it('shows empty tasks state for agents with no tasks', async () => {
        const distributionWithEmptyTasks = {
            ...mockDistribution,
            agents: [
                {
                    agentId: 'agent1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    tasks: []
                }
            ]
        }
        distributionService.getDistribution.mockResolvedValue(distributionWithEmptyTasks)

        renderWithProviders(<DistributionDetail />)

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        expect(screen.getByText('No tasks assigned to this agent')).toBeInTheDocument()
    })

    it('renders error state when distribution is not found', async () => {
        distributionService.getDistribution.mockResolvedValue(null)

        renderWithProviders(<DistributionDetail />)

        await waitFor(() => {
            expect(screen.getByText('Distribution not found')).toBeInTheDocument()
        })

        expect(screen.getByText('The requested distribution could not be found.')).toBeInTheDocument()
    })

    it('calculates total assigned tasks correctly', async () => {
        distributionService.getDistribution.mockResolvedValue(mockDistribution)

        renderWithProviders(<DistributionDetail />)

        await waitFor(() => {
            expect(screen.getByText('Distribution Details')).toBeInTheDocument()
        })

        // Total assigned tasks should be 3 (2 + 1)
        expect(screen.getByText('3')).toBeInTheDocument()
    })
})