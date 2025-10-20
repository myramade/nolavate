# Culture Forward API

## Project Overview
A NodeJS Express.js API for the Culture Forward application - a recruitment and job matching platform.

**Tech Stack:**
- Node.js 20.x with Express 5.x
- MongoDB database (via Prisma ORM)
- JWT Authentication
- Digital Ocean hosting

## Recent Changes (October 2025)

### Fixed DigitalOcean Deployment Error
**Date:** October 20, 2025

Fixed critical production deployment issue causing "Internal server error" during user registration:

**Problem:**
- Users could sign up locally but got 500 errors on DigitalOcean production
- Missing `JWT_SECRET` environment variable in production
- Error messages weren't descriptive enough for debugging

**Solution:**
- Added `JWT_SECRET` to `.do/app.yaml` configuration
- Improved error logging for development environments
- Created comprehensive deployment guide (`DEPLOYMENT_GUIDE.md`)
- JWT_SECRET must be manually set in DigitalOcean App Platform settings

**What to do:**
1. Generate secure JWT secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Add to DigitalOcean: Settings → Environment Variables → Add `JWT_SECRET`
3. App will auto-redeploy and sign-up will work

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

### Mobile-Friendly Frontend with OAuth Integration
**Date:** October 20, 2025

Added a complete mobile-responsive frontend with Google and Apple OAuth authentication:

**What was added:**
- Mobile-friendly sign-up page (`public/index.html`) with Google and Apple sign-in buttons
- Mobile-friendly login page (`public/login.html`)
- Responsive CSS with modern gradient design (`public/css/styles.css`)
- Complete authentication flow with OAuth integration (`public/js/auth.js`)
- Backend Google OAuth endpoint (`POST /auth/google`)
- Backend Apple Sign-In endpoint (`POST /auth/apple`)
- Dashboard pages for candidates and recruiters
- Static file serving from Express

**Features:**
- ✅ Mobile-first responsive design (works perfectly on all devices)
- ✅ Google OAuth integration with ID token verification
- ✅ Apple Sign-In integration with authorization code exchange
- ✅ Email/Password traditional authentication
- ✅ Role selection (Candidate vs Recruiter)
- ✅ Beautiful gradient UI with smooth animations
- ✅ Touch-friendly buttons (48px minimum tap targets)
- ✅ Password show/hide toggle
- ✅ Real-time form validation
- ✅ Success/error notifications
- ✅ Automatic redirect to role-specific dashboards

**OAuth Setup:**
- See `OAUTH_SETUP.md` for complete configuration instructions
- Requires `GOOGLE_CLIENT_ID` for Google OAuth
- Requires `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` for Apple Sign-In

### Database Connection Fixed - MongoDB Integrated
**Date:** October 20, 2025

Fixed critical database connectivity issue by wiring real MongoDB models to the API:

**What was fixed:**
- Created MongoDB connection service (`src/services/mongodb.js`)
- Built 12 MongoDB model classes with CRUD operations
- Updated legacy container to use real database models instead of mocks
- All API endpoints now persist data to MongoDB database
- Authentication (register/login) verified working with real data persistence

**Testing Results:**
- ✅ User registration saves to database
- ✅ User login retrieves from database
- ✅ JWT authentication working correctly
- ✅ Database connection established on startup

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
├── models/             # MongoDB models (BaseModel + 12 collections)
├── repositories/       # Data access layer
│   ├── assessment.repository.js
│   ├── personality.repository.js
│   └── user.repository.js
├── services/           # Database connections
│   ├── database.js     # Prisma client (for future migration)
│   ├── mongodb.js      # MongoDB connection (active)
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
- **JWT-based authentication** - Secure token-based auth
- **OAuth Integration** - Google and Apple sign-in support
- **Email/Password** - Traditional authentication method
- **Role-based access control** - USER, CANDIDATE, RECRUITER, ADMIN
- **Frontend Pages:**
  - `/` or `/index.html` - Sign-up page
  - `/login.html` - Login page
  - `/candidate/dashboard.html` - Candidate dashboard
  - `/recruiter/dashboard.html` - Recruiter dashboard
