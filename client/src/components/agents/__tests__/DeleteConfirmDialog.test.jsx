import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import DeleteConfirmDialog from '../DeleteConfirmDialog'

const mockAgent = {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    mobile: { countryCode: '+1', number: '1234567890' }
}

describe('DeleteConfirmDialog', () => {
    const mockProps = {
        isOpen: true,
        agent: mockAgent,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        loading: false
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders nothing when not open', () => {
        const { container } = render(
            <DeleteConfirmDialog {...mockProps} isOpen={false} />
        )

        expect(container.firstChild).toBeNull()
    })

    it('renders nothing when no agent is provided', () => {
        const { container } = render(
            <DeleteConfirmDialog {...mockProps} agent={null} />
        )

        expect(container.firstChild).toBeNull()
    })

    it('renders dialog with agent information when open', () => {
        render(<DeleteConfirmDialog {...mockProps} />)

        expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
        expect(screen.getByText(/Are you sure you want to delete agent/)).toBeInTheDocument()
        expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument()
    })

    it('displays agent summary information', () => {
        render(<DeleteConfirmDialog {...mockProps} />)

        expect(screen.getByText('Name:')).toBeInTheDocument()
        expect(screen.getByText('Email:')).toBeInTheDocument()
        expect(screen.getByText('Phone:')).toBeInTheDocument()

        // Use getAllByText to handle multiple instances
        const johnDoeElements = screen.getAllByText('John Doe')
        expect(johnDoeElements.length).toBeGreaterThan(0)

        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('+1 1234567890')).toBeInTheDocument()
    })

    it('handles agent with missing mobile data', () => {
        const agentWithoutMobile = {
            ...mockAgent,
            mobile: null
        }

        render(<DeleteConfirmDialog {...mockProps} agent={agentWithoutMobile} />)

        const johnDoeElements = screen.getAllByText('John Doe')
        expect(johnDoeElements.length).toBeGreaterThan(0)
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        // Should handle missing mobile gracefully
    })

    it('calls onConfirm when delete button is clicked', () => {
        render(<DeleteConfirmDialog {...mockProps} />)

        fireEvent.click(screen.getByText('Delete Agent'))

        expect(mockProps.onConfirm).toHaveBeenCalledWith(mockAgent)
    })

    it('calls onCancel when cancel button is clicked', () => {
        render(<DeleteConfirmDialog {...mockProps} />)

        fireEvent.click(screen.getByText('Cancel'))

        expect(mockProps.onCancel).toHaveBeenCalled()
    })

    it('shows loading state when loading is true', () => {
        render(<DeleteConfirmDialog {...mockProps} loading={true} />)

        expect(screen.getByText('Deleting...')).toBeInTheDocument()
        expect(screen.getByText('Deleting...')).toBeDisabled()
        expect(screen.getByText('Cancel')).toBeDisabled()
    })

    it('shows normal state when loading is false', () => {
        render(<DeleteConfirmDialog {...mockProps} loading={false} />)

        expect(screen.getByText('Delete Agent')).toBeInTheDocument()
        expect(screen.getByText('Delete Agent')).not.toBeDisabled()
        expect(screen.getByText('Cancel')).not.toBeDisabled()
    })

    it('displays warning message about task assignments', () => {
        render(<DeleteConfirmDialog {...mockProps} />)

        expect(screen.getByText(/All tasks assigned to this agent will remain in the system/)).toBeInTheDocument()
        expect(screen.getByText(/but will no longer be associated with them/)).toBeInTheDocument()
    })

    it('renders with correct CSS classes', () => {
        render(<DeleteConfirmDialog {...mockProps} />)

        const overlay = document.querySelector('.modal-overlay')
        const dialog = document.querySelector('.delete-confirm-dialog')
        const header = document.querySelector('.dialog-header')
        const content = document.querySelector('.dialog-content')
        const actions = document.querySelector('.dialog-actions')

        expect(overlay).toBeInTheDocument()
        expect(dialog).toBeInTheDocument()
        expect(header).toBeInTheDocument()
        expect(content).toBeInTheDocument()
        expect(actions).toBeInTheDocument()
    })

    it('displays danger button styling for delete action', () => {
        render(<DeleteConfirmDialog {...mockProps} />)

        const deleteButton = screen.getByText('Delete Agent')
        expect(deleteButton).toHaveClass('btn', 'btn-danger')
    })

    it('displays secondary button styling for cancel action', () => {
        render(<DeleteConfirmDialog {...mockProps} />)

        const cancelButton = screen.getByText('Cancel')
        expect(cancelButton).toHaveClass('btn', 'btn-secondary')
    })

    it('handles undefined loading prop gracefully', () => {
        const propsWithoutLoading = {
            ...mockProps,
            loading: undefined
        }

        render(<DeleteConfirmDialog {...propsWithoutLoading} />)

        expect(screen.getByText('Delete Agent')).toBeInTheDocument()
        expect(screen.getByText('Delete Agent')).not.toBeDisabled()
    })

    it('shows agent name in confirmation text', () => {
        render(<DeleteConfirmDialog {...mockProps} />)

        const confirmationText = screen.getByText(/Are you sure you want to delete agent/)
        expect(confirmationText).toBeInTheDocument()

        // The agent name should be in a strong tag within the confirmation
        const strongElements = screen.getAllByText('John Doe')
        const strongElement = strongElements.find(el => el.tagName === 'STRONG')
        expect(strongElement).toBeTruthy()
    })
})