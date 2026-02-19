# User Stories: Question & Knowledge Warehouse

**Project:** Smart Interview Guideline (S.I.G)  
**Version:** 2.0  
**Date:** February 15, 2026

## Overview

This document contains detailed user stories for the Question and Knowledge Warehouse system. Stories are organized by Epic and prioritized for development.

## Story Format

Each user story follows this format:
- **ID**: Unique identifier
- **As a**: User role
- **I want to**: Desired functionality
- **So that**: Business value
- **Acceptance Criteria**: Testable conditions
- **Priority**: Must Have / Should Have / Nice to Have
- **Estimate**: Story points (Fibonacci: 1, 2, 3, 5, 8, 13)
- **Dependencies**: Other stories required first

---

## Epic 1: Question Warehouse Management

### Story QM-1.1: Create Question as Admin

**As an** Admin  
**I want to** create interview questions with multiple question types  
**So that** I can build a comprehensive question bank for memory scanning

**Acceptance Criteria:**
1. Admin can access "Create Question" page from admin dashboard
2. Required fields are enforced:
   - Title (max 255 characters)
   - Content/Question text (markdown supported)
   - Question type (dropdown: multiple_choice, true_false, scenario, coding)
   - Difficulty (dropdown: beginner, intermediate, advanced, expert)
3. Options field dynamically changes based on question type:
   - Multiple choice: JSON editor with choices array, is_correct flags
   - True/False: Simple radio buttons
   - Scenario: Rich text editor for scenario description
   - Coding: Language selector, starter code, test cases
4. Optional fields available:
   - Explanation (markdown)
   - Estimated time (in seconds)
   - Tags (multi-select with autocomplete)
5. JSON editor validates format before saving
6. Admin can preview question as users would see it
7. Admin can save as draft or immediately approve
8. Success message shown after creation with link to view question
9. Validation errors displayed clearly with field highlighting

**Priority:** Must Have  
**Estimate:** 8 points  
**Dependencies:** None

---

### Story QM-1.2: Edit Existing Question

**As an** Admin  
**I want to** edit any existing question  
**So that** I can fix errors and improve question quality

**Acceptance Criteria:**
1. Admin can search and find questions by title, tags, or ID
2. Edit page pre-fills all existing data
3. Admin can modify any field except:
   - Created date
   - Created by user
4. System tracks change history (who changed what and when)
5. If question is "approved" and used in active quizzes, show warning before saving
6. Version number increments after each edit
7. Admin can see "last modified" metadata
8. Changes saved atomically (all or nothing)

**Priority:** Must Have  
**Estimate:** 5 points  
**Dependencies:** QM-1.1

---

### Story QM-1.3: Delete Question with Safety Checks

**As an** Admin  
**I want to** delete questions that are incorrect or no longer relevant  
**So that** the question bank maintains high quality

**Acceptance Criteria:**
1. Delete button available on question detail page
2. Confirmation modal shows:
   - Question title
   - Usage statistics (how many times used)
   - Warning if question is linked to knowledge articles
3. Admin must type "DELETE" to confirm
4. Soft delete: Question marked as deleted but retained in database
5. Deleted questions excluded from searches and quizzes
6. Admin can view and restore deleted questions from "Deleted Items" page
7. Hard delete option available for admins (permanent removal after 30 days)
8. Deletion logged in audit trail

**Priority:** Should Have  
**Estimate:** 3 points  
**Dependencies:** QM-1.1

---

### Story QM-1.4: List and Filter Questions

**As an** Admin  
**I want to** view all questions with powerful filtering  
**So that** I can quickly find specific questions

**Acceptance Criteria:**
1. Questions displayed in paginated table (20 per page)
2. Table columns:
   - ID
   - Title (truncated, clickable to detail)
   - Type (icon badge)
   - Difficulty (color-coded badge)
   - Status (draft/approved/rejected)
   - Skills (first 3 shown, "+ N more" if more)
   - Created by
   - Created date
   - Actions (Edit/Delete/View)
3. Filters available:
   - Status (multi-select)
   - Question type (multi-select)
   - Difficulty (multi-select)
   - Skills (autocomplete multi-select)
   - Tags (autocomplete multi-select)
   - Created by user (search)
   - Date range
   - Source type (on_fly, admin_curated, user_contributed)
   - Official status (yes/no/all)
4. Search box searches: title, content, tags
5. Sort by any column (ascending/descending)
6. Bulk actions:
   - Select multiple questions (checkboxes)
   - Bulk approve
   - Bulk reject
   - Bulk add tags
   - Bulk assign skills
   - Bulk delete
7. Export to CSV functionality
8. Filter state persisted in URL (shareable links)

**Priority:** Must Have  
**Estimate:** 8 points  
**Dependencies:** QM-1.1

---

### Story QM-1.5: Assign Skills to Question

**As an** Admin  
**I want to** assign one or more skills to a question  
**So that** questions can be linked to knowledge through skill taxonomy

**Acceptance Criteria:**
1. Skills section in create/edit question form
2. Autocomplete search for skills (shows hierarchical path)
3. Can assign multiple skills to one question
4. Each skill assignment has optional relevance score (0.0-1.0)
   - Default: 1.0 (highly relevant)
   - Slider or input to adjust
5. Skills displayed as removable chips
6. If skill doesn't exist, option to "Create new skill" inline
7. Shows skill hierarchy (e.g., "JavaScript → React → Hooks")
8. Can assign both parent and child skills
9. Warning if no skills assigned to question
10. Bulk skill assignment available from question list page

**Priority:** Must Have  
**Estimate:** 5 points  
**Dependencies:** SM-3.1 (Skill Management)

---

### Story QM-1.6: Link Question to Knowledge Articles

**As an** Admin  
**I want to** directly link questions to specific knowledge articles  
**So that** users get targeted learning recommendations when they answer incorrectly

**Acceptance Criteria:**
1. "Linked Knowledge" section in question edit page
2. Search interface to find knowledge articles:
   - By title
   - By skills
   - By tags
3. Can add multiple knowledge links with different types:
   - Prerequisite: Learn this before attempting question
   - Remedial: Review this if answered incorrectly
   - Advanced: Deeper dive for correct answerers
   - Related: Tangentially related content
4. Each link has relevance score (0.0-1.0)
5. Links displayed in organized sections by type
6. Can reorder links within each type (drag and drop)
7. Remove link button for each linked article
8. System auto-suggests knowledge based on shared skills
9. Preview knowledge article in modal without leaving page
10. Shows bidirectional link (knowledge article shows linked questions)

**Priority:** Must Have  
**Estimate:** 8 points  
**Dependencies:** KM-2.1 (Knowledge Management)

---

### Story QM-1.7: Preview Question as User Would See It

**As an** Admin  
**I want to** preview how a question appears to users  
**So that** I can verify formatting and user experience before publishing

**Acceptance Criteria:**
1. "Preview" button available in create/edit page
2. Preview opens in modal or side panel
3. Shows question exactly as rendered to users:
   - Formatted markdown
   - Option buttons/radio buttons as users see them
   - Timer if applicable
   - All visual elements
