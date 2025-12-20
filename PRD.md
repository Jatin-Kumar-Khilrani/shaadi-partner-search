# ShaadiPartnerSearch - Matrimony Service - Product Requirements Document

A comprehensive matrimony platform connecting families for matrimonial alliances, built on traditional values with modern technology. Open to all communities and religions. Features unique profile ID system, multi-photo uploads, advanced filtering, chat system, and complete admin management.

**Experience Qualities**: 
1. **Trustworthy** - Every interaction should reinforce safety, authenticity, and community values through verification badges and volunteer presence
2. **Welcoming** - The interface should feel warm and approachable with bilingual support (Hindi/English), creating cultural familiarity for all users
3. **Dignified** - Matrimony is sacred, not commercial - the design must reflect respect, tradition, and the seriousness of life partnerships

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This platform requires profile management, search filters, verification workflows, volunteer coordination, community resources, and multi-level trust systems - all while maintaining security and privacy standards appropriate for sensitive matrimonial data.

## Essential Features

### Unique Profile ID System
- **Functionality**: Auto-generated profile ID format - First name initial + Last name initial + 4 random digits + last 2 digits of birth year (e.g., AB123499 for Amit Batra born in 1999)
- **Purpose**: Create memorable, unique identifiers for each profile that include birth year validation
- **Trigger**: Automatically generated during profile registration based on name and DOB
- **Progression**: User enters name and DOB → System generates unique profile ID → ID displayed in profile → Used for all communications
- **Success criteria**: No duplicate IDs, format validation works, birth year matches DOB

### Multi-Photo Upload System
- **Functionality**: Upload up to 5 photos plus mandatory live selfie/photo verification
- **Purpose**: Provide comprehensive visual profile while ensuring authenticity
- **Trigger**: During registration and profile editing
- **Progression**: User uploads photos via file picker (up to 5) → Separate upload for live photo/selfie via camera or file → Preview all photos → Submit for verification
- **Success criteria**: All 5 photo slots functional, live photo separate from gallery, camera access works, photo preview displays correctly

### Contact Privacy Controls
- **Functionality**: Users can hide/unhide email and mobile number independently
- **Purpose**: Give users control over contact information visibility based on comfort level
- **Trigger**: During registration and in profile settings
- **Progression**: User selects hide/unhide toggles for email and mobile → Settings save → Contact info shows/hides based on preference and approval status
- **Success criteria**: Toggle switches work, hidden info shows as "XXX" or masked, revealed after mutual consent/admin approval

### Profile Preview & Navigation
- **Functionality**: Dedicated profile preview page with name, up to 5 photos, profile ID, edit option, bottom navigation (Home, My Activity, Inbox, Chat)
- **Purpose**: Central hub for users to manage their presence and interactions
- **Trigger**: User clicks on their profile or "My Profile" link
- **Progression**: View profile with all photos → Click edit to modify → Use bottom nav to access different sections
- **Success criteria**: All 5 photos display in gallery, profile ID visible, navigation works, edit button functional

### Settings Menu with Multiple Sections
- **Functionality**: 3-dot menu containing Partner Preferences, Contact Info, Help, T&C, Safe Online Use Tips
- **Purpose**: Organize all profile management and help resources in one accessible location
- **Trigger**: User clicks settings icon (3 dots) in header or profile page
- **Progression**: Open settings menu → Select desired section → View/edit content → Save changes
- **Success criteria**: All menu items accessible, partner preferences save correctly, T&C page loads, help resources display

### Admin Approval with AI Chat Assistant
- **Functionality**: Admin reviews profiles with AI chatbot assistance to identify errors, suggest improvements, approve/reject/hold profiles
- **Purpose**: Maintain quality standards while providing feedback to applicants
- **Trigger**: New profile submitted, admin opens review panel
- **Progression**: Profile enters queue → Admin reviews with AI suggestions → Admin can chat with applicant → Approve/Reject/Hold/Request changes → User notified
- **Success criteria**: AI provides helpful suggestions, chat system works, status updates correctly, users receive notifications

