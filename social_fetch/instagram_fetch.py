"""
Instagram Graph API - Fetch comments and mentions
Requires: Facebook Developer app, Instagram Business/Creator account,
          Page access token with instagram_basic, pages_read_engagement permissions
"""
import requests
import os
import time
import sqlite3
import json
from dotenv import load_dotenv

load_dotenv()

FB_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN")
IG_USER_ID = os.getenv("IG_USER_ID")  # numeric ID
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "social.db")
BASE = "https://graph.facebook.com/v18.0"  # Update API version as needed

def init_db():
    """Initialize SQLite database for Instagram data"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS instagram (
        id TEXT PRIMARY KEY,
        text TEXT,
        username TEXT,
        created_at TEXT,
        media_id TEXT,
        media_url TEXT,
        raw JSON,
        processed INTEGER DEFAULT 0,
        created_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.commit()
    conn.close()

def get_user_media(limit=25):
    """Get recent media posts from Instagram user"""
    url = f"{BASE}/{IG_USER_ID}/media"
    params = {
        "fields": "id,caption,timestamp,media_type,permalink,media_url",
        "limit": limit,
        "access_token": FB_TOKEN
    }
    
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching Instagram media: {e}")
        return None

def get_media_comments(media_id):
    """Get comments for a specific media post"""
    url = f"{BASE}/{media_id}/comments"
    params = {
        "fields": "id,username,text,timestamp,like_count",
        "access_token": FB_TOKEN
    }
    
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching comments for media {media_id}: {e}")
        return None

def search_hashtag(hashtag="tmobile"):
    """Search for hashtag ID (requires instagram_graph permission)"""
    url = f"{BASE}/ig_hashtag_search"
    params = {
        "user_id": IG_USER_ID,
        "q": hashtag,
        "access_token": FB_TOKEN
    }
    
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error searching hashtag: {e}")
        return None

def get_hashtag_media(hashtag_id, limit=25):
    """Get recent media for a hashtag"""
    url = f"{BASE}/{hashtag_id}/recent_media"
    params = {
        "user_id": IG_USER_ID,
        "fields": "id,caption,timestamp,media_type,permalink,media_url",
        "limit": limit,
        "access_token": FB_TOKEN
    }
    
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching hashtag media: {e}")
        return None

def save_comment(cdata, media_id, media_url=None):
    """Save Instagram comment to database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("""INSERT OR IGNORE INTO instagram 
            (id, text, username, created_at, media_id, media_url, raw) 
            VALUES (?,?,?,?,?,?,?)""",
            (cdata["id"], cdata.get("text", ""), cdata.get("username", "unknown"),
             cdata.get("timestamp"), media_id, media_url, json.dumps(cdata)))
        conn.commit()
        return True
    except Exception as e:
        print(f"DB save error: {e}")
        return False
    finally:
        conn.close()

def save_media_caption(media_data):
    """Save media caption as feedback"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # Use media ID as comment ID, caption as text
        c.execute("""INSERT OR IGNORE INTO instagram 
            (id, text, username, created_at, media_id, media_url, raw) 
            VALUES (?,?,?,?,?,?,?)""",
            (f"media_{media_data['id']}", media_data.get("caption", ""), 
             "media_owner", media_data.get("timestamp"), media_data["id"],
             media_data.get("media_url"), json.dumps(media_data)))
        conn.commit()
        return True
    except Exception as e:
        print(f"DB save error: {e}")
        return False
    finally:
        conn.close()

def get_unprocessed_instagram(limit=1000):
    """Get Instagram data that hasn't been processed yet"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM instagram WHERE processed = 0 LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return rows

def mark_processed(item_id):
    """Mark an Instagram item as processed"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE instagram SET processed = 1 WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

def run_once():
    """Fetch Instagram data once"""
    if not FB_TOKEN or not IG_USER_ID:
        print("Warning: FB_PAGE_ACCESS_TOKEN or IG_USER_ID not set in .env")
        return
    
    init_db()
    
    # Fetch user media and comments
    print("Fetching user media...")
    media = get_user_media(limit=25)
    
    if media and "data" in media:
        for m in media.get("data", []):
            mid = m["id"]
            media_url = m.get("media_url")
            
            # Save media caption if it exists
            if m.get("caption"):
                save_media_caption(m)
            
            # Fetch comments
            print(f"Fetching comments for media {mid}...")
            comments = get_media_comments(mid)
            
            if comments and "data" in comments:
                for cm in comments.get("data", []):
                    save_comment(cm, mid, media_url)
                    time.sleep(0.5)  # Rate limit protection
            
            time.sleep(1)  # Rate limit protection
    
    print("Instagram fetch complete")

if __name__ == "__main__":
    run_once()

