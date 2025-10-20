# Culture Forward API

## Project Overview
A NodeJS Express.js API for the Culture Forward application - a recruitment and job matching platform.

**Tech Stack:**
- Node.js 20.x with Express 5.x
- MongoDB database (via Prisma ORM)
- JWT Authentication
- Digital Ocean hosting

## Recent Changes (October 2025)

### File Structure Refactoring - Clean Code Architecture
**Date:** October 20, 2025

Refactored the entire codebase to follow clean code principles with proper separation of concerns:

#### New Directory Structure:
```
src/
├── config/              # Configuration files
│   ├── env.js          # Environment variables
│   ├── logger.js       # Logging configuration
│   └── roles.js        # Role constants
├── controllers/         # Request/response handlers
├── di/                 # Dependency injection
│   └── container.js    # DI container (replaces old mock container)
├── infrastructure/     # Cross-cutting concerns
│   ├── avatar.service.js
│   ├── messaging.service.js
│   ├── notification.service.js
│   └── storage.service.js
├── middleware/         # Express middleware
│   ├── jwtAuth.js
│   └── validateRequest.js
├── models/             # Domain models (legacy)
├── repositories/       # Data access layer
│   ├── assessment.repository.js
│   ├── personality.repository.js
│   └── user.repository.js
├── services/           # Database connection
│   ├── database.js     # Prisma client
│   └── helper.js       # (Legacy - being phased out)
├── utils/              # Pure utility functions
│   ├── array.js
│   ├── async.js
│   ├── date.js
│   ├── object.js
│   └── string.js
└── index.js            # Application entry point
```

#### Key Improvements:
1. **Module System Standardization** - Converted all files to ES modules (removed CommonJS)
2. **Configuration Management** - Centralized config in `src/config/` directory
3. **Utility Organization** - Split monolithic `helper.js` into focused modules
4. **Infrastructure Services** - Separated cross-cutting concerns (notifications, messaging, storage)
5. **Repository Pattern** - Proper data access layer with Prisma repositories
6. **Real Dependency Injection** - Replaced mock container with actual service injection

## Project Architecture

### Layered Architecture
```
Routes → Controllers → Services → Repositories → Database
```

- **Routes**: Define API endpoints and middleware
- **Controllers**: Handle HTTP requests/responses (thin layer)
- **Services**: Business logic and use cases
- **Repositories**: Data access and persistence
- **Database**: Prisma ORM with MongoDB

### Authentication
- JWT-based authentication
- Role-based access control (USER, CANDIDATE, RECRUITER, ADMIN)
- Configurable token expiration

### Database
- **Provider**: MongoDB (Digital Ocean managed database)
- **ORM**: Prisma
- **Models**: User, Assessment, Personality
- **Connection**: Auto-retry with graceful shutdown

## Environment Variables

Required environment variables:
```bash
DATABASE_URL=mongodb+srv://...      # MongoDB connection string
NODE_ENV=development|production     # Environment
PORT=5000                          # Server port
JWT_SECRET=your-secret-key         # JWT signing key
JWT_EXPIRES_IN=7d                  # Token expiration
```

## Deployment

### Digital Ocean App Platform
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Health Check**: `/health` endpoint
- **Auto-deploy**: On push to main branch

Configuration files:
- `.do/app.yaml` - App Platform spec
- `Procfile` - Process commands
- `.dockerignore` - Deployment exclusions

## User Preferences

### Code Style
- ES modules (import/export)
- Clean code principles
- Separation of concerns
- Repository pattern for data access
- Dependency injection over globals

### Development Workflow
- Replit Git panel for version control
- Automated database migrations
- Health check monitoring
- Digital Ocean for production deployment

## API Endpoints

- `/health` - Health check
- `/auth` - Authentication
- `/assessment` - Personality assessments
- `/candidate` - Candidate operations
- `/joboffers` - Job offers
- `/matches` - Job matches
- `/posts` - Job posts
- `/prospects` - Candidate prospects
- `/recruiter` - Recruiter operations
- `/web` - Web/company management

## Next Steps

### Planned Improvements:
1. Complete controller refactoring (move business logic to services)
2. Add comprehensive error handling
3. Implement proper logging with Winston
4. Add API documentation (Swagger/OpenAPI)
5. Write unit and integration tests
6. Add request validation schemas

## Support & Documentation

- [Prisma Docs](https://www.prisma.io/docs/)
- [Express.js Docs](https://expressjs.com/)
- [Digital Ocean App Platform](https://docs.digitalocean.com/products/app-platform/)

---

Last Updated: October 20, 2025
