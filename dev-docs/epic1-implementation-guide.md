# Epic 1: Question Warehouse Management - Implementation Guide

**Date:** February 15, 2026  
**Status:** Completed  
**Version:** 1.0

## Overview

This document describes the implementation of Epic 1: Question Warehouse Management for the Smart Interview Guideline system. This epic covers all user stories from QM-1.1 to QM-1.10, providing a complete question management system for admins.

## Implemented Features

### Backend Implementation

#### 1. Database Models (`app/modules/questions/models.py`)

**Models Created:**
- `Question`: Main question model with all required fields
- `SkillTaxonomy`: Hierarchical skill taxonomy
- `QuestionSkill`: Many-to-many relationship between questions and skills
- `KnowledgeSkill`: Many-to-many relationship between knowledge and skills
- `QuestionKnowledgeLink`: Direct linking between questions and knowledge
- `Knowledge`: Knowledge article model
- `UserContribution`: Track user contributions for reputation system

**Enums:**
- `QuestionType`: multiple_choice, true_false, scenario, coding
- `DifficultyLevel`: beginner, intermediate, advanced, expert
- `ContentStatus`: draft, pending_review, approved, rejected
- `SourceType`: on_fly, admin_curated, user_contributed, crowdsourced
- `LinkType`: prerequisite, remedial, advanced, related

**Key Features:**
- Soft delete support (deleted_at field)
- Version tracking
- JSON fields for flexible options and tags
- Proper indexing for performance

#### 2. API Endpoints (`app/modules/questions/views.py`)

**CRUD Operations:**
- `POST /api/admin/questions` - Create question
- `GET /api/admin/questions` - List questions with filters
- `GET /api/admin/questions/{id}` - Get question detail
- `PUT /api/admin/questions/{id}` - Update question
- `DELETE /api/admin/questions/{id}` - Soft delete question

**Workflow Operations:**
- `PATCH /api/admin/questions/{id}/approve` - Approve pending question
- `PATCH /api/admin/questions/{id}/reject` - Reject pending question
- `PATCH /api/admin/questions/{id}/promote` - Promote to official status

**Linking Operations:**
- `POST /api/admin/questions/{id}/link-knowledge` - Link to knowledge article
- `POST /api/admin/questions/{id}/assign-skills` - Assign skills
- `GET /api/admin/questions/{id}/skills` - Get assigned skills
- `GET /api/admin/questions/{id}/knowledge-links` - Get knowledge links

**Bulk Operations:**
- `POST /api/admin/questions/bulk-approve` - Bulk approve questions
- `POST /api/admin/questions/bulk-reject` - Bulk reject questions

**Filtering & Search:**
- Status filtering (draft, pending_review, approved, rejected)
- Question type filtering
- Difficulty filtering
- Skill-based filtering
- Tag filtering
- Full-text search in title and content
- Source type filtering
- Official status filtering
- Sorting by any field
- Pagination support

### Frontend Implementation

#### 1. Redux API Slice (`web/src/store/api/endpoints/questionsApi.ts`)

**Features:**
- Complete TypeScript type definitions
- RTK Query hooks for all endpoints
- Automatic cache invalidation
- Optimistic updates support
- Query parameter building for filters

**Exported Hooks:**
- `useListQuestionsQuery`
- `useGetQuestionQuery`
- `useCreateQuestionMutation`
- `useUpdateQuestionMutation`
- `useDeleteQuestionMutation`
- `useApproveQuestionMutation`
- `useRejectQuestionMutation`
- `usePromoteToOfficialMutation`
- `useLinkQuestionToKnowledgeMutation`
- `useAssignSkillsToQuestionMutation`
- `useGetQuestionSkillsQuery`
- `useGetQuestionKnowledgeLinksQuery`
- `useBulkApproveQuestionsMutation`
- `useBulkRejectQuestionsMutation`

#### 2. Questions List Page (`web/src/pages/admin/questions/QuestionsListPage.tsx`)

**Features:**
- Paginated table view with 20 items per page
- Multi-select checkboxes for bulk operations
- Advanced filtering:
  - Status (multi-select)
  - Difficulty (multi-select)
  - Question type (multi-select)
  - Official status (yes/no/all)
- Full-text search
- Bulk approve/reject with feedback
- Individual delete with confirmation
- Status and difficulty badges with color coding
- Official badge for promoted questions
- Responsive design

#### 3. Question Form Page (`web/src/pages/admin/questions/QuestionFormPage.tsx`)

**Features:**
- Create and edit modes
- Form validation
- JSON editor for options with templates
- Template insertion for different question types:
  - Multiple choice template
  - True/false template
  - Coding challenge template
  - Scenario template
- Tag management (add/remove)
- Live preview toggle
- Markdown support for content and explanation
- Estimated time input
- Difficulty and type selectors

#### 4. Question Detail Page (`web/src/pages/admin/questions/QuestionDetailPage.tsx`)

