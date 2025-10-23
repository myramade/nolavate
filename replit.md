# Culture Forward API

## Overview
The Culture Forward API is a NodeJS Express.js backend for a recruitment and job matching platform. It connects job candidates with recruiters through a robust, mobile-friendly application, supporting email/password authentication and offering role-specific dashboards. The platform integrates a personality assessment system for job matching and aims to provide a seamless and efficient job search and recruitment experience. The project emphasizes transparency with AI disclosures and security with reCAPTCHA integration.

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
- Mobile-first responsive design for all frontend pages (sign-up, login, dashboards).
- Minimal, professional design system with warm neutral color palette.
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
- **Tech Stack**: Node.js 20.x with Express 5.x, MongoDB native driver (Prisma fully removed).
- **Authentication**: JWT-based authentication for secure token-based sessions, supporting email/password and role-based access control (CANDIDATE, RECRUITER). Includes secure password reset functionality.
- **Static File Serving**: Express serves static HTML, CSS, and JS files for the frontend.
- **API Utilities**: Shared JavaScript utilities for API calls, authentication, error handling, and formatting on the client-side.
- **File Uploads**: Secure profile photo and video uploads integrated with Supabase storage.
- **DISC Assessment System**: Comprehensive personality assessment based on DISC framework (Dominance, Influence, Steadiness, Conscientiousness). Features 15 trait-mapped questions with 5-point Likert scale, intelligent scoring algorithm, and 10 personality profiles (4 pure types + 6 combination types) with tailored job recommendations.
- **Job Posting**: Recruiters can create and import job postings with comprehensive details and skill management.
- **Company Management**: Recruiters can view and create company profiles, with AI-powered lookup for company details.
- **API Versioning**: All API routes use `/api/v1` prefix for versioning, maintaining backward compatibility.
- **AI Disclosure**: Prominent AI-powered platform notice on the signup page with acknowledgement checkbox requirement.

### Feature Specifications
- **Candidate Dashboard**: Features include browsing job postings, viewing matched job opportunities with scores, taking/retaking personality assessments, and managing profile information.
- **Recruiter Dashboard**: Features include listing posted job positions, viewing prospect candidates, viewing matched candidates, and managing profile information with job/match statistics, company profile management, and job creation/import.
- **Core Functionality**: User registration, login, job posting, candidate matching, and assessment management.

### System Design Choices
- **File Structure**: Organized with clear separation of concerns: `config/`, `controllers/`, `di/`, `infrastructure/`, `middleware/`, `models/`, `repositories/`, `services/`, `utils/`.
- **Module System**: Standardized on ES modules.
- **Configuration**: Centralized configuration management in `src/config/`.
- **Repository Pattern**: Implemented for data access layer using MongoDB models.
- **Dependency Injection**: Utilizes a DI container for managing service dependencies.
- **Error Handling**: Comprehensive error handling distinguishing between network errors, 404s, and server-side issues, providing user-friendly messages.
- **Deployment**: Configured for DigitalOcean App Platform with automated builds and deployments.

## External Dependencies

- **Database**: MongoDB (Digital Ocean managed database).
- **Database Driver**: Native MongoDB driver (v6.18.0) - Prisma completely removed.
- **Hosting**: Digital Ocean App Platform.
- **File Storage**: Supabase storage for profile photo and video uploads.
- **Bot Protection**: Simple AI acknowledgement checkbox (replaced reCAPTCHA).

## Recent Updates (October 2025)

### MongoDB Migration Phase 1 Complete (October 23, 2025)
- **Successfully Migrated 5 Controllers** from Prisma ORM to MongoDB native driver syntax
- **Architect Reviewed & Approved**: All Phase 1 controllers production-ready
- **Controllers Fixed**:
  1. `postViews.js` - User view tracking with atomic increments
  2. `updatePost.js` - Job post updates with ownership verification
  3. `getCompany.js` - Company profile retrieval with logo transformation
  4. `updateCompany.js` - Company updates with employerId field
  5. `deleteCompany.js` - Secure company deletion with ownership checks
- **Migration Pattern**: Replace Prisma nested relations (connect/is/select) with direct ObjectId fields, separate queries for relations, and full response serialization
- **Status**: Server running successfully, no errors. 5/30 controllers migrated (17% complete)
- **Remaining Work**: ~25 complex controllers with deeply nested Prisma queries (5+ levels) still need migration using multi-query aggregation pattern

## Recent Updates (October 2025)

### DISC Assessment Module Implementation
- **Replaced** generic 20-question assessment with scientifically-backed 15-question DISC personality framework
- **New Question Format**: "Definitely not" (1) → "Definitely me" (5) Likert scale
- **Personality Profiles**: 10 comprehensive profiles with job recommendations:
  - Pure Types: D (Trailblazing Leader), I (Charismatic Communicator), S (Reliable Supporter), C (Analytical Strategist)
  - Combination Types: DI (Dynamic Innovator), DS (Grounded Pioneer), DC (Tactical Executive), IS (Engaging Motivator), IC (Creative Persuader), SC (Dependable Facilitator)
