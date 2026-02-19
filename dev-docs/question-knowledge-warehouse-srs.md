# Software Requirements Specification: Question & Knowledge Warehouse

**Project:** Smart Interview Guideline (S.I.G)  
**Version:** 2.0  
**Status:** Draft  
**Date:** February 15, 2026

## 1. Executive Summary

This document specifies the requirements for the Question and Knowledge Warehouse system, a core component of the Smart Interview Guideline platform. The system enables admins and users to curate, manage, and leverage interview questions and learning content to provide personalized interview preparation.

## 2. System Overview

### 2.1 Purpose

The Question and Knowledge Warehouse serves two primary functions:
- **Question Warehouse**: Repository of interview questions used for memory scanning and knowledge checking
- **Knowledge Warehouse**: Repository of learning content (markdown-based) that helps users acquire skills

### 2.2 Key Features

1. **Dual Content Creation Modes**:
   - **On-fly Generation**: AI creates questions and knowledge dynamically based on user requests
   - **Prebuilt Curation**: Admin and users create persistent content stored in the database

2. **Content Management**:
   - Admin can create, edit, approve, and delete both questions and knowledge
   - Users can contribute content pending admin approval
   - User-curated content can be promoted to "official" status

3. **Intelligent Linking**:
   - Questions are linked to knowledge through multiple mechanisms
   - System recommends relevant knowledge based on question performance

## 3. Data Models

### 3.1 Question Model

```python
Question:
  - id: int (PK)
  - title: string (required)
  - content: text (required, the actual question)
  - question_type: enum ['multiple_choice', 'true_false', 'scenario', 'coding']
  - options: JSON (structure depends on question_type)
    # Example for multiple_choice:
    # {
    #   "choices": [
    #     {"id": "a", "text": "Option A", "is_correct": false},
    #     {"id": "b", "text": "Option B", "is_correct": true}
    #   ],
    #   "multiple_correct": false
    # }
  - difficulty: enum ['beginner', 'intermediate', 'advanced', 'expert']
  - estimated_time_seconds: int (time to answer)
  - explanation: text (explains the correct answer)
  - status: enum ['draft', 'pending_review', 'approved', 'rejected']
  - is_official: boolean (promoted by admin)
  - source_type: enum ['on_fly', 'admin_curated', 'user_contributed', 'crowdsourced']
  - created_by_user_id: int (FK to User)
  - approved_by_admin_id: int (FK to User, nullable)
  - created_at: datetime
  - updated_at: datetime
  - tags: JSON array (flexible tagging)
```

### 3.2 Knowledge Model

```python
Knowledge:
  - id: int (PK)
  - title: string (required)
  - slug: string (unique, URL-friendly)
  - content: text (markdown format)
  - summary: text (short description, 1-2 sentences)
  - content_type: enum ['concept', 'tutorial', 'example', 'tips', 'visualization']
  - difficulty: enum ['beginner', 'intermediate', 'advanced', 'expert']
  - estimated_read_time_minutes: int
  - visual_content: JSON (metadata for images, diagrams, videos)
    # {
    #   "images": [{"url": "...", "alt": "...", "caption": "..."}],
    #   "diagrams": [{"type": "flowchart", "data": {...}}],
    #   "videos": [{"url": "...", "title": "...", "duration": 120}]
    # }
  - references: JSON array (external links)
    # [
    #   {"title": "React Docs", "url": "...", "type": "official_doc"},
    #   {"title": "MDN Web Docs", "url": "...", "type": "reference"}
    # ]
  - status: enum ['draft', 'pending_review', 'published', 'archived']
  - is_official: boolean
  - source_type: enum ['on_fly', 'admin_curated', 'user_contributed']
  - created_by_user_id: int (FK to User)
  - approved_by_admin_id: int (FK to User, nullable)
  - view_count: int (analytics)
  - created_at: datetime
  - updated_at: datetime
  - tags: JSON array
```

### 3.3 Skill Taxonomy Model

```
SkillTaxonomy:
  - id: int (PK)
  - name: string (e.g., "Python", "React", "System Design")
  - slug: string (unique)
  - category: string (e.g., "Programming Language", "Framework", "Concept")
  - parent_skill_id: int (FK to SkillTaxonomy, nullable, for hierarchical skills)
  - description: text
  - is_active: boolean
  - created_at: datetime
  - updated_at: datetime
```

