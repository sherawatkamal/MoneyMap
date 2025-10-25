from flask import request, jsonify, Blueprint
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
import bcrypt
import mysql.connector

import db_utils
import password_reset

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

# blocklist check to jwtmanager
def attach_blocklist_checker(jwt_manager):
    @jwt_manager.token_in_blocklist_loader
    def _is_token_revoked(jwt_header, jwt_payload):
        return jwt_payload.get('jti') in BLOCKLIST