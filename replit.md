# Culture Forward API

## Overview
The Culture Forward API is a NodeJS Express.js backend for a recruitment and job matching platform. It aims to connect job candidates with recruiters through a robust, mobile-friendly application. The platform supports email/password authentication, offers role-specific dashboards, and integrates a personality assessment system for intelligent job matching. The project's vision is to provide a seamless and efficient job search and recruitment experience, emphasizing transparency with AI disclosures and security.

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
- **Authentication**: JWT-based authentication for secure token-based sessions, supporting email/password and role-based access control (CANDIDATE, RECRUITER), including secure password reset.
  - **Security Hardening (Oct 24, 2025)**: JWT secret validation enforced at startup (minimum 32 characters), role escalation prevention (server-side role assignment only), OAuth nonce validation for CSRF protection, rate limiting on all auth endpoints.
- **Static File Serving**: Express serves static HTML, CSS, and JS files for the frontend.
- **File Uploads**: Secure profile photo and video uploads integrated with Supabase storage.
  - **Security Hardening (Oct 24, 2025)**: Comprehensive file validation with MIME type whitelisting, extension validation, size limits (10MB resumes, 100MB media), and category validation.
- **DISC Assessment System**: A 15-question personality assessment based on the DISC framework, featuring intelligent scoring and 10 personality profiles with tailored job recommendations.
- **Job Posting**: Recruiters can create and import job postings with comprehensive details and skill management.
- **Company Management**: Recruiters can view and create company profiles, with AI-powered lookup for company details.
- **API Versioning**: All API routes use `/api/v1` prefix.
- **AI Disclosure**: Prominent AI-powered platform notice on the signup page with acknowledgement checkbox requirement.

### Feature Specifications
- **Candidate Dashboard**: Features include browsing job postings, viewing matched job opportunities, taking/retaking personality assessments, and managing profile information.
  - **Assessment Onboarding**: New candidates are automatically prompted to complete the DISC assessment on first login with a friendly welcome screen. A persistent banner reminds users who haven't completed it. Results display prominently in a personality summary widget within the Jobs tab.
- **Recruiter Dashboard**: Features include listing posted job positions, viewing prospect candidates, viewing matched candidates, managing profile information with job/match statistics, company profile management, and job creation/import.
- **Core Functionality**: User registration, login, job posting, candidate matching, and assessment management.

### System Design Choices
- **File Structure**: Organized with clear separation of concerns (`config/`, `controllers/`, `di/`, `infrastructure/`, `middleware/`, `models/`, `repositories/`, `services/`, `utils/`).
- **Module System**: Standardized on ES modules.
- **Configuration**: Centralized configuration management in `src/config/` with validation (JWT_SECRET required and minimum length enforced).
- **Repository Pattern**: Implemented for data access layer using MongoDB models.
- **Dependency Injection**: Utilizes a DI container for managing service dependencies.
- **Error Handling**: Comprehensive error handling distinguishing between network errors, 404s, and server-side issues.
- **Security Middleware**: Rate limiting (express-rate-limit), file upload validation, OAuth CSRF protection.
- **Deployment**: Configured for DigitalOcean App Platform with automated builds and deployments.

## Migration Status

### MongoDB Migration Progress: 23/23 Controllers (100% COMPLETE) ✅

**Phase 1 - Authentication (4 controllers):** ✅ Complete
- signup.js, signin.js, forgotPassword.js, resetPassword.js

**Phase 2 - User Management (3 controllers):** ✅ Complete  
- getUser.js, updateUser.js, deleteUser.js

**Phase 3 - Job Posting (4 controllers):** ✅ Complete
- createPost.js, getPostsForCandidate.js, getPostById.js, getPostsForRecruiters.js
- Implemented batch loading patterns to prevent N+1 queries
- Complex nested relations converted to efficient Map-based lookups

**Phase 4 - Matching & Likes (3 controllers):** ✅ Complete (Oct 24, 2025)
- postLikes.js: Candidate likes/unlikes with 6 match state flows
- likeCandidate.js: Recruiter likes with postId-based initiator detection
- submitAssessment.js: Cleanup (removed 117 lines of dead Prisma code)
- **Critical invariant:** matchCount only increments/decrements for accepted matches
- **Match detection:** postId presence indicates candidate-initiated match
- All flows architect-approved as production-ready

**Phase 5 - Match Retrieval (2 controllers):** ✅ Complete (Oct 24, 2025)
- getMatchById.js: Single match details with 3-level batch loading (candidate, recruiter, post → media, personality, company)
- getMatchesByPostId.js: All matches for a job post with INFO media filtering and 4-level nested batch loading
- **ObjectId preservation:** Keep BSON instances throughout batch loading (no string conversion overhead)
- **Filtering logic:** Candidates must have at least one INFO category media (intro video requirement)
- **Performance:** Multi-level parallel batching with Map-based O(1) lookups prevents N+1 queries
- Architect-approved as production-ready