### 3.4 Linking Models

#### QuestionSkill (Many-to-Many)
```
QuestionSkill:
  - id: int (PK)
  - question_id: int (FK to Question)
  - skill_id: int (FK to SkillTaxonomy)
  - relevance_score: float (0.0-1.0, how relevant this skill is to the question)
  - created_at: datetime
```

#### KnowledgeSkill (Many-to-Many)
```python
KnowledgeSkill:
  - id: int (PK)
  - knowledge_id: int (FK to Knowledge)
  - skill_id: int (FK to SkillTaxonomy)
  - relevance_score: float (0.0-1.0)
  - created_at: datetime
```

#### QuestionKnowledgeLink (Direct Reference)
```python
QuestionKnowledgeLink:
  - id: int (PK)
  - question_id: int (FK to Question)
  - knowledge_id: int (FK to Knowledge)
  - link_type: enum ['prerequisite', 'remedial', 'advanced', 'related']
    # prerequisite: knowledge to learn before attempting question
    # remedial: knowledge to review if question answered incorrectly
    # advanced: deeper knowledge for those who master the question
    # related: tangentially related content
  - relevance_score: float (0.0-1.0)
  - created_by: enum ['auto', 'admin', 'algorithm']
  - created_at: datetime
```

### 3.5 Supporting Models

#### ContentTag
```python
ContentTag:
  - id: int (PK)
  - name: string (unique)
  - category: string (e.g., "technology", "methodology", "domain")
  - usage_count: int (denormalized for performance)
  - created_at: datetime
```

#### UserContribution
```python
UserContribution:
  - id: int (PK)
  - user_id: int (FK to User)
  - content_type: enum ['question', 'knowledge']
  - content_id: int (polymorphic reference)
  - contribution_date: datetime
  - review_status: enum ['pending', 'approved', 'rejected', 'needs_revision']
  - admin_feedback: text (nullable)
  - reward_credits: int (points earned if approved)
```

## 4. Functional Requirements

### 4.1 Admin Features

#### FR-4.1.1 Question Management
- **Create Question**: Admin can create questions with all fields, including options in JSON format
- **Edit Question**: Admin can modify any question field
- **Approve/Reject**: Admin reviews user-contributed questions
- **Promote to Official**: Admin can mark high-quality questions as official
- **Bulk Operations**: Admin can bulk approve, reject, or tag questions
- **Link to Knowledge**: Admin can create/edit links between questions and knowledge articles
- **Preview**: Admin can preview how question appears to users

#### FR-4.1.2 Knowledge Management
- **Create Knowledge**: Admin can create markdown-based knowledge articles
- **Rich Editor**: Support markdown editing with live preview
- **Visual Content**: Admin can add images, diagrams, videos via JSON metadata
- **Version History**: Track changes to knowledge articles
- **Approve/Reject**: Admin reviews user-contributed knowledge
- **Promote to Official**: Mark curated content as official
- **Link to Questions**: Admin can link knowledge to relevant questions
- **References**: Admin can add external reference links

#### FR-4.1.3 Skill Taxonomy Management
- **CRUD Operations**: Create, read, update, delete skills
- **Hierarchical Structure**: Define parent-child relationships (e.g., "JavaScript" → "React")
- **Bulk Assignment**: Assign skills to multiple questions/knowledge articles
- **Merge Skills**: Combine duplicate or similar skills

#### FR-4.1.4 Content Review Dashboard
- **Pending Queue**: View all pending contributions in one place
- **Filtering**: Filter by type, user, date, status
- **Batch Review**: Approve/reject multiple items at once
- **Feedback System**: Provide feedback to contributors
- **Statistics**: View contribution metrics (acceptance rate, top contributors)

### 4.2 User Features (Curators)

#### FR-4.2.1 Contribute Questions
- **Submit Question**: Users can create questions following template
- **Status Tracking**: Users see status of their contributions
- **Edit Before Approval**: Users can edit pending submissions
- **Reputation System**: Users earn credits for approved contributions

