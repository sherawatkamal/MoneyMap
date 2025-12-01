import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, loading } = useAuth();


  // Show loading state while user data is being fetched
  if (loading) {
    return (
      <div className="dashboard-page fade-in">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          fontSize: '1.2rem',
          color: 'var(--text-secondary)'
        }}>
          Loading your dashboard...
        </div>
      </div>
    );
  }

  // Calculate basic financial metrics based on user data from signup
  const annualIncome = user?.annual_income ? parseFloat(user.annual_income) : 0;
  const monthlyIncome = annualIncome ? annualIncome / 12 : 0;
  const monthlyExpenses = monthlyIncome * 0.7; // Assume 70% of income as expenses
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const emergencyFundTarget = monthlyExpenses * 6;

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.full_name || user?.username || 'User'}!</h1>
          <p>Here's your financial overview</p>
        </div>
      </div>

      {/* Essential User Information */}
      <div className="user-info-grid">
        <div className="info-card">
          <div className="info-icon">👤</div>
          <div className="info-content">
            <h3>Personal Information</h3>
            <p><strong>Name:</strong> {user?.full_name || 'Not provided'}</p>
            <p><strong>Email:</strong> {user?.email || 'Not provided'}</p>
            <p><strong>Age:</strong> {user?.age || 'Not provided'}</p>
            <p><strong>Occupation:</strong> {user?.occupation || 'Not provided'}</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">💰</div>
          <div className="info-content">
            <h3>Financial Overview</h3>
            <p><strong>Annual Income:</strong> {annualIncome ? `$${annualIncome.toLocaleString()}` : 'Not provided'}</p>
            <p><strong>Monthly Income:</strong> {monthlyIncome ? `$${monthlyIncome.toLocaleString()}` : 'Not provided'}</p>
            <p><strong>Estimated Monthly Expenses:</strong> {monthlyExpenses ? `$${monthlyExpenses.toLocaleString()}` : 'Not provided'}</p>
            <p><strong>Monthly Surplus:</strong> {monthlySurplus ? `$${monthlySurplus.toLocaleString()}` : 'Not provided'}</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">🎯</div>
          <div className="info-content">
            <h3>Financial Goals</h3>
            <p><strong>Primary Goal:</strong> {user?.financial_goal || 'Not set'}</p>
            <p><strong>Risk Tolerance:</strong> {user?.risk_tolerance || 'Not set'}</p>
            <p><strong>Emergency Fund Target:</strong> {emergencyFundTarget ? `$${emergencyFundTarget.toLocaleString()}` : 'Calculate after adding income'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/visualization" className="action-card">
            <div className="action-icon">📊</div>
            <h3>Financial Dashboard</h3>
            <p>Visualize your financial health and track progress</p>
          </Link>
          
          <Link to="/planner" className="action-card">
            <div className="action-icon">📈</div>
            <h3>Financial Planner</h3>
            <p>Create a detailed financial plan based on your goals</p>
          </Link>
          
          <Link to="/investments" className="action-card">
            <div className="action-icon">💼</div>
            <h3>Investment Recommendations</h3>
            <p>AI-powered stock suggestions based on your risk profile</p>
          </Link>
          
          <div className="action-card coming-soon">
            <div className="action-icon">💳</div>
            <h3>Expense Tracker</h3>
            <p>Coming soon - Monitor your spending</p>
          </div>
        </div>
      </div>
    </div>
  );
}
