# Educational App for Prospective Students to Study in Germany — Product Specification

## Overview
This document describes an Educational App that helps prospective international students find and apply to degree programs at German universities. The app combines a hierarchical discovery structure (regions → cities → universities → programs) with an intelligent Admissions Requirements Navigator, conversational AI screening, an AI-driven quick-apply capability, saved-program tracking, and graduated user access levels.

## Target Users
- Prospective international students exploring Bachelor's, Master's, and preparatory/Foundation pathways in Germany
- Applicants who want guided, automated assistance with eligibility, application preparation and submission
- Admitted students who need onboarding and localized logistics guidance
- Alumni/Ambassadors who can submit reviews and testimonials

## Platform
Mobile application (iOS & Android) with responsive UI for core flows and light web view for integrated university portals when necessary.

## Core Features and Structure

### 1. Hierarchical Discovery: Regions → Cities → Universities → Programs

**Structure and Navigation:**
- **Regions page**: Lists all German regions (federal states). Each region card links to:
  - **Region page**: Lists all cities in the region
  - **City page**: Lists all universities within the city
  - **University page**: Lists all programs offered at that university (filterable by degree type)
  - **Program page**: Full program details

**Alternative direct entry points**: Cities page and Programs page with the same layered drill.

**Program Page Contents:**
- Program name, degree type (BSc/MSc), language of instruction, duration
- Tuition (if any), intake terms, application deadlines
- Application portal link, required documents
- Minimum academic/linguistic criteria, program description
- Average admission GPA (if available)
- Tuition & funding notes, contact info
- Campus/city highlights

**Metadata & Filters:**
- Language, degree level, tuition-fee/no-fee
- Application deadlines (upcoming)
- Foundation-eligible, scholarship availability
- Entry requirements complexity
- Tags: "no application fee", "English-taught", "foundation available", "popular"

### 2. Admissions Requirements Navigator

**Purpose**: Determine candidate eligibility and required next steps based on educational background.

**Functionality:**
- Guided questionnaire for users to input:
  - Education type (high school system, country)
  - Graduation year, grades, subject specializations
  - Prior tertiary credentials, language test scores
  - Certificates, preparatory courses
  
- Rules engine maps inputs to admission pathways:
  - Direct eligibility for degree program(s)
  - Eligible only for Foundation/Studienkolleg
  - Not eligible for public degree pathways — suggests private institutions or alternatives

**Outputs:**
- Clear verdict: Eligible / Foundation required / Not eligible
- Specific missing requirements (e.g., "APS certificate required", "subject-related entrance exam", "German B2/C1")
- Actionable checklist and prioritized next steps
- Links to programs that match the candidate's path

**Integration**: Program pages contain canonical list of required documents/criteria; the navigator uses that data to produce program-specific checklists.

### 3. AI Agent Screening (Conversational Profile Builder)

**Purpose**: Conversational intake to collect profile data and guide users through qualification steps.

**Capabilities:**
- Voice and text interaction
- Asks qualifying, contextual follow-up questions
- Fills profile fields automatically
- Stores captured documents (photos of certificates, transcripts, language certificates)
- Uses Admissions Requirements Navigator to run eligibility checks in real time
- Offers clarifying explanations when not eligible

**UX Notes:**
- Conversation history visible and editable
- Confirmation prompts when AI interprets ambiguous data
- Privacy and consent prompts before capturing/storing sensitive documents

### 4. AI Quick Apply

**Purpose**: For eligible programs/universities that allow fee-free online applications, AI can automate form filling.

**Flow:**
- User selects a program with Quick Apply availability
- AI extracts required fields from target application portal
- AI checks user profile documents and highlights missing items
- AI prepopulates fields and prompts user to supply/confirm missing items
- User reviews the filled application; final explicit approval required
- App performs submission and captures confirmation

**Constraints & Safety:**
- Only operate where legally and technically permitted
- Use OAuth or official APIs where possible
- Ensure user must authorize each application submission
- Audit trail of actions, prefilled values, and captured screenshots

### 5. Saved Programs & Application Tracking

**Saved Programs:**
- Users can save programs to personal list
- Each saved program shows:
  - Days until deadline (countdown based on next intake)
  - Required documents vs. user's uploaded documents (missing items flagged)
  - Eligibility indicator: likely/possible/not eligible

**Application Tracker (for Applicants):**
- Track each application's status: Submitted → Under Review → Interview/Request for Documents → Offer → Rejected
- Receive push and in-app notifications for status changes and deadlines
- Store application references, submission receipts, interview schedules
- Provide next-step checklists when offer is received

## User Access Levels & Interfaces

The app changes the UI and functionality as user progresses through stages.

### Stages:

**1. Navigation Portal (Explorer)**
- Default stage
- Access to discovery, Admissions Navigator diagnostics, AI screening, saved programs
- No application submission capability unless upgrading

