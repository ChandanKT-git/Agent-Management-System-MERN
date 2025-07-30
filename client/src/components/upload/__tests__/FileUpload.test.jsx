import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileUpload from '../FileUpload'

// Mock the upload service
vi.mock('../../../services/uploadService', () => ({
    uploadFile: vi.fn(),
    previewFile: vi.fn()
}))

describe('FileUpload', () => {
    const mockOnUploadSuccess = vi.fn()
    const mockOnUploadError = vi.fn()

    const defaultProps = {
        onUploadSuccess: mockOnUploadSuccess,
        onUploadError: mockOnUploadError
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders file upload interface', () => {
        render(<FileUpload {...defaultProps} />)

        expect(screen.getByText('Upload Agent Data')).toBeInTheDocument()
        expect(screen.getByText('Choose File')).toBeInTheDocument()
        expect(screen.getByLabelText('Target Agents')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    })

    it('accepts file selection', async () => {
        const user = userEvent.setup()
        render(<FileUpload {...defaultProps} />)

        const file = new File(['test content'], 'test.csv', { type: 'text/csv' })
        const fileInput = screen.getByLabelText('Choose file to upload')

        await user.upload(fileInput, file)

        expect(screen.getByText('test.csv')).toBeInTheDocument()
    })

    it('validates file type', async () => {
        const user = userEvent.setup()
        render(<FileUpload {...defaultProps} />)

        const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
        const fileInput = screen.getByLabelText('Choose file to upload')

        await user.upload(fileInput, file)

        expect(screen.getByText('Please select a CSV or Excel file')).toBeInTheDocument()
    })

    it('validates file size', async () => {
        const user = userEvent.setup()
        render(<FileUpload {...defaultProps} />)

        // Create a large file (over 5MB)
        const largeContent = 'x'.repeat(6 * 1024 * 1024)
        const file = new File([largeContent], 'large.csv', { type: 'text/csv' })
        const fileInput = screen.getByLabelText('Choose file to upload')

        await user.upload(fileInput, file)

        expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument()
    })

    it('validates target agents input', async () => {
        const user = userEvent.setup()
        render(<FileUpload {...defaultProps} />)

        const targetAgentsInput = screen.getByLabelText('Target Agents')
        await user.clear(targetAgentsInput)
        await user.type(targetAgentsInput, '0')

        const uploadButton = screen.getByRole('button', { name: 'Upload' })
        await user.click(uploadButton)

        expect(screen.getByText('Target agents must be between 1 and 10')).toBeInTheDocument()
    })

    it('shows preview when preview button is clicked', async () => {
        const user = userEvent.setup()
        const { previewFile } = await import('../../../services/uploadService')

        previewFile.mockResolvedValue({
            success: true,
            data: {
                preview: {
                    totalItems: 5,
                    totalAgents: 3,
                    itemsPerAgent: 1,
                    remainderItems: 2,
                    agents: [
                        { name: 'Agent 1', itemCount: 2 },
                        { name: 'Agent 2', itemCount: 2 },
                        { name: 'Agent 3', itemCount: 1 }
                    ]
                }
            }
        })

        render(<FileUpload {...defaultProps} />)

        const file = new File(['FirstName,Phone,Notes\nJohn,123,Note'], 'test.csv', { type: 'text/csv' })
        const fileInput = screen.getByLabelText('Choose file to upload')
        await user.upload(fileInput, file)

        const previewButton = screen.getByRole('button', { name: 'Preview' })
        await user.click(previewButton)

        await waitFor(() => {
            expect(screen.getByText('Distribution Preview')).toBeInTheDocument()
            expect(screen.getByText('Total Items: 5')).toBeInTheDocument()
            expect(screen.getByText('Total Agents: 3')).toBeInTheDocument()
        })
    })

    it('uploads file successfully', async () => {
        const user = userEvent.setup()
        const { uploadFile } = await import('../../../services/uploadService')

        uploadFile.mockResolvedValue({
            success: true,
            data: {
                distribution: { id: '123', totalItems: 5 },
                tasksCreated: 5
            }
        })

        render(<FileUpload {...defaultProps} />)

        const file = new File(['FirstName,Phone,Notes\nJohn,123,Note'], 'test.csv', { type: 'text/csv' })
        const fileInput = screen.getByLabelText('Choose file to upload')
        await user.upload(fileInput, file)

        const uploadButton = screen.getByRole('button', { name: 'Upload' })
        await user.click(uploadButton)

        await waitFor(() => {
            expect(mockOnUploadSuccess).toHaveBeenCalledWith({
                distribution: { id: '123', totalItems: 5 },
                tasksCreated: 5
            })
        })
    })

    it('handles upload error', async () => {
        const user = userEvent.setup()
        const { uploadFile } = await import('../../../services/uploadService')

        uploadFile.mockRejectedValue(new Error('Upload failed'))

        render(<FileUpload {...defaultProps} />)

        const file = new File(['FirstName,Phone,Notes\nJohn,123,Note'], 'test.csv', { type: 'text/csv' })
        const fileInput = screen.getByLabelText('Choose file to upload')
        await user.upload(fileInput, file)

        const uploadButton = screen.getByRole('button', { name: 'Upload' })
        await user.click(uploadButton)

        await waitFor(() => {
            expect(mockOnUploadError).toHaveBeenCalledWith('Upload failed')
        })
    })

    it('shows loading state during upload', async () => {
        const user = userEvent.setup()
        const { uploadFile } = await import('../../../services/uploadService')

        uploadFile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

        render(<FileUpload {...defaultProps} />)

        const file = new File(['FirstName,Phone,Notes\nJohn,123,Note'], 'test.csv', { type: 'text/csv' })
        const fileInput = screen.getByLabelText('Choose file to upload')
        await user.upload(fileInput, file)

        const uploadButton = screen.getByRole('button', { name: 'Upload' })
        await user.click(uploadButton)

        expect(screen.getByText('Uploading...')).toBeInTheDocument()
        expect(uploadButton).toBeDisabled()
    })

    it('allows file removal', async () => {
        const user = userEvent.setup()
        render(<FileUpload {...defaultProps} />)

        const file = new File(['test content'], 'test.csv', { type: 'text/csv' })
        const fileInput = screen.getByLabelText('Choose file to upload')
        await user.upload(fileInput, file)

        expect(screen.getByText('test.csv')).toBeInTheDocument()

        const removeButton = screen.getByRole('button', { name: 'Remove file' })
        await user.click(removeButton)

        expect(screen.queryByText('test.csv')).not.toBeInTheDocument()
    })

    it('resets form after successful upload', async () => {
        const user = userEvent.setup()
        const { uploadFile } = await import('../../../services/uploadService')

        uploadFile.mockResolvedValue({
            success: true,
            data: { distribution: { id: '123' }, tasksCreated: 5 }
        })

        render(<FileUpload {...defaultProps} />)

        const file = new File(['FirstName,Phone,Notes\nJohn,123,Note'], 'test.csv', { type: 'text/csv' })
        const fileInput = screen.getByLabelText('Choose file to upload')
        await user.upload(fileInput, file)

        const uploadButton = screen.getByRole('button', { name: 'Upload' })
        await user.click(uploadButton)

        await waitFor(() => {
            expect(mockOnUploadSuccess).toHaveBeenCalled()
        })

        // Form should be reset
        expect(screen.queryByText('test.csv')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Target Agents')).toHaveValue('5')
    })

    it('handles drag and drop', async () => {
        render(<FileUpload {...defaultProps} />)

        const dropZone = screen.getByText('Choose File').closest('.file-upload-area')
        const file = new File(['test content'], 'test.csv', { type: 'text/csv' })

        fireEvent.dragEnter(dropZone)
        expect(dropZone).toHaveClass('drag-over')

        fireEvent.drop(dropZone, {
            dataTransfer: {
                files: [file]
            }
        })

        await waitFor(() => {
            expect(screen.getByText('test.csv')).toBeInTheDocument()
        })
    })

    it('shows file format requirements', () => {
        render(<FileUpload {...defaultProps} />)

        expect(screen.getByText('Supported formats: CSV, XLSX, XLS')).toBeInTheDocument()
        expect(screen.getByText('Maximum file size: 5MB')).toBeInTheDocument()
        expect(screen.getByText('Required columns: FirstName, Phone, Notes')).toBeInTheDocument()
    })
})