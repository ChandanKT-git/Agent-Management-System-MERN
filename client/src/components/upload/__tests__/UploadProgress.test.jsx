import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import UploadProgress from '../UploadProgress'

describe('UploadProgress Component', () => {
    const mockOnCancel = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('renders progress with correct percentage', () => {
        render(<UploadProgress progress={45} onCancel={mockOnCancel} />)

        expect(screen.getByText('Uploading File')).toBeInTheDocument()
        expect(screen.getByText('45%')).toBeInTheDocument()
    })

    test('displays correct status based on progress', () => {
        // Test uploading status (< 50%)
        const { rerender } = render(<UploadProgress progress={25} onCancel={mockOnCancel} />)
        expect(screen.getByText('Uploading...')).toBeInTheDocument()

        // Test processing status (50-89%)
        rerender(<UploadProgress progress={75} onCancel={mockOnCancel} />)
        expect(screen.getByText('Processing...')).toBeInTheDocument()

        // Test finalizing status (90-99%)
        rerender(<UploadProgress progress={95} onCancel={mockOnCancel} />)
        expect(screen.getByText('Finalizing...')).toBeInTheDocument()

        // Test complete status (100%)
        rerender(<UploadProgress progress={100} onCancel={mockOnCancel} />)
        expect(screen.getByText('Complete!')).toBeInTheDocument()
    })

    test('shows cancel button when progress is less than 100%', () => {
        render(<UploadProgress progress={50} onCancel={mockOnCancel} />)

        const cancelButton = screen.getByText('Cancel')
        expect(cancelButton).toBeInTheDocument()
    })

    test('hides cancel button when progress is 100%', () => {
        render(<UploadProgress progress={100} onCancel={mockOnCancel} />)

        expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })

    test('calls onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup()
        render(<UploadProgress progress={50} onCancel={mockOnCancel} />)

        const cancelButton = screen.getByText('Cancel')
        await user.click(cancelButton)

        expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    test('does not show cancel button when onCancel is not provided', () => {
        render(<UploadProgress progress={50} />)

        expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })

    test('progress bar width matches percentage', () => {
        render(<UploadProgress progress={60} onCancel={mockOnCancel} />)

        const progressBar = document.querySelector('.progress-bar')
        expect(progressBar).toHaveStyle('width: 60%')
    })

    test('handles edge cases for progress values', () => {
        // Test 0% progress
        const { rerender } = render(<UploadProgress progress={0} onCancel={mockOnCancel} />)
        expect(screen.getByText('0%')).toBeInTheDocument()
        expect(screen.getByText('Uploading...')).toBeInTheDocument()

        // Test exactly 50% progress
        rerender(<UploadProgress progress={50} onCancel={mockOnCancel} />)
        expect(screen.getByText('50%')).toBeInTheDocument()
        expect(screen.getByText('Processing...')).toBeInTheDocument()

        // Test exactly 90% progress
        rerender(<UploadProgress progress={90} onCancel={mockOnCancel} />)
        expect(screen.getByText('90%')).toBeInTheDocument()
        expect(screen.getByText('Finalizing...')).toBeInTheDocument()
    })

    test('renders with correct CSS classes', () => {
        render(<UploadProgress progress={50} onCancel={mockOnCancel} />)

        expect(document.querySelector('.upload-progress')).toBeInTheDocument()
        expect(document.querySelector('.progress-header')).toBeInTheDocument()
        expect(document.querySelector('.progress-bar-container')).toBeInTheDocument()
        expect(document.querySelector('.progress-bar')).toBeInTheDocument()
        expect(document.querySelector('.progress-details')).toBeInTheDocument()
    })
})