#### FR-4.2.2 Contribute Knowledge
- **Submit Article**: Users can create markdown knowledge articles
- **Draft System**: Save drafts before submitting for review
- **Collaborative Editing**: Multiple revisions with admin feedback
- **Attribution**: User contributions are credited when published

### 4.3 System Features (On-fly Generation)

#### FR-4.3.1 Dynamic Question Generation
- **AI Generation**: System generates questions based on JD analysis and skill gaps
- **Temporary Storage**: On-fly questions can be optionally saved to database
- **Adaptive Difficulty**: Generate questions matching user's level
- **Quality Check**: AI-generated questions pass validation before presentation

#### FR-4.3.2 Dynamic Knowledge Generation
- **Context-Aware**: Generate knowledge snippets for immediate user needs
- **Promote to Persistent**: Admin can save good on-fly content to database
- **Citation**: On-fly content includes sources and references

### 4.4 Linking Intelligence

#### FR-4.4.1 Automatic Linking
- **Skill-Based**: Questions and knowledge with same skills are auto-linked
- **Semantic Analysis**: AI analyzes content to suggest relevant links
- **Tag Matching**: Content with matching tags are cross-referenced
- **Relevance Scoring**: System calculates relevance scores for all links

#### FR-4.4.2 Learning Path Generation
- **Gap Analysis**: Identify missing knowledge based on question performance
- **Personalized Recommendations**: Suggest knowledge based on wrong answers
- **Progressive Learning**: Recommend beginner → intermediate → advanced content
- **Alternative Explanations**: Provide multiple knowledge articles for same concept

## 5. Non-Functional Requirements

### 5.1 Performance
- Question retrieval: < 100ms for single question
- Knowledge article loading: < 500ms for full article with images
- Search functionality: < 2 seconds for complex queries
- Batch operations: Process up to 100 items in < 10 seconds

### 5.2 Scalability
- Support 10,000+ questions in database
- Support 5,000+ knowledge articles
- Handle 100 concurrent admin operations
- Efficiently query many-to-many relationships

### 5.3 Security
- **Content Sanitization**: Prevent XSS in markdown content
- **Access Control**: Role-based permissions (Admin, Curator, User)
- **Audit Trail**: Log all create, update, delete operations
- **Rate Limiting**: Prevent abuse of contribution system

### 5.4 Data Quality
- **Validation**: Enforce required fields and data formats
- **Moderation**: Human review for sensitive or complex content
- **Versioning**: Track changes to questions and knowledge
- **Backup**: Regular backups of curated content

### 5.5 Usability
- **Admin UI**: Intuitive dashboard for content management
- **Markdown Editor**: User-friendly with preview and syntax help
- **Search & Filter**: Powerful search across all content
- **Responsive Design**: Works on desktop and tablet

## 6. Integration Points

### 6.1 With Existing Modules
- **JD Analysis**: Questions generated based on extracted skills from JD
- **Memory Scan**: Questions pulled from warehouse for adaptive quiz
- **Learning Path**: Knowledge articles recommended based on skill gaps
- **Crowdsourcing**: User-contributed interview questions feed into warehouse

### 6.2 External Integrations
- **AI Services**: OpenAI API for content generation and analysis
- **Image Storage**: Cloud storage (S3/CloudFlare) for visual content
- **CDN**: Content delivery for fast knowledge article loading
- **Analytics**: Track content usage and effectiveness

## 7. User Workflows

### 7.1 Admin Curating a Question Bank

```
1. Admin navigates to "Questions" → "Create New"
2. Admin fills in:
   - Title: "Understanding React useEffect Dependencies"
   - Type: Multiple Choice
   - Difficulty: Intermediate
   - Content: "Which of the following will cause useEffect to re-run?"
   - Options (JSON):
     {
       "choices": [
         {"id": "a", "text": "When any state changes", "is_correct": false},
         {"id": "b", "text": "When dependencies change", "is_correct": true},
         {"id": "c", "text": "On every render", "is_correct": false}
       ]
     }
   - Explanation: "useEffect re-runs only when dependencies in the dependency array change..."
3. Admin assigns skills: ["React", "Hooks", "useEffect"]
4. Admin links knowledge articles:
   - "React Hooks Fundamentals" (prerequisite)
   - "useEffect Deep Dive" (remedial)
5. Admin sets status: "Approved" and marks "Official"
6. System saves and makes question available for memory scans
```

