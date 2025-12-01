import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

interface Question {
  id: string;
  text: string;
  options: {
    value: string;
    label: string;
    score: number;
  }[];
}

const questions: Question[] = [
  {
    id: 'time_horizon',
    text: 'What is your investment time horizon?',
    options: [
      { value: 'short', label: 'Less than 3 years', score: 2 },
      { value: 'medium', label: '3-10 years', score: 5 },
      { value: 'long', label: 'More than 10 years', score: 8 },
    ],
  },
  {
    id: 'loss_reaction',
    text: 'How would you react if your portfolio lost 20% in one year?',
    options: [
      { value: 'panic', label: 'Sell everything immediately', score: 1 },
      { value: 'concerned', label: 'Feel concerned but hold', score: 4 },
      { value: 'opportunity', label: 'See it as a buying opportunity', score: 9 },
    ],
  },
  {
    id: 'experience',
    text: 'What is your investment experience?',
    options: [
      { value: 'none', label: 'No experience', score: 2 },
      { value: 'some', label: 'Some experience (1-5 years)', score: 5 },
      { value: 'experienced', label: 'Experienced (5+ years)', score: 8 },
    ],
  },
  {
    id: 'income_stability',
    text: 'How stable is your income?',
    options: [
      { value: 'unstable', label: 'Unstable or irregular', score: 2 },
      { value: 'stable', label: 'Stable with occasional changes', score: 5 },
      { value: 'very_stable', label: 'Very stable and growing', score: 8 },
    ],
  },
  {
    id: 'primary_goal',
    text: 'What is your primary investment goal?',
    options: [
      { value: 'preserve', label: 'Preserve capital', score: 2 },
      { value: 'growth', label: 'Steady growth', score: 5 },
      { value: 'aggressive', label: 'Maximum growth', score: 9 },
    ],
  },
  {
    id: 'volatility_comfort',
    text: 'How comfortable are you with portfolio volatility?',
    options: [
      { value: 'low', label: 'Prefer stable, predictable returns', score: 2 },
      { value: 'medium', label: 'Some volatility is acceptable', score: 5 },
      { value: 'high', label: 'High volatility for higher returns', score: 9 },
    ],
  },
];

export default function RiskAssessment() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = (questionId: string, score: number) => {
    setAnswers({ ...answers, [questionId]: score });
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      calculateAndSubmitRiskScore();
    }
  };

  const calculateAndSubmitRiskScore = async () => {
    setIsSubmitting(true);
    
    // Calculate average score (1-10 scale)
    const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / questions.length;
    const riskTolerance = Math.round(averageScore);

    try {
      const response = await fetch('http://localhost:5001/update-risk-tolerance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ risk_tolerance: riskTolerance }),
      });

      if (response.ok) {
        setToastMessage(`Risk tolerance updated to ${riskTolerance}/10!`);
        setToastType('success');
        setShowToast(true);
        setTimeout(() => {
          navigate('/investments');
        }, 1500);
      } else {
        setToastMessage('Error updating risk tolerance');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error updating risk tolerance:', error);
      setToastMessage('Error updating risk tolerance');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const isAnswered = answers[currentQ.id] !== undefined;

  return (
    <div className="dashboard-page fade-in">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem', background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            🎯 Risk Assessment
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Answer these questions to determine your risk tolerance
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'var(--bg-gradient-alt)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        {/* Question Card */}
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>
            {currentQ.text}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(currentQ.id, option.score)}
                style={{
                  padding: '1.25rem',
                  textAlign: 'left',
                  background: answers[currentQ.id] === option.score
                    ? 'var(--bg-gradient-alt)'
                    : 'rgba(0,0,0,0.02)',
                  border: `2px solid ${
                    answers[currentQ.id] === option.score
                      ? 'var(--primary-color)'
                      : 'transparent'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  fontWeight: answers[currentQ.id] === option.score ? 600 : 400
                }}
                onMouseEnter={(e) => {
                  if (answers[currentQ.id] !== option.score) {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (answers[currentQ.id] !== option.score) {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: currentQuestion === 0 ? '#e5e7eb' : 'white',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQuestion === 0 ? 0.5 : 1,
              color: 'var(--text-primary)'
            }}
          >
            ← Previous
          </button>

          {isSubmitting && (
            <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', color: 'var(--text-primary)' }}>
              Calculating your risk score...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
