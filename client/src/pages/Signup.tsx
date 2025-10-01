import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'

export default function Signup() {
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/planner')
  }

  return (
    <div className="auth-page">
      <AuthCard
        title="Create your account"
        subtitle="Start managing your finances with MoneyMap"
        footer={
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input type="text" placeholder="Your name" required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" placeholder="Create a strong password" required />
          </label>
          <label>
            <span>Confirm Password</span>
            <input type="password" placeholder="Repeat your password" required />
          </label>

          <button type="submit" className="btn-primary">Create account</button>
        </form>
      </AuthCard>
    </div>
  )
}


