import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { apiClient } from '../services/apiClient'

const AuthContext = createContext()

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_START':
            return {
                ...state,
                loading: true,
                error: null
            }
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                user: action.payload.user,
                token: action.payload.token,
                error: null
            }
        case 'LOGIN_FAILURE':
            return {
                ...state,
                loading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                error: action.payload
            }
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                token: null,
                error: null
            }
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            }
        default:
            return state
    }
}

const initialState = {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null
}

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState)

    useEffect(() => {
        // Check for existing token on app load
        const token = localStorage.getItem('token')
        if (token) {
            // Check if token is expired
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                const currentTime = Date.now() / 1000

                if (payload.exp && payload.exp < currentTime) {
                    // Token is expired, remove it
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    dispatch({ type: 'SET_LOADING', payload: false })
                    return
                }

                // Set token in API client
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: {
                        token,
                        user: JSON.parse(localStorage.getItem('user') || '{}')
                    }
                })

                // Set up automatic logout when token expires
                const timeUntilExpiry = (payload.exp * 1000) - Date.now()
                if (timeUntilExpiry > 0) {
                    setTimeout(() => {
                        logout()
                    }, timeUntilExpiry)
                }
            } catch (error) {
                // Invalid token format, remove it
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            }
        }
        dispatch({ type: 'SET_LOADING', payload: false })
    }, [])

    const login = async (email, password) => {
        dispatch({ type: 'LOGIN_START' })
        try {
            const response = await apiClient.post('/auth/login', { email, password })
            const { token, user } = response.data

            // Store token and user in localStorage
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            // Set token in API client
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { token, user }
            })

            // Set up automatic logout when token expires
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                const timeUntilExpiry = (payload.exp * 1000) - Date.now()
                if (timeUntilExpiry > 0) {
                    setTimeout(() => {
                        logout()
                    }, timeUntilExpiry)
                }
            } catch (error) {
                console.warn('Could not parse token for expiration:', error)
            }

            return { success: true }
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || 'An unexpected error occurred'
            dispatch({
                type: 'LOGIN_FAILURE',
                payload: errorMessage
            })
            return { success: false, error: errorMessage }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete apiClient.defaults.headers.common['Authorization']
        dispatch({ type: 'LOGOUT' })
    }

    const value = {
        ...state,
        login,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}