# Question-Knowledge Linking Mechanism Guide

**Project:** Smart Interview Guideline (S.I.G)  
**Date:** February 15, 2026

## Overview

This document explains the recommended approach for linking Questions (used to scan memory and check knowledge) to Knowledge (learning content). The system uses a **multi-layered linking strategy** that balances flexibility with structure.

## The Challenge

Your requirements:
- **Questions**: Scan memory, check knowledge, stored with JSON options
- **Knowledge**: Learning content in markdown format
- **Two modes**: On-fly (dynamic) and Prebuilt (curated in database)
- **Problem**: How to link questions to relevant knowledge for personalized learning recommendations?

## Recommended Solution: Multi-Layered Linking

We use **three complementary mechanisms** working together:

```
┌─────────────────────────────────────────────────────────────┐
│                    LINKING MECHANISMS                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SKILL-BASED TAXONOMY (Primary, Structured)              │
│     ├─ Questions ─→ Skills ←─ Knowledge                    │
│     └─ Automatic: Same skills = Related content            │
│                                                              │
│  2. DIRECT REFERENCES (Explicit, Curated)                   │
│     └─ Admin manually links Question → Knowledge            │
│        with relationship types (prerequisite, remedial)      │
│                                                              │
│  3. SEMANTIC ANALYSIS (Smart, AI-powered)                   │
│     └─ AI analyzes content similarity                       │
│        and suggests relevant links                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: Skill-Based Taxonomy (Primary Linking)

**How it works:**
- Both Questions and Knowledge are tagged with Skills
- Skills organized in hierarchical taxonomy (e.g., JavaScript → React → Hooks)
- Content with overlapping skills is automatically related

**Example:**

```
Question #42:
  Title: "Understanding useEffect Dependencies"
  Skills: [React, Hooks, useEffect]
  ↓
  System finds all Knowledge tagged with same skills
  ↓
Knowledge #15:
  Title: "React Hooks Deep Dive"
  Skills: [React, Hooks, useEffect]
  ✓ Automatic match!
```

**Advantages:**
- Scales well (add skills once, links automatically)
- Maintainable (update skills, links update)
- Works for on-fly content (just assign skills)

**Database Structure:**

```sql
-- Skills (centralized taxonomy)
CREATE TABLE skill_taxonomy (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    parent_skill_id INT REFERENCES skill_taxonomy(id),
    ...
);

-- Link questions to skills
CREATE TABLE question_skill (
    question_id INT REFERENCES questions(id),
    skill_id INT REFERENCES skill_taxonomy(id),
    relevance_score FLOAT, -- 0.0 to 1.0
    PRIMARY KEY (question_id, skill_id)
);

-- Link knowledge to skills
CREATE TABLE knowledge_skill (
    knowledge_id INT REFERENCES knowledge(id),
    skill_id INT REFERENCES skill_taxonomy(id),
    relevance_score FLOAT,
    PRIMARY KEY (knowledge_id, skill_id)
);
```

### Layer 2: Direct References (Explicit Linking)

**How it works:**
- Admin manually creates direct links between specific Questions and Knowledge
- Links have **types** that indicate the relationship

**Link Types:**

1. **Prerequisite**: Knowledge to study *before* attempting the question
   - Example: "Learn about Promises" before "Async/Await question"

2. **Remedial**: Knowledge to review *after* answering incorrectly
   - Example: Failed "SQL JOIN question" → Review "Understanding SQL JOINs"

3. **Advanced**: Deeper knowledge for those who *mastered* the question
   - Example: Aced "Basic React question" → Read "Advanced React Patterns"

4. **Related**: Tangentially related content
   - Example: "Docker question" related to "Container Orchestration with Kubernetes"

**Example Workflow:**

```
User answers Question #42 incorrectly
  ↓
System checks direct links of type "remedial"
  ↓
Recommends:
  1. Knowledge #15 (relevance: 0.95) - "React Hooks Fundamentals"
  2. Knowledge #23 (relevance: 0.80) - "useEffect Common Mistakes"
