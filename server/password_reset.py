# password_reset.py
#
# Jason Albanus Virginia Tech August 22, 2025
#
# Password reset functionality including token generation, email sending, and token validation.
#

import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def generate_reset_token():
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)

def send_reset_email(email, token, username):
    """Send password reset email"""
    try:
        # Email configuration (using Gmail SMTP for simplicity)
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = os.environ.get('EMAIL_USER', 'your-email@gmail.com')
        sender_password = os.environ.get('EMAIL_PASSWORD', 'your-app-password')
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "MoneyMap - Password Reset Request"
        msg['From'] = sender_email
        msg['To'] = email
        
        # Create HTML email content
        reset_url = f"http://localhost:5173/reset-password?token={token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset - MoneyMap</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #059669 0%, #10b981 50%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🗺️ MoneyMap</h1>
                    <p>Password Reset Request</p>
                </div>
                <div class="content">
                    <h2>Hello {username}!</h2>
                    <p>We received a request to reset your password for your MoneyMap account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="{reset_url}" class="button">Reset My Password</a>
                    <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #666;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="{reset_url}">{reset_url}</a>
                    </p>
                </div>
                <div class="footer">
                    <p>© 2024 MoneyMap. Your Personal Financial Planning Journey.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def save_reset_token(email, token):
    """Save reset token to database"""
    conn = mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=os.environ.get('DB_NAME', 'moneymap')
    )
    
    try:
        with conn.cursor() as cursor:
            # Set token expiration to 1 hour from now
            expires_at = datetime.now() + timedelta(hours=1)
            
            cursor.execute("""
                UPDATE users 
                SET reset_token = %s, reset_token_expires = %s 
                WHERE email = %s
            """, (token, expires_at, email))
            
            conn.commit()
            return cursor.rowcount > 0
    finally:
        conn.close()

def verify_reset_token(token):
    """Verify if reset token is valid and not expired"""
    conn = mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=os.environ.get('DB_NAME', 'moneymap')
    )
    
    try:
        with conn.cursor(dictionary=True) as cursor:
            cursor.execute("""
                SELECT id, email FROM users 
                WHERE reset_token = %s 
                AND reset_token_expires > NOW()
            """, (token,))
            
            return cursor.fetchone()
    finally:
        conn.close()

def clear_reset_token(token):
    """Clear reset token after successful password reset"""
    conn = mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=os.environ.get('DB_NAME', 'moneymap')
    )
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE users 
                SET reset_token = NULL, reset_token_expires = NULL 
                WHERE reset_token = %s
            """, (token,))
            
            conn.commit()
            return cursor.rowcount > 0
    finally:
        conn.close()