### 7.2 Admin Reviewing User Contribution

```
1. Admin opens "Content Review" dashboard
2. Admin sees pending queue:
   - 5 questions pending review
   - 2 knowledge articles pending review
3. Admin clicks on question: "What is OAuth 2.0?"
4. Admin reviews:
   - Content quality: Good
   - Options format: Valid JSON
   - Explanation: Clear
   - Issue found: Missing difficulty level
5. Admin provides feedback: "Please add difficulty level"
6. Admin marks status: "Needs Revision"
7. User receives notification with feedback
8. User updates question and resubmits
9. Admin approves and optionally promotes to official
10. User earns 50 reputation credits
```

### 7.3 User Contributing Knowledge

```
1. User navigates to "Contribute" → "Create Knowledge Article"
2. User sees markdown editor with preview
3. User writes:
   - Title: "SOLID Principles Explained"
   - Summary: "A practical guide to SOLID principles with examples"
   - Content: (markdown with code examples)
   - Tags: ["design-patterns", "best-practices", "OOP"]
4. User adds references:
   - Link to Wikipedia
   - Link to blog post
5. User submits for review (status: "Pending Review")
6. Admin reviews and suggests adding diagrams
7. User adds visual_content JSON with diagram URLs
8. Admin approves and marks as "Official"
9. Article is published and linked to relevant questions
```

### 7.4 System Generating On-fly Content

```
1. User completes JD analysis, system extracts skill: "Kubernetes"
2. System checks: Does user have knowledge gap in "Kubernetes"?
3. System generates on-fly question:
   - AI creates multiple-choice question about K8s pods
   - Question is shown immediately (not saved to DB)
4. User answers incorrectly
5. System generates on-fly knowledge:
   - AI creates brief explanation of Kubernetes pods
   - Includes auto-generated diagram
   - Cites official Kubernetes documentation
6. Admin reviews session later, sees good on-fly question
7. Admin clicks "Save to Warehouse"
8. On-fly content becomes persistent, curated content
```

## 8. API Endpoints (High-Level)

### Questions
- `POST /api/admin/questions` - Create question
- `GET /api/admin/questions` - List questions (with filters)
- `GET /api/admin/questions/{id}` - Get question detail
- `PUT /api/admin/questions/{id}` - Update question
- `DELETE /api/admin/questions/{id}` - Delete question
- `PATCH /api/admin/questions/{id}/approve` - Approve question
- `PATCH /api/admin/questions/{id}/reject` - Reject question
- `PATCH /api/admin/questions/{id}/promote` - Promote to official
- `POST /api/admin/questions/{id}/link-knowledge` - Link to knowledge
- `POST /api/admin/questions/bulk-approve` - Bulk approve

### Knowledge
- `POST /api/admin/knowledge` - Create knowledge article
- `GET /api/admin/knowledge` - List knowledge articles
- `GET /api/admin/knowledge/{id}` - Get knowledge detail
- `PUT /api/admin/knowledge/{id}` - Update knowledge
- `DELETE /api/admin/knowledge/{id}` - Delete knowledge
- `PATCH /api/admin/knowledge/{id}/publish` - Publish article
- `POST /api/admin/knowledge/{id}/link-questions` - Link to questions
- `GET /api/knowledge/{slug}` - Public view of published knowledge

### Skills
- `POST /api/admin/skills` - Create skill
- `GET /api/admin/skills` - List skills (with hierarchy)
- `PUT /api/admin/skills/{id}` - Update skill
- `DELETE /api/admin/skills/{id}` - Delete skill
- `POST /api/admin/skills/{id}/assign-questions` - Bulk assign to questions

### User Contributions
- `POST /api/contribute/questions` - User submits question
- `POST /api/contribute/knowledge` - User submits knowledge
- `GET /api/my-contributions` - User views their contributions
- `PUT /api/my-contributions/{type}/{id}` - User edits pending contribution

### Content Review
- `GET /api/admin/review/pending` - Get all pending contributions
- `POST /api/admin/review/{type}/{id}/feedback` - Provide feedback

## 9. Database Considerations

