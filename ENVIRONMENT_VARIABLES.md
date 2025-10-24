# Environment Variables Guide

## Required Variables

### Core Application
```bash
# Node Environment (development, production, staging, test)
NODE_ENV=production

# Server Port
PORT=5000

# MongoDB Database Connection
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secret (MUST be at least 32 characters)
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-chars-long

# JWT Token Expiration (15m, 1h, 24h, etc.)
JWT_EXPIRES_IN=15m
```

---

## File Upload Variables (Supabase)

**Required for:**
- Profile photo uploads
- Profile video uploads  
- Company logo uploads
- Job posting video uploads
- Resume uploads
- Onboarding media uploads

```bash
# Supabase Project URL
SUPABASE_URL=https://yourproject.supabase.co

# Supabase Anon/Public Key (for client-side)
SUPABASE_KEY=your-supabase-anon-key-here

# Supabase Service Role Key (for server-side, optional but recommended)
SUPABASE_SERVICE_KEY=your-supabase-service-role-key-here
```

### How to Get Supabase Credentials:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public** key → `SUPABASE_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (optional)

5. Create storage buckets:
   ```sql
   -- In Supabase SQL Editor
   -- Create buckets for file storage
   insert into storage.buckets (id, name, public) values
     ('companies', 'companies', true),
     ('onboarding', 'onboarding', true),
     ('posts', 'posts', true),
     ('resumes', 'resumes', true),
     ('thumbnails', 'thumbnails', true);
   ```

---

## AI Features (Perplexity)

**Required for:**
- AI-powered company creation (auto-fetch company details)
- Automatic personality matching for job posts

```bash
# Perplexity AI API Key
PERPLEXITY_API_KEY=your-perplexity-api-key-here
```

**If not set:** The app will use mock data instead (development mode).

### How to Get Perplexity API Key:

1. Go to [Perplexity API](https://www.perplexity.ai/api)
2. Sign up for an account
3. Navigate to API Keys
4. Generate a new API key
5. Copy the key → `PERPLEXITY_API_KEY`

---

## Security & CORS

```bash
# Allowed origins for CORS (comma-separated, no spaces)
ALLOWED_ORIGINS=https://your-app.ondigitalocean.app,https://your-custom-domain.com

# For development (allow all):
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:3000
```

---

## Optional OAuth Variables

### Google Sign-In

```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

**How to get:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy Client ID

### Apple Sign-In

```bash
APPLE_CLIENT_ID=your-apple-service-id
```

**How to get:**
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a Service ID
3. Enable Sign in with Apple
4. Configure domains and return URLs
5. Copy Service ID

---

## Example .env File

```bash
# Core (REQUIRED)
NODE_ENV=production
PORT=5000
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority
JWT_SECRET=a-very-long-random-string-at-least-32-characters-long-for-security
JWT_EXPIRES_IN=15m

# Supabase (REQUIRED for uploads)
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Security (REQUIRED for production)
ALLOWED_ORIGINS=https://your-app.ondigitalocean.app

# AI Features (OPTIONAL - uses mocks if not set)
PERPLEXITY_API_KEY=your-perplexity-key

# OAuth (OPTIONAL)
GOOGLE_CLIENT_ID=your-google-client-id
APPLE_CLIENT_ID=your-apple-service-id
```

---

## Setting Environment Variables in DigitalOcean

### Method 1: App Spec (`.do/app.yaml`)

Already configured in your `.do/app.yaml` file:
```yaml
envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "5000"
  - key: DATABASE_URL
    scope: RUN_TIME
    type: SECRET
  - key: JWT_SECRET
    scope: RUN_TIME
    type: SECRET
  - key: JWT_EXPIRES_IN
    value: "15m"
  - key: ALLOWED_ORIGINS
    scope: RUN_TIME
    type: SECRET
```

### Method 2: DigitalOcean Dashboard

1. Go to your app in DigitalOcean
2. Click **Settings** tab
3. Scroll to **App-Level Environment Variables**
4. Click **Edit**
5. Add new variables:
   ```
   Key: SUPABASE_URL
   Value: https://yourproject.supabase.co
   ✓ Encrypt
   
   Key: SUPABASE_KEY
   Value: your-supabase-key
   ✓ Encrypt
   
   Key: PERPLEXITY_API_KEY
   Value: your-perplexity-key
   ✓ Encrypt
   ```
6. Click **Save**
7. Redeploy the app

---

## Validation

Your app validates environment variables on startup. Check the logs:

**Success:**
```
✅ Environment configuration validated successfully
```

**Warnings (non-critical):**
```
⚠️  Configuration warnings:
  - SUPABASE_URL not set. File uploads will fail
  - PERPLEXITY_API_KEY not set. AI features will use mock data
```

**Errors (critical - app won't start):**
```
❌ Configuration validation failed:
  - JWT_SECRET environment variable is required
  - DATABASE_URL is required in production
```

---

## Security Best Practices

1. **Never commit secrets to Git**
   - ✅ Use `.env` file (already in `.gitignore`)
   - ✅ Use DigitalOcean encrypted variables

2. **Rotate secrets regularly**
   - JWT_SECRET: Every 90 days
   - API keys: When compromised or quarterly

3. **Use strong JWT secrets**
   - Minimum 32 characters
   - Random mix of letters, numbers, symbols
   - Generate with: `openssl rand -base64 48`

4. **Limit CORS origins**
   - Don't use `*` in production
   - Only list your actual domains
   - Include protocol (`https://`)

---

## Troubleshooting

### Problem: "JWT_SECRET is required"
**Fix:** Set `JWT_SECRET` environment variable with at least 32 characters

### Problem: "File uploads fail"
**Fix:** Set `SUPABASE_URL` and `SUPABASE_KEY` environment variables

### Problem: "Company creation returns mock data"
**Fix:** Set `PERPLEXITY_API_KEY` or continue using mock data (works fine for testing)

### Problem: "CORS errors in browser"
**Fix:** Add your frontend domain to `ALLOWED_ORIGINS`

---

## Quick Setup for DigitalOcean

1. **Copy these secrets from Replit:**
   ```bash
   DATABASE_URL → DigitalOcean
   JWT_SECRET → DigitalOcean
   ```

2. **Get Supabase credentials:**
   - SUPABASE_URL
   - SUPABASE_KEY

3. **Set in DigitalOcean:**
   - All as encrypted variables
   - Add `ALLOWED_ORIGINS=${APP_URL}` (auto-replaced with your app URL)

4. **Deploy:**
   - Push to GitHub
   - DigitalOcean auto-deploys
   - Check logs for validation messages

---

**Your app will work without optional variables, but some features will be disabled or use mock data.**
