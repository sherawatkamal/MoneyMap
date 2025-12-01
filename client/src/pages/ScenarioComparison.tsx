import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

interface Scenario {
  name: string;
  riskTolerance: number;
  monthlyContribution: number;
  color: string;
  data: { year: number; value: number }[];
}

export default function ScenarioComparison() {
  const { user, token } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [timeHorizon, setTimeHorizon] = useState(10);

  useEffect(() => {
    generateScenarios();
  }, [currentSavings, timeHorizon]);

  const generateScenarios = () => {
    const conservative: Scenario = {
      name: 'Conservative Plan',
      riskTolerance: 3,
      monthlyContribution: 500,
      color: '#10b981',
      data: [],
    };

    const moderate: Scenario = {
      name: 'Moderate Plan',
      riskTolerance: 6,
      monthlyContribution: 1000,
      color: '#3b82f6',
      data: [],
    };

    const aggressive: Scenario = {
      name: 'Aggressive Plan',
      riskTolerance: 9,
      monthlyContribution: 1500,
      color: '#ef4444',
      data: [],
    };

    [conservative, moderate, aggressive].forEach(scenario => {
      let value = currentSavings;
      const annualReturn = 0.04 + (scenario.riskTolerance / 10) * 0.08; // 4-12% based on risk

      for (let year = 0; year <= timeHorizon; year++) {
        if (year > 0) {
          value = value * (1 + annualReturn) + scenario.monthlyContribution * 12;
        }
        scenario.data.push({ year, value: Math.round(value) });
      }
    });

    setScenarios([conservative, moderate, aggressive]);
  };

  const finalValues = scenarios.map(s => ({
    name: s.name,
    value: s.data[s.data.length - 1]?.value || 0,
    color: s.color,
  }));

  return (
    <div className="dashboard-page fade-in">
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            ⚖️ Scenario Comparison
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Compare risky vs conservative plans side-by-side to visually weigh risk vs reward
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
        </div>

        {/* Comparison Chart */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Side-by-Side Comparison</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
              <Legend />
              {scenarios.map((scenario, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey="value"
                  data={scenario.data}
                  name={scenario.name}
                  stroke={scenario.color}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {scenarios.map((scenario, index) => {
            const finalValue = scenario.data[scenario.data.length - 1]?.value || 0;
            const totalContributions = currentSavings + scenario.monthlyContribution * 12 * timeHorizon;
            const gains = finalValue - totalContributions;
            const returnPercent = ((finalValue / totalContributions - 1) * 100);

            return (
              <div
                key={index}
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)',
                  border: `3px solid ${scenario.color}`
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: scenario.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 700
                  }}>
                    {index + 1}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>{scenario.name}</h3>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Risk Tolerance:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{scenario.riskTolerance}/10</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monthly Contribution:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>${scenario.monthlyContribution.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Expected Return:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{(4 + (scenario.riskTolerance / 10) * 8).toFixed(1)}%</strong>
                  </div>
                </div>

                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Final Portfolio Value ({timeHorizon} years)
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: scenario.color }}>
                    ${finalValue.toLocaleString()}
                  </div>
                </div>

                <div style={{
                  padding: '1rem',
                  background: scenario.color + '20',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Total Gains:</strong> ${gains.toLocaleString()}
                  </div>
                  <div>
                    <strong>Return:</strong> {returnPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Detailed Comparison</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)' }}>Metric</th>
                  {scenarios.map((s, i) => (
                    <th key={i} style={{ padding: '1rem', textAlign: 'right', color: s.color }}>
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Risk Score</td>
                  {scenarios.map((s, i) => (
                    <td key={i} style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>{s.riskTolerance}/10</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Monthly Contribution</td>
                  {scenarios.map((s, i) => (
                    <td key={i} style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${s.monthlyContribution.toLocaleString()}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Final Value</td>
                  {scenarios.map((s, i) => {
                    const final = s.data[s.data.length - 1]?.value || 0;
                    return (
                      <td key={i} style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: s.color }}>
                        ${final.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Total Gains</td>
                  {scenarios.map((s, i) => {
                    const final = s.data[s.data.length - 1]?.value || 0;
                    const totalContrib = currentSavings + s.monthlyContribution * 12 * timeHorizon;
                    const gains = final - totalContrib;
                    return (
                      <td key={i} style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-primary)' }}>${gains.toLocaleString()}</td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
