import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthCard from '../components/AuthCard'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('http://localhost:5001/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('If an account with that email exists, we\'ve sent a password reset link.')
        setEmail('')
      } else {
        setError(data.msg || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page fade-in">
      <AuthCard
        title="Forgot Password"
        subtitle="Enter your email address and we'll send you a password reset link"
        footer={
          <p className="auth-switch">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-text" style={{
              background: 'rgba(220, 38, 38, 0.1)',
              color: 'var(--error-color)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              background: 'rgba(5, 150, 105, 0.1)',
              color: 'var(--success-color)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              border: '1px solid rgba(5, 150, 105, 0.2)',
              fontSize: '0.9rem'
            }}>
              {message}
            </div>
          )}

          <label>
            <span>Email Address</span>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={isLoading}
            />
          </label>

          <button 
            type="submit" 
            className={`btn-primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </AuthCard>
    </div>
  )
}
