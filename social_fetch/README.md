# Social Media Data Integration

This module fetches real customer feedback from Twitter, Instagram, and Facebook APIs and converts it to the T-Mobile feedback format.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Credentials

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your API credentials in `.env`:

#### Twitter (X) API
- Sign up at https://developer.twitter.com/
- Create an app and get a Bearer Token
- Add to `.env`: `TWITTER_BEARER_TOKEN=your_token`

#### Facebook/Instagram API
- Create a Facebook Developer account at https://developers.facebook.com/
- Create an app and get Page Access Token
- Connect your Instagram Business/Creator account
- Add to `.env`:
  - `FB_PAGE_ACCESS_TOKEN=your_token`
  - `FB_PAGE_ID=your_page_id`
  - `IG_USER_ID=your_instagram_user_id`

### 3. Required Permissions

**Facebook/Instagram:**
- `instagram_basic`
- `pages_read_engagement`
- `pages_read_user_content`
- `instagram_manage_comments` (optional, for comments)

**Twitter:**
- Elevated access (for higher rate limits)

## Usage

### Fetch Data Once

```bash
# Fetch from all platforms
python -m social_fetch.twitter_fetch
python -m social_fetch.instagram_fetch
python -m social_fetch.facebook_fetch

# Process and convert to feedback format
python -m social_fetch.process_social_data
```

### Run Scheduler (Continuous Fetching)

```bash
python -m social_fetch.scheduler
```

This will:
- Fetch data from all platforms every hour
- Process and convert to feedback format
- Update `api/entries-all.json`

### Run as Background Service

**Linux/Mac:**
```bash
nohup python -m social_fetch.scheduler > social_fetch.log 2>&1 &
```

**Windows:**
Use Task Scheduler or run in a separate terminal.

## Data Flow

1. **Fetch** → Social media APIs → `social.db` (SQLite)
2. **Process** → Sentiment analysis → Rating calculation → Location extraction
3. **Convert** → Feedback format → `api/entries-all.json`
4. **Serve** → API server reads from `api/entries-all.json`

## Data Processing

- **Sentiment Analysis**: Uses VADER sentiment analyzer to determine positive/negative sentiment
- **Rating Calculation**: Converts sentiment (-1 to 1) to rating (1 to 5 stars)
- **Category Detection**: Automatically categorizes feedback (Coverage, Price, Customer Service, etc.)
- **Location Extraction**: Attempts to extract location from text, falls back to random state

## Database Schema

Data is stored in `social.db` with tables:
- `twitter` - Twitter tweets
- `instagram` - Instagram comments and media
- `facebook_posts` - Facebook posts
- `facebook_comments` - Facebook comments

## Rate Limits

- **Twitter**: 300 requests per 15 minutes (with Elevated access)
- **Instagram**: Varies by endpoint
- **Facebook**: 200 requests per hour per user

The scripts include basic rate limit handling with retries and delays.

## Troubleshooting

### "Token not set" warnings
- Check that `.env` file exists and contains all required tokens
- Verify tokens are valid and not expired

### Rate limit errors
- Reduce `max_pages` parameter in fetch functions
- Increase delays between requests
- Check your API quota limits

### No data returned
- Verify API credentials are correct
- Check that your app has required permissions
- Ensure you're querying public content (private content requires special permissions)

## Privacy & Compliance

⚠️ **Important:**
- Only fetches **public** content
- Respects platform Terms of Service
- Does not store private user data (emails, DMs)
- Follows GDPR/CCPA guidelines
- Review platform API terms before production use

