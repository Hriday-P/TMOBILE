"""
Process social media data and convert to feedback/review format
Includes sentiment analysis and rating calculation
"""
import sqlite3
import json
import os
import re
from datetime import datetime
from typing import List, Dict, Optional

# Try to import VADER sentiment analyzer
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    SENTIMENT_AVAILABLE = True
except ImportError:
    print("Warning: vaderSentiment not installed. Using basic sentiment scoring.")
    SENTIMENT_AVAILABLE = False

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "social.db")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "api", "entries-all.json")
STATE_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "state-data.json")

# Initialize sentiment analyzer
if SENTIMENT_AVAILABLE:
    analyzer = SentimentIntensityAnalyzer()

# US States for location assignment
US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
    "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
    "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
    "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]

# Categories based on keywords
CATEGORY_KEYWORDS = {
    "Coverage": ["coverage", "signal", "reception", "dead zone", "no service", "bars", "network"],
    "Price": ["price", "cost", "bill", "billing", "expensive", "cheap", "affordable", "plan", "payment"],
    "Customer Service": ["service", "support", "representative", "agent", "help", "customer service", "cs"],
    "Network Speed": ["speed", "slow", "fast", "data", "internet", "streaming", "download", "upload"],
    "Reliability": ["reliable", "unreliable", "outage", "down", "working", "broken", "issue", "problem"]
}

def analyze_sentiment(text: str) -> Dict[str, float]:
    """Analyze sentiment of text and return scores"""
    if not text:
        return {"compound": 0.0, "pos": 0.0, "neu": 0.0, "neg": 0.0}
    
    if SENTIMENT_AVAILABLE:
        return analyzer.polarity_scores(text)
    else:
        # Basic sentiment scoring
        text_lower = text.lower()
        positive_words = ["good", "great", "excellent", "amazing", "love", "best", "perfect", "awesome"]
        negative_words = ["bad", "terrible", "awful", "hate", "worst", "horrible", "disappointed"]
        
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count > neg_count:
            compound = 0.5
        elif neg_count > pos_count:
            compound = -0.5
        else:
            compound = 0.0
        
        return {"compound": compound, "pos": pos_count / 10, "neu": 0.5, "neg": neg_count / 10}

def sentiment_to_rating(compound: float) -> float:
    """Convert sentiment compound score (-1 to 1) to rating (1 to 5)"""
    # Map -1 to 1 -> 1 to 5
    rating = 3.0 + (compound * 2.0)
    return max(1.0, min(5.0, round(rating, 1)))

def categorize_text(text: str) -> str:
    """Categorize text based on keywords"""
    if not text:
        return "Other"
    
    text_lower = text.lower()
    category_scores = {}
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            category_scores[category] = score
    
    if category_scores:
        return max(category_scores, key=category_scores.get)
    return "Other"

def extract_location(text: str, username: str = "") -> Dict[str, str]:
    """Extract or infer location from text/username"""
    # Try to extract state mentions
    for state in US_STATES:
        if state.lower() in text.lower():
            return {"state": state, "city": state, "county": f"{state} County"}
    
    # Common city patterns
    city_patterns = [
        r"\b([A-Z][a-z]+),?\s+(CA|NY|TX|FL|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|IA|UT|AR|NV|MS|KS|NM|NE|WV|ID|HI|NH|ME|RI|MT|DE|SD|ND|AK|VT|WY)\b"
    ]
    
    for pattern in city_patterns:
        match = re.search(pattern, text)
        if match:
            city = match.group(1)
            state_abbr = match.group(2)
            # Convert abbreviation to full state name
            state_map = {
                "CA": "California", "NY": "New York", "TX": "Texas", "FL": "Florida",
                "IL": "Illinois", "PA": "Pennsylvania", "OH": "Ohio", "GA": "Georgia",
                "NC": "North Carolina", "MI": "Michigan", "NJ": "New Jersey",
                "VA": "Virginia", "WA": "Washington", "AZ": "Arizona", "MA": "Massachusetts"
            }
            state = state_map.get(state_abbr, "Unknown")
            return {"state": state, "city": city, "county": f"{city} County"}
    
    # Default to random state (or could use geolocation if available)
    import random
    state = random.choice(US_STATES)
    return {"state": state, "city": state, "county": f"{state} County"}

