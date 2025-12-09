/* FundAllocation.tsx

JJ Feeney III Virginia Tech August 22, 2025

Fund allocation planner with stacked area charts showing growth of emergency fund,
short-term, medium-term, and long-term buckets over time with interactive controls.

*/

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

interface AllocationPlan {
  year: number;
  emergencyFund: number;
  shortTerm: number;
  mediumTerm: number;
  longTerm: number;
  total: number;
}

export default function FundAllocation() {
  const { user, token } = useAuth();
  // Initialize with user's data if available, otherwise use defaults
  const [currentSavings, setCurrentSavings] = useState(user?.current_savings || 50000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [timeHorizon, setTimeHorizon] = useState(10);
  const [riskTolerance, setRiskTolerance] = useState(user?.risk_tolerance || 5);
  const [allocationData, setAllocationData] = useState<AllocationPlan[]>([]);

  // Update values when user data loads
  useEffect(() => {
    if (user?.risk_tolerance) {
      setRiskTolerance(user.risk_tolerance);
    }
    if (user?.current_savings) {
      setCurrentSavings(user.current_savings);
    }
  }, [user]);

  // Calculate allocation whenever inputs change
  useEffect(() => {
    // Always calculate on mount and when dependencies change
    // Default risk tolerance of 5 is valid, so calculation will run
    calculateAllocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSavings, monthlyContribution, timeHorizon, riskTolerance]);

  const calculateAllocation = () => {
    // Ensure we have valid inputs
    const validRiskTolerance = Math.max(1, Math.min(10, riskTolerance || 5));
    const validSavings = Math.max(0, currentSavings || 0);
    const validContribution = Math.max(0, monthlyContribution || 0);
    const validHorizon = Math.max(1, Math.min(30, timeHorizon || 10));
    
    const data: AllocationPlan[] = [];
    const monthlyExpenses = 3000; // Estimate
    const emergencyFundTarget = monthlyExpenses * 6;

    // Risk-based allocation for remaining funds
    const stockAllocation = validRiskTolerance / 10;
    const bondAllocation = 1 - stockAllocation;

    // Growth rates based on risk
    const emergencyGrowth = 0.02; // 2% for savings
    const shortTermGrowth = 0.04; // 4% for conservative
    const mediumTermGrowth = 0.06 + (validRiskTolerance / 10) * 0.02; // 6-8%
    const longTermGrowth = 0.08 + (validRiskTolerance / 10) * 0.04; // 8-12%

    // Initialize values
    let emergencyFund = 0;
    let shortTerm = 0;
    let mediumTerm = 0;
    let longTerm = 0;

    for (let year = 0; year <= validHorizon; year++) {
      const monthlyContrib = year * 12 * validContribution;
      const totalContributions = validSavings + monthlyContrib;

      if (year === 0) {
        // Initial allocation for year 0
        emergencyFund = Math.min(totalContributions * 0.2, emergencyFundTarget);
        const remaining = Math.max(0, totalContributions - emergencyFund);
        
        shortTerm = remaining * 0.2 * bondAllocation;
        mediumTerm = remaining * 0.3 * (stockAllocation * 0.5 + bondAllocation * 0.5);
        longTerm = remaining * 0.5 * stockAllocation;
      } else {
        // Calculate growth for subsequent years
        emergencyFund = Math.min(
          emergencyFund * (1 + emergencyGrowth) + monthlyContribution * 0.1,
          emergencyFundTarget * (1 + emergencyGrowth * year)
        );
        
        // Ensure values are valid numbers before calculations
        shortTerm = (shortTerm || 0) * (1 + shortTermGrowth) + monthlyContribution * 0.2 * bondAllocation;
        mediumTerm = (mediumTerm || 0) * (1 + mediumTermGrowth) + monthlyContribution * 0.3;
        longTerm = (longTerm || 0) * (1 + longTermGrowth) + monthlyContribution * 0.5 * stockAllocation;
      }

      // Ensure all values are valid numbers
      emergencyFund = isNaN(emergencyFund) ? 0 : emergencyFund;
      shortTerm = isNaN(shortTerm) ? 0 : shortTerm;
      mediumTerm = isNaN(mediumTerm) ? 0 : mediumTerm;
      longTerm = isNaN(longTerm) ? 0 : longTerm;

      data.push({
        year,
        emergencyFund: Math.round(Math.max(0, emergencyFund)),
        shortTerm: Math.round(Math.max(0, shortTerm)),
        mediumTerm: Math.round(Math.max(0, mediumTerm)),
        longTerm: Math.round(Math.max(0, longTerm)),
        total: Math.round(Math.max(0, emergencyFund + shortTerm + mediumTerm + longTerm)),
      });
    }

    setAllocationData(data);
  };

  const updateRiskTolerance = async (value: number) => {
    setRiskTolerance(value);
    try {
      await fetch('http://localhost:5001/update-risk-tolerance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ risk_tolerance: value }),
      });
    } catch (error) {
      console.error('Error updating risk tolerance:', error);
    }
  };

  return (
    <div className="dashboard-page fade-in">
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            💰 Intelligent Fund Allocation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            See how your funds should be divided and how they'll grow over time
          </p>
        </div>

        {/* Controls */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Current Savings ($)
            </label>
            <input
              type="number"
              value={currentSavings}
              onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                background: 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Monthly Contribution ($)
            </label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                background: 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Time Horizon (Years)
            </label>
            <select
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                background: 'white'
              }}
            >
              <option value={5}>5 years</option>
              <option value={10}>10 years</option>
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
              <option value={25}>25 years</option>
              <option value={30}>30 years</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Risk Tolerance: {riskTolerance}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={riskTolerance}
              onChange={(e) => updateRiskTolerance(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Portfolio Growth Over Time</h2>
          {(() => {
            // Calculate max total value for Y-axis domain
            const maxTotal = allocationData.length > 0 
              ? Math.max(...allocationData.map(d => d.total || 0))
              : 100000;
            const yAxisMax = Math.ceil(maxTotal * 1.1); // Add 10% padding
            
            return (
          <ResponsiveContainer width="100%" height={500}>
            <AreaChart 
              data={allocationData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="year" 
                label={{ value: 'Years', position: 'insideBottom', offset: -10, style: { fontSize: 14 } }} 
                tick={{ fontSize: 12 }}
                interval={Math.max(1, Math.floor(timeHorizon / 10))}
              />
              <YAxis 
                label={{ value: 'Value ($)', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }} 
                tick={{ fontSize: 12 }}
                width={80}
                    domain={[0, yAxisMax]}
                    allowDataOverflow={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']} 
                contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: '12px' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconSize={16}
                iconType="square"
              />
              <Area type="monotone" dataKey="emergencyFund" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Emergency Fund" strokeWidth={2} />
              <Area type="monotone" dataKey="shortTerm" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Short-term (3-5 years)" strokeWidth={2} />
              <Area type="monotone" dataKey="mediumTerm" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Medium-term (5-10 years)" strokeWidth={2} />
              <Area type="monotone" dataKey="longTerm" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Long-term (10+ years)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
            );
          })()}
        </div>

        {/* Allocation Breakdown Table */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Allocation Breakdown by Year</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)' }}>Year</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>Emergency Fund</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>Short-term</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>Medium-term</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>Long-term</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {allocationData.map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.year}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${row.emergencyFund.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${row.shortTerm.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${row.mediumTerm.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${row.longTerm.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>${row.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
