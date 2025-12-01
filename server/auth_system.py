from flask import request, jsonify, Blueprint
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
import bcrypt
import mysql.connector
import os
import requests
from dotenv import load_dotenv

import db_utils
import password_reset
from ml_models.stock_predictor import get_recommendations, get_stock_details

load_dotenv()

# blueprint for auth enpoints
auth_bp  = Blueprint('auth', __name__)

BLOCKLIST = set()

# internal db helper for pulling singular user
def get_user_single(username: str):
    conn = db_utils.get_connection()
    try:
        with conn.cursor(dictionary=True) as cur:
            cur.execute("SELECT id, username, password_hash FROM users WHERE username=%s LIMIT 1", (username,))
            return cur.fetchone()
    finally:
        conn.close()

# route helper
def extract_credentials(data: dict):
    username = (data or {}).get('email') or (data or {}).get('username')
    password = (data or {}).get('password')
    return username, password

def handle_register(data: dict):
    """
    Handle user registration with comprehensive profile data
    """
    # Extract all the form data
    username = data.get('email') or data.get('username')
    password = data.get('password')
    full_name = data.get('name')
    phone = data.get('phone')
    age = data.get('age')
    occupation = data.get('occupation')
    annual_income = data.get('annualIncome')
    financial_goal = data.get('financialGoal')
    risk_tolerance = data.get('riskTolerance')
    current_savings = data.get('currentSavings')
    monthly_expenses = data.get('monthlyExpenses')
    
    # Validate required fields
    if not username or not password:
        return jsonify({"msg": "Missing email/username or password"}), 400
    
    # Check if user already exists
    if db_utils.user_exists_by_email(username):
        return jsonify({"msg": "Email already exists"}), 409
    
    # Validate and convert age if provided
    if age:
        try:
            age = int(age)
            if age < 18 or age > 100:
                return jsonify({"msg": "Age must be between 18 and 100"}), 400
        except (ValueError, TypeError):
            return jsonify({"msg": "Invalid age format"}), 400
    
    # Validate and convert annual income if provided
    if annual_income:
        try:
            annual_income = float(annual_income)
            if annual_income < 0:
                return jsonify({"msg": "Annual income cannot be negative"}), 400
        except (ValueError, TypeError):
            return jsonify({"msg": "Invalid annual income format"}), 400
    
    # Validate current savings
    if current_savings:
        try:
            current_savings = float(current_savings)
            if current_savings < 0:
                return jsonify({"msg": "Current savings cannot be negative"}), 400
        except (ValueError, TypeError):
            return jsonify({"msg": "Invalid current savings format"}), 400
    
    # Validate monthly expenses
    if monthly_expenses:
        try:
            monthly_expenses = float(monthly_expenses)
            if monthly_expenses < 0:
                return jsonify({"msg": "Monthly expenses cannot be negative"}), 400
        except (ValueError, TypeError):
            return jsonify({"msg": "Invalid monthly expenses format"}), 400
    
    try:
        user_id = db_utils.add_user(
            username=username,
            password=password,
            email=username,  # Using email as username
            full_name=full_name,
            phone=phone,
            age=age,
            occupation=occupation,
            annual_income=annual_income,
            financial_goal=financial_goal,
            risk_tolerance=risk_tolerance
        )
        
        # Create user preferences with financial data
        # Always create preferences even if empty, so we have a row
        db_utils.create_user_preferences(
            user_id=user_id,
            current_savings=float(current_savings) if current_savings else 0,
            monthly_expenses=float(monthly_expenses) if monthly_expenses else None
        )
        
        return jsonify({
            "msg": "User created successfully",
            "user_id": user_id
        }), 201
        
    except mysql.connector.IntegrityError as e:
        if getattr(e, 'errno', None) == 1062:
            return jsonify({"msg": "Email already exists"}), 409
        return jsonify({"msg": "Database error creating user"}), 500
    except Exception as e:
        return jsonify({"msg": f"Error creating user: {str(e)}"}), 500

