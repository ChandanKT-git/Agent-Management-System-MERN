import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import ToastContainer from './components/common/Toast'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './components/auth/Login'
import Dashboard from './components/dashboard/Dashboard'
import AgentManagement from './components/agents/AgentManagement'
import AgentTaskList from './components/agents/AgentTaskList'
import FileUpload from './components/upload/FileUpload'
import DistributionView from './components/distributions/DistributionView'
import DistributionDetail from './components/distributions/DistributionDetail'
import './App.css'

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <NotificationProvider>
                    <Router>
                        <div className="App">
                            <ToastContainer />
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/agents"
                                    element={
                                        <ProtectedRoute>
                                            <AgentManagement />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/agents/:id/tasks"
                                    element={
                                        <ProtectedRoute>
                                            <AgentTaskList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/upload"
                                    element={
                                        <ProtectedRoute>
                                            <FileUpload />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/distributions"
                                    element={
                                        <ProtectedRoute>
                                            <DistributionView />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/distributions/:id"
                                    element={
                                        <ProtectedRoute>
                                            <DistributionDetail />
                                        </ProtectedRoute>
                                    }
                                />
                            </Routes>
                        </div>
                    </Router>
                </NotificationProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App