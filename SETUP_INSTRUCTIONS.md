# Setup Instructions for Squarage Admin Dashboard

## For Claude (or any developer) setting this up on a new computer:

### Prerequisites
- Node.js 18.18+ installed
- npm installed
- Git installed

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/tubbyflumpkins/admin_squarage.git
   cd admin_squarage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy the `.env.local` file from this zip to the project root
   - This file contains:
     - `DATABASE_URL` - Connection string to Neon database
     - `NEXTAUTH_SECRET` - Authentication secret
     - `NEXTAUTH_URL` - Base URL for authentication
     - Other necessary API keys

4. **IMPORTANT: Database Setup**
   The database is hosted on Neon (PostgreSQL). The `.env.local` file contains the connection string.

   - The database already exists and has data
   - Tables are already created
   - No migration needed unless schema changes

   If you need to create new tables or modify schema:
   ```bash
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000

6. **Default Login Credentials**
   - Check the `.env.local` file or ask Dylan for login credentials
   - The system uses NextAuth with credentials provider

### Troubleshooting

**Database not connecting:**
- Verify the `DATABASE_URL` in `.env.local` is correct
- Ensure your IP is whitelisted in Neon dashboard (if IP restrictions are enabled)
- Check if Neon service is active (free tier may suspend after inactivity)

**Authentication not working:**
- Ensure `NEXTAUTH_SECRET` is set correctly
- For localhost, `NEXTAUTH_URL` should be `http://localhost:3000`

**Missing dependencies:**
- Run `npm install` again
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Project Structure Overview
- `/app` - Next.js 15 app router pages and API routes
- `/components` - React components
- `/lib` - Utilities, database connection, stores
- `/lib/db/schema.ts` - Database schema definition
- `/public` - Static assets
- `/scripts` - Database scripts and utilities

### Key Features
- Todo management system
- Sales tracking system
- Calendar integration
- Notification system
- User authentication

### Database Info
- **Provider**: Neon (Serverless PostgreSQL)
- **ORM**: Drizzle
- **Main Tables**: users, todos, sales, notifications, categories, owners, etc.

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (database GUI)
```

### Notes for Development
- The app uses Zustand for state management
- Tailwind CSS for styling
- TypeScript for type safety
- The database automatically scales with Neon's serverless architecture

### Support
If you encounter issues, the codebase is well-documented with:
- `CLAUDE.md` - Project documentation for AI assistance
- `AUTHENTICATION.md` - Auth system documentation
- Comments throughout the code

Good luck with the setup!