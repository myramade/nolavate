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
- Modern gradient UI with smooth animations.
- Touch-friendly buttons (48px minimum tap targets).
- Real-time form validation and robust error handling.
- Role-based content display for Candidate and Recruiter dashboards.

### Technical Implementations
- **Tech Stack**: Node.js 20.x with Express 5.x.
- **Authentication**: JWT-based authentication for secure token-based sessions, supporting email/password and role-based access control (CANDIDATE, RECRUITER). Includes secure password reset functionality.
- **Static File Serving**: Express serves static HTML, CSS, and JS files for the frontend.
- **API Utilities**: Shared JavaScript utilities for API calls, authentication, error handling, and formatting on the client-side.
- **File Uploads**: Secure profile photo and video uploads integrated with Supabase storage.
- **Assessment Flow**: Interactive personality assessment with question retrieval, submission, and result display, including in-memory storage fallback.
- **Job Posting**: Recruiters can create and import job postings with comprehensive details and skill management.
- **Company Management**: Recruiters can view and create company profiles, with AI-powered lookup for company details.
- **API Versioning**: All API routes use `/api/v1` prefix for versioning, maintaining backward compatibility.
- **AI Disclosure**: Prominent AI-powered platform notice on the signup page.
- **Bot Protection**: Google reCAPTCHA v2 integrated into the signup process.

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
- **ORM/Driver**: Native MongoDB driver.
- **Hosting**: Digital Ocean App Platform.
- **File Storage**: Supabase storage for profile photo and video uploads.
- **Bot Protection**: Google reCAPTCHA v2.