### Advanced Search & Match Filters
- **Functionality**: Comprehensive filters including caste, community, mother tongue, manglik/non-manglik, veg/non-veg, drinking, smoking habits
- **Purpose**: Help users find highly compatible matches based on lifestyle and cultural preferences
- **Trigger**: User accesses "My Matches" or search page
- **Progression**: Select filters (caste, community, language, manglik status, diet, habits) → Apply filters → View filtered matches → Refine as needed
- **Success criteria**: All filter options work correctly, results update in real-time, multiple filters can combine, clear filters option available

### Inbox System (Interests & Contact Requests)
- **Functionality**: Three sections - Received Interest, Accepted Interest, View Contact Permission (pending/approved/declined)
- **Purpose**: Manage all incoming and outgoing connection requests in organized manner
- **Trigger**: User receives interest, accepts interest, or requests contact info
- **Progression**: Receive interest notification → View in inbox → Accept/Decline → If accepted, request contact info → Wait for approval → View contact details
- **Success criteria**: All three inbox sections functional, status updates correctly, notifications work, contact info reveals after approval

### Dual Chat System
- **Functionality**: Type 1 - Admin-to-User (Admin-to-All broadcast, Admin-to-Specific Profile ID); Type 2 - User-to-User (mutual consent required)
- **Purpose**: Enable communication for support and matchmaking while maintaining safety
- **Trigger**: Admin sends message OR users mutually agree to chat
- **Progression**: Admin broadcasts message to all → OR Admin chats with specific profile → OR User requests chat → Other user accepts → Chat activates
- **Success criteria**: Both chat types work independently, mutual consent enforced for user chats, admin can broadcast, chat history persists

### Chat Management Interface
- **Functionality**: Chat list sorted by latest/serial with small photo, name, last message preview, timestamp (dd/mm time IST), search/sort options
- **Purpose**: Easy navigation and management of multiple conversations
- **Trigger**: User opens chat section
- **Progression**: View chat list sorted by time → See preview of last message → Search for specific chat → Click to open full conversation
- **Success criteria**: Sorting works, timestamps in IST, search functional, unread indicators show, photos load correctly

### Email & Mobile Verification
- **Functionality**: OTP verification for both email and mobile before admin can review profile
- **Purpose**: Ensure contact information is valid and reduce fake profiles
- **Trigger**: User submits registration form
- **Progression**: Enter email and mobile → Receive OTP on both → Enter codes → Verification success → Profile moves to admin queue
- **Success criteria**: OTP sent successfully, codes validate correctly, verification status updates, unverified profiles blocked from approval

### Profile Blocking System
- **Functionality**: Admin can block profiles; blocked email/mobile cannot create new profiles
- **Purpose**: Prevent bad actors from re-registering after rejection
- **Trigger**: Admin rejects profile and selects "block"
- **Progression**: Admin blocks profile → Email and mobile added to blocklist → User attempts new registration → System detects blocked credentials → Registration prevented
- **Success criteria**: Blocklist persists, both email AND mobile checked, clear error message shown, admin can view blocklist

### Privacy-Protected Profile Details
- **Functionality**: Before admin approval, surname, date of birth, and salary are hidden/masked (show as XXX)
- **Purpose**: Prevent users from connecting outside platform before verification complete
- **Trigger**: User views pending profiles (not yet admin-approved)
- **Progression**: Browse profiles → See masked sensitive details → Cannot get full name or contact info → After admin approval, details reveal to authorized viewers
- **Success criteria**: Surname shows as "XXX", DOB hidden, salary hidden, reveals correctly after approval

### Single Profile Per Contact Rule
- **Functionality**: One email and one mobile can only register ONE profile; duplicates prevented
- **Purpose**: Maintain database integrity and prevent spam/duplicate profiles
- **Trigger**: User attempts registration with already-used email or mobile
- **Progression**: Enter email/mobile → System checks database → If exists, show error → User cannot proceed
- **Success criteria**: Duplicate detection works for both email and mobile, clear error messages, existing users can login instead

### Contact Approval System
- **Functionality**: Contact details (email/mobile) only visible after the other party approves the request; surname remains "XXX" until approval
- **Purpose**: Protect privacy and ensure mutual consent before sharing contact information
- **Trigger**: User requests to view another profile's contact info
- **Progression**: Click "Request Contact" → Request sent → Other user reviews → Approves/Declines → If approved, contact info and full surname reveal → Can then send chat message
- **Success criteria**: Request/approval flow works, masked data reveals correctly, notifications sent, chat unlocks after approval

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
