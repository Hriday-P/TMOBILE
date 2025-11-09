"""
Facebook Graph API - Fetch Page posts, mentions, and comments
Requires: Page access token with pages_read_engagement, pages_read_user_content
"""
import requests
import sqlite3
import os
import json
from dotenv import load_dotenv

load_dotenv()

FB_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN")
PAGE_ID = os.getenv("FB_PAGE_ID", "T-Mobile")  # Default or set in .env
BASE = "https://graph.facebook.com/v18.0"
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "social.db")

def init_db():
    """Initialize SQLite database for Facebook data"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS facebook_posts (
        id TEXT PRIMARY KEY,
        message TEXT,
        created_time TEXT,
        from_name TEXT,
        from_id TEXT,
        comments_count INTEGER,
        likes_count INTEGER,
        raw JSON,
        processed INTEGER DEFAULT 0,
        created_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    
    c.execute("""CREATE TABLE IF NOT EXISTS facebook_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT,
        message TEXT,
        from_name TEXT,
        from_id TEXT,
        created_time TEXT,
        like_count INTEGER,
        raw JSON,
        processed INTEGER DEFAULT 0,
        created_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    
    conn.commit()
    conn.close()

def get_page_feed(limit=25):
    """Get page feed posts"""
    url = f"{BASE}/{PAGE_ID}/feed"
    params = {
        "fields": "id,message,created_time,from,comments.summary(true),likes.summary(true)",
        "limit": limit,
        "access_token": FB_TOKEN
    }
    
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching Facebook feed: {e}")
        return None

def get_post_comments(post_id, limit=100):
    """Get comments for a specific post"""
    url = f"{BASE}/{post_id}/comments"
    params = {
        "fields": "id,message,created_time,from,like_count",
        "limit": limit,
        "access_token": FB_TOKEN
    }
    
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching comments for post {post_id}: {e}")
        return None

def get_tagged_posts(limit=25):
    """Get posts that tag the page"""
    url = f"{BASE}/{PAGE_ID}/tagged"
    params = {
        "fields": "id,message,created_time,from,comments.summary(true),likes.summary(true)",
        "limit": limit,
        "access_token": FB_TOKEN
    }
    
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching tagged posts: {e}")
        return None

def save_post(p):
    """Save Facebook post to database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        from_info = p.get("from", {})
        comments_summary = p.get("comments", {}).get("summary", {})
        likes_summary = p.get("likes", {}).get("summary", {})
        
        c.execute("""INSERT OR IGNORE INTO facebook_posts 
            (id, message, created_time, from_name, from_id, comments_count, likes_count, raw) 
            VALUES (?,?,?,?,?,?,?,?)""",
            (p["id"], p.get("message", ""), p.get("created_time"),
             from_info.get("name", ""), from_info.get("id", ""),
             comments_summary.get("total_count", 0), likes_summary.get("total_count", 0),
             json.dumps(p)))
        conn.commit()
        return True
    except Exception as e:
        print(f"DB save error: {e}")
        return False
    finally:
        conn.close()

def save_comment(cdata, post_id):
    """Save Facebook comment to database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        from_info = cdata.get("from", {})
        c.execute("""INSERT OR IGNORE INTO facebook_comments 
            (id, post_id, message, from_name, from_id, created_time, like_count, raw) 
            VALUES (?,?,?,?,?,?,?,?)""",
            (cdata["id"], post_id, cdata.get("message", ""),
             from_info.get("name", ""), from_info.get("id", ""),
             cdata.get("created_time"), cdata.get("like_count", 0),
             json.dumps(cdata)))
        conn.commit()
        return True
    except Exception as e:
        print(f"DB save error: {e}")
        return False
    finally:
        conn.close()

def get_unprocessed_posts(limit=1000):
    """Get Facebook posts that haven't been processed yet"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM facebook_posts WHERE processed = 0 LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return rows

def get_unprocessed_comments(limit=1000):
    """Get Facebook comments that haven't been processed yet"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM facebook_comments WHERE processed = 0 LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return rows

def mark_processed(item_id, table="facebook_posts"):
    """Mark a Facebook item as processed"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(f"UPDATE {table} SET processed = 1 WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

def run_once():
    """Fetch Facebook data once"""
    if not FB_TOKEN:
        print("Warning: FB_PAGE_ACCESS_TOKEN not set in .env")
        return
    
    init_db()
    
    # Fetch page feed
    print("Fetching page feed...")
    feed = get_page_feed(limit=25)
    
    if feed and "data" in feed:
        for p in feed.get("data", []):
            save_post(p)
            
            # Fetch comments for each post
            post_id = p["id"]
            print(f"Fetching comments for post {post_id}...")
            comments = get_post_comments(post_id)
            
            if comments and "data" in comments:
                for cm in comments.get("data", []):
                    save_comment(cm, post_id)
    
    # Fetch tagged posts (mentions)
    print("Fetching tagged posts...")
    tagged = get_tagged_posts(limit=25)
    
    if tagged and "data" in tagged:
        for p in tagged.get("data", []):
            save_post(p)
    
    print("Facebook fetch complete")

if __name__ == "__main__":
    run_once()

