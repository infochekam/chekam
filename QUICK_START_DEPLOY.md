# 🚀 Chekam Deployment - Quick Start

## Files Created/Modified

✅ `Dockerfile` - Multi-stage build (frontend + backend)
✅ `.dockerignore` - Exclude unnecessary files
✅ `render.yaml` - Render deployment configuration
✅ `server/index.js` - Updated to serve static frontend
✅ `DEPLOYMENT.md` - Complete deployment guide

## 5-Minute Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Docker and Render config"
git push origin main
```

### 2. Go to render.com
- Sign up / Log in with GitHub
- Click "New +" → "Web Service"
- Select your `chekam` repo

### 3. Configure on Render
- **Name**: `chekam`
- **Runtime**: Docker (auto-detected)
- **Region**: Pick closest to you
- **Plan**: Free ✅

### 4. Add Environment Variables
Copy these into Render dashboard (Settings → Environment):

```
SUPABASE_URL=https://anyaaafpqpfkivmghhxm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=paste-your-key
GOOGLE_CLIENT_ID=paste-your-id
GOOGLE_CLIENT_SECRET=paste-your-secret
SESSION_SECRET=any-random-string-here
PAYSTACK_PUBLIC_KEY=pk_live_3edf5145dc961ec4b761a4b94c25490ed04dd4f6
PAYSTACK_SECRET_KEY=sk_live_07eb93b3094c978c5126ece9f39a1629053b64ce
FRONTEND_ORIGIN=https://chekam.onrender.com
AUTH_SERVER_ORIGIN=https://chekam.onrender.com
```

### 5. Deploy
Click "Create Web Service" → Wait 3-5 minutes → Done! 🎉

Your app will be live at: **https://chekam.onrender.com**

---

## What Happens When You Deploy

1. **Docker Build**
   - Builds React frontend → static files
   - Installs backend dependencies
   - Copies frontend to backend `/public` folder

2. **Deploy**
   - Starts Express server on port 3000
   - Serves React app at `/`
   - API endpoints at `/auth/*`
   - Auto-scales with traffic (free tier)

3. **Auto-Deploy** (every git push)
   - Detects changes in GitHub
   - Rebuilds Docker image
   - Deploys with zero downtime

---

## Deployment Architecture

```
User Browser
    ↓
Render Web Service (Docker)
├── Express Server (Node.js)
│   ├── Serves /dist (React app)
│   ├── Handles /auth/* endpoints
│   └── Handles /api/* endpoints
│
└── Connected to:
    ├── Supabase (Database + Auth)
    ├── Google OAuth
    └── Paystack API
```

---

## 💡 Troubleshooting

**Build fails?**
- Check Render Logs tab
- Verify Dockerfile syntax
- Ensure package.json has "build" script

**App shows 502?**
- Check "Logs" in Render dashboard
- Verify all environment variables are set
- Check PORT environment variable = 3000

**Frontend doesn't load?**
- Check that FRONTEND_ORIGIN matches your Render URL
- Verify CORS is configured (done in server/index.js)
- Check browser console for errors

**OAuth stops working?**
- Update Google OAuth redirect URI to: `https://chekam.onrender.com/auth/oauth/callback/google`
- Verify SESSION_SECRET is the same

---

## 📊 Comparison

| Feature | Before | After |
|---------|--------|-------|
| Cost | $0 | $0 ✅ |
| Frontend | Local only | Cloud hosted |
| Backend | Local only | Cloud hosted |
| Database | Cloud (Supabase) | Cloud (Supabase) |
| Auto-deploy | Manual | Yes ✅ |
| Always-on | - | 15 min auto-spin-down |
| Custom domain | - | Available with Pro |

---

## ⚡ Next Steps After Deploy

1. **Test the app**: Visit https://chekam.onrender.com
2. **Update OAuth**: Add new callback URL to Google Console
3. **Monitor**: Check Render dashboard for logs/metrics
4. **Custom domain**: (Optional, requires paid plan)

---

## 📚 Full Guide

For detailed instructions, see: `DEPLOYMENT.md`

Questions? Check the guide or inspect logs on Render dashboard! 🚀