### 9.1 Indexing Strategy
- Index on `status`, `is_official`, `source_type` for filtering
- Full-text index on `title`, `content`, `tags` for search
- Index on `skill_id` in junction tables for fast lookups
- Composite index on `(difficulty, status)` for common queries

### 9.2 JSON Field Structure

**Question Options Examples:**

Multiple Choice:
```json
{
  "choices": [
    {"id": "a", "text": "Option A", "is_correct": false},
    {"id": "b", "text": "Option B", "is_correct": true}
  ],
  "multiple_correct": false,
  "shuffle": true
}
```

Coding Challenge:
```json
{
  "language": "python",
  "starter_code": "def solution():\n    pass",
  "test_cases": [
    {"input": "5", "expected_output": "120"},
    {"input": "3", "expected_output": "6"}
  ],
  "hints": ["Consider using recursion", "Base case is important"]
}
```

**Knowledge Visual Content Example:**
```json
{
  "images": [
    {
      "url": "https://cdn.example.com/diagram.png",
      "alt": "OAuth 2.0 Flow Diagram",
      "caption": "Authorization Code Flow",
      "position": "after_paragraph_3"
    }
  ],
  "diagrams": [
    {
      "type": "mermaid",
      "code": "graph TD\n  A-->B",
      "position": "after_paragraph_1"
    }
  ],
  "videos": [
    {
      "url": "https://youtube.com/watch?v=...",
      "title": "Quick Tutorial",
      "duration": 180,
      "platform": "youtube"
    }
  ]
}
```

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Low-quality user contributions | High | Multi-stage review process, reputation system |
| AI hallucination in on-fly content | High | Human review before promoting to permanent |
| Duplicate content | Medium | Similarity detection, admin tools for merging |
| Broken external references | Medium | Periodic link checking, fallback to cached content |
| Copyright violations | High | User agreement, DMCA process, content moderation |
| Database performance with many links | Medium | Proper indexing, query optimization, caching |

## 11. Future Enhancements

### Phase 2
- **Version Control**: Track detailed history of all content changes
- **Collaborative Editing**: Multiple admins working on same content
- **Translation**: Multi-language support for questions and knowledge
- **Rich Media**: Embed interactive demos, code playgrounds

### Phase 3
- **AI-Assisted Curation**: Auto-suggest improvements to existing content
- **Content Analytics**: Track which questions/knowledge are most effective
- **Community Voting**: Let users upvote/downvote content quality
- **Expert Certification**: Badge system for top contributors

## 12. Success Metrics

- **Content Volume**: Reach 1,000 curated questions and 500 knowledge articles in first 6 months
- **Approval Rate**: >70% of user contributions approved after 1-2 revisions
- **Coverage**: >90% of common interview skills have associated questions and knowledge
- **Engagement**: User-contributed content accounts for >30% of total content
- **Quality**: <5% of published content receives negative feedback
- **Performance**: Admin can review and approve a contribution in <5 minutes

## 13. Appendix

### A. Question Difficulty Guidelines

- **Beginner**: Basic definitions, syntax, simple concepts
- **Intermediate**: Application of concepts, comparing approaches
- **Advanced**: Complex scenarios, optimization, trade-offs
- **Expert**: System design, architecture, edge cases

### B. Knowledge Article Templates

Admins should follow these templates for consistency:

**Concept Template:**
```markdown
# [Concept Name]

## What is it?
Brief definition (1-2 sentences)

## Why is it important?
Relevance to interviews and real-world

## Key Points
- Bullet point 1
- Bullet point 2

## Example
Practical example with code

## Common Pitfalls
What to avoid

## Interview Tips
How to discuss this in interviews

## References
- Link 1
- Link 2
```

**Tutorial Template:**
```markdown
# [Tutorial Title]

## Prerequisites
What you should know first

## Learning Objectives
What you'll learn

## Step-by-Step Guide
1. Step 1
2. Step 2

## Practice Exercise
Try it yourself

## Summary
Quick recap

## Next Steps
What to learn next
```

---

**Document Control:**
- Created: February 15, 2026
- Last Updated: February 15, 2026
- Authors: Product Development Team
- Reviewers: CTO, Lead Developer
- Status: Draft - Pending Technical Review
