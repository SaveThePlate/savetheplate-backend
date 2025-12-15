# Caching Layer Implementation

This document describes the caching layer implementation for the Leftover backend application.

## Overview

A Redis-based caching layer has been implemented to reduce direct database queries and improve application scalability. The system automatically falls back to in-memory caching if Redis is unavailable.

## Architecture

### Components

1. **CacheModule** (`src/cache/cache.module.ts`)
   - Configures Redis connection with fallback to in-memory cache
   - Global module available throughout the application

2. **CacheService** (`src/cache/cache.service.ts`)
   - Provides caching utilities and key generation
   - Handles cache invalidation patterns

3. **Service Integration**
   - `OfferService`: Caches offer listings and individual offers
   - `OrderService`: Caches order listings and individual orders
   - `UsersService`: Caches user data

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration (optional - defaults to localhost:6379)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here  # Optional
REDIS_URL=redis://localhost:6379   # Alternative to HOST/PORT
```

### Cache TTL (Time To Live)

- **Offers**: 5 minutes (300 seconds)
- **Orders**: 2 minutes (120 seconds) - shorter due to frequent updates
- **Users**: 5 minutes (300 seconds)

## Cached Endpoints

### Offers
- `GET /offers` - All offers list
- `GET /offers/:id` - Individual offer details
- `GET /offers/owner/:id` - Offers by owner

### Orders
- `GET /orders` - User's orders
- `GET /orders/:id` - Individual order details
- `GET /orders/provider` - Provider's orders
- `GET /orders/offer/:offerId` - Orders for a specific offer

### Users
- `GET /users/:id` - User by ID
- `GET /users/me` - Current user profile

## Cache Invalidation

Cache is automatically invalidated on write operations:

### Offers
- **Create**: Invalidates all offer caches
- **Update**: Invalidates specific offer and related caches
- **Delete**: Invalidates specific offer and all offer caches

### Orders
- **Create**: Invalidates order caches for user, offer, and provider
- **Update/Confirm/Cancel**: Invalidates related order caches

### Users
- **Update Profile**: Invalidates user cache and related offer caches
- **Update Role**: Invalidates user cache

## Cache Keys

The cache uses a structured key format:

- `offer:{id}` - Individual offer
- `offers:all` - All offers list
- `offers:owner:{ownerId}` - Offers by owner
- `order:{id}` - Individual order
- `orders:all` - All orders list
- `orders:user:{userId}` - Orders by user
- `orders:provider:{providerId}` - Orders by provider
- `orders:offer:{offerId}` - Orders by offer
- `user:id:{id}` - User by ID
- `user:email:{email}` - User by email

## Fallback Behavior

If Redis is unavailable:
- The system automatically falls back to in-memory caching
- A warning is logged to the console
- Application continues to function normally
- Pattern-based cache invalidation is disabled (in-memory cache doesn't support it)

## Performance Benefits

1. **Reduced Database Load**: Frequently accessed data is served from cache
2. **Faster Response Times**: Cache lookups are significantly faster than database queries
3. **Better Scalability**: Can handle more concurrent requests
4. **Cost Efficiency**: Reduced database query costs

## Monitoring

To monitor cache performance:

1. Check Redis connection status in application logs
2. Monitor cache hit/miss rates (can be added via metrics)
3. Watch for fallback warnings indicating Redis connectivity issues

## Future Enhancements

Potential improvements:
- Cache warming strategies
- Cache hit/miss metrics
- Custom TTL per endpoint
- Cache compression for large objects
- Distributed cache invalidation for multi-instance deployments

