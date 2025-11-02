# MoneyMap - Complete Application Workflow

## 📋 Overview

**MoneyMap** is a comprehensive personal financial planning application that helps users manage their finances, set goals, and visualize their financial health through interactive dashboards and charts.

### Tech Stack
- **Frontend**: React 19.1.1 + TypeScript + Vite
- **Backend**: Flask (Python) + MySQL
- **Authentication**: JWT + Google OAuth
- **Database**: MySQL with data encryption
- **Styling**: Custom CSS with gradient design system

---

## 🔄 Complete User Workflow

### 1. **Initial Setup & Authentication**

#### **Registration Flow** (Multi-Step Signup)
```
Step 1: Basic Information
├── Full Name
├── Email (used as username)
├── Phone Number (optional)
└── Age (18-100)

Step 2: Financial Foundation ⭐
├── Occupation
├── Annual Income
├── Current Savings
└── Monthly Expenses

Step 3: Financial Goals
├── Primary Financial Goal (dropdown)
│   └── Options: Emergency Fund, Retirement, House, Education, Debt Payoff, Investment, Vacation, Other
└── Risk Tolerance (dropdown)
    └── Options: Conservative, Moderate, Aggressive

Step 4: Security
├── Password
├── Confirm Password
└── Terms & Conditions Acceptance
```

**Backend Processing:**
- Validates all inputs (age range, non-negative values)
- Hashes password with bcrypt
- Encrypts annual income before storing
- Creates user record in `users` table
- Creates financial preferences in `user_preferences` table
- Auto-logs in user with JWT token
- Redirects to Financial Visualization Dashboard

#### **Login Flow**
```
User Input → POST /login
├── Verify credentials (bcrypt)
├── Generate JWT token
├── Fetch user profile data
└── Store token & user data in localStorage
```

**Alternatives:**
- Google OAuth Sign-In (creates account if new)
- Password Reset Flow (email-based token system)

---

### 2. **Post-Registration Landing: Financial Visualization Dashboard**

After signup, users land on `/visualization` with:

#### **Financial Overview Cards**
- 💰 Monthly Income (calculated from annual income / 12)
- 💳 Monthly Expenses (from profile or estimated)
- 📈 Monthly Surplus (income - expenses)
- 🏦 Current Savings

#### **Budget Breakdown Visualization**
Interactive bar charts showing:
- Housing (30%)
- Food (15%)
- Transportation (15%)
- Utietilis (10%)
- Entertainment (10%)
- Other (20%)

#### **Emergency Fund Progress**
- Circular progress indicator
- Shows: Current Savings / Target (6 months expenses)
- Visual percentage completion

#### **Interactive Risk Tolerance Slider** ⭐
```
Slider Range: 1-10
├── 1-3: Conservative (Low Risk) - Green
├── 4-7: Moderate Risk - Orange
└── 8-10: Aggressive (High Risk) - Red

Features:
├── Real-time color coding
├── Dynamic descriptions based on selection
├── Save button to persist preference
└── Updates user profile in database
```

**Action Buttons:**
- ⚙️ Edit Profile → `/settings`
- 📈 Financial Planner → `/planner`

---

### 3. **Main Application Features**

#### **A. Dashboard** (`/dashboard`)
```
Accessible via Navbar → Dashboard

Displays:
├── Welcome message with user's name
├── Personal Information Card
│   ├── Name, Email, Age, Occupation
├── Financial Overview Card
│   ├── Annual Income
│   ├── Monthly Income
│   ├── Estimated Expenses
│   └── Monthly Surplus
└── Financial Goals Card
    ├── Primary Goal
    ├── Risk Tolerance
    └── Emergency Fund Target

Quick Actions:
├── 📊 Financial Planner (working)
├── 📈 Investment Tracker (coming soon)
└── 💳 Expense Tracker (coming soon)
```

#### **B. Investment Recommendations** (`/investments`)
```
Accessible via Navbar → Investments ⭐ (NEW)

Features:
├── Risk Tolerance Display
│   └── Shows user's current risk profile
├── ML-Powered Stock Recommendations
│   ├── Data Sources: Historical stock prices, market data
│   ├── ML Model: Risk assessment + return predictions
│   └── Personalized suggestions based on risk tolerance
│
├── Stock Options Display
│   ├── Conservative Stocks (for risk tolerance 1-3)
│   │   ├── Low volatility
│   │   ├── Stable returns
│   │   └── Safe investments (bonds, ETFs, blue chips)
│   │
│   ├── Moderate Stocks (for risk tolerance 4-7)
│   │   ├── Balanced portfolio
│   │   ├── Mix of stocks and bonds
│   │   └── Moderate risk, good returns
│   │
│   └── Aggressive Stocks (for risk tolerance 8-10)
│       ├── High growth potential
│       ├── Tech stocks, emerging markets
│       └── Higher risk, higher rewards
│
└── Stock Card Features
    ├── Company name & ticker
    ├── Current price
    ├── Predicted return (ML output)
    ├── Risk score (ML assessment)
    ├── Historical performance chart
    └── "Add to Watchlist" button
```

