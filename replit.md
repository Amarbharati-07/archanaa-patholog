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
  - `reviews` - Customer reviews with approval workflow
  - `advertisements` - Promotional banners for homepage carousel

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
**Patient Authentication (Email/Password - Primary Method):**
1. Registration: Full name, email (required), phone, password, confirm password, DOB, gender
2. Login: Email and password authentication
3. Password Reset: Email verification with OTP for password reset
4. Server issues JWT token for 7-day sessions

**Legacy Firebase Phone OTP (Still Available):**
- Firebase phone authentication endpoints remain for backward compatibility

**Admin Authentication:**
- Traditional username/password with JWT (24-hour sessions)

**API Endpoints:**
- `POST /api/auth/register-email` - Email/password registration
- `POST /api/auth/login-email` - Email/password login  
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### Key Design Decisions
- **Shared Schema**: Database types are defined once in `shared/schema.ts` and used by both frontend and backend
- **Component Library**: shadcn/ui provides accessible, customizable components without heavy dependencies
- **Drizzle ORM**: Type-safe database queries with PostgreSQL, migrations via `drizzle-kit push`
- **Monorepo Structure**: Single repository with client/server separation but shared code
- **Reviews Workflow**: Customer reviews require admin approval before displaying on homepage
- **Advertisement System**: Dynamic carousel on homepage with admin-configurable promotional banners

## New Features

### Payment Status Tracking
- Comprehensive payment tracking system for bookings with multiple status types:
  - `pending` - Payment not yet made
  - `paid_unverified` - Payment submitted but awaiting admin verification
  - `verified` - Payment confirmed by admin
  - `cash_on_delivery` / `pay_at_lab` - Offline payment methods
- Payment fields tracked: method, amount, transaction ID, payment date, verification timestamp
- **User Dashboard**: Shows payment status badges, method, and verification status for each booking
- **Admin Dashboard**: Payment filtering, full payment details view, and "Verify Payment" button for unverified payments
- **Report Access Control**: Test reports are locked until payment is verified; blocked downloads show a popup message explaining payment requirement
- **Server-side Security**: Download endpoint validates payment status before serving reports

### Customer Reviews
- Visitors can submit reviews via dialog on homepage
- Reviews require admin approval before becoming public
- Admin can approve, reject, or delete reviews from `/admin/reviews`
- Approved reviews display in the customer testimonials section

### Advertisement Management
- Dynamic promotional carousel on homepage
- Admin panel at `/admin/advertisements` for full CRUD management
- Configurable gradient colors, icons, and call-to-action buttons
- Active/inactive toggle for controlling visibility
- Sort order control for carousel sequence

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