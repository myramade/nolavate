# Culture Forward API

## Overview
The Culture Forward API is a NodeJS Express.js backend for a recruitment and job matching platform. Its primary purpose is to connect job candidates with recruiters through a robust, mobile-friendly application. The platform supports email/password authentication, offers role-specific dashboards for candidates and recruiters, and integrates a personality assessment system for job matching. The project aims to provide a seamless and efficient job search and recruitment experience.

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