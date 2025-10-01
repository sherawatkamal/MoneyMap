import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'

export default function Login() {
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/planner')
  }

  return (
    <div className="auth-page">
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
          <label>
            <span>Email</span>
            <input type="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" placeholder="••••••••" required />
          </label>

          <div className="auth-actions">
            <label className="remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a className="link" href="#">Forgot password?</a>
          </div>

          <button type="submit" className="btn-primary">Sign in</button>
        </form>
      </AuthCard>
    </div>
  )
}


