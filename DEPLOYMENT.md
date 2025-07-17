# Nexora Deployment Guide

## Overview
This guide will help you deploy the Nexora app to Vercel. We'll deploy the frontend and backend separately for optimal performance.

## Prerequisites
- Vercel account
- GitHub account
- MongoDB Atlas account (for production database)
- Environment variables configured

## Frontend Deployment (Vercel)

### Step 1: Update Environment Variables
Update `client/.env.production` with your production URLs:

```env
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
REACT_APP_SERVER_URL=https://your-backend-url.vercel.app
REACT_APP_SOCKET_URL=https://your-backend-url.vercel.app
```

### Step 2: Deploy Frontend
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure the build settings:
   - Framework Preset: Create React App
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/build`
   - Install Command: `npm install`

### Step 3: Set Environment Variables in Vercel
In your Vercel dashboard, add these environment variables:
- `REACT_APP_API_URL`
- `REACT_APP_SERVER_URL` 
- `REACT_APP_SOCKET_URL`

## Backend Deployment (Vercel Functions)

### Step 1: Create Separate Repository
Create a new repository for just the backend or use the server folder.

### Step 2: Environment Variables
Set up these environment variables in your backend deployment:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-atlas-connection-string
CLIENT_URL=https://your-frontend-url.vercel.app
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-secure-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d
```

### Step 3: Database Setup
1. Create a MongoDB Atlas cluster
2. Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for simplicity)
3. Update your MONGODB_URI in environment variables

## Alternative: Use Railway/Render for Backend
For better WebSocket support, consider deploying the backend to:
- Railway
- Render
- Heroku (if available)

These platforms provide better support for persistent connections needed for Socket.IO.

## Socket.IO Considerations
Note: Vercel Functions have limitations with WebSocket connections. For production, consider:
1. Using a dedicated backend hosting service
2. Implementing Socket.IO with sticky sessions
3. Using Vercel's Edge Functions (experimental)

## Production Checklist
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed (Vercel Functions or alternative)
- [ ] MongoDB Atlas configured
- [ ] Environment variables set
- [ ] CORS origins updated
- [ ] SSL certificates configured
- [ ] Domain names configured (optional)

## Common Issues
1. **CORS Errors**: Ensure CLIENT_URL matches your frontend domain
2. **Socket.IO Issues**: Consider alternative backend hosting
3. **Database Connection**: Verify MongoDB Atlas connection string
4. **Environment Variables**: Double-check all required variables are set

## Support
For issues, check:
- Vercel logs
- Browser console
- MongoDB Atlas logs
- Network tab in browser dev tools
