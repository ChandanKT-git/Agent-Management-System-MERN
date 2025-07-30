import React, { useEffect } from 'react'
import { useNotification } from '../../contexts/NotificationContext'
import './Toast.css'

const Toast = ({ notification, onClose }) => {
    const { id, message, type } = notification

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id)
        }, 5000)

        return () => clearTimeout(timer)
    }, [id, onClose])

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓'
            case 'error':
                return '✕'
            case 'warning':
                return '⚠'
            default:
                return 'ℹ'
        }
    }

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-content">
                <p className="toast-message">{message}</p>
            </div>
            <button
                className="toast-close"
                onClick={() => onClose(id)}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    )
}

const ToastContainer = () => {
    const { notifications, removeNotification } = useNotification()

    if (notifications.length === 0) {
        return null
    }

    return (
        <div className="toast-container">
            {notifications.map(notification => (
                <Toast
                    key={notification.id}
                    notification={notification}
                    onClose={removeNotification}
                />
            ))}
        </div>
    )
}

export default ToastContainer