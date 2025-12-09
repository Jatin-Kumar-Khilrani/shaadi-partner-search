# ShaadiPartnerSearch - Matrimony Service - Product Requirements Document

A selfless community service platform connecting families for matrimonial alliances, built on traditional values with modern technology. Open to all communities and religions.

**Experience Qualities**: 
1. **Trustworthy** - Every interaction should reinforce safety, authenticity, and community values through verification badges and volunteer presence
2. **Welcoming** - The interface should feel warm and approachable with bilingual support (Hindi/English), creating cultural familiarity for all users
3. **Dignified** - Matrimony is sacred, not commercial - the design must reflect respect, tradition, and the seriousness of life partnerships

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This platform requires profile management, search filters, verification workflows, volunteer coordination, community resources, and multi-level trust systems - all while maintaining security and privacy standards appropriate for sensitive matrimonial data.

## Essential Features

### Profile Search & Discovery
- **Functionality**: Advanced search with filters for gender, age range (male 21+, female 18+), location, religion, caste, education, and occupation
- **Purpose**: Help families find compatible matches across all communities based on traditional and modern criteria
- **Trigger**: User enters search criteria on home page or dedicated search interface
- **Progression**: Select filters → View search criteria → Click search button → Browse paginated results → View profile cards with basic info → Click to see detailed profile
- **Success criteria**: Results return within 2 seconds, filters work accurately, at least 5-10 relevant profiles shown when database has sufficient data

### Profile Registration & Management
- **Functionality**: Multi-step form capturing personal details, family background, education, profession, photos (including live photo/selfie upload option), and contact information with age restrictions (male 21+, female 18+)
- **Purpose**: Create comprehensive, authentic profiles that help families make informed decisions while respecting privacy
- **Trigger**: User clicks "Register Profile" from navigation or home page CTA
- **Progression**: Fill personal details (with age validation) → Add family info → Education & career → Upload photo or live selfie → Additional details → Choose membership plan (₹500 for 6 months or ₹900 for 1 year) → Review & submit → OTP verification → Awaiting manual approval → Profile goes live with verification badge
- **Success criteria**: Form validates all required fields including age restrictions, photo uploads successfully, OTP verification works, profile enters review queue, user receives confirmation with payment details

### Trust & Verification System
- **Functionality**: 5-level trust system with badges - Level 1 (mobile), Level 3 (ID + photo), Level 5 (video call verified by volunteers)
- **Purpose**: Build confidence in profiles, reduce fraud, maintain community standards, protect vulnerable members
- **Trigger**: User completes registration, volunteers review submissions, verification requests sent
- **Progression**: Submit profile → Mobile OTP (Level 1) → Upload ID document → Volunteer reviews → Badge awarded → Optional video verification → Higher trust level displayed
- **Success criteria**: Clear badge visibility on profiles, volunteer dashboard for reviews, secure document storage, verification status updates in real-time

### Admin Panel for Service Management
- **Functionality**: Centralized admin interface for managing wedding services, volunteer directory, resources, and profile verification
- **Purpose**: Streamline management of all wedding-related services with consultation fee structure (₹200), volunteer coordination, and content curation
- **Trigger**: Admin user clicks "Admin" in navigation
- **Progression**: View pending profiles → Approve/reject → OR → Browse wedding service providers (venue, caterer, photographer, decorator, mehandi, makeup, DJ, priest, card designer, choreographer, other) with addresses → Verify/manage → OR → Manage volunteer directory by city → OR → Update resources and guidance content
- **Success criteria**: All wedding services display with addresses and contact info, consultation fee (₹200) is clearly stated, volunteer list is up-to-date, admin can efficiently approve/reject profiles

### Language Toggle Feature
- **Functionality**: Switch between Hindi and English throughout the application
- **Purpose**: Make the platform accessible to users comfortable with either language
- **Trigger**: User clicks language toggle button in header
- **Progression**: Click translate icon → Interface updates to selected language → All text (labels, buttons, messages, descriptions) switches language
- **Success criteria**: Language toggle works instantly, all content translates correctly, user preference persists during session

### Privacy & Security Controls
- **Functionality**: Contact information hidden until mutual interest, report/block users, no data selling policy, encrypted storage
- **Purpose**: Protect users (especially women) from harassment, maintain dignity, build trust in the platform
- **Trigger**: User wants to report someone, view privacy settings, or request contact info
- **Progression**: View profile → Request contact → Admin reviews → Both parties notified → Contact shared OR → Report issue → Admin investigates → Action taken
- **Success criteria**: Report system works, contact info remains hidden appropriately, privacy policy is clear and accessible

