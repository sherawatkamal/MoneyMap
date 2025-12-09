/* FinancialVisualization.tsx

JJ Feeney III Virginia Tech August 22, 2025

Financial visualization dashboard page with charts including budget breakdown pie charts,
emergency fund progress indicators, money growth projections, and risk tolerance sliders.

*/

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface FinancialData {
  currentSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

interface MoneyGrowthChartProps {
  riskTolerance: number;
  monthlySurplus: number;
}

const MoneyGrowthChart: React.FC<MoneyGrowthChartProps> = ({ riskTolerance, monthlySurplus }) => {
  // Calculate expected annual return based on risk tolerance
  const getExpectedReturn = (risk: number): number => {
    if (risk <= 3) return 0.05; // Conservative: 5% annual return
    if (risk <= 7) return 0.08; // Moderate: 8% annual return
    return 0.12; // Aggressive: 12% annual return
  };

  const annualReturn = getExpectedReturn(riskTolerance);
  const monthlyReturn = annualReturn / 12;
  
  // Project growth for the next 30 years
  const years = 30;
  const chartData = [];
  let currentValue = 0;
  
  for (let year = 0; year <= years; year += 5) {
    if (year === 0) {
      chartData.push({ year: 'Start', value: currentValue });
    } else {
      // Compound growth: add monthly contributions and apply growth
      for (let month = 0; month < 12 * 5; month++) {
        currentValue = currentValue * (1 + monthlyReturn) + monthlySurplus;
      }
      chartData.push({ year: `Year ${year}`, value: Math.round(currentValue) });
    }
  }
  
  return (
    <div>
      <div className="projection-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: getRiskColor(riskTolerance) }}>
            {riskTolerance <= 3 ? 'Conservative' : riskTolerance <= 7 ? 'Moderate' : 'Aggressive'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {(annualReturn * 100).toFixed(1)}% Annual Return
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
            {years} Year Projection
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            ${monthlySurplus.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo invested
          </div>
        </div>
      </div>

      <div style={{ height: '450px', marginBottom: '2rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 30, right: 40, left: 40, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 13, fill: 'var(--text-secondary)' }}
              stroke="var(--text-secondary)"
              label={{ value: 'Years', position: 'insideBottom', offset: -10, style: { fontSize: 14 } }}
            />
            <YAxis 
              tick={{ fontSize: 13, fill: 'var(--text-secondary)' }}
              stroke="var(--text-secondary)"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }}
              width={70}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: `2px solid ${getRiskColor(riskTolerance)}`,
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                boxShadow: 'var(--shadow-lg)',
                fontSize: '13px'
              }}
              formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 'Projected Value']}
            />
            <Bar 
              dataKey="value" 
              fill={`url(#colorGradient${riskTolerance <= 3 ? 'Conservative' : riskTolerance <= 7 ? 'Moderate' : 'Aggressive'})`}
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationBegin={0}
              animationEasing="ease-out"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(riskTolerance)} opacity={index === chartData.length - 1 ? 1 : index === 0 ? 0.3 : 0.6} />
              ))}
            </Bar>
            <defs>
              <linearGradient id="colorGradientConservative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="colorGradientModerate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="colorGradientAggressive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Projection Information & Disclaimers */}
      <div className="projection-disclaimer-container" style={{ 
        padding: '1.25rem', 
        background: 'rgba(5, 150, 105, 0.05)', 
        borderRadius: 'var(--radius-md)', 
        fontSize: '0.875rem', 
        color: 'var(--text-secondary)',
        border: '1px solid rgba(5, 150, 105, 0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>💡 Projection Overview:</strong>
          <p style={{ margin: '0.5rem 0 0 0', lineHeight: '1.6' }}>
            This chart shows your projected wealth if you invest <strong>${monthlySurplus.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month</strong> over 30 years with a 
            <strong style={{ color: getRiskColor(riskTolerance) }}> {getRiskLabel(riskTolerance)}</strong> risk profile. The projection assumes consistent monthly contributions and compound growth.
          </p>
        </div>
        
        <div className="projection-disclaimer-warning" style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'rgba(239, 68, 68, 0.05)', 
          borderRadius: 'var(--radius-sm)', 
          border: '1px solid rgba(239, 68, 68, 0.1)' 
        }}>
          <strong style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            ⚠️ Important Disclaimers:
          </strong>
          <ul className="disclaimer-list" style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li><strong>Not Guaranteed:</strong> Past performance does not guarantee future results. Actual returns may vary significantly.</li>
            <li><strong>Market Volatility:</strong> Investments can go down as well as up. You may get back less than you invest.</li>
            <li><strong>Assumptions:</strong> This projection assumes consistent returns every month, which is unrealistic. Real markets have ups and downs.</li>
            <li><strong>Inflation:</strong> These amounts are in today's dollars and don't account for inflation reducing purchasing power.</li>
            <li><strong>Taxes & Fees:</strong> Returns shown are before taxes, fees, and trading costs, which will reduce actual gains.</li>
            <li><strong>Risk Levels:</strong> Higher returns typically come with higher risk and potential for greater losses.</li>
          </ul>
        </div>

        <div className="projection-disclaimer-advice" style={{ 
          marginTop: '0.75rem', 
          padding: '0.75rem', 
          background: 'rgba(59, 130, 246, 0.05)', 
          borderRadius: 'var(--radius-sm)', 
          border: '1px solid rgba(59, 130, 246, 0.1)' 
        }}>
          <strong style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            💼 Investment Advice:
          </strong>
          <p style={{ margin: '0', lineHeight: '1.6' }}>
            Please consult with a qualified financial advisor before making investment decisions. This tool is for illustrative purposes only and should not be considered as financial, legal, or tax advice.
          </p>
        </div>
      </div>
    </div>
  );
};

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

