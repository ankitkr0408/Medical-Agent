# 🚀 HealthIQ - Quick Vercel Deployment

## 📋 What You Need (5 minutes)

1. **GitHub** - Code pushed to repository ✅
2. **Vercel Account** - Free at [vercel.com](https://vercel.com)
3. **3 Environment Variables** - From your `.env` file

## 🎯 Deploy in 3 Steps

### Step 1: Push to GitHub (if not done)
```bash
cd medical-platform-nextjs
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your repository
4. **Important:** Set Root Directory to `medical-platform-nextjs`
5. Click "Deploy" (don't add env vars yet - it will fail, that's okay!)

### Step 3: Add Environment Variables
After first deployment fails, go to:
**Settings > Environment Variables** and add these 3:

```env
DATABASE_URL=your-mongodb-connection-string-from-local-env

NEXTAUTH_SECRET=your-nextauth-secret-from-local-env

OPENAI_API_KEY=your-openai-api-key-from-local-env
```

**Important:** Copy these values from your local `.env` file. Never commit actual API keys to GitHub!

Then click "Redeploy" in the Deployments tab.

## ✅ That's It!

Your app will be live at: `https://your-project-name.vercel.app`

## 🔧 Post-Deployment (Optional)

### Update NEXTAUTH_URL
1. Copy your Vercel URL (e.g., `https://healthiq-abc123.vercel.app`)
2. Go to Settings > Environment Variables
3. Add:
   ```
   NEXTAUTH_URL=https://your-actual-url.vercel.app
   ```
4. Redeploy

### Add Custom Domain
1. Settings > Domains
2. Add your domain (e.g., `healthiq.com`)
3. Follow DNS instructions
4. Update `NEXTAUTH_URL` to your custom domain

## 🐛 Troubleshooting

### Build Fails?
- Check you set Root Directory to `medical-platform-nextjs`
- Verify all 3 environment variables are added
- Check build logs in Vercel dashboard

### Can't Login?
- Make sure `NEXTAUTH_URL` matches your actual Vercel URL
- Redeploy after adding `NEXTAUTH_URL`

### Database Errors?
- Go to MongoDB Atlas
- Network Access > Add IP Address
- Select "Allow Access from Anywhere" (0.0.0.0/0)

## 📚 Need More Help?

See detailed guides:
- `DEPLOYMENT.md` - Complete deployment guide
- `VERCEL_CHECKLIST.md` - Step-by-step checklist

## 🎉 Success!

Once deployed, test:
- ✅ Register new account
- ✅ Login
- ✅ Upload medical image
- ✅ View AI analysis
- ✅ Generate PDF report

---

**Deployment Time:** ~5 minutes  
**Cost:** Free (Vercel Hobby plan)  
**Support:** Check deployment logs in Vercel dashboard
