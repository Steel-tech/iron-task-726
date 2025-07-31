# Refresh Token Security Implementation

## Overview

This implementation provides secure refresh token rotation with the following features:

### Security Features

1. **Token Rotation**: Each refresh token can only be used once. Upon use, it's marked as rotated and a new token is issued.

2. **Token Families**: Tokens are grouped in families to detect reuse attacks. If a rotated token is used again, the entire family is revoked.

3. **Automatic Cleanup**: Expired tokens are automatically cleaned up via scheduled job.

4. **Session Management**: Users can view and revoke individual sessions or all sessions.

5. **Secure Storage**: Refresh tokens are stored as httpOnly cookies and in the database with metadata.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (issues access + refresh tokens)
- `POST /api/auth/refresh` - Refresh access token (rotates refresh token)
- `POST /api/auth/logout` - Logout (revokes all refresh tokens)

### Session Management
- `GET /api/auth/sessions` - Get all active sessions
- `DELETE /api/auth/sessions/:id` - Revoke specific session
- `POST /api/auth/revoke-all-sessions` - Revoke all other sessions

## Token Lifetimes

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Refresh Token Cookie**: 7 days (httpOnly, secure, sameSite)

## Database Schema

```prisma
model RefreshToken {
  id            String    @id @default(uuid())
  token         String    @unique
  userId        String
  family        String    @default(uuid())
  issuedAt      DateTime  @default(now())
  expiresAt     DateTime
  rotatedAt     DateTime?
  ipAddress     String?
  userAgent     String?
  revokedAt     DateTime?
  revokedReason String?
  user          User      @relation(...)
}
```

## Security Considerations

1. **Token Reuse Detection**: If a rotated token is used, it indicates either:
   - Token theft (attacker has old token)
   - Race condition (legitimate retry)
   - The entire token family is revoked for safety

2. **IP/User-Agent Tracking**: Helps detect suspicious activity but not used for blocking (can change legitimately).

3. **Graceful Degradation**: Even if token revocation fails, cookies are still cleared.

4. **No JWT for Refresh Tokens**: Using random strings prevents token tampering and information leakage.

## Frontend Integration

The frontend automatically handles token refresh:
- Intercepts 401 responses
- Attempts token refresh
- Queues failed requests during refresh
- Retries original request with new token
- Redirects to login if refresh fails

## Deployment Steps

1. **Run Database Migration**:
   ```bash
   cd api
   npx prisma migrate dev --name add_refresh_tokens
   ```

2. **Update Environment Variables**:
   - Ensure JWT_SECRET is at least 64 characters
   - Set COOKIE_SECRET to secure value
   - Configure SESSION_COOKIE_NAME if needed

3. **Schedule Cleanup Job**:
   Add to crontab or scheduler:
   ```bash
   0 3 * * * node /path/to/api/src/jobs/tokenCleanup.js
   ```

4. **Monitor Token Usage**:
   - Track failed refresh attempts
   - Monitor token family revocations
   - Alert on suspicious patterns

## Testing

Test the implementation:
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -c cookies.txt

# Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Get sessions
curl -X GET http://localhost:3001/api/auth/sessions \
  -H "Authorization: Bearer <access_token>"
```

## Security Checklist

- [ ] JWT_SECRET is cryptographically strong
- [ ] COOKIE_SECRET is unique and secure
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Rate limiting on auth endpoints
- [ ] Monitoring for suspicious activity
- [ ] Regular token cleanup scheduled
- [ ] Security headers configured