**Phase 6 - Advanced Features (2 controllers):** ✅ Complete (Oct 24, 2025)
- metrics.js: Recruiter dashboard analytics with date-based aggregations (TODAY/WEEK/MONTH)
- getPostsByCompany.js: Company job posts with comments (10 most recent per post), likes, personalities
- **Complex batching:** Multi-level parallel queries with per-post comment sorting and limiting
- **ObjectId validation:** All user inputs validated with toObjectId() before queries
- **Date handling:** MongoDB date ranges with dayjs integration
- Architect-approved as production-ready

**Migration Complete:** All Prisma ORM code has been successfully migrated to MongoDB native driver with improved performance through batch loading and efficient query patterns.

### Key Migration Patterns
- Replace Prisma connect/is/select with direct ObjectId fields
- Batch-load relations using Maps/Sets and Promise.all()
- Preserve ObjectId instances in collections (avoid toString/reconstruction)
- Validate all ObjectIds with toObjectId() before queries (return 400 on invalid)
- Use container.make() with exact model registry names (singular except 'postlikes')
- Performance: Prevent N+1 queries via bulk $in queries with Map lookups
- Multi-level batching: Load dependent data in sequential Promise.all rounds
- Per-entity sorting/limiting: Group first, sort within groups, then limit (e.g., comments per post)

## Security Hardening (October 24, 2025)

### Critical Fixes Implemented
1. **JWT Secret Validation**: Removed hardcoded default "your-secret-key", enforced minimum 32-character length, server fails fast if JWT_SECRET is missing.
2. **Role Escalation Prevention**: Removed client-supplied role/roleSubtype from registration and OAuth flows, all new users default to USER/CANDIDATE.
3. **OAuth CSRF Protection**: Added nonce validation for Google and Apple OAuth flows to prevent CSRF and replay attacks.
4. **File Upload Security**: 
   - MIME type whitelisting (PDF/DOCX for resumes, MP4/WEBM for videos, JPEG/PNG for images)
   - File extension validation
   - Size limits enforced (10MB resumes, 100MB media)
   - Category validation for media uploads (INFO, EDUCATION, EXPERIENCE, INTERESTS)
5. **Rate Limiting**: 
   - Auth endpoints: 5 requests per 15 minutes
   - Password reset: 3 requests per hour
   - General API: 100 requests per 15 minutes
   - Failed login protection with account lockout

### Security Middleware
- `src/middleware/rateLimiter.js`: Rate limiting for auth and general API endpoints
- `src/middleware/fileUploadValidation.js`: Comprehensive file upload validation
- OAuth nonce/state validation in auth controllers
- Helmet.js for security headers (CSP, XSS protection, etc.)
- CORS with origin validation

### Input Validation (October 24, 2025)
- **Schema-based Validation**: Zod schemas for all auth endpoints (register, login, OAuth, password reset)
- **Structured Error Messages**: Clear, field-level validation errors with 400 status codes
- **Validation Middleware**: `validateSchema`, `validateQuery`, `validateParams` for comprehensive input sanitization
- **Safe ObjectId Conversion**: All ObjectId conversions use `safeObjectId`/`requireObjectId` to prevent 500 errors on invalid IDs

### Session Management (October 24, 2025)
- **Refresh Token System**: Short-lived access tokens (15 minutes) + long-lived refresh tokens (7 days)
- **Token Rotation**: Automatic refresh token rotation on token refresh for enhanced security
- **Session Tracking**: Device info (user agent, IP) tracked for all sessions
- **Session Revocation**: Individual session logout and "logout from all devices" functionality
- **Database-backed Sessions**: Sessions stored in MongoDB for persistence and revocation support

### New Endpoints (October 24, 2025)
- `POST /api/v1/auth/refresh`: Refresh access token using refresh token
- `POST /api/v1/auth/logout`: Logout and revoke refresh token
- `GET /api/v1/auth/sessions`: Get all active sessions for current user
- `POST /api/v1/auth/sessions/revoke-all`: Logout from all devices

## External Dependencies

- **Database**: MongoDB (Digital Ocean managed database).
- **Database Driver**: Native MongoDB driver.
- **Hosting**: Digital Ocean App Platform.
- **File Storage**: Supabase storage for profile photo and video uploads.
- **Bot Protection**: Simple AI acknowledgement checkbox.
- **Security**: express-rate-limit for API rate limiting.