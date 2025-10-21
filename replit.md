# Culture Forward API

## Overview
The Culture Forward API is a NodeJS Express.js backend for a recruitment and job matching platform. Its primary purpose is to connect job candidates with recruiters through a robust, mobile-friendly application. The platform supports email/password authentication, offers role-specific dashboards for candidates and recruiters, and integrates a personality assessment system for job matching. The project aims to provide a seamless and efficient job search and recruitment experience.

## Recent Changes (October 2025)

### Assessment Feature Fully Working
**Date:** October 21, 2025

Implemented complete personality assessment system with mock data support:

**What works:**
- ✅ 20-question personality assessment questionnaire
- ✅ Assessment submission with answer processing
- ✅ Personality type calculation (ENFP - "The Champion")
- ✅ Results display with strengths, values, and recommended jobs
- ✅ In-memory storage when MongoDB is offline
- ✅ API routes now use `/api/v1` prefix for consistency
- ✅ Proper 404 handling for users who haven't taken assessment

**API Endpoints:**
- `GET /api/v1/assessment/questions` - Returns 20 assessment questions
- `POST /api/v1/assessment/submit` - Submits answers and returns personality results
- `GET /api/v1/assessment/results` - Retrieves saved assessment results

**Technical Details:**
- Added in-memory storage to BaseModel for offline database functionality
- Mock personality data includes: title, detail, strengths, values, recommendedJobs, companyCulture
- Frontend properly handles 404 (no assessment) vs other errors
- Assessment results persist across requests until server restart

### Recruiter Job Creation & Import
**Date:** October 21, 2025

Implemented complete job posting system for recruiters with creation and import functionality:

**What works:**
- ✅ Simplified job creation form without video requirement
- ✅ Complete job details: title, description, location, employment type, salary range
- ✅ Skills management (required and optional, up to 4 each)
- ✅ Experience and education level selection
- ✅ Benefits and application URL fields
- ✅ Job import from URL (returns mock data - web scraping to be implemented)
- ✅ Import pre-fills creation form for review/editing
- ✅ Proper offline database handling with clear error messages

**API Endpoints:**
- `POST /api/v1/posts/create-simple` - Create job posting without video (requires database connection)
- `POST /api/v1/posts/import` - Import job details from URL (mock data for now)
- `POST /api/v1/posts/create` - Original endpoint (requires video upload)

**Technical Details:**
- createSimplePost validates recruiter has company profile before posting
- Salary compensation properly saved from minSalary/maxSalary fields
- Returns 503 when database offline (job creation requires MongoDB)
- Import endpoint returns mock job data for testing
- UI switches between import, create, and list views seamlessly

**Future Enhancements:**
- Implement actual web scraping for job import using AI/LLM
- Add job edit functionality
- Add job deletion with confirmation
- Improve offline mode with local draft storage

### Recruiter Profile Management
**Date:** October 21, 2025

Implemented complete recruiter profile system with company management:

**What works:**
- ✅ Personal profile display (name, email, role, stats)
- ✅ Company profile viewing with all details (logo, website, industry, description, location, employees, tech stack, culture)
- ✅ Company creation using AI-powered lookup (via `/api/v1/web/company/v2`)
- ✅ Graceful handling when no company profile exists
- ✅ Stats dashboard (posted jobs count, matches count)

**API Endpoints:**
- `GET /api/v1/web/company/me` - Get current recruiter's company profile
- `POST /api/v1/web/company/v2` - Create company using AI lookup (no file upload required)
- `GET /api/v1/web/company?id=X` - Get specific company by ID
- `PUT /api/v1/web/company` - Update company (requires FormData with logo upload)

**Technical Details:**
- New getMyCompany controller finds company by profileOwnerId
- Recruiter dashboard profile tab displays both personal and company info
- Company creation uses Perplexity AI to auto-fill company details
- Editing company logo requires API call with FormData (noted in UI)
- Works with mock data when MongoDB is offline

**Future Enhancements:**
- Replace prompt with modal form for company creation
- Full edit UI with FormData handling for logo uploads
- Better offline mode messaging

### API Routes Updated with /api/v1 Prefix
**Date:** October 21, 2025

All API routes now support the `/api/v1` prefix for proper versioning:
- Assessment endpoints: `/api/v1/assessment/*`
- Auth endpoints: `/api/v1/auth/*`
- Posts endpoints: `/api/v1/posts/*`
- Matches endpoints: `/api/v1/matches/*`
- Web endpoints (company): `/api/v1/web/*`
- All other endpoints follow the same pattern

Backward compatibility maintained - old routes without `/api/v1` still work.

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
- Modern gradient UI with smooth animations.
- Touch-friendly buttons (48px minimum tap targets).
- Real-time form validation and robust error handling.
- Role-based content display for Candidate and Recruiter dashboards.

### Technical Implementations
- **Tech Stack**: Node.js 20.x with Express 5.x.
- **Authentication**: JWT-based authentication for secure token-based sessions. Supports email/password authentication. Role-based access control (CANDIDATE, RECRUITER).
- **Static File Serving**: Express serves static HTML, CSS, and JS files for the frontend.
- **API Utilities**: Shared JavaScript utilities for API calls, authentication, error handling, and formatting on the client-side.
- **Assessment Flow**: Interactive personality assessment with question retrieval, submission, and result display.

### Feature Specifications
- **Candidate Dashboard**: Features include browsing job postings, viewing matched job opportunities with scores, taking/retaking personality assessments, and managing profile information.
- **Recruiter Dashboard**: Features include listing posted job positions, viewing prospect candidates, viewing matched candidates, and managing profile information with job/match statistics.
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
- **ORM/Driver**: Native MongoDB driver.
- **Hosting**: Digital Ocean App Platform.
- **Authentication (Removed)**: Google and Apple Sign-In (endpoints exist but are unused in the current frontend).