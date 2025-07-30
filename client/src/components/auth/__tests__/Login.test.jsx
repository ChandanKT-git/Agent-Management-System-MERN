import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'
import { AuthProvider } from '../../../contexts/AuthContext'

// Mock the API client
vi.mock('../../../services/apiClient', () => ({
    apiClient: {
        post: vi.fn(),
        defaults: {
            headers: {
                common: {}
            }
        }
    }
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

const renderLogin = () => {
    return render(
        <MemoryRouter>
            <AuthProvider>
                <Login />
            </AuthProvider>
        </MemoryRouter>
    )
}

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        mockNavigate.mockClear()
    })

    it('should render login form', () => {
        renderLogin()

        expect(screen.getByText('Admin Login')).toBeInTheDocument()
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should show validation errors for empty fields', async () => {
        const user = userEvent.setup()
        renderLogin()

        const submitButton = screen.getByRole('button', { name: 'Sign In' })

        await user.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Email is required')).toBeInTheDocument()
            expect(screen.getByText('Password is required')).toBeInTheDocument()
        })
    })

    it('should show validation error for invalid email', async () => {
        const user = userEvent.setup()
        renderLogin()

        const emailInput = screen.getByLabelText('Email Address')

        await user.type(emailInput, 'invalid-email')
        await user.tab() // Trigger onBlur validation

        await waitFor(() => {
            expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
        })
    })

    it('should show validation error for short password', async () => {
        const user = userEvent.setup()
        renderLogin()

        const passwordInput = screen.getByLabelText('Password')

        await user.type(passwordInput, '123')
        await user.tab() // Trigger onBlur validation

        await waitFor(() => {
            expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
        })
    })

    it('should accept valid email format', async () => {
        const user = userEvent.setup()
        renderLogin()

        const emailInput = screen.getByLabelText('Email Address')

        await user.type(emailInput, 'test@example.com')
        await user.tab()

        await waitFor(() => {
            expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument()
        })
    })

    it('should accept valid password length', async () => {
        const user = userEvent.setup()
        renderLogin()

        const passwordInput = screen.getByLabelText('Password')

        await user.type(passwordInput, 'password123')
        await user.tab()

        await waitFor(() => {
            expect(screen.queryByText('Password must be at least 6 characters')).not.toBeInTheDocument()
        })
    })

    it('should show loading state during form submission', async () => {
        const user = userEvent.setup()
        renderLogin()

        const emailInput = screen.getByLabelText('Email Address')
        const passwordInput = screen.getByLabelText('Password')
        const submitButton = screen.getByRole('button', { name: 'Sign In' })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')

        // Mock a delayed response
        const { apiClient } = await import('../../../services/apiClient')
        apiClient.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

        await user.click(submitButton)

        expect(screen.getByText('Signing in...')).toBeInTheDocument()
        expect(screen.getByRole('button')).toBeDisabled()
        expect(emailInput).toBeDisabled()
        expect(passwordInput).toBeDisabled()
    })

    it('should disable form during loading state', async () => {
        const user = userEvent.setup()
        renderLogin()

        const emailInput = screen.getByLabelText('Email Address')
        const passwordInput = screen.getByLabelText('Password')
        const submitButton = screen.getByRole('button', { name: 'Sign In' })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')

        // Mock a delayed response
        const { apiClient } = await import('../../../services/apiClient')
        apiClient.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

        await user.click(submitButton)

        expect(submitButton).toBeDisabled()
        expect(emailInput).toBeDisabled()
        expect(passwordInput).toBeDisabled()
    })

    it('should handle successful login and navigate to dashboard', async () => {
        const user = userEvent.setup()
        renderLogin()

        const emailInput = screen.getByLabelText('Email Address')
        const passwordInput = screen.getByLabelText('Password')
        const submitButton = screen.getByRole('button', { name: 'Sign In' })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')

        // Mock successful login response
        const { apiClient } = await import('../../../services/apiClient')
        apiClient.post.mockResolvedValueOnce({
            data: {
                token: 'test-token',
                user: { email: 'test@example.com', id: '123' }
            }
        })

        await user.click(submitButton)

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })
    })

    it('should display error message on login failure', async () => {
        const user = userEvent.setup()
        renderLogin()

        const emailInput = screen.getByLabelText('Email Address')
        const passwordInput = screen.getByLabelText('Password')
        const submitButton = screen.getByRole('button', { name: 'Sign In' })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'wrongpassword')

        // Mock login failure
        const { apiClient } = await import('../../../services/apiClient')
        apiClient.post.mockRejectedValueOnce({
            response: {
                data: {
                    error: {
                        message: 'Invalid credentials'
                    }
                }
            }
        })

        await user.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
        })
    })

    it('should display generic error message for unexpected errors', async () => {
        const user = userEvent.setup()
        renderLogin()

        const emailInput = screen.getByLabelText('Email Address')
        const passwordInput = screen.getByLabelText('Password')
        const submitButton = screen.getByRole('button', { name: 'Sign In' })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')

        // Mock network error
        const { apiClient } = await import('../../../services/apiClient')
        apiClient.post.mockRejectedValueOnce(new Error('Network error'))

        await user.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
        })
    })

    it('should clear previous error messages on new submission', async () => {
        const user = userEvent.setup()
        renderLogin()

        const emailInput = screen.getByLabelText('Email Address')
        const passwordInput = screen.getByLabelText('Password')
        const submitButton = screen.getByRole('button', { name: 'Sign In' })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'wrongpassword')

        // Mock first failure
        const { apiClient } = await import('../../../services/apiClient')
        apiClient.post.mockRejectedValueOnce({
            response: {
                data: {
                    error: {
                        message: 'Invalid credentials'
                    }
                }
            }
        })

        await user.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
        })

        // Clear password and try again
        await user.clear(passwordInput)
        await user.type(passwordInput, 'correctpassword')

        // Mock successful response
        apiClient.post.mockResolvedValueOnce({
            data: {
                token: 'test-token',
                user: { email: 'test@example.com', id: '123' }
            }
        })

        await user.click(submitButton)

        await waitFor(() => {
            expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
        })
    })
})