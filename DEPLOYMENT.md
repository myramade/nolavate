# Digital Ocean Deployment Guide

## Prerequisites
- Digital Ocean account
- GitHub repository connected
- MongoDB database (already configured: db-mongodb-nyc3-18337)

## Quick Deployment Steps

### 1. Push Code to GitHub
Make sure all your latest changes are pushed to your GitHub repository at `https://github.com/myramade/nolavate`

### 2. Create App on Digital Ocean
1. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Select **"GitHub"** as your source
4. Choose repository: `myramade/nolavate`
5. Select branch: `main`

### 3. App Platform Auto-Detection
App Platform will automatically detect:
- ✅ Node.js application (via package.json)
- ✅ Build command: `npm run build`
- ✅ Run command: `npm start`
- ✅ Node.js version: 20.x (from engines field)

### 4. Configure Environment Variables
In the App Platform dashboard, add these environment variables:

**Required:**
- `DATABASE_URL` - Your MongoDB connection string
  ```
  mongodb+srv://doadmin:YOUR_PASSWORD@db-mongodb-nyc3-18337-f6320c71.mongo.ondigitalocean.com/admin?authSource=admin&tls=true
  ```
- `NODE_ENV` - Set to `production`
- `PORT` - Digital Ocean will set this automatically (usually 8080)

**Optional:**
- `JWT_SECRET` - Your JWT secret key (if using authentication)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)

### 5. Configure Health Checks
The app includes a health check endpoint at `/health`
- Digital Ocean will automatically use this to monitor your app
- Configuration is already set in `.do/app.yaml`

### 6. Deploy
1. Review your app configuration
2. Click **"Next"** and review the plan
3. Click **"Create Resources"**
4. Wait for deployment (usually 3-5 minutes)

## Post-Deployment

### Verify Deployment
1. Check the deployment logs in Digital Ocean dashboard
2. Visit your app URL (provided by Digital Ocean)
3. Test the health endpoint: `https://your-app.ondigitalocean.app/health`
4. Expected response:
   ```json
   {
     "status": "OK",
     "timestamp": "2025-10-20T02:31:30.803Z"
   }
   ```

### Auto-Deployments
- Every push to `main` branch will trigger automatic deployment
- You can disable this in app settings if needed

## Troubleshooting

### "No components detected" Error
✅ **FIXED** - Added these files:
- ✅ `package.json` with engines field
- ✅ `.dockerignore`
- ✅ `Procfile`
- ✅ `.do/app.yaml` (App Platform spec)

### Database Connection Issues
1. Verify `DATABASE_URL` in environment variables
2. Check MongoDB database is running
3. Ensure IP whitelist includes Digital Ocean's IPs (or set to allow all)

### Build Failures
1. Check build logs in Digital Ocean dashboard
2. Verify all dependencies are in `package.json`
3. Ensure Prisma generates client correctly (`npm run build`)

### Runtime Errors
1. Check runtime logs in Digital Ocean dashboard
2. Verify environment variables are set correctly
3. Check health endpoint response

## Files Created for Deployment

| File | Purpose |
|------|---------|
| `package.json` | Updated with Node.js version in engines |
| `.dockerignore` | Excludes unnecessary files from deployment |
| `Procfile` | Specifies how to start the app |
| `.do/app.yaml` | Digital Ocean App Platform configuration |
| `.env.example` | Template for environment variables |
| `DEPLOYMENT.md` | This deployment guide |

## Scaling

### Vertical Scaling (Increase Resources)
- Go to app settings → Components → web
- Change instance size (basic-xxs → basic-xs → basic-s, etc.)

### Horizontal Scaling (More Instances)
- Go to app settings → Components → web
- Increase instance count (1 → 2 → 3, etc.)

## Cost Estimates
- **Basic (1 instance)**: ~$5-12/month
- **Professional**: ~$12-50/month
- **MongoDB Database**: Separate cost based on plan

## Support
- [Digital Ocean Docs](https://docs.digitalocean.com/products/app-platform/)
- [Community Support](https://www.digitalocean.com/community)

## Environment Variables Reference

```bash
# Required
DATABASE_URL=mongodb+srv://user:pass@host/db?authSource=admin&tls=true
NODE_ENV=production
PORT=8080  # Auto-set by Digital Ocean

# Optional
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
API_URL=https://your-app.ondigitalocean.app
```
