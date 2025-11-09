"""
Scheduler to periodically fetch social media data
Can be run as a background service or cron job
"""
import time
import schedule
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from social_fetch import twitter_fetch, instagram_fetch, facebook_fetch, process_social_data

def fetch_all_social_data():
    """Fetch data from all social media platforms"""
    print(f"\n{'='*50}")
    print(f"Starting social media data fetch - {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}\n")
    
    try:
        # Fetch from each platform
        print("Fetching Twitter data...")
        twitter_fetch.run_once(max_pages=3)
        
        print("\nFetching Instagram data...")
        instagram_fetch.run_once()
        
        print("\nFetching Facebook data...")
        facebook_fetch.run_once()
        
        print("\nProcessing and converting data...")
        process_social_data.run_processing()
        
        print(f"\n{'='*50}")
        print("Data fetch complete!")
        print(f"{'='*50}\n")
        
    except Exception as e:
        print(f"Error in fetch_all_social_data: {e}")
        import traceback
        traceback.print_exc()

def run_scheduler():
    """Run the scheduler"""
    # Schedule jobs
    # Fetch every hour
    schedule.every().hour.do(fetch_all_social_data)
    
    # Also fetch immediately on start
    fetch_all_social_data()
    
    print("Scheduler started. Fetching data every hour.")
    print("Press Ctrl+C to stop.")
    
    # Run scheduler
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    try:
        run_scheduler()
    except KeyboardInterrupt:
        print("\nScheduler stopped.")

