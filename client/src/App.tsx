import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Simple types (kept to preserve existing planner)
interface FinancialData {
  currentSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

// Component 1: Financial Input Form
const FinancialForm: React.FC<{
  data: FinancialData;
  setData: (data: FinancialData) => void;
  onNext: () => void;
}> = ({ data, setData, onNext }) => {
  const handleInputChange = (field: keyof FinancialData, value: string) => {
    setData({ ...data, [field]: parseFloat(value) || 0 });
  };

  const isFormValid = data.currentSavings > 0 && data.monthlyIncome > 0 && data.monthlyExpenses > 0;

  return (
    <div className="form-container fade-in">
      <div style={{textAlign: 'center', marginBottom: '2rem'}}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'var(--bg-gradient-alt)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          fontSize: '2rem'
        }}>
          💰
        </div>
        <h2>Financial Foundation</h2>
        <p>Enter your basic financial information to get started</p>
      </div>
      
      <div className="form-group">
        <label>
          <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            🏦 Current Savings ($)
          </span>
        </label>
        <input
          type="number"
          value={data.currentSavings || ''}
          onChange={(e) => handleInputChange('currentSavings', e.target.value)}
          placeholder="Enter your current savings"
        />
      </div>
      
      <div className="form-group">
        <label>
          <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            💼 Monthly Income ($)
          </span>
        </label>
        <input
          type="number"
          value={data.monthlyIncome || ''}
          onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
          placeholder="Enter your monthly income"
        />
      </div>
      
      <div className="form-group">
        <label>
          <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            💳 Monthly Expenses ($)
          </span>
        </label>
        <input
          type="number"
          value={data.monthlyExpenses || ''}
          onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
          placeholder="Enter your monthly expenses"
        />
      </div>
      
      <div className="summary">
        <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          📊 Financial Summary
        </h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <p style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <span>Monthly Surplus:</span>
            <strong style={{color: 'var(--success-color)', fontSize: '1.2rem'}}>
              ${(data.monthlyIncome - data.monthlyExpenses).toLocaleString()}
            </strong>
          </p>
          <p style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(5, 150, 105, 0.2)'
          }}>
            <span>Available for Investment:</span>
            <strong style={{color: 'var(--primary-color)', fontSize: '1.2rem'}}>
              ${data.currentSavings.toLocaleString()}
            </strong>
          </p>
        </div>
      </div>
      
      <button
        onClick={onNext}
        disabled={!isFormValid}
        className={isFormValid ? 'btn-primary' : 'btn-disabled'}
        style={{
          background: isFormValid ? 'var(--bg-gradient-alt)' : '',
          border: 'none'
        }}
      >
        {isFormValid ? '📈 Continue to Recommendations' : 'Please fill all fields'}
      </button>
    </div>
  );
};

// Component 2: Simple Recommendations
const Recommendations: React.FC<{
  data: FinancialData;
  onBack: () => void;
}> = ({ data, onBack }) => {
  const monthlySurplus = data.monthlyIncome - data.monthlyExpenses;
  const emergencyFund = data.monthlyExpenses * 6; // 6 months
  const availableForInvestment = data.currentSavings - emergencyFund;

  return (
    <div className="recommendations-container fade-in">
      <div style={{textAlign: 'center', marginBottom: '3rem'}}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'var(--bg-gradient-alt)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '3rem'
        }}>
          🎯
        </div>
        <h2>Your Financial Recommendations</h2>
        <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem'}}>
          Based on your financial data, here's your personalized plan
        </p>
      </div>

      <div style={{display: 'grid', gap: '2rem', marginBottom: '3rem'}}>
        <div className="recommendation-card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)',
          borderLeft: '5px solid var(--success-color)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'var(--success-color)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🛡️
            </div>
            <h3 style={{color: 'var(--success-color)', margin: 0}}>Emergency Fund</h3>
          </div>
          <p className="amount" style={{color: 'var(--success-color)'}}>
            ${emergencyFund.toLocaleString()}
          </p>
          <p>Keep 6 months of expenses in a high-yield savings account for unexpected situations</p>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            💡 <strong>Tip:</strong> This fund should be easily accessible but separate from your daily checking account.
          </div>
        </div>

        <div className="recommendation-card" style={{
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)',
          borderLeft: '5px solid var(--primary-color)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'var(--primary-color)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              📈
            </div>
            <h3 style={{color: 'var(--primary-color)', margin: 0}}>Available for Investment</h3>
          </div>
          <p className="amount" style={{color: 'var(--primary-color)'}}>
            ${Math.max(0, availableForInvestment).toLocaleString()}
          </p>
          <p>Invest in a diversified portfolio based on your risk tolerance and time horizon</p>
          <div style={{
            background: 'rgba(5, 150, 105, 0.1)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            💡 <strong>Tip:</strong> Consider index funds or ETFs for broad market exposure with lower fees.
          </div>
        </div>

        <div className="recommendation-card" style={{
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)',
          borderLeft: '5px solid var(--secondary-color)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'var(--secondary-color)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              💰
            </div>
            <h3 style={{color: 'var(--secondary-color)', margin: 0}}>Monthly Investment</h3>
          </div>
          <p className="amount" style={{color: 'var(--secondary-color)'}}>
            ${Math.max(0, monthlySurplus).toLocaleString()}
          </p>
          <p>Consider investing your monthly surplus for long-term growth and compound interest</p>
          <div style={{
            background: 'rgba(22, 163, 74, 0.1)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            💡 <strong>Tip:</strong> Set up automatic monthly transfers to make investing a habit.
          </div>
        </div>
      </div>

      <div className="actions">
        <button onClick={onBack} className="btn-secondary">
          ← Back to Form
        </button>
        <button className="btn-primary" style={{background: 'var(--bg-gradient-alt)'}}>
          📄 Export Plan
        </button>
      </div>
    </div>
  );
};

function PlannerApp() {
  const [currentStep, setCurrentStep] = useState(0);
  const [financialData, setFinancialData] = useState<FinancialData>({
    currentSavings: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const nextStep = () => setCurrentStep(1);
  const prevStep = () => setCurrentStep(0);

  return (
    <div className="app">
      <main className="main">
        {currentStep === 0 ? (
          <FinancialForm data={financialData} setData={setFinancialData} onNext={nextStep} />
        ) : (
          <Recommendations data={financialData} onBack={prevStep} />
        )}
      </main>
    </div>
  );
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: 'var(--text-secondary)'
      }}>
        Loading...
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirects authenticated users to dashboard)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: 'var(--text-secondary)'
      }}>
        Loading...
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

function AppContent() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } 
        />
        <Route 
          path="/reset-password" 
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/planner" 
          element={
            <ProtectedRoute>
              <PlannerApp />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;