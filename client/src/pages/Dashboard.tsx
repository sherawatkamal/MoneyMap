/* Dashboard.tsx

Kamal Sherawat Virginia Tech August 22, 2025

Main user dashboard page displaying user profile overview, risk tolerance summary,
and navigation links to various financial planning features.

*/

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

// Helper function to convert risk_tolerance (string or number) to a number (1-10)
const normalizeRiskTolerance = (risk: string | number | null | undefined): number => {
  if (risk === null || risk === undefined) return 5; // Default
  
  // If it's already a number, return it (clamped to 1-10)
  if (typeof risk === 'number') {
    return Math.max(1, Math.min(10, risk));
  }
  
  // If it's a string, try to parse it as a number first
  const numValue = Number(risk);
  if (!isNaN(numValue)) {
    return Math.max(1, Math.min(10, numValue));
  }
  
  // If it's a string category, convert to number
  const riskLower = risk.toLowerCase();
  if (riskLower === 'conservative') return 3;
  if (riskLower === 'moderate') return 6;
  if (riskLower === 'aggressive') return 9;
  
  // Default fallback
  return 5;
};

const getRiskLabel = (risk: number): string => {
  if (risk <= 3) return 'Conservative';
  if (risk <= 7) return 'Moderate';
  return 'Aggressive';
};

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
            <p><strong>Risk Tolerance:</strong> {user?.risk_tolerance ? `${getRiskLabel(normalizeRiskTolerance(user.risk_tolerance))} (${normalizeRiskTolerance(user.risk_tolerance)}/10)` : 'Not set'}</p>
            <p><strong>Emergency Fund Target:</strong> {emergencyFundTarget ? `$${emergencyFundTarget.toLocaleString()}` : 'Calculate after adding income'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/risk-assessment" className="action-card">
            <div className="action-icon">🎯</div>
            <h3>Risk Assessment</h3>
            <p>Take our questionnaire to determine your risk tolerance</p>
          </Link>
          
          <Link to="/investments" className="action-card">
            <div className="action-icon">💼</div>
            <h3>Investment Recommendations</h3>
            <p>AI-powered stock suggestions based on your risk profile</p>
          </Link>
          
          <Link to="/fund-allocation" className="action-card">
            <div className="action-icon">💰</div>
            <h3>Fund Allocation</h3>
            <p>Plan how to divide your funds across different time horizons</p>
          </Link>
          
          <Link to="/scenario-comparison" className="action-card">
            <div className="action-icon">⚖️</div>
            <h3>Compare Scenarios</h3>
            <p>Visualize conservative vs aggressive investment strategies</p>
          </Link>
          
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
        </div>
      </div>
    </div>
  );
}
