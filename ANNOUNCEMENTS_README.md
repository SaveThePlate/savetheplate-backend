# Announcements Feature

## Overview

The Announcements feature allows administrators to send promotional and informational emails to users of the Save The Plate application. This feature is designed to help you communicate important updates, launch announcements, and marketing campaigns to your user base.

## Features

- ✅ Send emails to all users or filter by role (CLIENT, PROVIDER, etc.)
- ✅ Send to specific email addresses for testing
- ✅ Customizable email templates with title, description, details, and call-to-action button
- ✅ Admin-only access control
- ✅ Development mode support (logs emails instead of sending)
- ✅ Production-ready email sending via Resend

## Architecture

### Module Structure

```
src/announcements/
├── announcements.controller.ts    # API endpoints
├── announcements.service.ts      # Business logic
├── announcements.module.ts        # Module configuration
└── dto/
    └── send-announcement.dto.ts   # Request validation
```

### Dependencies

- **Resend Service**: Handles email delivery via Resend API
- **Prisma Service**: Database access for user queries
- **Auth Guards**: Authentication and authorization
- **React Email**: Email template rendering

## API Endpoints

### 1. Send Announcement (Admin Only)

**Endpoint:** `POST /announcements/send`

**Authentication:** Required (JWT token)

**Authorization:** Admin only (email-based check)

**Request Body:**

```json
{
  "subject": "Save The Plate is Launching Soon! 🎉",
  "title": "🎉 We're Launching Soon!",
  "description": "Get ready! Save The Plate will be launching soon. Create your account now and be among the first to see amazing food offers and save money while reducing waste!",
  "details": [
    "✨ Be the first to access exclusive offers",
    "🍽️ Discover amazing food deals near you",
    "🌱 Help reduce food waste in your community"
  ],
  "buttonText": "Create Account Now",
  "buttonLink": "https://leftover.ccdev.space/",
  "role": "CLIENT",
  "emails": ["user@example.com"],
  "forceProduction": false
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | ✅ | Email subject line |
| `description` | string | ✅ | Main email description/body text |
| `title` | string | ❌ | Email title (default: "🎉 Exciting News from Save The Plate!") |
| `details` | string[] | ❌ | Array of detail points to display |
| `buttonText` | string | ❌ | Call-to-action button text (default: "Create Account Now") |
| `buttonLink` | string | ❌ | Call-to-action button URL (default: "https://leftover.ccdev.space/") |
| `role` | UserRole | ❌ | Filter users by role (CLIENT, PROVIDER, PENDING_PROVIDER, NONE). If not provided, sends to all users |
| `emails` | string[] | ❌ | Specific email addresses to send to (overrides role filter) |
| `forceProduction` | boolean | ❌ | Force sending emails even in development mode (default: false) |

**Response:**

```json
{
  "message": "Email campaign completed",
  "sent": 150,
  "failed": 0,
  "total": 150,
  "errors": null
}
```

**Example: Send to all users**

```bash
curl -X POST http://localhost:3001/announcements/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "subject": "New Features Available!",
    "description": "We've added exciting new features to Save The Plate!",
    "title": "🚀 New Features",
    "details": ["Feature 1", "Feature 2"],
    "buttonText": "Explore Now",
    "buttonLink": "https://app.savetheplate.com/features"
  }'
```

**Example: Send to specific role**

```bash
curl -X POST http://localhost:3001/announcements/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "subject": "Provider Update",
    "description": "Important update for providers",
    "role": "PROVIDER"
  }'
```

**Example: Send to specific emails (testing)**

```bash
curl -X POST http://localhost:3001/announcements/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "subject": "Test Email",
    "description": "This is a test",
    "emails": ["test@example.com", "another@example.com"]
  }'