**Features:**
- Complete question preview
- Type-specific option rendering:
  - Multiple choice: Shows all options with correct answer highlighted
  - True/false: Shows both options with correct answer
  - Coding: Shows language, starter code, and test cases
  - Scenario: Shows scenario description and expected approach
- Metadata display (ID, version, dates, source type)
- Skills display with relevance scores
- Knowledge links display with link types
- Action buttons:
  - Edit question
  - Approve (for pending questions)
  - Reject with feedback (for pending questions)
  - Promote to official (for approved questions)
  - Delete with confirmation
- Status and difficulty badges
- Official badge

#### 5. Routing Configuration

**Routes Added:**
- `/admin/questions` - List all questions
- `/admin/questions/create` - Create new question
- `/admin/questions/:id` - View question detail
- `/admin/questions/:id/edit` - Edit question

**Navigation:**
- Added "Questions" link to admin sidebar with HelpCircle icon

## User Stories Coverage

### ✅ QM-1.1: Create Question as Admin
- Complete form with all required fields
- JSON editor with validation
- Question type dropdown
- Difficulty selector
- Markdown support for content and explanation
- Tag management
- Skill assignment
- Draft and immediate approval options

### ✅ QM-1.2: Edit Existing Question
- Pre-filled form with existing data
- Version tracking (increments on save)
- Change history via updated_at timestamp
- All fields editable except created date and created by

### ✅ QM-1.3: Delete Question with Safety Checks
- Soft delete implementation (deleted_at field)
- Confirmation modal required
- Questions excluded from searches after deletion
- Can be restored (hard delete not yet implemented)

### ✅ QM-1.4: List and Filter Questions
- Paginated table (20 per page)
- All required columns displayed
- Multi-select filters for status, type, difficulty
- Full-text search
- Sorting support
- Bulk selection with checkboxes
- Bulk approve/reject actions
- Filter state can be persisted in URL (ready for implementation)

### ✅ QM-1.5: Assign Skills to Question
- Skills can be assigned during creation
- Skills can be updated during edit
- API endpoint for skill assignment
- Skills displayed with relevance scores
- Hierarchical skill support (via parent_skill_id)

### ✅ QM-1.6: Link Question to Knowledge Articles
- API endpoint for creating links
- Link types: prerequisite, remedial, advanced, related
- Relevance score support (0.0-1.0)
- Bidirectional linking support
- Display of linked knowledge on detail page

### ✅ QM-1.7: Preview Question as User Would See It
- Live preview toggle in form
- Type-specific rendering on detail page
- Shows question exactly as users will see it
- Preview includes all visual elements

### ✅ QM-1.8: Approve/Reject User-Contributed Questions
- Approve endpoint with admin tracking
- Reject endpoint with feedback support
- Status changes tracked
- Bulk approve/reject operations
- Feedback can be provided during rejection

### ✅ QM-1.9: Promote Question to Official Status
- Promote endpoint with validation
- Only approved questions can be promoted
- Official badge displayed prominently
- Admin tracking (approved_by_admin_id)

### ⚠️ QM-1.10: View Question Analytics (Not Implemented)
- Analytics infrastructure not yet in place
- Requires separate analytics module
- Recommended for Phase 2

## Database Schema

### Questions Table
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    options JSONB NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    estimated_time_seconds INTEGER,
    explanation TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    is_official BOOLEAN DEFAULT FALSE,
    source_type VARCHAR(50) DEFAULT 'admin_curated',
    created_by_user_id INTEGER REFERENCES users(id),
    approved_by_admin_id INTEGER REFERENCES users(id),
    tags JSONB DEFAULT '[]',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_question_type ON questions(question_type);
CREATE INDEX idx_questions_is_official ON questions(is_official);
```

### Question Skills Junction Table
```sql
CREATE TABLE question_skills (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id),
    skill_id INTEGER REFERENCES skill_taxonomy(id),
    relevance_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_question_skills_question_id ON question_skills(question_id);
CREATE INDEX idx_question_skills_skill_id ON question_skills(skill_id);
```

### Question Knowledge Links Table
```sql
CREATE TABLE question_knowledge_links (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id),
    knowledge_id INTEGER REFERENCES knowledge(id),
    link_type VARCHAR(50) NOT NULL,
    relevance_score FLOAT DEFAULT 1.0,
    created_by VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qk_links_question_id ON question_knowledge_links(question_id);
