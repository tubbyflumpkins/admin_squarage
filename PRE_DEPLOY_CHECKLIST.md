# Pre-Deployment Checklist

## ⚠️ IMPORTANT: Run these checks before pushing to staging/main

To avoid TypeScript errors during Vercel deployment, **always run these commands before pushing**:

```bash
# Quick check - runs TypeScript compiler and linter
npm run check-all

# Full production build test (exactly what Vercel runs)
npm run build
```

## Common TypeScript Issues to Watch For

1. **Database null checks**: Always check `if (!db)` before using database
2. **Implicit any types**: Add explicit types to map/filter callbacks: `.map((item: Type) => ...)`
3. **Ref callbacks**: Must return void, use braces: `ref={el => { refVar = el; }}`
4. **Async function checks**: Use non-null assertion `db!` inside callbacks after checking

## Quick Fix Commands

```bash
# Just check types without building
npm run type-check

# Check linting
npm run lint

# Full build (includes both)
npm run build
```

## If You Get TypeScript Errors

1. Fix the errors locally
2. Run `npm run build` to verify
3. Only push after build succeeds

This will save deployment time and prevent broken builds on Vercel.