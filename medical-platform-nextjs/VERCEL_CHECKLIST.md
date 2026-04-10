# ✅ Vercel Deployment Checklist

## Before Deployment

- [ ] All code is committed and pushed to GitHub
- [ ] `.env` file is in `.gitignore`
- [ ] Build succeeds locally (`npm run build`)
- [ ] MongoDB Atlas is configured and accessible
- [ ] OpenAI API key is valid and has credits

## Vercel Setup

- [ ] Created Vercel account
- [ ] Connected GitHub repository
- [ ] Selected correct root directory (`medical-platform-nextjs`)
- [ ] Framework preset is set to Next.js

## Environment Variables (Add in Vercel Dashboard)

### Required (Must Add):
- [ ] `DATABASE_URL` - MongoDB connection string
- [ ] `NEXTAUTH_SECRET` - Random secret for auth
- [ ] `OPENAI_API_KEY` - OpenAI API key

### Auto-Generated (Vercel handles):
- [ ] `NEXTAUTH_URL` - Your Vercel URL
- [ ] `NEXT_PUBLIC_APP_URL` - Your Vercel URL

### Optional (Add if using):
- [ ] `GOOGLE_CLIENT_ID` - For Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - For Google OAuth
- [ ] `AWS_ACCESS_KEY_ID` - For S3 storage
- [ ] `AWS_SECRET_ACCESS_KEY` - For S3 storage

## MongoDB Atlas Configuration

- [ ] IP Access List allows Vercel (0.0.0.0/0 or specific IPs)
- [ ] Database user has read/write permissions
- [ ] Connection string is correct in `DATABASE_URL`

## Post-Deployment

- [ ] Deployment succeeded (check Vercel dashboard)
- [ ] Update `NEXTAUTH_URL` with actual Vercel URL
- [ ] Redeploy after updating `NEXTAUTH_URL`
- [ ] Test registration/login
- [ ] Test image upload and analysis
- [ ] Test all dashboard features
- [ ] Check for any console errors

## Optional Enhancements

- [ ] Add custom domain
- [ ] Enable Vercel Analytics
- [ ] Set up monitoring alerts
- [ ] Configure preview deployments
- [ ] Add team members

## Quick Deploy Commands

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Ready for Vercel deployment"
git push origin main

# 2. Go to vercel.com/new and import your repo

# 3. Add environment variables in Vercel dashboard

# 4. Deploy!
```

## Troubleshooting

If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check MongoDB Atlas connection
5. Verify OpenAI API key is valid

## Success Indicators

✅ Build completes without errors  
✅ Can access the deployed URL  
✅ Login/registration works  
✅ Image analysis works  
✅ All dashboard tabs load  
✅ No console errors  

---

**Ready to deploy?** Follow the detailed guide in `DEPLOYMENT.md`