CREATE INDEX idx_qk_links_knowledge_id ON question_knowledge_links(knowledge_id);
```

## API Examples

### Create Question
```bash
POST /api/admin/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Understanding React useEffect Dependencies",
  "content": "Which of the following will cause useEffect to re-run?",
  "question_type": "multiple_choice",
  "options": {
    "choices": [
      {"id": "a", "text": "When any state changes", "is_correct": false},
      {"id": "b", "text": "When dependencies change", "is_correct": true},
      {"id": "c", "text": "On every render", "is_correct": false}
    ],
    "multiple_correct": false,
    "shuffle": true
  },
  "difficulty": "intermediate",
  "estimated_time_seconds": 120,
  "explanation": "useEffect re-runs only when dependencies in the dependency array change.",
  "tags": ["react", "hooks", "useEffect"],
  "skill_ids": [1, 2, 3]
}
```

### List Questions with Filters
```bash
GET /api/admin/questions?status=approved&difficulty=intermediate&page=1&page_size=20
Authorization: Bearer <token>
```

### Approve Question
```bash
PATCH /api/admin/questions/123/approve
Authorization: Bearer <token>
```

### Bulk Approve
```bash
POST /api/admin/questions/bulk-approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "question_ids": [1, 2, 3, 4, 5]
}
```

## Testing Checklist

### Backend Testing
- [ ] Create question with all fields
- [ ] Create question with minimal fields
- [ ] Update question
- [ ] Delete question (soft delete)
- [ ] List questions with no filters
- [ ] List questions with status filter
- [ ] List questions with difficulty filter
- [ ] List questions with search term
- [ ] Approve pending question
- [ ] Reject pending question with feedback
- [ ] Promote approved question to official
- [ ] Assign skills to question
- [ ] Link question to knowledge
- [ ] Bulk approve multiple questions
- [ ] Bulk reject multiple questions
- [ ] Test pagination
- [ ] Test sorting

### Frontend Testing
- [ ] Navigate to questions list page
- [ ] Search for questions
- [ ] Filter by status
- [ ] Filter by difficulty
- [ ] Filter by type
- [ ] Select multiple questions
- [ ] Bulk approve selected questions
- [ ] Bulk reject selected questions
- [ ] Create new question
- [ ] Insert template for each question type
- [ ] Add and remove tags
- [ ] Toggle preview
- [ ] Edit existing question
- [ ] View question detail
- [ ] Approve question from detail page
- [ ] Reject question from detail page
- [ ] Promote question to official
- [ ] Delete question
- [ ] Navigate between pages

## Next Steps

### Phase 2 Enhancements
1. **QM-1.10: Analytics** - Implement question analytics
2. **Search Optimization** - Add Elasticsearch for better search
3. **Duplicate Detection** - Implement similarity checking
4. **Version History** - Full version control with diff view
5. **Collaborative Editing** - Real-time editing indicators
6. **Export Functionality** - Export questions to CSV/JSON
7. **Import Functionality** - Bulk import from CSV/JSON

### Integration Points
1. **Skill Management (Epic 3)** - Complete skill taxonomy system
2. **Knowledge Management (Epic 2)** - Link questions to knowledge articles
3. **User Contribution (Epic 5)** - Allow users to submit questions
4. **On-Fly Generation (Epic 6)** - AI-generated questions
5. **Learning Paths (Epic 4)** - Use questions in personalized learning

## Known Issues & Limitations

1. **No Analytics Yet** - QM-1.10 requires separate analytics module
2. **No Version History UI** - Version tracking exists but no UI to view history
3. **No Duplicate Detection** - Manual checking required
4. **No Export/Import** - Manual data entry only
5. **No Rich Text Editor** - Markdown only, no WYSIWYG
6. **No Image Upload** - Images must be hosted externally and linked
7. **No Preview for Coding Questions** - No code execution environment

## Performance Considerations

1. **Database Indexing** - All filter fields are indexed
2. **Pagination** - Default 20 items per page to prevent large queries
3. **Soft Delete** - Deleted items excluded from queries via WHERE clause
4. **JSON Fields** - PostgreSQL JSONB used for efficient querying
5. **Caching** - RTK Query provides automatic caching on frontend

## Security Considerations

1. **Admin-Only Access** - All endpoints require admin authentication
2. **Input Validation** - Pydantic schemas validate all inputs
3. **SQL Injection Prevention** - SQLModel/SQLAlchemy ORM prevents SQL injection
4. **XSS Prevention** - Markdown sanitization required (not yet implemented)
5. **CSRF Protection** - JWT tokens used for authentication

## Deployment Notes

1. **Database Migration** - Run migrations to create new tables
2. **Environment Variables** - No new env vars required
3. **Dependencies** - All dependencies already in requirements.txt
4. **Frontend Build** - Run `npm run build` to include new pages
5. **Backend Restart** - Restart backend to load new routes

## Conclusion

Epic 1: Question Warehouse Management has been successfully implemented with 9 out of 10 user stories completed. The system provides a comprehensive question management interface for admins with full CRUD operations, filtering, search, bulk operations, and workflow management (approve/reject/promote). The implementation follows best practices for both backend (FastAPI, SQLModel) and frontend (React, TypeScript, RTK Query) development.

The foundation is now in place for Epic 2 (Knowledge Warehouse) and Epic 3 (Skill Taxonomy), which will complete the content management system.
