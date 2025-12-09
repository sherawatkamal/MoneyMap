/* Settings.tsx

Kamal Sherawat Virginia Tech August 22, 2025

User settings page for editing profile information, financial preferences,
budget allocations, and emergency fund configurations.

*/

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

interface Preferences {
  emergency_fund_target: number | null;
  monthly_contribution: number | null;
  emergency_goal: string | null;
  budget_housing_percent: number | null;
  budget_food_percent: number | null;
  budget_transportation_percent: number | null;
  budget_utilities_percent: number | null;
  budget_entertainment_percent: number | null;
  budget_other_percent: number | null;
}

interface Profile {
  full_name: string | null;
  email: string;
  phone: string | null;
  age: number | null;
  occupation: string | null;
  annual_income: number | null;
  current_savings: number | null;
  monthly_expenses: number | null;
  financial_goal: string | null;
  risk_tolerance: string | null;
}

export default function Settings() {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>({
    emergency_fund_target: null,
    monthly_contribution: null,
    emergency_goal: null,
    budget_housing_percent: null,
    budget_food_percent: null,
    budget_transportation_percent: null,
    budget_utilities_percent: null,
    budget_entertainment_percent: null,
    budget_other_percent: null,
  });
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    email: '',
    phone: '',
    age: null,
    occupation: '',
    annual_income: null,
    current_savings: null,
    monthly_expenses: null,
    financial_goal: '',
    risk_tolerance: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchPreferences();
    fetchProfile();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('http://localhost:5001/user-preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        // Update profile with financial foundation data
        setProfile(prev => ({
          ...prev,
          current_savings: data.current_savings,
          monthly_expenses: data.monthly_expenses,
        }));
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:5001/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({
          ...prev,
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age || null,
          occupation: data.occupation || '',
          annual_income: data.annual_income || null,
          financial_goal: data.financial_goal || '',
          risk_tolerance: data.risk_tolerance || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('http://localhost:5001/user-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage('Emergency fund preferences updated successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage(data.msg || 'Error updating preferences');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setToastMessage('Error updating preferences');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Preferences, value: string | number | null) => {
    setPreferences({
      ...preferences,
      [field]: value === '' ? null : value,
    });
  };

  const handleProfileInputChange = (field: keyof Profile, value: string | number | null) => {
    setProfile({
      ...profile,
      [field]: value === '' ? null : value,
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const response = await fetch('http://localhost:5001/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage('Profile updated successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage(data.msg || 'Error updating profile');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setToastMessage('Error updating profile');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page fade-in">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          fontSize: '1.2rem',
          color: 'var(--text-secondary)'
        }}>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page fade-in">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div className="settings-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>⚙️</span>
            Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Manage your profile and financial preferences
          </p>
        </div>

        {/* Profile Information Section */}
        <div className="settings-section" style={{ marginBottom: '2rem' }}>
          <div className="section-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👤</span>
              Profile Information
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Update your personal and financial information
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ marginTop: '2rem' }}>
            <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="fullName">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Full Name
                  </span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={profile.full_name || ''}
                  onChange={(e) => handleProfileInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={profile.email}
                  disabled
                  style={{ backgroundColor: 'rgba(0,0,0,0.05)', cursor: 'not-allowed' }}
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Email cannot be changed
                </small>
              </div>
            </div>

            <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="phone">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="age">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Age
                  </span>
                </label>
                <input
                  type="number"
                  id="age"
                  value={profile.age || ''}
                  onChange={(e) => handleProfileInputChange('age', parseInt(e.target.value) || null)}
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                />
              </div>
            </div>

            <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="occupation">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Occupation
                  </span>
                </label>
                <input
                  type="text"
                  id="occupation"
                  value={profile.occupation || ''}
                  onChange={(e) => handleProfileInputChange('occupation', e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div className="form-group">
                <label htmlFor="annualIncome">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Annual Income ($)
                  </span>
                </label>
                <input
                  type="number"
                  id="annualIncome"
                  value={profile.annual_income || ''}
                  onChange={(e) => handleProfileInputChange('annual_income', parseFloat(e.target.value) || null)}
                  placeholder="Enter annual income"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="currentSavings">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏦 Current Savings ($)
                  </span>
                </label>
                <input
                  type="number"
                  id="currentSavings"
                  value={profile.current_savings || ''}
                  onChange={(e) => handleProfileInputChange('current_savings', parseFloat(e.target.value) || null)}
                  placeholder="Enter your current savings"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="monthlyExpenses">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💳 Monthly Expenses ($)
                  </span>
                </label>
                <input
                  type="number"
                  id="monthlyExpenses"
                  value={profile.monthly_expenses || ''}
                  onChange={(e) => handleProfileInputChange('monthly_expenses', parseFloat(e.target.value) || null)}
                  placeholder="Enter monthly expenses"
                  min="0"
                  step="0.01"
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Estimated as 70% of monthly income if left blank
                </small>
              </div>
            </div>

            <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="financialGoal">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Financial Goal
                  </span>
                </label>
                <select
                  id="financialGoal"
                  value={profile.financial_goal || ''}
                  onChange={(e) => handleProfileInputChange('financial_goal', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Select goal</option>
                  <option value="emergency-fund">Build Emergency Fund</option>
                  <option value="retirement">Save for Retirement</option>
                  <option value="house">Buy a House</option>
                  <option value="education">Education Fund</option>
                  <option value="debt-payoff">Pay Off Debt</option>
                  <option value="investment">Grow Investments</option>
                  <option value="vacation">Save for Vacation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="riskTolerance">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Risk Tolerance
                  </span>
                </label>
                <select
                  id="riskTolerance"
                  value={profile.risk_tolerance || ''}
                  onChange={(e) => handleProfileInputChange('risk_tolerance', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Select tolerance</option>
                  <option value="conservative">Conservative (Low Risk)</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="aggressive">Aggressive (High Risk)</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={savingProfile}
                className={savingProfile ? 'btn-disabled' : 'btn-primary'}
                style={{
                  background: savingProfile ? '' : 'var(--bg-gradient-alt)',
                  border: 'none',
                  minWidth: '150px',
                }}
              >
                {savingProfile ? 'Saving...' : '💾 Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Emergency Fund Preferences Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🛡️</span>
              Emergency Fund Preferences
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Configure your emergency fund goals and savings strategy
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
            <div className="form-group">
              <label htmlFor="targetAmount">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎯 Target Amount ($)
                </span>
              </label>
              <input
                type="number"
                id="targetAmount"
                value={preferences.emergency_fund_target || ''}
                onChange={(e) => handleInputChange('emergency_fund_target', parseFloat(e.target.value) || null)}
                placeholder="Enter your emergency fund target"
                min="0"
                step="0.01"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Recommended: 3-6 months of expenses
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="monthlyContribution">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💰 Monthly Contribution ($)
                </span>
              </label>
              <input
                type="number"
                id="monthlyContribution"
                value={preferences.monthly_contribution || ''}
                onChange={(e) => handleInputChange('monthly_contribution', parseFloat(e.target.value) || null)}
                placeholder="Enter monthly contribution"
                min="0"
                step="0.01"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                How much you plan to save monthly towards your emergency fund
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="emergencyGoal">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📝 Emergency Goal
                </span>
              </label>
              <textarea
                id="emergencyGoal"
                value={preferences.emergency_goal || ''}
                onChange={(e) => handleInputChange('emergency_goal', e.target.value || null)}
                placeholder="Describe your emergency fund goals (e.g., 'Save for unexpected medical expenses')"
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'var(--transition)',
                }}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Optional: Add notes about your emergency fund purpose
              </small>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
                className={saving ? 'btn-disabled' : 'btn-primary'}
                style={{
                  background: saving ? '' : 'var(--bg-gradient-alt)',
                  border: 'none',
                  minWidth: '150px',
                }}
              >
                {saving ? 'Saving...' : '💾 Save Preferences'}
              </button>
            </div>
          </form>

          {preferences.emergency_fund_target && preferences.monthly_contribution && preferences.monthly_contribution > 0 && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <h3 style={{ marginTop: 0, color: 'var(--success-color)' }}>📊 Projected Timeline</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                With a monthly contribution of <strong>${preferences.monthly_contribution.toLocaleString()}</strong> and a target of <strong>${preferences.emergency_fund_target.toLocaleString()}</strong>,
                you will reach your goal in approximately{' '}
                <strong>{Math.ceil(preferences.emergency_fund_target / preferences.monthly_contribution)} months</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Budget Breakdown Preferences Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              Budget Breakdown Preferences
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Customize how your monthly expenses are distributed across categories (percentages should total to 100%)
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
            <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="housingPercent">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏠 Housing (%)
                  </span>
                </label>
                <input
                  type="number"
                  id="housingPercent"
                  value={preferences.budget_housing_percent || ''}
                  onChange={(e) => handleInputChange('budget_housing_percent', parseFloat(e.target.value) || null)}
                  placeholder="30"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="foodPercent">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🍔 Food (%)
                  </span>
                </label>
                <input
                  type="number"
                  id="foodPercent"
                  value={preferences.budget_food_percent || ''}
                  onChange={(e) => handleInputChange('budget_food_percent', parseFloat(e.target.value) || null)}
                  placeholder="15"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="transportationPercent">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🚗 Transportation (%)
                  </span>
                </label>
                <input
                  type="number"
                  id="transportationPercent"
                  value={preferences.budget_transportation_percent || ''}
                  onChange={(e) => handleInputChange('budget_transportation_percent', parseFloat(e.target.value) || null)}
                  placeholder="15"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="utilitiesPercent">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚡ Utilities (%)
                  </span>
                </label>
                <input
                  type="number"
                  id="utilitiesPercent"
                  value={preferences.budget_utilities_percent || ''}
                  onChange={(e) => handleInputChange('budget_utilities_percent', parseFloat(e.target.value) || null)}
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="entertainmentPercent">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🎬 Entertainment (%)
                  </span>
                </label>
                <input
                  type="number"
                  id="entertainmentPercent"
                  value={preferences.budget_entertainment_percent || ''}
                  onChange={(e) => handleInputChange('budget_entertainment_percent', parseFloat(e.target.value) || null)}
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="otherPercent">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📦 Other (%)
                  </span>
                </label>
                <input
                  type="number"
                  id="otherPercent"
                  value={preferences.budget_other_percent || ''}
                  onChange={(e) => handleInputChange('budget_other_percent', parseFloat(e.target.value) || null)}
                  placeholder="20"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            {/* Calculate and display total */}
            {(() => {
              const total = [
                preferences.budget_housing_percent,
                preferences.budget_food_percent,
                preferences.budget_transportation_percent,
                preferences.budget_utilities_percent,
                preferences.budget_entertainment_percent,
                preferences.budget_other_percent
              ].reduce((sum, val) => sum + (val || 0), 0);
              
              return (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: total === 100 ? 'rgba(16, 185, 129, 0.1)' : total > 100 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                  border: total === 100 ? '2px solid rgba(16, 185, 129, 0.2)' : total > 100 ? '2px solid rgba(239, 68, 68, 0.2)' : '2px solid rgba(251, 191, 36, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center'
                }}>
                  <strong style={{ 
                    color: total === 100 ? 'var(--success-color)' : total > 100 ? '#ef4444' : '#fbbf24',
                    fontSize: '1.1rem'
                  }}>
                    Total: {total.toFixed(1)}%
                  </strong>
                  {total !== 100 && (
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {total > 100 ? 'Total exceeds 100%. Please adjust the percentages.' : total < 100 && 'Total is less than 100%. You may want to distribute the remaining percentage.'}
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
                className={saving ? 'btn-disabled' : 'btn-primary'}
                style={{
                  background: saving ? '' : 'var(--bg-gradient-alt)',
                  border: 'none',
                  minWidth: '150px',
                }}
              >
                {saving ? 'Saving...' : '💾 Save Budget Preferences'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

