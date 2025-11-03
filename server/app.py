from flask import Flask, jsonify
import flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import mysql.connector
import os
from dotenv import load_dotenv
import db_utils
from auth_system import auth_bp, attach_blocklist_checker
from exports import exports_bp

load_dotenv()
db_utils.initialize_database()

app = Flask(__name__)

# Configure CORS with specific origins
CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

# Configure JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire for now
jwt = JWTManager(app)

# Attach blocklist checker for logout functionality
attach_blocklist_checker(jwt)

# Register the auth blueprint
app.register_blueprint(auth_bp, url_prefix='/')
app.register_blueprint(exports_bp)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@app.route("/api/db-test")
def db_test():
    conn = db_utils.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT NOW()")
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify({"db_time": str(result[0])})


# Removed duplicate routes - they are handled by auth_system blueprint

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