- **Configurable token expiration**

### Database
- **Provider**: MongoDB (Digital Ocean managed database)
- **Driver**: Native MongoDB driver
- **Models**: 12 collections (User, Post, Company, JobOffer, Match, Assessment, AssessmentQuestions, Personality, PostLikes, PostViews, Notifications, Transcriptions, JobSkill)
- **Connection**: Graceful connection with fallback to mock mode if unavailable
- **Architecture**: BaseModel class with CRUD operations extended by all models

## Environment Variables

### Required for Production

These MUST be set in DigitalOcean App Platform (Settings → Environment Variables):

```bash
# Authentication (REQUIRED - app won't work without this)
JWT_SECRET=<64-char-random-hex>    # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Database (REQUIRED)
DATABASE_URL=mongodb+srv://...      # MongoDB connection string from Atlas or DigitalOcean
```

### Automatic (Already Configured)

These are set automatically in `.do/app.yaml`:

```bash
NODE_ENV=production                # Environment mode
PORT=8080                         # Server port (DigitalOcean uses 8080)
```

### Optional (For OAuth Features)

Only needed if using Google/Apple sign-in:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com  # From Google Cloud Console

# Apple Sign-In  
APPLE_CLIENT_ID=com.yourcompany.app              # Apple Service ID
APPLE_TEAM_ID=ABC123                             # Apple Team ID
APPLE_KEY_ID=XYZ789                              # Apple Key ID
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY..."    # Apple Private Key (.p8)
```

### Development Only

These are for local Replit development (stored in Replit Secrets):

```bash
PORT=5000                          # Replit uses 5000
NODE_ENV=development               # Development mode
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

### Frontend Pages
- `/` or `/index.html` - Sign-up page (mobile-friendly)
- `/login.html` - Login page (mobile-friendly)
- `/candidate/dashboard.html` - Candidate dashboard
- `/recruiter/dashboard.html` - Recruiter dashboard

### API Routes
- `/health` - Health check
- `/api` - API information
- `/auth/register` - Email/password registration
- `/auth/login` - Email/password login
- `/auth/google` - Google OAuth authentication
- `/auth/apple` - Apple Sign-In authentication
- `/assessment` - Personality assessments
- `/candidate` - Candidate operations
- `/joboffers` - Job offers
- `/matches` - Job matches
- `/posts` - Job posts
- `/prospects` - Candidate prospects
- `/recruiter` - Recruiter operations
- `/web` - Web/company management

## Next Steps

### Immediate Actions:
1. **Configure OAuth** - Set up Google and Apple OAuth credentials (see `OAUTH_SETUP.md`)
2. **Test Authentication** - Verify all three auth methods work (email, Google, Apple)
3. **Deploy to Production** - Update OAuth settings for production domains

### Planned Improvements:
1. Complete controller refactoring (move business logic to services)
2. Add comprehensive error handling
3. Implement proper logging with Winston
4. Add API documentation (Swagger/OpenAPI)
5. Write unit and integration tests
6. Add request validation schemas
7. Build out full candidate/recruiter dashboards
8. Add profile management features
9. Implement password reset functionality

## Support & Documentation

### Project Documentation
- `OAUTH_SETUP.md` - Complete guide for configuring Google and Apple OAuth
- `replit.md` - This file (project overview and architecture)

### External Resources
- [Prisma Docs](https://www.prisma.io/docs/)
- [Express.js Docs](https://expressjs.com/)
- [Digital Ocean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Google Sign-In Docs](https://developers.google.com/identity/gsi/web)
- [Apple Sign-In Docs](https://developer.apple.com/sign-in-with-apple/)

---

Last Updated: October 20, 2025
