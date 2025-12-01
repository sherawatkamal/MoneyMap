import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MoneyMapLogo from './MoneyMapLogo';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  const handleEditProfile = () => {
    navigate('/settings');
    setIsDropdownOpen(false);
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = (): string => {
    if (user?.full_name) return user.full_name;
    if (user?.username) return user.username;
    return 'User';
  };

  const getProfileColor = (name: string): string => {
    const colors = [
      'var(--primary-color)',      // #059669 - Deep green
      'var(--secondary-color)',    // #16a34a - Forest green
      'var(--success-color)',      // #059669 - Success green
      '#047857',                   // Emerald 800
      '#10b981',                   // Emerald 500
      '#22c55e',                   // Green 500
      '#16a34a',                   // Green 600
      '#15803d'                    // Green 700
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (!isAuthenticated) {
    // Public navbar for non-authenticated users
    return (
      <div className="top-nav">
        <Link to="/login" className="brand">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <MoneyMapLogo size={36} />
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>MoneyMap</div>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: '400', 
                color: 'var(--text-secondary)',
                lineHeight: '1'
              }}>
                Your Personal Financial Planning Journey
              </div>
            </div>
          </div>
        </Link>
        <nav>
          <Link to="/login">Login</Link>
          <Link to="/signup" className="btn-link">Sign up</Link>
        </nav>
      </div>
    );
  }

  // Authenticated navbar with user dropdown
  return (
    <div className="top-nav authenticated">
      <Link to="/dashboard" className="brand">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <MoneyMapLogo size={36} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>MoneyMap</div>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: '600', 
              color: 'var(--text-secondary)',
              lineHeight: '1'
            }}>
              Your Personal Financial Planning Journey
            </div>
          </div>
        </div>
      </Link>
      
          <div className="nav-right">
            <nav>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/risk-assessment">Risk Assessment</Link>
              <Link to="/investments">Investments</Link>
              <Link to="/fund-allocation">Fund Allocation</Link>
              <Link to="/scenario-comparison">Compare Scenarios</Link>
              <Link to="/planner">Planner</Link>
            </nav>
        
        <div className="user-profile" ref={dropdownRef}>
          <button
            className="profile-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: 'var(--radius-lg)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(5, 150, 105, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              background: getProfileColor(getDisplayName()),
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              boxShadow: 'var(--shadow-md)'
            }}>
              {getUserInitials(getDisplayName())}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                {getDisplayName()}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                {user?.email}
              </div>
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'var(--transition)'
            }}>
              ▼
            </div>
          </button>
          
          {isDropdownOpen && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: getProfileColor(getDisplayName()),
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem'
                }}>
                  {getUserInitials(getDisplayName())}
                </div>
                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>
                  {getDisplayName()}
                </h4>
                <p style={{ 
                  margin: '0.25rem 0 0 0', 
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)' 
                }}>
                  {user?.email}
                </p>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={handleEditProfile}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-md)',
                    transition: 'var(--transition)',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(5, 150, 105, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>⚙️</span>
                  <span>Edit Profile</span>
                </button>
                
                <div className="dropdown-divider"></div>
                
                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-md)',
                    transition: 'var(--transition)',
                    color: 'var(--error-color)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
