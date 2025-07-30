import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Login.css'

const Login = () => {
    const { login, loading, error } = useAuth()
    const navigate = useNavigate()
    const [submitError, setSubmitError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        mode: 'onBlur'
    })

    const onSubmit = async (data) => {
        setSubmitError('')

        try {
            const result = await login(data.email, data.password)

            if (result.success) {
                navigate('/dashboard')
            } else {
                setSubmitError(result.error || 'An unexpected error occurred')
            }
        } catch (err) {
            console.error('Login error:', err)
            setSubmitError('An unexpected error occurred')
        }
    }

    const isLoading = loading || isSubmitting

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Admin Login</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Please enter a valid email address'
                                }
                            })}
                            placeholder="Enter your email"
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <span className="error-message">{errors.email.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 6,
                                    message: 'Password must be at least 6 characters'
                                }
                            })}
                            placeholder="Enter your password"
                            disabled={isLoading}
                        />
                        {errors.password && (
                            <span className="error-message">{errors.password.message}</span>
                        )}
                    </div>

                    {(error || submitError) && (
                        <div className="error-banner">
                            {error || submitError}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`login-button ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login