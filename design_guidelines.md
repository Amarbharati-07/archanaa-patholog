# Design Guidelines: Archana Pathology Lab

## Design Approach
**Medical/Healthcare Reference-Based Design** — Drawing inspiration from trusted healthcare platforms with emphasis on clarity, trust, and professionalism while maintaining the specified sky blue theme.

## Core Design Principles
1. **Trust & Professionalism**: Clean, clinical aesthetic that instills confidence
2. **Accessibility-First**: Large touch targets, clear labels, high contrast
3. **Efficiency**: Quick access to critical functions (search, reports, bookings)

---

## Color System
**Primary Palette:**
- Sky Blue: `#87CEEB` — Primary brand color, buttons, accents
- White: `#FFFFFF` — Backgrounds, cards, content areas
- Accent Dark: `#005B96` — Headings, button hover states, important text
- Supporting Grays: `#F8F9FA` (subtle backgrounds), `#6C757D` (secondary text), `#E9ECEF` (borders)

**Semantic Colors:**
- Success (Report Ready): `#28A745`
- Warning (Processing): `#FFC107`
- Info (Pending): `#17A2B8`
- Danger (Out of Range): `#DC3545`

---

## Typography
**Font Family:** Poppins (primary) or Inter (fallback)

**Scale:**
- Hero Headline: 48px / font-bold (mobile: 32px)
- Page Titles: 32px / font-semibold
- Section Headers: 24px / font-semibold
- Body Text: 16px / font-normal
- Small/Meta: 14px / font-normal
- Buttons/CTAs: 16px / font-medium

---

## Layout System
**Spacing Units:** Tailwind spacing of `4, 6, 8, 12, 16, 24` (p-4, m-6, gap-8, py-12, etc.)

**Container Widths:**
- Full-width sections: `max-w-7xl mx-auto px-4`
- Content sections: `max-w-6xl`
- Forms/Cards: `max-w-2xl`

**Grid Patterns:**
- Test cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Admin dashboard: `grid-cols-1 lg:grid-cols-4` (3:1 split for sidebar)
- Statistics: `grid-cols-2 md:grid-cols-4`

---

## Component Library

### Navigation
**Patient Header:** 
- Logo left, navigation center (Home, Tests, Book Test, Dashboard), Login/Profile right
- Sticky on scroll with subtle shadow
- Sky blue background with white text

**Admin Sidebar:**
- Fixed left navigation (240px width)
- Collapsible on mobile
- Items: Dashboard, Patients, Create Report, Reports, Tests, Bookings, Settings
- Active state: darker blue background

### Buttons
**Primary (Sky Blue):**
- Background `#87CEEB`, hover `#005B96`
- Padding `px-6 py-3`, rounded `rounded-lg`
- Large touch targets (min 48px height)

**Secondary (White outline):**
- Border `#87CEEB`, hover background `#87CEEB` with white text

**On Hero Images:**
- Background blur effect (`backdrop-blur-md bg-white/20`)
- White text with subtle shadow

### Cards
**Test Cards:**
- White background, border `#E9ECEF`
- Hover: lift effect (shadow-lg)
- Structure: Icon/badge → Title → Price → Duration → "Book Now" button

**Patient Record Cards:**
- Header: Patient ID (bold) + Name
- Body: Contact info, last test date
- Footer: Quick actions (View History, Create Report)

**Report Cards:**
- Status badge (color-coded)
- Test name + date
- Download button (always visible)

### Forms
**Input Fields:**
- Border `#E9ECEF`, focus border `#87CEEB`
- Padding `px-4 py-3`
- Labels above, error messages below in red
- Required fields marked with asterisk

**Multi-Step Forms (Booking):**
- Progress indicator at top (step 1/3, 2/3, 3/3)
- Each step in separate card
- "Back" and "Continue" buttons at bottom

### Data Display
**Parameter Entry Table (Create Report):**
- Columns: Parameter | Value Input | Unit | Normal Range | Flag
- Auto-flag out-of-range values with red indicator
- Sticky header on scroll

**Search Results:**
- Highlighted Patient ID
- Secondary info in gray (phone, email)
- "Select" button right-aligned

---

## Page-Specific Layouts

### Landing Page
**Hero Section (full viewport):**
- Large hero image (medical lab setting, professional)
- Centered overlay: Headline + Subtext + "Book Test" CTA
- Trust badges below (NABL, ISO certifications)

**Satisfied Customers Counter:**
- 3-column grid: Tests Conducted | Happy Patients | Years of Service
- Animated counting effect on scroll into view
- Sky blue numbers, large and bold

**Lab Advertisement Carousel:**
- 3-4 rotating banners (special offers, new tests)
- Auto-play with manual controls

**Footer:**
- 4-column grid: About | Quick Links | Contact | Location
- Contact: Phone, email prominent
- Embedded Google Map
- Social media icons

### Admin Create Report
**Layout:**
- Search bar at top (full width)
- Two-column split: 
  - Left (30%): Patient details + history sidebar
  - Right (70%): Report creation form
- Parameter inputs: dynamic rows based on selected test
- "Preview PDF" button (opens modal)
- "Generate & Publish" primary action (top right)

### Patient Dashboard
**Three-section layout:**
- Top: Profile summary card (editable)
- Middle: Active bookings (status timeline)
- Bottom: Report history (table with download icons)

---

## Images
**Hero Image:** Professional pathology lab setting — clean, modern equipment, lab technician in background. Bright, clinical lighting. 1920x800px minimum.

**Test Category Icons:** Use medical iconography (Heroicons or Font Awesome medical icons) for test categories (blood drop, heart, kidney, etc.)

**Trust Badges:** NABL, ISO certification logos (100x100px)

**Patient Portal:** Small avatar placeholders for profile sections

---

## Interactions
- **Hover states:** Subtle lift on cards, color transition on buttons
- **Loading states:** Spinner on form submissions, skeleton screens for data loading
- **Success confirmations:** Toast notifications (top-right, 3-second auto-dismiss)
- **No animations** beyond subtle transitions (200-300ms)

---

## Accessibility
- All interactive elements minimum 48x48px
- Color contrast ratio 4.5:1 minimum
- Form validation with clear error messages
- Keyboard navigation support throughout
- Screen reader labels for icons and actions