4. Preview includes different states:
   - Initial question view
   - After answer selection
   - After submission with explanation
5. Can switch between desktop/tablet/mobile preview
6. Preview updates in real-time as admin edits (live preview mode)
7. No actual data submitted during preview
8. Can copy preview link to share with other admins for review

**Priority:** Should Have  
**Estimate:** 5 points  
**Dependencies:** QM-1.1

---

### Story QM-1.8: Approve/Reject User-Contributed Questions

**As an** Admin  
**I want to** review and approve or reject user-contributed questions  
**So that** only high-quality content enters the question bank

**Acceptance Criteria:**
1. Pending questions appear in "Content Review" dashboard
2. Each pending question shows:
   - Contributor name and reputation score
   - Submission date
   - Question content in preview
   - Suggested skills and tags
3. Admin can:
   - Approve: Question becomes available for use
   - Reject: Question hidden from contributor
   - Request Revision: Send back with feedback
4. Feedback form for reject/revision:
   - Free text field for specific feedback
   - Common issue checkboxes (unclear wording, incorrect answer, missing explanation)
5. Admin can edit question during review before approving
6. Contributor notified via email and in-app notification
7. Approved questions credited to original contributor
8. Admin can mark approved question as "Official" (promoted)
9. Statistics shown: total reviewed, approved %, rejected %
10. Can filter pending by date, contributor, skill

**Priority:** Must Have  
**Estimate:** 8 points  
**Dependencies:** QM-1.4, UC-5.1 (User Contribution)

---

### Story QM-1.9: Promote Question to Official Status

**As an** Admin  
**I want to** promote high-quality questions to "official" status  
**So that** users know which questions are expertly vetted

**Acceptance Criteria:**
1. "Promote to Official" button on question detail page
2. Only approved questions can be promoted
3. Modal shows:
   - Current question stats (usage, success rate)
   - Confirmation checkbox
   - Optional notes field
4. Official badge displayed prominently on question
5. Official questions prioritized in:
   - Memory scans
   - Search results
   - Practice quizzes
6. Admin can demote from official (with confirmation)
7. Audit log tracks promotion/demotion with admin name
8. Contributor notified when their question promoted
9. Contributor earns bonus reputation points
10. Official questions highlighted in admin list (special icon)

**Priority:** Should Have  
**Estimate:** 3 points  
**Dependencies:** QM-1.1

---

### Story QM-1.10: View Question Analytics

**As an** Admin  
**I want to** see analytics for each question  
**So that** I can identify which questions are effective and which need improvement

**Acceptance Criteria:**
1. Analytics tab on question detail page
2. Metrics displayed:
   - Total times used
   - Success rate (% answered correctly)
   - Average time to answer
   - Skip rate (% who skipped)
   - User difficulty rating vs. admin-set difficulty
3. Charts:
   - Success rate over time (line chart)
   - Performance by user skill level (bar chart)
4. Segmentation:
   - By user experience level
   - By interview target role
   - By time period
5. Related analytics:
   - Which knowledge articles most viewed after this question
   - Correlation with other questions (users who get this right also get X right)
6. Flag questions with:
   - Too easy (>90% success rate)
   - Too hard (<20% success rate)
   - Confusing (high skip rate)
7. Export analytics to CSV
8. Compare question performance with similar questions

**Priority:** Nice to Have  
**Estimate:** 13 points  
**Dependencies:** QM-1.1, Analytics infrastructure

---

## Epic 2: Knowledge Warehouse Management

### Story KM-2.1: Create Knowledge Article as Admin

**As an** Admin  
**I want to** create markdown-based knowledge articles  
**So that** users have high-quality learning resources

**Acceptance Criteria:**
1. Admin can access "Create Knowledge" page
2. Rich markdown editor with:
   - Live preview (side-by-side or toggle)
   - Syntax highlighting
   - Common markdown shortcuts (Ctrl+B for bold, etc.)
   - Image upload (drag & drop)
   - Code block with language selection
   - Table builder
   - Link insertion helper
3. Required fields:
   - Title (max 255 characters, auto-generates slug)
   - Slug (editable, URL-friendly, unique validation)
   - Content (markdown)
   - Summary (max 500 characters)
   - Content type (dropdown: concept, tutorial, example, tips, visualization)
   - Difficulty (dropdown: beginner, intermediate, advanced, expert)
4. Optional fields:
   - Estimated read time (auto-calculated, editable)
   - Visual content (JSON editor for images, diagrams, videos)
   - References (add external links with title, URL, type)
   - Tags (multi-select with autocomplete)
5. Visual content section:
   - Add image: URL, alt text, caption, position in article
   - Add diagram: Type (mermaid, flowchart), code, position
   - Add video: URL, platform (YouTube, Vimeo), duration
6. Admin can:
   - Save as draft
   - Publish immediately
   - Schedule publish date/time
7. Slug validation: Must be unique, lowercase, hyphens only
8. Duplicate detection: Warn if similar title exists
9. SEO preview showing title, slug, summary as would appear in search

**Priority:** Must Have  
**Estimate:** 13 points  
**Dependencies:** None

---

### Story KM-2.2: Edit Knowledge Article with Version History

**As an** Admin  
**I want to** edit knowledge articles and track changes  
**So that** content stays up-to-date and changes are auditable

**Acceptance Criteria:**
1. Edit page identical to create page, pre-filled with existing data
2. Version history panel shows:
   - List of all versions (version number, date, editor)
   - Diff view comparing any two versions
   - Ability to restore previous version
3. Major vs. minor version:
   - Admin selects "Major" (1.0 → 2.0) or "Minor" (1.0 → 1.1)
   - Required change notes for major versions
4. Auto-save drafts every 30 seconds (local storage backup)
5. Warning if another admin is editing same article
6. Can revert to any previous version (creates new version)
7. Published articles show "Last updated" date
8. Change notes displayed to users if they've read previous version
9. Markdown diff shown for text changes
10. Can compare current draft with published version

**Priority:** Should Have  
**Estimate:** 8 points  
**Dependencies:** KM-2.1

---

### Story KM-2.3: Assign Skills to Knowledge Article

**As an** Admin  
**I want to** assign skills to knowledge articles  
**So that** articles can be discovered through skill-based search

**Acceptance Criteria:**
1. Skills section in create/edit knowledge form
2. Same autocomplete skill search as questions
3. Can assign multiple skills with relevance scores
4. Hierarchical skill display
5. If assigning child skill, option to auto-assign parent
6. Validation: At least one skill required before publishing
7. Skills shown as chips, removable
8. Bulk skill assignment from knowledge list
9. Suggest skills based on:
   - Content analysis (keywords)
   - Similar articles' skills
10. Show count of questions linked via each skill

**Priority:** Must Have  
**Estimate:** 5 points  
**Dependencies:** SM-3.1

---

### Story KM-2.4: Link Knowledge to Questions

**As an** Admin  
**I want to** link knowledge articles to relevant questions  
**So that** learners get comprehensive understanding

