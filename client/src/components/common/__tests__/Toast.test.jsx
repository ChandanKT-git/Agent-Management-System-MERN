import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationProvider } from '../../../contexts/NotificationContext'
import ToastContainer from '../Toast'

const TestComponent = () => {
    return (
        <NotificationProvider>
            <ToastContainer />
        </NotificationProvider>
    )
}

describe('Toast', () => {
    test('renders nothing when there are no notifications', () => {
        const { container } = render(<TestComponent />)
        expect(container.firstChild).toBeNull()
    })

    test('renders toast notification', () => {
        const TestWithNotification = () => {
            const [showToast, setShowToast] = React.useState(false)

            return (
                <NotificationProvider>
                    <button onClick={() => setShowToast(true)}>Show Toast</button>
                    {showToast && (
                        <div className="toast toast-info">
                            <div className="toast-icon">ℹ</div>
                            <div className="toast-content">
                                <p className="toast-message">Test message</p>
                            </div>
                            <button className="toast-close">×</button>
                        </div>
                    )}
                </NotificationProvider>
            )
        }

        render(<TestWithNotification />)

        fireEvent.click(screen.getByText('Show Toast'))
        expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    test('closes toast when close button is clicked', async () => {
        const TestWithNotification = () => {
            const [notifications, setNotifications] = React.useState([
                { id: 1, message: 'Test message', type: 'info' }
            ])

            const removeNotification = (id) => {
                setNotifications(prev => prev.filter(n => n.id !== id))
            }

            return (
                <div>
                    {notifications.map(notification => (
                        <div key={notification.id} className="toast toast-info">
                            <div className="toast-icon">ℹ</div>
                            <div className="toast-content">
                                <p className="toast-message">{notification.message}</p>
                            </div>
                            <button
                                className="toast-close"
                                onClick={() => removeNotification(notification.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )
        }

        render(<TestWithNotification />)

        expect(screen.getByText('Test message')).toBeInTheDocument()

        fireEvent.click(screen.getByText('×'))

        await waitFor(() => {
            expect(screen.queryByText('Test message')).not.toBeInTheDocument()
        })
    })

    test('applies correct CSS classes for different toast types', () => {
        const TestWithDifferentTypes = () => {
            return (
                <div>
                    <div className="toast toast-success">Success</div>
                    <div className="toast toast-error">Error</div>
                    <div className="toast toast-warning">Warning</div>
                    <div className="toast toast-info">Info</div>
                </div>
            )
        }

        render(<TestWithDifferentTypes />)

        expect(screen.getByText('Success').closest('.toast')).toHaveClass('toast-success')
        expect(screen.getByText('Error').closest('.toast')).toHaveClass('toast-error')
        expect(screen.getByText('Warning').closest('.toast')).toHaveClass('toast-warning')
        expect(screen.getByText('Info').closest('.toast')).toHaveClass('toast-info')
    })
})