# Chekam Deployment Guide - Docker + Render

Complete guide to deploy Chekam to Render using Docker.

## 📋 Prerequisites

- GitHub account with the repository pushed
- Render account (free at render.com)
- All environment variables ready

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Add Docker and deployment config"
git push origin main
```

### Step 2: Create Render Account & Connect GitHub

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Grant Render access to your repository

### Step 3: Create Web Service on Render

1. Click "New +" → "Web Service"
2. Select your `chekam` repository
3. Configure:
   - **Name**: `chekam` (or your preference)
   - **Environment**: `Docker`
   - **Region**: Choose closest to you (e.g., `Ohio` for US)
   - **Plan**: `Free` ✅
   - **Branch**: `main`

### Step 4: Add Environment Variables

In Render dashboard, go to your service → Environment:

Add these variables:

```
SUPABASE_URL=https://anyaaafpqpfkivmghhxm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-random-secret-key
PAYSTACK_PUBLIC_KEY=pk_live_3edf5145dc961ec4b761a4b94c25490ed04dd4f6
PAYSTACK_SECRET_KEY=sk_live_07eb93b3094c978c5126ece9f39a1629053b64ce
FRONTEND_ORIGIN=https://chekam.onrender.com
AUTH_SERVER_ORIGIN=https://chekam.onrender.com
NODE_ENV=production
PORT=3000
```

### Step 5: Deploy

Click "Create Web Service" - Render will:
1. Clone your repo
2. Build the Docker image
3. Deploy the application
4. Give you a URL: `https://chekam.onrender.com`

**Wait 3-5 minutes for first build** (subsequent deploys are faster)

### Step 6: Verify Deployment

Test these URLs:

- `https://chekam.onrender.com` - Should show Chekam app
- `https://chekam.onrender.com/auth/me` - Should show auth server
- `https://chekam.onrender.com/dashboard` - Should show dashboard

## 🔄 How It Works

### Architecture

```
Render Web Service (Docker Container)
├── Frontend (React + Vite) - Served as static files
│   └── /dist folder
└── Backend (Node.js Express)
    ├── /auth endpoints
    └── Serves static frontend
        └── SPA routing fallback to index.html
```

### Build Process

1. **Stage 1** (Dockerfile): Build React frontend
   - Installs npm dependencies
   - Builds Vite bundle to `/dist`
   
2. **Stage 2** (Dockerfile): Run backend
   - Installs production dependencies
   - Copies built frontend to `/public`
   - Runs Express server on port 3000
   - Express serves both frontend and API

### Directory Structure After Build

```
Container /app/
├── node_modules/
├── index.js (Express server)
├── promote-admin.js
├── package.json
└── public/ (contains built frontend)
    ├── index.html
    ├── assets/
    ├── js/
    └── css/
```

## 🔧 Local Testing with Docker

### Build locally

```bash
# From project root
docker build -t chekam:latest .
```

### Run locally

```bash
docker run -p 3000:3000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e GOOGLE_CLIENT_ID=your-id \
  -e GOOGLE_CLIENT_SECRET=your-secret \
  -e SESSION_SECRET=your-secret \
  -e PAYSTACK_PUBLIC_KEY=your-pk \
  -e PAYSTACK_SECRET_KEY=your-sk \
  -e NODE_ENV=production \
  chekam:latest
```

Open `http://localhost:3000`

## 📊 Deployment Checklist

- [ ] All code committed to GitHub
- [ ] `render.yaml` exists in root
- [ ] `Dockerfile` exists in root
- [ ] `.dockerignore` exists in root
- [ ] `server/index.js` imports `path` and `fileURLToPath`
- [ ] Environment variables set in Render dashboard
- [ ] GitHub branch is `main` (or your chosen branch)
- [ ] Render health check passes

## 🐛 Troubleshooting

### Build fails
- Check `Render Logs` tab in dashboard
- Verify `Dockerfile` syntax
- Ensure all required files exist

### App shows 502 error
- Check application logs: `Logs` tab
- Verify all environment variables are set
- Check `PORT` is set to `3000`

### Static files not loading
- Check `server/index.js` has `express.static(path.join(__dirname, "../public"))`
- Verify frontend build succeeded in Dockerfile
- Check that CORS is configured properly

### OAuth not working
- Verify `FRONTEND_ORIGIN=https://chekam.onrender.com` in env vars
- Update Google OAuth callback URL to match
- Check `SESSION_SECRET` is the same value as development

## 🚀 Auto-Deployment

Once deployed:
- Every `git push` to `main` automatically triggers a new build
- Render rebuilds the Docker image
- Zero-downtime deployments

## 📝 Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `SUPABASE_URL` | ✅ | https://xxx.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | eyJ... |
| `GOOGLE_CLIENT_ID` | ✅ | xxx.apps.googleusercontent.com |
| `GOOGLE_CLIENT_SECRET` | ✅ | GOCSPX-xxx |
| `SESSION_SECRET` | ✅ | any-random-string |
| `PAYSTACK_PUBLIC_KEY` | ✅ | pk_live_xxx |
| `PAYSTACK_SECRET_KEY` | ✅ | sk_live_xxx |
| `FRONTEND_ORIGIN` | ✅ | https://chekam.onrender.com |
| `AUTH_SERVER_ORIGIN` | ✅ | https://chekam.onrender.com |
| `NODE_ENV` | Optional | production |
| `PORT` | Optional | 3000 |

## 💰 Cost

- **Render Free Tier**: $0/month
  - 1 web service
  - 0.5 CPU, 512MB RAM
  - 100GB/month bandwidth
  - Auto-spins down after 15 min inactivity

- **When to upgrade** ($7/month):
  - Need always-on service (no spinning down)
  - More traffic or CPU needed
  - Multiple services

## ✅ What's Included

- Full Chekam application (frontend + backend)
- Supabase database (PostgreSQL)
- Authentication (Google OAuth)
- Payments (Paystack)
- Email notifications (Supabase triggers)
- Document management
- Inspection workflow
- Admin dashboard

## 🎉 You're Live!

Your application is now deployed! Visit:
```
https://chekam.onrender.com
```

Start using Chekam in production! 🚀
