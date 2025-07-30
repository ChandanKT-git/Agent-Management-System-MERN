import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock the API client
vi.mock('../../services/apiClient', () => ({
    apiClient: {
        post: vi.fn(),
        defaults: {
            headers: {
                common: {}
            }
        }
    }
}))

// Test component to access auth context
const TestComponent = () => {
    const { isAuthenticated, user, token, loading, error, login, logout } = useAuth()

    return (
        <div>
            <div data-testid="auth-status">
                {loading ? 'loading' : isAuthenticated ? 'authenticated' : 'not-authenticated'}
            </div>
            <div data-testid="user">{user?.email || 'no-user'}</div>
            <div data-testid="token">{token || 'no-token'}</div>
            <div data-testid="error">{error || 'no-error'}</div>
            <button onClick={() => login('test@example.com', 'password')}>
                Login
            </button>
            <button onClick={logout}>Logout</button>
        </div>
    )
}

describe('AuthContext', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        localStorage.clear()
        // Reset the mock functions
        localStorage.getItem.mockClear()
        localStorage.setItem.mockClear()
        localStorage.removeItem.mockClear()
        // Reset API client mock
        const { apiClient } = await import('../../services/apiClient')
        apiClient.post.mockClear()
        apiClient.defaults.headers.common = {}
    })

    afterEach(() => {
        vi.clearAllTimers()
    })

    it('should provide initial state', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
        })

        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
        expect(screen.getByTestId('token')).toHaveTextContent('no-token')
        expect(screen.getByTestId('error')).toHaveTextContent('no-error')
    })

    it('should restore authentication from localStorage', async () => {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.Qr8ysQbzJgHYdJBbW5J5J5J5J5J5J5J5J5J5J5J5J5J'
        const mockUser = { email: 'test@example.com', id: '123' }

        localStorage.setItem('token', mockToken)
        localStorage.setItem('user', JSON.stringify(mockUser))

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
        })

        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('token')).toHaveTextContent(mockToken)
    })

    it('should handle expired token in localStorage', async () => {
        // Create an expired token (exp in the past)
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxfQ.invalid'

        localStorage.setItem('token', expiredToken)
        localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }))

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
        })

        expect(localStorage.removeItem).toHaveBeenCalledWith('token')
        expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('should handle successful login', async () => {
        const mockResponse = {
            data: {
                token: 'new-token',
                user: { email: 'test@example.com', id: '123' }
            }
        }

        const { apiClient } = await import('../../services/apiClient')
        apiClient.post.mockResolvedValueOnce(mockResponse)

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
        })

        await act(async () => {
            screen.getByText('Login').click()
        })

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
        })

        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('token')).toHaveTextContent('new-token')

        // Check if localStorage.setItem was called with the correct values
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-token')
        expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ email: 'test@example.com', id: '123' }))
    })

    it('should handle login failure', async () => {
        const mockError = {
            response: {
                data: {
                    error: {
                        message: 'Invalid credentials'
                    }
                }
            }
        }

        const { apiClient } = await import('../../services/apiClient')
        apiClient.post.mockRejectedValueOnce(mockError)

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
        })

        await act(async () => {
            screen.getByText('Login').click()
        })

        await waitFor(() => {
            expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
        })

        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    })

    it('should handle logout', async () => {
        const mockToken = 'test-token'
        const mockUser = { email: 'test@example.com', id: '123' }

        localStorage.setItem('token', mockToken)
        localStorage.setItem('user', JSON.stringify(mockUser))

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
        })

        act(() => {
            screen.getByText('Logout').click()
        })

        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
        expect(screen.getByTestId('token')).toHaveTextContent('no-token')
        expect(localStorage.removeItem).toHaveBeenCalledWith('token')
        expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('should throw error when useAuth is used outside provider', () => {
        const TestComponentOutsideProvider = () => {
            useAuth()
            return <div>Test</div>
        }

        expect(() => {
            render(<TestComponentOutsideProvider />)
        }).toThrow('useAuth must be used within an AuthProvider')
    })
})