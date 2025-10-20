# DigitalOcean Deployment Guide

## Quick Fix: Internal Server Error on Sign Up

If you're getting "Internal server error" when users try to create accounts, it's because **JWT_SECRET is missing** from your DigitalOcean environment variables.

---

## 🚀 Fix the Error (2 minutes)

### Step 1: Generate a Secure JWT Secret

Run this command to generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (it will look like: `a3f9d8c7b2e1f4a6d8c9b7e2f3a5d8c7b1e4f6a9d8c7b2e1f4a6d8c9b7e2f3a5`)

### Step 2: Add JWT_SECRET to DigitalOcean

1. Go to your DigitalOcean App Platform dashboard
2. Click on your app ("culture-forward-api")
3. Click **Settings** tab
4. Scroll to **Environment Variables** section
5. Click **Edit**
6. Click **Add Variable**
7. Set:
   - **Key:** `JWT_SECRET`
   - **Value:** Paste the random string you generated
   - **Scope:** Select "All components" or "Run time"
   - **Encrypt:** Check this box (makes it a secret)
8. Click **Save**
9. Your app will automatically redeploy with the new secret

### Step 3: Test Sign Up

1. Wait 2-3 minutes for the deployment to complete
2. Visit your app URL
3. Try creating an account again
4. It should work now! ✅

---

## 📋 All Required Environment Variables

Your DigitalOcean app needs these environment variables:

### **Required (Must Set)**

| Variable | Description | How to Get |
|----------|-------------|------------|
| `JWT_SECRET` | Secure random string for JWT tokens | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATABASE_URL` | MongoDB connection string | Copy from your MongoDB Atlas or DigitalOcean Managed Database |

### **Optional (For Features)**

| Variable | Description | Required For |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Sign-In |
| `APPLE_CLIENT_ID` | Apple Service ID | Apple Sign-In |
| `APPLE_TEAM_ID` | Apple Team ID | Apple Sign-In |
| `APPLE_KEY_ID` | Apple Key ID | Apple Sign-In |
| `APPLE_PRIVATE_KEY` | Apple .p8 private key | Apple Sign-In |

### **Automatic (Already Set)**

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `8080` |

---

## 🔍 How to Check Current Environment Variables

1. Go to DigitalOcean App Platform
2. Open your app
3. Click **Settings** → **Environment Variables**
4. You should see:
   - ✅ `NODE_ENV` = production
   - ✅ `PORT` = 8080
   - ✅ `DATABASE_URL` = (encrypted/hidden)
   - ⚠️ `JWT_SECRET` = (should be here - add if missing)

---

## 🐛 Troubleshooting Common Errors

### Error: "Internal server error" on registration/login
**Cause:** Missing `JWT_SECRET`  
**Solution:** Follow Step 2 above to add it

### Error: "Failed to connect to MongoDB"
**Cause:** Invalid or missing `DATABASE_URL`  
**Solution:** 
1. Check your MongoDB connection string is correct
2. Make sure MongoDB Atlas/DigitalOcean DB allows connections from DigitalOcean IPs
3. Verify username/password are correct

### Error: "Cannot GET /"
**Cause:** App not serving static files  
**Solution:** This is already fixed in the code - just redeploy

### Google/Apple Sign-In not working
**Cause:** Missing OAuth credentials  
**Solution:** See `OAUTH_SETUP.md` for setup instructions

---

## 📦 Deployment Checklist

Before deploying to production:

- [x] Code pushed to GitHub
- [x] `.do/app.yaml` configured
- [ ] `JWT_SECRET` set in DigitalOcean
- [ ] `DATABASE_URL` set in DigitalOcean
- [ ] MongoDB database created and accessible
- [ ] OAuth credentials configured (optional)
- [ ] Test signup/login on production URL
- [ ] Test API endpoints with Postman/curl

---

## 🔐 Security Best Practices

1. **Never commit secrets to Git**
   - `.env` file is in `.gitignore`
   - Use DigitalOcean's encrypted environment variables

2. **Use strong JWT secrets**
   - Minimum 32 characters
   - Random alphanumeric string
   - Never reuse across environments

3. **Rotate secrets regularly**
   - Change JWT_SECRET every 6-12 months
   - Update in DigitalOcean settings

4. **Use different secrets for dev/prod**
   - Development: Set in Replit Secrets
   - Production: Set in DigitalOcean App Platform

---

## 🔄 Redeploying After Changes

Your app auto-deploys when you push to GitHub:

```bash
git add .
git commit -m "Add JWT_SECRET to app.yaml"
git push origin main
```

Or manually trigger a deployment:
1. Go to DigitalOcean App Platform
2. Click your app
3. Click **Actions** → **Force Rebuild and Deploy**

---

## 📊 Monitoring Your App

### Check App Logs
1. Go to DigitalOcean App Platform
2. Click your app
3. Click **Runtime Logs** tab
4. Look for errors or startup messages

### Check App Status
1. Visit: `https://your-app.ondigitalocean.app/health`
2. Should return: `{"status":"OK","timestamp":"..."}`

### Common Log Messages
- ✅ `Server running on port 8080` - App started successfully
- ✅ `MongoDB connected successfully` - Database connected
- ⚠️ `Failed to connect to MongoDB` - Check DATABASE_URL
- ❌ `JWT_SECRET or SESSION_TOKEN_SECRET must be configured` - Add JWT_SECRET

---

## 💡 Need Help?

If you're still having issues:

1. Check the Runtime Logs in DigitalOcean
2. Verify all environment variables are set correctly
3. Make sure your MongoDB database is accessible
4. Try the `/health` endpoint to see if the app is running

**Common Issue:** If you see "App is taking longer than expected to start", wait 2-3 minutes - the first deployment takes time to install dependencies.

---

Last Updated: October 20, 2025
