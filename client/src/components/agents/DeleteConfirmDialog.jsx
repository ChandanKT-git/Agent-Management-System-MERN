import React from 'react'

const DeleteConfirmDialog = ({
    isOpen,
    agent,
    onConfirm,
    onCancel,
    loading = false
}) => {
    if (!isOpen || !agent) {
        return null
    }

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm(agent)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="delete-confirm-dialog">
                <div className="dialog-header">
                    <h3>Confirm Delete</h3>
                </div>

                <div className="dialog-content">
                    <p>
                        Are you sure you want to delete agent <strong>{agent.name}</strong>?
                    </p>
                    <p className="warning-text">
                        This action cannot be undone. All tasks assigned to this agent
                        will remain in the system but will no longer be associated with them.
                    </p>

                    <div className="agent-summary">
                        <div className="summary-item">
                            <label>Name:</label>
                            <span>{agent.name}</span>
                        </div>
                        <div className="summary-item">
                            <label>Email:</label>
                            <span>{agent.email}</span>
                        </div>
                        <div className="summary-item">
                            <label>Phone:</label>
                            <span>
                                {agent.mobile?.countryCode} {agent.mobile?.number}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="dialog-actions">
                    <button
                        onClick={onCancel}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="btn btn-danger"
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete Agent'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DeleteConfirmDialog