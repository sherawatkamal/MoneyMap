# MoneyMap Application - Complete Workflow Explanation

## 🎯 Overview
MoneyMap is a comprehensive financial planning application that helps users assess their risk tolerance, get personalized investment recommendations, allocate funds intelligently, and compare different financial scenarios.

---

## 📋 Complete User Journey & Workflow

### **1. User Registration & Login** 
**Files**: `client/src/pages/Login.tsx`, `client/src/pages/Signup.tsx`

**What happens:**
- User creates an account with email/password
- During signup, user provides:
  - Basic info (name, email, phone)
  - Financial profile (age, income, current savings)
  - Initial risk tolerance (1-10 scale)
  - Financial goals

**Backend**: `server/auth_system.py`
- Stores user data in MySQL database
- Creates JWT tokens for authentication
- Initializes user profile with default risk tolerance of 5/10

---

### **2. Dashboard (Main Hub)**
**File**: `client/src/pages/Dashboard.tsx`

**What it shows:**
- **Welcome message** with user's name
- **Quick stats**: Current savings, monthly surplus, risk tolerance
- **Financial goals** summary
- **Navigation cards** to access different features:
  - Risk Assessment
  - Investments
  - Fund Allocation
  - Scenario Comparison
  - Financial Planner

**Purpose**: Central hub to navigate all features

---

### **3. Risk Assessment Questionnaire** ⭐ FR-14
**File**: `client/src/pages/RiskAssessment.tsx`

**What it does:**
- Presents **6 comprehensive questions** about:
  1. Investment time horizon (short/medium/long term)
  2. Reaction to portfolio losses
  3. Investment experience level
  4. Income stability
  5. Primary investment goal
  6. Comfort with volatility

**How it works:**
- Each answer is scored 1-10 based on risk tolerance
- **Algorithm calculates average score** across all questions
- Final risk tolerance (1-10) is saved to user profile
- **Automatically redirects** to Investments page after completion

**Backend**: `POST /update-risk-tolerance`
- Updates user's risk_tolerance in database
- This score is used for all future recommendations

**Visual Features:**
- Progress bar showing completion
- Smooth transitions between questions
- Toast notifications for success/errors

---

### **4. Investments Page** ⭐ FR-21, FR-22, FR-23, FR-19
**File**: `client/src/pages/Investments.tsx`

**What it shows:**

#### **A. Search & Filter Section**
- **Search bar**: Search by ticker, company name, or sector
- **Category filter**: Filter by Stocks, Bonds, ETFs, or Crypto
- Real-time filtering as you type

#### **B. Stock Recommendations**
**Backend**: `GET /stock-recommendations`
- Fetches stocks based on user's risk tolerance:
  - **Risk 1-3**: Conservative stocks (low volatility, stable)
  - **Risk 4-7**: Moderate stocks (balanced risk-reward)
  - **Risk 8-10**: Aggressive stocks (high risk, high potential)

**Each stock card displays:**
- **Real-time price** (FR-22): Updates every 30 seconds
  - Shows current price
  - Price change indicator (↑ green / ↓ red)
  - Percentage change
- **Risk indicator** (FR-23): Visual bar showing risk level
  - Calculated from 30-day price history
  - Color-coded (green=low, yellow=medium, red=high)
  - Shows risk score (1-10)
- **Predicted return**: Expected 1-year return percentage
- **Detailed explanation** (FR-19): 
  - Why this stock is recommended
  - Risk profile analysis
  - Expected return explanation
  - Beta and volatility interpretation
- **Quick stats**: Beta, volatility, dividend yield, sector

#### **C. Analysis Charts**
- **Expected Returns Chart**: Bar chart showing predicted returns for each stock
- **Risk Score Analysis**: Bar chart showing risk scores

#### **D. Watchlist**
- Add stocks to personal watchlist
- View saved stocks
- Add notes to each stock
- Export watchlist to CSV

**Backend Endpoints:**
- `GET /stock-recommendations` - Get personalized recommendations
- `GET /update-stock-prices` - Real-time price updates
- `GET /watchlist` - Get user's watchlist
- `POST /watchlist` - Add stock to watchlist
- `DELETE /watchlist/:id` - Remove from watchlist

---

### **5. Fund Allocation Page** ⭐ FR-17
**File**: `client/src/pages/FundAllocation.tsx`

**What it does:**
Intelligently allocates funds across different time horizons based on risk tolerance.

#### **Interactive Controls:**
- **Current Savings**: Input your current savings amount
- **Monthly Contribution**: How much you'll invest monthly
- **Time Horizon**: Select 5-30 years
- **Risk Tolerance Slider**: Adjust from 1-10 (syncs with profile)

