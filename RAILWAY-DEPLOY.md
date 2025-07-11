# 🚂 Deploy B-Plus POS to Railway

Railway is the recommended hosting platform for B-Plus POS because it:
- ✅ Provides a generous free tier (500 execution hours/month)
- ✅ Automatically provisions PostgreSQL database
- ✅ Handles HTTPS and custom domains
- ✅ Has zero-config deployments

## Quick Deploy (1-Click)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/kV0c8L?referralCode=bonus)

## Manual Deploy Steps

### 1. Prerequisites
- GitHub account
- Railway account (free at [railway.app](https://railway.app))
- This repository forked or cloned to your GitHub

### 2. Create Railway Project

1. **Sign up/Login** to [Railway](https://railway.app)
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your B-Plus POS repository**

### 3. Add PostgreSQL Database

1. **In your project dashboard, click "New Service"**
2. **Select "Database" → "PostgreSQL"**
3. **Choose the starter plan (free)**
4. **Railway automatically sets up DATABASE_URL**

### 4. Configure Environment Variables

In your web service settings, add:

```bash
# Required
NODE_ENV=production
SESSION_SECRET=your-32-plus-character-random-secret-key

# Optional (for WooCommerce integration)
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx

# Optional (for email receipts)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

**⚠️ Important:** Generate a secure SESSION_SECRET:
- Use at least 32 random characters
- You can generate one at: https://generate-secret.vercel.app/32
- Or use: `openssl rand -base64 32`

### 5. Deploy

Railway will automatically:
1. ✅ Detect it's a Node.js project
2. ✅ Run `npm install`
3. ✅ Run `npm run build`
4. ✅ Start with `npm start`
5. ✅ Provide a public URL

## Post-Deployment Setup

### 1. Access Your Application
- Railway will provide a URL like: `https://your-app.railway.app`
- Wait 2-3 minutes for the database to initialize

### 2. First Login
- **Username:** `admin`
- **Password:** `admin123`
- **⚠️ IMMEDIATELY CHANGE THE PASSWORD** after first login

### 3. Create Additional Users
- Go to Admin → Manage Cashiers
- Add cashier accounts for your staff
- Set appropriate permissions

### 4. Configure Your Store
- Add your products
- Set up categories
- Configure tax rates
- Add your company information

## Railway-Specific Features

### Automatic HTTPS
- Railway provides free SSL certificates
- Your app is automatically served over HTTPS

### Custom Domains
- Add your own domain in Railway dashboard
- DNS configuration is automatic

### Environment Management
- Easily manage environment variables
- Separate staging/production environments
- One-click rollbacks

### Monitoring
- Built-in metrics and logging
- Health check monitoring at `/api/health`
- Automatic restart on crashes

## Troubleshooting

### Common Issues

1. **"Cannot connect to database"**
   - Wait 2-3 minutes for PostgreSQL to fully initialize
   - Check that PostgreSQL service is running
   - Verify DATABASE_URL is automatically set

2. **"Application Error" on startup**
   - Check Railway logs in the dashboard
   - Ensure SESSION_SECRET is set
   - Verify build completed successfully

3. **Can't login with admin/admin123**
   - Wait for database initialization (2-3 minutes)
   - Check that DATABASE_URL is connected
   - Look for errors in Railway logs

### Check Application Health
- Visit: `https://your-app.railway.app/api/health`
- Should return: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

### View Logs
1. Go to Railway dashboard
2. Click on your web service
3. Go to "Logs" tab
4. Check for any error messages

## Cost Optimization

### Free Tier Limits
- **500 execution hours/month** (about 23 days)
- **1GB memory per service**
- **100GB network egress**

### Tips to Stay Within Free Tier
- App automatically sleeps when inactive (saves hours)
- Use efficient database queries
- Optimize image sizes
- Monitor usage in Railway dashboard

### Upgrading
- If you exceed free tier, Railway has affordable paid plans
- Usage-based pricing starts at $5/month
- No surprise bills - pay only for what you use

## Production Best Practices

### Security Checklist
- [x] HTTPS enabled (automatic)
- [x] Strong SESSION_SECRET set
- [x] Default admin password changed
- [x] Regular backups configured
- [x] User access reviewed

### Performance
- Railway automatically handles:
  - Load balancing
  - Auto-scaling
  - Health checks
  - Zero-downtime deployments

### Backups
- PostgreSQL backups are automatic on Railway
- You can also export data manually from the database dashboard

## Support

### Railway Support
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app)

### B-Plus POS Support
- Check application logs in Railway dashboard
- Verify environment variables are set correctly
- Test with health endpoint: `/api/health`

---

## 🎉 Success!

Once deployed, you'll have a fully functional POS system running on Railway with:

- ✅ Secure HTTPS URL
- ✅ PostgreSQL database
- ✅ Automatic scaling
- ✅ Zero-config deployments
- ✅ Built-in monitoring

**Start selling immediately!** 🛍️

---

**Need help?** Check the Railway logs first, then verify your environment variables are set correctly.
