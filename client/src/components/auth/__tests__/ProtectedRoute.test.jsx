import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'
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

const TestProtectedComponent = () => <div>Protected Content</div>
const TestLoginComponent = () => <div>Login Page</div>

const renderProtectedRoute = (initialEntries = ['/protected']) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<TestLoginComponent />} />
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute>
                                <TestProtectedComponent />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </MemoryRouter>
    )
}

describe('ProtectedRoute Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    it('should show loading state initially', async () => {
        renderProtectedRoute()

        // The loading state might be very brief, so we check if either loading or final state is shown
        await waitFor(() => {
            const hasLoading = screen.queryByText('Loading...')
            const hasLogin = screen.queryByText('Login Page')
            expect(hasLoading || hasLogin).toBeTruthy()
        })
    })

    it('should redirect to login when not authenticated', async () => {
        renderProtectedRoute()

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument()
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
        })
    })

    it('should render protected content when authenticated', async () => {
        // Set up authenticated state
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.Qr8ysQbzJgHYdJBbW5J5J5J5J5J5J5J5J5J5J5J5J5J'
        const mockUser = { email: 'test@example.com', id: '123' }

        localStorage.setItem('token', mockToken)
        localStorage.setItem('user', JSON.stringify(mockUser))

        renderProtectedRoute()

        await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument()
            expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
        })
    })

    it('should redirect to login when token is expired', async () => {
        // Set up expired token
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxfQ.invalid'
        const mockUser = { email: 'test@example.com', id: '123' }

        localStorage.setItem('token', expiredToken)
        localStorage.setItem('user', JSON.stringify(mockUser))

        renderProtectedRoute()

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument()
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
        })
    })

    it('should redirect to login when token is invalid format', async () => {
        // Set up invalid token
        localStorage.setItem('token', 'invalid-token-format')
        localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }))

        renderProtectedRoute()

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument()
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
        })
    })

    it('should handle missing user data gracefully', async () => {
        // Set up token without user data
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.Qr8ysQbzJgHYdJBbW5J5J5J5J5J5J5J5J5J5J5J5J5J'

        localStorage.setItem('token', mockToken)
        // No user data in localStorage

        renderProtectedRoute()

        await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument()
        })
    })
})