#### **Allocation Strategy:**
The algorithm divides funds into **4 buckets**:

1. **Emergency Fund** (2% growth)
   - 6 months of expenses
   - Safe, liquid savings
   - Grows at 2% annually

2. **Short-term** (3-5 years) - 4% growth
   - 20% of remaining funds
   - Conservative investments (bonds)
   - Lower risk, stable returns

3. **Medium-term** (5-10 years) - 6-8% growth
   - 30% of remaining funds
   - Balanced portfolio (stocks + bonds mix)
   - Growth rate adjusts with risk tolerance

4. **Long-term** (10+ years) - 8-12% growth
   - 50% of remaining funds
   - Growth-oriented (stocks)
   - Higher risk, higher potential returns
   - Growth rate: 8% + (risk tolerance / 10) * 4%

#### **What it shows:**
- **Stacked Area Chart**: Visual growth over time
  - Shows how each bucket grows
  - Color-coded by category
  - Interactive tooltips

- **Allocation Breakdown Table**:
  - Year-by-year breakdown
  - Shows Emergency Fund, Short-term, Medium-term, Long-term values
  - Total portfolio value per year

**How it works:**
- Calculates growth for each bucket based on risk tolerance
- Applies monthly contributions to appropriate buckets
- Projects growth over selected time horizon
- Updates in real-time as you adjust controls

---

### **6. Scenario Comparison** ⭐ FR-27
**File**: `client/src/pages/ScenarioComparison.tsx`

**What it does:**
Compare three different investment strategies side-by-side to visualize risk vs reward.

#### **Three Pre-configured Scenarios:**

1. **Conservative Plan**
   - Risk: 3/10
   - Monthly: $500
   - Expected Return: 4-7%
   - Color: Green

2. **Moderate Plan**
   - Risk: 6/10
   - Monthly: $1,000
   - Expected Return: 7-10%
   - Color: Blue

3. **Aggressive Plan**
   - Risk: 9/10
   - Monthly: $1,500
   - Expected Return: 10-12%
   - Color: Red

#### **Interactive Controls:**
- **Current Savings**: Adjust starting amount
- **Time Horizon**: Select 5-30 years

#### **What it shows:**

1. **Side-by-Side Line Chart**:
   - Three lines (one per scenario)
   - Shows portfolio growth over time
   - Easy to compare trajectories
   - Interactive tooltips

2. **Scenario Cards**:
   - Individual card for each scenario
   - Shows risk tolerance, monthly contribution, expected return
   - Final portfolio value after time horizon
   - Total gains and return percentage

3. **Comparison Table**:
   - Detailed metrics for all scenarios
   - Easy to compare:
     - Risk scores
     - Monthly contributions
     - Final values
     - Total gains

**Purpose**: Helps users make informed decisions by visually comparing different strategies

---

### **7. Portfolio Preview Component** ⭐ FR-25
**File**: `client/src/components/PortfolioPreview.tsx`

**What it does:**
Validates and visualizes portfolio composition before finalizing.

#### **Features:**

1. **Pie Chart Visualization**:
   - Shows asset allocation breakdown
   - Color-coded by category (stocks, bonds, ETFs, crypto)
   - Interactive tooltips

2. **Portfolio Statistics**:
   - Total portfolio value
   - Average risk score
   - Category breakdown percentages

3. **Real-time Validation**:
   - ✅ **Errors** (red):
     - Total allocation must equal 100%
   - ⚠️ **Warnings** (yellow):
     - Crypto allocation > 10%
     - Stock allocation < 20%
     - Portfolio risk > 8/10
   - ✅ **Success** (green):
     - Portfolio is valid and well-balanced

4. **Asset Details List**:
   - Shows each asset with:
     - Ticker and name
     - Category
     - Risk score
     - Allocation percentage

**Usage**: Can be embedded in any page that needs portfolio visualization

---

### **8. Financial Visualization (Planner)**
**File**: `client/src/pages/FinancialVisualization.tsx`

**What it shows:**
- Projected portfolio growth over time
- Budget breakdown pie chart
- Income vs expenses visualization
- Risk-based color coding

---

## 🔄 Data Flow & Backend Architecture

### **Backend Structure** (`server/`)

1. **Database** (`db_utils.py`):
   - MySQL database connection
   - Tables: `users`, `stock_watchlist`
   - User profile storage

2. **Authentication** (`auth_system.py`):
   - JWT token management
   - User registration/login
   - Protected API endpoints
   - Risk tolerance updates
   - Watchlist management
   - Real-time price updates

