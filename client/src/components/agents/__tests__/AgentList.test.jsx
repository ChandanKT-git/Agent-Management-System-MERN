import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import AgentList from '../AgentList'
import { agentService } from '../../../services/agentService'
import { NotificationProvider } from '../../../contexts/NotificationContext'

// Mock the agent service
vi.mock('../../../services/agentService')

// Mock LoadingSpinner
vi.mock('../../common/LoadingSpinner', () => ({
    default: () => <div data-testid="loading-spinner">Loading...</div>
}))

const mockAgents = [
    {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        mobile: { countryCode: '+1', number: '1234567890' },
        isActive: true,
        createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        mobile: { countryCode: '+44', number: '9876543210' },
        isActive: false,
        createdAt: '2023-01-02T00:00:00.000Z'
    }
]

const renderWithNotification = (component) => {
    return render(
        <NotificationProvider>
            {component}
        </NotificationProvider>
    )
}

describe('AgentList', () => {
    const mockProps = {
        onEditAgent: vi.fn(),
        onViewAgent: vi.fn(),
        onDeleteAgent: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows loading state initially', () => {
        agentService.getAllAgents.mockImplementation(() => new Promise(() => { }))

        renderWithNotification(<AgentList {...mockProps} />)

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
        expect(screen.getByText('Loading agents...')).toBeInTheDocument()
    })

    it('displays agents after successful load', async () => {
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithNotification(<AgentList {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('Agents (2)')).toBeInTheDocument()
        })

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('+1 1234567890')).toBeInTheDocument()
        expect(screen.getByText('Status: Active')).toBeInTheDocument()

        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
        expect(screen.getByText('+44 9876543210')).toBeInTheDocument()
        expect(screen.getByText('Status: Inactive')).toBeInTheDocument()
    })

    it('displays empty state when no agents', async () => {
        agentService.getAllAgents.mockResolvedValue([])

        renderWithNotification(<AgentList {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('Agents (0)')).toBeInTheDocument()
        })

        expect(screen.getByText('No agents found. Create your first agent to get started.')).toBeInTheDocument()
    })

    it('displays error state on load failure', async () => {
        agentService.getAllAgents.mockRejectedValue(new Error('Load failed'))

        renderWithNotification(<AgentList {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('Failed to load agents')).toBeInTheDocument()
        })

        expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('retries loading on retry button click', async () => {
        agentService.getAllAgents
            .mockRejectedValueOnce(new Error('Load failed'))
            .mockResolvedValueOnce(mockAgents)

        renderWithNotification(<AgentList {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('Retry')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Retry'))

        await waitFor(() => {
            expect(screen.getByText('Agents (2)')).toBeInTheDocument()
        })

        expect(agentService.getAllAgents).toHaveBeenCalledTimes(2)
    })

    it('calls onViewAgent when View Details button is clicked', async () => {
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithNotification(<AgentList {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        const viewButtons = screen.getAllByText('View Details')
        fireEvent.click(viewButtons[0])

        expect(mockProps.onViewAgent).toHaveBeenCalledWith(mockAgents[0])
    })

    it('calls onEditAgent when Edit button is clicked', async () => {
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithNotification(<AgentList {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        const editButtons = screen.getAllByText('Edit')
        fireEvent.click(editButtons[0])

        expect(mockProps.onEditAgent).toHaveBeenCalledWith(mockAgents[0])
    })

    it('calls onDeleteAgent when Delete button is clicked', async () => {
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        renderWithNotification(<AgentList {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        const deleteButtons = screen.getAllByText('Delete')
        fireEvent.click(deleteButtons[0])

        expect(mockProps.onDeleteAgent).toHaveBeenCalledWith(mockAgents[0])
    })

    it('handles missing mobile data gracefully', async () => {
        const agentsWithMissingData = [
            {
                _id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                mobile: null,
                isActive: true
            }
        ]

        agentService.getAllAgents.mockResolvedValue(agentsWithMissingData)

        renderWithNotification(<AgentList {...mockProps} />)

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        // Should not crash and should handle missing mobile data
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('refreshes list when key prop changes', async () => {
        agentService.getAllAgents.mockResolvedValue(mockAgents)

        const { rerender } = renderWithNotification(<AgentList {...mockProps} key={1} />)

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        })

        expect(agentService.getAllAgents).toHaveBeenCalledTimes(1)

        // Rerender with different key to trigger refresh
        rerender(
            <NotificationProvider>
                <AgentList {...mockProps} key={2} />
            </NotificationProvider>
        )

        expect(agentService.getAllAgents).toHaveBeenCalledTimes(2)
    })
})