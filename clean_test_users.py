#!/usr/bin/env python3
"""
Management script to clean up test/validation users without deleting any blogs.
Preserves all core seed users (id <= 5) and reassigns any test blogs to a core author.
"""
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "latent.db"

def clean_test_users():
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Identify test users (ID > 5)
        test_users = cursor.execute(
            "SELECT id, username, full_name, email FROM users WHERE id > 5"
        ).fetchall()

        if not test_users:
            print("No test users found (only core seed accounts exist).")
            return

        print(f"Found {len(test_users)} test user(s) to remove:")
        for uid, uname, fname, email in test_users:
            print(f"  - [ID {uid}] {fname} (@{uname}, {email})")

        # 2. Check if any blogs were created by these test users
        test_posts = cursor.execute(
            "SELECT id, title, author_id FROM posts WHERE author_id > 5"
        ).fetchall()

        if test_posts:
            print(f"\nPreserving {len(test_posts)} blog(s) by reassigning to default author (Dr. Elena Vance, ID 2):")
            for pid, title, aid in test_posts:
                print(f"  - Blog #{pid}: '{title}' (previously author ID {aid} -> reassigned to ID 2)")
            
            cursor.execute("UPDATE posts SET author_id = 2 WHERE author_id > 5")

        # 3. Clean up test comments and likes
        cursor.execute("DELETE FROM comments WHERE author_id > 5")
        deleted_comments = cursor.rowcount

        cursor.execute("DELETE FROM likes WHERE user_id > 5")
        deleted_likes = cursor.rowcount

        # 4. Delete the test users
        cursor.execute("DELETE FROM users WHERE id > 5")
        deleted_users = cursor.rowcount

        conn.commit()

        print("\nCleanup completed successfully:")
        print(f"  - Removed {deleted_users} test user account(s)")
        print(f"  - Removed {deleted_comments} test comment(s)")
        print(f"  - Removed {deleted_likes} test like(s)")
        print(f"  - All blogs preserved! Total blogs now: {cursor.execute('SELECT COUNT(*) FROM posts').fetchone()[0]}")
        print("\nYou can now test registration, OTP, and blog publishing from scratch!")

    except Exception as e:
        conn.rollback()
        print(f"Error during cleanup: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    clean_test_users()
