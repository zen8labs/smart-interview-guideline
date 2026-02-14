# Software Requirements Specification (MVP)

**Project:** Smart Interview Guideline (S.I.G)  
**Version:** 1.1 (MVP - Revised)  
**Status:** Draft

## 1. Product Overview

S.I.G is a smart learning guideline system designed to help IT professionals optimize their interview preparation based on specific Job Descriptions (JDs). The system focuses on visualizing knowledge, personalizing the roadmap based on time constraints, and leveraging crowdsourced data to provide the most relevant information.

### Core Value Proposition

- **Focus:** 100% relevance to the target JD.
- **Simplicity:** Visual, easy-to-consume content (Snackable).
- **Motivation:** Gamified progress and manageable daily tasks.
- **Reality:** Crowdsourced real-world interview questions.
- **Cost:** Free for all users in the MVP version.

## 2. User Roles

- **Candidate (User):** The end-user preparing for an interview.
- **Administrator (Admin):** System operator managing content and users.

## 3. Functional Requirements

### 3.1. Onboarding & Analysis Module

- **Input:** Users can input their target Job Description via two methods:
  1.  **Text Input:** Paste text directly into a textarea.
  2.  **File Input:** Upload a document (PDF/Docx/Txt).
- **Interview Date:** User selects the target interview date.
- **Role Selection:** Users select their domain (e.g., Backend, Frontend, Tester, BA).
- **JD Analysis (AI Engine):** The system automatically analyzes the JD to extract hard skills, soft skills, and domain knowledge.

### 3.2. Question Bank & Assessment (Unified Concept)

- **Unified Concept:** Questions are designed as reusable entities. The same question bank is used for both **Memory Scan** (initial assessment) and **Knowledge Checking** (practice/testing).
- **Data Format:** Questions are stored in JSON format to support flexible structures (multiple choice options, correct answer markers, metadata).
- **Memory Scan (Micro-Quiz):**
  - A generated set of 5-10 questions based on extracted JD keywords.
  - **Adaptive Logic:** Question difficulty adjusts based on previous answers.
  - **Time Constraint:** Max 5 minutes.

### 3.3. Roadmap Generation (Pathfinder)

- **Time-Adaptive Logic:** The system generates a study plan based on remaining time:
  - **Full Mode (> 7 days):** Comprehensive path.
  - **Crunch Mode (2-3 days):** Critical Top 20% knowledge + Interview Tips.
  - **Minimum Constraint:** Alert users if < 2 days.

### 3.4. Visual Content Delivery

- **Knowledge Cards:** Content presented in "Snackable" formats:
  - **AI-Generated Visuals:** Diagrams, ERDs.
  - **Short Videos:** Human-curated tips.
  - **References:** Links to authoritative docs.

### 3.5. Crowdsourcing & Reality Check

- **Contribution:** Users submit real interview questions.
- **Sanitization:** automatic AI filtering of PII/NDA info.
- **Incentives:** Reputation/Credits (for future features).

### 3.6. Identity & Access Management

- **Registration/Login:**
  - **Method:** Email and Password ONLY for MVP.
  - No social login in this version.
- **Profile Management:**
  - Manage role, experience level.
  - **CV Storage:** Uploaded CV files are stored in the local file system (mounted to host) for simplicity in MVP.

### 3.7. Administration

- **User Management:** View users, manage bans.
- **Content Management:** Approve/Refine crowdsourced questions.
- **Dashboard:** View usage metrics (Active Users, Completion Rates).

## 4. Non-Functional Requirements

### 4.1. Performance

- **Response Time:** JD Analysis within 60 seconds.

### 4.2. Security

- **Data Privacy:** Strict sanitization of crowdsourced data.
- **Storage:** Local file storage should be properly secured with permissions.

### 4.3. Scalability

- **Microservices Ready:** Architecture should support adding new Roles.

## 5. System Flow

1. **User** inputs JD (Text/File) & Date -> **AI Analyzer** extracts Keywords.
2. **System** retrieves/generates **Questions** (JSON) relevant to keywords.
3. **User** takes **Memory Scan** -> System calculates **Knowledge Gaps**.
4. **Pathfinder** generates **Personalized Guideline**.
5. **User** consumes content -> Review with **Knowledge Check** questions.
6. **User** finishes interview -> Submits Feedback (Crowdsourcing).