def process_twitter_data() -> List[Dict]:
    """Process Twitter data and convert to feedback format"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM twitter WHERE processed = 0")
    rows = c.fetchall()
    
    # Get column names
    columns = [description[0] for description in c.description]
    feedbacks = []
    
    for row in rows:
        row_dict = dict(zip(columns, row))
        tweet_id = row_dict["id"]
        text = row_dict.get("text", "")
        
        if not text or len(text) < 10:  # Skip very short tweets
            mark_processed_twitter(tweet_id)
            continue
        
        # Analyze sentiment
        sentiment = analyze_sentiment(text)
        rating = sentiment_to_rating(sentiment["compound"])
        score = round(rating * 20)
        
        # Extract location
        location_info = extract_location(text, row_dict.get("author_username", ""))
        
        # Categorize
        category = categorize_text(text)
        
        # Create feedback entry
        feedback = {
            "id": f"twitter-{tweet_id}",
            "customerName": f"{row_dict.get('author_username', 'User')}.",
            "location": f"{location_info['city']}, {location_info['state'][:2].upper()}",
            "state": location_info["state"],
            "county": location_info["county"],
            "city": location_info["city"],
            "rating": rating,
            "score": score,
            "review": text[:500],  # Truncate if too long
            "date": row_dict.get("created_at", datetime.now().isoformat()).split("T")[0],
            "category": category,
            "verified": False,  # Social media posts are not verified purchases
            "source": "Twitter"
        }
        
        feedbacks.append(feedback)
        mark_processed_twitter(tweet_id)
    
    conn.close()
    return feedbacks

def process_instagram_data() -> List[Dict]:
    """Process Instagram data and convert to feedback format"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM instagram WHERE processed = 0")
    rows = c.fetchall()
    
    columns = [description[0] for description in c.description]
    feedbacks = []
    
    for row in rows:
        row_dict = dict(zip(columns, row))
        item_id = row_dict["id"]
        text = row_dict.get("text", "")
        
        if not text or len(text) < 10:
            mark_processed_instagram(item_id)
            continue
        
        sentiment = analyze_sentiment(text)
        rating = sentiment_to_rating(sentiment["compound"])
        score = round(rating * 20)
        
        location_info = extract_location(text, row_dict.get("username", ""))
        category = categorize_text(text)
        
        feedback = {
            "id": f"instagram-{item_id}",
            "customerName": f"{row_dict.get('username', 'User')}.",
            "location": f"{location_info['city']}, {location_info['state'][:2].upper()}",
            "state": location_info["state"],
            "county": location_info["county"],
            "city": location_info["city"],
            "rating": rating,
            "score": score,
            "review": text[:500],
            "date": row_dict.get("created_at", datetime.now().isoformat()).split("T")[0],
            "category": category,
            "verified": False,
            "source": "Instagram"
        }
        
        feedbacks.append(feedback)
        mark_processed_instagram(item_id)
    
    conn.close()
    return feedbacks

