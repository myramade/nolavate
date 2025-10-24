# DigitalOcean Deployment Guide - Culture Forward API

Deploy your Culture Forward API to DigitalOcean App Platform with automatic deployments from GitHub.

---

## 🎯 **Overview**

Your app is already configured for DigitalOcean deployment:
- ✅ App spec file: `.do/app.yaml`
- ✅ GitHub repository: `myramade/nolavate`
- ✅ MongoDB database: `db-mongodb-nyc3-18337` (already created)
- ✅ Dockerfile config: `.dockerignore`

**Deployment Method:** GitHub → DigitalOcean App Platform (auto-deploy on push to `main`)

---

## 🚀 **Quick Deployment Steps**

### Step 1: Fix MongoDB Firewall (CRITICAL)

Your MongoDB connection times out because the firewall blocks DigitalOcean App Platform.

**Fix this now:**
1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Navigate to **Databases** → `db-mongodb-nyc3-18337`
3. Click **Settings** → **Trusted Sources**
4. Click **"Add trusted source"**
5. Select **"App Platform"** from dropdown
6. Choose your app (or add `0.0.0.0/0` for all sources)
7. Click **Save**

**This allows your deployed app to connect to the database.**

---

### Step 2: Create App on DigitalOcean

1. **Go to DigitalOcean Dashboard**
   - Navigate to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)

2. **Click "Create App"**

3. **Choose GitHub as Source:**
   - Click **"GitHub"**
   - Authorize DigitalOcean to access your GitHub account
   - Select repository: `myramade/nolavate`
   - Select branch: `main`
   - ✅ Check **"Autodeploy"** (deploys automatically on git push)

4. **Import App Spec:**
   - Click **"Import from .do/app.yaml"** (DigitalOcean will detect it)
   - OR manually configure:
     - Service Name: `web`
     - Environment: Node.js
     - Build Command: `npm install --production`
     - Run Command: `npm start`
     - HTTP Port: `5000`

5. **Configure Environment Variables:**
   
   Click **"Edit"** next to Environment Variables and add:

   ```bash
   # Required
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=mongodb+srv://doadmin:EHw479562PS01ali@db-mongodb-nyc3-18337-f6320c71.mongo.ondigitalocean.com/admin?replicaSet=db-mongodb-nyc3-18337&tls=true&authSource=admin
   JWT_SECRET=1aa8aba58914cd7eaa3eefd4e292ef80102bdb9614a46111385ea707ebfc58d5b2e195b5e2ca1aab93f0efe6d4e805214097efa3094bff42050dc705bca8e440
   
   # Security
   JWT_EXPIRES_IN=15m
   ALLOWED_ORIGINS=${APP_URL}
   
   # Optional (if you enable OAuth)
   GOOGLE_CLIENT_ID=your-google-client-id
   APPLE_CLIENT_ID=your-apple-client-id
   ```

   **Important:**
   - Mark `DATABASE_URL`, `JWT_SECRET`, and `ALLOWED_ORIGINS` as **"Encrypt"** (secret)
   - `${APP_URL}` is automatically replaced with your app's URL

6. **Select Resources:**
   - **Instance Size:** Basic ($5/month)
     - CPU: 1 vCPU
     - RAM: 512 MB
   - **Instance Count:** 1 (can scale later)

7. **Link Database:**
   - Under **Resources**, click **"Add Resource"**
   - Select **"Previously Created DigitalOcean Database"**
   - Choose: `db-mongodb-nyc3-18337`
   - This automatically adds `DATABASE_URL` to your environment

8. **Review & Create:**
   - Review all settings
   - Click **"Create Resources"**
   - Initial deployment takes 5-10 minutes

---

### Step 3: Verify Deployment

Once deployed, DigitalOcean provides a URL like:
`https://culture-forward-api-xxxxx.ondigitalocean.app`

**Test your API:**

