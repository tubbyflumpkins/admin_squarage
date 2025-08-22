# Authentication System Documentation

## Overview
The Squarage Admin Dashboard uses **NextAuth.js (v4)** for authentication with a credentials provider, PostgreSQL database for user storage, and bcrypt for password hashing. The system includes role-based access, password change functionality, and proper session management.

## Tech Stack
- **NextAuth.js v4**: Authentication library for Next.js
- **bcryptjs**: Password hashing
- **Neon PostgreSQL**: User data storage
- **Drizzle ORM**: Database queries
- **JWT**: Session token management

## Database Schema

### Users Table
```sql
users (
  id: varchar(255) PRIMARY KEY,
  name: varchar(255) NOT NULL,
  email: varchar(255) NOT NULL UNIQUE,
  password: varchar(255) NOT NULL,  -- bcrypt hashed
  role: varchar(50) NOT NULL DEFAULT 'user',
  created_at: timestamp DEFAULT NOW()
)
```

### Todo Ownership
```sql
todos (
  ...
  user_id: varchar(255) REFERENCES users(id) ON DELETE CASCADE,
  owner: varchar(255) NOT NULL,  -- Display name (Dylan, Thomas, All)
  ...
)
```

## File Structure
```
/app/api/auth/
├── [...nextauth]/
│   └── route.ts              # NextAuth API route
└── change-password/
    └── route.ts              # Password change endpoint

/lib/
├── auth.ts                   # NextAuth configuration
└── db/schema.ts             # Database schema with users table

/app/
├── login/page.tsx           # Login page
└── settings/page.tsx        # User settings & password change

/middleware.ts               # Route protection
/components/
└── Providers.tsx            # SessionProvider wrapper
```

## Implementation Details

### 1. NextAuth Configuration (`/lib/auth.ts`)
```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // 1. Validate input
        // 2. Find user by email
        // 3. Compare password with bcrypt
        // 4. Return user object for session
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: // Add user ID and role to token
    session: // Add user ID and role to session
  },
  pages: {
    signIn: '/login',
  }
}
```

### 2. Middleware Protection (`/middleware.ts`)
```typescript
// Protects all routes except:
// - /login
// - /api/* (API routes handle their own auth)
// - /_next/* (Next.js internals)
// - /images, /manifest.json (public assets)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json|login).*)']
}
```

### 3. Session Management

#### Client-Side (`/components/Providers.tsx`)
```typescript
<SessionProvider
  refetchInterval={0}
  refetchOnWindowFocus={true}
  refetchWhenOffline={false}
>
```

#### Page Protection Pattern
```typescript
const { data: session, status } = useSession()
const router = useRouter()

useEffect(() => {
  if (status === 'unauthenticated') {
    router.replace('/login')
  }
}, [status, router])

if (status === 'loading') {
  return <LoadingSpinner />
}

if (!session) {
  return null
}
```

### 4. API Route Protection
All API routes include authentication check:
```typescript
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### 5. Password Management

#### Initial Setup
- Default password: `admin123`
- Users: Dylan (dylan@squarage.com), Thomas (thomas@squarage.com)
- Passwords hashed with bcrypt (10 rounds)

#### Password Change (`/app/api/auth/change-password/route.ts`)
1. Verify current password
2. Validate new password (min 6 characters)
3. Hash new password
4. Update in database

## Current Users

### Admin Users
| Name | Email | Role | Default Password |
|------|-------|------|------------------|
| Dylan | dylan@squarage.com | admin | admin123 |
| Thomas | thomas@squarage.com | admin | admin123 |

## Environment Variables
```bash
# .env.local
NEXTAUTH_SECRET=<generated-secret>  # Generate: openssl rand -base64 32
# NEXTAUTH_URL not needed in development (auto-detected)
# In production: NEXTAUTH_URL=https://yourdomain.com
```

## Authentication Flow

### Login Process
1. User enters credentials on `/login`
2. NextAuth validates against database
3. JWT token created with user info
4. Session established
5. Redirect to dashboard (`/`)

### Logout Process
1. User clicks logout
2. Service worker cache cleared (mobile only)
3. NextAuth session destroyed
4. Redirect to `/login`

### Protected Routes
- All routes except `/login` require authentication
- Middleware redirects unauthenticated users
- API routes return 401 if no session

## Security Features

### Password Security
- Bcrypt hashing with salt rounds: 10
- Minimum password length: 6 characters
- Password confirmation required for changes
- Current password verification for changes

### Session Security
- JWT tokens with 30-day expiry
- Session refresh on window focus
- Secure cookie settings in production
- Role-based access control ready

### Data Access
- Users can only see their own todos (filtered by user_id)
- "All" todos visible to all authenticated users
- Admin role can see all data

## Mobile vs Desktop

### Desktop
- No service worker (prevents caching issues)
- Standard web authentication
- Session persists across tabs

### Mobile
- PWA with service worker (mobile only)
- Service worker skips auth routes
- Cache cleared on logout
- Installable app experience

## Common Issues & Solutions

### Issue: Infinite loading after login
**Cause**: Service worker caching authentication state
**Solution**: Service worker disabled on desktop, minimal caching on mobile

### Issue: Session not persisting
**Cause**: Missing NEXTAUTH_SECRET
**Solution**: Set proper secret in .env.local

### Issue: Can't login
**Cause**: Database connection or wrong credentials
**Solution**: Check DATABASE_URL and use correct email/password

## Scripts

### Seed Initial Users
```bash
npx tsx scripts/seed-users.ts
```

### Migrate Todo Owners to User System
```bash
npx tsx scripts/migrate-todo-owners.ts
```

### Test Password Change
```bash
npx tsx scripts/test-password-change.ts
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/*` - NextAuth endpoints
- `POST /api/auth/change-password` - Change user password

### Protected Routes (require authentication)
- `GET/POST /api/todos/neon` - Todo CRUD operations
- `GET/POST /api/sales/neon` - Sales CRUD operations

## Future Enhancements
- [ ] OAuth providers (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Password reset via email
- [ ] User management interface
- [ ] Session activity logging
- [ ] Remember me checkbox
- [ ] Account lockout after failed attempts

## Troubleshooting

### Clear Authentication State
1. Open DevTools → Application
2. Clear all site data
3. Unregister service workers
4. Delete cookies
5. Hard refresh (Cmd+Shift+R)

### Reset User Password Manually
```typescript
// Run in scripts/reset-password.ts
const hashedPassword = await bcrypt.hash('newpassword', 10)
await db.update(users)
  .set({ password: hashedPassword })
  .where(eq(users.email, 'user@email.com'))
```

### Check Current Users
```bash
npx tsx scripts/check-todos.ts  # Shows users and todo ownership
```

## Important Notes

⚠️ **NEVER** commit real passwords to version control
⚠️ **ALWAYS** use strong NEXTAUTH_SECRET in production
⚠️ **CHANGE** default passwords after initial setup
⚠️ Service worker is **MOBILE ONLY** to prevent desktop caching issues
⚠️ All admin users can see all todos regardless of ownership

---

Last Updated: August 2025
NextAuth Version: 4.24.11
Next.js Version: 14.2.31