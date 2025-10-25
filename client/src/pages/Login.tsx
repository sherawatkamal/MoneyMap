import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Load failed attempts from localStorage on component mount
  useEffect(() => {
    const savedAttempts = localStorage.getItem('loginFailedAttempts')
    const savedTimestamp = localStorage.getItem('loginFailedAttemptsTimestamp')
    
    if (savedAttempts && savedTimestamp) {
      const attempts = parseInt(savedAttempts, 10)
      const timestamp = parseInt(savedTimestamp, 10)
      const now = Date.now()
      const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      
      // If more than 24 hours have passed, reset the attempts
      if (now - timestamp > twentyFourHours) {
        localStorage.removeItem('loginFailedAttempts')
        localStorage.removeItem('loginFailedAttemptsTimestamp')
        setFailedAttempts(0)
      } else {
        setFailedAttempts(attempts)
        
        // If 5 or more attempts, redirect to forgot password
        if (attempts >= 5) {
          navigate('/forgot-password')
        }
      }
    }
  }, [navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const success = await login(formData.email, formData.password)
      if (success) {
        // Reset failed attempts on successful login
        setFailedAttempts(0)
        localStorage.removeItem('loginFailedAttempts')
        localStorage.removeItem('loginFailedAttemptsTimestamp')
        navigate('/dashboard')
      } else {
        // Increment failed attempts
        const newFailedAttempts = failedAttempts + 1
        setFailedAttempts(newFailedAttempts)
        localStorage.setItem('loginFailedAttempts', newFailedAttempts.toString())
        localStorage.setItem('loginFailedAttemptsTimestamp', Date.now().toString())
        
        // If 5 or more attempts, redirect to forgot password
        if (newFailedAttempts >= 5) {
          navigate('/forgot-password')
          return
        }
        
        setError(`Invalid email or password. ${5 - newFailedAttempts} attempts remaining.`)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page fade-in">
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to continue to MoneyMap"
        footer={
          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          {failedAttempts > 0 && failedAttempts < 5 && (
            <div className="warning-text" style={{
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontSize: '0.9rem'
            }}>
              ⚠️ {failedAttempts} failed login attempt{failedAttempts > 1 ? 's' : ''}. 
              {failedAttempts >= 3 && ' Consider using "Forgot Password" if you\'re having trouble.'}
            </div>
          )}
          
          {error && (
            <div className="error-text" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error-color)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          
          <label>
            <span>Email</span>
            <input 
              type="email" 
              name="email"
              placeholder="you@example.com" 
              value={formData.email}
              onChange={handleInputChange}
              required 
            />
          </label>
          <label>
            <span>Password</span>
            <input 
              type="password" 
              name="password"
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleInputChange}
              required 
            />
          </label>

              <div className="auth-actions">
                <label className="remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="link">Forgot password?</Link>
              </div>

          <button 
            type="submit" 
            className={`btn-primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </AuthCard>
    </div>
  )
}