**Acceptance Criteria:**
1. "Linked Questions" section in knowledge edit page
2. Search questions by:
   - Title
   - Skills
   - Difficulty
   - Type
3. Can add multiple question links with type:
   - Tests this knowledge: Questions that assess understanding
   - Requires this knowledge: Questions where this is prerequisite
   - Extended by this knowledge: Advanced questions
4. Each link has relevance score
5. Organize questions by type in separate sections
6. Preview question in modal
7. Auto-suggest questions based on:
   - Shared skills
   - Content similarity
   - Difficulty match
8. Bidirectional linking (questions show this knowledge article)
9. Can reorder questions within sections
10. Statistics: How many users viewed this knowledge after each question

**Priority:** Must Have  
**Estimate:** 8 points  
**Dependencies:** KM-2.1, QM-1.1

---

### Story KM-2.5: Manage Visual Content in Knowledge

**As an** Admin  
**I want to** easily add and manage images, diagrams, and videos  
**So that** knowledge articles are visually engaging

**Acceptance Criteria:**
1. Visual content panel in knowledge editor
2. For images:
   - Upload via drag & drop or file picker
   - Paste from clipboard
   - Auto-resize and optimize
   - Generate thumbnail
   - Alt text and caption fields
   - Position: "after paragraph X" or "floating right/left"
   - Uploaded to CDN, URL stored in JSON
3. For diagrams:
   - Built-in Mermaid editor
   - Templates: flowchart, sequence, ERD, timeline
   - Live preview
   - Export as SVG or PNG
4. For videos:
   - Embed YouTube/Vimeo by URL
   - Auto-fetch metadata (title, duration, thumbnail)
   - Option to use custom thumbnail
   - Embed shows in preview
5. All visual content stored in JSON structure:
   ```json
   {
     "images": [...],
     "diagrams": [...],
     "videos": [...]
   }
   ```
6. Can reorder visual content
7. Delete with confirmation
8. Preview article with all visual content rendered
9. Lazy loading for images/videos in user view
10. Accessibility: Require alt text for images

**Priority:** Should Have  
**Estimate:** 13 points  
**Dependencies:** KM-2.1, CDN setup

---

### Story KM-2.6: Add External References

**As an** Admin  
**I want to** add external references to knowledge articles  
**So that** users can explore topics further

**Acceptance Criteria:**
1. References section at bottom of knowledge editor
2. Add reference form:
   - Title (required)
   - URL (required, validated)
   - Type: official_doc, blog_post, video, book, academic_paper
   - Description (optional, 200 char max)
3. References displayed as organized list:
   - Official documentation first
   - Then by type
   - Then alphabetically
4. Can reorder manually (drag & drop)
5. Each reference shows:
   - Icon based on type
   - Title (linked)
   - Description
   - Edit/Delete buttons
6. URL validation checks:
   - Proper format
   - Not already added
   - Link is accessible (HTTP 200 check, async)
7. Broken link indicator (checked periodically)
8. Can import references from bibliography format
9. Export references in various formats (BibTeX, APA, MLA)
10. In user view, references open in new tab

**Priority:** Should Have  
**Estimate:** 5 points  
**Dependencies:** KM-2.1

---

### Story KM-2.7: Publish, Unpublish, Archive Knowledge

**As an** Admin  
**I want to** control the publication status of knowledge articles  
**So that** only ready content is visible to users

**Acceptance Criteria:**
1. Status states: Draft → Published → Archived
2. Draft:
   - Only visible to admins
   - Can edit freely
   - Not searchable by users
3. Published:
   - Visible to all users
   - Indexed in search
   - Recommended in learning paths
   - Edit requires confirmation (warning: users may be reading)
4. Archived:
   - Not visible to users in search
   - Still accessible via direct link (with "Archived" banner)
   - Can be restored to published
5. Status transition buttons:
   - "Publish" (Draft → Published)
   - "Unpublish" (Published → Draft)
   - "Archive" (Published → Archived)
   - "Restore" (Archived → Published)
6. Publish checklist enforced:
   - Title present
   - Content > 100 words
   - At least one skill assigned
   - Summary present
   - No broken markdown
7. Scheduled publishing:
   - Set future publish date/time
   - Auto-publish at scheduled time
8. Notification to followers when article published/updated
9. Analytics: Views by status, time in each status
10. Bulk status change from knowledge list

**Priority:** Must Have  
**Estimate:** 8 points  
**Dependencies:** KM-2.1

---

### Story KM-2.8: Review User-Contributed Knowledge

**As an** Admin  
**I want to** review user-contributed knowledge articles  
**So that** only accurate and well-written content is published

**Acceptance Criteria:**
1. Pending knowledge articles in "Content Review" dashboard
2. Review interface shows:
   - Contributor info and reputation
   - Article in rendered view
   - Raw markdown (toggle)
   - Suggested skills and tags
   - Plagiarism check status
3. Admin actions:
   - Approve & Publish
   - Approve as Draft (needs polish, admin will finish)
   - Request Revision (with feedback)
   - Reject (with reason)
4. Feedback form:
   - Predefined issues (checkboxes): grammar errors, inaccurate info, poor formatting, missing sources
   - Free text for specific feedback
   - Suggestions for improvement
5. Admin can edit article during review
6. Contributor notified of decision
7. For approved articles:
   - Option to mark as "Official"
   - Credit original contributor
   - Contributor earns reputation points
8. Track review metrics:
   - Average review time
   - Approval rate by contributor
9. Can assign reviews to specific admins
10. Review priority queue (oldest first, or by contributor reputation)

**Priority:** Must Have  
**Estimate:** 8 points  
**Dependencies:** KM-2.7, UC-5.2

---

### Story KM-2.9: Search and Filter Knowledge Articles

**As an** Admin  
**I want to** powerful search and filtering for knowledge articles  
**So that** I can quickly find and manage content

**Acceptance Criteria:**
1. Knowledge list page with table view
2. Columns:
   - ID
   - Title (clickable)
   - Slug
   - Type (badge)
   - Difficulty (color-coded)
   - Status
   - Skills (first 3, "+ N more")
   - View count
   - Created by
   - Last updated
   - Actions (Edit/Delete/View)
3. Filters:
   - Status (multi-select: draft, published, archived)
   - Content type (multi-select)
   - Difficulty (multi-select)
   - Skills (autocomplete multi-select)
   - Tags (autocomplete multi-select)
   - Created by (search)
   - Date range (created, updated)
   - Source type
   - Official status
   - Has visual content (yes/no)
   - Has references (yes/no)
4. Search:
   - Full-text search (title, summary, content)
   - Search in markdown content
   - Search in references
5. Sort by any column
6. Bulk actions:
   - Bulk publish
   - Bulk archive
   - Bulk add tags
   - Bulk assign skills
   - Bulk delete
7. View modes: Table, Card (with thumbnail), List
8. Export to CSV/JSON
9. Save filter presets (e.g., "Pending Review", "Recently Updated")
10. Share filtered view via URL

