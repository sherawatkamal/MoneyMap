/* Investments.tsx

Kamal Sherawat, JJ Feeney III Virginia Tech August 22, 2025

Investments browsing page with stock search, filtering, real-time price updates,
risk indicators, and stock recommendation features with watchlist functionality.
Includes bar charts for expected returns and risk analysis visualization.

*/

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StockRecommendation {
  ticker: string;
  name: string;
  current_price: number;
  previous_price?: number;
  price_change?: number;
  price_change_percent?: number;
  beta: number;
  volatility: number;
  dividend_yield: number;
  sector: string;
  category: 'stocks' | 'bonds' | 'etf' | 'crypto';
  predicted_return_1yr: number;
  risk_score: number;
  explanation?: string;
  price_history?: number[];
}

interface WatchlistItem {
  id: number;
  stock_ticker: string;
  stock_name: string;
  current_price: number;
  notes: string;
  added_at: string;
}

export default function Investments() {
  const { user, token, refreshUser } = useAuth();
  const [stocks, setStocks] = useState<StockRecommendation[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockRecommendation[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);

  // Refresh user data on mount to get latest risk tolerance
  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    fetchRecommendations();
    fetchWatchlist();
    // Set up real-time price updates every 30 seconds
    const priceInterval = setInterval(() => {
      updatePrices();
    }, 30000);
    return () => clearInterval(priceInterval);
  }, [user?.risk_tolerance]); // Re-fetch when risk tolerance changes

  useEffect(() => {
    filterStocks();
  }, [stocks, searchTerm, selectedCategory]);

  const filterStocks = () => {
    let filtered = [...stocks];
    
    if (searchTerm) {
      filtered = filtered.filter(stock =>
        stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.sector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(stock => stock.category === selectedCategory);
    }
    
    setFilteredStocks(filtered);
  };

  const updatePrices = async () => {
    try {
      const response = await fetch('http://localhost:5001/update-stock-prices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStocks(prevStocks => 
          prevStocks.map(stock => {
            const updated = data.prices.find((p: any) => p.ticker === stock.ticker);
            if (updated) {
              return {
                ...stock,
                current_price: updated.current_price,
                previous_price: stock.current_price,
                price_change: updated.current_price - stock.current_price,
                price_change_percent: ((updated.current_price - stock.current_price) / stock.current_price) * 100,
              };
            }
            return stock;
          })
        );
      }
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:5001/stock-recommendations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const stocksWithDetails = (data.recommendations || []).map((stock: StockRecommendation) => ({
          ...stock,
          category: stock.category || (stock.ticker.includes('BTC') || stock.ticker.includes('ETH') ? 'crypto' : 'stocks'),
          explanation: generateExplanation(stock),
          price_history: generatePriceHistory(stock),
        }));
        setStocks(stocksWithDetails);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('http://localhost:5001/watchlist', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  const handleAddToWatchlist = async (stock: StockRecommendation) => {
    setWatchlistLoading(true);
    try {
      const response = await fetch('http://localhost:5001/watchlist', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: stock.ticker,
          stock_name: stock.name,
          current_price: stock.current_price,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage(`${stock.ticker} added to watchlist!`);
        setToastType('success');
        setShowToast(true);
        fetchWatchlist(); // Refresh watchlist
      } else {
        setToastMessage(data.msg || 'Error adding to watchlist');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      setToastMessage('Error adding to watchlist');
      setToastType('error');
      setShowToast(true);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId: number, ticker: string) => {
    try {
      const response = await fetch(`http://localhost:5001/watchlist/${watchlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setToastMessage(`${ticker} removed from watchlist`);
        setToastType('success');
        setShowToast(true);
        fetchWatchlist(); // Refresh watchlist
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setToastMessage('Error removing from watchlist');
      setToastType('error');
      setShowToast(true);
    }
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

  const getRiskCategory = (riskScore: number): string => {
    if (riskScore <= 3) return 'Conservative';
    if (riskScore <= 7) return 'Moderate';
    return 'Aggressive';
  };

  const getRiskColor = (riskScore: number): string => {
    if (riskScore <= 3) return '#10b981'; // Green
    if (riskScore <= 7) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const isInWatchlist = (ticker: string): boolean => {
    return watchlist.some(item => item.stock_ticker === ticker);
  };

  const generateExplanation = (stock: StockRecommendation): string => {
    const riskLevel = stock.risk_score <= 3 ? 'low' : stock.risk_score <= 7 ? 'moderate' : 'high';
    const returnExpectation = stock.predicted_return_1yr > 15 ? 'strong' : stock.predicted_return_1yr > 8 ? 'moderate' : 'conservative';
    
    return `This ${stock.sector} stock has a ${riskLevel} risk profile with a ${returnExpectation} expected return of ${stock.predicted_return_1yr.toFixed(1)}% over the next year. ` +
           `The beta of ${stock.beta.toFixed(2)} indicates ${stock.beta < 1 ? 'lower' : stock.beta > 1.2 ? 'higher' : 'moderate'} volatility compared to the market. ` +
           `With a volatility of ${(stock.volatility * 100).toFixed(1)}%, this investment ${stock.risk_score <= 3 ? 'provides stability' : stock.risk_score <= 7 ? 'offers balanced risk-reward' : 'carries significant risk but potential for higher returns'}.`;
  };

  const generatePriceHistory = (stock: StockRecommendation): number[] => {
    // Generate simulated price history for risk visualization
    const history: number[] = [];
    const basePrice = stock.current_price;
    const volatility = stock.volatility;
    
    for (let i = 30; i >= 0; i--) {
      const daysAgo = i;
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const price = basePrice * (1 - (daysAgo / 30) * 0.1) * (1 + randomChange);
      history.push(Math.max(price * 0.7, price * 1.3)); // Keep within reasonable bounds
    }
    
    return history;
  };

  const calculateRiskFromHistory = (history: number[]): number => {
    if (history.length < 2) return 5;
    
    const returns = [];
    for (let i = 1; i < history.length; i++) {
      returns.push((history[i] - history[i-1]) / history[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to 1-10 risk score
    return Math.min(10, Math.max(1, stdDev * 100 * 2));
  };

  const generateCSV = () => {
    const data = [
      ['Stock Recommendations - Export Date: ' + new Date().toLocaleDateString()],
      [''],
      ['Recommended Stocks'],
      ['Ticker', 'Name', 'Current Price', 'Predicted Return', 'Risk Score', 'Sector', 'Beta', 'Volatility', 'Dividend Yield'],
      ...stocks.map(stock => [
        stock.ticker,
        stock.name,
        `$${stock.current_price.toFixed(2)}`,
        `+${stock.predicted_return_1yr.toFixed(1)}%`,
        `${stock.risk_score.toFixed(1)}/10`,
        stock.sector,
        stock.beta.toFixed(2),
        `${(stock.volatility * 100).toFixed(1)}%`,
        `${(stock.dividend_yield * 100).toFixed(2)}%`
      ]),
      [''],
      ['My Watchlist'],
      ['Ticker', 'Name', 'Current Price', 'Notes', 'Added At'],
      ...watchlist.map(item => [
        item.stock_ticker,
        item.stock_name,
        `$${item.current_price.toFixed(2)}`,
        item.notes || 'N/A',
        new Date(item.added_at).toLocaleDateString()
      ])
    ];

    const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `moneymap-investments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setToastMessage('Investment data exported to CSV successfully!');
    setToastType('success');
    setShowToast(true);
  };

  const generatePDF = () => {
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
          Loading investment recommendations...
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
              <span style={{ fontSize: '2.5rem' }}>📈</span>
              Investment Recommendations
            </h1>
            <p>AI-powered stock suggestions based on your risk tolerance</p>
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-block'
            }}>
              Your Risk Profile: <strong style={{ color: getRiskColor(normalizeRiskTolerance(user?.risk_tolerance)) }}>
                {user?.risk_tolerance ? getRiskCategory(normalizeRiskTolerance(user?.risk_tolerance)) : 'Not set'}
              </strong>
              {user?.risk_tolerance && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                  ({normalizeRiskTolerance(user?.risk_tolerance)}/10)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="🔍 Search by ticker, name, or sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem'
              }}
            >
              <option value="all">All Categories</option>
              <option value="stocks">Stocks</option>
              <option value="bonds">Bonds</option>
              <option value="etf">ETFs</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
        </div>

        {/* Stock Recommendations */}
        {filteredStocks.length > 0 ? (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: 'white' }}>
              📊 Recommended Assets ({filteredStocks.length} found)
            </h2>
            
            {/* Investment Analysis Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              {/* Expected Returns Chart */}
              <div style={{ 
                padding: '2.5rem', 
                background: 'white', 
                borderRadius: 'var(--radius-lg)', 
                boxShadow: 'var(--shadow-md)',
                border: '2px solid var(--border-light)'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  📈 Expected Returns
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={stocks.map(s => ({ name: s.ticker, value: s.predicted_return_1yr }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100} 
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis 
                      label={{ value: 'Return %', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }} 
                      tick={{ fontSize: 12 }}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Expected Return']}
                      contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: '10px' }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Risk vs Return Scatter */}
            <div style={{
                padding: '2.5rem', 
                background: 'white', 
                borderRadius: 'var(--radius-lg)', 
                boxShadow: 'var(--shadow-md)',
                border: '2px solid var(--border-light)'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  ⚡ Risk Score Analysis
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={stocks.map(s => ({ name: s.ticker, risk: s.risk_score }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100} 
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      label={{ value: 'Risk Score (0-10)', angle: -90, position: 'insideLeft', style: { fontSize: 14 } }} 
                      tick={{ fontSize: 12 }}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}/10`, 'Risk Score']}
                      contentStyle={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: '10px' }}
                    />
                    <Bar dataKey="risk" fill="#ef4444" radius={[8, 8, 0, 0]} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="investments-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '2rem'
            }}>
              {filteredStocks.map((stock, index) => {
                const riskFromHistory = stock.price_history ? calculateRiskFromHistory(stock.price_history) : stock.risk_score;
                const priceChange = stock.price_change || 0;
                const priceChangePercent = stock.price_change_percent || 0;
                const isPositive = priceChange >= 0;
                
                return (
                <div
                  key={index}
                  className="investment-stock-card"
                  style={{
                    padding: '1.5rem',
                    border: `2px solid ${getRiskColor(stock.risk_score)}30`,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                >
                  {/* Stock Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {stock.name}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {stock.sector}
                      </p>
                    </div>
                    <div style={{
                      padding: '0.4rem 0.8rem',
                      background: getRiskColor(stock.risk_score),
                      color: 'white',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      marginLeft: '1rem'
                    }}>
                      {getRiskCategory(stock.risk_score)}
                    </div>
                  </div>

                  {/* Ticker Badge */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.4rem 0.8rem',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#8b5cf6',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      fontFamily: 'monospace'
                    }}>
                      {stock.ticker}
                    </div>
                  </div>

                  {/* Real-time Price Display */}
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Current Price {stock.previous_price && '(Live)'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${stock.current_price.toFixed(2)}
                      </div>
                      {stock.previous_price && (
                        <div style={{
                          fontSize: '0.9rem',
                          color: isPositive ? '#10b981' : '#ef4444',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {isPositive ? '↑' : '↓'} ${Math.abs(priceChange).toFixed(2)} ({Math.abs(priceChangePercent).toFixed(2)}%)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Risk Indicator from Price History */}
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Risk Indicator (Based on Price History)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        flex: 1,
                        height: '8px',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(riskFromHistory / 10) * 100}%`,
                          height: '100%',
                          background: getRiskColor(riskFromHistory),
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: getRiskColor(riskFromHistory) }}>
                        {riskFromHistory.toFixed(1)}/10
                      </span>
                    </div>
                  </div>

                  {/* Stock Details Grid */}
                  <div className="investment-stock-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    
                    <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Predicted Return</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                        +{stock.predicted_return_1yr.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Risk Score</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: getRiskColor(stock.risk_score) }}>
                        {stock.risk_score.toFixed(1)}/10
                      </div>
                    </div>
                    
                    <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Volatility</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {(stock.volatility * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Add to Watchlist Button */}
                  <button
                    onClick={() => handleAddToWatchlist(stock)}
                    disabled={isInWatchlist(stock.ticker) || watchlistLoading}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: isInWatchlist(stock.ticker) ? '#10b981' : getRiskColor(stock.risk_score),
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: isInWatchlist(stock.ticker) ? 'not-allowed' : 'pointer',
                      opacity: isInWatchlist(stock.ticker) ? 0.8 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isInWatchlist(stock.ticker) && !watchlistLoading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {isInWatchlist(stock.ticker) ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
                  </button>

                  {/* Detailed Explanation (FR-19) */}
                  {stock.explanation && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'rgba(59, 130, 246, 0.05)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5'
                    }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                        💡 Why this recommendation?
                      </strong>
                      {stock.explanation}
                    </div>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedStock(stock)}
                    style={{
                      width: '100%',
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    View Full Details →
                  </button>
                </div>
              );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            {searchTerm || selectedCategory !== 'all' 
              ? 'No assets found matching your search criteria.'
              : 'No recommendations available. Please update your risk tolerance in settings.'}
          </div>
        )}

        {/* My Watchlist */}
        {watchlist.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              ⭐ My Watchlist
            </h2>
            <div className="investments-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        {item.stock_name}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {item.stock_ticker}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromWatchlist(item.id, item.stock_ticker)}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                      }}
                      title="Remove from watchlist"
                    >
                      ❌
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <span>Current Price:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>${item.current_price}</strong>
                  </div>
                  {item.notes && (
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Message */}
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: '#fff',
          border: '2px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}>
          <h4 style={{ marginTop: 0, color: '#3b82f6' }}>📊 About Our Recommendations</h4>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0', fontSize: '0.95rem' }}>
            Our AI analyzes historical data, volatility, beta coefficients, and market trends to provide personalized stock recommendations.
            Predictions are based on statistical models and should be used as guidance only.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem' }}>
            <strong>Disclaimer:</strong> Past performance is not indicative of future results. Always conduct your own research before making investment decisions.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="action-buttons-container">
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

      {/* Stock Detail Modal */}
      {selectedStock && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }} onClick={() => setSelectedStock(null)}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedStock.name}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedStock.ticker} • {selectedStock.sector}</p>
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                ×
              </button>
            </div>

            {selectedStock.explanation && (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>💡 Detailed Explanation</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedStock.explanation}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Current Price</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${selectedStock.current_price.toFixed(2)}</div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Risk Score</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getRiskColor(selectedStock.risk_score) }}>
                  {selectedStock.risk_score.toFixed(1)}/10
                </div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Predicted Return</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                  +{selectedStock.predicted_return_1yr.toFixed(1)}%
                </div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Volatility</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {(selectedStock.volatility * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <button
              onClick={() => handleAddToWatchlist(selectedStock)}
              disabled={isInWatchlist(selectedStock.ticker)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: isInWatchlist(selectedStock.ticker) ? '#10b981' : getRiskColor(selectedStock.risk_score),
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isInWatchlist(selectedStock.ticker) ? 'not-allowed' : 'pointer'
              }}
            >
              {isInWatchlist(selectedStock.ticker) ? '✓ Already in Watchlist' : '+ Add to Watchlist'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

