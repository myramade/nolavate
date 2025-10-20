# OAuth Setup Guide

## Overview

Your Culture Forward application now includes mobile-friendly sign-up and login pages with Google and Apple OAuth integration. Users can sign up using:

- **Google Account** (Continue with Google)
- **Apple ID** (Continue with Apple)
- **Email & Password** (Traditional method)

---

## 🎨 What's Included

### ✅ Mobile-Friendly Frontend
- **Sign-up page**: `/` or `/index.html`
- **Login page**: `/login.html`
- **Responsive design**: Works perfectly on mobile, tablet, and desktop
- **Beautiful UI**: Modern gradient design with smooth animations
- **Dashboards**: Separate dashboards for candidates and recruiters

### ✅ Backend OAuth Integration
- **Google OAuth endpoint**: `POST /auth/google`
- **Apple Sign-In endpoint**: `POST /auth/apple`
- **Email/Password endpoints**: `POST /auth/register` and `POST /auth/login`

---

## 🔧 Configuration Required

To enable Google and Apple sign-in, you need to configure OAuth credentials from each provider.

---

## 1️⃣ Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**

### Step 2: Create OAuth 2.0 Client ID

1. Click **Create Credentials** → **OAuth client ID**
2. Configure consent screen if prompted:
   - User Type: **External**
   - App name: **Culture Forward**
   - User support email: Your email
   - Developer contact: Your email
3. Application type: **Web application**
4. Name: **Culture Forward Web**
5. Authorized JavaScript origins:
   ```
   http://localhost:5000
   https://your-replit-url.repl.co
   https://your-production-domain.com
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:5000
   https://your-replit-url.repl.co
   https://your-production-domain.com
   ```

### Step 3: Get Your Client ID

After creating the credentials, you'll receive:
- **Client ID**: `something.apps.googleusercontent.com`
- **Client Secret**: (not needed for frontend OAuth)

### Step 4: Add to Environment Variables

Add to your `.env` file or Replit Secrets:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Step 5: Update Frontend Configuration

Edit `public/index.html` and `public/login.html`:

Replace:
```html
data-client_id="YOUR_GOOGLE_CLIENT_ID"
```

With:
```html
data-client_id="your-actual-client-id.apps.googleusercontent.com"
```

Also update `public/js/auth.js`:

Replace:
```javascript
GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
```

With:
```javascript
GOOGLE_CLIENT_ID: 'your-actual-client-id.apps.googleusercontent.com',
```

---

## 2️⃣ Apple Sign-In Setup

### Step 1: Apple Developer Account