#### **C. Financial Planner** (`/planner`)
```
Two-Step Process:

Step 1: Financial Foundation Form
├── Current Savings
├── Monthly Income (pre-filled from profile)
└── Monthly Expenses (pre-filled from profile)
💡 Shows "Values pre-filled from your profile" indicator

Step 2: Personalized Recommendations
├── Emergency Fund Target
│   └── Suggested: 6 months of expenses
├── Available for Investment
│   └── Current Savings - Emergency Fund
└── Monthly Investment Surplus
    └── Monthly Income - Monthly Expenses

Features:
├── Pre-populated with signup data
├── Auto-calculates recommendations
└── Export Plan button
```

#### **D. Settings** (`/settings`)
```
Profile Information Section:
├── Full Name
├── Email (disabled - cannot be changed)
├── Phone Number
├── Age
├── Occupation
├── Annual Income
├── Current Savings ⭐ (NEW)
├── Monthly Expenses ⭐ (NEW)
├── Financial Goal (dropdown)
└── Risk Tolerance (dropdown)

Emergency Fund Preferences Section:
├── Target Amount
├── Monthly Contribution
└── Emergency Goal (notes)

Features:
├── Fetches data from backend
├── Toast notifications on save
├── Separated save buttons for each section
└── Projected timeline calculator
```

---

## 🔧 Backend Architecture

### **API Endpoints**

#### **Authentication & User Management**
```
POST   /signup              - Register new user
POST   /login               - User login
POST   /logout              - Logout (blacklists JWT)
POST   /google-auth         - Google OAuth authentication
POST   /forgot-password     - Request password reset
POST   /reset-password      - Reset password with token
POST   /verify-reset-token  - Validate reset token
GET    /profile             - Get user profile
PUT    /profile             - Update user profile ⭐
GET    /user-preferences    - Get financial preferences
PUT    /user-preferences    - Update preferences
```

#### **ML Stock Prediction Architecture** ⭐

#### **Backend ML Model**
```
File: server/ml_models/stock_predictor.py

Components:
├── Historical Data Fetcher
│   ├── API: Alpha Vantage / Yahoo Finance
│   ├── Real-time stock prices
│   └── Historical price data (5+ years)
│
├── Risk Assessment Model
│   ├── Volatility analysis
│   ├── Beta coefficient calculation
│   └── Risk scoring (1-10)
│
├── Return Prediction Model
│   ├── Time series forecasting
│   ├── Linear regression / LSTM
│   ├── Expected ROI prediction
│   └── Confidence intervals
│
└── Recommendation Engine
    ├── Filters stocks by risk tolerance
    ├── Sorts by predicted returns
    └── Generates personalized list
```

#### **API Endpoint**
```
POST /stock-recommendations
├── Input: user_risk_tolerance (1-10)
├── Process:
│   ├── Fetch stock data
│   ├── Run ML predictions
│   ├── Filter by risk profile
│   └── Sort by predicted returns
├── Output:
│   ├── List of recommended stocks
│   ├── Predicted returns
│   ├── Risk scores
│   └── Investment amounts suggested
```

### **Database Schema**

**`users` Table**
```sql
- id (PK)
- username (unique)
- password_hash
- email
- full_name
- phone
- age
- occupation
- annual_income_encrypted (encrypted)
- financial_goal
- risk_tolerance
- reset_token
- reset_token_expires
- created_at
- updated_at
```

**`user_preferences` Table** ⭐
```sql
- id (PK)
- user_id (FK to users, unique)
- current_savings ⭐ (NEW)
- monthly_expenses ⭐ (NEW)
- emergency_fund_target
- monthly_contribution
- emergency_goal
- updated_at
```

**`stock_watchlist` Table** ⭐ (NEW - for future)
```sql
- id (PK)
- user_id (FK to users)
- stock_ticker
- purchase_price
- current_price
- shares
- notes
- added_at
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

**Financial Data Tables** (for future use)
```sql
- incomes (user_id, amount_encrypted, created_at)
- expenses (user_id, amount_encrypted, created_at)
- savings (user_id, amount_encrypted, created_at)
```

---

## 🔐 Security Features

### **Data Protection**
1. **Password Hashing**: bcrypt with salt
2. **Financial Data Encryption**: Fernet (symmetric encryption)
   - Annual income encrypted before storage
   - Decrypted when retrieved
3. **JWT Authentication**: Token-based auth with expiration
4. **Token Blacklisting**: Logout invalidates tokens
5. **Password Reset**: Secure token-based with expiration

### **Input Validation**
- Age: 18-100
- Monetary values: Non-negative
- Email uniqueness check
- SQL injection prevention (parameterized queries)

---

## 📊 Data Flow

### **User Registration**
```
Frontend (Signup.tsx)
  ↓ Multi-step form data
  ↓
POST /signup
  ↓
Backend (auth_system.py)
  ├── Validates inputs
  ├── Checks email uniqueness
  ├── Hashes password (bcrypt)
  ├── Encrypts financial data (Fernet)
  ├── Saves to 'users' table
  ├── Saves to 'user_preferences' table
  └── Returns user_id

  ↓