def process_facebook_data() -> List[Dict]:
    """Process Facebook data and convert to feedback format"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Process posts
    c.execute("SELECT * FROM facebook_posts WHERE processed = 0")
    post_rows = c.fetchall()
    post_columns = [description[0] for description in c.description]
    
    # Process comments
    c.execute("SELECT * FROM facebook_comments WHERE processed = 0")
    comment_rows = c.fetchall()
    comment_columns = [description[0] for description in c.description]
    
    feedbacks = []
    
    # Process posts
    for row in post_rows:
        row_dict = dict(zip(post_columns, row))
        post_id = row_dict["id"]
        text = row_dict.get("message", "")
        
        if not text or len(text) < 10:
            mark_processed_facebook(post_id, "facebook_posts")
            continue
        
        sentiment = analyze_sentiment(text)
        rating = sentiment_to_rating(sentiment["compound"])
        score = round(rating * 20)
        
        location_info = extract_location(text, row_dict.get("from_name", ""))
        category = categorize_text(text)
        
        feedback = {
            "id": f"facebook-post-{post_id}",
            "customerName": f"{row_dict.get('from_name', 'User')}.",
            "location": f"{location_info['city']}, {location_info['state'][:2].upper()}",
            "state": location_info["state"],
            "county": location_info["county"],
            "city": location_info["city"],
            "rating": rating,
            "score": score,
            "review": text[:500],
            "date": row_dict.get("created_time", datetime.now().isoformat()).split("T")[0],
            "category": category,
            "verified": False,
            "source": "Facebook"
        }
        
        feedbacks.append(feedback)
        mark_processed_facebook(post_id, "facebook_posts")
    
    # Process comments
    for row in comment_rows:
        row_dict = dict(zip(comment_columns, row))
        comment_id = row_dict["id"]
        text = row_dict.get("message", "")
        
        if not text or len(text) < 10:
            mark_processed_facebook(comment_id, "facebook_comments")
            continue
        
        sentiment = analyze_sentiment(text)
        rating = sentiment_to_rating(sentiment["compound"])
        score = round(rating * 20)
        
        location_info = extract_location(text, row_dict.get("from_name", ""))
        category = categorize_text(text)
        
        feedback = {
            "id": f"facebook-comment-{comment_id}",
            "customerName": f"{row_dict.get('from_name', 'User')}.",
            "location": f"{location_info['city']}, {location_info['state'][:2].upper()}",
            "state": location_info["state"],
            "county": location_info["county"],
            "city": location_info["city"],
            "rating": rating,
            "score": score,
            "review": text[:500],
            "date": row_dict.get("created_time", datetime.now().isoformat()).split("T")[0],
            "category": category,
            "verified": False,
            "source": "Facebook"
        }
        
        feedbacks.append(feedback)
        mark_processed_facebook(comment_id, "facebook_comments")
    
    conn.close()
    return feedbacks

def mark_processed_twitter(tweet_id: str):
    """Mark Twitter tweet as processed"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE twitter SET processed = 1 WHERE id = ?", (tweet_id,))
    conn.commit()
    conn.close()

def mark_processed_instagram(item_id: str):
    """Mark Instagram item as processed"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE instagram SET processed = 1 WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

def mark_processed_facebook(item_id: str, table: str):
    """Mark Facebook item as processed"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(f"UPDATE {table} SET processed = 1 WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

def merge_with_existing_data(new_feedbacks: List[Dict]) -> List[Dict]:
    """Merge new feedbacks with existing data"""
    existing_feedbacks = []
    
    # Load existing data if it exists
    if os.path.exists(OUTPUT_PATH):
        try:
            with open(OUTPUT_PATH, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict) and "entries" in data:
                    existing_feedbacks = data["entries"]
                elif isinstance(data, list):
                    existing_feedbacks = data
        except Exception as e:
            print(f"Error loading existing data: {e}")
    
    # Merge and deduplicate by ID
    all_feedbacks = existing_feedbacks + new_feedbacks
    seen_ids = set()
    unique_feedbacks = []
    
    for fb in all_feedbacks:
        if fb["id"] not in seen_ids:
            seen_ids.add(fb["id"])
            unique_feedbacks.append(fb)
    
    return unique_feedbacks

def save_feedbacks(feedbacks: List[Dict]):
    """Save feedbacks to JSON file in API format"""
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    output_data = {
        "success": True,
        "entries": feedbacks,
        "total": len(feedbacks),
        "lastUpdated": datetime.now().isoformat()
    }
    
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"Saved {len(feedbacks)} feedback entries to {OUTPUT_PATH}")

def run_processing():
    """Main processing function"""
    print("Processing social media data...")
    
    # Process each platform
    all_feedbacks = []
    
    print("Processing Twitter data...")
    twitter_feedbacks = process_twitter_data()
    all_feedbacks.extend(twitter_feedbacks)
    print(f"  Processed {len(twitter_feedbacks)} Twitter entries")
    
    print("Processing Instagram data...")
    instagram_feedbacks = process_instagram_data()
    all_feedbacks.extend(instagram_feedbacks)
    print(f"  Processed {len(instagram_feedbacks)} Instagram entries")
    
    print("Processing Facebook data...")
    facebook_feedbacks = process_facebook_data()
    all_feedbacks.extend(facebook_feedbacks)
    print(f"  Processed {len(facebook_feedbacks)} Facebook entries")
    
    # Merge with existing data
    print("Merging with existing data...")
    merged_feedbacks = merge_with_existing_data(all_feedbacks)
    
    # Save
    save_feedbacks(merged_feedbacks)
    
    print(f"Total feedback entries: {len(merged_feedbacks)}")
    print("Processing complete!")

if __name__ == "__main__":
    run_processing()

