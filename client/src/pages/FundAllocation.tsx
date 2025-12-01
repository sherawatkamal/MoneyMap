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
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [timeHorizon, setTimeHorizon] = useState(10);
  const [riskTolerance, setRiskTolerance] = useState(user?.risk_tolerance || 5);
  const [allocationData, setAllocationData] = useState<AllocationPlan[]>([]);

  useEffect(() => {
    calculateAllocation();
  }, [currentSavings, monthlyContribution, timeHorizon, riskTolerance]);

  const calculateAllocation = () => {
    const data: AllocationPlan[] = [];
    const monthlyExpenses = 3000; // Estimate
    const emergencyFundTarget = monthlyExpenses * 6;

    // Initial allocation
    let emergencyFund = Math.min(currentSavings * 0.2, emergencyFundTarget);
    let remaining = currentSavings - emergencyFund;

    // Risk-based allocation for remaining funds
    const stockAllocation = riskTolerance / 10;
    const bondAllocation = 1 - stockAllocation;

    let shortTerm = remaining * 0.2 * bondAllocation;
    let mediumTerm = remaining * 0.3 * (stockAllocation * 0.5 + bondAllocation * 0.5);
    let longTerm = remaining * 0.5 * stockAllocation;

    for (let year = 0; year <= timeHorizon; year++) {
      const monthlyContrib = year * 12 * monthlyContribution;
      const totalContributions = currentSavings + monthlyContrib;

      // Growth rates based on risk
      const emergencyGrowth = 0.02; // 2% for savings
      const shortTermGrowth = 0.04; // 4% for conservative
      const mediumTermGrowth = 0.06 + (riskTolerance / 10) * 0.02; // 6-8%
      const longTermGrowth = 0.08 + (riskTolerance / 10) * 0.04; // 8-12%

      if (year === 0) {
        emergencyFund = Math.min(totalContributions * 0.2, emergencyFundTarget);
        remaining = totalContributions - emergencyFund;
        shortTerm = remaining * 0.2 * bondAllocation;
        mediumTerm = remaining * 0.3 * (stockAllocation * 0.5 + bondAllocation * 0.5);
        longTerm = remaining * 0.5 * stockAllocation;
      } else {
        emergencyFund = Math.min(
          emergencyFund * (1 + emergencyGrowth) + monthlyContribution * 0.1,
          emergencyFundTarget * (1 + emergencyGrowth * year)
        );
        shortTerm = shortTerm * (1 + shortTermGrowth) + monthlyContribution * 0.2 * bondAllocation;
        mediumTerm = mediumTerm * (1 + mediumTermGrowth) + monthlyContribution * 0.3;
        longTerm = longTerm * (1 + longTermGrowth) + monthlyContribution * 0.5 * stockAllocation;
      }

      data.push({
        year,
        emergencyFund: Math.round(emergencyFund),
        shortTerm: Math.round(shortTerm),
        mediumTerm: Math.round(mediumTerm),
        longTerm: Math.round(longTerm),
        total: Math.round(emergencyFund + shortTerm + mediumTerm + longTerm),
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
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Portfolio Growth Over Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={allocationData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Value ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
              <Legend />
              <Area type="monotone" dataKey="emergencyFund" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Emergency Fund" />
              <Area type="monotone" dataKey="shortTerm" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Short-term (3-5 years)" />
              <Area type="monotone" dataKey="mediumTerm" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Medium-term (5-10 years)" />
              <Area type="monotone" dataKey="longTerm" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Long-term (10+ years)" />
            </AreaChart>
          </ResponsiveContainer>
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
