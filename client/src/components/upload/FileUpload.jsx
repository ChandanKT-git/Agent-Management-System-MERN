import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNotification } from '../../contexts/NotificationContext'
import { uploadService } from '../../services/uploadService'
import { validateFileType, validateFileSize } from '../../utils/validation'
import FilePreview from './FilePreview'
import UploadProgress from './UploadProgress'
import './FileUpload.css'

const ACCEPTED_FILE_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx']
const MAX_FILE_SIZE_MB = 5

const FileUpload = ({ onUploadSuccess }) => {
    const [uploadState, setUploadState] = useState({
        isUploading: false,
        progress: 0,
        uploadedFile: null,
        previewData: null,
        error: null
    })

    const { addNotification } = useNotification()

    const validateFile = useCallback((file) => {
        const errors = []

        // Check file type
        const isValidType = validateFileType(file, ACCEPTED_FILE_TYPES) ||
            ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))

        if (!isValidType) {
            errors.push(`Invalid file type. Please upload CSV, XLS, or XLSX files only.`)
        }

        // Check file size
        if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
            errors.push(`File size must be less than ${MAX_FILE_SIZE_MB}MB.`)
        }

        // Check if file is empty
        if (file.size === 0) {
            errors.push('File appears to be empty. Please select a valid file.')
        }

        return errors
    }, [])

    const parseCSVPreview = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                try {
                    const text = e.target.result
                    const lines = text.split('\n').filter(line => line.trim())

                    if (lines.length === 0) {
                        reject(new Error('File appears to be empty'))
                        return
                    }

                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
                    const requiredColumns = ['FirstName', 'Phone', 'Notes']
                    const missingColumns = requiredColumns.filter(col =>
                        !headers.some(header => header.toLowerCase() === col.toLowerCase())
                    )

                    if (missingColumns.length > 0) {
                        reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`))
                        return
                    }

                    // Parse first few rows for preview
                    const previewRows = lines.slice(1, 6).map(line => {
                        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
                        const row = {}
                        headers.forEach((header, index) => {
                            row[header] = values[index] || ''
                        })
                        return row
                    })

                    resolve({
                        headers,
                        rows: previewRows,
                        totalRows: lines.length - 1,
                        requiredColumns: requiredColumns.filter(col =>
                            headers.some(header => header.toLowerCase() === col.toLowerCase())
                        )
                    })
                } catch (error) {
                    reject(new Error('Failed to parse CSV file. Please check the file format.'))
                }
            }

            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        })
    }, [])

    const handleFileDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
        // Handle rejected files
        if (rejectedFiles.length > 0) {
            const errors = rejectedFiles.map(({ file, errors }) =>
                `${file.name}: ${errors.map(e => e.message).join(', ')}`
            )
            setUploadState(prev => ({ ...prev, error: errors.join('\n') }))
            addNotification('Some files were rejected. Please check the file requirements.', 'error')
            return
        }

        if (acceptedFiles.length === 0) {
            return
        }

        const file = acceptedFiles[0]

        // Validate file
        const validationErrors = validateFile(file)
        if (validationErrors.length > 0) {
            setUploadState(prev => ({ ...prev, error: validationErrors.join('\n') }))
            addNotification(validationErrors[0], 'error')
            return
        }

        // Clear previous state
        setUploadState(prev => ({
            ...prev,
            error: null,
            uploadedFile: file,
            previewData: null
        }))

        // Generate preview for CSV files
        if (file.name.toLowerCase().endsWith('.csv')) {
            try {
                const previewData = await parseCSVPreview(file)
                setUploadState(prev => ({ ...prev, previewData }))
            } catch (error) {
                setUploadState(prev => ({ ...prev, error: error.message }))
                addNotification(error.message, 'error')
                return
            }
        }

        addNotification('File selected successfully. Click upload to process.', 'success')
    }, [validateFile, parseCSVPreview, addNotification])

    const handleUpload = useCallback(async () => {
        if (!uploadState.uploadedFile) {
            addNotification('Please select a file first.', 'error')
            return
        }

        setUploadState(prev => ({
            ...prev,
            isUploading: true,
            progress: 0,
            error: null
        }))

        try {
            const result = await uploadService.uploadFile(
                uploadState.uploadedFile,
                (progress) => {
                    setUploadState(prev => ({ ...prev, progress }))
                }
            )

            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                progress: 100
            }))

            addNotification('File uploaded and distributed successfully!', 'success')

            if (onUploadSuccess) {
                onUploadSuccess(result)
            }

            // Reset state after successful upload
            setTimeout(() => {
                setUploadState({
                    isUploading: false,
                    progress: 0,
                    uploadedFile: null,
                    previewData: null,
                    error: null
                })
            }, 2000)

        } catch (error) {
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                progress: 0,
                error: error.response?.data?.error?.message || error.message || 'Upload failed'
            }))
            addNotification('Upload failed. Please try again.', 'error')
        }
    }, [uploadState.uploadedFile, addNotification, onUploadSuccess])

    const handleCancel = useCallback(() => {
        setUploadState({
            isUploading: false,
            progress: 0,
            uploadedFile: null,
            previewData: null,
            error: null
        })
        addNotification('Upload cancelled.', 'info')
    }, [addNotification])

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop: handleFileDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
        multiple: false,
        disabled: uploadState.isUploading
    })

    return (
        <div className="file-upload-container">
            <div className="file-upload-header">
                <h2>Upload Contact List</h2>
                <p className="file-upload-description">
                    Upload a CSV, XLS, or XLSX file containing contact information.
                    The file must include FirstName, Phone, and Notes columns.
                </p>
            </div>

            <div
                {...getRootProps()}
                className={`file-dropzone ${isDragActive ? 'drag-active' : ''} ${isDragReject ? 'drag-reject' : ''} ${uploadState.isUploading ? 'disabled' : ''}`}
            >
                <input {...getInputProps()} />

                <div className="dropzone-content">
                    <div className="dropzone-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10,9 9,9 8,9" />
                        </svg>
                    </div>

                    {uploadState.isUploading ? (
                        <div className="dropzone-text">
                            <p>Uploading...</p>
                        </div>
                    ) : isDragActive ? (
                        <div className="dropzone-text">
                            <p>Drop the file here...</p>
                        </div>
                    ) : (
                        <div className="dropzone-text">
                            <p><strong>Click to upload</strong> or drag and drop</p>
                            <p className="dropzone-hint">CSV, XLS, XLSX files up to {MAX_FILE_SIZE_MB}MB</p>
                        </div>
                    )}
                </div>
            </div>

            {uploadState.error && (
                <div className="file-upload-error">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                        <h4>Upload Error</h4>
                        <pre>{uploadState.error}</pre>
                    </div>
                </div>
            )}

            {uploadState.uploadedFile && !uploadState.error && (
                <div className="file-info">
                    <div className="file-details">
                        <div className="file-icon">📄</div>
                        <div className="file-meta">
                            <p className="file-name">{uploadState.uploadedFile.name}</p>
                            <p className="file-size">
                                {(uploadState.uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {uploadState.isUploading && (
                <UploadProgress
                    progress={uploadState.progress}
                    onCancel={handleCancel}
                />
            )}

            {uploadState.previewData && !uploadState.isUploading && (
                <FilePreview
                    data={uploadState.previewData}
                    fileName={uploadState.uploadedFile?.name}
                />
            )}

            {uploadState.uploadedFile && !uploadState.isUploading && !uploadState.error && (
                <div className="file-upload-actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={uploadState.isUploading}
                    >
                        Upload and Distribute
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleCancel}
                        disabled={uploadState.isUploading}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    )
}

export default FileUpload