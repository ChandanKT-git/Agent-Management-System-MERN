import { apiClient } from './apiClient'

export const distributionService = {
    getAllDistributions: async () => {
        const response = await apiClient.get('/distributions')
        return response.data
    },

    getDistribution: async (id) => {
        const response = await apiClient.get(`/distributions/${id}`)
        return response.data
    }
}