### Donation & Volunteer Recruitment
- **Functionality**: Information about volunteering opportunities, UPI/bank details for donations, impact transparency
- **Purpose**: Sustain the platform through community support (₹500 for 6 months or ₹900 for 1 year membership fees), recruit volunteers, demonstrate non-profit nature
- **Trigger**: User clicks "Support Us" or donation CTA
- **Progression**: View volunteering options → Fill volunteer form → OR → View membership pricing and benefits → Choose plan → Make payment → Receive acknowledgment
- **Success criteria**: Volunteer form submits successfully, membership fees are clearly stated, users understand the sustainable funding model

## Edge Case Handling

- **Inappropriate Content**: Volunteer review process flags and removes offensive profiles, photos, or messages before going live
- **Spam/Fake Profiles**: Multi-step verification (OTP, document, video) creates barriers for fraudsters; easy reporting mechanism
- **Incomplete Profiles**: System allows saving drafts, sends reminder emails, marks incomplete profiles differently in search results
- **Age Restrictions**: Form validates minimum age requirements (21+ for males, 18+ for females) during registration
- **Photo Upload**: Support for both regular photo upload and live photo/selfie capture for verification purposes
- **No Search Results**: Friendly message encouraging users to broaden criteria, option to save search and get notified when new matches arrive
- **Network Issues During Registration**: Form data persists in browser, auto-saves periodically, clear error messages with retry options
- **Privacy Concerns**: Granular privacy controls, clear consent for data usage, option to hide profile temporarily or delete permanently
- **Language Barriers**: Bilingual interface (Hindi + English) with instant toggle, simple language avoiding technical jargon
- **Age/Browser Compatibility**: Responsive design works on all devices, accessible for users with limited tech literacy

## Design Direction

The design should evoke **warmth, trust, and cultural pride** - imagine the feeling of a traditional family gathering where tradition meets modernity. The interface should feel welcoming yet dignified, colorful yet sophisticated, reflecting vibrant cultural aesthetics while maintaining the seriousness of matrimonial alliances. Users should feel they're in a safe, community-driven space, not a commercial platform. The design is inclusive and welcoming to all communities and religions.

## Color Selection

Drawing inspiration from traditional wedding aesthetics and cultural values with warm, trustworthy tones:

- **Primary Color**: Deep Maroon `oklch(0.35 0.15 15)` - Represents tradition, commitment, and the sacred nature of marriage; evokes the rich colors of traditional bridal wear
- **Secondary Colors**: 
  - Warm Cream `oklch(0.95 0.02 75)` - Soft, welcoming background that doesn't compete with content
  - Teal Accent `oklch(0.55 0.12 200)` - Modern, trustworthy accent for verification badges and CTAs
- **Accent Color**: Vibrant Saffron `oklch(0.70 0.18 50)` - Draws attention to important actions like "Register Profile" and "Search"; culturally significant across communities
- **Foreground/Background Pairings**: 
  - Background Cream `oklch(0.95 0.02 75)`: Deep Maroon text `oklch(0.35 0.15 15)` - Ratio 6.8:1 ✓
  - Primary Maroon `oklch(0.35 0.15 15)`: White text `oklch(1 0 0)` - Ratio 8.2:1 ✓
  - Accent Saffron `oklch(0.70 0.18 50)`: Dark Brown text `oklch(0.25 0.08 30)` - Ratio 7.1:1 ✓
  - Teal Badge `oklch(0.55 0.12 200)`: White text `oklch(1 0 0)` - Ratio 4.9:1 ✓

## Font Selection

Typography should balance **cultural warmth with modern readability**, supporting both Hindi Devanagari and English seamlessly:

- **Primary Font**: Noto Sans Devanagari - Excellent Hindi support, clean, professional, works well for both script types
- **Display Font**: Tiro Devanagari Sanskrit - For headings and special emphasis, adds cultural character while remaining legible

