# Archana Pathology Lab

## Overview

A full-stack web application for a pathology laboratory that serves two user types: patients and administrators. Patients can browse diagnostic tests, book appointments (walk-in or home collection), register/login via phone OTP, and view their test reports. Administrators can manage patients, create test reports with lab values, track bookings, and manage the test catalog.

The application follows a healthcare-themed design with sky blue (#87CEEB) as the primary color, emphasizing trust, accessibility, and professionalism.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **Authentication**: Firebase Authentication for phone OTP verification on client side

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Authentication**: JWT tokens for session management, Firebase Admin SDK for token verification
- **Password Hashing**: bcrypt for admin passwords

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Key Tables**:
  - `patients` - Patient records with optional Firebase UID linking
  - `tests` - Diagnostic test catalog with parameters stored as JSONB
  - `results` - Test results linking patients to tests with parameter values
  - `reports` - Generated PDF reports with secure download tokens
  - `bookings` - Test booking appointments
  - `admins` - Admin user accounts
  - `otps` - One-time passwords with TTL

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route pages (home, tests, book, dashboard, admin/*)
    lib/          # Utilities, auth context, Firebase config
server/           # Express backend
  routes.ts       # API endpoint definitions
  storage.ts      # Database access layer
  seed.ts         # Initial test data seeding
shared/           # Shared between client and server
  schema.ts       # Drizzle database schema
```

### Authentication Flow
1. Patient registration/login uses Firebase phone authentication
2. Firebase ID token is verified server-side (when Firebase Admin is configured)
3. Server issues JWT token for subsequent API requests
4. Admin authentication uses traditional username/password with JWT

### Key Design Decisions
- **Shared Schema**: Database types are defined once in `shared/schema.ts` and used by both frontend and backend
- **Component Library**: shadcn/ui provides accessible, customizable components without heavy dependencies
- **Drizzle ORM**: Type-safe database queries with PostgreSQL, migrations via `drizzle-kit push`
- **Monorepo Structure**: Single repository with client/server separation but shared code

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations and schema synchronization

### Authentication Services
- **Firebase Authentication**: Client-side phone OTP authentication
  - Requires `VITE_FIREBASE_*` environment variables for client config
  - Optional `FIREBASE_SERVICE_ACCOUNT_KEY` for server-side token verification

### Email/Notifications (Configured but may need setup)
- **Nodemailer**: Email sending capability (SMTP configuration required)

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - JWT signing secret
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc. - Firebase client configuration
- `FIREBASE_SERVICE_ACCOUNT_KEY` (optional) - Firebase Admin SDK credentials for server-side token verification