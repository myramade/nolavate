# Production Deployment Guide - Culture Forward API

This guide will walk you through deploying your Culture Forward API to production on Replit.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [x] MongoDB database configured (DigitalOcean cluster ready)
- [x] JWT secrets configured
- [x] Application tested and working in development
- [ ] MongoDB firewall configured to allow Replit connections
- [ ] Production environment variables set in Replit
- [ ] Custom domain ready (optional)
- [ ] SSL/TLS certificates (handled automatically by Replit)

---

## 🚀 Step-by-Step Deployment

### Step 1: Fix MongoDB Connection (CRITICAL)

Your MongoDB connection is timing out because DigitalOcean's firewall blocks Replit by default.

**Action Required:**
1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Navigate to **Databases** → Your MongoDB cluster (`db-mongodb-nyc3-18337`)
3. Click **Settings** → **Trusted Sources**
4. Add one of these options:
   - **Option A (Recommended):** Add `0.0.0.0/0` for all IPs (Replit deployments use dynamic IPs)
   - **Option B:** Add specific Replit IP ranges (contact Replit support for current ranges)
5. Click **Save**
6. Wait 2-3 minutes for changes to apply

**Why this matters:** Your app currently runs on mock data. In production, you need the real database.

---

### Step 2: Set Up Deployment Secrets in Replit

1. **Open Secrets Manager:**
   - Click the padlock icon 🔒 in the left sidebar (Tools → Secrets)

2. **Add Production Environment Variables:**

```bash
# Required Secrets
NODE_ENV=production
DATABASE_URL=mongodb+srv://doadmin:EHw479562PS01ali@db-mongodb-nyc3-18337-f6320c71.mongo.ondigitalocean.com/admin?replicaSet=db-mongodb-nyc3-18337&tls=true&authSource=admin
JWT_SECRET=1aa8aba58914cd7eaa3eefd4e292ef80102bdb9614a46111385ea707ebfc58d5b2e195b5e2ca1aab93f0efe6d4e805214097efa3094bff42050dc705bca8e440

# Production Security Settings
JWT_EXPIRES_IN=15m
ALLOWED_ORIGINS=https://your-custom-domain.com,https://your-app.replit.app

# Optional: OAuth (if needed)
GOOGLE_CLIENT_ID=your-google-client-id
APPLE_CLIENT_ID=your-apple-client-id

# Optional: Bot Protection
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

**Important Notes:**
- ✅ JWT_SECRET is already strong (128 characters)
- ⚠️ Change `ALLOWED_ORIGINS` to your actual production domain(s)
- 🔒 In production, use shorter JWT expiry (15m instead of 24h) for security
- 📝 Separate multiple origins with commas (no spaces)

---

### Step 3: Deploy to Replit (Autoscale)

1. **Click the "Deploy" button** (top-right corner) or search for "Deployments" in command bar

2. **Choose Deployment Type:**
   - Select **"Autoscale Deployment"** (recommended for APIs)
   - This scales automatically based on traffic

3. **Configure Deployment:**
   
   **Machine Resources:**
   - CPU: `0.5-1 vCPU` (sufficient for starting out)
   - RAM: `512MB - 1GB` (adequate for Node.js)
   - Max Machines: `2-5` (scales with traffic)

   **Build Settings:**
   - Build Command: `npm install` (automatic)
   - Run Command: `npm start` (already configured in package.json)

   **Port Configuration:**
   - Internal Port: `5000`
   - External Port: `80` (already configured in .replit)

4. **Environment Variables:**
   - All secrets you added in Step 2 will be automatically available
   - ✅ Verify `NODE_ENV=production` is set

5. **Click "Deploy"**
   - Initial build takes 2-3 minutes
   - You'll get a live URL: `https://your-app-name.replit.app`

---

### Step 4: Verify Deployment

Once deployed, test your API:

```bash
# Health Check
curl https://your-app-name.replit.app/health

# Expected Response:
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "uptime": 123.45,
    "timestamp": "2025-10-24T...",
    "services": {
      "database": {
        "status": "connected",  # Should be "connected" not "disconnected"
        "type": "MongoDB"
      }
    }
  }
}

# Test Registration
curl -X POST https://your-app-name.replit.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Test",
    "email": "test@production.com",
    "password": "SecurePass123!",
    "roleSubtype": "CANDIDATE"
  }'

# Should return 201 with access token
```

**What to Check:**
- ✅ `database.status: "connected"` (not "disconnected")
- ✅ Registration returns real MongoDB ObjectId (not "mock-...")
- ✅ Login works with created account
- ✅ No CORS errors in browser console

---

### Step 5: Add Custom Domain (Optional)

1. **In Replit Deployments:**
   - Click your deployment → **Settings** tab
   - Click **"Link a domain"**

