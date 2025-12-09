# db_utils.py
#
# JJ Feeney III Virginia Tech August 22, 2025
#
# Database utility functions for user management, encryption/decryption of sensitive financial data,
# user preferences, and database initialization with table creation and migration support.
#
# helper methods for accessing the db just call get user or add user or whatever
# inally made by jj added og config  and user functions


import os
import bcrypt
import mysql.connector
from mysql.connector import Error
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
    try:
        return cipher.decrypt(encrypted_value).decode()
    except:
        # If decryption fails (e.g., due to key change), return None
        return None


#User helpers
def add_user(username, password, email, full_name=None, phone=None, age=None, 
             occupation=None, annual_income=None, financial_goal=None, risk_tolerance=None):
    """
    Add a new user with comprehensive profile information
    """
    # Hash the password
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    
    # Encrypt sensitive financial data
    annual_income_encrypted = encrypt_value(annual_income) if annual_income else None
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO users (
                username, password_hash, email, full_name, phone, age, 
                occupation, annual_income_encrypted, financial_goal, risk_tolerance
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            username, hashed, email, full_name, phone, age,
            occupation, annual_income_encrypted, financial_goal, risk_tolerance
        ))
        conn.commit()
        return cursor.lastrowid  # Return the new user ID
    except mysql.connector.Error as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


# internal db helper for pulling singular user
def get_user_single(username: str):
    """
    Get user information by username, including all profile data
    """
    conn = get_connection()
    try:
        with conn.cursor(dictionary=True) as cur:
            cur.execute("""
                SELECT id, username, password_hash, email, full_name, phone, age, 
                       occupation, annual_income_encrypted, financial_goal, risk_tolerance
                FROM users WHERE username=%s LIMIT 1
            """, (username,))
            user = cur.fetchone()
            
            if user and user['annual_income_encrypted']:
                # Decrypt the annual income
                decrypted_value = decrypt_value(user['annual_income_encrypted'])
                if decrypted_value:
                    user['annual_income'] = float(decrypted_value)
                del user['annual_income_encrypted']  # Remove the encrypted version
            
            return user
    finally:
        conn.close()

def get_user_by_email(email: str):
    """
    Get user information by email, including all profile data
    """
    conn = get_connection()
    try:
        with conn.cursor(dictionary=True) as cur:
            cur.execute("""
                SELECT id, username, password_hash, email, full_name, phone, age, 
                       occupation, annual_income_encrypted, financial_goal, risk_tolerance
                FROM users WHERE email=%s LIMIT 1
            """, (email,))
            user = cur.fetchone()
            
            if user and user['annual_income_encrypted']:
                # Decrypt the annual income
                decrypted_value = decrypt_value(user['annual_income_encrypted'])
                if decrypted_value:
                    user['annual_income'] = float(decrypted_value)
                del user['annual_income_encrypted']  # Remove the encrypted version
            
            return user
    finally:
        conn.close()


def user_exists_by_email(email: str):
    """
    Check if a user already exists with the given email
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email=%s LIMIT 1", (email,))
            return cur.fetchone() is not None
    finally:
        conn.close()


def user_exists_by_username(username: str):
    """
    Check if a user already exists with the given username
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE username=%s LIMIT 1", (username,))
            return cur.fetchone() is not None
    finally:
        conn.close()

