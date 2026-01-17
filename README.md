
# SaveThePlate Backend

This is the backend for SaveThePlate, a platform to reduce food waste by connecting businesses with surplus food to consumers.

**Tech stack:** NestJS, Node.js, TypeScript, PostgreSQL, Prisma

## Quick Start

1. Clone the repo and run `npm install`
2. Copy `.env.example` to `.env` and fill in the required values
3. Run database migrations: `npx prisma migrate dev`
4. Start the server: `npm run dev`

API docs available at `/api` when running locally.


**Key Libraries:**
- Socket.io (WebSocket communication)
- Nodemailer (Email service)
- Redis (Caching)
- Sharp (Image processing)
- Blurhash (Image placeholders)
- Axios (HTTP client)
- Class-validator & Class-transformer

## 📁 Project Structure

```
savetheplate-backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── main.ts               # Application entry point
│   ├── app.module.ts         # Root module
│   ├── announcements/        # Admin announcements feature
│   ├── auth/                 # Authentication & authorization
│   ├── cache/                # Redis caching module
│   ├── common/               # Shared utilities & guards
│   ├── contact/              # Contact form handling
│   ├── emails/               # Email templates & service
│   ├── offer/                # Food offer management
│   ├── order/                # Order processing
│   ├── prisma/               # Prisma service
│   ├── rating/               # Rating system
│   ├── scripts/              # Utility scripts
│   ├── storage/              # File upload & storage
│   ├── types/                # TypeScript type definitions
│   ├── users/                # User management
│   ├── utils/                # Helper functions
│   └── websocket/            # WebSocket gateway
├── store/                    # Uploaded files storage
│   └── profile-images/       # User profile images
├── test/                     # E2E tests
└── package.json
```

## ✨ Key Features

### Authentication Module (`src/auth/`)
- Local authentication (email/password with bcrypt)
- Google OAuth 2.0
- Facebook OAuth 2.0
- JWT token generation and validation
- Email verification
- Password reset functionality

### Offer Module (`src/offer/`)
- Create, read, update, delete food offers
- Image upload with automatic optimization
- Geolocation support (latitude/longitude)
- Expiration date tracking
- Food type and taste categorization
- Quantity management
- Pagination and filtering

### Order Module (`src/order/`)
- Order creation and management
- QR code generation for order verification
- Order status tracking
- Real-time notifications via WebSocket
- Order history

### User Module (`src/users/`)
- User profile management
- Profile image upload
- Location management
- Role-based access control (CLIENT, PROVIDER, ADMIN)
- User statistics

### Rating Module (`src/rating/`)
- Provider rating system
- Rating creation and retrieval
- Average rating calculation

### WebSocket Module (`src/websocket/`)
- Real-time notifications
- Order status updates
- New offer notifications
- Client connection management

### Announcements Module (`src/announcements/`)
- Admin-only feature for sending promotional emails
- See [ANNOUNCEMENTS_README.md](./ANNOUNCEMENTS_README.md) for details

## 📚 API Documentation

### Swagger/OpenAPI
When the server is running, visit: http://localhost:3001/api

### Main Endpoints

**Authentication:**
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login with credentials
- `GET /auth/google` - Google OAuth
- `GET /auth/facebook` - Facebook OAuth
- `POST /auth/verify-email` - Verify email address
- `POST /auth/forgot-password` - Request password reset

**Offers:**
- `GET /offer` - List all offers (with filters)
- `GET /offer/:id` - Get offer details
- `POST /offer` - Create new offer (Provider only)
- `PATCH /offer/:id` - Update offer
- `DELETE /offer/:id` - Delete offer

**Orders:**
- `GET /order` - List user's orders
- `GET /order/:id` - Get order details
- `POST /order` - Create order
- `PATCH /order/:id/status` - Update order status
- `POST /order/:id/verify` - Verify order with QR code

**Users:**
- `GET /users/profile` - Get current user profile
- `PATCH /users/profile` - Update profile
- `POST /users/profile-image` - Upload profile image

**Ratings:**
- `GET /rating/:providerId` - Get provider ratings
- `POST /rating` - Create rating

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start with hot-reload
npm run start:debug      # Start with debugger

# Building
npm run build            # Compile TypeScript

# Production
npm run start:prod       # Run production build

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Generate coverage report
npm run test:e2e         # Run end-to-end tests

# Database
npx prisma studio        # Open Prisma Studio GUI
npx prisma migrate dev   # Create and apply migration
npx prisma generate      # Generate Prisma Client

# Utilities
npm run check-orphaned-images  # Find unused images in storage
npm run install-githooks       # Setup git hooks
```

### Database Schema

Key models in `prisma/schema.prisma`:
- **User** - User accounts with authentication
- **Offer** - Food offers from providers
- **Order** - Customer orders
- **Rating** - Provider ratings

### Adding New Features

1. Generate a module: `nest g module feature-name`
2. Generate a controller: `nest g controller feature-name`
3. Generate a service: `nest g service feature-name`
4. Update Prisma schema if database changes needed
5. Run migration: `npx prisma migrate dev --name feature-name`
6. Add Swagger decorators for API documentation

### Environment Variables

All required environment variables should be documented in `.env.example`

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

Test files are located alongside source files with `.spec.ts` extension.

## 🤝 Getting Help

- Check existing documentation in this README and linked files
- Review Swagger API documentation at `/api`
- Check Confluence for project-wide documentation
- Ask team members in project channels
- Review closed issues and PRs for similar problems

## 👥 For New Interns

Welcome to SaveThePlate! Here's a recommended learning path:

1. **Week 1: Setup & Understanding**
   - Set up your development environment
   - Run the project locally
   - Explore the API via Swagger
   - Read through the codebase structure
   - Understand the database schema

2. **Week 2: First Tasks**
   - Fix a small bug or add a simple feature
   - Write tests for your changes
   - Create your first PR
   - Get familiar with the code review process

3. **Ongoing: Learn Best Practices**
   - Study NestJS documentation
   - Learn Prisma ORM patterns
   - Understand REST API design
   - Practice test-driven development

**Useful Resources:**
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated:** January 2026