```

**Database Structure:**

```sql
CREATE TABLE question_knowledge_link (
    id INT PRIMARY KEY,
    question_id INT REFERENCES questions(id),
    knowledge_id INT REFERENCES knowledge(id),
    link_type ENUM('prerequisite', 'remedial', 'advanced', 'related'),
    relevance_score FLOAT,
    created_by ENUM('auto', 'admin', 'algorithm'),
    created_at TIMESTAMP
);
```

### Layer 3: Semantic Analysis (AI-Powered)

**How it works:**
- AI analyzes the actual content (text) of questions and knowledge
- Generates similarity scores based on meaning, not just keywords
- Suggests links admin can approve

**Example:**

```
Question: "Explain the difference between JWT and session-based authentication"
  ↓ AI analyzes content
Knowledge: "Authentication Strategies: Stateless vs Stateful"
  ↓ High semantic similarity (0.87)
System suggests: Link these as "related"
```

**Technology:**
- OpenAI Embeddings API (converts text to vectors)
- Vector similarity search (cosine similarity)
- Thresholds: >0.8 = strong match, 0.6-0.8 = related

**Advantages:**
- Finds non-obvious connections
- Works even without explicit skill tagging
- Improves over time with admin feedback

## How the System Uses All Three Layers

### Scenario 1: User Answers Question Incorrectly

```
Step 1: Check Direct Links (Layer 2)
  → If "remedial" links exist, prioritize these

