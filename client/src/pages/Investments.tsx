import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

interface StockRecommendation {
  ticker: string;
  name: string;
  current_price: number;
  beta: number;
  volatility: number;
  dividend_yield: number;
  sector: string;
  predicted_return_1yr: number;
  risk_score: number;
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
  const { user, token } = useAuth();
  const [stocks, setStocks] = useState<StockRecommendation[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchRecommendations();
    fetchWatchlist();
  }, []);

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
        setStocks(data.recommendations || []);
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
              Your Risk Profile: <strong>{user?.risk_tolerance || 'Not set'}</strong>
            </div>
          </div>
        </div>

        {/* Stock Recommendations */}
        {stocks.length > 0 ? (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              📊 Recommended Stocks
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {stocks.map((stock, index) => (
                <div
                  key={index}
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

                  {/* Stock Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Current Price</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${stock.current_price.toFixed(2)}
                      </div>
                    </div>
                    
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
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No recommendations available. Please update your risk tolerance in settings.
          </div>
        )}

        {/* My Watchlist */}
        {watchlist.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              ⭐ My Watchlist
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
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
      </div>
    </div>
  );
}

