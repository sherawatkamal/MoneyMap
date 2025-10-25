import React from 'react';

interface MoneyMapLogoProps {
  size?: number;
  className?: string;
}

const MoneyMapLogo: React.FC<MoneyMapLogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle with Gradient */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="moneyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      
      {/* Main Circle Background */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#logoGradient)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="2"
      />
      
      {/* Dollar Sign */}
      <path
        d="M35 25 L35 75 M45 25 L45 75 M30 35 Q35 30 40 35 Q45 40 50 35 M30 65 Q35 60 40 65 Q45 70 50 65"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Map/Chart Lines */}
      <path
        d="M55 35 L65 25 L75 40 L85 30 L90 45"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      
      {/* Data Points */}
      <circle cx="55" cy="35" r="3" fill="white" opacity="0.9" />
      <circle cx="65" cy="25" r="3" fill="white" opacity="0.9" />
      <circle cx="75" cy="40" r="3" fill="white" opacity="0.9" />
      <circle cx="85" cy="30" r="3" fill="white" opacity="0.9" />
      <circle cx="90" cy="45" r="3" fill="white" opacity="0.9" />
      
      {/* Small Coin/Investment Symbol */}
      <circle
        cx="70"
        cy="70"
        r="8"
        fill="url(#coinGradient)"
        stroke="white"
        strokeWidth="1.5"
      />
      <text
        x="70"
        y="75"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="white"
      >
        $
      </text>
      
      {/* Growth Arrow */}
      <path
        d="M60 60 L75 55 L70 65 L65 60 Z"
        fill="white"
        opacity="0.8"
      />
      
      {/* Subtle shine effect */}
      <ellipse
        cx="40"
        cy="30"
        rx="15"
        ry="20"
        fill="rgba(255, 255, 255, 0.1)"
        transform="rotate(-30 40 30)"
      />
    </svg>
  );
};

export default MoneyMapLogo;
