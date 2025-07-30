import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { NotificationProvider } from './contexts/NotificationContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <NotificationProvider>
                <App />
            </NotificationProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)