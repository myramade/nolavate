# Quick Deployment Checklist

## ⚡ 5-Minute Production Deploy

### 1️⃣ Fix MongoDB Connection (CRITICAL - Do This First!)

**Your database connection is timing out because of DigitalOcean's firewall.**

**Steps:**
1. Go to https://cloud.digitalocean.com
2. Click **Databases** → `db-mongodb-nyc3-18337`
3. Click **Settings** → **Trusted Sources**
4. Click **"Add trusted source"**
5. Enter: `0.0.0.0/0` (allows all IPs - Replit uses dynamic IPs)
6. Click **Save**
7. Wait 2-3 minutes

**How to verify it worked:**
- Your server logs should show: `Successfully connected to MongoDB database`
- Instead of: `Continuing without database connection. API will use mock data.`

---

### 2️⃣ Configure Production Secrets

Click the **🔒 Secrets** icon in Replit sidebar and add/update:

```
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app-name.replit.app
JWT_EXPIRES_IN=15m
```

**Already configured (don't change):**
- ✅ DATABASE_URL
- ✅ JWT_SECRET

---

### 3️⃣ Deploy on Replit

1. Click **"Deploy"** button (top-right corner)
2. Choose **"Autoscale Deployment"**
3. Configure:
   - CPU: 0.5-1 vCPU
   - RAM: 512MB - 1GB
   - Max Machines: 2-5
4. Verify:
   - Run Command: `npm start`
   - Port: 5000
5. Click **"Publish"**
6. Wait 2-3 minutes for deployment

---

### 4️⃣ Test Your Live API

Once deployed, you'll get a URL like: `https://your-app-name.replit.app`

**Test it:**
```bash
# Health check
curl https://your-app-name.replit.app/health

# Registration test
curl -X POST https://your-app-name.replit.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"SecurePass123!","roleSubtype":"CANDIDATE"}'
```

**Success indicators:**
- ✅ Health shows `"status": "connected"` for database
- ✅ Registration returns MongoDB ObjectId (not "mock-...")
- ✅ No CORS errors

---

### 5️⃣ Add Custom Domain (Optional)

1. In Replit: **Deployments** → **Settings** → **"Link a domain"**
2. Follow DNS setup instructions
3. Update `ALLOWED_ORIGINS` secret with your domain
4. SSL certificate auto-generated (free)

---

## 🚨 Common Issues

**Problem:** Database still shows "disconnected"
- ✅ Check DigitalOcean firewall (Step 1)
- ✅ Verify DATABASE_URL secret is set
- ✅ Wait 2-3 minutes after firewall change

**Problem:** CORS errors in browser
- ✅ Add your production domain to ALLOWED_ORIGINS secret
- ✅ Format: `https://domain1.com,https://domain2.com`
- ✅ No trailing slashes

**Problem:** Deployment fails
- ✅ Check Deployment logs in Replit
- ✅ Verify all required secrets are set
- ✅ Ensure port 5000 is configured

---

## 💰 Estimated Costs

- **Replit Autoscale:** ~$7/month (0.5 vCPU, 512MB RAM)
- **DigitalOcean MongoDB:** ~$15-30/month (already set up)
- **Total:** ~$22-37/month

---

## 📊 What's Already Done

Your app is production-ready with:
- ✅ Strong security (password validation, JWT, rate limiting)
- ✅ Database retry logic (handles temporary failures)
- ✅ CORS configured (just needs production domain)
- ✅ Error handling (graceful degradation)
- ✅ Health checks (for monitoring)
- ✅ Standardized API responses

**Only blocker:** MongoDB firewall configuration (5 minutes to fix)

---

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed instructions.