**2. Applicant (paid package required)**
- Purchases a package to access application features
- Applicant UI focuses on:
  - Application management and tracking
  - Document upload and management
  - Quick Apply features
  - Deadline tracking

**3. Admitted Applicant**
- Activated when user accepts an offer and is enrolled
- Focuses on enrollment/relocation logistics:
  - Steps to enroll at university and local registration
  - Visa document checklist and local embassy guidance
  - Accommodation options, comparisons and recommendations
  - Insurance and banking setup guidance
  - Local services: transport passes, SIM cards, orientation events

**4. Ambassador**
- Activated when user has enrolled, received visa, and location changes to Germany
- Requests Ambassador profile completion (university, city, program)
- Prompts for app reviews (in-app, Google, Facebook)
- Requests testimonial video submission with AI-guided script suggestions
- Ambassador benefits: visibility badges, mentor matching, incentives

### Transition Rules:
- Purchase of application package toggles: Explorer → Applicant
- Acceptance of offer and confirmation toggles: Applicant → Admitted Applicant
- Confirmation of enrollment + visa/arrival triggers: Admitted Applicant → Ambassador

## Data Model (High Level)

**Key Entities:**
- **User profile**: personal info, nationality, home country location, current location, education history, language scores, uploaded documents, admission status
- **Region → City → University → Program**: entities with metadata and requirement schemas
- **ProgramRequirement**: document types, minimum grades, language levels, additional requirements
- **Saved Program**: user-program relation + custom notes, save date
- **Application**: program, university, submission data, status, application portal reference numbers
- **Conversation Logs**: AI chat interactions, captured consent flags
- **Package Purchase & Payment Records**

## Security & Privacy

- Sensitive documents encrypted at rest, with user-controlled access and deletion
- Minimum necessary personal data shared with external university portals
- Explicit consent and logging for any data transfer
- GDPR-compliant data handling (user rights to export/delete)
- Clear privacy policy and terms for AI interactions and automation features

## AI Behaviors & Governance

**AI Roles:**
- Screening assistant: collects data, normalizes education info, runs eligibility checks
- Quick Apply assistant: maps profile/document fields to portal requirements
- Conversational coach: scripts for testimonial videos, document tips, interview practice

**Governance:**
- **Transparency**: Show when decisions/outputs come from AI
- **Explainability**: For every eligibility outcome, list rules/checks used and missing items
- **Human-in-the-loop**: Require explicit user approval before any external submission
- **Error handling**: Offer manual editing of auto-filled data and fallback to guided manual application
- **Bias & fairness**: Regularly audit AI mappings for systematic exclusion or misclassification

## UX Flow Examples

**Exploratory Flow:**
Open app → Regions page → Select region → City → University → Program page → Use "Check my eligibility" → Admissions Navigator runs and returns result + checklist → Save program or request AI screening

**Screening & Quick Apply Flow:**
Use AI screening to build profile → AI provides eligibility results → User saves eligible programs → For Quick Apply-eligible programs, select "Apply with AI" → Review and approve submission

**Applicant & Tracking Flow:**
User purchases package → Applicant interface unlocks → Adds saved programs to apply → Submits using AI Quick Apply or guided manual submission → Tracker updates on status changes → When offer received, Admitted Applicant guidance activates

**Ambassador Flow:**
After arrival and enrollment, user receives Ambassador prompt → Completes profile → AI coaches on testimonial script → User records and uploads video → App posts in-app testimonial and requests public reviews

## Notifications & Reminders

- Deadline reminders for saved programs (configurable: 7/3/1 days)
- Missing document nudges and weekly checklist summaries
- Application status updates (push + in-app)
- Visa & enrollment milestone reminders once admitted

## Integrations & Technical Considerations

- University data ingestion: APIs, official datasets, web scraping where permitted
- Application portal automation: prefer official APIs, else use automation with user consent
- Document OCR & validation: auto-extract key fields (name, dates, grades) and compare with user profile
- Language support: English + German minimum; future multilingual expansion
- Offline handling: allow draft profile completion and local storage synchronization

## Compliance, Legal & Risk Considerations

- Respect university portal ToS; provide transparent consent for any portal automation
- Store and handle identity documents according to applicable data protection laws (GDPR)
- Disclaimers: AI outputs are advisory; final responsibility for submission accuracy rests with the user
- Payment & refund policies clearly defined in-app and compliant with app-store policies

## Implementation Roadmap (High-Level Phases)

### Phase 1 (MVP)
- Region → City → University → Program discovery; search and filters
- Admissions Requirements Navigator (rules engine) for basic country/degree templates
- Basic AI chat for profile intake (text-only)
- Saving programs, saved-program deadline reminders

### Phase 2
- AI screening improvements (voice, advanced normalization)
- Document upload and OCR
- Enhanced eligibility checking

### Phase 3
- AI Quick Apply for selected partner universities
- Application tracking and status updates
- Applicant interface with package purchases

### Phase 4
- Admitted Applicant logistics features
- Ambassador system with testimonial requests
- Review and referral incentives