# routes
@auth_bp.route('/signup', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    return handle_register(data)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username, password = extract_credentials(data)

    if not username or not password:
        return jsonify({"msg": "Missing email/username or password"}), 400

    user = get_user_single(username)
    if not user:
        return jsonify({"msg": "Bad credentials"}), 401

    stored_hash = user["password_hash"]
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode('utf-8')

    if not bcrypt.checkpw(password.encode('utf-8'), stored_hash):
        return jsonify({"msg": "Bad credentials"}), 401

    access_token = create_access_token(identity=str(user["id"]))
    return jsonify(access_token=access_token), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt().get('jti')
    if jti:
        BLOCKLIST.add(jti)
    return jsonify({"msg": "Successfully logged out"}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email"""
    data = request.get_json(silent=True) or {}
    email = data.get('email')
    
    if not email:
        return jsonify({"msg": "Email is required"}), 400
    
    # Check if user exists
    user = db_utils.get_user_by_email(email)
    if not user:
        # Return success even if user doesn't exist (security best practice)
        return jsonify({"msg": "If an account with that email exists, we've sent a password reset link"}), 200
    
    # Generate reset token
    token = password_reset.generate_reset_token()
    
    # Save token to database
    if password_reset.save_reset_token(email, token):
        # Send email
        if password_reset.send_reset_email(email, token, user.get('username', 'User')):
            return jsonify({"msg": "Password reset email sent successfully"}), 200
        else:
            # For development/testing - show the reset link directly
            reset_url = f"http://localhost:5173/reset-password?token={token}"
            return jsonify({
                "msg": "Password reset link generated (email not configured)",
                "reset_link": reset_url,
                "note": "This is for development only. Configure email for production."
            }), 200
    else:
        # For security, always return 200 even if token generation fails
        return jsonify({"msg": "If an account with that email exists, we've sent a password reset link"}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    data = request.get_json(silent=True) or {}
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({"msg": "Token and password are required"}), 400
    
    if len(new_password) < 8:
        return jsonify({"msg": "Password must be at least 8 characters long"}), 400
    
    # Verify token
    user = password_reset.verify_reset_token(token)
    if not user:
        return jsonify({"msg": "Invalid or expired reset token"}), 400
    
    # Update password
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())
    
    conn = db_utils.get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE users 
                SET password_hash = %s, reset_token = NULL, reset_token_expires = NULL 
                WHERE id = %s
            """, (hashed, user['id']))
            
            conn.commit()
            
            # Clear the token
            password_reset.clear_reset_token(token)
            
            return jsonify({"msg": "Password reset successfully"}), 200
    finally:
        conn.close()

@auth_bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify if reset token is valid"""
    data = request.get_json(silent=True) or {}
    token = data.get('token')
    
    if not token:
        return jsonify({"msg": "Token is required"}), 400
    
    user = password_reset.verify_reset_token(token)
    if user:
        return jsonify({"msg": "Token is valid", "email": user['email']}), 200
    else:
        return jsonify({"msg": "Invalid or expired token"}), 400

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user's profile information"""
    from flask_jwt_extended import get_jwt_identity
    
    identity = get_jwt_identity()
    
    # Identity is now a string (user ID)
    user_id = int(identity) if identity else None
    if not user_id:
        return jsonify({"msg": "Invalid token"}), 401
    
    user = db_utils.get_user_by_id(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    # Remove sensitive data
    user_data = {
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'full_name': user['full_name'],
        'phone': user['phone'],
        'age': user['age'],
        'occupation': user['occupation'],
        'annual_income': user.get('annual_income'),
        'financial_goal': user['financial_goal'],
        'risk_tolerance': user['risk_tolerance']
    }
    
    return jsonify(user_data), 200

@auth_bp.route('/google-auth', methods=['POST'])
def google_auth():
    """Handle Google OAuth authentication"""
    data = request.get_json(silent=True) or {}
    google_token = data.get('token')
    
    if not google_token:
        return jsonify({"msg": "Google token is required"}), 400
    
    try:
        # Verify the Google token with Google's API
        google_response = requests.get(
            f'https://www.googleapis.com/oauth2/v1/userinfo?access_token={google_token}'
        )
        
        if google_response.status_code != 200:
            return jsonify({"msg": "Invalid Google token"}), 401
        
        google_user = google_response.json()
        
        # Extract user information
        email = google_user.get('email')
        name = google_user.get('name', '')
        google_id = google_user.get('id')
        
        if not email:
            return jsonify({"msg": "Email not provided by Google"}), 400
        
        # Check if user already exists
        user = db_utils.get_user_by_email(email)
        
        if user:
            # User exists, create JWT token
            access_token = create_access_token(identity=str(user["id"]))
            return jsonify({
                "access_token": access_token,
                "msg": "Login successful"
            }), 200
        else:
            # New user, create account
            # Generate a random password for OAuth users (they won't use it)
            import secrets
            random_password = secrets.token_urlsafe(32)
            
            user_id = db_utils.add_user(
                username=email,
                password=random_password,
                email=email,
                full_name=name
            )
            
            # Create JWT token
            access_token = create_access_token(identity=str(user_id))
            return jsonify({
                "access_token": access_token,
                "msg": "Account created successfully"
            }), 201
            
    except requests.RequestException as e:
        return jsonify({"msg": f"Error verifying Google token: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"msg": f"Error during Google authentication: {str(e)}"}), 500

@auth_bp.route('/user-preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get current user's emergency fund preferences"""
    from flask_jwt_extended import get_jwt_identity
    
    identity = get_jwt_identity()
    user_id = int(identity) if identity else None
    
    if not user_id:
        return jsonify({"msg": "Invalid token"}), 401
    
    preferences = db_utils.get_user_preferences(user_id)
    
    if not preferences:
        # Return empty preferences if none exist
        return jsonify({
            "current_savings": None,
            "monthly_expenses": None,
            "emergency_fund_target": None,
            "monthly_contribution": None,
            "emergency_goal": None,
            "budget_housing_percent": None,
            "budget_food_percent": None,
            "budget_transportation_percent": None,
            "budget_utilities_percent": None,
            "budget_entertainment_percent": None,
            "budget_other_percent": None
        }), 200
    
    # Convert Decimal to float for JSON serialization
    result = {}
    
    if preferences.get('current_savings') is not None:
        result['current_savings'] = float(preferences['current_savings'])
    else:
        result['current_savings'] = None
    
    if preferences.get('monthly_expenses') is not None:
        result['monthly_expenses'] = float(preferences['monthly_expenses'])
    else:
        result['monthly_expenses'] = None
    
    if preferences.get('emergency_fund_target') is not None:
        result['emergency_fund_target'] = float(preferences['emergency_fund_target'])
    else:
        result['emergency_fund_target'] = None
    
    if preferences.get('monthly_contribution') is not None:
        result['monthly_contribution'] = float(preferences['monthly_contribution'])
    else:
        result['monthly_contribution'] = None
    
    result['emergency_goal'] = preferences.get('emergency_goal')
    
    # Budget breakdown fields
    for field in ['budget_housing_percent', 'budget_food_percent', 'budget_transportation_percent', 
                  'budget_utilities_percent', 'budget_entertainment_percent', 'budget_other_percent']:
        if preferences.get(field) is not None:
            result[field] = float(preferences[field])
        else:
            result[field] = None
    
    return jsonify(result), 200


@auth_bp.route('/user-preferences', methods=['PUT'])
@jwt_required()
def update_user_preferences():
    """Update current user's emergency fund preferences"""
    from flask_jwt_extended import get_jwt_identity
    
    identity = get_jwt_identity()
    user_id = int(identity) if identity else None
    
    if not user_id:
        return jsonify({"msg": "Invalid token"}), 401
    
    data = request.get_json(silent=True) or {}
    
    # Extract preference data
    emergency_fund_target = data.get('emergency_fund_target')
    monthly_contribution = data.get('monthly_contribution')
    emergency_goal = data.get('emergency_goal')
    current_savings = data.get('current_savings')
    monthly_expenses = data.get('monthly_expenses')
    budget_housing_percent = data.get('budget_housing_percent')
    budget_food_percent = data.get('budget_food_percent')
    budget_transportation_percent = data.get('budget_transportation_percent')
    budget_utilities_percent = data.get('budget_utilities_percent')
    budget_entertainment_percent = data.get('budget_entertainment_percent')
    budget_other_percent = data.get('budget_other_percent')
    
    # Validate and convert values
    try:
        if emergency_fund_target is not None:
            emergency_fund_target = float(emergency_fund_target)
            if emergency_fund_target < 0:
                return jsonify({"msg": "Emergency fund target cannot be negative"}), 400
        
        if monthly_contribution is not None:
            monthly_contribution = float(monthly_contribution)
            if monthly_contribution < 0:
                return jsonify({"msg": "Monthly contribution cannot be negative"}), 400
        
        # Validate current_savings and monthly_expenses
        if current_savings is not None:
            current_savings = float(current_savings)
            if current_savings < 0:
                return jsonify({"msg": "Current savings cannot be negative"}), 400
        
        if monthly_expenses is not None:
            monthly_expenses = float(monthly_expenses)
            if monthly_expenses < 0:
                return jsonify({"msg": "Monthly expenses cannot be negative"}), 400
        
        # Validate budget percentages
        budget_fields = [
            budget_housing_percent, budget_food_percent, budget_transportation_percent,
            budget_utilities_percent, budget_entertainment_percent, budget_other_percent
        ]
        
        for field in budget_fields:
            if field is not None:
                val = float(field)
                if val < 0 or val > 100:
                    return jsonify({"msg": "Budget percentages must be between 0 and 100"}), 400
        
    except (ValueError, TypeError):
        return jsonify({"msg": "Invalid number format"}), 400
    
    try:
        db_utils.update_user_preferences(
            user_id=user_id,
            emergency_fund_target=emergency_fund_target,
            monthly_contribution=monthly_contribution,
            emergency_goal=emergency_goal,
            current_savings=current_savings,
            monthly_expenses=monthly_expenses,
            budget_housing_percent=budget_housing_percent,
            budget_food_percent=budget_food_percent,
            budget_transportation_percent=budget_transportation_percent,
            budget_utilities_percent=budget_utilities_percent,
            budget_entertainment_percent=budget_entertainment_percent,
            budget_other_percent=budget_other_percent
        )
        
        return jsonify({"msg": "Preferences updated successfully"}), 200
    except Exception as e:
        return jsonify({"msg": f"Error updating preferences: {str(e)}"}), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile information"""
    from flask_jwt_extended import get_jwt_identity
    
    identity = get_jwt_identity()
    user_id = int(identity) if identity else None
    
    if not user_id:
        return jsonify({"msg": "Invalid token"}), 401
    
    data = request.get_json(silent=True) or {}
    
    # Extract profile data
    full_name = data.get('full_name')
    phone = data.get('phone')
    age = data.get('age')
    occupation = data.get('occupation')
    annual_income = data.get('annual_income')
    current_savings = data.get('current_savings')
    monthly_expenses = data.get('monthly_expenses')
    financial_goal = data.get('financial_goal')
    risk_tolerance = data.get('risk_tolerance')
    
    # Validate and convert values
    try:
        if age is not None and age != '':
            age = int(age)
            if age < 18 or age > 100:
                return jsonify({"msg": "Age must be between 18 and 100"}), 400
        
        if annual_income is not None and annual_income != '':
            annual_income = float(annual_income)
            if annual_income < 0:
                return jsonify({"msg": "Annual income cannot be negative"}), 400
        
        if current_savings is not None and current_savings != '':
            current_savings = float(current_savings)
            if current_savings < 0:
                return jsonify({"msg": "Current savings cannot be negative"}), 400
        
        if monthly_expenses is not None and monthly_expenses != '':
            monthly_expenses = float(monthly_expenses)
            if monthly_expenses < 0:
                return jsonify({"msg": "Monthly expenses cannot be negative"}), 400
    except (ValueError, TypeError):
        return jsonify({"msg": "Invalid number format"}), 400
    
    try:
        # Update profile in users table
        db_utils.update_user_profile(
            user_id=user_id,
            full_name=full_name,
            phone=phone,
            age=age,
            occupation=occupation,
            annual_income=annual_income,
            financial_goal=financial_goal,
            risk_tolerance=risk_tolerance
        )
        
        # Update financial foundation data in user_preferences
        if current_savings is not None or monthly_expenses is not None:
            db_utils.update_user_preferences(
                user_id=user_id,
                current_savings=current_savings,
                monthly_expenses=monthly_expenses
            )
        
        return jsonify({"msg": "Profile updated successfully"}), 200
    except Exception as e:
        return jsonify({"msg": f"Error updating profile: {str(e)}"}), 500


@auth_bp.route('/stock-recommendations', methods=['GET'])
@jwt_required()
def get_stock_recommendations():
    """Get personalized stock recommendations based on user's risk tolerance"""
    from flask_jwt_extended import get_jwt_identity
    
    identity = get_jwt_identity()
    user_id = int(identity) if identity else None
    
    if not user_id:
        return jsonify({"msg": "Invalid token"}), 401
    
    # Get user's risk tolerance
    user = db_utils.get_user_by_id(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    # Map risk_tolerance string to number
    risk_map = {
        'conservative': 3,
        'moderate': 6,
        'aggressive': 9
    }
    
    risk_tolerance_str = user.get('risk_tolerance', 'moderate')
    risk_tolerance = risk_map.get(risk_tolerance_str, 6)
    
    try:
        # Get recommendations from ML model
        recommendations = get_recommendations(risk_tolerance)
        
        return jsonify({
            "user_risk_tolerance": risk_tolerance,
            "user_risk_profile": risk_tolerance_str,
            "recommendations": recommendations
        }), 200
    except Exception as e:
        return jsonify({"msg": f"Error getting recommendations: {str(e)}"}), 500


@auth_bp.route('/stock-details/<ticker>', methods=['GET'])
@jwt_required()
def get_stock_detail(ticker):
    """Get detailed information about a specific stock"""
    try:
        stock_details = get_stock_details(ticker)
        
        if not stock_details:
            return jsonify({"msg": "Stock not found"}), 404
        
        return jsonify(stock_details), 200
    except Exception as e:
        return jsonify({"msg": f"Error getting stock details: {str(e)}"}), 500


@auth_bp.route('/watchlist', methods=['GET'])
@jwt_required()
def get_watchlist():
    """Get user's stock watchlist"""
    from flask_jwt_extended import get_jwt_identity
    
    identity = get_jwt_identity()
    user_id = int(identity) if identity else None
    
    if not user_id:
        return jsonify({"msg": "Invalid token"}), 401
    
    conn = db_utils.get_connection()
    try:
        with conn.cursor(dictionary=True) as cur:
            cur.execute("""
                SELECT id, stock_ticker, stock_name, current_price, notes, added_at
                FROM stock_watchlist WHERE user_id=%s
                ORDER BY added_at DESC
            """, (user_id,))
            watchlist = cur.fetchall()
            
            # Convert Decimal to float for JSON
            for item in watchlist:
                if item.get('current_price'):
                    item['current_price'] = float(item['current_price'])
            
            return jsonify({"watchlist": watchlist}), 200
    finally:
        conn.close()


@auth_bp.route('/watchlist', methods=['POST'])
@jwt_required()
def add_to_watchlist():
    """Add stock to user's watchlist"""
    from flask_jwt_extended import get_jwt_identity
    
    identity = get_jwt_identity()
    user_id = int(identity) if identity else None
    
    if not user_id:
        return jsonify({"msg": "Invalid token"}), 401
    
    data = request.get_json(silent=True) or {}
    ticker = data.get('ticker')
    stock_name = data.get('stock_name')
    current_price = data.get('current_price')
    notes = data.get('notes')
    
    if not ticker:
        return jsonify({"msg": "Stock ticker is required"}), 400
    
    # Get stock details
    stock_details = get_stock_details(ticker)
    if not stock_details:
        return jsonify({"msg": "Stock not found"}), 404
    
    conn = db_utils.get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO stock_watchlist (user_id, stock_ticker, stock_name, current_price, notes)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                stock_name = VALUES(stock_name),
                current_price = VALUES(current_price),
                notes = VALUES(notes)
        """, (user_id, ticker, stock_name or stock_details['name'], 
              current_price or stock_details['current_price'], notes))
        
        conn.commit()
        return jsonify({"msg": "Stock added to watchlist"}), 200
    except mysql.connector.Error as e:
        conn.rollback()
        return jsonify({"msg": f"Error adding to watchlist: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


@auth_bp.route('/watchlist/<int:watchlist_id>', methods=['DELETE'])
@jwt_required()
def remove_from_watchlist(watchlist_id):
    """Remove stock from user's watchlist"""
    from flask_jwt_extended import get_jwt_identity
    
    identity = get_jwt_identity()
    user_id = int(identity) if identity else None
    
    if not user_id:
        return jsonify({"msg": "Invalid token"}), 401
    
    conn = db_utils.get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            DELETE FROM stock_watchlist WHERE id=%s AND user_id=%s
        """, (watchlist_id, user_id))
        
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"msg": "Watchlist item not found"}), 404
        
        return jsonify({"msg": "Stock removed from watchlist"}), 200
    except mysql.connector.Error as e:
        conn.rollback()
        return jsonify({"msg": f"Error removing from watchlist: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


@auth_bp.route('/update-risk-tolerance', methods=['POST'])
@jwt_required()
def update_risk_tolerance():
    """Update user's risk tolerance"""
    try:
        claims = get_jwt()
        user_id = claims.get('user_id')
        
        data = request.get_json()
        risk_tolerance = data.get('risk_tolerance')
        
        if risk_tolerance is None or not (1 <= risk_tolerance <= 10):
            return jsonify({"msg": "Risk tolerance must be between 1 and 10"}), 400
        
        conn = db_utils.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users SET risk_tolerance=%s WHERE id=%s
        """, (risk_tolerance, user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"msg": "Risk tolerance updated successfully", "risk_tolerance": risk_tolerance}), 200
    except Exception as e:
        return jsonify({"msg": f"Error updating risk tolerance: {str(e)}"}), 500

@auth_bp.route('/update-stock-prices', methods=['GET'])
@jwt_required()
def update_stock_prices():
    """Update stock prices with simulated real-time data"""
    try:
        claims = get_jwt()
        user_id = claims.get('user_id')
        
        # Get user's risk tolerance to fetch recommendations
        conn = db_utils.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT risk_tolerance FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        risk_tolerance = user.get('risk_tolerance', 5) if user else 5
        
        cursor.close()
        conn.close()
        
        # Get current recommendations
        recommendations = get_recommendations(risk_tolerance)
        
        # Simulate price updates (in production, this would fetch from real API)
        import random
        updated_prices = []
        for stock in recommendations:
            # Simulate small price changes (-5% to +5%)
            price_change_factor = 1 + (random.random() - 0.5) * 0.1
            new_price = stock['current_price'] * price_change_factor
            updated_prices.append({
                'ticker': stock['ticker'],
                'current_price': round(new_price, 2),
                'previous_price': stock['current_price']
            })
        
        return jsonify({"prices": updated_prices}), 200
    except Exception as e:
        return jsonify({"msg": f"Error updating prices: {str(e)}"}), 500

@auth_bp.route('/stock-details/<ticker>', methods=['GET'])
@jwt_required()
def get_stock_details_endpoint(ticker):
    """Get detailed stock information including price history"""
    try:
        stock_details = get_stock_details(ticker.upper())
        
        if not stock_details:
            return jsonify({"msg": "Stock not found"}), 404
        
        # Generate price history for risk calculation
        import random
        price_history = []
        base_price = stock_details['current_price']
        volatility = stock_details.get('volatility', 0.2)
        
        for i in range(30, -1, -1):
            days_ago = i
            random_change = (random.random() - 0.5) * 2 * volatility
            price = base_price * (1 - (days_ago / 30) * 0.1) * (1 + random_change)
            price_history.append(round(max(price * 0.7, price * 1.3), 2))
        
        stock_details['price_history'] = price_history
        
        return jsonify(stock_details), 200
    except Exception as e:
        return jsonify({"msg": f"Error fetching stock details: {str(e)}"}), 500

# blocklist check to jwtmanager
def attach_blocklist_checker(jwt_manager):
    @jwt_manager.token_in_blocklist_loader
    def _is_token_revoked(jwt_header, jwt_payload):
        return jwt_payload.get('jti') in BLOCKLIST