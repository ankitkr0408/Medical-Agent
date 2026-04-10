# HealthIQ - Vercel Deployment Guide

This guide will help you deploy HealthIQ to Vercel.

## Prerequisites

1. **GitHub Account** - Your code should be pushed to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas** - Already configured (connection string in .env)
4. **OpenAI API Key** - Already have one

## Step 1: Prepare Your Repository

### 1.1 Update .gitignore
Make sure your `.gitignore` includes:
```
.env
.env.local
.env.production.local
.vercel
```

### 1.2 Commit All Changes
```bash
cd medical-platform-nextjs
git add .
git commit -m "feat: Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

### 2.1 Import Project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Choose the `medical-platform-nextjs` folder as the root directory

### 2.2 Configure Project
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `medical-platform-nextjs`
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### 2.3 Add Environment Variables

Click "Environment Variables" and add the following:

#### Required Variables:

```env
DATABASE_URL=your-mongodb-connection-string

NEXTAUTH_SECRET=your-nextauth-secret-key

OPENAI_API_KEY=your-openai-api-key
```

**Note:** Get your actual values from your local `.env` file. DO NOT commit actual API keys to GitHub!

#### Auto-Generated Variables:
These will be set automatically by Vercel:
- `NEXTAUTH_URL` - Will be your Vercel URL
- `NEXT_PUBLIC_APP_URL` - Will be your Vercel URL

#### Optional Variables (if you use them):
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=medical-platform-images
```

### 2.4 Deploy
Click "Deploy" and wait for the build to complete (2-5 minutes)

## Step 3: Post-Deployment Configuration

### 3.1 Update NEXTAUTH_URL
After deployment, you'll get a URL like `https://healthiq-xyz.vercel.app`

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add/Update:
   ```
   NEXTAUTH_URL=https://your-actual-vercel-url.vercel.app
   ```
3. Redeploy the project

### 3.2 Configure Custom Domain (Optional)
1. Go to Settings > Domains
2. Add your custom domain (e.g., `healthiq.com`)
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` to your custom domain

## Step 4: Verify Deployment

### 4.1 Test Authentication
1. Visit your deployed URL
2. Try to register a new account
3. Try to login
4. Check if dashboard loads

### 4.2 Test Image Analysis
1. Upload a medical image
2. Verify AI analysis works
3. Check if reports are generated

### 4.3 Test Features
- ✅ Multi-Doctor Collaboration
- ✅ Q&A System
- ✅ Report Generation
- ✅ PDF Export

## Troubleshooting

### Build Fails
**Error:** "Module not found"
- **Solution:** Make sure all dependencies are in `package.json`
- Run `npm install` locally and commit `package-lock.json`

### Database Connection Fails
**Error:** "MongoServerError: Authentication failed"
- **Solution:** Check `DATABASE_URL` in Vercel environment variables
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

### NextAuth Errors
**Error:** "Invalid callback URL"
- **Solution:** Update `NEXTAUTH_URL` to match your Vercel URL
- Redeploy after updating

### OpenAI API Errors
**Error:** "Invalid API key"
- **Solution:** Verify `OPENAI_API_KEY` in Vercel environment variables
- Check if API key is still valid in OpenAI dashboard

## MongoDB Atlas Configuration

### Allow Vercel IP Addresses
1. Go to MongoDB Atlas Dashboard
2. Network Access > IP Access List
3. Click "Add IP Address"
4. Select "Allow Access from Anywhere" (0.0.0.0/0)
5. Or add Vercel's IP ranges (recommended for production)

## Performance Optimization

### Enable Vercel Analytics
1. Go to your project in Vercel
2. Click "Analytics" tab
3. Enable Web Analytics
4. Monitor performance metrics

### Enable Vercel Speed Insights
1. Install package: `npm install @vercel/speed-insights`
2. Add to your app (already configured if using latest Next.js)

## Security Checklist

- ✅ Environment variables are set in Vercel (not in code)
- ✅ `.env` file is in `.gitignore`
- ✅ MongoDB Atlas has IP whitelist configured
- ✅ NEXTAUTH_SECRET is a strong random string
- ✅ OpenAI API key has usage limits set

## Continuous Deployment

Every push to your `main` branch will automatically:
1. Trigger a new build on Vercel
2. Run tests (if configured)
3. Deploy to production if successful

### Preview Deployments
- Every pull request gets a unique preview URL
- Test changes before merging to main

## Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function execution times
- Check error rates

### MongoDB Atlas
- Monitor database connections
- Check query performance
- Set up alerts for high usage

## Cost Considerations

### Vercel Free Tier Includes:
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function execution

### Upgrade to Pro if you need:
- More bandwidth
- Longer function execution times (60s vs 10s)
- Team collaboration features

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Review MongoDB Atlas logs
4. Check OpenAI API usage dashboard

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all features
3. ✅ Configure custom domain
4. ✅ Set up monitoring
5. ✅ Enable analytics
6. ✅ Share with users!

---

**Deployed by:** HealthIQ Team  
**Last Updated:** 2024  
**Version:** 1.0.0
