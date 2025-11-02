import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderLeftColor: 'var(--success-color)',
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderLeftColor: 'var(--error-color)',
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderLeftColor: '#3b82f6',
        };
      default:
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderLeftColor: 'var(--success-color)',
        };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        minWidth: '300px',
        maxWidth: '400px',
        padding: '1rem 1.5rem',
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        borderLeft: `4px solid ${getToastStyles().borderLeftColor}`,
        zIndex: 10000,
        transform: isVisible ? 'translateX(0)' : 'translateX(500px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        ...getToastStyles(),
      }}
    >
      <div style={{ fontSize: '1.5rem' }}>
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'info' && 'ℹ'}
      </div>
      <div style={{ flex: 1, color: 'white', fontWeight: 500 }}>{message}</div>
    </div>
  );
};

export default Toast;

