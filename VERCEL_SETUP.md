# Vercel Deployment Setup Guide

## Required Environment Variables

You **MUST** set the following environment variable in your Vercel project settings for the app to work correctly:

### DATABASE_URL
Your Neon PostgreSQL connection string.

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project (admin-squarage)
3. Go to "Settings" tab
4. Navigate to "Environment Variables" in the left sidebar
5. Add the following variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string (should look like: `postgresql://username:password@host/database?sslmode=require`)
   - **Environment**: Select all (Production, Preview, Development)
6. Click "Save"

## Getting Your Neon Database URL

1. Log in to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to "Connection Details" or "Dashboard"
4. Copy the connection string (make sure to use the pooled connection string for serverless)
5. The string should look like:
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

## Important Notes

- **Without DATABASE_URL set, the app will show "No tasks yet" even if you have data**
- Make sure to use the **pooled** connection string from Neon for serverless environments
- After adding the environment variable, you need to **redeploy** your app for changes to take effect

## Verify Your Setup

After setting the environment variable and redeploying:

1. Check the Vercel function logs for your deployment
2. Look for logs from `/api/todos/neon` endpoint
3. You should see:
   - `DATABASE_URL_EXISTS: true`
   - `Database is configured, fetching data...`
   - `Data fetched successfully: { todos: X, categories: Y, owners: Z }`

If you see `DATABASE_URL_EXISTS: false`, the environment variable is not set correctly.

## Troubleshooting

If data still doesn't load after setting DATABASE_URL:

1. **Check Vercel Function Logs**: 
   - Go to your Vercel dashboard
   - Click on "Functions" tab
   - Check logs for `/api/todos/neon`

2. **Verify Database Connection**:
   - Make sure your Neon database is active (not suspended)
   - Check that the connection string is correct
   - Ensure your database has the required tables (run migrations if needed)

3. **Test Locally with Production Database**:
   ```bash
   # Create .env.local with your DATABASE_URL
   echo "DATABASE_URL=your_connection_string_here" > .env.local
   npm run dev
   ```

4. **Force Redeploy**:
   - After setting environment variables, trigger a new deployment
   - You can do this by pushing a commit or clicking "Redeploy" in Vercel dashboard

## Database Schema

Make sure your Neon database has these tables:
- `todos`
- `categories`
- `owners`
- `subtasks`

If tables are missing, you'll need to run the database migrations or create them manually.