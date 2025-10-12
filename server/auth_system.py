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

def handle_register(username: str, password: str):
    if not username or not password:
        return jsonify({"msg": "Missing email/username or password"}), 400

    # email is username
    if get_user_single(username):
        return jsonify({"msg": "Email/username already exists"}), 409

    try:
        db_utils.add_user(username, password)
    except mysql.connector.IntegrityError as e:
        if getattr(e, 'errno', None) == 1062:
            return jsonify({"msg": "Username already exists"}), 409
        return jsonify({"msg": "Database error creating user"}), 500

    return jsonify({"msg": "User created successfully"}), 201

# routes
@auth_bp.route('/signup', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    username, password = extract_credentials(data)
    return handle_register(username, password)

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