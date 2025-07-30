import axios from 'axios'

// Create axios instance with base configuration
export const apiClient = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Helper function to check if error is retryable
const isRetryableError = (error) => {
    if (!error.response) {
        // Network errors are retryable
        return true
    }

    const status = error.response.status
    // Retry on server errors (5xx) and rate limiting (429)
    return status >= 500 || status === 429
}

// Helper function to calculate retry delay with exponential backoff
const getRetryDelay = (retryCount) => {
    return RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 1000
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle common errors and retries
apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // Handle authentication errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
            return Promise.reject(error)
        }

        // Handle retryable errors
        if (isRetryableError(error) && !originalRequest._retry) {
            originalRequest._retry = true
            originalRequest._retryCount = originalRequest._retryCount || 0

            if (originalRequest._retryCount < MAX_RETRIES) {
                originalRequest._retryCount++

                const delay = getRetryDelay(originalRequest._retryCount)
                console.log(`Retrying request (${originalRequest._retryCount}/${MAX_RETRIES}) after ${delay}ms`)

                await new Promise(resolve => setTimeout(resolve, delay))
                return apiClient(originalRequest)
            }
        }

        return Promise.reject(error)
    }
)

export default apiClient