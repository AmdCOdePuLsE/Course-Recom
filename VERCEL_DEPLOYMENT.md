# SKILL-SYNC - Vercel Deployment Guide

## Quick Deploy to Vercel

1. **Connect your GitHub repo to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Import Project"
   - Connect your GitHub account and select the `Course-Recom` repository

2. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Root Directory: **frontend**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables** (in Vercel Dashboard)
   ```
   VITE_BACKEND_URL=https://your-backend-url.com
   VITE_SUPABASE_URL=https://yipcstmjkrkewmhttrml.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcGNzdG1qa3JrZXdtaHR0cm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDg1NzUsImV4cCI6MjA3MDgyNDU3NX0.iPIDRdd0sT8QcIiLlO3eXsbIvfEyTdyW3-zoBLWt5Jo
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

## Files Added/Modified for Deployment

- `frontend/vercel.json` - Routing configuration for React Router
- `frontend/vite.config.js` - Build configuration

## Important Notes

- The `vercel.json` handles client-side routing by redirecting all requests to `/index.html`
- Make sure to set the **Root Directory** to `frontend` in Vercel settings
- Environment variables must be prefixed with `VITE_` to be accessible in the frontend

## Troubleshooting

If you still get 404 errors:
1. Check that Root Directory is set to `frontend` in Vercel project settings
2. Verify that environment variables are set in Vercel dashboard
3. Ensure the build completes successfully (check build logs)

The app should now deploy successfully to Vercel! 🚀
