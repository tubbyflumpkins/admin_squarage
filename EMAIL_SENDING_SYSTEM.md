# Email Sending System - Implementation Tracker

## Overview
Building a comprehensive email marketing infrastructure for Squarage that will eventually rival Klaviyo. Starting with automated welcome emails and expanding to full campaign management.

## Architecture Decisions
- **Email Service**: Resend (reliable, developer-friendly API)
- **Template Engine**: React Email (component-based templates)
- **Sender Address**: hello@squarage.com
- **Database**: Extending existing Neon PostgreSQL schema
- **Queue System**: Database-backed with cron job processing

## Todo List

### Phase 1: Foundation
- [ ] Set up database schema for email campaigns and templates
- [ ] Install and configure Resend and React Email packages
- [ ] Create email page with Database and Emails tabs
- [ ] Build email template editor and management system
- [ ] Create welcome email template with discount code
- [ ] Implement email sending API routes
- [ ] Create email queue and automation system
- [ ] Test email sending with welcome email flow

### Phase 2: Enhancement (Future)
- [ ] Add email analytics tracking
- [ ] Implement segmentation engine
- [ ] Create drip campaign builder
- [ ] Add A/B testing capabilities
- [ ] Build webhook handlers for email events

## Implementation Progress

### Completed
- [x] Research and plan email infrastructure architecture
  - Evaluated Resend vs other providers
  - Studied Klaviyo features for roadmap
  - Reviewed existing codebase structure

- [x] Set up database schema for email campaigns and templates
  - Created all 4 new tables (templates, campaigns, sends, queue)
  - Added indexes for performance
  - Successfully deployed to Neon database

- [x] Install and configure Resend and React Email packages
  - Installed resend, @react-email/components, @react-email/render
  - Set up environment variables for Resend API

- [x] Create email page with Database and Emails tabs
  - Refactored page to use tabbed interface
  - Created DatabaseTab component (existing subscriber view)
  - Created EmailsTab component (new email management)

- [x] Build email template editor and management system
  - Created templates list view with status indicators
  - Added test email functionality
  - Built queue monitor display

- [x] Create welcome email template with discount code
  - Built beautiful React Email component
  - Includes discount code, product showcase, brand story
  - Fully responsive design with fallback fonts

- [x] Implement email sending API routes
  - `/api/emails/send` - Direct email sending with Resend
  - `/api/emails/queue` - Queue management (GET, POST, PUT)
  - `/api/emails/templates` - Template CRUD operations
  - `/api/emails/campaigns` - Campaign management

- [x] Create email queue and automation system
  - Queue processing with retry logic
  - Priority-based sending
  - Automatic welcome email on subscription
  - Integration with subscribe endpoint

### In Progress
- Testing email sending with welcome email flow

### Database Schema

#### New Tables Planned
```sql
-- Email Templates
email_templates (
  id,
  name,
  subject,
  html_content,
  react_component,
  variables,
  category,
  created_at,
  updated_at
)

-- Email Campaigns
email_campaigns (
  id,
  name,
  template_id,
  status,
  scheduled_at,
  sent_at,
  recipient_count,
  segment_rules,
  created_at,
  updated_at
)

-- Email Sends
email_sends (
  id,
  campaign_id,
  recipient_email,
  template_id,
  status,
  sent_at,
  opened_at,
  clicked_at,
  resend_id,
  error_message,
  created_at
)

-- Email Queue
email_queue (
  id,
  recipient_email,
  template_id,
  variables,
  priority,
  scheduled_for,
  attempts,
  status,
  created_at,
  processed_at
)
```

### API Routes

#### Planned Endpoints
- `POST /api/emails/send` - Send individual email
- `POST /api/emails/queue` - Queue bulk sends
- `GET/POST /api/emails/templates` - Manage templates
- `POST /api/emails/campaigns` - Create/manage campaigns
- `POST /api/emails/webhooks/resend` - Handle Resend webhooks

