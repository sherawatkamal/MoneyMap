import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FinancialData {
  currentSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export default function FinancialVisualization() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState<FinancialData>({
    currentSavings: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [loading, setLoading] = useState(true);
  const [emergencyFundTarget, setEmergencyFundTarget] = useState(0);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (user && token) {
        try {
          // Fetch user preferences
          const response = await fetch('http://localhost:5001/user-preferences', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const annualIncome = user.annual_income || 0;
          const monthlyIncome = annualIncome / 12;

          if (response.ok) {
            const preferences = await response.json();
            
            setFinancialData({
              currentSavings: preferences.current_savings || 0,
              monthlyIncome: monthlyIncome || 0,
              monthlyExpenses: preferences.monthly_expenses || (monthlyIncome * 0.7),
            });
            
            // Calculate emergency fund target (6 months of expenses)
            const expenses = preferences.monthly_expenses || (monthlyIncome * 0.7);
            setEmergencyFundTarget(expenses * 6);
          } else {
            // Fallback to estimating from annual income
            const expenses = monthlyIncome * 0.7;
            setFinancialData({
              currentSavings: 0,
              monthlyIncome: monthlyIncome || 0,
              monthlyExpenses: expenses,
            });
            setEmergencyFundTarget(expenses * 6);
          }
        } catch (error) {
          console.error('Error fetching preferences:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFinancialData();
  }, [user, token]);

  const monthlySurplus = financialData.monthlyIncome - financialData.monthlyExpenses;
  const emergencyFundProgress = financialData.currentSavings / emergencyFundTarget;
  
  // Calculate budget breakdown percentages
  const housing = financialData.monthlyExpenses * 0.30;
  const food = financialData.monthlyExpenses * 0.15;
  const transportation = financialData.monthlyExpenses * 0.15;
  const utilities = financialData.monthlyExpenses * 0.10;
  const entertainment = financialData.monthlyExpenses * 0.10;
  const other = financialData.monthlyExpenses * 0.20;

  const budgetBreakdown = [
    { category: 'Housing', amount: housing, percentage: 30, color: '#10b981' },
    { category: 'Food', amount: food, percentage: 15, color: '#3b82f6' },
    { category: 'Transportation', amount: transportation, percentage: 15, color: '#f59e0b' },
    { category: 'Utilities', amount: utilities, percentage: 10, color: '#ef4444' },
    { category: 'Entertainment', amount: entertainment, percentage: 10, color: '#8b5cf6' },
    { category: 'Other', amount: other, percentage: 20, color: '#ec4899' },
  ];

  const handleSaveRiskTolerance = async () => {
    // Save risk tolerance to backend
    try {
      const response = await fetch('http://localhost:5001/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          risk_tolerance: mapRiskValue(riskTolerance),
        }),
      });

      if (response.ok) {
        // Show success message
        alert('Risk tolerance saved successfully!');
      }
    } catch (error) {
      console.error('Error saving risk tolerance:', error);
    }
  };

  const mapRiskValue = (value: number): string => {
    if (value <= 3) return 'conservative';
    if (value <= 7) return 'moderate';
    return 'aggressive';
  };

  const getRiskLabel = () => {
    if (riskTolerance <= 3) return 'Conservative';
    if (riskTolerance <= 7) return 'Moderate';
    return 'Aggressive';
  };

  const getRiskColor = () => {
    if (riskTolerance <= 3) return '#10b981'; // Green
    if (riskTolerance <= 7) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

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
          Loading your financial visualization...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page fade-in">
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
          <div className="welcome-section">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2.5rem' }}>📊</span>
              Financial Dashboard
            </h1>
            <p>Visualize your financial health and plan your future</p>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
          <div className="metric-card">
            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              💰
            </div>
            <div className="metric-content">
              <h3>Monthly Income</h3>
              <p className="metric-value" style={{ color: '#10b981' }}>
                ${financialData.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              💳
            </div>
            <div className="metric-content">
              <h3>Monthly Expenses</h3>
              <p className="metric-value" style={{ color: '#3b82f6' }}>
                ${financialData.monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              📈
            </div>
            <div className="metric-content">
              <h3>Monthly Surplus</h3>
              <p className="metric-value" style={{ color: '#f59e0b' }}>
                ${monthlySurplus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
              🏦
            </div>
            <div className="metric-content">
              <h3>Current Savings</h3>
              <p className="metric-value" style={{ color: '#8b5cf6' }}>
                ${financialData.currentSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Breakdown Chart */}
        <div className="chart-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            💸 Budget Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {budgetBreakdown.map((item, index) => (
              <div key={index}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.category}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({item.percentage}%)
                  </span>
                </div>
                <div style={{
                  height: '12px',
                  background: 'var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.percentage}%`,
                    background: item.color,
                    borderRadius: 'var(--radius-lg)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Fund Progress */}
        <div className="chart-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            🛡️ Emergency Fund Progress
          </h3>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="200" height="200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="var(--border-light)"
                  strokeWidth="20"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - emergencyFundProgress)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>
                  {(emergencyFundProgress * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  of Emergency Fund
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>
              Target: <strong>${emergencyFundTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </p>
            <p>
              Current: <strong>${financialData.currentSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </p>
          </div>
        </div>

        {/* Interactive Risk Tolerance Slider */}
        <div className="chart-card">
          <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            ⚖️ Investment Risk Tolerance
          </h3>
          <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Conservative (Low Risk)</span>
                <span style={{ fontWeight: 600, fontSize: '1.2rem', color: getRiskColor() }}>
                  {getRiskLabel()}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Aggressive (High Risk)</span>
              </div>
              
              <input
                type="range"
                min="1"
                max="10"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '10px',
                  borderRadius: '5px',
                  outline: 'none',
                  background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)`,
                  accentColor: getRiskColor()
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              background: `linear-gradient(135deg, ${getRiskColor()}15 0%, ${getRiskColor()}05 100%)`,
              border: `2px solid ${getRiskColor()}`,
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: getRiskColor() }}>
                Your Risk Profile: {getRiskLabel()}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {riskTolerance <= 3 && "You prefer stable, low-risk investments with predictable returns. Consider bonds and high-yield savings accounts."}
                {riskTolerance > 3 && riskTolerance <= 7 && "You're comfortable with moderate risk for potentially higher returns. Consider a balanced portfolio of stocks and bonds."}
                {riskTolerance > 7 && "You're willing to take significant risks for potentially high returns. Consider aggressive stock portfolios and alternative investments."}
              </p>
              <button
                onClick={handleSaveRiskTolerance}
                className="btn-primary"
                style={{
                  background: getRiskColor(),
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                💾 Save Risk Tolerance
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/settings')}
            className="btn-secondary"
            style={{
              padding: '1rem 2rem',
              fontSize: '1rem',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            ⚙️ Edit Profile
          </button>
          <button
            onClick={() => navigate('/planner')}
            className="btn-primary"
            style={{
              padding: '1rem 2rem',
              fontSize: '1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-gradient-alt)'
            }}
          >
            📈 Financial Planner
          </button>
        </div>
      </div>
    </div>
  );
}
