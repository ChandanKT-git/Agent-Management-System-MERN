import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import AddAgent from '../AddAgent'
import { agentService } from '../../../services/agentService'
import { NotificationProvider } from '../../../contexts/NotificationContext'

// Mock the agent service
vi.mock('../../../services/agentService')

const renderWithNotification = (component) => {
    return render(
        <NotificationProvider>
            {component}
        </NotificationProvider>
    )
}

describe('AddAgent', () => {
    const mockProps = {
        onAgentAdded: vi.fn(),
        onCancel: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders form with all required fields', () => {
        renderWithNotification(<AddAgent {...mockProps} />)

        expect(screen.getByText('Add New Agent')).toBeInTheDocument()
        expect(screen.getByLabelText('Full Name *')).toBeInTheDocument()
        expect(screen.getByLabelText('Email Address *')).toBeInTheDocument()
        expect(screen.getByLabelText('Country Code *')).toBeInTheDocument()
        expect(screen.getByLabelText('Phone Number *')).toBeInTheDocument()
        expect(screen.getByLabelText('Password *')).toBeInTheDocument()
        expect(screen.getByLabelText('Confirm Password *')).toBeInTheDocument()
        expect(screen.getByText('Create Agent')).toBeInTheDocument()
        expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('shows validation errors for empty required fields', async () => {
        const user = userEvent.setup()
        renderWithNotification(<AddAgent {...mockProps} />)

        await user.click(screen.getByText('Create Agent'))

        await waitFor(() => {
            expect(screen.getByText('Name is required')).toBeInTheDocument()
            expect(screen.getByText('Email is required')).toBeInTheDocument()
            expect(screen.getByText('Phone number is required')).toBeInTheDocument()
            expect(screen.getByText('Password is required')).toBeInTheDocument()
            expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
        })
    })

    it('shows email validation error for invalid email', async () => {
        const user = userEvent.setup()
        renderWithNotification(<AddAgent {...mockProps} />)

        await user.type(screen.getByLabelText('Email Address *'), 'invalid-email')
        await user.click(screen.getByText('Create Agent'))

        await waitFor(() => {
            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
        })
    })

    it('shows password validation error for short password', async () => {
        const user = userEvent.setup()
        renderWithNotification(<AddAgent {...mockProps} />)

        await user.type(screen.getByLabelText('Password *'), '123')
        await user.click(screen.getByText('Create Agent'))

        await waitFor(() => {
            expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
        })
    })

    it('shows password mismatch error', async () => {
        const user = userEvent.setup()
        renderWithNotification(<AddAgent {...mockProps} />)

        await user.type(screen.getByLabelText('Password *'), 'password123')
        await user.type(screen.getByLabelText('Confirm Password *'), 'different')
        await user.click(screen.getByText('Create Agent'))

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
        })
    })

    it('clears validation errors when user starts typing', async () => {
        const user = userEvent.setup()
        renderWithNotification(<AddAgent {...mockProps} />)

        // Trigger validation error
        await user.click(screen.getByText('Create Agent'))

        await waitFor(() => {
            expect(screen.getByText('Name is required')).toBeInTheDocument()
        })

        // Start typing to clear error
        await user.type(screen.getByLabelText('Full Name *'), 'John')

        expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })

    it('successfully creates agent with valid data', async () => {
        const user = userEvent.setup()
        const mockAgent = {
            _id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            mobile: { countryCode: '+1', number: '1234567890' }
        }

        agentService.createAgent.mockResolvedValue(mockAgent)

        renderWithNotification(<AddAgent {...mockProps} />)

        await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
        await user.type(screen.getByLabelText('Email Address *'), 'john@example.com')
        await user.selectOptions(screen.getByLabelText('Country Code *'), '+1')
        await user.type(screen.getByLabelText('Phone Number *'), '1234567890')
        await user.type(screen.getByLabelText('Password *'), 'password123')
        await user.type(screen.getByLabelText('Confirm Password *'), 'password123')

        await user.click(screen.getByText('Create Agent'))

        await waitFor(() => {
            expect(agentService.createAgent).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'john@example.com',
                mobile: {
                    countryCode: '+1',
                    number: '1234567890'
                },
                password: 'password123'
            })
        })

        expect(mockProps.onAgentAdded).toHaveBeenCalledWith(mockAgent)
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

        agentService.createAgent.mockRejectedValue(serverError)

        renderWithNotification(<AddAgent {...mockProps} />)

        await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
        await user.type(screen.getByLabelText('Email Address *'), 'john@example.com')
        await user.type(screen.getByLabelText('Phone Number *'), '1234567890')
        await user.type(screen.getByLabelText('Password *'), 'password123')
        await user.type(screen.getByLabelText('Confirm Password *'), 'password123')

        await user.click(screen.getByText('Create Agent'))

        await waitFor(() => {
            expect(screen.getByText('This email is already registered')).toBeInTheDocument()
        })
    })

    it('handles generic server errors', async () => {
        const user = userEvent.setup()
        agentService.createAgent.mockRejectedValue(new Error('Network error'))

        renderWithNotification(<AddAgent {...mockProps} />)

        await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
        await user.type(screen.getByLabelText('Email Address *'), 'john@example.com')
        await user.type(screen.getByLabelText('Phone Number *'), '1234567890')
        await user.type(screen.getByLabelText('Password *'), 'password123')
        await user.type(screen.getByLabelText('Confirm Password *'), 'password123')

        await user.click(screen.getByText('Create Agent'))

        await waitFor(() => {
            expect(agentService.createAgent).toHaveBeenCalled()
        })
    })

    it('shows loading state during submission', async () => {
        const user = userEvent.setup()
        agentService.createAgent.mockImplementation(() => new Promise(() => { }))

        renderWithNotification(<AddAgent {...mockProps} />)

        await user.type(screen.getByLabelText('Full Name *'), 'John Doe')
        await user.type(screen.getByLabelText('Email Address *'), 'john@example.com')
        await user.type(screen.getByLabelText('Phone Number *'), '1234567890')
        await user.type(screen.getByLabelText('Password *'), 'password123')
        await user.type(screen.getByLabelText('Confirm Password *'), 'password123')

        await user.click(screen.getByText('Create Agent'))

        expect(screen.getByText('Creating...')).toBeInTheDocument()
        expect(screen.getByText('Creating...')).toBeDisabled()
        expect(screen.getByText('Cancel')).toBeDisabled()
    })

    it('calls onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup()
        renderWithNotification(<AddAgent {...mockProps} />)

        await user.click(screen.getByText('Cancel'))

        expect(mockProps.onCancel).toHaveBeenCalled()
    })

    it('resets form after successful submission', async () => {
        const user = userEvent.setup()
        const mockAgent = { _id: '1', name: 'John Doe' }
        agentService.createAgent.mockResolvedValue(mockAgent)

        renderWithNotification(<AddAgent {...mockProps} />)

        const nameInput = screen.getByLabelText('Full Name *')
        const emailInput = screen.getByLabelText('Email Address *')

        await user.type(nameInput, 'John Doe')
        await user.type(emailInput, 'john@example.com')
        await user.type(screen.getByLabelText('Phone Number *'), '1234567890')
        await user.type(screen.getByLabelText('Password *'), 'password123')
        await user.type(screen.getByLabelText('Confirm Password *'), 'password123')

        await user.click(screen.getByText('Create Agent'))

        await waitFor(() => {
            expect(mockProps.onAgentAdded).toHaveBeenCalled()
        })

        // Form should be reset
        expect(nameInput.value).toBe('')
        expect(emailInput.value).toBe('')
    })

    it('includes all country code options', () => {
        renderWithNotification(<AddAgent {...mockProps} />)

        const countrySelect = screen.getByLabelText('Country Code *')

        expect(screen.getByRole('option', { name: '+1 (US/Canada)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+44 (UK)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+91 (India)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+61 (Australia)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+49 (Germany)' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '+33 (France)' })).toBeInTheDocument()
    })
})