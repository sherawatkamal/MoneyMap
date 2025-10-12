from flask import Flask, jsonify
import flask
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv
import db_utils
from auth_system import auth_bp

load_dotenv()
db_utils.initialize_database()

app = Flask(__name__)
CORS(app)

# Register the auth blueprint
app.register_blueprint(auth_bp, url_prefix='/')

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


@app.route('/createUser', methods=['POST'])
def newUser():
    user_data = flask.request.get_json()
    db_utils.add_user(user_data['username'], user_data['password'])
    return jsonify({'status': 'good'})

@app.route('/login', methods=['POST'])
def login():
    user_data = flask.request.get_json()
    db_utils.verify_user(user_data['username'], user_data['password'])
    return jsonify({'status': 'good'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