2. **Choose Domain Provider:**
   - **Option A:** Buy domain through Replit (easiest)
   - **Option B:** Use existing domain (requires DNS configuration)

3. **If Using Existing Domain:**
   - Add these DNS records at your registrar (e.g., Namecheap, GoDaddy):
   ```
   Type: CNAME
   Name: @ (or www)
   Value: [provided by Replit]
   TTL: 3600
   ```
   - SSL certificate auto-generated by Replit (free)

4. **Update ALLOWED_ORIGINS:**
   ```bash
   ALLOWED_ORIGINS=https://your-custom-domain.com,https://www.your-custom-domain.com
   ```

---

## ⚙️ Production Configuration Summary

### Current Status:
- ✅ **Database:** MongoDB configured (needs firewall fix)
- ✅ **Security:** Strong JWT secret, password validation
- ✅ **CORS:** Configured (needs production domain)
- ✅ **API:** RESTful with standardized responses
- ✅ **Error Handling:** Centralized with graceful degradation
- ✅ **Retry Logic:** Database connection with exponential backoff

### Environment Variables (Production):

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=mongodb+srv://[credentials]@db-mongodb-nyc3-18337...

# Security
JWT_SECRET=[your-128-char-secret]  ✅ Already strong
JWT_EXPIRES_IN=15m  # Shorter for production
ALLOWED_ORIGINS=https://your-domain.com

# Optional Features
GOOGLE_CLIENT_ID=...
APPLE_CLIENT_ID=...
RECAPTCHA_SECRET_KEY=...
```

---

## 🔍 Monitoring & Logs

### View Production Logs:
1. Go to **Deployments** tab in Replit
2. Click your active deployment
3. Navigate to **Logs** tab
4. Filter by log level: INFO, WARN, ERROR

### Key Metrics to Monitor:
- **Health endpoint:** `/health` (check every 5 minutes)
- **Database status:** Should show "connected"
- **Response times:** <200ms for auth endpoints
- **Error rate:** <1% of total requests

### Common Issues:

**Database shows "disconnected":**
- Check DigitalOcean firewall (trusted sources)
- Verify DATABASE_URL is correct in secrets
- Check MongoDB cluster is running

**CORS errors:**
- Add your production domain to ALLOWED_ORIGINS
- Include both http and https if needed
- No trailing slashes in URLs

**401 Unauthorized errors:**
- Check JWT_SECRET matches in both dev and prod
- Verify tokens are not expired (check JWT_EXPIRES_IN)

---

## 📊 Deployment Costs (Replit Pricing)

### Autoscale Deployment:
- **Base:** ~$7/month for 0.5 vCPU, 512MB RAM
- **Scaling:** +$7/month per additional instance
- **Bandwidth:** First 100GB free, then $0.10/GB
- **Custom Domain:** Free SSL, DNS included

### External Services:
- **DigitalOcean MongoDB:** ~$15-30/month (already set up)
- **Domain (if buying new):** ~$10-15/year

**Total Estimated Cost:** $22-37/month

---

## 🚨 Security Recommendations

Before going live:

1. **Rotate Secrets Regularly:**
   - Change JWT_SECRET every 90 days
   - Update database passwords quarterly

2. **Enable Rate Limiting:**
   - ✅ Already configured for auth endpoints
   - Consider adding to other endpoints

3. **Monitor Authentication:**
   - Track failed login attempts
   - Set up alerts for unusual activity

4. **Backup Database:**
   - DigitalOcean provides automated backups
   - Enable point-in-time recovery

5. **Update Dependencies:**
   - Run `npm audit` monthly
   - Keep Node.js version current

---

## 🎯 Next Steps After Deployment

1. **Fix MongoDB connection** (Step 1 - highest priority)
2. **Deploy to Replit** (Step 3)
3. **Test all endpoints** (Step 4)
4. **Set up monitoring** (use Replit logs + external service like Sentry)
5. **Add custom domain** (Step 5 - optional)

---

## 📞 Getting Help

**MongoDB connection issues:**
- DigitalOcean Support: [cloud.digitalocean.com/support](https://cloud.digitalocean.com/support)

**Replit deployment issues:**
- Replit Docs: [docs.replit.com](https://docs.replit.com)
- Community: [ask.replit.com](https://ask.replit.com)

**Your app is production-ready!** The only blocker is the MongoDB firewall configuration. Once that's fixed, you can deploy immediately.

---

## ✅ Quick Start: Deploy Now

If you want to deploy right now with minimal steps:

1. **Fix MongoDB firewall** → Add trusted source in DigitalOcean
2. **Click "Deploy" in Replit** → Choose Autoscale
3. **Set ALLOWED_ORIGINS** → Add your Replit domain
4. **Click Publish** → Wait 2-3 minutes
5. **Test** → Visit your live URL

That's it! Your API will be live and ready for production traffic.