**Priority:** Must Have  
**Estimate:** 8 points  
**Dependencies:** KM-2.1

---

### Story KM-2.10: View Knowledge Article Analytics

**As an** Admin  
**I want to** see analytics for knowledge articles  
**So that** I understand which content is most valuable

**Acceptance Criteria:**
1. Analytics tab on knowledge detail page
2. Metrics:
   - Total views
   - Unique viewers
   - Average time on page
   - Scroll depth (how far users read)
   - Completion rate (read to end)
   - Rating (if users can rate)
   - Feedback count (helpful/not helpful)
3. Traffic sources:
   - Direct link
   - Search
   - Recommended after question
   - Learning path
4. User segments:
   - By role (backend, frontend, etc.)
   - By experience level
   - By learning context (preparing for interview at X company)
5. Related metrics:
   - Which questions lead users here
   - Which articles users view next
   - Conversion: Did users answer related questions correctly after reading?
6. Time-series charts:
   - Views over time
   - Engagement over time
7. Comparison:
   - vs. similar articles (same skill/difficulty)
   - vs. site average
8. Improvement suggestions:
   - Low completion rate → Article too long or not engaging
   - High bounce rate → Title misleading or content doesn't match expectation
9. Export analytics data
10. Dashboard widget: Top performing articles this month

**Priority:** Nice to Have  
**Estimate:** 13 points  
**Dependencies:** KM-2.1, Analytics infrastructure

---

## Epic 3: Skill Taxonomy Management

### Story SM-3.1: Create and Manage Skills

**As an** Admin  
**I want to** create a hierarchical skill taxonomy  
**So that** questions and knowledge can be organized systematically

**Acceptance Criteria:**
1. "Skills" page in admin dashboard
2. Create skill form:
   - Name (required, unique)
   - Slug (auto-generated, editable)
   - Category (dropdown: programming_language, framework, concept, tool, methodology, domain)
   - Parent skill (optional, autocomplete search)
   - Description (markdown)
   - Aliases (array, for search)
   - Is active (boolean, default true)
3. Hierarchical tree view showing:
   - Parent-child relationships
   - Expand/collapse nodes
   - Drag to reorder or change parent
4. For each skill, display:
   - Name and category
   - Question count (linked questions)
   - Knowledge count (linked articles)
   - Usage in learning paths
   - Edit/Delete/Deactivate buttons
5. Skill detail page shows:
   - All linked questions
   - All linked knowledge articles
   - Usage statistics
   - Related skills (often appears with)
6. Validation:
   - Cannot delete skill in use (must archive)
   - Cannot create circular hierarchy (child becomes parent)
7. Bulk operations:
   - Bulk deactivate
   - Bulk merge (combine duplicate skills)
   - Bulk recategorize
8. Search skills by name, category, alias
9. Filter: Active/Inactive, Category, Has content
10. Export skill tree to JSON/CSV

**Priority:** Must Have  
**Estimate:** 13 points  
**Dependencies:** None

---

### Story SM-3.2: Merge Duplicate Skills

**As an** Admin  
**I want to** merge duplicate or similar skills  
**So that** the taxonomy stays clean and organized

**Acceptance Criteria:**
1. "Merge Skills" tool in Skills page
2. Select 2+ skills to merge
3. Preview shows:
   - Skills to be merged
   - Combined question count
   - Combined knowledge count
   - Total usage
4. Choose primary skill (name, slug, description kept)
5. All questions/knowledge linked to merged skills now link to primary
6. Merged skills marked as "aliases" of primary
7. Redirects set up: Merged skill slugs redirect to primary
8. Audit log records merge with:
   - Admin who performed merge
   - Date
   - Skills involved
9. Cannot undo merge (warn admin)
10. Option to merge attributes:
    - Combine descriptions
    - Merge aliases
    - Union of parent skills

**Priority:** Should Have  
**Estimate:** 8 points  
**Dependencies:** SM-3.1

---

### Story SM-3.3: Auto-Suggest Skills Based on Content

**As an** Admin  
**I want to** AI-assisted skill suggestions when creating questions/knowledge  
**So that** skill assignment is faster and more accurate

**Acceptance Criteria:**
1. "Suggest Skills" button in question/knowledge editor
2. AI analyzes content:
   - Keywords in title
   - Technical terms in content
   - Code snippets (detect language/framework)
   - Mentioned technologies
3. Returns ranked list of suggested skills:
   - Skill name
   - Confidence score (0-100%)
   - Reason (e.g., "Detected React code", "Mentioned in title")
4. Admin can:
   - Accept all
   - Accept individual skills
   - Reject suggestions
5. Accepted skills added with confidence score as relevance
6. AI learns from admin accepts/rejects (improve over time)
7. Suggest skills run automatically on save (async)
8. Show notification when suggestions ready
9. Can manually trigger re-analysis
10. Works for both new and edited content

**Priority:** Nice to Have  
**Estimate:** 13 points  
**Dependencies:** SM-3.1, AI service integration

---

## Epic 4: Content Linking Intelligence

### Story CL-4.1: Automatic Skill-Based Linking

**As a** System  
**I want to** automatically link questions and knowledge with matching skills  
**So that** users get relevant recommendations without manual admin work

**Acceptance Criteria:**
1. Background job runs periodically (every hour or on-demand)
2. For each question:
   - Find knowledge articles with overlapping skills
   - Calculate relevance score based on:
     - Number of shared skills
     - Skill relevance scores
     - Difficulty match
     - Content similarity (NLP)
3. Create auto-links with type "related" if score > threshold (0.6)
4. Auto-links have flag: `created_by: 'algorithm'`
5. Admin can review auto-generated links:
   - Approve (convert to manual link)
   - Reject (delete link, teach algorithm)
   - Adjust relevance score
6. Settings page for auto-linking:
   - Enable/disable
   - Relevance threshold (slider 0-1)
   - Max links per question/knowledge
7. Dashboard shows:
   - Auto-links created this week
   - Approval rate
   - Coverage: % of questions/knowledge with auto-links
8. Does not overwrite manual admin links
9. Re-runs when skills changed on question/knowledge
10. Logs linking decisions for debugging

**Priority:** Should Have  
**Estimate:** 13 points  
**Dependencies:** QM-1.6, KM-2.4, SM-3.1

---

### Story CL-4.2: Semantic Content Analysis for Linking

**As a** System  
**I want to** use AI to analyze content similarity  
**So that** links are more intelligent than just skill matching

**Acceptance Criteria:**
1. When question or knowledge created/updated:
   - Extract text content
   - Generate embedding vector (OpenAI embeddings API)
   - Store embedding in database
2. Similarity search:
   - Find questions/knowledge with similar embeddings
   - Cosine similarity score calculated
3. Suggest links based on semantic similarity:
   - High similarity (>0.8): Strong prerequisite candidate
   - Medium similarity (0.6-0.8): Related content
   - Low similarity (<0.6): Ignore
4. Admin sees suggestions in question/knowledge editor:
   - "Similar content found" panel
   - Each suggestion shows:
     - Title
     - Similarity score
     - Suggested link type
     - Preview snippet
