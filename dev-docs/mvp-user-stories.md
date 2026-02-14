# User Stories (MVP)

**Project:** Smart Interview Guideline (S.I.G)  
**Document Status:** Revised MVP

This document outlines the user stories for the MVP phase, updated to reflect free access and local storage.

---

## Epic 1: Identity Management (Authentication & Profile)

### US1.1: User Registration & Login

**As a** User,  
**I want to** register or log in using Email and Password,  
**So that** I can save my progress and access my personalized roadmap.

**Acceptance Criteria:**

- **Only** allow Email/Password authentication for MVP (No Social Login).
- Validate email format and password strength.
- Handle "Forgot Password" functionality via email.

**Backend Sub-tasks:**

- [ ] Design User database schema (users table: email, hashed_password).
- [ ] Implement API endpoint for Email Registration (`POST /api/auth/register`).
- [ ] Implement API endpoint for Email Login (`POST /api/auth/login`).
- [ ] Implement secure session/token management (JWT).

**Frontend Sub-tasks:**

- [ ] Create Login Page UI with Email/Password form.
- [ ] Implement form validation.
- [ ] Integrate authentication API calls.
- [ ] Store auth token securely.

### US1.2: Profile Management & CV Storage

**As a** User,  
**I want to** update my professional profile (Role, Experience level, CV),  
**So that** the system can better tailor the interview questions and roadmap to my level.

**Acceptance Criteria:**

- User can select Role (Backend, Frontend, etc.).
- User can input Years of Experience.
- User can upload CV (PDF/Docx/Txt).
- **CV Storage:** Files must be stored on the local file system (mounted via Docker volume).

**Backend Sub-tasks:**

- [ ] Update User schema to include `role`, `experience_years`, `cv_path`.
- [ ] Implement API endpoint to handle file upload (`POST /api/user/cv`).
- [ ] Configure volume mount for storing uploaded files (e.g., `/app/uploads/cv`).
- [ ] Implement logic to save file to disk and update database with file path.

**Frontend Sub-tasks:**

- [ ] Create Profile Settings Page UI.
- [ ] Add form fields for Role (Dropdown), Experience (Number/Slider).
- [ ] Create File Upload component for CV.
- [ ] Handle file selection and upload progress.

---

## Epic 2: Core Guideline Engine (The "Brain")

### US2.1: JD Input & Analysis

**As a** User,  
**I want to** input a Job Description by pasting text or uploading a file,  
**So that** the AI can analyze and extract the key skills required.

**Acceptance Criteria:**

- **Text Area:** Paste raw text.
- **File Input:** Upload a document (PDF/Docx/Txt/Image - optional OCR).
- Date picker for Interview Date.
- AI extracts Keywords (Skills, Domain).

**Backend Sub-tasks:**

- [ ] Implement API endpoint to accept multi-part form data (text or file) (`POST /api/analysis/submit`).
- [ ] Integrate file parsing library (e.g., PyPDF2 or python-docx) to extract text.
- [ ] Integrate LLM Service (OpenAI/Gemini) for text analysis.
- [ ] Implement Prompt Engineering for keyword extraction.

**Frontend Sub-tasks:**

- [ ] Create "New Journey" Page with Tabbed Input (Text / File).
- [ ] Implement Text Area input logic.
- [ ] Implement File Upload input logic.
- [ ] Add Date Picker component.
- [ ] Display loading state while AI analyzes.

### US2.2: Universal Question Bank (Memory Scan & Knowledge Check)

**As a** User,  
**I want to** encounter relevant questions during both assessment (Memory Scan) and practice (Knowledge Check),  
**So that** I can accurately gauge my skills and reinforce learning.

**Acceptance Criteria:**

- **Unified Concept:** Questions are stored as reusable entities valid for both initial assessment and later practice.
- **Data Format:** Questions must be stored as JSON objects.
  - Structure: `{ "question_text": "...", "options": [...], "correct_answer": "...", "type": "multiple_choice/boolean" }`
