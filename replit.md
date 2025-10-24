# Culture Forward API

## Overview
The Culture Forward API is a NodeJS Express.js backend for a recruitment and job matching platform. It connects job candidates with recruiters through a mobile-friendly application, featuring email/password authentication, role-specific dashboards, and a personality assessment system for intelligent job matching. The project aims to provide a seamless and efficient job search and recruitment experience, emphasizing transparency with AI disclosures and robust security.

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

## System Architecture

The API follows a layered architecture: `Routes → Controllers → Services → Repositories → Database`.

### UI/UX Decisions
- Mobile-first responsive design.
- Minimal, professional design system with a warm neutral color palette.
- Clean aesthetic with white cards and subtle shadows.
- Touch-friendly buttons (48px minimum tap targets).
- Real-time form validation and robust error handling.
- Role-based content display for Candidate and Recruiter dashboards.

**Design Tokens:**
- Primary Color: `#2C2C2C` (Charcoal Gray)
- Primary Hover: `#1a1a1a` (Dark Gray)
- Accent Color: `#8B7355` (Warm Brown)
- Background: `#FAF8F6` (Warm Off-White)
- Text Primary: `#2C2C2C` (Charcoal)
- Text Secondary: `#6B6B6B` (Medium Gray)
- Border: `#E8E8E8` (Light Gray)
- Card Background: `#FFFFFF` (White)
- Shadows: Soft, minimal for professional look

### Technical Implementations
- **Tech Stack**: Node.js 20.x with Express 5.x, MongoDB native driver.
- **Authentication**: JWT-based authentication for secure token-based sessions, supporting email/password and role-based access control (CANDIDATE, RECRUITER), including secure password reset. Enforces JWT secret validation, prevents role escalation, and includes OAuth nonce validation for CSRF protection and rate limiting.
- **Static File Serving**: Express serves static HTML, CSS, and JS files for the frontend.
- **File Uploads**: Secure profile photo and video uploads integrated with Supabase storage, featuring comprehensive file validation (MIME type, extension, size limits, category).
- **DISC Assessment System**: A 15-question personality assessment based on the DISC framework, with intelligent scoring and 10 personality profiles for tailored job recommendations.
- **Job Posting**: Recruiters can create and import job postings with comprehensive details and skill management.
- **Company Management**: Recruiters can view and create company profiles, with AI-powered lookup for company details.
- **API Versioning**: All API routes use `/api/v1` prefix.
- **AI Disclosure**: Prominent AI-powered platform notice on the signup page with acknowledgement checkbox requirement.

### Feature Specifications
- **Candidate Dashboard**: Features include browsing job postings, viewing matched job opportunities, taking/retaking personality assessments, and managing profile information. New candidates are prompted to complete the DISC assessment on first login.
- **Recruiter Dashboard**: Features include listing posted job positions, viewing prospect candidates, viewing matched candidates, managing profile information with job/match statistics, company profile management, and job creation/import.
- **Core Functionality**: User registration, login, job posting, candidate matching, and assessment management.

### System Design Choices
- **File Structure**: Organized with clear separation of concerns (`config/`, `controllers/`, `di/`, `infrastructure/`, `middleware/`, `models/`, `repositories/`, `services/`, `utils/`).
- **Module System**: Standardized on ES modules.
- **Configuration**: Centralized configuration management with validation.
- **Repository Pattern**: Implemented for data access layer using MongoDB models.
- **Dependency Injection**: Utilizes a DI container for managing service dependencies.
- **Error Handling**: Comprehensive error handling distinguishing between network errors, 404s, and server-side issues. Includes centralized error handling middleware, AppError class, and environment-aware messages.
- **Security Middleware**: Rate limiting (express-rate-limit), file upload validation, OAuth CSRF protection, and Helmet.js for security headers.
- **Deployment**: Configured for DigitalOcean App Platform with automated builds and deployments.
- **Migration**: Complete migration from Prisma ORM to MongoDB native driver, leveraging batch loading and efficient query patterns to prevent N+1 queries.
- **Standardized Response Format**: All API responses follow a consistent `ApiResponse` utility structure for success and error messages.
- **Health Checks**: Dedicated endpoints for basic, detailed, readiness, and liveness probes.
- **Graceful Shutdown**: Implemented signal handlers for clean server and database connection termination.
- **Pagination Standards**: Centralized defaults for page and page size, with a maximum page size.
- **Environment Configuration Validation**: Comprehensive validation of all environment variables on startup.
- **Database Index Management**: Automated index creation on server startup for performance.
- **MongoDB Injection Protection**: Global query sanitization middleware to prevent operator injection and sanitize user input.
- **Session Management**: Implemented a refresh token system with short-lived access tokens and long-lived refresh tokens, token rotation, session tracking, and revocation capabilities stored in MongoDB.

## External Dependencies

- **Database**: MongoDB (Digital Ocean managed database).
- **Database Driver**: Native MongoDB driver.
- **Hosting**: Digital Ocean App Platform.
- **File Storage**: Supabase storage for profile photo and video uploads.
- **Bot Protection**: Simple AI acknowledgement checkbox.
- **Security**: express-rate-limit for API rate limiting.