```bash
# Health Check
curl https://your-app.ondigitalocean.app/health

# Expected response:
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "services": {
      "database": {
        "status": "connected"  # Should be "connected"
      }
    }
  }
}

# Test Registration
curl -X POST https://your-app.ondigitalocean.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Test",
    "email": "test@production.com",
    "password": "SecurePass123!",
    "roleSubtype": "CANDIDATE"
  }'

# Should return 201 with MongoDB ObjectId (not "mock-...")
```

**Success Indicators:**
- ✅ Database shows `"connected"`
- ✅ User IDs are MongoDB ObjectIds (24 hex chars)
- ✅ No mock data ("mock-..." IDs)
- ✅ Health check returns 200

---

### Step 4: Add Custom Domain (Optional)

1. **In DigitalOcean App:**
   - Go to your app → **Settings** → **Domains**
   - Click **"Add Domain"**

2. **Enter Your Domain:**
   - Example: `api.yourcompany.com`

3. **Update DNS at Your Registrar:**
   
   Add these DNS records (Namecheap, GoDaddy, etc.):
   
   ```
   Type: CNAME
   Name: api (or @)
   Value: culture-forward-api-xxxxx.ondigitalocean.app
   TTL: 3600
   ```

4. **SSL Certificate:**
   - DigitalOcean automatically provisions Let's Encrypt SSL
   - Takes 5-15 minutes to activate
   - Free and auto-renews

5. **Update ALLOWED_ORIGINS:**
   - In App settings, update environment variable:
   ```
   ALLOWED_ORIGINS=https://api.yourcompany.com,https://www.yourapp.com
   ```

---

## 📊 **Current Configuration**

Your `.do/app.yaml` is configured with:

```yaml
- Service: Node.js web service
- Port: 5000
- Instance: Basic XXS ($5/month)
- Auto-deploy: Enabled on push to main
- Health check: /health every 10 seconds
- Database: MongoDB cluster (db-mongodb-nyc3-18337)
```

---

## 🔄 **Continuous Deployment**

Once set up, deployments are automatic:

1. **Make changes** to your code locally
2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. **DigitalOcean automatically:**
   - Detects the push
   - Builds the app (`npm install`)
   - Runs health checks
   - Deploys with zero downtime
   - Takes 3-5 minutes

**View deployment logs:**
- DigitalOcean Dashboard → Your App → **Runtime Logs**

---

## 💰 **Pricing Estimate**

### DigitalOcean App Platform:
- **Basic Instance:** $5/month (512MB RAM, 1 vCPU)
- **Professional Instance:** $12/month (1GB RAM, 1 vCPU) - recommended for production
- **Bandwidth:** 1TB included, then $0.01/GB

### MongoDB Database:
- **Current Setup:** ~$15-30/month (already running)

### Total Monthly Cost:
- **Development:** $20-35/month (Basic instance)
- **Production:** $27-42/month (Professional instance)

**Scaling Options:**
- Add more instances (horizontal scaling)
- Upgrade instance size (vertical scaling)
- Both can be done without downtime

---

## 🔍 **Monitoring & Logs**

### View Application Logs:
1. Go to your app in DigitalOcean
2. Click **"Runtime Logs"** tab
3. Filter by:
   - Time range
   - Log level (INFO, WARN, ERROR)
   - Component (web service)

### Set Up Alerts:
1. Go to **Settings** → **Alerts**
2. Configure alerts for:
   - CPU usage > 80%
   - Memory usage > 80%
   - Failed health checks
   - Error rate spikes

### Monitor Health:
```bash
# Automated monitoring (every 5 minutes)
curl https://your-app.ondigitalocean.app/health

# Check database connectivity
curl https://your-app.ondigitalocean.app/api/v1/health/detailed
```

---

## 🚨 **Troubleshooting**

### Problem: Build Fails

**Check:**
1. Deployment logs for error messages
2. Ensure `package.json` has all dependencies
3. Node.js version compatibility (using Node 20)

