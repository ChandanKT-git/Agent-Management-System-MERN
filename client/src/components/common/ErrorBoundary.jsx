import React from 'react'
import { useNotification } from '../../contexts/NotificationContext'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        this.setState({
            error: error,
            errorInfo: errorInfo
        })

        // Log to external service in production
        if (process.env.NODE_ENV === 'production') {
            // Here you would send to your logging service
            // logErrorToService(error, errorInfo)
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <h2>Oops! Something went wrong</h2>
                        <p>We're sorry, but something unexpected happened. Please try refreshing the page.</p>

                        <div className="error-boundary-actions">
                            <button
                                onClick={this.handleRetry}
                                className="btn btn-primary"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-secondary"
                            >
                                Refresh Page
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <details className="error-details">
                                <summary>Error Details (Development Only)</summary>
                                <pre className="error-stack">
                                    {this.state.error && this.state.error.toString()}
                                    <br />
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

// Hook-based error boundary wrapper
export const withErrorBoundary = (Component, fallback) => {
    return function WrappedComponent(props) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        )
    }
}

export default ErrorBoundary