**Typographic Hierarchy**:
- H1 (Page Titles): Tiro Devanagari Sanskrit Bold / 36px / 1.2 line-height / tight letter-spacing
- H2 (Section Headers): Tiro Devanagari Sanskrit Semibold / 28px / 1.3 line-height
- H3 (Card Titles): Noto Sans Devanagari Bold / 20px / 1.4 line-height
- Body (Content): Noto Sans Devanagari Regular / 16px / 1.6 line-height / comfortable paragraph spacing
- Small (Labels, Metadata): Noto Sans Devanagari Medium / 14px / 1.5 line-height
- Button Text: Noto Sans Devanagari Semibold / 16px / uppercase tracking

## Animations

Animations should reinforce **trust and warmth** without feeling frivolous - matrimony is serious business. Use subtle, purposeful motion:

- Profile cards gently lift and glow on hover with a soft shadow transition (300ms ease-out) - suggests interactivity without being aggressive
- Form field focus states have a subtle scale (1.02) and colored border animation - guides user attention smoothly
- Verification badge icons have a gentle pulse on initial reveal - celebrates trust achievement
- Page transitions use a subtle fade (200ms) - maintains context without jarring shifts
- Search results fade in with staggered timing (50ms delay between cards) - creates sense of discovery
- Success states (form submission, verification complete) use a satisfying scale + fade combination with checkmark icon

## Component Selection

**Components**:
- **Card**: Profile cards, volunteer contact cards, wedding service provider cards, resource article previews, stat displays
- **Dialog**: Profile detail view, contact request modals, verification instructions, terms acceptance, registration flow
- **Form** + **Input** + **Label**: Registration forms with age validation (21+ male, 18+ female), search filters, volunteer applications
- **Select**: Dropdown for location, education level, occupation, religion selection
- **Button**: Primary (register, search), Secondary (view profile, learn more), Ghost (navigation), Language toggle
- **Badge**: Verification status, trust level indicators, "new" profile markers, membership plan badges
- **Tabs**: Switch between different sections (about me, family, preferences) in profile view
- **Alert**: Privacy notices, verification pending status, success confirmations, age validation errors
- **Avatar**: User profile pictures with fallback initials, photo preview during upload
- **Separator**: Divide form sections and content areas elegantly
- **Scroll Area**: Long lists of profiles, wedding services, volunteer directories
- **Input[type="file"]**: Photo upload with live photo/selfie capture support

**Customizations**:
- Profile cards have decorative corner flourishes (subtle border-radius variations and shadow)
- Verification badges include custom trust level icons (1-5 stars/shields)
- Search filters panel has a sticky behavior with glassmorphism effect `backdrop-blur-md bg-white/90`
- Buttons use the warm color palette with hover states that slightly lighten/darken
- Form inputs have bilingual placeholder text support with proper spacing
- Language toggle button with translate icon in header
- Photo upload component with preview and live capture option
- Admin panel with wedding service management (address, consultation fee ₹200)

**States**:
- Buttons: Default (solid maroon) → Hover (lighter maroon + lift) → Active (darker, pressed) → Disabled (muted gray)
- Profile cards: Default (flat) → Hover (elevated shadow, border glow) → Selected (border highlight)
- Verification badges: Level 1 (gray) → Level 3 (teal) → Level 5 (gold saffron)
- Form inputs: Empty → Focused (border color shift, subtle scale) → Filled (checkmark) → Error (red border, shake animation)

**Icon Selection**:
- Search: MagnifyingGlass
- Profile/User: User, UserCircle, UserPlus
- Verification: CheckCircle, ShieldCheck, Seal
- Location: MapPin
- Contact: Phone, Envelope
- Admin: ShieldCheck
- Language: Translate
- Heart/Interest: Heart
- Filter: Funnel
- Photo: Camera, Image
- Edit: PencilSimple
- Settings: Gear

**Spacing**:
- Container padding: px-4 md:px-8 lg:px-12
- Section spacing: space-y-8 (mobile) / space-y-16 (desktop)
- Card padding: p-6
- Form field gaps: gap-4
- Grid gaps: gap-4 md:gap-6
- Button padding: px-6 py-3 (normal), px-8 py-4 (large)

**Mobile**:
- Search filters collapse into a drawer/sheet that slides from bottom
- Profile cards stack vertically, full width on mobile
- Volunteer directory switches from grid to list view
- Sticky "Register" CTA button at bottom on mobile
- Navigation converts to hamburger menu
- Form fields stack vertically with full width
- Touch targets minimum 44x44px for all interactive elements
