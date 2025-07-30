import { useState, useCallback } from 'react'
import { useNotification } from '../contexts/NotificationContext'

export const useApi = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const { addNotification } = useNotification()

    const execute = useCallback(async (apiCall, options = {}) => {
        const {
            showSuccessMessage = false,
            successMessage = 'Operation completed successfully',
            showErrorMessage = true,
            onSuccess,
            onError
        } = options

        setLoading(true)
        setError(null)

        try {
            const result = await apiCall()

            if (showSuccessMessage) {
                addNotification(successMessage, 'success')
            }

            if (onSuccess) {
                onSuccess(result)
            }

            return result
        } catch (err) {
            const errorMessage = err.response?.data?.error?.message || err.message || 'An error occurred'
            setError(errorMessage)

            if (showErrorMessage) {
                addNotification(errorMessage, 'error')
            }

            if (onError) {
                onError(err)
            }

            throw err
        } finally {
            setLoading(false)
        }
    }, [addNotification])

    return { execute, loading, error }
}