5. One-click to create link from suggestion
6. Semantic linking combined with skill-based linking:
   - Final relevance = weighted average (skills 60%, semantic 40%)
7. Performance: Embedding generation async, doesn't block saves
8. Cache embeddings, regenerate only when content changes
9. Vector similarity search optimized (use pgvector or similar)
10. Admin can disable semantic analysis per content item

**Priority:** Nice to Have  
**Estimate:** 21 points  
**Dependencies:** CL-4.1, AI embeddings API, Vector DB

---

### Story CL-4.3: Learning Path Recommendation Engine

**As a** System  
**I want to** recommend personalized knowledge sequences  
**So that** users who answer questions incorrectly get optimal learning paths

**Acceptance Criteria:**
1. When user answers question:
   - If incorrect: Trigger learning path generation
   - If correct but low confidence: Offer refresher
2. Path generation algorithm:
   - Identify skill gaps from question
   - Find knowledge articles for those skills
   - Sort by:
     - Difficulty (beginner first)
     - Link type (prerequisite first, then remedial)
     - Relevance score
     - User's existing knowledge (don't re-recommend read articles)
3. Return ordered list of 3-5 knowledge articles
4. Path includes:
   - Estimated total learning time
   - Difficulty progression
   - Optional vs. required content
5. User sees:
   - "Recommended Learning Path" after incorrect answer
   - Card for each article with title, summary, estimated time
   - "Start Learning" button
6. Track path engagement:
   - Which articles in path were viewed
   - Which were skipped
   - Did user re-attempt question after learning?
7. Adaptive paths:
   - If user skips beginner content, adjust future paths (assume higher level)
   - If user struggles with recommended content, offer easier alternatives
8. Paths saved to user profile for later access
9. Admin can view/debug generated paths
10. A/B testing: Different path algorithms, measure effectiveness

**Priority:** Must Have (for on-fly integration)  
**Estimate:** 21 points  
**Dependencies:** CL-4.1, User progress tracking

---

## Epic 5: User Contribution System

### Story UC-5.1: User Submits Question

**As a** User (Curator)  
**I want to** contribute interview questions I've encountered  
**So that** I can help others and earn reputation

**Acceptance Criteria:**
1. "Contribute" menu in user dashboard
2. "Submit Question" form (simplified version of admin form):
   - Title
   - Question text
   - Question type
   - Options (JSON, with helper UI for common types)
   - Difficulty (optional, system can auto-detect)
   - Explanation
   - Tags (autocomplete from existing)
   - Skills (autocomplete, required: min 1, max 5)
3. Form has helpful guidance:
   - Examples of good questions
   - Formatting tips
   - Reminder to not violate NDA
4. JSON editor for options with validation and templates:
   - Multiple choice template
   - Coding challenge template
5. Preview before submission
6. Save as draft (only user can see)
7. Submit for review:
   - Status changes to "pending_review"
   - User receives confirmation
   - Estimated review time shown (e.g., "Usually reviewed within 2 days")
8. After submission:
   - User cannot edit (must wait for admin feedback)
   - Can view in "My Contributions" page
9. User sees contribution history:
   - Pending count
   - Approved count
   - Rejected count
   - Total reputation earned
10. Gamification:
    - Progress bar to next contribution level
    - Badges for milestones (10 approved, 50 approved, etc.)

**Priority:** Must Have  
**Estimate:** 13 points  
**Dependencies:** QM-1.8 (Admin Review)

---

### Story UC-5.2: User Submits Knowledge Article

**As a** User (Curator)  
**I want to** contribute knowledge articles  
**So that** I can share my expertise and help the community

**Acceptance Criteria:**
1. "Submit Knowledge" form in contribute section
2. Simplified markdown editor:
   - Live preview
   - Basic formatting toolbar
   - Image upload (limit: 3 images, 2MB each)
   - No video embedding (to keep simple)
   - Code block support
3. Required fields:
   - Title
   - Content (min 200 words)
   - Summary
   - Content type
   - Skills (min 1, max 5)
4. Optional fields:
   - Tags
   - References (max 5 external links)
5. Submission guidelines shown:
   - "Must be original content or properly attributed"
   - "Use clear, concise language"
   - "Include practical examples"
   - "Cite sources for factual claims"
6. Plagiarism check before submission:
   - Simple Google search for key phrases
   - Warning if high similarity found (not blocking)
7. Save as draft (unlimited)
8. Submit for review:
   - Confirmation screen with guidelines
   - Checkbox: "I confirm this is original or properly attributed"
9. After submission:
   - Pending status
   - Cannot edit until admin provides feedback
10. User notified at each status change:
    - Pending → Approved: Congratulations + reputation earned
    - Pending → Needs Revision: Feedback with specific changes
    - Pending → Rejected: Reason provided

**Priority:** Must Have  
**Estimate:** 13 points  
**Dependencies:** KM-2.8 (Admin Review)

---

### Story UC-5.3: User Receives Feedback and Revises

**As a** User (Curator)  
**I want to** receive clear feedback on my contributions  
**So that** I can improve and resubmit

**Acceptance Criteria:**
1. Notification when admin provides feedback:
   - Email notification
   - In-app notification (bell icon)
2. "Needs Revision" status in "My Contributions"
3. Feedback displayed:
   - Admin's comments
   - Specific issues highlighted (checklist of problems)
   - Suggestions for improvement
4. Edit page reopened:
   - Original content pre-filled
   - Feedback visible in side panel
   - Can make changes
5. Track revisions:
   - Version number shown (e.g., "Revision 2")
   - Can view previous submission
6. Resubmit button:
   - Optional message to admin: "What I changed"
   - Moves back to pending review queue
   - Flagged as "revised" (may get faster review)
7. Limit revisions: Max 3 revision cycles
   - After 3, either approved or permanently rejected
8. User can also:
   - Withdraw contribution (delete)
   - Ask question to admin (message system)
9. Statistics:
   - Average revision count before approval
   - Your revision rate vs. community average
10. Learning resources:
    - Link to "How to Write Good Questions/Knowledge"
    - Examples of highly-rated contributions

**Priority:** Should Have  
**Estimate:** 8 points  
**Dependencies:** UC-5.1, UC-5.2

---

### Story UC-5.4: User Earns Reputation and Rewards

**As a** User (Curator)  
**I want to** earn reputation points and rewards  
**So that** I'm motivated to contribute quality content

**Acceptance Criteria:**
1. Reputation system:
   - Question approved: +50 points
   - Question promoted to official: +100 bonus
   - Knowledge approved: +100 points
   - Knowledge promoted: +200 bonus
   - Question used in quiz: +5 points per use
   - Knowledge viewed: +1 point per unique view (capped at 500)
2. Reputation levels:
   - 0-100: Novice Contributor
   - 101-500: Contributor
   - 501-1000: Expert Contributor
   - 1001+: Master Curator
3. Level benefits:
   - Higher levels get faster reviews
   - Can skip pre-moderation at Master level (published immediately)
   - Exclusive badges on profile