Auto-login & fetch profile
  ↓
Redirect to /visualization
```

### **Financial Data Fetching**
```
Dashboard/Planner/Visualization
  ↓
GET /profile (for user info)
  ↓
GET /user-preferences (for financial data)
  ↓
Merge data in frontend state
  ↓
Display in UI with calculations
```

### **Profile Updates**
```
Settings Page
  ↓ User edits fields
  ↓
PUT /profile (user table data)
  ↓
PUT /user-preferences (financial data)
  ↓
Toast notification
  ↓
Refresh displayed data
```

---

## 🎨 UI/UX Features

### **Design System**
- **Color Palette**: Green gradient theme (primary: #059669)
- **Typography**: Modern, clean fonts
- **Components**: Reusable styled components
- **Animations**: Fade-in transitions, hover effects
- **Responsive**: Mobile-friendly layouts

### **User Experience Enhancements**
1. **Pre-filled Data**: Signup data automatically used in planner
2. **Real-time Calculations**: Live updates as user types
3. **Visual Feedback**: Toast notifications for saves
4. **Progress Indicators**: Clear step indicators in multi-step forms
5. **Loading States**: Skeleton screens during data fetch
6. **Error Handling**: User-friendly error messages

---

## 🚀 Development Workflow

### **Starting the Application**
```bash
# Terminal 1: Backend
cd server
python app.py
# Runs on http://localhost:5001

# Terminal 2: Frontend
cd client
npm run dev
# Runs on http://localhost:5173
```

### **Database Initialization**
```python
# Automatic on app.py startup
db_utils.initialize_database()
├── Creates tables if not exist
├── Adds missing columns (migration)
└── Prints status messages
```

---

## 📈 Key Features Implemented

✅ **Multi-step Signup** with financial foundation fields  
✅ **JWT Authentication** with persistent sessions  
✅ **Google OAuth** integration  
✅ **Encrypted Financial Data** storage  
✅ **Financial Visualization** with charts  
✅ **Budget Breakdown** visualization  
✅ **Emergency Fund Tracking** with circular progress  
✅ **Interactive Risk Slider** with real-time updates  
✅ **Profile Management** with all signup fields editable  
✅ **Emergency Fund Preferences** configuration  
✅ **Pre-filled Data** from signup to planner  
✅ **Toast Notifications** for user feedback  
✅ **Password Reset** system  
✅ **Responsive Design** for all devices  

## 🎯 Planned Features (Next Phase)

🔄 **ML-Powered Investment Recommendations** ⭐
- Stock risk assessment using ML models
- Historical data analysis for predictions
- Personalized recommendations based on risk tolerance
- Predicted returns calculation
- Real-time stock data integration
- Watchlist functionality for tracking stocks  

---

## 🔄 User Journey Summary

```
1. User visits app → Login/Signup page
2. Completes 4-step signup with financial data
3. Lands on Financial Visualization Dashboard
   ├── Sees financial overview cards
   ├── Views budget breakdown
   ├── Checks emergency fund progress
   └── Sets risk tolerance with interactive slider

4. Can navigate to:
   ├── Dashboard (home with overview)
   ├── Investments (ML-powered stock recommendations) ⭐
   ├── Planner (detailed financial planning)
   ├── Settings (edit all profile data)
   └── Logout (ends session)

5. Settings allow updating:
   ├── All signup information
   ├── Financial foundation data
   └── Emergency fund goals

6. Planner uses saved data automatically
   ├── Pre-fills financial information
   └── Provides personalized recommendations

7. Investment Recommendations page ⭐
   ├── Analyzes user's risk tolerance
   ├── ML model predicts stock safety/risk
   ├── Shows predicted returns based on history
   ├── Displays filtered stocks matching risk profile
   └── Allows adding stocks to watchlist
```

---

## 🎯 Business Logic Highlights

### **Financial Calculations**
- **Monthly Income**: Annual Income ÷ 12
- **Estimated Expenses**: 70% of monthly income (if not provided)
- **Emergency Fund Target**: 6 months of expenses
- **Monthly Surplus**: Income - Expenses
- **Budget Distribution**: Predefined percentages (30% housing, etc.)

### **ML Stock Prediction Logic** ⭐
- **Risk Score Calculation**: Based on volatility, beta, and market trends
- **Return Prediction**: Time series forecasting using historical data
- **Stock Categorization**:
  - Conservative: β < 0.8, Low volatility
  - Moderate: 0.8 ≤ β ≤ 1.2, Medium volatility
  - Aggressive: β > 1.2, High volatility
- **Recommendation Filtering**: Matches stocks to user's risk tolerance level

### **Data Persistence**
- All user data encrypted before storage
- JWT tokens for stateless authentication
- LocalStorage for frontend state persistence
- Real-time profile updates with database sync

---

This workflow represents a comprehensive personal finance management application with secure authentication, encrypted data storage, intuitive UI, and powerful visualization capabilities.