- **Scoring Algorithm**: Trait-based scoring with normalized 0-100 scores, intelligent personality type detection
- **Database Seeds**: Scripts for populating questions (`scripts/seeds/assessmentQuestions.js`) and profiles (`scripts/seeds/personalityProfiles.js`)
- **Bug Fixes**: Resolved ID type mismatch, fixed MongoDB projections, added comprehensive error handling

### Password Reset Implementation (October 23, 2025)
- **Fixed** forgot password functionality - reset tokens now properly saved to database
- **Enhanced** reset link visibility in Replit environment (logs displayed in console during development)
- **Corrected** BaseModel API calls in auth controllers (`update(id, data)` instead of `update({_id}, data)`)
- **Verified** complete flow: request reset → receive token → reset password → login with new credentials

### Recruiter Module MongoDB Migration (October 23, 2025)
- **Critical Fix**: Completely refactored all recruiter controllers from Prisma ORM syntax to native MongoDB driver syntax
- **ID Type Mismatch Resolution**: Added ObjectId coercion for all user/post/company ID comparisons to prevent silent query failures
- **Fixed Controllers**:
  - `getProspects.js`: Converted nested Prisma queries to MongoDB, fixed req.body/req.query mismatch, added ObjectId wrapping
  - `getMyMatches.js`: Replaced Prisma syntax with MongoDB queries, added proper ObjectId handling for candidate/recruiter IDs
  - `getPostByUser.js`: Simplified to use MongoDB native queries with ObjectId conversion for userId
  - `createCompany.js`: Removed Prisma connect/create syntax, now uses direct field assignments with ObjectId for profileOwnerId and employerId
  - `createCompanyV2.js`: Converted Perplexity AI integration to MongoDB syntax with proper ObjectId handling
- **BaseModel Enhancement**: Added `findManyAnd()` method for MongoDB $and queries (previously missing)
- **Impact**: Resolved internal server errors that prevented recruiters from viewing prospects, matches, job posts, and creating companies
- **Note**: All MongoDB queries now properly convert string IDs from JWT tokens to ObjectId before database operations

### Candidate Module MongoDB Migration (October 23, 2025)
- **Critical Access Control Fix**: Fixed `/api/v1/web/profile` endpoint middleware to allow candidates (was recruiter-only)
  - Previously candidates could NOT upload profile photos/videos due to incorrect middleware restriction
  - Now both candidates and recruiters can upload media to their profiles
- **Video Upload Enhancement**: Increased video file limit from 10MB to 100MB to support ~5 minute videos at reasonable quality
- **ObjectId Serialization**: All candidate controllers now properly serialize MongoDB ObjectId instances to strings before sending to clients
  - Added defensive serialization helpers to prevent client-side JSON parsing errors
  - Affects: `updateUserProfile.js`, `uploadOnboardingMedia.js`, `respondToJobOffer.js`
- **Fixed Controllers**:
  - `updateUserProfile.js`: Removed Prisma select syntax, added `serializeId()` helper for string conversion
  - `uploadOnboardingMedia.js`: Converted to MongoDB, added ObjectId serialization for resourceId
  - `respondToJobOffer.js`: Safe ID extraction with defensive coding, recursive `serializeResponse()` for all nested ObjectIds
  - `getOnboardingMedia.js`: Separated complex Prisma nested queries into simple MongoDB queries (user query + transcriptions query)
- **Impact**: Candidates can now fully manage their profiles with photo/video uploads, respond to job offers, and use all dashboard features
- **Status**: All candidate dashboard features operational and architect-approved

### Prisma Complete Removal (October 23, 2025)
- **Complete Migration to MongoDB Native Driver**: Removed all Prisma ORM dependencies and code from the codebase
- **Deleted Components**:
  - `@prisma/client` package uninstalled from dependencies
  - `prisma/` directory with schema files removed
  - `src/di/container.js` (old Prisma-based DI container) removed
  - `src/repositories/` directory (Prisma-based repository pattern) removed
  - `src/services/database.js` (Prisma client connection) removed
  - Build scripts (`prisma generate`) removed from package.json
- **Updated Components**:
  - `src/index.js`: Now uses only the MongoDB container
  - `src/controllers/posts/index.js`: Updated to import from MongoDB container
  - All controller model references use `models/transcription` (singular, matching container registry)
- **Impact**: Cleaner codebase, no ORM overhead, direct MongoDB operations throughout
- **Status**: Server running successfully with MongoDB native driver only

### Authentication ObjectId Serialization Fix (October 23, 2025)
- **Critical Production Bug Fix**: Fixed internal server error on registration endpoint in production (Digital Ocean)
- **Root Cause**: MongoDB ObjectId instances were being returned directly in JSON responses and JWT tokens, causing serialization failures
- **Fixed Endpoints**:
  - `POST /api/v1/auth/register` - User registration with email/password
  - `POST /api/v1/auth/login` - User login
  - `POST /api/v1/auth/google` - Google OAuth authentication
  - `POST /api/v1/auth/apple` - Apple Sign-In authentication
  - `POST /api/v1/auth/forgot-password` - Password reset token generation
- **Solution**: All ObjectId instances now converted to strings using `.toString()` before:
  - Inclusion in JWT token `sub` claim
  - Inclusion in API response `user.id` field
- **Testing**: Verified registration and login endpoints working correctly with string IDs
- **Impact**: Users can now successfully register and login on production (Digital Ocean deployment)