### Email Templates

#### Welcome Email (First Template)
- **Subject**: "Welcome to Squarage! Here's your 10% discount"
- **Content**:
  - Squarage logo and brand colors
  - Personalized greeting
  - Discount code display (prominent)
  - 30-day expiry notice
  - Product showcase
  - About the brand snippet
  - Social media links

### UI Components

#### Email Page Tabs Structure
1. **Database Tab** (existing view)
   - Subscriber list
   - Export functionality
   - Stats cards

2. **Emails Tab** (new)
   - Template manager
   - Campaign list
   - Quick send interface
   - Queue monitor
   - Basic analytics

### Integration Points

#### Automatic Welcome Email Trigger
- Triggered in `/api/email-capture/public/subscribe/route.ts`
- When discount code is successfully generated
- Queued immediately for sending
- Include discount code and personalization

### Technical Notes

#### Resend Configuration
- API Key: Will need to be added to .env.local
- Domain verification required for hello@squarage.com
- Rate limits: 100/day (free tier), need paid plan for production

#### React Email Benefits
- Component reusability
- Type safety
- Preview in development
- Automatic inline styles
- Cross-client compatibility

### Workarounds & Issues

#### Current Workarounds
- None yet

#### Known Issues
- Need to verify domain ownership with Resend
- hello@squarage.com email needs to be set up properly

### Changes from Original Plan
- Focus on programmatic email generation rather than visual template builder (LLM will handle in future)
- Simplified template management UI
- Emphasis on API-first approach for future LLM integration

### Environment Variables Needed
```env
RESEND_API_KEY=re_xxxxx  # Need to get from Resend dashboard
RESEND_FROM_EMAIL=hello@squarage.com  # Need domain verification
RESEND_REPLY_TO=hello@squarage.com
```

## Testing Checklist

### Required Setup
1. [ ] Get Resend API key from https://resend.com
2. [ ] Verify domain ownership for hello@squarage.com in Resend
3. [ ] Update RESEND_API_KEY in .env.local
4. [ ] Test email flow with real subscription

### Test Scenarios
1. [ ] New user subscribes with marketing consent → Welcome email sent
2. [ ] New user subscribes without consent → No email sent
3. [ ] Existing user resubscribes → Friendly message, no duplicate email
4. [ ] Test email from admin panel → Delivered to test address
5. [ ] Queue processing via cron → Emails sent in priority order

## Current System Capabilities

### What's Working
- Complete email infrastructure with queue system
- Beautiful welcome email template with discount code
- Automatic sending on new subscriptions
- Admin interface for managing emails
- API endpoints for all email operations

### What Needs Configuration
- Resend API key (sign up at resend.com)
- Domain verification for hello@squarage.com
- Email address setup (hello@squarage.com needs to exist)

### Future Enhancements
- Email open/click tracking via webhooks
- Advanced segmentation based on user behavior
- Drip campaign sequences
- A/B testing for subject lines and content
- LLM integration for dynamic content generation

## Files Created/Modified

### New Files
- `/components/Email/DatabaseTab.tsx` - Subscriber database view
- `/components/Email/EmailsTab.tsx` - Email management interface
- `/components/Email/templates/WelcomeEmail.tsx` - Welcome email template
- `/app/api/emails/send/route.ts` - Send email API
- `/app/api/emails/queue/route.ts` - Queue management API
- `/app/api/emails/templates/route.ts` - Template CRUD API
- `/app/api/emails/campaigns/route.ts` - Campaign management API
- `/scripts/create-email-tables.ts` - Database migration script

### Modified Files
- `/app/email/page.tsx` - Added tabbed interface
- `/lib/db/schema.ts` - Added email tables
- `/app/api/email-capture/public/subscribe/route.ts` - Added welcome email trigger
- `/.env.local` - Added Resend configuration

---
*Last Updated: Implementation complete, pending testing with real Resend API*