Step 2: Find Knowledge via Skills (Layer 1)
  → Get all knowledge with same skills
  → Filter by difficulty (match user's level)

Step 3: Enhance with Semantic Analysis (Layer 3)
  → Rank results by content similarity
  → Include semantically similar but different skills

Step 4: Generate Learning Path
  → Combine results, sort by relevance
  → Return top 3-5 knowledge articles
```

### Scenario 2: On-Fly Question Generation

```
Step 1: AI generates question for skill "Docker"
  → Question created with skill_ids: [Docker, Containers]

Step 2: Immediate linking via Skills (Layer 1)
  → System auto-finds knowledge tagged "Docker"
  → No manual linking needed!

Step 3: Optional enhancement
  → If question saved to warehouse later
  → Admin can add direct links (Layer 2)
```

### Scenario 3: Admin Curating Content

```
Admin creates Knowledge: "Python List Comprehensions"
  ↓
Assigns skills: [Python, Data Structures]
  ↓ Layer 1 activates
System finds 12 questions with those skills
  ↓
Admin reviews suggestions
  ↓ Layer 2
Admin creates direct link:
  Question #88 → This Knowledge (type: "remedial")
  ↓ Layer 3 (background)
AI suggests 3 more semantically similar questions
  Admin approves 2
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  USER ANSWERS QUESTION INCORRECTLY                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  LEARNING PATH RECOMMENDATION ENGINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Check QuestionKnowledgeLink table                       │
│     WHERE question_id = ? AND link_type = 'remedial'        │
│     → Direct recommendations (highest priority)             │
│                                                              │
│  2. Query via Skills                                         │
│     SELECT knowledge WHERE skills IN (question.skills)      │
│     → Skill-based recommendations                           │
│                                                              │
│  3. Semantic similarity search                               │
│     Find knowledge with similar content embedding           │
│     → AI-powered recommendations                             │
│                                                              │
│  4. Combine and rank                                         │
│     - Direct links: weight = 1.0                            │
│     - Skill matches: weight = 0.6                           │
│     - Semantic matches: weight = 0.4                        │
│                                                              │
│  5. Personalize                                              │
│     - Filter out already-read articles                      │
│     - Match user's difficulty level                         │
│     - Consider user's learning pace                         │
│                                                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  RETURN TOP 3-5 KNOWLEDGE ARTICLES                           │
│  With estimated learning time and relevance scores           │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Priority

### Phase 1: MVP (Must Have)
✓ Layer 1: Skill-based taxonomy
  - Implement skill management
  - Link questions/knowledge to skills
  - Basic skill-based recommendations

✓ Layer 2: Direct references
  - Manual linking interface for admins
  - Support all 4 link types
  - Use in recommendation engine

### Phase 2: Enhancement (Should Have)
✓ Auto-suggest links based on skills
✓ Relevance scoring refinement
✓ Bidirectional linking (see links from both sides)

### Phase 3: AI-Powered (Nice to Have)
✓ Layer 3: Semantic analysis
✓ AI-powered link suggestions
✓ Continuous learning from admin feedback

## Example Database Queries

### Query 1: Find Knowledge for Failed Question

```sql
-- Get recommended knowledge for a question the user failed
WITH direct_links AS (
    -- Direct manual links (highest priority)
    SELECT 
        k.*,
        qkl.relevance_score,
        1.0 as source_weight,
        'direct' as source_type
    FROM knowledge k
    JOIN question_knowledge_link qkl ON k.id = qkl.knowledge_id
    WHERE qkl.question_id = ?
      AND qkl.link_type IN ('remedial', 'prerequisite')
),
skill_matches AS (
    -- Knowledge with same skills
    SELECT 
        k.*,
        AVG(ks.relevance_score) as relevance_score,
        0.6 as source_weight,
        'skill' as source_type
    FROM knowledge k
    JOIN knowledge_skill ks ON k.id = ks.knowledge_id
    WHERE ks.skill_id IN (
        SELECT skill_id 
        FROM question_skill 
        WHERE question_id = ?
    )
    AND k.status = 'published'
    GROUP BY k.id
)
SELECT * FROM (
    SELECT * FROM direct_links
    UNION ALL
    SELECT * FROM skill_matches
) combined
ORDER BY (relevance_score * source_weight) DESC
LIMIT 5;
```

### Query 2: Auto-Link Questions to New Knowledge

```sql
-- When new knowledge is created, find questions to link
SELECT 
    q.id,
    q.title,
    COUNT(DISTINCT qs.skill_id) as shared_skills,
    AVG(qs.relevance_score) as avg_relevance
FROM questions q
JOIN question_skill qs ON q.id = qs.question_id
WHERE qs.skill_id IN (
    SELECT skill_id 
    FROM knowledge_skill 
    WHERE knowledge_id = ? -- new knowledge ID
)
AND q.status = 'approved'
GROUP BY q.id, q.title
HAVING COUNT(DISTINCT qs.skill_id) >= 2
ORDER BY shared_skills DESC, avg_relevance DESC
LIMIT 10;
```

## JSON Structure Examples

### Question with Skills and Links

```json
{
  "id": 42,
  "title": "Understanding useEffect Dependencies",
  "content": "Which of the following will cause useEffect to re-run?",
  "question_type": "multiple_choice",
  "options": {
    "choices": [
      {"id": "a", "text": "When any state changes", "is_correct": false},
      {"id": "b", "text": "When dependencies change", "is_correct": true},
      {"id": "c", "text": "On every render", "is_correct": false},
      {"id": "d", "text": "Never", "is_correct": false}
    ]
  },
  "skills": [
    {"id": 15, "name": "React", "relevance": 1.0},
    {"id": 28, "name": "Hooks", "relevance": 1.0},
    {"id": 31, "name": "useEffect", "relevance": 1.0}
  ],
  "linked_knowledge": {
    "prerequisite": [
      {"id": 10, "title": "React Basics", "relevance": 0.8}
    ],
    "remedial": [
      {"id": 15, "title": "React Hooks Deep Dive", "relevance": 0.95},
      {"id": 23, "title": "useEffect Common Mistakes", "relevance": 0.85}
    ],
    "advanced": [
      {"id": 45, "title": "Custom Hooks Patterns", "relevance": 0.75}
    ]
  }
}
```

### Knowledge with Skills and Linked Questions

```json
{
  "id": 15,
  "title": "React Hooks Deep Dive",
  "slug": "react-hooks-deep-dive",
  "content": "# React Hooks Deep Dive\n\n## What are Hooks?...",
  "summary": "Comprehensive guide to React Hooks including useState, useEffect, and custom hooks",
  "content_type": "tutorial",
  "difficulty": "intermediate",
  "skills": [
    {"id": 15, "name": "React", "relevance": 1.0},
    {"id": 28, "name": "Hooks", "relevance": 1.0}
  ],
  "linked_questions": {
    "tests_this": [42, 56, 78],
    "requires_this": [91, 103]
  },
  "visual_content": {
    "diagrams": [
      {
        "type": "mermaid",
        "code": "graph TD\n  A[Component] --> B[useState]\n  A --> C[useEffect]",
        "position": "after_paragraph_2"
      }
    ]
  }
}
```

## API Endpoint Examples

### Get Recommended Knowledge for Question

```
GET /api/questions/{question_id}/recommended-knowledge?user_id={user_id}

Response:
{
  "success": true,
  "data": {
    "learning_path": [
      {
        "knowledge_id": 15,
        "title": "React Hooks Deep Dive",
        "summary": "...",
        "relevance": 0.95,
        "estimated_time_minutes": 15,
        "link_type": "remedial",
        "source": "direct_link"
      },
      {
        "knowledge_id": 23,
        "title": "useEffect Common Mistakes",
        "summary": "...",
        "relevance": 0.85,
        "estimated_time_minutes": 10,
        "link_type": "skill_match",
        "source": "skill_based"
      }
    ],
    "total_time_minutes": 25
  }
}
```

### Link Question to Knowledge (Admin)

```
POST /api/admin/questions/{question_id}/link-knowledge

Request Body:
{
  "knowledge_id": 15,
  "link_type": "remedial",
  "relevance_score": 0.95
}

Response:
{
  "success": true,
  "message": "Knowledge linked successfully",
  "data": {
    "link_id": 789,
    "question_id": 42,
    "knowledge_id": 15,
    "link_type": "remedial",
    "relevance_score": 0.95
  }
}
```

## Benefits of This Approach

### 1. Flexibility
- Works for both on-fly and prebuilt content
- Admins can add structure gradually
- AI assists but doesn't replace human curation

### 2. Scalability
- Skill taxonomy grows with content
- Automatic linking reduces manual work
- New skills/content integrate seamlessly

### 3. Accuracy
- Multiple linking methods = higher accuracy
- Direct links for critical relationships
- AI finds non-obvious connections

### 4. Maintainability
- Central skill taxonomy = single source of truth
- Update skills, links auto-update
- Easy to audit and fix broken links

### 5. User Experience
- Precise recommendations
- Multiple relevant options
- Learns from user behavior over time

## Migration Path

If you decide to implement this:

**Week 1-2: Foundation**
- Create skill taxonomy tables
- Build skill management UI
- Implement basic CRUD for skills

**Week 3-4: Layer 1**
- Add skill assignment to questions/knowledge
- Build autocomplete skill selector
- Implement skill-based recommendations

**Week 5-6: Layer 2**
- Create direct linking tables
- Build manual linking UI for admins
- Integrate with recommendation engine

**Week 7-8: Polish**
- Add relevance scoring
- Optimize queries
- Build analytics dashboard

**Future: Layer 3**
- Integrate OpenAI embeddings
- Build semantic similarity search
- Add AI-powered suggestions

## Conclusion

This multi-layered linking mechanism provides:
- **Structure** via skill taxonomy (Layer 1)
- **Precision** via direct links (Layer 2)
- **Intelligence** via AI analysis (Layer 3)

Start with Layers 1 and 2 for MVP, add Layer 3 when you need advanced features. This approach scales from hundreds to millions of questions and knowledge articles while maintaining accuracy and usability.

---

**Questions or Need Clarification?**

Refer to the full SRS (`question-knowledge-warehouse-srs.md`) and User Stories (`question-knowledge-warehouse-user-stories.md`) for implementation details.
