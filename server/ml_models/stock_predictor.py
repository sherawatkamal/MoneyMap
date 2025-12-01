"""
ML-powered stock prediction and risk assessment module
"""

import numpy as np
import requests
import os
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from dotenv import load_dotenv

load_dotenv()

# Mock stock data for demonstration (in production, use real APIs like Alpha Vantage)
STOCK_DATA = {
    # Conservative stocks (Low volatility, stable returns)
    'conservative': [
        {
            'ticker': 'AAPL',
            'name': 'Apple Inc.',
            'current_price': 178.50,
            'beta': 1.15,
            'volatility': 0.22,
            'dividend_yield': 0.52,
            'sector': 'Technology',
            'predicted_return_1yr': 8.5,
            'risk_score': 2.5
        },
        {
            'ticker': 'MSFT',
            'name': 'Microsoft Corporation',
            'current_price': 378.85,
            'beta': 0.90,
            'volatility': 0.25,
            'dividend_yield': 0.75,
            'sector': 'Technology',
            'predicted_return_1yr': 9.2,
            'risk_score': 2.8
        },
        {
            'ticker': 'JNJ',
            'name': 'Johnson & Johnson',
            'current_price': 155.30,
            'beta': 0.60,
            'volatility': 0.18,
            'dividend_yield': 3.12,
            'sector': 'Healthcare',
            'predicted_return_1yr': 6.5,
            'risk_score': 1.5
        },
        {
            'ticker': 'VZ',
            'name': 'Verizon Communications',
            'current_price': 41.20,
            'beta': 0.45,
            'volatility': 0.15,
            'dividend_yield': 6.80,
            'sector': 'Telecommunications',
            'predicted_return_1yr': 5.8,
            'risk_score': 1.2
        },
        {
            'ticker': 'KO',
            'name': 'The Coca-Cola Company',
            'current_price': 59.85,
            'beta': 0.55,
            'volatility': 0.16,
            'dividend_yield': 3.15,
            'sector': 'Consumer Staples',
            'predicted_return_1yr': 5.2,
            'risk_score': 1.0
        }
    ],
    
    # Moderate stocks (Balanced risk-return profile)
    'moderate': [
        {
            'ticker': 'GOOGL',
            'name': 'Alphabet Inc.',
            'current_price': 142.30,
            'beta': 1.05,
            'volatility': 0.30,
            'dividend_yield': 0.00,
            'sector': 'Technology',
            'predicted_return_1yr': 12.5,
            'risk_score': 5.0
        },
        {
            'ticker': 'AMZN',
            'name': 'Amazon.com Inc.',
            'current_price': 146.80,
            'beta': 1.18,
            'volatility': 0.35,
            'dividend_yield': 0.00,
            'sector': 'Consumer Discretionary',
            'predicted_return_1yr': 11.8,
            'risk_score': 5.5
        },
        {
            'ticker': 'META',
            'name': 'Meta Platforms Inc.',
            'current_price': 383.50,
            'beta': 1.25,
            'volatility': 0.40,
            'dividend_yield': 0.50,
            'sector': 'Technology',
            'predicted_return_1yr': 13.2,
            'risk_score': 6.0
        },
        {
            'ticker': 'DIS',
            'name': 'The Walt Disney Company',
            'current_price': 96.20,
            'beta': 1.30,
            'volatility': 0.32,
            'dividend_yield': 0.45,
            'sector': 'Entertainment',
            'predicted_return_1yr': 10.5,
            'risk_score': 5.8
        },
        {
            'ticker': 'NFLX',
            'name': 'Netflix Inc.',
            'current_price': 485.40,
            'beta': 1.45,
            'volatility': 0.45,
            'dividend_yield': 0.00,
            'sector': 'Entertainment',
            'predicted_return_1yr': 15.2,
            'risk_score': 7.0
        }
    ],
    
    # Aggressive stocks (High risk, high potential returns)
    'aggressive': [
        {
            'ticker': 'TSLA',
            'name': 'Tesla Inc.',
            'current_price': 248.60,
            'beta': 1.85,
            'volatility': 0.65,
            'dividend_yield': 0.00,
            'sector': 'Automotive',
            'predicted_return_1yr': 22.5,
            'risk_score': 9.0
        },
        {
            'ticker': 'NVDA',
            'name': 'NVIDIA Corporation',
            'current_price': 878.40,
            'beta': 1.65,
            'volatility': 0.55,
            'dividend_yield': 0.03,
            'sector': 'Technology',
            'predicted_return_1yr': 28.5,
            'risk_score': 8.5
        },
        {
            'ticker': 'AMD',
            'name': 'Advanced Micro Devices',
            'current_price': 151.20,
            'beta': 1.70,
            'volatility': 0.60,
            'dividend_yield': 0.00,
            'sector': 'Technology',
            'predicted_return_1yr': 25.3,
            'risk_score': 8.8
        },
        {
            'ticker': 'RIVN',
            'name': 'Rivian Automotive',
            'current_price': 14.85,
            'beta': 2.10,
            'volatility': 0.75,
            'dividend_yield': 0.00,
            'sector': 'Automotive',
            'predicted_return_1yr': 35.0,
            'risk_score': 9.5
        },
        {
            'ticker': 'SNOW',
            'name': 'Snowflake Inc.',
            'current_price': 178.90,
            'beta': 1.55,
            'volatility': 0.58,
            'dividend_yield': 0.00,
            'sector': 'Technology',
            'predicted_return_1yr': 20.8,
            'risk_score': 8.2
        }
    ]
}


