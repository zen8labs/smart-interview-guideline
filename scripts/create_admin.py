#!/usr/bin/env python3
"""Script to create an admin user for the Smart Interview Guideline system."""

import asyncio
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.modules.account.models import User
from app.utils.auth import get_password_hash
from app.utils.db import database


async def create_admin_user(email: str, password: str) -> None:
    """
    Create an admin user in the database.

    Args:
        email: Admin email address
        password: Admin password
    """
    # Initialize database
    database.init_db()
    await database.create_db_and_tables()

    # Create async session
    async for session in database.get_session():
        # Check if user already exists
        statement = select(User).where(User.email == email)
        result = await session.execute(statement)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            if existing_user.is_admin:
                print(f"✓ User {email} already exists and is an admin.")
                return
            else:
                # Update existing user to admin
                existing_user.is_admin = True
                session.add(existing_user)
                await session.commit()
                print(f"✓ Updated user {email} to admin.")
                return

        # Create new admin user
        hashed_password = get_password_hash(password)
        admin_user = User(
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=True,
        )

        session.add(admin_user)
        await session.commit()
        await session.refresh(admin_user)

        print(f"✓ Created admin user: {email} (ID: {admin_user.id})")


async def main():
    """Main entry point for the script."""
    print("=== Create Admin User ===\n")

    # Get admin credentials
    email = input("Enter admin email: ").strip()
    if not email:
        print("Error: Email is required")
        sys.exit(1)

    password = input("Enter admin password (min 8 chars): ").strip()
    if len(password) < 8:
        print("Error: Password must be at least 8 characters")
        sys.exit(1)

    # Confirm password
    confirm_password = input("Confirm password: ").strip()
    if password != confirm_password:
        print("Error: Passwords do not match")
        sys.exit(1)

    try:
        await create_admin_user(email, password)
        print("\n✓ Admin user created successfully!")
        print(f"\nYou can now log in at: /admin/login")
    except Exception as e:
        print(f"\n✗ Error creating admin user: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
