from flask import request, jsonify, Blueprint
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
import bcrypt
import mysql.connector

import db_utils

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

    access_token = create_access_token(identity={"id": user["id"], "username": user["username"]})
    return jsonify(access_token=access_token), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt().get('jti')
    if jti:
        BLOCKLIST.add(jti)
    return jsonify({"msg": "Successfully logged out"}), 200

# blocklist check to jwtmanager
def attach_blocklist_checker(jwt_manager):
    @jwt_manager.token_in_blocklist_loader
    def _is_token_revoked(jwt_header, jwt_payload):
        return jwt_payload.get('jti') in BLOCKLIST