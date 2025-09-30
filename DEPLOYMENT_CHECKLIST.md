# Email Subscriber System - Production Deployment Checklist

## ✅ Pre-Deployment Configuration

### 1. Environment Variables
Set the following environment variables in your production deployment platform (Vercel, etc.):

```bash
# Database
DATABASE_URL=<your-production-neon-database-url>

# Authentication
NEXTAUTH_URL=https://admin.squarage.com  # Update to your admin URL
NEXTAUTH_SECRET=<generate-new-secret-for-production>

# Email Capture API
EMAIL_CAPTURE_API_KEY=<keep-same-or-regenerate-for-security>
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://squarage.com,https://www.squarage.com,https://admin.squarage.com

# Shopify Integration
SHOPIFY_ADMIN_ACCESS_TOKEN=<your-shopify-access-token>
SHOPIFY_SHOP_DOMAIN=squarage.myshopify.com
```

### 2. CORS Configuration ✅
- **Local Development**: `http://localhost:3000`, `http://localhost:3001`
- **Production Customer Site**: `https://squarage.com`, `https://www.squarage.com`
- **Admin Dashboard**: `https://admin.squarage.com`
- **Unauthorized origins are properly rejected**

### 3. Security Features ✅
- ✅ API Key authentication required
- ✅ Rate limiting (5 requests/minute per IP)
- ✅ Input validation and sanitization
- ✅ Disposable email domain blocking (300+ domains)
- ✅ SQL injection protection via Drizzle ORM
- ✅ CORS properly configured

### 4. Email Validation ✅
- ✅ Format validation (proper email structure)
- ✅ Domain validation (must have valid TLD)
- ✅ Disposable email blocking
- ✅ Suspicious pattern detection
- ✅ Email normalization (trim & lowercase)

### 5. Shopify Integration ✅
- ✅ Automatic discount code generation
- ✅ 10% discount, single-use per customer
- ✅ 30-day expiry period
- ✅ Only generated for marketing consent = true
- ✅ Graceful fallback if Shopify is unavailable

## 📋 Deployment Steps

### 1. Database Migration
```bash
# Push schema to production database
npm run db:push
```

### 2. Verify Shopify Permissions
Ensure your Shopify app has the `write_discounts` scope:
1. Go to Shopify Admin > Settings > Apps and sales channels > Develop apps
2. Click on your app
3. Click "Configure Admin API scopes"
4. Enable "write_discounts" scope
5. Save and reinstall the app

### 3. Deploy to Vercel
```bash
# Push to GitHub (Vercel will auto-deploy)
git push origin main

# Or deploy manually
vercel --prod
```

### 4. Post-Deployment Testing

#### Test from Customer Site
```javascript
// Test from customer site (squarage.com)
fetch('https://admin.squarage.com/api/email-capture/public/subscribe', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@gmail.com',
    consentMarketing: true,
    source: 'production-test'
  })
})
```

#### Verify Admin UI
1. Navigate to https://admin.squarage.com/email
2. Check that stats cards are displaying correctly
3. Verify table shows subscribers
4. Test CSV export functionality
5. Test delete functionality

## 🔍 Monitoring

### Key Metrics to Track
- Email capture success rate
- Discount code generation success rate
- Rate limit violations (potential attacks)
- Disposable email rejection rate
- API response times

### Error Logs to Monitor
- Shopify API failures
- Database connection issues
- CORS violations
- Authentication failures

## 🚨 Rollback Plan

If issues arise:
1. Revert to previous deployment in Vercel
2. Check environment variables are correctly set
3. Verify database connection string
4. Check Shopify API permissions
5. Review error logs for specific issues

## ✅ Success Criteria

- [ ] Customer site can successfully submit emails
- [ ] Valid emails receive discount codes
- [ ] Disposable emails are rejected
- [ ] Duplicate emails receive friendly messages
- [ ] Admin can view and manage subscribers
- [ ] CSV export works correctly
- [ ] Rate limiting prevents abuse
- [ ] CORS only allows authorized origins

## 📝 Notes

- The system automatically falls back to JSON storage if database is unavailable
- Discount codes are marked as "PENDING" if Shopify generation fails (can be retried)
- All timestamps are stored in UTC
- Email addresses are normalized (lowercase, trimmed) before storage

---

Last Updated: 2025-09-29
System Status: ✅ Ready for Production Deployment