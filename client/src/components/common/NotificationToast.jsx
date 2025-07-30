import React from 'react'

const NotificationToast = ({ message, type = 'info', onClose }) => {
    return (
        <div className={`notification-toast ${type}`}>
            <span>{message}</span>
            {onClose && (
                <button onClick={onClose} className="close-btn">
                    ×
                </button>
            )}
        </div>
    )
}

export default NotificationToast