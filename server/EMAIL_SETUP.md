# Email Setup for Password Reset

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Copy the 16-character password

3. **Update your `.env` file**:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

## Alternative Email Providers

### Outlook/Hotmail
```python
smtp_server = "smtp-mail.outlook.com"
smtp_port = 587
```

### Yahoo
```python
smtp_server = "smtp.mail.yahoo.com"
smtp_port = 587
```

## Testing Email

You can test the email functionality by:
1. Starting the server: `python3 app.py`
2. Going to `http://localhost:5173/forgot-password`
3. Entering a registered email address
4. Checking your email inbox

## Security Notes

- Never commit your `.env` file to version control
- Use app passwords instead of your main password
- Consider using environment variables in production
- The reset tokens expire after 1 hour for security

## Troubleshooting

**"Authentication failed"**: Check your email and app password
**"Connection refused"**: Verify SMTP server and port settings
**"Email not received"**: Check spam folder, verify email address
