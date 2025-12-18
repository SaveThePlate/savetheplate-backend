# Facebook Authentication Improvements

## Changes Made

### 1. Enhanced Error Logging
- Added comprehensive console logging throughout the authentication flow
- Each step now logs its progress and any errors encountered
- Logs include relevant context (user IDs, app IDs, error details)

### 2. Better Error Messages
- More descriptive error messages that help identify the exact issue
- Specific error messages for:
  - Missing environment variables
  - Invalid tokens
  - Token app ID mismatches
  - Missing email permissions
  - Database errors
  - Token generation errors

### 3. Improved Error Handling
- Separate try-catch blocks for different operations:
  - Facebook Graph API calls
  - Database operations (find, create, update)
  - Token generation
- Each error is caught and re-thrown with appropriate context

### 4. Validation Improvements
- Validates that access token is provided before making API calls
- Better validation of Facebook API responses
- More detailed checks for token validity

## Debugging Guide

### Check Backend Logs
When a 500 error occurs, check the backend logs for messages starting with `[Facebook Auth]`:

```bash
# If using PM2
pm2 logs | grep "Facebook Auth"

# If using Docker
docker logs <container-name> | grep "Facebook Auth"

# If running directly
# Logs will appear in console
```

### Common Error Scenarios

#### 1. Missing Environment Variables
**Log message:**
```
[Facebook Auth] Missing environment variables: { hasAppId: false, hasAppSecret: false }
```

**Solution:**
- Check `.env` file has `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`
- Restart the backend after adding variables

#### 2. Invalid Token
**Log message:**
```
[Facebook Auth] Token is not valid: { error: { message: '...' } }
```

**Solution:**
- Token may be expired
- Token may not belong to your app
- Check Facebook app settings

#### 3. App ID Mismatch
**Log message:**
```
[Facebook Auth] Token app_id mismatch: { tokenAppId: '123', expectedAppId: '456' }
```

**Solution:**
- Verify `FACEBOOK_APP_ID` matches the app ID in Facebook Developers
- Ensure token is from the correct app

#### 4. Missing Email Permission
**Log message:**
```
[Facebook Auth] Email not provided by Facebook: { id: '...', name: '...' }
```

**Solution:**
- User must grant email permission
- Check Facebook app permissions in Developers console
- Ensure `email` is in the scope when requesting login

#### 5. Database Errors
**Log message:**
```
[Facebook Auth] Database error when creating user: ...
```

**Solution:**
- Check database connection
- Verify Prisma schema matches database
- Check for unique constraint violations (duplicate email)

## Testing

### Test with Valid Token
1. Get a Facebook access token from Graph API Explorer
2. Make POST request to `/auth/facebook`:
```bash
curl -X POST https://leftover-be.ccdev.space/auth/facebook \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "YOUR_FACEBOOK_TOKEN"}'
```

### Check Logs
Watch the logs to see each step:
1. Environment variables check
2. User info retrieval
3. Token verification
4. User creation/update
5. Token generation
6. Success response

## Environment Variables Required

```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

## Next Steps

1. **Check Backend Logs**: Look for `[Facebook Auth]` messages to identify the exact error
2. **Verify Environment Variables**: Ensure `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` are set
3. **Test Token**: Use Facebook Graph API Explorer to test if token is valid
4. **Check Database**: Ensure database is accessible and schema is up to date

## Additional Notes

- All errors are now logged with `[Facebook Auth]` prefix for easy filtering
- Error messages are more descriptive to help identify issues quickly
- Database operations are wrapped in try-catch to prevent crashes
- Token generation errors are caught separately

