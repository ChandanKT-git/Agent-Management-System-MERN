import { apiClient } from './apiClient'

export const authService = {
    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password })
        return response.data
    },

    logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete apiClient.defaults.headers.common['Authorization']
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user')
        return user ? JSON.parse(user) : null
    },

    getToken: () => {
        return localStorage.getItem('token')
    },

    isAuthenticated: () => {
        const token = localStorage.getItem('token')
        return !!token
    }
}