const getRiskColor = (risk: number): string => {
  if (risk <= 3) return '#10b981';
  if (risk <= 7) return '#f59e0b';
  return '#ef4444';
};

export default function FinancialVisualization() {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [financialData, setFinancialData] = useState<FinancialData>({
    currentSavings: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [loading, setLoading] = useState(true);
  const [emergencyFundTarget, setEmergencyFundTarget] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [budgetPreferences, setBudgetPreferences] = useState({
    budget_housing_percent: null as number | null,
    budget_food_percent: null as number | null,
    budget_transportation_percent: null as number | null,
    budget_utilities_percent: null as number | null,
    budget_entertainment_percent: null as number | null,
    budget_other_percent: null as number | null,
  });

  // Update risk tolerance when user data changes
  useEffect(() => {
    if (user?.risk_tolerance !== undefined && user?.risk_tolerance !== null) {
      setRiskTolerance(normalizeRiskTolerance(user.risk_tolerance));
    }
  }, [user?.risk_tolerance]);

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
            
            // Load budget preferences
            setBudgetPreferences({
              budget_housing_percent: preferences.budget_housing_percent || null,
              budget_food_percent: preferences.budget_food_percent || null,
              budget_transportation_percent: preferences.budget_transportation_percent || null,
              budget_utilities_percent: preferences.budget_utilities_percent || null,
              budget_entertainment_percent: preferences.budget_entertainment_percent || null,
              budget_other_percent: preferences.budget_other_percent || null,
            });
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

          // Load saved risk tolerance
          if (user?.risk_tolerance) {
            const riskValue = user.risk_tolerance;
            // Handle both number (1-10) and string ('conservative', 'moderate', 'aggressive')
            if (typeof riskValue === 'number') {
              setRiskTolerance(riskValue);
            } else if (typeof riskValue === 'string') {
              if (riskValue === 'conservative') setRiskTolerance(2);
              else if (riskValue === 'moderate') setRiskTolerance(5);
              else if (riskValue === 'aggressive') setRiskTolerance(9);
              else {
                // Try to parse as number if it's a string number
                const parsed = parseInt(riskValue, 10);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
                  setRiskTolerance(parsed);
                }
              }
            }
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
  
  // Calculate budget breakdown percentages - use custom preferences if available, otherwise defaults
  const housingPercent = budgetPreferences.budget_housing_percent ?? 30;
  const foodPercent = budgetPreferences.budget_food_percent ?? 15;
  const transportationPercent = budgetPreferences.budget_transportation_percent ?? 15;
  const utilitiesPercent = budgetPreferences.budget_utilities_percent ?? 10;
  const entertainmentPercent = budgetPreferences.budget_entertainment_percent ?? 10;
  const otherPercent = budgetPreferences.budget_other_percent ?? 20;

  const housing = financialData.monthlyExpenses * (housingPercent / 100);
  const food = financialData.monthlyExpenses * (foodPercent / 100);
  const transportation = financialData.monthlyExpenses * (transportationPercent / 100);
  const utilities = financialData.monthlyExpenses * (utilitiesPercent / 100);
  const entertainment = financialData.monthlyExpenses * (entertainmentPercent / 100);
  const other = financialData.monthlyExpenses * (otherPercent / 100);

  const budgetBreakdown = [
    { category: 'Housing', amount: housing, percentage: housingPercent, color: '#10b981' },
    { category: 'Food', amount: food, percentage: foodPercent, color: '#3b82f6' },
    { category: 'Transportation', amount: transportation, percentage: transportationPercent, color: '#f59e0b' },
    { category: 'Utilities', amount: utilities, percentage: utilitiesPercent, color: '#ef4444' },
    { category: 'Entertainment', amount: entertainment, percentage: entertainmentPercent, color: '#8b5cf6' },
    { category: 'Other', amount: other, percentage: otherPercent, color: '#ec4899' },
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
        setToastMessage('Risk tolerance saved successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to save risk tolerance');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error saving risk tolerance:', error);
      setToastMessage('Error saving risk tolerance');
      setToastType('error');
      setShowToast(true);
    }
  };

  const mapRiskValue = (value: number): string => {
    if (value <= 3) return 'conservative';
    if (value <= 7) return 'moderate';
    return 'aggressive';
  };

  const generateCSV = () => {
    const data = [
      ['Category', 'Amount', 'Percentage'],
      ['Monthly Income', `$${financialData.monthlyIncome.toFixed(2)}`, '100%'],
      ['Monthly Expenses', `$${financialData.monthlyExpenses.toFixed(2)}`, '100%'],
      ['Monthly Surplus', `$${monthlySurplus.toFixed(2)}`, `${((monthlySurplus / financialData.monthlyIncome) * 100).toFixed(1)}%`],
      ['Current Savings', `$${financialData.currentSavings.toFixed(2)}`, 'N/A'],
      ['Emergency Fund Target', `$${emergencyFundTarget.toFixed(2)}`, '100%'],
      ['Emergency Fund Progress', `${(emergencyFundProgress * 100).toFixed(1)}%`, 'N/A'],
      [''],
      ['Budget Breakdown'],
      ...budgetBreakdown.map(item => [
        item.category,
        `$${item.amount.toFixed(2)}`,
        `${item.percentage}%`
      ]),
      [''],
      ['Risk Tolerance', getRiskLabel(riskTolerance), mapRiskValue(riskTolerance)]
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `moneymap-financial-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setToastMessage('CSV report downloaded successfully!');
    setToastType('success');
    setShowToast(true);
  };

  const generatePDF = () => {
    // Using window.print() which generates a PDF
    // In a production app, you would use a library like jsPDF or html2pdf
    window.print();
    
    setToastMessage('PDF generation triggered!');
    setToastType('success');
    setShowToast(true);
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
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
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
          <div style={{ height: '500px', margin: '0 auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                  outerRadius={140}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="percentage"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                  paddingAngle={3}
                >
                  {budgetBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, _name: string) => [`${value.toFixed(1)}%`, 'Budget Allocation']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: '13px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '30px' }}
                  iconSize={16}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Category Legend */}
          <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
            {budgetBreakdown.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.02)' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: item.color }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.category}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>${item.amount.toFixed(2)}</div>
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
            <div className="emergency-fund-circle" style={{
              width: '200px',
              height: '200px',
              margin: '0 auto',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="200" height="200" className="emergency-fund-svg">
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
                <div className="emergency-fund-percentage" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>
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
          <div className="risk-slider-section" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Conservative (Low Risk)</span>
                <span style={{ fontWeight: 600, fontSize: '1.2rem', color: getRiskColor(riskTolerance) }}>
                  {getRiskLabel(riskTolerance)} ({riskTolerance}/10)
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
                  accentColor: getRiskColor(riskTolerance)
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <div className="risk-profile-container" style={{
              padding: '1.5rem',
              background: `linear-gradient(135deg, ${getRiskColor(riskTolerance)}15 0%, ${getRiskColor(riskTolerance)}05 100%)`,
              border: `2px solid ${getRiskColor(riskTolerance)}`,
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: getRiskColor(riskTolerance) }}>
                Your Risk Profile: {getRiskLabel(riskTolerance)} ({riskTolerance}/10)
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
                  background: getRiskColor(riskTolerance),
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

          {/* Money Growth Projection Based on Risk */}
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              📈 Investment Growth Projection
            </h4>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%)',
              border: '2px solid rgba(5, 150, 105, 0.2)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <MoneyGrowthChart riskTolerance={riskTolerance} monthlySurplus={monthlySurplus} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-container">
          <button
            onClick={() => navigate('/settings')}
            className="btn-secondary"
          >
            ⚙️ Edit Profile
          </button>
          <button
            onClick={() => navigate('/planner')}
            className="btn-financial-planner"
          >
            📈 Financial Planner
          </button>
          <button
            onClick={generatePDF}
            className="btn-export-pdf"
          >
            📄 Export PDF
          </button>
          <button
            onClick={generateCSV}
            className="btn-export-csv"
          >
            📊 Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
