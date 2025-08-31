# TestSprite QA Runbook - University Assist

## Environment Setup

- **Base URL**: https://universityassist25.lovable.app (staging)
- **Test Mode**: QA_MODE=true (banner visible)
- **Email Sandbox**: SENDGRID_SANDBOX=true (no real emails sent)

## Test Logins

**Important**: Passwords are stored in secrets, not in this file.

1. **Student User**
   - Email: `student+qa@universityassist.net`
   - Role: `student`
   - Use Case: Basic user journey, eligibility checking, watchlist management

2. **School Counselor User**
   - Email: `counselor+qa@universityassist.net`
   - Role: `school_counselor`
   - Use Case: Student management, cohort tracking, institutional features

3. **Admin User**
   - Email: `admin+qa@universityassist.net`
   - Role: `admin`
   - Use Case: Full system access, data management, configuration

## Test Scope & Validation Points

### 1. Navigation & Mapping
- **City Pages**: `/cities/berlin`, `/cities/munich`, `/cities/hamburg`
  - ✅ Mapbox GL loads successfully
  - ✅ University markers clickable and functional
  - ✅ City information displays correctly
  - ✅ Ambassador profiles linked from city pages

- **University Pages**: Navigate from city → university
  - ✅ University details load
  - ✅ Programs tab functional
  - ✅ Location markers accurate

- **Program Pages**: Navigate from university → specific program
  - ✅ Program details complete
  - ✅ Eligibility panel visible and functional
  - ✅ Application deadlines displayed (Europe/Berlin timezone)

### 2. Search Functionality
- **Full-Text Search**: Cities, universities, programs
  - ✅ German characters handled correctly (ä, ö, ü, ß)
  - ✅ Search results relevant and fast (< 300ms p95)
  - ✅ Faceted filtering works (degree level, city, tuition, etc.)

### 3. Eligibility & Matching
- **German GPA Conversion**
  - ✅ Modified Bavarian Formula implementation
  - ✅ Conversion explanation visible
  - ✅ Input validation for GPA scales

- **Gap Analysis**
  - ✅ Missing requirements highlighted
  - ✅ Actionable recommendations provided
  - ✅ Language certificate requirements clear

### 4. User Features
- **Watchlist Management**
  - ✅ Add/remove programs from watchlist
  - ✅ Deadline notifications working
  - ✅ ICS export functional

- **Profile Management**
  - ✅ Student academic information
  - ✅ Language certificates upload/management
  - ✅ Preferences saved correctly

### 5. Internationalization (i18n)
- **Language Support**
  - ✅ EN: Default language loads
  - ✅ AR: RTL layout correct, Arabic text renders
  - ✅ DE: German content accurate
  - ✅ Language switcher functional
  - ✅ URLs respect language preference

### 6. Role-Based Access Control
- **Student Role**
  - ✅ Can access own profile and applications
  - ✅ Cannot access admin features
  - ✅ Watchlist and matching functional

- **School Counselor Role**
  - ✅ Can manage assigned students
  - ✅ Cohort tracking features available
  - ✅ Reporting dashboard accessible

- **Admin Role**
  - ✅ Full system access
  - ✅ User management functional
  - ✅ Data ingestion tools working
  - ✅ Analytics and audit logs accessible

### 7. Email System (Sandboxed)
- **Transactional Emails**
  - ✅ SendGrid sandbox mode active
  - ✅ Email templates render correctly
  - ✅ No real emails sent during testing
  - ✅ Email logs show successful sandbox sends

### 8. Performance Benchmarks
- **Page Load Times**
  - ✅ City pages < 2s initial load
  - ✅ Search results < 300ms p95
  - ✅ Program eligibility calculations < 500ms

- **Map Performance**
  - ✅ Mapbox tiles load within 3s
  - ✅ Marker clustering functional with 100+ universities
  - ✅ Mobile-responsive map interactions

## Critical Test Paths

### Path 1: Student Journey
1. Register as new student → Profile creation
2. Complete academic profile → GPA conversion
3. Search for programs → Eligibility checking
4. Add to watchlist → Deadline notifications
5. View application requirements → Gap analysis

### Path 2: Multilingual Experience
1. Load site in EN → Switch to AR → Verify RTL
2. Switch to DE → Verify German content
3. Search with German characters → Results accuracy
4. Navigate city pages → Language consistency

### Path 3: Admin Operations
1. Login as admin → Dashboard access
2. Ingest university data → CSV processing
3. Manage user roles → Permission verification
4. View audit logs → Security compliance

## Known Limitations in Staging

- Real university application systems not connected
- Mapbox token rate-limited for heavy testing
- Some German translation strings may be placeholder text
- Ambassador video content may be sample/demo data

## Emergency Contacts

- Technical Issues: Check Supabase logs and edge function monitoring
- Data Issues: CSV re-ingestion may be required
- Authentication Issues: Verify Supabase Auth URL configuration

## Post-Test Cleanup

After TestSprite runs complete:
1. Review test results and failure patterns
2. Archive QA user sessions in audit logs
3. Reset any test data that might affect production migration
4. Document any discovered edge cases for development team