```

### 2. Test Endpoint (Development Only)

**Endpoint:** `POST /announcements/test`

**Authentication:** Not required

**Availability:** Development mode only (disabled in production)

**Note:** This endpoint is for testing purposes and does not require authentication. It's automatically disabled in production environments.

## Security

### Authentication & Authorization

The announcements feature implements multiple layers of security:

1. **Authentication Guard (`AuthGuard`)**
   - Verifies JWT token
   - Ensures user is logged in
   - Validates token type

2. **Admin Guard (`AdminGuard`)**
   - Checks if user's email is in the admin list
   - Configurable via `ADMIN_EMAILS` environment variable
   - Default admin: `savetheplatetunisia@gmail.com`

### Configuration

Add admin emails to your `.env` file:

```env
ADMIN_EMAILS=savetheplatetunisia@gmail.com,admin2@example.com,admin3@example.com
```

If `ADMIN_EMAILS` is not set, it defaults to `savetheplatetunisia@gmail.com`.

### Future: Role-Based Access

When the admin role system is implemented, the endpoint will be updated to use role-based access control:

```typescript
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
```

## Email Template

The announcements use a React-based email template (`emails/Announcement.tsx`) that extends the main template (`emails/MainTemplate.tsx`). The template includes:

- **Header**: "Save The Plate" branding
- **Title**: Customizable main title
- **Description**: Main content text
- **Details**: Bullet points or additional information
- **Call-to-Action Button**: Optional button with custom text and link
- **Footer**: Thank you message with contact link

### Email Sender

All emails are sent from: **Save The Plate <no-reply@ccdev.space>**

## Development vs Production

### Development Mode

When `NODE_ENV=development`:

- Emails are **not sent** (unless `forceProduction: true`)
- Email details are logged to console
- Response includes preview information
- Test endpoint is available

**Example Development Response:**

```json
{
  "message": "Email would be sent to 150 users in production",
  "sent": 0,
  "failed": 0,
  "recipients": 150,
  "users": [
    {
      "email": "user1@example.com",
      "username": "user1"
    }
  ]
}
```

### Production Mode

When `NODE_ENV=production` (or `forceProduction: true`):

- Emails are **actually sent** via Resend
- Real email delivery occurs
- Response includes actual send statistics
- Test endpoint is disabled

## Error Handling

The service handles various error scenarios:

- **No users found**: Returns error if no recipients match criteria
- **Email sending failures**: Tracks failed sends and includes error messages
- **Invalid input**: Validates request body using DTOs
- **Unauthorized access**: Returns 401/403 for unauthorized requests

**Error Response Example:**

```json
{
  "message": "Email campaign completed",
  "sent": 145,
  "failed": 5,
  "total": 150,
  "errors": [
    "user1@example.com: Invalid email address",
    "user2@example.com: Rate limit exceeded"
  ]
}
```

## Usage Examples

### Launch Announcement

```json
{
  "subject": "Save The Plate is Launching Soon! 🎉",
  "title": "🎉 We're Launching Soon!",
  "description": "Get ready! Save The Plate will be launching soon. Create your account now and be among the first to see amazing food offers.",
  "details": [
    "✨ Be the first to access exclusive offers",
    "🍽️ Discover amazing food deals near you",
    "🌱 Help reduce food waste in your community"
  ],
  "buttonText": "Create Account Now",
  "buttonLink": "https://app.savetheplate.com/signup"
}
```

### Feature Update

```json
{
  "subject": "New Features Available!",
  "title": "🚀 Exciting New Features",
  "description": "We've been working hard to improve your experience. Check out these new features!",
  "details": [
    "📱 Improved mobile experience",
    "🔔 Real-time notifications",
    "⭐ Enhanced search functionality"
  ],
  "buttonText": "See What's New",
  "buttonLink": "https://app.savetheplate.com/features"
}
```

### Provider-Specific Announcement

```json
{
  "subject": "Important Update for Providers",
  "title": "📢 Provider Update",
  "description": "We have important information for all food providers.",
  "role": "PROVIDER",
  "buttonText": "View Details",
  "buttonLink": "https://app.savetheplate.com/provider/updates"
}
```

## Environment Variables

Required environment variables:

```env
# Resend Configuration
RESEND_TOKEN=your_resend_api_token
RESEND_DOMAIN=ccdev.space

# Admin Configuration
ADMIN_EMAILS=savetheplatetunisia@gmail.com,admin2@example.com

# Environment
NODE_ENV=development  # or production
```

## Testing

### Test in Development Mode

1. Ensure `NODE_ENV=development` (or not set)
2. Use the test endpoint (no auth required):

```bash
curl -X POST http://localhost:3001/announcements/test \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Email",
    "description": "This is a test",
    "emails": ["your-email@example.com"],
    "forceProduction": true
  }'
```

### Test in Production Mode

1. Set `NODE_ENV=production` or use `forceProduction: true`
2. Use the main endpoint with authentication:

```bash
curl -X POST http://localhost:3001/announcements/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "subject": "Test Email",
    "description": "This is a test",
    "emails": ["your-email@example.com"],
    "forceProduction": true
  }'
```

## Troubleshooting

### Emails Not Sending

1. **Check Resend Configuration**
   - Verify `RESEND_TOKEN` is set correctly
   - Verify `RESEND_DOMAIN` is configured in Resend dashboard
   - Check Resend API quota/limits

2. **Check Environment Mode**
   - In development, emails are logged, not sent (unless `forceProduction: true`)
   - Verify `NODE_ENV` is set correctly

3. **Check Admin Access**
   - Verify your email is in `ADMIN_EMAILS` environment variable
   - Check authentication token is valid

### Permission Denied

- Ensure you're authenticated (valid JWT token)
- Verify your email is in the admin list
- Check that `AdminGuard` is properly configured

### No Users Found

- Verify users exist in the database
- Check role filter if using `role` parameter
- Verify email addresses if using `emails` parameter

## Future Improvements

- [ ] Add ADMIN role to UserRole enum
- [ ] Migrate from email-based admin check to role-based
- [ ] Add rate limiting for announcement sending
- [ ] Add announcement scheduling (send at specific time)
- [ ] Add announcement history/logging
- [ ] Add email preview before sending
- [ ] Add A/B testing support
- [ ] Add unsubscribe functionality
- [ ] Add email analytics (open rates, click rates)

## Related Files

- `src/announcements/` - Announcements module
- `src/auth/admin.guard.ts` - Admin authorization guard
- `src/auth/roles.guard.ts` - Role-based authorization guard
- `src/utils/mailing/resend.service.ts` - Email service
- `emails/Announcement.tsx` - Email template
- `emails/MainTemplate.tsx` - Base email template

## Support

For issues or questions about the announcements feature, please contact the development team or refer to the main project documentation.
