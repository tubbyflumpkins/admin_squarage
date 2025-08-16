# Neon Database Setup Instructions

## Prerequisites
All database dependencies have been installed and configured. You just need to set up your Neon account and add the connection string.

## Step 1: Create a Neon Account

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account (GitHub, Google, or email)
3. You'll get a free tier with:
   - 0.5 GB storage
   - Always-on compute
   - 1 branch

## Step 2: Create Your Database

1. After signing in, click **"Create a project"**
2. Choose your settings:
   - **Project name**: `squarage-admin` (or any name you prefer)
   - **Database name**: Keep default `neondb` or change to `squarage`
   - **Region**: Choose the closest to your location (e.g., `US East` if you're on the east coast)
3. Click **"Create project"**

## Step 3: Get Your Connection String

1. After project creation, you'll see a connection dialog
2. Select **"Node.js"** as your connection method
3. Copy the connection string that looks like:
   ```
   postgresql://username:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

## Step 4: Configure Local Environment

1. Create a `.env.local` file in the project root:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and paste your connection string:
   ```
   DATABASE_URL=postgresql://username:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

## Step 5: Push Database Schema

Run the following command to create tables in your Neon database:

```bash
npm run db:push
```

This will create:
- `categories` table
- `owners` table
- `todos` table
- `subtasks` table

## Step 6: Migrate Existing Data (Optional)

If you have existing data in `data/todos.json`, migrate it to Neon:

```bash
npm run db:migrate-data
```

## Step 7: Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Your app will now:
   - Try to use Neon database first
   - Fall back to JSON file if database is not configured
   - All your existing functionality will work seamlessly

## Step 8: Vercel Deployment Setup

### Option A: Using Vercel Integration (Recommended)

1. In your Neon dashboard, go to **Integrations**
2. Click **"Add Integration"** and select **Vercel**
3. Authorize and select your Vercel project
4. This automatically syncs environment variables

### Option B: Manual Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Neon connection string
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

## Step 9: Deploy to Vercel

```bash
git add .
git commit -m "Add Neon database integration"
git push
```

Vercel will automatically:
- Detect the push
- Use the DATABASE_URL environment variable
- Deploy your application with database support

## Database Management

### View and Edit Data
```bash
npm run db:studio
```
This opens Drizzle Studio, a GUI for managing your database.

### Generate Migrations
After changing schema in `lib/db/schema.ts`:
```bash
npm run db:generate
npm run db:push
```

## Troubleshooting

### Database not connecting?
1. Check `.env.local` has the correct `DATABASE_URL`
2. Ensure your IP is not blocked (Neon allows all IPs by default)
3. Check the Neon dashboard to ensure your database is active

### Data not showing?
1. Run `npm run db:migrate-data` to migrate existing data
2. Check browser console for any API errors
3. The app automatically falls back to JSON if database fails

## Features

Your app now supports:
- ✅ Serverless PostgreSQL database
- ✅ Automatic scaling
- ✅ Database branching for preview deployments
- ✅ Point-in-time recovery
- ✅ Connection pooling
- ✅ Fallback to JSON file if database unavailable
- ✅ All existing todo features work seamlessly

## Next Steps

1. Set up database branching for preview deployments
2. Configure automated backups
3. Set up monitoring in Neon dashboard
4. Consider upgrading to Pro plan for more storage/features as needed