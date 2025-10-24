# DigitalOcean Quick Deployment - 10 Minutes

Your app is already configured for DigitalOcean. Follow these steps to deploy.

---

## ⚡ **3-Step Deploy**

### 1️⃣ Fix MongoDB Firewall (5 minutes)

Your database is timing out because it blocks external connections.

**Action:**
1. Go to https://cloud.digitalocean.com
2. **Databases** → `db-mongodb-nyc3-18337` → **Settings** → **Trusted Sources**
3. Click **"Add trusted source"**
4. Select **"App Platform"** (or enter `0.0.0.0/0`)
5. **Save**

✅ **This lets your deployed app connect to MongoDB**

---

### 2️⃣ Create App on DigitalOcean (3 minutes)

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. **Source:** GitHub → `myramade/nolavate` → branch: `main`
4. ✅ Enable **"Autodeploy"**
5. Click **"Import from .do/app.yaml"** (auto-detects configuration)
6. **Add Environment Variables** (click "Edit"):
   ```
   DATABASE_URL=[your MongoDB URL - copy from Replit secrets]
   JWT_SECRET=[your JWT secret - copy from Replit secrets]
   ALLOWED_ORIGINS=${APP_URL}
   ```
   Mark as **"Encrypt"** (secret) ✓
7. **Resources:** Basic ($5/month) - 512MB RAM, 1 vCPU
8. Click **"Create Resources"**

---

### 3️⃣ Test Your Live API (2 minutes)

You'll get a URL like: `https://culture-forward-api-xxxxx.ondigitalocean.app`

**Test:**
```bash
# Health check
curl https://your-app.ondigitalocean.app/health

# Should show: database "connected" (not "disconnected")

# Test registration
curl -X POST https://your-app.ondigitalocean.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"SecurePass123!","roleSubtype":"CANDIDATE"}'

# Should return MongoDB ObjectId (not "mock-...")
```

**✅ Done! Your API is live.**

---

## 🔄 **Auto-Deploy Setup**

Once deployed, every time you push to GitHub:

```bash
git add .
git commit -m "New feature"
git push origin main
```

DigitalOcean automatically:
- Builds the app (3-5 minutes)
- Runs health checks
- Deploys with zero downtime

Monitor at: **DigitalOcean Dashboard → Your App → Runtime Logs**

---

## 💰 **Costs**

- **Basic Instance:** $5/month (512MB RAM)
- **MongoDB Database:** ~$15-30/month (already running)
- **Total:** ~$20-35/month

Can upgrade to Professional ($12/month) for more resources.

---

## 📋 **What's Configured**

Your `.do/app.yaml` has everything set up:
- ✅ GitHub repo connected
- ✅ Auto-deploy on push to main
- ✅ Health checks every 10 seconds
- ✅ MongoDB database linked
- ✅ Environment variables configured
- ✅ Port 5000 exposed

---

## 🚨 **Common Issues**

**Database shows "disconnected":**
→ Fix MongoDB firewall (Step 1)

**CORS errors:**
→ Update `ALLOWED_ORIGINS` with your frontend domain

**Build fails:**
→ Check Runtime Logs in DigitalOcean Dashboard

---

## 📞 **Need Help?**

- Full guide: See `DIGITALOCEAN_DEPLOYMENT.md`
- DigitalOcean docs: https://docs.digitalocean.com/products/app-platform/
- Support: https://cloud.digitalocean.com/support

---

**Your app is ready to deploy!** Just follow the 3 steps above. 🚀
