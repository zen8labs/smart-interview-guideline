# Quick Start Guide: Epic 1 - Question Warehouse

**Time to complete:** 5-10 minutes

## Prerequisites

- Docker Desktop installed and running
- Git repository cloned
- `.env` file configured (copy from `.env.example`)

## Step 1: Start the Application (2 min)

```bash
# Start all services
docker compose up -d

# Wait for services to be ready (check logs)
docker compose logs -f app
```

Wait until you see: `Application startup complete`

## Step 2: Create Test Data (1 min)

```bash
# Run the test script to create sample questions and admin user
docker compose exec app python scripts/test_questions_api.py
```

Expected output:
```
✓ Created test admin user
✓ Created 3 test skills
✓ Created 3 test questions with skill assignments
✓ All tests passed!
```

## Step 3: Access Admin Panel (1 min)

1. Open browser: http://localhost:8000/admin/login
2. Login with:
   - Email: `test_admin@example.com`
   - Password: `Admin123!`

## Step 4: Explore Questions (5 min)

### View Questions List
1. Click "Questions" in the sidebar
2. You should see 3 sample questions

### Try Filtering
- Filter by Status: Select "Approved"
- Filter by Difficulty: Select "Beginner"
- Search: Type "Python"

### Create a New Question
1. Click "Create Question" button
2. Fill in the form:
   - Title: "What is a closure?"
   - Content: "In JavaScript, what is a closure?"
   - Type: Multiple Choice
   - Difficulty: Intermediate
3. Click "Insert Template" for options
4. Modify the template JSON
5. Add tags: "javascript", "closures"
6. Click "Show Preview" to see how it looks
7. Click "Create Question"

### Edit a Question
1. Click on any question title
2. Click "Edit Question"
3. Modify any field
4. Click "Update Question"

### Approve/Reject Workflow
1. Find the "Pending Review" question
2. Click on it to view details
3. Click "Approve" or "Reject"
4. For reject, enter feedback

### Bulk Operations
1. Go back to questions list
2. Select multiple questions (checkboxes)
3. Click "Bulk Approve" or "Bulk Reject"

### Promote to Official
1. Find an approved question
2. Click on it to view details
3. Click "Promote to Official"
4. Notice the "Official" badge

## Step 5: Test API Directly (Optional)

### Get Auth Token
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_admin@example.com","password":"Admin123!"}'
```

Copy the `access_token` from response.

### List Questions
```bash
curl http://localhost:8000/api/admin/questions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Question
```bash
curl -X POST http://localhost:8000/api/admin/questions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Question",
    "content": "This is a test question created via API",
    "question_type": "true_false",
    "options": {"correct_answer": true},
    "difficulty": "beginner",
    "tags": ["api", "test"]
  }'
```

## Common Issues

### Issue: "Database connection failed"
**Solution:** 
```bash
# Check if database is running
docker compose ps

# Restart services
docker compose restart
```

### Issue: "Token expired"
**Solution:** Login again to get a new token

### Issue: "Permission denied"
**Solution:** Make sure you're logged in as admin (test_admin@example.com)

### Issue: "Port 8000 already in use"
**Solution:**
```bash
# Stop other services using port 8000
# Or change port in docker-compose.yaml
```

## Next Steps

### Explore More Features
- Try different question types (coding, scenario)
- Assign skills to questions
- Link questions to knowledge (after Epic 2)
- Test bulk operations with many questions

### Development
- Read `dev-docs/epic1-implementation-guide.md` for details
- Check `dev-docs/EPIC1_SUMMARY.md` for overview
- Review code in `app/modules/questions/`

### Continue to Epic 2
- Knowledge Warehouse Management
- Create knowledge articles
- Link knowledge to questions

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Useful Commands

```bash
# View logs
docker compose logs -f app

# Restart backend only
docker compose restart app

# Run database migrations
docker compose exec app alembic upgrade head

# Access database
docker compose exec db psql -U postgres -d smart_interview

# Stop all services
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v
```

## Test Checklist

Use this checklist to verify everything works:

- [ ] Can login to admin panel
- [ ] Can see questions list
- [ ] Can filter by status
- [ ] Can filter by difficulty
- [ ] Can search questions
- [ ] Can create new question
- [ ] Can edit existing question
- [ ] Can delete question
- [ ] Can approve pending question
- [ ] Can reject pending question
- [ ] Can promote to official
- [ ] Can select multiple questions
- [ ] Can bulk approve
- [ ] Can bulk reject
- [ ] Can view question details
- [ ] Can see skills on question
- [ ] Preview works in form

## Support

If you encounter issues:

1. Check logs: `docker compose logs -f app`
2. Review documentation in `dev-docs/`
3. Check existing issues in Git
4. Contact development team

## Success!

If you completed all steps, you now have:
- ✅ Running application
- ✅ Test admin account
- ✅ Sample questions
- ✅ Working question management system

**Ready to build more features!** 🚀

---

**Last Updated:** February 15, 2026  
**Epic:** 1 - Question Warehouse Management  
**Status:** Production Ready
