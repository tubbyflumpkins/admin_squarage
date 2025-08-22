# Vercel Environment Variables Setup

## Required Environment Variables

You need to add these environment variables in your Vercel project settings:

### 1. DATABASE_URL
Your Neon PostgreSQL connection string. Get this from your Neon dashboard.

**Example:**
```
postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 2. NEXTAUTH_SECRET
A random string used to encrypt tokens. This MUST be set in production.

**Generate a secret:**
```bash
openssl rand -base64 32
```

**Example:**
```
k3PrVzYXN9NfH4K5y6U8W0e2R4t6Y8u0P2s4D6f8G0h2J4k6
```

### 3. NEXTAUTH_URL
Your production URL. This is CRITICAL for authentication to work on Vercel.

**For your staging deployment:**
```
https://admin-squarage-staging.vercel.app
```

**For your main deployment:**
```
https://admin-squarage.vercel.app
```

(Replace with your actual Vercel URLs)

## How to Add Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project (admin_squarage)
3. Click on "Settings" tab
4. Click on "Environment Variables" in the left sidebar
5. Add each variable:
   - **Key**: The variable name (e.g., `DATABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select which environments (Production, Preview, Development)
   
   Recommended settings:
   - DATABASE_URL: All environments
   - NEXTAUTH_SECRET: All environments (use same secret)
   - NEXTAUTH_URL: 
     - Production: Your main URL
     - Preview: Leave empty (NextAuth will auto-detect)
     - Development: Leave empty

6. Click "Save" for each variable

## Example Configuration

```
DATABASE_URL=postgresql://dylan:password@ep-example.us-east-2.aws.neon.tech/squarage_db?sslmode=require
NEXTAUTH_SECRET=k3PrVzYXN9NfH4K5y6U8W0e2R4t6Y8u0P2s4D6f8G0h2J4k6
NEXTAUTH_URL=https://admin-squarage.vercel.app
```

## Important Notes

⚠️ **NEXTAUTH_URL must match your deployment URL exactly** - including https:// and no trailing slash

⚠️ **NEXTAUTH_SECRET must be the same across all deployments** if you want sessions to work across preview deployments

⚠️ **After adding variables, you need to redeploy** - Go to Deployments tab and click "Redeploy" on the latest deployment

## Troubleshooting

If login still doesn't work after setting these:

1. **Check browser console** for errors
2. **Verify NEXTAUTH_URL** matches exactly (no trailing slash!)
3. **Try clearing cookies** for the domain
4. **Check Vercel Function logs** for any errors

## Quick Setup Commands

1. Generate a secret:
```bash
openssl rand -base64 32
```

2. Copy your Neon connection string from Neon dashboard

3. Add all three variables to Vercel

4. Redeploy your application