- **Memory Scan:** 5-10 adaptive questions.
- **Knowledge Check:** Practice questions tied to specific learning modules.

**Backend Sub-tasks:**

- [ ] Design `Question` table in database with a JSONB column (PostgreSQL) or JSON field (NoSQL) for content.
- [ ] Implement logic to select random questions based on tags/skills for Memory Scan.
- [ ] Implement logic to select specific practice questions for Knowledge Check.
- [ ] Implement API to fetch questions (`GET /api/questions`).
- [ ] Implement API to submit answers and calculate score (`POST /api/questions/submit`).

**Frontend Sub-tasks:**

- [ ] Create a Reusable Question Component (renders JSON data).
- [ ] Implement UI for Multiple Choice and Boolean (True/False) questions.
- [ ] Create Assessment Flow (Sequential questions with progress bar).
- [ ] Display results/score summary.

### US2.3: Personalized Roadmap & Visual Content

**As a** User,  
**I want to** view my personalized daily learning cards,  
**So that** I can efficiently learn the missing skills.

**Acceptance Criteria:**

- View list of daily tasks/topics.
- Click to view details (Image/Video/Text).
- Mark as "Understood" to track progress.

**Backend Sub-tasks:**

- [ ] Design `Roadmap` and `DailyTask` tables.
- [ ] Implement Pathfinder Logic: Map Gaps + Time Remaining -> Content List.
- [ ] Implement API to fetch daily roadmap (`GET /api/roadmap/daily`).
- [ ] Implement API to mark task as complete (`POST /api/roadmap/task/{id}/complete`).

**Frontend Sub-tasks:**

- [ ] Create Dashboard UI showing timeline/progress.
- [ ] Create "Card Swiper" or List view for learning content.
- [ ] Render Markdown/Image/Video content within the card.
- [ ] Implement "Mark as Done" interaction.

---

## Epic 3: Community & Crowdsourcing

### US3.1: Contribute Real Interview Questions

**As a** User,  
**I want to** submit questions I was asked in my interview,  
**So that** I can help the community (and earn reputation/credits).

**Acceptance Criteria:**

- Form to input question text, tags, and difficulty.
- **Data Format:** Submissions stored as JSON to match system standard.
- AI sanitization check (remove PII).

**Backend Sub-tasks:**

- [ ] Design `CrowdQuestion` table (status: pending, approved, rejected).
- [ ] Implement API to submit question (`POST /api/crowd/submit`).
- [ ] Implement AI Sanitization service.

**Frontend Sub-tasks:**

- [ ] Create "Contribute" Page/Modal.
- [ ] Add form fields: Question Text, Company (optional), Tags.
- [ ] Display status of submitted questions.

---

## Epic 4: Admin Dashboard

### US4.1: User Management

**As a** Admin,  
**I want to** view and manage users,  
**So that** I can support them with account issues.

**Backend Sub-tasks:**

- [ ] Create Admin API for listing users (`GET /api/admin/users`).
- [ ] Create Admin API for banning/unbanning users.

**Frontend Sub-tasks:**

- [ ] Create User List Table.
- [ ] Create User Detail View.

### US4.2: Content Moderation

**As a** Admin,  
**I want to** review crowdsourced questions,  
**So that** I can ensure quality and remove sensitive information.

**Backend Sub-tasks:**

- [ ] Create Admin API to fetch pending questions.
- [ ] Create Admin API to approve/reject/edit questions (updates JSON content).

**Frontend Sub-tasks:**

- [ ] Create Moderation Interface.
- [ ] Add Approve/Reject/Edit actions.

### US4.3: System Analytics

**As a** Admin,  
**I want to** view dashboard metrics (Active Users),  
**So that** I can track usage.

**Backend Sub-tasks:**

- [ ] Implement Analytics Service to aggregate data (Daily Active Users).
- [ ] Create API endpoint for dashboard stats (`GET /api/admin/stats`).

**Frontend Sub-tasks:**

- [ ] Create Dashboard Home view with simple Charts/Graphs.
