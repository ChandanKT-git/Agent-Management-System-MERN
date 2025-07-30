import { apiClient } from './apiClient'

export const uploadService = {
    uploadFile: async (file, onUploadProgress) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await apiClient.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (onUploadProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    )
                    onUploadProgress(percentCompleted)
                }
            }
        })

        return response.data
    }
}