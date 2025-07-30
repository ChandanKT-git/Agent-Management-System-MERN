import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// Mock console.error to avoid noise in tests
const originalError = console.error
beforeAll(() => {
    console.error = vi.fn()
})

afterAll(() => {
    console.error = originalError
})

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error('Test error')
    }
    return <div>No error</div>
}

describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        )

        expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('renders error UI when there is an error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('Please refresh the page and try again.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument()
    })

    it('logs error to console', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(console.error).toHaveBeenCalled()
    })

    it('refreshes page when refresh button is clicked', () => {
        // Mock window.location.reload
        const mockReload = vi.fn()
        Object.defineProperty(window, 'location', {
            value: { reload: mockReload },
            writable: true
        })

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        const refreshButton = screen.getByRole('button', { name: 'Refresh Page' })
        refreshButton.click()

        expect(mockReload).toHaveBeenCalled()
    })

    it('handles different error types', () => {
        const ComponentWithTypeError = () => {
            const obj = null
            return <div>{obj.property}</div> // This will throw TypeError
        }

        render(
            <ErrorBoundary>
                <ComponentWithTypeError />
            </ErrorBoundary>
        )

        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('resets error state when children change', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        )

        expect(screen.getByText('Something went wrong')).toBeInTheDocument()

        // Re-render with different children
        rerender(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        )

        expect(screen.getByText('No error')).toBeInTheDocument()
    })
})