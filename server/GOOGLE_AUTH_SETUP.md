# Google Authentication Setup Guide

## Overview
MoneyMap now supports Google Sign-In for both login and signup, providing users with a quick and secure way to authenticate.

## Prerequisites
- A Google Cloud account
- A registered OAuth client ID

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" → "New Project"
3. Enter a project name (e.g., "MoneyMap")
4. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Identity Services API"
3. Click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (for development)
   - Fill in the required information:
     - App name: MoneyMap
     - User support email: your-email@gmail.com
     - Developer contact: your-email@gmail.com
   - Click "Save and Continue"
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your Gmail addresses)
   - Click "Save and Continue"
   - Click "Back to Dashboard"
4. Create OAuth Client:
   - Application type: "Web application"
   - Name: "MoneyMap Web Client"
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
   - Click "Create"
5. Copy the "Client ID" (you'll need this)

### 4. Configure Your Application

#### Backend Configuration

The backend is already configured to accept Google OAuth tokens. No additional configuration is needed.

#### Frontend Configuration

Create a `.env` file in the `client/` directory (if it doesn't exist):

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

Replace `your-google-client-id-here.apps.googleusercontent.com` with your actual Client ID from step 3.

**Important**: Never commit the `.env` file to version control!

### 5. Test the Integration

1. Start your server:
   ```bash
   cd server
   python app.py
   ```

2. Start your client:
   ```bash
   cd client
   npm run dev
   ```

3. Navigate to `http://localhost:5173/login`
4. Click the "Sign in with Google" button
5. Sign in with your Google account
6. You should be redirected to the dashboard

## How It Works

### Login Flow
1. User clicks "Sign in with Google" button
2. Google Sign-In dialog appears
3. User authenticates with Google
4. Google returns a credential token
5. Frontend sends token to backend `/google-auth` endpoint
6. Backend verifies token with Google's API
7. Backend creates/retrieves user and returns JWT token
8. Frontend stores JWT token and redirects to dashboard

### Signup Flow
Same as login flow, but if user doesn't exist, a new account is automatically created.

## Security Notes

- The Google token is verified server-side with Google's API
- Passwords for OAuth users are randomly generated (not used for authentication)
- All authentication still uses JWT tokens
- Google tokens are never stored, only used for verification

## Troubleshooting

### "Authentication Failed"
- Check that your Google Client ID is correct
- Ensure `http://localhost:5173` is added as an authorized origin
- Check browser console for error messages

### "Invalid Google Token"
- Make sure your Client ID is correct
- Check that the API is enabled in Google Cloud Console
- Verify your OAuth consent screen is configured

### Button Not Appearing
- Check browser console for errors
- Ensure the Google Sign-In script is loaded
- Verify your Client ID is set in the `.env` file

## Production Deployment

When deploying to production:

1. Update authorized origins and redirect URIs in Google Cloud Console
2. Update `VITE_GOOGLE_CLIENT_ID` in your production environment variables
3. Ensure HTTPS is enabled (required for OAuth in production)
4. Update all URLs from `localhost:5173` to your production domain

## Support

For more information:
- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Google Cloud Console](https://console.cloud.google.com/)

