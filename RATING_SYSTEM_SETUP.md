# Rating System Setup

This document describes the rating system implementation for the Leftover application.

## Overview

The rating system allows clients to rate their experience with food providers after confirming pickup. It includes:
- Star ratings (1-5 stars)
- Quick feedback tags
- Optional comments
- Average rating calculation for providers

## Database Changes

### New Model: Rating

A new `Rating` model has been added to the Prisma schema with the following fields:
- `id`: Primary key
- `orderId`: Unique reference to the order (one rating per order)
- `providerId`: Reference to the provider being rated
- `userId`: Reference to the user who created the rating
- `rating`: Star rating (1-5)
- `tags`: JSON array of feedback tags (optional)
- `comment`: Text comment (optional)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Migration Required

You need to create and run a Prisma migration:

```bash
cd /Users/sarrasoussia/leftover-backend
npx prisma migrate dev --name add_rating_system
```

Or for production:

```bash
npx prisma migrate deploy
```

## API Endpoints

### POST /ratings
Create a new rating for an order.

**Request Body:**
```json
{
  "orderId": 1,
  "providerId": 2,
  "rating": 5,
  "tags": ["great_value", "fresh_food", "friendly_staff"],
  "comment": "Excellent experience!"
}
```

**Response:**
Returns the created rating with order and provider information.

**Validation:**
- Order must exist and belong to the authenticated user
- Order must be confirmed and collected
- Provider ID must match the order's offer owner
- Rating must be between 1 and 5
- Only one rating per order is allowed

### GET /ratings/order/:orderId
Get rating for a specific order.

**Response:**
Returns the rating if it exists, or 404 if not found.

**Authorization:**
- User can only view ratings for their own orders

### GET /ratings/provider/:providerId
Get all ratings for a provider.

**Response:**
Returns array of all ratings for the provider with order and user information.

### GET /ratings/provider/:providerId/average
Get average rating for a provider.

**Response:**
```json
{
  "averageRating": 4.5,
  "totalRatings": 10
}
```

## Frontend Integration

The frontend rating dialog component (`components/RatingDialog.tsx`) is already integrated and will:
1. Show a "Rate Your Experience" button for confirmed orders
2. Open a dialog with star rating, feedback tags, and comment field
3. Submit rating to `POST /ratings`
4. Check for existing ratings via `GET /ratings/order/:orderId`

## Cache Strategy

Ratings are cached for 5 minutes:
- Provider ratings list: `ratings:provider:{providerId}`
- Provider average rating: `ratings:provider:{providerId}:average`

Cache is invalidated when a new rating is created.

## Security

- All endpoints require authentication (`@UseGuards(AuthGuard)`)
- Users can only rate their own orders
- Users can only view ratings for their own orders
- Orders must be confirmed and collected before rating
- Only one rating per order is allowed

## Testing

To test the rating system:

1. Create an order as a client
2. Confirm the order pickup (as provider)
3. As the client, you should see a "Rate Your Experience" button
4. Submit a rating with stars, tags, and optional comment
5. Verify the rating appears in provider's rating list

## Next Steps

1. Run the Prisma migration to create the Rating table
2. Test the endpoints using the frontend or API client
3. Optionally add rating display to provider profile pages
4. Consider adding rating statistics to provider dashboard

