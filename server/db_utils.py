# helper methods for accessing the db just call get user or add user or whatever
# inally made by jj added og config  and user functions


import os
import bcrypt
import mysql.connector
from dotenv import load_dotenv
from cryptography.fernet import Fernet

load_dotenv()

#Database configuration
db_config = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DB", "moneymap"),
}

#Encryption setup
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY").encode()  # Must be 32-byte base64
cipher = Fernet(ENCRYPTION_KEY)

#DB connection helper
def get_connection():
    return mysql.connector.connect(**db_config)


#Encryption / Decryption helpers
def encrypt_value(value):
    return cipher.encrypt(str(value).encode())

def decrypt_value(encrypted_value):
    return cipher.decrypt(encrypted_value).decode()


#User helpers
#TODO need to check for existing user with same name
def add_user(username, password):
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
        (username, hashed)
    )
    conn.commit()
    cursor.close()
    conn.close()


def verify_user(username, password):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT password_hash FROM users WHERE username=%s",
        (username,)
    )
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if not result:
        return False

    stored_hash = result[0]
    return bcrypt.checkpw(password.encode(), stored_hash.encode())


def get_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username FROM users")
    users = [{"id": row[0], "username": row[1]} for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return users


#Generic financial data helpers
def add_entry(user_id, amount, table_name):
    encrypted_amount = encrypt_value(amount)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"INSERT INTO {table_name} (user_id, amount_encrypted) VALUES (%s, %s)",
        (user_id, encrypted_amount)
    )
    conn.commit()
    cursor.close()
    conn.close()


def get_entries(user_id, table_name):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT id, amount_encrypted FROM {table_name} WHERE user_id=%s",
        (user_id,)
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    return [{"id": row[0], "amount": float(decrypt_value(row[1]))} for row in rows]

def update_entry(entry_id, new_amount, table_name):
    encrypted_amount = encrypt_value(new_amount)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"UPDATE {table_name} SET amount_encrypted=%s WHERE id=%s",
        (encrypted_amount, entry_id)
    )
    conn.commit()
    cursor.close()
    conn.close()


#Specific financial data helpers
def add_income(user_id, amount):
    add_entry(user_id, amount, "incomes")

def get_incomes(user_id):
    return get_entries(user_id, "incomes")

def add_saving(user_id, amount):
    add_entry(user_id, amount, "savings")

def get_savings(user_id):
    return get_entries(user_id, "savings")

def add_expense(user_id, amount):
    add_entry(user_id, amount, "expenses")

def get_expenses(user_id):
    return get_entries(user_id, "expenses")

def update_income(income_id, new_amount):
    update_entry(income_id, new_amount, "incomes")

def update_saving(saving_id, new_amount):
    update_entry(saving_id, new_amount, "savings")

def update_expense(expense_id, new_amount):
    update_entry(expense_id, new_amount, "expenses")


#ensures all requried tables exist
def initialize_database():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create incomes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS incomes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount_encrypted TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Create expenses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount_encrypted TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Create savings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS savings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount_encrypted TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        conn.commit()
        print("Database tables verified or created successfully.")

    except Error as e:
        print(f"Error initializing database: {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
