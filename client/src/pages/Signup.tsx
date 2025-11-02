import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import { useAuth } from '../contexts/AuthContext'

declare global {
  interface Window {
    google: any;
  }
}

export default function Signup() {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    occupation: '',
    annualIncome: '',
    currentSavings: '',
    monthlyExpenses: '',
    financialGoal: '',
    riskTolerance: '',
    phone: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleCredentialResponse,
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signup_with',
        });
      }
    };

    // Wait for Google API to load
    const checkGoogleApi = setInterval(() => {
      if (window.google) {
        initializeGoogleSignIn();
        clearInterval(checkGoogleApi);
      }
    }, 100);

    return () => clearInterval(checkGoogleApi);
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (response.credential) {
      setIsLoading(true);

      try {
        const googleToken = response.credential;
        const success = await loginWithGoogle(googleToken);
        
        if (success) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Google sign-up error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    const newErrors: {[key: string]: string} = {}
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 100)) {
      newErrors.age = 'Age must be between 18 and 100'
    }
    
    if (formData.annualIncome && parseFloat(formData.annualIncome) < 0) {
      newErrors.annualIncome = 'Annual income cannot be negative'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // Send data to backend
      const response = await fetch('http://localhost:5001/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Success - automatically log the user in and redirect to visualization
        const loginSuccess = await login(formData.email, formData.password)
        if (loginSuccess) {
          navigate('/visualization')
        } else {
          // If auto-login fails, redirect to login page
          navigate('/login')
        }
      } else {
        // Show error message
        setErrors({ submit: result.msg || 'Registration failed' })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>👤 Basic Information</h3>
              <p>Tell us about yourself</p>
            </div>
            <div className="form-grid">
              <label>
                <span>Full Name</span>
                <input 
                  type="text" 
                  name="name"
                  placeholder="Your full name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                  required 
                />
                {errors.name && <small className="error-text">{errors.name}</small>}
              </label>
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
                <span>Phone Number</span>
                <input 
                  type="tel" 
                  name="phone"
                  placeholder="+1 (555) 123-4567" 
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                <span>Age</span>
                <input 
                  type="number" 
                  name="age"
                  placeholder="25" 
                  value={formData.age}
                  onChange={handleInputChange}
                  className={errors.age ? 'error' : ''}
                  min="18"
                  max="100"
                />
                {errors.age && <small className="error-text">{errors.age}</small>}
              </label>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>💰 Financial Foundation</h3>
              <p>Help us understand your financial situation</p>
            </div>
            <div className="form-grid">
              <label>
                <span>Occupation</span>
                <input 
                  type="text" 
                  name="occupation"
                  placeholder="Software Engineer, Teacher, etc." 
                  value={formData.occupation}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                <span>Annual Income ($)</span>
                <input 
                  type="number" 
                  name="annualIncome"
                  placeholder="75000" 
                  value={formData.annualIncome}
                  onChange={handleInputChange}
                  className={errors.annualIncome ? 'error' : ''}
                  min="0"
                />
                {errors.annualIncome && <small className="error-text">{errors.annualIncome}</small>}
              </label>
              <label>
                <span>🏦 Current Savings ($)</span>
                <input 
                  type="number" 
                  name="currentSavings"
                  placeholder="Enter your current savings" 
                  value={formData.currentSavings}
                  onChange={handleInputChange}
                  min="0"
                />
              </label>
              <label>
                <span>💳 Monthly Expenses ($)</span>
                <input 
                  type="number" 
                  name="monthlyExpenses"
                  placeholder="Enter monthly expenses" 
                  value={formData.monthlyExpenses}
                  onChange={handleInputChange}
                  min="0"
                />
                <small style={{color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block'}}>
                  Or leave blank to estimate (70% of monthly income)
                </small>
              </label>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Financial Goals</h3>
              <p>What are your financial priorities?</p>
            </div>
            <div className="form-grid">
              <label>
                <span>Primary Financial Goal</span>
                <select 
                  name="financialGoal"
                  value={formData.financialGoal}
                  onChange={handleInputChange}
                >
                  <option value="">Select your primary goal</option>
                  <option value="emergency-fund">Build Emergency Fund</option>
                  <option value="retirement">Save for Retirement</option>
                  <option value="house">Buy a House</option>
                  <option value="education">Education Fund</option>
                  <option value="debt-payoff">Pay Off Debt</option>
                  <option value="investment">Grow Investments</option>
                  <option value="vacation">Save for Vacation</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                <span>Risk Tolerance</span>
                <select 
                  name="riskTolerance"
                  value={formData.riskTolerance}
                  onChange={handleInputChange}
                >
                  <option value="">Select your risk tolerance</option>
                  <option value="conservative">Conservative (Low Risk)</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="aggressive">Aggressive (High Risk)</option>
                </select>
              </label>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Security</h3>
              <p>Create your secure account</p>
            </div>
            <div className="form-grid">
              <label>
                <span>Password</span>
                <input 
                  type="password" 
                  name="password"
                  placeholder="Create a strong password" 
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'error' : ''}
                  required 
                />
                {errors.password && <small className="error-text">{errors.password}</small>}
              </label>
              <label>
                <span>Confirm Password</span>
                <input 
                  type="password" 
                  name="confirmPassword"
                  placeholder="Repeat your password" 
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  required 
                />
                {errors.confirmPassword && <small className="error-text">{errors.confirmPassword}</small>}
              </label>
            </div>
            <div className="auth-actions">
              <label className="remember">
                <input type="checkbox" required />
                <span>I agree to the <a href="#" style={{color: 'var(--primary-color)', textDecoration: 'none'}}>Terms of Service</a> and <a href="#" style={{color: 'var(--primary-color)', textDecoration: 'none'}}>Privacy Policy</a></span>
              </label>
            </div>
            {errors.submit && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.1)',
                color: 'var(--error-color)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-lg)',
                marginTop: '1rem',
                fontSize: '0.875rem',
                border: '1px solid rgba(220, 38, 38, 0.2)'
              }}>
                {errors.submit}
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="auth-page fade-in">
      <AuthCard
        title="Create your account"
        subtitle="Start managing your finances with MoneyMap"
        footer={
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        }
      >
        <div className="multi-step-form">
          {/* Progress Indicator */}
          <div className="progress-indicator">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''}`}>
                <div className="step-number">{step}</div>
                <div className="step-label">
                  {step === 1 && 'Basic'}
                  {step === 2 && 'Financial'}
                  {step === 3 && 'Goals'}
                  {step === 4 && 'Security'}
                </div>
              </div>
            ))}
          </div>

          {/* Form Content */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {renderStep()}
            
            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep}
                  className="btn-secondary"
                >
                  ← Previous
                </button>
              )}
              
              {currentStep < 4 ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  className="btn-primary"
                >
                  Next →
                </button>
              ) : (
                <>
                  <button 
                    type="submit" 
                    className={`btn-primary ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </button>

                  <div className="divider">
                    <span>or sign up with</span>
                  </div>

                  <div id="google-signin-button-container" style={{ width: '100%' }}>
                    <div ref={googleButtonRef}></div>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </AuthCard>
    </div>
  )
}