You need an **Apple Developer Account** ($99/year). Sign up at [developer.apple.com](https://developer.apple.com).

### Step 2: Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (Add)
4. Select **App IDs** → Continue
5. Description: **Culture Forward**
6. Bundle ID: `com.yourcompany.cultureforward` (or your domain in reverse)
7. Enable **Sign in with Apple**
8. Click **Continue** → **Register**

### Step 3: Create Services ID (for Web)

1. Click **Identifiers** → **+** (Add)
2. Select **Services IDs** → Continue
3. Description: **Culture Forward Web**
4. Identifier: `com.yourcompany.cultureforward.web`
5. Enable **Sign in with Apple**
6. Click **Configure**:
   - Primary App ID: Select the App ID you created
   - Website URLs:
     - Domains: `your-domain.com`, `your-replit-url.repl.co`
     - Return URLs: `https://your-domain.com/auth/apple/callback`
7. Click **Continue** → **Register**

### Step 4: Create Key for Sign in with Apple

1. Navigate to **Keys** → **+** (Add)
2. Key Name: **Culture Forward Sign in with Apple Key**
3. Enable **Sign in with Apple**
4. Click **Configure** → Select your Primary App ID
5. Click **Continue** → **Register**
6. **Download** the `.p8` key file (you can only download once!)
7. Note the **Key ID** (e.g., `ABC123XYZ`)

### Step 5: Get Your Team ID

1. Go to **Membership** in Apple Developer Portal
2. Copy your **Team ID** (10 characters)

### Step 6: Add to Environment Variables

Add to your `.env` file or Replit Secrets:

```bash
APPLE_CLIENT_ID=com.yourcompany.cultureforward.web
APPLE_TEAM_ID=ABC123XYZ
APPLE_KEY_ID=XYZ789ABC
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
```

**Note**: For the private key, you can either:
- Store the entire key as a multi-line environment variable
- Or store the path to the `.p8` file

### Step 7: Update Frontend Configuration

Edit `public/index.html` and `public/login.html`:

Find the Apple Sign-In configuration and update:
```html
<div id="appleid-signin" 
     data-client-id="YOUR_APPLE_CLIENT_ID"
     ...>
</div>
```

Replace with:
```html
<div id="appleid-signin" 
     data-client-id="com.yourcompany.cultureforward.web"
     ...>
</div>
```

Also update `public/js/auth.js`:

Replace:
```javascript
APPLE_CLIENT_ID: 'YOUR_APPLE_CLIENT_ID',
```

With:
```javascript
APPLE_CLIENT_ID: 'com.yourcompany.cultureforward.web',
```

---

## 🧪 Testing OAuth Integration

### Testing Email/Password (Works Now)

1. Visit your app: `http://localhost:5000` or your Replit URL
2. Fill in the sign-up form with email and password
3. Click "Create Account"
4. You should be redirected to the dashboard

### Testing Google OAuth (After Configuration)

1. Visit your app
2. Click "Continue with Google"
3. Select a Google account
4. You should be redirected to the dashboard

### Testing Apple Sign-In (After Configuration)

1. Visit your app
2. Click "Continue with Apple"
3. Sign in with your Apple ID
4. You should be redirected to the dashboard

---

## 🚀 Deploying to Production

When deploying to DigitalOcean or any production environment:

1. **Add environment variables** to your production environment:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   APPLE_CLIENT_ID=com.yourcompany.cultureforward.web
   APPLE_TEAM_ID=ABC123XYZ
   APPLE_KEY_ID=XYZ789ABC
   APPLE_PRIVATE_KEY="your-private-key"
   ```

2. **Update OAuth authorized origins** in Google Cloud Console to include your production domain

3. **Update Apple return URLs** in Apple Developer Portal to include your production domain

---

## 📱 Mobile Responsiveness

The frontend is fully optimized for mobile devices:

- **Touch-friendly buttons** (minimum 48px tap targets)
- **Single-column layout** for mobile
- **Responsive forms** that adapt to screen size
- **Mobile keyboard optimization** (email field triggers email keyboard)
- **Password show/hide toggle** for easy mobile use

---

## 🔒 Security Features

- **Backend token verification**: All OAuth tokens are verified server-side
- **JWT session management**: Secure session tokens issued after authentication
- **HTTPS required**: OAuth providers require HTTPS in production
- **No password storage** for OAuth users
- **Email verification** from OAuth providers

---

## ❓ Troubleshooting

### "Google OAuth not configured" error
- Make sure `GOOGLE_CLIENT_ID` is set in environment variables
- Update the client ID in `public/index.html`, `public/login.html`, and `public/js/auth.js`

### "Apple Sign-In not configured" error
- Make sure `APPLE_CLIENT_ID` is set in environment variables
- Update the client ID in `public/index.html`, `public/login.html`, and `public/js/auth.js`

### Google sign-in popup blocked
- Allow popups in your browser for this site
- Or use Google One Tap (automatic prompt)

### Apple sign-in not working
- Verify all Apple credentials are correct
- Check that return URLs match exactly
- Apple Sign-In only works on HTTPS in production

---

## 📚 Resources

- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Apple Developer Portal](https://developer.apple.com/account/)

---

## ✅ Next Steps

1. **Set up Google OAuth** following the steps above
2. **Set up Apple Sign-In** (optional, requires paid Apple Developer account)
3. **Test the authentication flow** on your local/Replit environment
4. **Deploy to production** with proper OAuth credentials
5. **Monitor user sign-ups** and authentication success rates

Your mobile-friendly frontend with OAuth is ready to use! 🎉