def get_user_by_id(user_id: int):
    """
    Get user information by ID, including all profile data
    """
    conn = get_connection()
    try:
        with conn.cursor(dictionary=True) as cur:
            cur.execute("""
                SELECT id, username, email, full_name, phone, age, 
                       occupation, annual_income_encrypted, financial_goal, risk_tolerance
                FROM users WHERE id=%s LIMIT 1
            """, (user_id,))
            user = cur.fetchone()
            
            if user and user['annual_income_encrypted']:
                # Decrypt the annual income
                decrypted_value = decrypt_value(user['annual_income_encrypted'])
                if decrypted_value:
                    user['annual_income'] = float(decrypted_value)
                del user['annual_income_encrypted']  # Remove the encrypted version
            
            return user
    finally:
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
                email VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                phone VARCHAR(20),
                age INT,
                occupation VARCHAR(255),
                annual_income_encrypted TEXT,
                financial_goal VARCHAR(255),
                risk_tolerance VARCHAR(50),
                reset_token VARCHAR(255),
                reset_token_expires TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

        # Create user_preferences table for emergency fund and other preferences
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                current_savings DECIMAL(15,2),
                monthly_expenses DECIMAL(15,2),
                emergency_fund_target DECIMAL(15,2),
                monthly_contribution DECIMAL(15,2),
                emergency_goal VARCHAR(255),
                budget_housing_percent DECIMAL(5,2),
                budget_food_percent DECIMAL(5,2),
                budget_transportation_percent DECIMAL(5,2),
                budget_utilities_percent DECIMAL(5,2),
                budget_entertainment_percent DECIMAL(5,2),
                budget_other_percent DECIMAL(5,2),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Create stock_watchlist table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_watchlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                stock_ticker VARCHAR(10) NOT NULL,
                stock_name VARCHAR(255),
                current_price DECIMAL(15,2),
                notes TEXT,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_ticker (user_id, stock_ticker)
            )
        """)
        
        # Check if existing user_preferences table needs migration
        cursor.execute("SHOW TABLES LIKE 'user_preferences'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            # Check if current_savings column exists
            cursor.execute("SHOW COLUMNS FROM user_preferences LIKE 'current_savings'")
            has_current_savings = cursor.fetchone()
            
            if not has_current_savings:
                try:
                    cursor.execute("ALTER TABLE user_preferences ADD COLUMN current_savings DECIMAL(15,2)")
                    print("Added current_savings column to user_preferences table")
                except mysql.connector.Error as e:
                    if e.errno != 1060:  # Duplicate column name error
                        print(f"Error adding current_savings column: {e}")
            
            # Check if monthly_expenses column exists
            cursor.execute("SHOW COLUMNS FROM user_preferences LIKE 'monthly_expenses'")
            has_monthly_expenses = cursor.fetchone()
            
            if not has_monthly_expenses:
                try:
                    cursor.execute("ALTER TABLE user_preferences ADD COLUMN monthly_expenses DECIMAL(15,2)")
                    print("Added monthly_expenses column to user_preferences table")
                except mysql.connector.Error as e:
                    if e.errno != 1060:  # Duplicate column name error
                        print(f"Error adding monthly_expenses column: {e}")
            
            # Check if budget breakdown columns exist
            budget_columns = [
                'budget_housing_percent', 'budget_food_percent', 
                'budget_transportation_percent', 'budget_utilities_percent',
                'budget_entertainment_percent', 'budget_other_percent'
            ]
            
            for col in budget_columns:
                cursor.execute(f"SHOW COLUMNS FROM user_preferences LIKE '{col}'")
                has_col = cursor.fetchone()
                
                if not has_col:
                    try:
                        cursor.execute(f"ALTER TABLE user_preferences ADD COLUMN {col} DECIMAL(5,2)")
                        print(f"Added {col} column to user_preferences table")
                    except mysql.connector.Error as e:
                        if e.errno != 1060:  # Duplicate column name error
                            print(f"Error adding {col} column: {e}")
            
            # Check if stock_watchlist table exists
            cursor.execute("SHOW TABLES LIKE 'stock_watchlist'")
            has_watchlist = cursor.fetchone()
            
            if not has_watchlist:
                try:
                    cursor.execute("""
                        CREATE TABLE stock_watchlist (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            stock_ticker VARCHAR(10) NOT NULL,
                            stock_name VARCHAR(255),
                            current_price DECIMAL(15,2),
                            notes TEXT,
                            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            UNIQUE KEY unique_user_ticker (user_id, stock_ticker)
                        )
                    """)
                    print("Added stock_watchlist table")
                except mysql.connector.Error as e:
                    if e.errno != 1050:  # Table exists error
                        print(f"Error creating stock_watchlist table: {e}")

        conn.commit()
        print("Database tables verified or created successfully.")

    except Error as e:
        print(f"Error initializing database: {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# User preferences helpers
def get_user_preferences(user_id):
    """
    Get user preferences for emergency fund and other settings
    """
    conn = get_connection()
    try:
        with conn.cursor(dictionary=True) as cur:
            cur.execute("""
                SELECT current_savings, monthly_expenses, emergency_fund_target, 
                       monthly_contribution, emergency_goal,
                       budget_housing_percent, budget_food_percent,
                       budget_transportation_percent, budget_utilities_percent,
                       budget_entertainment_percent, budget_other_percent
                FROM user_preferences WHERE user_id=%s
            """, (user_id,))
            return cur.fetchone()
    finally:
        conn.close()


def create_user_preferences(user_id, current_savings=None, monthly_expenses=None):
    """
    Create initial user preferences with financial data from signup
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO user_preferences (user_id, current_savings, monthly_expenses)
            VALUES (%s, %s, %s)
        """, (user_id, current_savings, monthly_expenses))
        
        conn.commit()
        return True
    except mysql.connector.IntegrityError:
        # Preferences already exist, just return True
        conn.rollback()
        return True
    except mysql.connector.Error as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def update_user_preferences(user_id, emergency_fund_target=None, monthly_contribution=None, emergency_goal=None, 
                           current_savings=None, monthly_expenses=None,
                           budget_housing_percent=None, budget_food_percent=None,
                           budget_transportation_percent=None, budget_utilities_percent=None,
                           budget_entertainment_percent=None, budget_other_percent=None):
    """
    Update user preferences. Creates row if it doesn't exist.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Check if preferences exist
        cursor.execute("SELECT id FROM user_preferences WHERE user_id=%s", (user_id,))
        exists = cursor.fetchone()
        
        if exists:
            # Update existing preferences
            updates = []
            values = []
            
            if emergency_fund_target is not None:
                updates.append("emergency_fund_target=%s")
                values.append(emergency_fund_target)
            
            if monthly_contribution is not None:
                updates.append("monthly_contribution=%s")
                values.append(monthly_contribution)
            
            if emergency_goal is not None:
                updates.append("emergency_goal=%s")
                values.append(emergency_goal)
            
            if current_savings is not None:
                updates.append("current_savings=%s")
                values.append(current_savings)
            
            if monthly_expenses is not None:
                updates.append("monthly_expenses=%s")
                values.append(monthly_expenses)
            
            if budget_housing_percent is not None:
                updates.append("budget_housing_percent=%s")
                values.append(budget_housing_percent)
            
            if budget_food_percent is not None:
                updates.append("budget_food_percent=%s")
                values.append(budget_food_percent)
            
            if budget_transportation_percent is not None:
                updates.append("budget_transportation_percent=%s")
                values.append(budget_transportation_percent)
            
            if budget_utilities_percent is not None:
                updates.append("budget_utilities_percent=%s")
                values.append(budget_utilities_percent)
            
            if budget_entertainment_percent is not None:
                updates.append("budget_entertainment_percent=%s")
                values.append(budget_entertainment_percent)
            
            if budget_other_percent is not None:
                updates.append("budget_other_percent=%s")
                values.append(budget_other_percent)
            
            if updates:
                values.append(user_id)
                cursor.execute(
                    f"UPDATE user_preferences SET {', '.join(updates)} WHERE user_id=%s",
                    values
                )
        else:
            # Insert new preferences
            cursor.execute("""
                INSERT INTO user_preferences (user_id, emergency_fund_target, monthly_contribution, emergency_goal, 
                current_savings, monthly_expenses, budget_housing_percent, budget_food_percent,
                budget_transportation_percent, budget_utilities_percent, budget_entertainment_percent, budget_other_percent)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (user_id, emergency_fund_target, monthly_contribution, emergency_goal, current_savings, monthly_expenses,
                 budget_housing_percent, budget_food_percent, budget_transportation_percent,
                 budget_utilities_percent, budget_entertainment_percent, budget_other_percent))
        
        conn.commit()
        return True
    except mysql.connector.Error as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def update_user_profile(user_id, full_name=None, phone=None, age=None, 
                        occupation=None, annual_income=None, financial_goal=None, 
                        risk_tolerance=None):
    """
    Update user profile information
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        updates = []
        values = []
        
        if full_name is not None:
            updates.append("full_name=%s")
            values.append(full_name)
        
        if phone is not None:
            updates.append("phone=%s")
            values.append(phone)
        
        if age is not None:
            updates.append("age=%s")
            values.append(age)
        
        if occupation is not None:
            updates.append("occupation=%s")
            values.append(occupation)
        
        if annual_income is not None:
            annual_income_encrypted = encrypt_value(annual_income)
            updates.append("annual_income_encrypted=%s")
            values.append(annual_income_encrypted)
        
        if financial_goal is not None:
            updates.append("financial_goal=%s")
            values.append(financial_goal)
        
        if risk_tolerance is not None:
            updates.append("risk_tolerance=%s")
            values.append(risk_tolerance)
        
        if updates:
            values.append(user_id)
            cursor.execute(
                f"UPDATE users SET {', '.join(updates)} WHERE id=%s",
                values
            )
            conn.commit()
            return True
        return False
    except mysql.connector.Error as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