**Fix:**
```bash
# Test locally first
npm install
npm start
```

---

### Problem: Database Connection Fails

**Symptoms:**
- Health check shows `database: "disconnected"`
- Logs show: "Server selection timed out"

**Fix:**
1. ✅ Check MongoDB firewall (Step 1)
2. ✅ Verify `DATABASE_URL` is correct in App settings
3. ✅ Ensure database cluster is running
4. ✅ Check database connection string format

---

### Problem: CORS Errors

**Symptoms:**
- Frontend can't connect
- Browser console shows CORS errors

**Fix:**
1. Update `ALLOWED_ORIGINS` in App settings:
   ```
   ALLOWED_ORIGINS=https://your-frontend.com,https://your-app.ondigitalocean.app
   ```
2. Separate multiple origins with commas (no spaces)
3. Include protocol (https://)
4. No trailing slashes

---

### Problem: Health Check Fails

**Symptoms:**
- App constantly restarting
- Shows "Unhealthy" status

**Check:**
1. `/health` endpoint is accessible
2. Health check configuration in app.yaml:
   - `initial_delay_seconds: 30` (gives app time to start)
   - `timeout_seconds: 5`
   - `http_path: /health`

**Fix:**
- Increase `initial_delay_seconds` if app takes longer to start
- Check runtime logs for startup errors

---

## 📝 **Post-Deployment Checklist**

After deploying:

- [ ] Health check returns "connected" for database
- [ ] Registration creates real MongoDB documents
- [ ] Login works with created accounts
- [ ] CORS allows your frontend domain
- [ ] Environment variables are encrypted (secrets)
- [ ] MongoDB firewall allows App Platform
- [ ] SSL certificate is active (custom domain)
- [ ] Monitoring alerts are configured
- [ ] Automated backups are enabled for database

---

## 🔐 **Security Best Practices**

1. **Secrets Management:**
   - ✅ Mark sensitive vars as "Encrypt" in DigitalOcean
   - ✅ Never commit secrets to Git
   - ✅ Rotate JWT_SECRET every 90 days

2. **Database Security:**
   - ✅ Use specific trusted sources (not 0.0.0.0/0 if possible)
   - ✅ Enable automated backups
   - ✅ Use strong database passwords

3. **API Security:**
   - ✅ Use HTTPS only (enforced by DigitalOcean)
   - ✅ Enable rate limiting (already configured)
   - ✅ Keep dependencies updated: `npm audit`

---

## 🎯 **Next Steps**

1. **Deploy Now:**
   - Fix MongoDB firewall (Step 1)
   - Create app on DigitalOcean (Step 2)
   - Wait 5-10 minutes for first deployment

2. **Test Thoroughly:**
   - Run all API tests
   - Verify database connectivity
   - Test authentication flows

3. **Set Up Monitoring:**
   - Configure alerts
   - Monitor logs daily
   - Track error rates

4. **Add Custom Domain:**
   - Purchase domain (if needed)
   - Configure DNS
   - Update ALLOWED_ORIGINS

---

## ✅ **Quick Deploy Commands**

```bash
# 1. Commit your latest changes
git add .
git commit -m "Prepare for DigitalOcean deployment"
git push origin main

# 2. Go to DigitalOcean and follow Step 2 above

# 3. Test deployment
curl https://your-app.ondigitalocean.app/health

# 4. Monitor logs
# In DigitalOcean Dashboard → Your App → Runtime Logs
```

---

## 📞 **Getting Help**

**DigitalOcean Support:**
- Docs: https://docs.digitalocean.com/products/app-platform/
- Community: https://www.digitalocean.com/community/
- Support: https://cloud.digitalocean.com/support

**MongoDB Issues:**
- DigitalOcean DB docs: https://docs.digitalocean.com/products/databases/mongodb/

---

Your app is **production-ready** for DigitalOcean! The configuration is complete, just follow the steps above to deploy. 🚀
