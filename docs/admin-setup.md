# Admin Setup Guide

This guide explains how to set up and use the admin portal for the Smart Interview Guideline system.

## Overview

The admin portal provides user management capabilities including:

- View all registered users with pagination and filtering
- Search users by email
- View detailed user information (profile, CV, account status)
- Ban/unban users
- Separate admin authentication

## Initial Setup

### 1. Create an Admin User

To create your first admin user, use the provided script:

```bash
# Using Docker (recommended)
docker compose exec backend python scripts/create_admin.py

# Or locally with uv
uv run python scripts/create_admin.py
```

You will be prompted to enter:
- Admin email address
- Password (minimum 8 characters)
- Password confirmation

### 2. Access the Admin Portal

Once the admin user is created, you can access the admin portal at:

```
http://localhost:5173/admin/login
```

Or in production:

```
https://your-domain.com/admin/login
```

## Admin Features

### User Management

The admin portal provides comprehensive user management:

#### User List (`/admin/users`)

- **View all users**: Paginated list of all registered users
- **Search**: Filter users by email address
- **Quick actions**: 
  - View user details
  - Ban/unban users directly from the list
- **User information displayed**:
  - Email address
  - User ID
  - Role (Backend, Frontend, etc.)
  - Experience level
  - Registration date
  - Admin status
  - Active/banned status

#### User Details (`/admin/users/:id`)

Detailed view of a specific user including:

- **Contact Information**: Email address
- **Account Status**: Active or banned
- **Profile Information**:
  - Role (Backend, Frontend, Tester, etc.)
  - Years of experience
  - CV upload status and filename
- **Account Metadata**:
  - Created date
  - Last updated date
- **Actions**:
  - Ban/unban user

### Ban/Unban Users

Admins can temporarily disable user accounts:

- **Ban**: Prevents user from logging in or accessing the system
- **Unban**: Restores user access
- **Protection**: Admins cannot ban themselves
- **Other admins**: Cannot be banned by other admins

## API Endpoints

The admin API is available at `/api/admin/*`:

### Authentication

```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your-password"
}
```

### User Management

```http
# List users with pagination and filtering
GET /api/admin/users?page=1&page_size=20&email=search@example.com
Authorization: Bearer <admin-token>

# Get user details
GET /api/admin/users/{userId}
Authorization: Bearer <admin-token>

# Ban user
PATCH /api/admin/users/{userId}/ban
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Optional ban reason"
}

# Unban user
PATCH /api/admin/users/{userId}/unban
Authorization: Bearer <admin-token>
```

## Security Notes

1. **Separate Authentication**: Admin login is completely separate from regular user login
2. **Admin Flag**: The `is_admin` field in the database controls admin access
3. **Token-based**: Admin sessions use JWT tokens (same as regular users but with admin flag)
4. **Protected Routes**: All admin routes require authentication and admin privileges
5. **Self-Protection**: Admins cannot ban themselves to prevent lockout

## Database Schema

The admin feature adds the `is_admin` field to the User model:

```python
class User(SQLModel, table=True):
    id: int | None
    email: str
    hashed_password: str
    is_active: bool
    is_admin: bool  # New field
    # ... other fields
```

## Troubleshooting

### Cannot access admin portal

- Verify the user has `is_admin=true` in the database
- Check that you're using `/admin/login` not `/login`
- Ensure the token is stored correctly after admin login

### "Admin privileges required" error

- The logged-in user doesn't have admin rights
- Log out and log in with an admin account
- Verify database has `is_admin=true` for the user

### Cannot create admin user

- Ensure database is running and accessible
- Check database connection settings in `.env`
- Verify the script has correct permissions

## Adding More Admins

To promote an existing user to admin:

1. Connect to the database
2. Update the user record:
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'user@example.com';
   ```

Or use the create_admin script which will update existing users to admin status.

## Future Enhancements (US4.2, US4.3)

Planned features for future releases:

- **Content Moderation** (US4.2): Review and approve crowdsourced questions
- **System Analytics** (US4.3): Dashboard with metrics and usage statistics
- **User Activity Logs**: Track user actions and changes
- **Bulk Operations**: Ban/unban multiple users at once
- **Advanced Filters**: Filter by role, experience level, registration date
