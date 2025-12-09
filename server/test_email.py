# test_email.py
#
# Jason Albanus Virginia Tech August 22, 2025
#
# Simple email test script to verify SMTP configuration for password reset functionality.
#

#!/usr/bin/env python3
"""
Simple email test script to verify SMTP configuration
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def test_email():
    try:
        # Email configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = os.environ.get('EMAIL_USER')
        sender_password = os.environ.get('EMAIL_PASSWORD')
        
        print(f"Testing email with: {sender_email}")
        print(f"Using app password: {'*' * len(sender_password) if sender_password else 'NOT SET'}")
        
        if not sender_email or not sender_password:
            print("❌ Email credentials not configured properly!")
            print("Please update your .env file with:")
            print("EMAIL_USER=your-email@gmail.com")
            print("EMAIL_PASSWORD=your-16-character-app-password")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = sender_email  # Send to yourself for testing
        msg['Subject'] = "MoneyMap Email Test"
        
        body = """
        Hello!
        
        This is a test email from MoneyMap.
        If you receive this, your email configuration is working correctly!
        
        Best regards,
        MoneyMap Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        print("Connecting to Gmail SMTP...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        
        print("Authenticating...")
        server.login(sender_email, sender_password)
        
        print("Sending email...")
        text = msg.as_string()
        server.sendmail(sender_email, sender_email, text)
        server.quit()
        
        print("✅ Email sent successfully!")
        print(f"Check your inbox at: {sender_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print("❌ Authentication failed!")
        print("This usually means:")
        print("1. You need to use an App Password instead of your regular password")
        print("2. 2-Factor Authentication needs to be enabled")
        print("3. The App Password is incorrect")
        print(f"Error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Email test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing MoneyMap Email Configuration...")
    print("=" * 50)
    test_email()