3. **ML Models** (`ml_models/stock_predictor.py`):
   - Stock recommendation algorithm
   - Risk score calculation
   - Return prediction
   - Stock categorization (stocks/bonds/ETFs/crypto)

### **API Endpoints:**

```
POST   /register          - User registration
POST   /login             - User login
GET    /profile           - Get user profile
POST   /update-risk-tolerance - Update risk score
GET    /stock-recommendations - Get personalized stocks
GET    /update-stock-prices   - Real-time price updates
GET    /stock-details/:ticker - Detailed stock info
GET    /watchlist         - Get watchlist
POST   /watchlist         - Add to watchlist
DELETE /watchlist/:id     - Remove from watchlist
```

---

## 🎨 UI/UX Features

### **Navigation** (`Navbar.tsx`):
- Top navigation bar
- User profile dropdown
- Links to all major features
- Responsive design

### **Styling**:
- Custom CSS with CSS variables
- Consistent color scheme (Money Green theme)
- Smooth animations and transitions
- Responsive grid layouts
- Card-based design

### **Charts & Visualizations**:
- **Recharts** library for all charts
- Interactive tooltips
- Color-coded by category/risk
- Responsive containers
- Proper spacing and padding

---

## 🔐 Security Features

- JWT token authentication
- Password hashing (bcrypt)
- Protected API routes
- Token expiration handling
- Secure session management

---

## 📊 Key Algorithms

### **1. Risk Scoring Algorithm** (FR-14):
```
Average of all question scores (1-10)
→ Final risk tolerance (1-10)
```

### **2. Stock Recommendation Algorithm**:
```
User risk tolerance
→ Filter stock database
→ Calculate risk scores
→ Sort by predicted returns
→ Return top recommendations
```

### **3. Fund Allocation Algorithm** (FR-17):
```
Current savings + Monthly contributions
→ Emergency fund (6 months expenses, 2% growth)
→ Remaining funds
→ Risk-based split:
  - Short-term: 20% × bond allocation (4% growth)
  - Medium-term: 30% × balanced (6-8% growth)
  - Long-term: 50% × stock allocation (8-12% growth)
→ Project over time horizon
```

### **4. Price History Risk Calculation** (FR-23):
```
30-day price history
→ Calculate daily returns
→ Standard deviation of returns
→ Map to 1-10 risk scale
```

### **5. Scenario Comparison Algorithm** (FR-27):
```
For each scenario:
  Starting value = current savings
  For each year:
    value = value × (1 + annual_return) + monthly × 12
  Annual return = 4% + (risk_tolerance / 10) × 8%
```

---

## 🎯 User Workflow Summary

1. **Sign Up** → Create account with financial profile
2. **Take Risk Assessment** → Get personalized risk score (1-10)
3. **View Investments** → See recommended stocks based on risk
   - Search and filter assets
   - View real-time prices
   - See risk indicators
   - Read detailed explanations
   - Add to watchlist
4. **Plan Fund Allocation** → See how to divide funds across time frames
   - Adjust savings and contributions
   - View growth projections
   - See year-by-year breakdown
5. **Compare Scenarios** → Visualize different strategies
   - Compare conservative vs aggressive
   - See long-term projections
   - Make informed decisions
6. **Build Portfolio** → Use Portfolio Preview to validate
   - See allocation breakdown
   - Get validation feedback
   - Ensure proper diversification

---

## 🚀 Technical Stack

**Frontend:**
- React.js with TypeScript
- React Router for navigation
- Recharts for visualizations
- Custom CSS with CSS variables
- Framer Motion for animations

**Backend:**
- Python Flask
- MySQL database
- JWT authentication
- ML-based stock predictions
- RESTful API

**Key Libraries:**
- `recharts` - Chart library
- `react-router-dom` - Routing
- `flask-jwt-extended` - Authentication
- `bcrypt` - Password hashing
- `mysql-connector` - Database

---

## 📈 What Each Feature Solves

- **FR-14 (Risk Assessment)**: Helps users understand their risk tolerance
- **FR-19 (Explanations)**: Educates users about recommendations
- **FR-25 (Portfolio Preview)**: Prevents allocation errors
- **FR-17 (Fund Allocation)**: Shows optimal fund distribution
- **FR-21 (Search)**: Makes it easy to find assets
- **FR-22 (Real-time Prices)**: Keeps data current
- **FR-23 (Risk Indicators)**: Visual risk assessment
- **FR-27 (Scenario Comparison)**: Enables informed decision-making

---

This workflow creates a complete financial planning experience from risk assessment to portfolio building!
