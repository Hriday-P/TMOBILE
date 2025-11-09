"""
Twitter (X) API v2 - Fetch public tweets mentioning T-Mobile
Requires: Twitter Developer account + Bearer token with Elevated access
"""
import requests
import time
import os
import sqlite3
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

BEARER = os.getenv("TWITTER_BEARER_TOKEN")
HEADERS = {"Authorization": f"Bearer {BEARER}"}
SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"

# Query: mentions or brand keywords; exclude retweets to reduce noise
QUERY = '("T-Mobile" OR TMobile OR @TMobile OR "T Mobile") -is:retweet lang:en'
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "social.db")

def init_db():
    """Initialize SQLite database for Twitter data"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS twitter (
        id TEXT PRIMARY KEY,
        text TEXT,
        author_id TEXT,
        author_username TEXT,
        created_at TEXT,
        public_metrics TEXT,
        raw JSON,
        processed INTEGER DEFAULT 0,
        created_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.commit()
    conn.close()

def fetch_tweets(next_token=None, max_results=100):
    """Fetch tweets from Twitter API v2"""
    params = {
        "query": QUERY,
        "tweet.fields": "created_at,author_id,lang,public_metrics,context_annotations",
        "expansions": "author_id",
        "user.fields": "username,name",
        "max_results": min(max_results, 100)  # API limit is 100
    }
    
    if next_token:
        params["next_token"] = next_token
    
    try:
        r = requests.get(SEARCH_URL, headers=HEADERS, params=params, timeout=30)
        
        if r.status_code == 429:
            # Rate limit - wait and retry
            print("Rate limited, sleeping 60s")
            time.sleep(60)
            return fetch_tweets(next_token)
        
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching tweets: {e}")
        return None

def save_tweets(data):
    """Save tweets to database"""
    if not data or "data" not in data:
        return 0
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Create username mapping from includes
    username_map = {}
    if "includes" in data and "users" in data["includes"]:
        for user in data["includes"]["users"]:
            username_map[user["id"]] = user.get("username", "unknown")
    
    saved_count = 0
    for t in data.get("data", []):
        try:
            author_id = t.get("author_id", "")
            username = username_map.get(author_id, "unknown")
            metrics = json.dumps(t.get("public_metrics", {}))
            
            c.execute("""INSERT OR IGNORE INTO twitter 
                (id, text, author_id, author_username, created_at, public_metrics, raw) 
                VALUES (?,?,?,?,?,?,?)""",
                (t["id"], t["text"], author_id, username, 
                 t.get("created_at"), metrics, json.dumps(t)))
            saved_count += 1
        except Exception as e:
            print(f"DB error saving tweet {t.get('id', 'unknown')}: {e}")
    
    conn.commit()
    conn.close()
    return saved_count

def get_unprocessed_tweets(limit=1000):
    """Get tweets that haven't been processed yet"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM twitter WHERE processed = 0 LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return rows

def mark_processed(tweet_id):
    """Mark a tweet as processed"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE twitter SET processed = 1 WHERE id = ?", (tweet_id,))
    conn.commit()
    conn.close()

def run_once(max_pages=5):
    """Fetch tweets once (with pagination)"""
    if not BEARER:
        print("Warning: TWITTER_BEARER_TOKEN not set in .env")
        return
    
    init_db()
    next_token = None
    total_saved = 0
    
    for page in range(max_pages):
        print(f"Fetching page {page + 1}...")
        data = fetch_tweets(next_token)
        
        if not data:
            break
        
        saved = save_tweets(data)
        total_saved += saved
        print(f"Saved {saved} new tweets")
        
        # Get next page token
        if "meta" in data and "next_token" in data["meta"]:
            next_token = data["meta"]["next_token"]
            time.sleep(2)  # Rate limit protection
        else:
            break
    
    print(f"Total saved: {total_saved} tweets")
    return total_saved

if __name__ == "__main__":
    run_once()