4. Leaderboard:
   - Top contributors this month
   - All-time top contributors
   - Top contributors by skill category
5. Rewards redeemable with points:
   - Free premium features (if freemium model)
   - Gift cards (if budget allows)
   - Recognition: Featured on homepage, newsletter
6. Profile shows:
   - Total reputation
   - Current level
   - Progress to next level
   - Contribution stats (approved, pending, rejected)
   - Badges earned
7. Badges for achievements:
   - First contribution
   - 10 approved
   - 100 views on your knowledge
   - Question used in 50 quizzes
   - Community favorite (high ratings)
8. Reputation decay: Inactive contributors lose 10% points per year
9. Reputation lost for:
   - Rejected contribution: -5 points
   - Plagiarism confirmed: -500 points + potential ban
10. Transparency: Clear rules page explaining point system

**Priority:** Should Have  
**Estimate:** 13 points  
**Dependencies:** UC-5.1, UC-5.2

---

## Epic 6: On-Fly Content Generation

### Story OF-6.1: Generate Question On-Fly for Memory Scan

**As a** System  
**I want to** dynamically generate questions based on JD analysis  
**So that** users get tailored assessments even without pre-built question bank

**Acceptance Criteria:**
1. Trigger: User completes JD analysis
2. Input: Extracted skills from JD + user profile
3. AI generation prompt:
   - Skill to assess
   - Difficulty level (based on user's experience)
   - Question type (prefer multiple choice for on-fly)
   - Context: Interview at [Company Type] for [Role]
4. AI generates:
   - Question text
   - 4 multiple choice options (JSON format)
   - Correct answer(s)
   - Brief explanation
5. Validation before showing to user:
   - Check JSON validity
   - Ensure one correct answer
   - No duplicate options
   - Language check (no gibberish)
6. If validation fails:
   - Retry generation (max 3 attempts)
   - If still fails, fall back to pre-built question bank
7. Question shown to user immediately (not saved to DB)
8. Metadata tracked:
   - Generated on-fly
   - Generation timestamp
   - AI model used
   - Prompt hash (for debugging)
9. After user answers:
   - Track performance (correct/incorrect, time taken)
   - Store temporarily for session
10. Admin review option:
    - Admin can view on-fly questions used in session
    - Option to "Save to Warehouse" if high quality
    - Saves with source_type: 'on_fly'

**Priority:** Must Have  
**Estimate:** 13 points  
**Dependencies:** AI integration, JD analysis module

---

### Story OF-6.2: Generate Knowledge On-Fly for Learning

**As a** System  
**I want to** dynamically generate knowledge content  
**So that** users get immediate learning resources even for niche topics

**Acceptance Criteria:**
1. Trigger: User answers question incorrectly + no pre-built knowledge for skill
2. Input:
   - Skill/concept to explain
   - User's difficulty level
   - Context: What question they got wrong
3. AI generation prompt:
   - Create concise explanation (300-500 words)
   - Use beginner-friendly language
   - Include practical example
   - Provide references
4. AI generates:
   - Title
   - Markdown content (with code examples if relevant)
   - Summary (1-2 sentences)
   - Suggested references (external links)
5. Content enhancement:
   - Auto-generate diagram if concept is visual (e.g., architecture)
   - Use Mermaid diagram generation
6. Validation:
   - Check markdown syntax
   - Verify code blocks are valid
   - Ensure references are real URLs
7. Content shown to user immediately
8. User feedback:
   - "Was this helpful?" (thumbs up/down)
   - Option to report inaccurate information
9. High-quality on-fly knowledge:
   - Admin notified if content gets high ratings
   - Option to promote to warehouse
   - Admin can edit before saving
10. Metadata tracked:
    - Generated on-fly
    - Skill covered
    - User feedback
    - Times shown to users

**Priority:** Must Have  
**Estimate:** 13 points  
**Dependencies:** AI integration, OF-6.1

---

### Story OF-6.3: Admin Promotes On-Fly to Permanent

**As an** Admin  
**I want to** review and promote high-quality on-fly content to permanent warehouse  
**So that** we build the warehouse from real-world usage

**Acceptance Criteria:**
1. "On-Fly Content Review" page in admin dashboard
2. Lists all on-fly generated content:
   - Questions used in sessions
   - Knowledge shown to users
3. For each item show:
   - Content preview
   - Usage stats (how many times shown, success rate)
   - User feedback (ratings, reports)
   - Quality score (algorithm-calculated)
4. Filters:
   - Type (question/knowledge)
   - Skill
   - Date generated
   - Usage count (min/max)
   - Quality score (high to low)
5. Admin actions:
   - View details (full content, metadata)
   - Edit (opens in standard editor)
   - Promote to warehouse (saves as approved, official)
   - Discard (delete, prevents regeneration)
6. Bulk promote: Select multiple high-quality items
7. When promoting:
   - Admin can edit before saving
   - Assign final skills, tags, difficulty
   - Link to existing questions/knowledge
   - Choose status: draft or published
8. After promotion:
   - Item moved to main warehouse
   - Source_type updated: 'on_fly' → 'admin_curated'
   - Original metadata preserved (for analytics)
9. Analytics:
   - % of on-fly content promoted
   - Quality score distribution
   - Most successful on-fly topics
10. Auto-suggest promotion:
    - System flags high-quality on-fly content
    - Alert admin: "5 on-fly questions ready for review"

**Priority:** Should Have  
**Estimate:** 8 points  
**Dependencies:** OF-6.1, OF-6.2

---

## Epic 7: Content Search and Discovery

### Story SD-7.1: Unified Search Across Questions and Knowledge

**As an** Admin  
**I want to** search across all content types in one place  
**So that** I can quickly find any content regardless of type

**Acceptance Criteria:**
1. Global search bar in admin header
2. Search box with type-ahead suggestions:
   - Shows mixed results: questions, knowledge, skills
   - Highlights matching text
   - Icons differentiate types
3. Full search page with results:
   - Tabbed view: All, Questions, Knowledge, Skills
   - Each result shows:
     - Title (highlighted matches)
     - Type badge
     - Summary/excerpt with match context
     - Metadata (difficulty, status, created date)
     - Quick actions (Edit, View, Delete)
4. Search capabilities:
   - Full-text search (title, content, tags)
   - Fuzzy matching (typo tolerance)
   - Phrase search ("exact match")
   - Boolean operators (AND, OR, NOT)
5. Advanced filters (collapsible panel):
   - All standard filters from list pages
   - Additional: Has links, Has visual content, Last modified
6. Sort results by:
   - Relevance (default)
   - Date (newest/oldest)
   - Popularity (usage/views)
   - Alphabetical
7. Save searches:
   - "Save this search" button
   - Named saved searches
   - Quick access from sidebar
8. Search history:
   - Recent searches (last 10)
   - One-click to repeat search
9. Empty state:
   - If no results, show suggestions
   - "Did you mean...?" for typos
   - Link to create new content
10. Export search results (CSV with basic info)

**Priority:** Should Have  
**Estimate:** 13 points  
**Dependencies:** Full-text search indexing (Elasticsearch or similar)

---

### Story SD-7.2: Tag Management and Exploration

**As an** Admin  
**I want to** manage tags and explore content by tags  
**So that** content organization is consistent and discoverable

**Acceptance Criteria:**
1. "Tags" page in admin dashboard
2. Tag list shows:
   - Tag name
   - Category (if categorized)
   - Usage count (questions + knowledge)
   - Created date
   - Actions (Edit, Merge, Delete)
3. Tag detail page shows:
   - All questions with this tag
   - All knowledge with this tag
   - Related tags (often used together)
   - Tag cloud visualization
4. Tag operations:
   - Rename tag (updates all usages)
   - Merge tags (combine duplicates/similar)
   - Delete unused tags
   - Bulk operations (select multiple tags)
5. Tag categories (optional grouping):
   - Technology (e.g., "Python", "React")
   - Methodology (e.g., "TDD", "Agile")
   - Domain (e.g., "E-commerce", "Finance")
   - Difficulty (e.g., "Beginner-Friendly")
6. Tag suggestions when creating/editing content:
   - Based on title and content analysis
   - Popular tags in same skill
   - Admin's frequently used tags
7. Tag autocomplete:
   - Shows tag name + usage count
   - Groups by category
   - "Create new" option if not found
8. Tag validation:
   - Lowercase only
   - No special characters
   - Max length: 30 characters
   - No duplicate tags on same content
9. Tag analytics:
   - Most used tags
   - Trending tags (increasing usage)
   - Orphaned tags (no content)
10. Tag export/import (CSV/JSON)

**Priority:** Should Have  
**Estimate:** 8 points  
**Dependencies:** None

---

## Epic 8: Content Quality and Moderation

### Story CQ-8.1: Content Moderation Dashboard

**As an** Admin  
**I want to** a unified dashboard for all content moderation  
**So that** I can efficiently review and manage pending content

**Acceptance Criteria:**
1. "Content Review" centralized dashboard
2. Three main queues:
   - Pending Questions (user-contributed)
   - Pending Knowledge (user-contributed)
   - Flagged Content (reported by users)
3. Queue statistics:
   - Total items in each queue
   - Average wait time
   - Oldest item timestamp
   - Today's review count
4. Configurable views:
   - "My Reviews" (assigned to current admin)
   - "Unassigned" (needs reviewer)
   - "Priority" (flagged as urgent or from high-rep users)
5. Bulk review workflow:
   - Select multiple items
   - Batch approve/reject with same feedback
   - Assign to another admin
6. Review assignment:
   - Auto-assign based on admin expertise (matched to content skills)
   - Manual assignment by lead admin
   - Round-robin assignment option
7. Review timer:
   - Track time spent reviewing each item
   - Goal: <5 minutes per item
   - Alerts if item taking too long (suggests asking for help)
8. Review templates:
   - Pre-written feedback messages
   - Common rejection reasons (dropdown)
   - Approval notes templates
9. Keyboard shortcuts for fast review:
   - A: Approve
   - R: Reject
   - E: Edit
   - N: Next item
10. Review metrics:
    - Items reviewed today/this week
    - Average review time
    - Approval rate
    - Backlog trend chart

**Priority:** Should Have  
**Estimate:** 13 points  
**Dependencies:** QM-1.8, KM-2.8

---

### Story CQ-8.2: Duplicate Detection

**As a** System  
**I want to** detect duplicate or highly similar content  
**So that** the warehouse doesn't have redundant entries

**Acceptance Criteria:**
1. When question/knowledge created:
   - Search for similar existing content
   - Calculate similarity score (text similarity + skill overlap)
2. Similarity check:
   - Title similarity (Levenshtein distance)
   - Content similarity (TF-IDF or embeddings)
   - Skill overlap (Jaccard similarity)
3. If high similarity found (>80%):
   - Block creation
   - Show warning: "Similar content found"
   - Display similar items with links
   - Option to view and confirm "This is different"
4. If medium similarity (60-80%):
   - Allow creation with warning
   - Suggestion: "Consider editing existing content instead"
   - Flag for admin review
5. Admin tools:
   - "Find Duplicates" button on list pages
   - Run similarity check across all content
   - Shows potential duplicate groups
   - Side-by-side comparison view
6. Merge duplicates:
   - Choose primary (keep)
   - Merge metadata (combine tags, skills)
   - Redirect all links from duplicate to primary
   - Preserve usage stats (sum them up)
7. False positive handling:
   - Mark as "Not duplicate" (whitelist pair)
   - Similarity threshold adjustable per admin
8. Regular duplicate scanning:
   - Background job runs weekly
   - Email admin with potential duplicates
   - Dashboard widget: "X potential duplicates need review"
9. Exception rules:
   - Same concept, different difficulty: Not duplicate
   - Different question types on same topic: Not duplicate
10. Analytics:
    - Duplicate detection rate
    - False positive rate
    - Time saved by preventing duplicates

**Priority:** Should Have  
**Estimate:** 13 points  
**Dependencies:** Text similarity library, SD-7.1

---

### Story CQ-8.3: Content Quality Scoring

**As a** System  
**I want to** automatically score content quality  
**So that** admins can prioritize review and promotion

**Acceptance Criteria:**
1. Quality score calculated for each question/knowledge
2. Scoring factors for questions:
   - Has clear, concise title (10 points)
   - Has explanation (20 points)
   - Options are well-formed JSON (15 points)
   - Has 2+ skills assigned (15 points)
   - Has 2+ tags (10 points)
   - Appropriate difficulty set (10 points)
   - No spelling errors (10 points)
   - Good grammar (10 points)
   - Total: 100 points
3. Scoring factors for knowledge:
   - Title clear and descriptive (10 points)
   - Content length adequate (200-2000 words) (15 points)
   - Has summary (10 points)
   - Has visual content (images/diagrams) (15 points)
   - Has references (10 points)
   - Has 2+ skills (10 points)
   - Good markdown formatting (10 points)
   - No spelling/grammar errors (10 points)
   - Has code examples (if technical) (10 points)
   - Total: 100 points
4. User engagement factors (added after publication):
   - Usage/views (up to +20 points)
   - User ratings (up to +20 points)
   - Completion rate (knowledge) (up to +10 points)
   - Success rate (questions) (up to +10 points)
5. Quality badges:
   - 90-100: Excellent (gold badge)
   - 75-89: Good (silver badge)
   - 60-74: Adequate (bronze badge)
   - <60: Needs improvement (no badge)
6. Display quality score:
   - In admin list views
   - On detail pages
   - Color-coded (green/yellow/red)
7. Filter by quality score:
   - "Show only high quality" (>75)
   - "Needs improvement" (<60)
8. Auto-promotion candidate:
   - User content with score >85 flagged for quick review
9. Quality improvement suggestions:
   - System shows "Add 2 more tags to improve quality score"
   - Inline suggestions in editor
10. Admin dashboard widget:
    - Average quality score (trend over time)
    - Distribution chart

**Priority:** Should Have  
**Estimate:** 13 points  
**Dependencies:** Content validation library

---

## Epic 9: API and Integration

### Story API-9.1: REST API for Question Retrieval

**As a** Developer  
**I want to** REST API endpoints for question management  
**So that** other system modules can access question warehouse

**Acceptance Criteria:**
1. Endpoints implemented (see SRS section 8)
2. Authentication: Bearer token (JWT)
3. Authorization: Role-based (Admin, User, System)
4. Standard REST conventions:
   - GET: Retrieve
   - POST: Create
   - PUT: Full update
   - PATCH: Partial update
   - DELETE: Remove
5. Pagination:
   - Query params: `page`, `page_size`
   - Response includes: `total`, `page`, `page_size`, `items`
6. Filtering:
   - Multiple filters via query params
   - Example: `/api/questions?difficulty=intermediate&status=approved&skill=python`
7. Sorting:
   - Query param: `sort=field:asc|desc`
   - Example: `/api/questions?sort=created_at:desc`
8. Response format:
   - JSON
   - Consistent structure: `{success, data, errors, meta}`
9. Error handling:
   - Standard HTTP status codes
   - Detailed error messages
   - Validation errors include field names
10. Rate limiting:
    - 100 requests/minute for admin
    - 1000 requests/minute for system
11. API documentation:
    - OpenAPI/Swagger spec
    - Interactive docs at `/api/docs`
12. Versioning: `/api/v1/questions`

**Priority:** Must Have  
**Estimate:** 8 points  
**Dependencies:** None

---

### Story API-9.2: Webhooks for Content Events

**As a** Developer  
**I want to** webhook notifications for content events  
**So that** other systems can react to warehouse changes

**Acceptance Criteria:**
1. Webhook events:
   - `question.created`
   - `question.updated`
   - `question.approved`
   - `question.deleted`
   - `knowledge.created`
   - `knowledge.updated`
   - `knowledge.published`
   - `knowledge.deleted`
   - `skill.created`
   - `skill.updated`
2. Webhook configuration:
   - Admin can add webhook URLs
   - Select which events to subscribe to
   - Optional secret for signature verification
3. Webhook payload:
   ```json
   {
     "event": "question.approved",
     "timestamp": "2026-02-15T10:30:00Z",
     "data": {
       "id": 123,
       "title": "...",
       ...
     }
   }
   ```
4. Delivery:
   - HTTP POST to configured URL
   - Retry logic: 3 attempts with exponential backoff
   - Timeout: 10 seconds
5. Signature:
   - HMAC-SHA256 signature in header
   - Receivers can verify payload authenticity
6. Webhook logs:
   - Admin can view delivery history
   - Status: success, failed, retrying
   - Response codes and errors
7. Webhook testing:
   - "Test webhook" button sends sample payload
   - Shows response for debugging
8. Disable misbehaving webhooks:
   - Auto-disable after 10 consecutive failures
   - Admin notified
9. Webhook management UI:
   - List all configured webhooks
   - Edit URL, events, secret
   - View delivery stats
   - Enable/disable toggle
10. Rate limiting: Max 1 webhook per second

**Priority:** Nice to Have  
**Estimate:** 13 points  
**Dependencies:** API-9.1

---

## Priority Summary

### Must Have (MVP)
Essential features for launch:
- QM-1.1, QM-1.2, QM-1.4, QM-1.5, QM-1.6, QM-1.8 (Question Management)
- KM-2.1, KM-2.3, KM-2.4, KM-2.7, KM-2.8, KM-2.9 (Knowledge Management)
- SM-3.1 (Skill Taxonomy)
- CL-4.3 (Learning Path Engine)
- UC-5.1, UC-5.2 (User Contribution)
- OF-6.1, OF-6.2 (On-Fly Generation)
- API-9.1 (REST API)

**Estimated Total: ~120 story points (~6 sprints at 20 points/sprint)**

### Should Have (Phase 2)
Important for full functionality:
- QM-1.3, QM-1.7, QM-1.9 (Advanced Question Management)
- KM-2.2, KM-2.5, KM-2.6 (Advanced Knowledge Management)
- SM-3.2 (Skill Merging)
- CL-4.1 (Auto-linking)
- UC-5.3, UC-5.4 (Contribution Workflow)
- OF-6.3 (Promote On-Fly)
- SD-7.1, SD-7.2 (Search & Discovery)
- CQ-8.1, CQ-8.2, CQ-8.3 (Quality & Moderation)

**Estimated Total: ~90 story points (~4-5 sprints)**

### Nice to Have (Future)
Enhancing features for optimization:
- QM-1.10 (Question Analytics)
- KM-2.10 (Knowledge Analytics)
- SM-3.3 (AI Skill Suggestions)
- CL-4.2 (Semantic Analysis)
- API-9.2 (Webhooks)

**Estimated Total: ~60 story points (~3 sprints)**

---

## Development Recommendations

### Sprint 0: Foundation (2 weeks)
- Setup database schema (all models)
- Setup API structure
- Setup admin UI framework
- Implement authentication/authorization

### Sprint 1-2: Core Question Management (4 weeks)
- QM-1.1, QM-1.2, QM-1.4
- SM-3.1 (Skills)
- Basic API endpoints

### Sprint 3-4: Core Knowledge Management (4 weeks)
- KM-2.1, KM-2.3, KM-2.7, KM-2.9
- Markdown editor
- Visual content handling

### Sprint 5-6: Linking & Learning Paths (4 weeks)
- QM-1.5, QM-1.6, KM-2.4
- CL-4.3 (Learning path engine)
- Integration with memory scan

### Sprint 7-8: User Contribution (4 weeks)
- UC-5.1, UC-5.2
- QM-1.8, KM-2.8 (Admin review)
- Moderation dashboard (CQ-8.1)

### Sprint 9-10: On-Fly Generation (4 weeks)
- OF-6.1, OF-6.2, OF-6.3
- AI integration
- Quality validation

### Sprint 11-12: Polish & Quality (4 weeks)
- Search (SD-7.1, SD-7.2)
- Quality scoring (CQ-8.3)
- Duplicate detection (CQ-8.2)
- Bug fixes, performance optimization

**Total MVP Timeline: ~24 weeks (6 months)**

---

## Testing Guidelines

Each user story should include:

1. **Unit Tests**:
   - Test data models
   - Test business logic functions
   - Test validation rules

2. **Integration Tests**:
   - Test API endpoints
   - Test database operations
   - Test AI service integration

3. **E2E Tests** (critical flows):
   - Admin creates and approves question
   - User contributes and receives feedback
   - On-fly generation and promotion
   - Learning path recommendation

4. **Manual Testing Checklist**:
   - UI/UX testing
   - Accessibility testing
   - Cross-browser testing
   - Mobile responsiveness

---

**Document Control:**
- Created: February 15, 2026
- Last Updated: February 15, 2026
- Authors: Product Development Team
- Reviewers: Engineering Team, QA Team
- Status: Ready for Estimation and Sprint Planning
