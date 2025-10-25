import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthCard from '../components/AuthCard'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link')
      setTokenValid(false)
      return
    }

    // Verify token on component mount
    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:5001/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setTokenValid(true)
          setUserEmail(data.email || '')
        } else {
          setTokenValid(false)
          setError(data.msg || 'Invalid or expired reset link')
        }
      } catch (error) {
        console.error('Error:', error)
        setTokenValid(false)
        setError('Network error. Please try again.')
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5001/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Clear failed login attempts since password was reset successfully
        localStorage.removeItem('loginFailedAttempts')
        localStorage.removeItem('loginFailedAttemptsTimestamp')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(data.msg || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="auth-page fade-in">
        <AuthCard title="Verifying Reset Link..." subtitle="Please wait while we verify your reset link">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-spinner"></div>
          </div>
        </AuthCard>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="auth-page fade-in">
        <AuthCard
          title="Invalid Reset Link"
          subtitle="This password reset link is invalid or has expired"
          footer={
            <p className="auth-switch">
              <Link to="/forgot-password">Request a new reset link</Link>
            </p>
          }
        >
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            color: 'var(--error-color)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        </AuthCard>
      </div>
    )
  }

  if (success) {
    return (
      <div className="auth-page fade-in">
        <AuthCard
          title="Password Reset Successful!"
          subtitle="Your password has been updated successfully"
          footer={
            <p className="auth-switch">
              <Link to="/login">Sign in to your account</Link>
            </p>
          }
        >
          <div style={{
            background: 'rgba(5, 150, 105, 0.1)',
            color: 'var(--success-color)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(5, 150, 105, 0.2)',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            ✅ Password updated successfully! You will be redirected to the login page shortly.
          </div>
        </AuthCard>
      </div>
    )
  }

  return (
    <div className="auth-page fade-in">
      <AuthCard
        title="Reset Password"
        subtitle={`Enter your new password for ${userEmail}`}
        footer={
          <p className="auth-switch">
            <Link to="/login">Back to Sign In</Link>
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

          <label>
            <span>New Password</span>
            <input 
              type="password" 
              placeholder="Enter new password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              disabled={isLoading}
              minLength={8}
            />
          </label>

          <label>
            <span>Confirm New Password</span>
            <input 
              type="password" 
              placeholder="Confirm new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              disabled={isLoading}
              minLength={8}
            />
          </label>

          <div style={{
            background: 'rgba(5, 150, 105, 0.05)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem'
          }}>
            💡 Password must be at least 8 characters long
          </div>

          <button 
            type="submit" 
            className={`btn-primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !password || !confirmPassword}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </AuthCard>
    </div>
  )
}
