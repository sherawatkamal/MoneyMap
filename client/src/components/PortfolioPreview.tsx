/* PortfolioPreview.tsx

JJ Feeney III Virginia Tech August 22, 2025

Portfolio preview component with pie chart visualization showing asset allocation breakdown
by category (stocks, bonds, ETFs, crypto) with portfolio statistics and validation.

*/

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Asset {
  ticker: string;
  name: string;
  allocation: number;
  category: 'stocks' | 'bonds' | 'etf' | 'crypto';
  risk_score: number;
}

interface PortfolioPreviewProps {
  assets: Asset[];
  totalValue: number;
}

const COLORS = {
  stocks: '#3b82f6',
  bonds: '#10b981',
  etf: '#8b5cf6',
  crypto: '#f59e0b',
};

export default function PortfolioPreview({ assets, totalValue }: PortfolioPreviewProps) {
  const chartData = assets.map(asset => ({
    name: asset.ticker,
    value: asset.allocation,
    category: asset.category,
  }));

  const categoryTotals = assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + asset.allocation;
    return acc;
  }, {} as Record<string, number>);

  const averageRisk = assets.length > 0
    ? assets.reduce((sum, a) => sum + a.risk_score, 0) / assets.length
    : 0;

  const validatePortfolio = () => {
    const totalAllocation = assets.reduce((sum, a) => sum + a.allocation, 0);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (Math.abs(totalAllocation - 100) > 0.01) {
      errors.push(`Total allocation is ${totalAllocation.toFixed(2)}%, should be 100%`);
    }

    if (categoryTotals.crypto && categoryTotals.crypto > 10) {
      warnings.push('Cryptocurrency allocation exceeds recommended 10%');
    }

    if (categoryTotals.stocks && categoryTotals.stocks < 20) {
      warnings.push('Stock allocation is very low for long-term growth');
    }

    if (averageRisk > 8) {
      warnings.push('Portfolio has very high risk - consider diversification');
    }

    return { errors, warnings, isValid: errors.length === 0 };
  };

  const validation = validatePortfolio();

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      marginBottom: '2rem'
    }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        📊 Portfolio Composition Preview
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '2rem' }}>
        {/* Pie Chart */}
        <div>
          <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 600 }}>Asset Allocation</h4>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.category as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Allocation']} 
                contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: '10px' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '30px' }}
                iconSize={16}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio Stats */}
        <div>
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Portfolio Statistics</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Total Portfolio Value
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ${totalValue.toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Average Risk Score
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: averageRisk > 7 ? '#ef4444' : averageRisk > 4 ? '#f59e0b' : '#10b981' }}>
                {averageRisk.toFixed(1)}/10
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Category Breakdown
              </div>
              {Object.entries(categoryTotals).map(([category, value]) => (
                <div key={category} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{category}:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{value.toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validation */}
      <div style={{ marginTop: '2rem' }}>
        {validation.errors.length > 0 && (
          <div style={{
            padding: '1rem',
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>⚠️ Errors</h4>
            {validation.errors.map((error, i) => (
              <p key={i} style={{ color: '#991b1b', margin: '0.25rem 0' }}>{error}</p>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div style={{
            padding: '1rem',
            background: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: 'var(--radius-md)'
          }}>
            <h4 style={{ color: '#d97706', marginBottom: '0.5rem' }}>💡 Warnings</h4>
            {validation.warnings.map((warning, i) => (
              <p key={i} style={{ color: '#92400e', margin: '0.25rem 0' }}>{warning}</p>
            ))}
          </div>
        )}

        {validation.isValid && validation.warnings.length === 0 && (
          <div style={{
            padding: '1rem',
            background: '#d1fae5',
            border: '2px solid #10b981',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#065f46', fontWeight: 600 }}>✅ Portfolio composition is valid!</p>
          </div>
        )}
      </div>

      {/* Asset List */}
      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Asset Details</h4>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {assets.map((asset, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                background: 'rgba(0,0,0,0.02)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {asset.name} ({asset.ticker})
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {asset.category} • Risk: {asset.risk_score}/10
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS[asset.category] }}>
                {asset.allocation.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
