import React, { useState, useEffect } from 'react'
import { agentService } from '../../services/agentService'
import { useNotification } from '../../contexts/NotificationContext'
import {
    validateEmail,
    validatePhone,
    validateRequired
} from '../../utils/validation'

const EditAgent = ({ agent, onAgentUpdated, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        countryCode: '+1',
        phoneNumber: '',
        isActive: true
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const { addNotification } = useNotification()

    useEffect(() => {
        if (agent) {
            setFormData({
                name: agent.name || '',
                email: agent.email || '',
                countryCode: agent.mobile?.countryCode || '+1',
                phoneNumber: agent.mobile?.number || '',
                isActive: agent.isActive !== undefined ? agent.isActive : true
            })
        }
    }, [agent])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        // Name validation
        if (!validateRequired(formData.name)) {
            newErrors.name = 'Name is required'
        }

        // Email validation
        if (!validateRequired(formData.email)) {
            newErrors.email = 'Email is required'
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        // Phone validation
        if (!validateRequired(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number is required'
        } else if (!validatePhone(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Please enter a valid phone number'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)
        try {
            const updateData = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                mobile: {
                    countryCode: formData.countryCode,
                    number: formData.phoneNumber.trim()
                },
                isActive: formData.isActive
            }

            const updatedAgent = await agentService.updateAgent(agent._id, updateData)
            addNotification('Agent updated successfully', 'success')

            if (onAgentUpdated) {
                onAgentUpdated(updatedAgent)
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error?.message || 'Failed to update agent'
            addNotification(errorMessage, 'error')

            // Handle specific validation errors from server
            if (err.response?.data?.error?.details) {
                setErrors(err.response.data.error.details)
            }
        } finally {
            setLoading(false)
        }
    }

    if (!agent) {
        return <div>No agent selected for editing</div>
    }

    return (
        <div className="edit-agent-form">
            <h3>Edit Agent</h3>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? 'error' : ''}
                        placeholder="Enter agent's full name"
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'error' : ''}
                        placeholder="Enter email address"
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="countryCode">Country Code *</label>
                        <select
                            id="countryCode"
                            name="countryCode"
                            value={formData.countryCode}
                            onChange={handleChange}
                        >
                            <option value="+1">+1 (US/Canada)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+91">+91 (India)</option>
                            <option value="+61">+61 (Australia)</option>
                            <option value="+49">+49 (Germany)</option>
                            <option value="+33">+33 (France)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number *</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className={errors.phoneNumber ? 'error' : ''}
                            placeholder="Enter phone number"
                        />
                        {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                        />
                        <span>Active Agent</span>
                    </label>
                    <small className="form-help">
                        Inactive agents will not receive new task assignments
                    </small>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Agent'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default EditAgent