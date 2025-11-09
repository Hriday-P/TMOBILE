# Social Media Data Integration Guide

This guide explains how to integrate real social media data from Twitter, Instagram, and Facebook to replace the generated/mock data in the T-Mobile customer satisfaction app.

## Overview

The integration fetches public customer feedback from social media platforms, processes it with sentiment analysis, and converts it to the app's feedback format. This replaces the generated data with real customer opinions.

## Architecture

```
┌─────────────────┐
│ Social Media    │
│ APIs            │
│ (Twitter/IG/FB) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fetch Scripts   │
│ (Python)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ social.db       │
│ (SQLite)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process Script  │
│ (Sentiment +    │
│  Conversion)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ api/entries-   │
│ all.json        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API Server      │
│ (Node.js)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend        │
│ (HTML/JS)       │
└─────────────────┘
```

## Setup Steps

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `requests` - HTTP library for API calls
- `python-dotenv` - Environment variable management
- `vaderSentiment` - Sentiment analysis
- `schedule` - Task scheduling

### 2. Get API Credentials

#### Twitter (X) API
1. Go to https://developer.twitter.com/
2. Create a developer account
3. Create a new app
4. Get your Bearer Token
5. Note: Elevated access recommended for higher rate limits

#### Facebook/Instagram API
1. Go to https://developers.facebook.com/
2. Create a Facebook Developer account
3. Create a new app
4. Add Instagram Graph API product
5. Connect your Instagram Business/Creator account to a Facebook Page
6. Get Page Access Token with required permissions:
   - `instagram_basic`
   - `pages_read_engagement`
   - `pages_read_user_content`
7. Get your Instagram Business User ID

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Twitter
TWITTER_BEARER_TOKEN=your_bearer_token_here

# Facebook/Instagram
FB_PAGE_ACCESS_TOKEN=your_page_access_token
FB_PAGE_ID=your_facebook_page_id
IG_USER_ID=your_instagram_business_user_id
```

**Important**: Never commit `.env` to git (already in `.gitignore`)

### 4. Run Data Fetching

#### One-time Fetch
```bash
./run_social_fetch.sh
```

This will:
1. Fetch data from all platforms
2. Process with sentiment analysis
3. Convert to feedback format
4. Save to `api/entries-all.json`

#### Continuous Fetching (Scheduler)
```bash
python -m social_fetch.scheduler
```

This runs in the background and fetches data every hour.

## Data Processing

### Sentiment Analysis
- Uses VADER sentiment analyzer
- Converts sentiment score (-1 to 1) to rating (1 to 5 stars)
- Formula: `rating = 3.0 + (sentiment * 2.0)`

### Category Detection
Automatically categorizes feedback based on keywords:
- **Coverage**: signal, reception, dead zone, network
- **Price**: cost, bill, billing, plan, payment
- **Customer Service**: service, support, representative, help
- **Network Speed**: speed, data, internet, streaming
- **Reliability**: reliable, outage, down, issue

### Location Extraction
Attempts to extract location from:
- State mentions in text
- City, State patterns (e.g., "Los Angeles, CA")
- Falls back to random state if not found

## Data Format

The processed data is saved in the same format as the existing feedback entries:

```json
{
  "id": "twitter-123456",
  "customerName": "username.",
  "location": "City, ST",
  "state": "State Name",
  "county": "County Name",
  "city": "City",
  "rating": 4.2,
  "score": 84,
  "review": "Customer feedback text...",
  "date": "2025-01-15",
  "category": "Coverage",
  "verified": false,
  "source": "Twitter"
}
```

## API Integration

The API server automatically uses the processed data:

1. **Priority Order**:
   - `api/entries-all.json` (real social media data)
   - `state-entries-data.json` (generated data fallback)
   - `state-data.json` (basic data fallback)

2. **Endpoints Affected**:
   - `/api/entries/all` - Returns all feedback entries
   - `/api/satisfaction/overall` - Calculated from all entries
   - `/api/state/:stateName/entries` - Filtered by state

## Monitoring

### Check Data Status
```bash
# Check database
sqlite3 social.db "SELECT COUNT(*) FROM twitter WHERE processed = 0;"
sqlite3 social.db "SELECT COUNT(*) FROM instagram WHERE processed = 0;"
sqlite3 social.db "SELECT COUNT(*) FROM facebook_posts WHERE processed = 0;"
```

### View Processed Data
```bash
# Check output file
cat api/entries-all.json | jq '.total'
```

## Troubleshooting

### No Data Fetched
- Verify API credentials in `.env`
- Check API rate limits
- Ensure required permissions are granted
- Check network connectivity

### Low Quality Ratings
- Adjust sentiment analysis thresholds
- Improve location extraction logic
- Add more category keywords

### Rate Limit Errors
- Reduce fetch frequency
- Increase delays between requests
- Use multiple API tokens (if allowed)

## Privacy & Compliance

⚠️ **Important Considerations**:

1. **Public Data Only**: Only fetches public content
2. **Terms of Service**: Must comply with platform ToS
3. **GDPR/CCPA**: Handle user data according to regulations
4. **Data Retention**: Consider data retention policies
5. **User Privacy**: Don't expose private user information

## Best Practices

1. **Regular Updates**: Run scheduler for fresh data
2. **Data Validation**: Review processed data quality
3. **Error Handling**: Monitor for API errors
4. **Backup**: Keep backups of `social.db` and processed data
5. **Monitoring**: Track API usage and costs

## Next Steps

1. Set up API credentials
2. Run initial data fetch
3. Review processed data quality
4. Set up scheduler for continuous updates
5. Monitor and adjust as needed

For detailed API setup instructions, see `social_fetch/README.md`.

