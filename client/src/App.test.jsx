import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock the contexts to avoid errors in tests
vi.mock('./contexts/AuthContext', () => ({
    AuthProvider: ({ children }) => children,
    useAuth: () => ({
        isAuthenticated: false,
        loading: false,
        login: vi.fn(),
        logout: vi.fn()
    })
}))

vi.mock('./contexts/NotificationContext', () => ({
    NotificationProvider: ({ children }) => children,
    useNotification: () => ({
        notifications: [],
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        clearNotifications: vi.fn()
    })
}))

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />)

        // Should render the App container
        expect(document.querySelector('.App')).toBeInTheDocument()
    })
})