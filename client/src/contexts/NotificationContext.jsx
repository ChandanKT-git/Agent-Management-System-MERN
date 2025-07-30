import React, { createContext, useContext, useReducer } from 'react'

const NotificationContext = createContext()

const notificationReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [...state.notifications, action.payload]
            }
        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(
                    notification => notification.id !== action.payload
                )
            }
        case 'CLEAR_NOTIFICATIONS':
            return {
                ...state,
                notifications: []
            }
        default:
            return state
    }
}

const initialState = {
    notifications: []
}

export const NotificationProvider = ({ children }) => {
    const [state, dispatch] = useReducer(notificationReducer, initialState)

    const addNotification = (message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random()
        const notification = { id, message, type }

        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: notification
        })

        // Auto-remove notification after duration
        if (duration > 0) {
            setTimeout(() => {
                dispatch({
                    type: 'REMOVE_NOTIFICATION',
                    payload: id
                })
            }, duration)
        }

        return id
    }

    const removeNotification = (id) => {
        dispatch({
            type: 'REMOVE_NOTIFICATION',
            payload: id
        })
    }

    const clearNotifications = () => {
        dispatch({ type: 'CLEAR_NOTIFICATIONS' })
    }

    const value = {
        notifications: state.notifications,
        addNotification,
        removeNotification,
        clearNotifications
    }

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotification = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}