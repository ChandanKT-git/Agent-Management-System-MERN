import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import EditAgent from '../EditAgent'
import { agentService } from '../../../services/agentService'
import { NotificationProvider } from '../../../contexts/NotificationContext'

// Mock the agent service
vi.mock('../../../services/agentService')

const mockAgent = {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    mobile: { countryCode: '+1', number: '1234567890' },
    isActive: true
}

const renderWithNotification = (component) => {
    return render(
        <NotificationProvider>
            {component}
        </NotificationProvider>
    )
}

describe('EditAgent', () => {
    const mockProps = {
        agent: mockAgent,
        onAgentUpdated: vi.fn(),
        onCancel: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders form with agent data pre-filled', () => {
        renderWithNotification(<EditAgent {...mockProps} />)

        expect(screen.getByText('Edit Agent')).toBeInTheDocument()
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument()
        expect(screen.getByRole('checkbox', { name: 'Active Agent' })).toBeChecked()

        // Check that the country code select has the correct value
        const countrySelect = screen.getByLabelText('Country Code *')
        expect(countrySelect.value).toBe('+1')
    })

    it('renders message when no agent is provided', () => {
        renderWithNotification(<EditAgent {...mockProps} agent={null} />)

        expect(screen.getByText('No agent selected for editing')).toBeInTheDocument()
    })

    it('updates form data when agent prop changes', () => {
        const { rerender } = renderWithNotification(<EditAgent {...mockProps} />)

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()

        const updatedAgent = {
            ...mockAgent,
            name: 'Jane Smith',
            email: 'jane@example.com'
        }

        rerender(
            <NotificationProvider>
                <EditAgent {...mockProps} agent={updatedAgent} />
            </NotificationProvider>
        )

        expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument()
        expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
    })

    it('shows validation errors for empty required fields', async () => {
        const user = userEvent.setup()
        renderWithNotification(<EditAgent {...mockProps} />)

        await user.clear(screen.getByDisplayValue('John Doe'))
        await user.clear(screen.getByDisplayValue('john@example.com'))
        await user.clear(screen.getByDisplayValue('1234567890'))

        await user.click(screen.getByText('Update Agent'))

        await waitFor(() => {
            expect(screen.getByText('Name is required')).toBeInTheDocument()
            expect(screen.getByText('Email is required')).toBeInTheDocument()
            expect(screen.getByText('Phone number is required')).toBeInTheDocument()
        })
    })

    it('shows email validation error for invalid email', async () => {
        const user = userEvent.setup()
        renderWithNotification(<EditAgent {...mockProps} />)

        await user.clear(screen.getByDisplayValue('john@example.com'))
        await user.type(screen.getByLabelText('Email Address *'), 'invalid-email')
        await user.click(screen.getByText('Update Agent'))

        await waitFor(() => {
            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
        })
    })

    it('clears validation errors when user starts typing', async () => {
        const user = userEvent.setup()
        renderWithNotification(<EditAgent {...mockProps} />)

        await user.clear(screen.getByDisplayValue('John Doe'))
        await user.click(screen.getByText('Update Agent'))

        await waitFor(() => {
            expect(screen.getByText('Name is required')).toBeInTheDocument()
        })

        await user.type(screen.getByLabelText('Full Name *'), 'Jane')

        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })

    it('successfully updates agent with valid data', async () => {
        const user = userEvent.setup()
        const updatedAgent = {
            ...mockAgent,
            name: 'Jane Smith',
            email: 'jane@example.com'
        }

        agentService.updateAgent.mockResolvedValue(updatedAgent)

        renderWithNotification(<EditAgent {...mockProps} />)

        await user.clear(screen.getByDisplayValue('John Doe'))
        await user.type(screen.getByLabelText('Full Name *'), 'Jane Smith')
        await user.clear(screen.getByDisplayValue('john@example.com'))
        await user.type(screen.getByLabelText('Email Address *'), 'jane@example.com')

        await user.click(screen.getByText('Update Agent'))

        await waitFor(() => {
            expect(agentService.updateAgent).toHaveBeenCalledWith('1', {
                name: 'Jane Smith',
                email: 'jane@example.com',
                mobile: {
                    countryCode: '+1',
                    number: '1234567890'
                },
                isActive: true
            })
        })

        expect(mockProps.onAgentUpdated).toHaveBeenCalledWith(updatedAgent)
    })

    it('handles isActive checkbox toggle', async () => {
        const user = userEvent.setup()
        const updatedAgent = { ...mockAgent, isActive: false }
        agentService.updateAgent.mockResolvedValue(updatedAgent)

        renderWithNotification(<EditAgent {...mockProps} />)

        const checkbox = screen.getByRole('checkbox', { name: 'Active Agent' })
        expect(checkbox).toBeChecked()

        await user.click(checkbox)
        expect(checkbox).not.toBeChecked()

        await user.click(screen.getByText('Update Agent'))

        await waitFor(() => {
            expect(agentService.updateAgent).toHaveBeenCalledWith('1', expect.objectContaining({
                isActive: false
            }))
        })
    })

    it('handles server validation errors', async () => {
        const user = userEvent.setup()
        const serverError = {
            response: {
                data: {
                    error: {
                        message: 'Email already exists',
                        details: {
                            email: 'This email is already registered'
                        }
                    }
                }
            }
        }

        agentService.updateAgent.mockRejectedValue(serverError)

        renderWithNotification(<EditAgent {...mockProps} />)

        await user.click(screen.getByText('Update Agent'))

        await waitFor(() => {
            expect(screen.getByText('This email is already registered')).toBeInTheDocument()
        })
    })

    it('handles generic server errors', async () => {
        const user = userEvent.setup()
        agentService.updateAgent.mockRejectedValue(new Error('Network error'))

        renderWithNotification(<EditAgent {...mockProps} />)

        await user.click(screen.getByText('Update Agent'))

        await waitFor(() => {
            expect(agentService.updateAgent).toHaveBeenCalled()
        })
    })

    it('shows loading state during submission', async () => {
        const user = userEvent.setup()
        agentService.updateAgent.mockImplementation(() => new Promise(() => { }))

        renderWithNotification(<EditAgent {...mockProps} />)

        await user.click(screen.getByText('Update Agent'))

        expect(screen.getByText('Updating...')).toBeInTheDocument()
        expect(screen.getByText('Updating...')).toBeDisabled()
        expect(screen.getByText('Cancel')).toBeDisabled()
    })

    it('calls onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup()
        renderWithNotification(<EditAgent {...mockProps} />)

        await user.click(screen.getByText('Cancel'))

        expect(mockProps.onCancel).toHaveBeenCalled()
    })

    it('handles agent with missing mobile data', () => {
        const agentWithoutMobile = {
            ...mockAgent,
            mobile: null
        }

        renderWithNotification(<EditAgent {...mockProps} agent={agentWithoutMobile} />)

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
        expect(screen.getByLabelText('Phone Number *')).toHaveValue('')

        // Check that the country code select has the default value
        const countrySelect = screen.getByLabelText('Country Code *')
        expect(countrySelect.value).toBe('+1')
    })

    it('shows help text for active agent checkbox', () => {
        renderWithNotification(<EditAgent {...mockProps} />)

        expect(screen.getByText('Inactive agents will not receive new task assignments')).toBeInTheDocument()
    })

    it('includes all country code options', () => {
        renderWithNotification(<EditAgent {...mockProps} />)

        expect(screen.getByRole('option', { name: '+1 (US/Canada)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+44 (UK)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+91 (India)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+61 (Australia)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+49 (Germany)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+33 (France)' })).toBeInTheDocument()
    })
})