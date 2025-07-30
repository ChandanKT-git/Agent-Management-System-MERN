import React, { useState } from 'react'
import { agentService } from '../../services/agentService'
import { useNotification } from '../../contexts/NotificationContext'
import {
    validateEmail,
    validatePhone,
    validateRequired,
    validateMinLength,
    validatePasswordStrength,
    getPasswordStrength,
    sanitizeInput
} from '../../utils/validation'
import './AddAgent.css'

const AddAgent = ({ onAgentAdded, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        countryCode: '+1',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' })
    const { addNotification } = useNotification()

    const handleChange = (e) => {
        const { name, value } = e.target

        // Sanitize input to prevent XSS
        const sanitizedValue = sanitizeInput(value)

        setFormData(prev => ({
            ...prev,
            [name]: sanitizedValue
        }))

        // Update password strength indicator
        if (name === 'password') {
            setPasswordStrength(getPasswordStrength(sanitizedValue))
        }

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

        // Enhanced password validation
        if (!validateRequired(formData.password)) {
            newErrors.password = 'Password is required'
        } else if (!validatePasswordStrength(formData.password)) {
            newErrors.password = 'Password must be strong (8+ chars, uppercase, lowercase, number, special character)'
        }

        // Confirm password validation
        if (!validateRequired(formData.confirmPassword)) {
            newErrors.confirmPassword = 'Please confirm your password'
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
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
            const agentData = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                mobile: {
                    countryCode: formData.countryCode,
                    number: formData.phoneNumber.trim()
                },
                password: formData.password
            }

            const newAgent = await agentService.createAgent(agentData)
            addNotification('Agent created successfully', 'success')

            if (onAgentAdded) {
                onAgentAdded(newAgent)
            }

            // Reset form
            setFormData({
                name: '',
                email: '',
                countryCode: '+1',
                phoneNumber: '',
                password: '',
                confirmPassword: ''
            })
        } catch (err) {
            const errorMessage = err.response?.data?.error?.message || 'Failed to create agent'
            addNotification(errorMessage, 'error')

            // Handle specific validation errors from server
            if (err.response?.data?.error?.details) {
                setErrors(err.response.data.error.details)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="add-agent-form">
            <h3>Add New Agent</h3>

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
                    <label htmlFor="password">Password *</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? 'error' : ''}
                        placeholder="Enter strong password"
                    />
                    {formData.password && (
                        <div className={`password-strength strength-${passwordStrength.score}`}>
                            <div className="strength-bar">
                                <div
                                    className="strength-fill"
                                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                ></div>
                            </div>
                            <span className="strength-text">
                                {passwordStrength.strength}: {passwordStrength.feedback}
                            </span>
                        </div>
                    )}
                    {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password *</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={errors.confirmPassword ? 'error' : ''}
                        placeholder="Confirm password"
                    />
                    {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
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
                        {loading ? 'Creating...' : 'Create Agent'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AddAgent