import { apiClient } from './apiClient'

export const agentService = {
    getAllAgents: async () => {
        const response = await apiClient.get('/agents')
        return response.data
    },

    getAgent: async (id) => {
        const response = await apiClient.get(`/agents/${id}`)
        return response.data
    },

    createAgent: async (agentData) => {
        const response = await apiClient.post('/agents', agentData)
        return response.data
    },

    updateAgent: async (id, agentData) => {
        const response = await apiClient.put(`/agents/${id}`, agentData)
        return response.data
    },

    deleteAgent: async (id) => {
        const response = await apiClient.delete(`/agents/${id}`)
        return response.data
    },

    getAgentTasks: async (id) => {
        const response = await apiClient.get(`/agents/${id}/tasks`)
        return response.data
    }
}