import React, { useState } from 'react';
import './App.css';

// Simple types
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
    <div className="form-container">
      <h2>Financial Foundation</h2>
      <p>Enter your basic financial information</p>
      
      <div className="form-group">
        <label>Current Savings ($)</label>
        <input
          type="number"
          value={data.currentSavings || ''}
          onChange={(e) => handleInputChange('currentSavings', e.target.value)}
          placeholder="Enter your current savings"
        />
      </div>

      <div className="form-group">
        <label>Monthly Income ($)</label>
        <input
          type="number"
          value={data.monthlyIncome || ''}
          onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
          placeholder="Enter your monthly income"
        />
      </div>

      <div className="form-group">
        <label>Monthly Expenses ($)</label>
        <input
          type="number"
          value={data.monthlyExpenses || ''}
          onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
          placeholder="Enter your monthly expenses"
        />
      </div>

      <div className="summary">
        <h3>Summary</h3>
        <p>Monthly Surplus: ${(data.monthlyIncome - data.monthlyExpenses).toLocaleString()}</p>
        <p>Available for Investment: ${data.currentSavings.toLocaleString()}</p>
      </div>

      <button 
        onClick={onNext} 
        disabled={!isFormValid}
        className={isFormValid ? 'btn-primary' : 'btn-disabled'}
      >
        Continue to Recommendations
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
    <div className="recommendations-container">
      <h2>Your Financial Recommendations</h2>
      
      <div className="recommendation-card">
        <h3>Emergency Fund</h3>
        <p className="amount">${emergencyFund.toLocaleString()}</p>
        <p>Keep 6 months of expenses in a high-yield savings account</p>
      </div>

      <div className="recommendation-card">
        <h3>Available for Investment</h3>
        <p className="amount">${Math.max(0, availableForInvestment).toLocaleString()}</p>
        <p>Invest in a diversified portfolio based on your risk tolerance</p>
      </div>

      <div className="recommendation-card">
        <h3>Monthly Investment</h3>
        <p className="amount">${Math.max(0, monthlySurplus).toLocaleString()}</p>
        <p>Consider investing your monthly surplus for long-term growth</p>
      </div>

      <div className="actions">
        <button onClick={onBack} className="btn-secondary">
          Back to Form
        </button>
        <button className="btn-primary">
          Export Plan
        </button>
      </div>
    </div>
  );
};

// Main App Component
function App() {
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
      <header className="header">
        <h1>MoneyMap</h1>
        <p>Simple Financial Planning</p>
      </header>

      <main className="main">
        {currentStep === 0 ? (
          <FinancialForm 
            data={financialData} 
            setData={setFinancialData} 
            onNext={nextStep} 
          />
        ) : (
          <Recommendations 
            data={financialData} 
            onBack={prevStep} 
          />
        )}
      </main>
    </div>
  );
}

export default App;