def calculate_risk_score(stock: Dict) -> float:
    """
    Calculate risk score based on beta and volatility
    Lower score = safer, Higher score = riskier
    """
    beta_weight = 0.6
    volatility_weight = 0.4
    
    # Normalize beta (typically 0-3 range)
    beta_norm = min(stock.get('beta', 1.0), 3.0) / 3.0
    
    # Normalize volatility (typically 0-1 range)
    vol_norm = min(stock.get('volatility', 0.3), 1.0)
    
    # Calculate weighted risk score (1-10 scale)
    risk_score = (beta_norm * beta_weight + vol_norm * volatility_weight) * 10
    
    return round(risk_score, 1)


def predict_returns(stock: Dict) -> float:
    """
    Predict 1-year return based on historical patterns
    Uses a combination of metrics
    """
    base_return = stock.get('volatility', 0.3) * 30  # Basic volatility-based estimate
    
    # Adjust based on beta
    beta_adjustment = (stock.get('beta', 1.0) - 1.0) * 5
    
    # Consider dividend yield
    dividend_adjustment = stock.get('dividend_yield', 0) * 2
    
    predicted_return = base_return + beta_adjustment + dividend_adjustment
    
    # Cap at reasonable ranges
    if stock.get('beta', 1.0) < 0.8:
        predicted_return = min(predicted_return, 12.0)
    elif stock.get('beta', 1.0) > 1.5:
        predicted_return = min(predicted_return, 40.0)
    else:
        predicted_return = min(predicted_return, 20.0)
    
    return round(predicted_return, 1)


def get_recommendations(risk_tolerance: int) -> List[Dict]:
    """
    Get stock recommendations based on user's risk tolerance
    Returns filtered and sorted list of stocks
    """
    # Determine which category to use
    if risk_tolerance <= 3:
        category = 'conservative'
    elif risk_tolerance <= 7:
        category = 'moderate'
    else:
        category = 'aggressive'
    
    # Get stocks from appropriate category
    stocks = STOCK_DATA.get(category, [])
    
    # Add calculated predictions and category to each stock
    for stock in stocks:
        stock['predicted_return_1yr'] = predict_returns(stock)
        stock['risk_score'] = calculate_risk_score(stock)
        # Add category (stocks, bonds, etf, crypto)
        ticker = stock.get('ticker', '')
        if ticker in ['BTC', 'ETH'] or 'Bitcoin' in stock.get('name', '') or 'Ethereum' in stock.get('name', ''):
            stock['category'] = 'crypto'
        elif 'ETF' in stock.get('name', '') or ticker in ['SPY', 'VTI', 'VXUS', 'BND']:
            stock['category'] = 'etf'
        elif stock.get('sector', '') == 'Bonds' or 'Bond' in stock.get('name', ''):
            stock['category'] = 'bonds'
        else:
            stock['category'] = 'stocks'
    
    # Sort by predicted returns (highest first)
    stocks.sort(key=lambda x: x['predicted_return_1yr'], reverse=True)
    
    return stocks


def categorize_stock(beta: float, volatility: float) -> str:
    """
    Categorize stock as Conservative, Moderate, or Aggressive
    """
    if beta < 0.8 and volatility < 0.25:
        return 'Conservative'
    elif beta > 1.2 and volatility > 0.50:
        return 'Aggressive'
    else:
        return 'Moderate'


def get_stock_details(ticker: str) -> Dict:
    """
    Get detailed information about a specific stock
    """
    all_stocks = STOCK_DATA['conservative'] + STOCK_DATA['moderate'] + STOCK_DATA['aggressive']
    
    for stock in all_stocks:
        if stock['ticker'].upper() == ticker.upper():
            # Add category
            if ticker.upper() in ['BTC', 'ETH'] or 'Bitcoin' in stock.get('name', '') or 'Ethereum' in stock.get('name', ''):
                stock['category'] = 'crypto'
            elif 'ETF' in stock.get('name', '') or ticker.upper() in ['SPY', 'VTI', 'VXUS', 'BND']:
                stock['category'] = 'etf'
            elif stock.get('sector', '') == 'Bonds' or 'Bond' in stock.get('name', ''):
                stock['category'] = 'bonds'
            else:
                stock['category'] = 'stocks'
            return stock
    
    return None

