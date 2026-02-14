#!/usr/bin/env python3
"""Migration script to add is_admin column to users table."""

import asyncio
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import text

from app.utils.db import database


async def migrate():
    """Add is_admin column to users table."""
    print("=== Adding is_admin column to users table ===\n")
    
    # Initialize database
    database.init_db()
    
    # Create async session
    async for session in database.get_session():
        try:
            # Check if column already exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='is_admin'
            """)
            result = await session.execute(check_query)
            exists = result.scalar_one_or_none()
            
            if exists:
                print("✓ Column 'is_admin' already exists")
                return
            
            # Add is_admin column with default False
            alter_query = text("""
                ALTER TABLE users 
                ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE
            """)
            await session.execute(alter_query)
            await session.commit()
            
            print("✓ Successfully added 'is_admin' column to users table")
            print("  - Default value: FALSE")
            print("  - All existing users are set as regular users (not admin)")
            
        except Exception as e:
            print(f"✗ Error during migration: {e}")
            await session.rollback()
            raise


async def main():
    """Main entry point."""
    try:
        await migrate()
        print("\n✓ Migration completed successfully!")
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
