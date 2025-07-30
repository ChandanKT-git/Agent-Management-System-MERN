import React from 'react'
import './UploadProgress.css'

const UploadProgress = ({ progress, onCancel }) => {
    return (
        <div className="upload-progress">
            <div className="progress-header">
                <h4>Uploading File</h4>
                <span className="progress-percentage">{progress}%</span>
            </div>

            <div className="progress-bar-container">
                <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="progress-details">
                <span className="progress-status">
                    {progress < 50 ? 'Uploading...' :
                        progress < 90 ? 'Processing...' :
                            progress < 100 ? 'Finalizing...' : 'Complete!'}
                </span>

                {progress < 100 && onCancel && (
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={onCancel}
                        type="button"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}

export default UploadProgress