import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationToast from '../NotificationToast'

describe('NotificationToast', () => {
    const mockOnClose = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders success notification', () => {
        render(
            <NotificationToast
                type="success"
                message="Operation completed successfully"
                onClose={mockOnClose}
            />
        )

        expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveClass('toast', 'success')
    })

    it('renders error notification', () => {
        render(
            <NotificationToast
                type="error"
                message="Something went wrong"
                onClose={mockOnClose}
            />
        )

        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveClass('toast', 'error')
    })

    it('renders warning notification', () => {
        render(
            <NotificationToast
                type="warning"
                message="Please check your input"
                onClose={mockOnClose}
            />
        )

        expect(screen.getByText('Please check your input')).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveClass('toast', 'warning')
    })

    it('renders info notification', () => {
        render(
            <NotificationToast
                type="info"
                message="Information message"
                onClose={mockOnClose}
            />
        )

        expect(screen.getByText('Information message')).toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveClass('toast', 'info')
    })

    it('calls onClose when close button is clicked', () => {
        render(
            <NotificationToast
                type="success"
                message="Test message"
                onClose={mockOnClose}
            />
        )

        const closeButton = screen.getByRole('button', { name: 'Close notification' })
        fireEvent.click(closeButton)

        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('auto-closes after specified duration', async () => {
        render(
            <NotificationToast
                type="success"
                message="Test message"
                onClose={mockOnClose}
                duration={1000}
            />
        )

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1)
        }, { timeout: 1500 })
    })

    it('does not auto-close when duration is 0', async () => {
        render(
            <NotificationToast
                type="success"
                message="Test message"
                onClose={mockOnClose}
                duration={0}
            />
        )

        // Wait a bit to ensure it doesn't auto-close
        await new Promise(resolve => setTimeout(resolve, 500))
        expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('renders with custom title', () => {
        render(
            <NotificationToast
                type="success"
                title="Success!"
                message="Operation completed"
                onClose={mockOnClose}
            />
        )

        expect(screen.getByText('Success!')).toBeInTheDocument()
        expect(screen.getByText('Operation completed')).toBeInTheDocument()
    })

    it('renders without title when not provided', () => {
        render(
            <NotificationToast
                type="success"
                message="Operation completed"
                onClose={mockOnClose}
            />
        )

        expect(screen.getByText('Operation completed')).toBeInTheDocument()
        // Should not have a title element
        expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('has proper accessibility attributes', () => {
        render(
            <NotificationToast
                type="error"
                message="Error message"
                onClose={mockOnClose}
            />
        )

        const toast = screen.getByRole('alert')
        expect(toast).toHaveAttribute('aria-live', 'assertive')
        expect(toast).toHaveAttribute('aria-atomic', 'true')
    })

    it('renders with action button when provided', () => {
        const mockAction = vi.fn()

        render(
            <NotificationToast
                type="info"
                message="Update available"
                onClose={mockOnClose}
                action={{
                    label: 'Update Now',
                    onClick: mockAction
                }}
            />
        )

        const actionButton = screen.getByRole('button', { name: 'Update Now' })
        expect(actionButton).toBeInTheDocument()

        fireEvent.click(actionButton)
        expect(mockAction).toHaveBeenCalledTimes(1)
    })

    it('clears timeout when component unmounts', () => {
        const { unmount } = render(
            <NotificationToast
                type="success"
                message="Test message"
                onClose={mockOnClose}
                duration={5000}
            />
        )

        unmount()

        // Wait longer than the duration to ensure timeout was cleared
        setTimeout(() => {
            expect(mockOnClose).not.toHaveBeenCalled()
        }, 6000)
    })

    it('pauses auto-close on hover', async () => {
        render(
            <NotificationToast
                type="success"
                message="Test message"
                onClose={mockOnClose}
                duration={1000}
            />
        )

        const toast = screen.getByRole('alert')

        // Hover over the toast
        fireEvent.mouseEnter(toast)

        // Wait longer than the duration
        await new Promise(resolve => setTimeout(resolve, 1500))
        expect(mockOnClose).not.toHaveBeenCalled()

        // Mouse leave should resume the timer
        fireEvent.mouseLeave(toast)

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1)
        }, { timeout: 1500 })
    })
})