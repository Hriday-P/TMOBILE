# T-Mobile Customer Satisfaction Web App

A real-time customer satisfaction ratings web application for T-Mobile with interactive state-by-state breakdowns.

## Features

- 📊 Real-time customer satisfaction ratings
- 🗺️ Interactive US map with state-by-state data
- ⭐ District-level performance metrics
- 💬 Customer reviews carousel
- 🔄 Auto-refreshing data (updates every 30 seconds)
- 📱 **Real social media data integration** (Twitter, Instagram, Facebook)
- 🤖 Automatic sentiment analysis and rating calculation
- 📈 Issues tracking and feedback analysis pages

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Python 3.7+ (for social media data fetching - optional)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the API server:**
   ```bash
   npm start
   ```
   
   The API server will run on `http://localhost:3000`

3. **Open the web app:**
   - Open `index.html` in your web browser
   - Or use a local web server (recommended):
     ```bash
     # Using Python 3
     python3 -m http.server 8000
     
     # Then open http://localhost:8000 in your browser
     ```

## API Endpoints

The API server provides the following RESTful endpoints:

### Overall Satisfaction
- `GET /api/satisfaction/overall` - Get overall customer satisfaction rating
  - Returns: averageRating, stars, score, totalStates, totalReviews, recommendRate

### State Data
- `GET /api/satisfaction/states` - Get all states data with real-time updates
  - Returns: Object with all 50 states and their satisfaction metrics
- `GET /api/satisfaction/state/:stateName` - Get specific state data
  - Returns: State-specific data including districts and representatives
  - Supports flexible state name matching (case-insensitive, partial matches)

### Reviews
- `GET /api/reviews` - Get recent customer reviews
  - Query params: `?limit=6` (optional, max 20)
  - Returns: Array of customer reviews with ratings and locations

### State Entries (100-200 entries per state)
- `GET /api/state/:stateName/entries` - Get all entries for a specific state
  - Query params: `?limit=100&offset=0&minRating=0&maxRating=5`
  - Returns: Paginated list of customer satisfaction entries
- `GET /api/state/:stateName/statistics` - Get statistics for a state based on entries
  - Returns: Rating distribution, category distribution, verified counts, etc.
- `GET /api/entries/all` - Get all entries across all states
  - Query params: `?limit=50&offset=0&state=California&minRating=0&maxRating=5`
  - Returns: Paginated list of all entries with filtering

### Utilities
- `GET /api/states/list` - Get list of all available state names
- `GET /api/health` - Health check with detailed server status

### Admin
- `POST /api/admin/reload` - Reload state data from JSON file (development)

## Social Media Data Integration

The app can fetch **real customer feedback** from Twitter, Instagram, and Facebook APIs to replace generated data.

### Quick Start (Social Media Integration)

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure API credentials:**
   - Copy `.env.example` to `.env`
   - Add your API tokens (see `social_fetch/README.md` for details)

3. **Fetch and process data:**
   ```bash
   ./run_social_fetch.sh
   ```
   
   Or run the scheduler for continuous updates:
   ```bash
   python -m social_fetch.scheduler
   ```

4. **Data flow:**
   - Social media APIs → `social.db` (SQLite)
   - Sentiment analysis → Rating calculation
   - Convert to feedback format → `api/entries-all.json`
   - API server automatically serves the real data

See `social_fetch/README.md` for detailed setup instructions and API credential requirements.

## Project Structure

```
TMOBILE/
├── index.html              # Main landing page
├── details.html            # Interactive US map page
├── issues.html             # Customer issues tracking page
├── feedback.html           # Feedback analysis page
├── state-data.json         # State data source
├── api-server.js           # Express API server
├── package.json            # Node.js dependencies
├── requirements.txt        # Python dependencies (social media)
├── social_fetch/           # Social media data fetching
│   ├── twitter_fetch.py    # Twitter API integration
│   ├── instagram_fetch.py  # Instagram API integration
│   ├── facebook_fetch.py   # Facebook API integration
│   ├── process_social_data.py  # Data processing & conversion
│   └── scheduler.py        # Periodic data fetching
└── README.md               # This file
```

## How It Works

1. **Data Sources**: 
   - **Real Social Media Data** (if configured): Fetched from Twitter, Instagram, and Facebook APIs
   - **Generated Data**: Fallback mock data for development/demo
   - Data is processed with sentiment analysis and converted to feedback format

2. **API Server**: The Express server (`api-server.js`) serves as a T-Mobile API that:
   - Reads feedback data from `api/entries-all.json` (prioritizes real social media data)
   - Falls back to `state-entries-data.json` if social media data unavailable
   - Adds random variations to simulate real-time updates
   - Provides RESTful endpoints for the frontend

3. **Frontend**: The HTML pages fetch data from the API:
   - `index.html` displays overall ratings and reviews (calculated from all feedback)
   - `details.html` shows an interactive map of all states
   - `issues.html` displays and tracks customer issues across all states
   - `feedback.html` analyzes all feedback entries with filtering

4. **Real-time Updates**: Data automatically refreshes every 30 seconds to show updated ratings.

## Development

To run in development mode with auto-reload:

```bash
npm run dev
```

(Requires `nodemon` to be installed globally or as a dev dependency)

## Testing

Test the API endpoints:

```bash
npm test
```

This will verify all endpoints are working correctly.

## Data Structure

The API uses comprehensive data with **100-200 entries per state** (over 7,700 total entries):

- **Customer Satisfaction Entries**: Each entry includes:
  - Customer name and location
  - Rating (1-5 stars)
  - Satisfaction score (0-100)
  - Review text
  - Date
  - Category (Coverage, Price, Customer Service, Network Speed, Reliability)
  - Verification status

- **State Statistics**: Calculated from entries including:
  - Average ratings and scores
  - Rating distribution
  - Category breakdowns
  - Verified vs unverified entries
  - Recent activity metrics

## Notes

- The API simulates real-time data by adding small random variations to the base data
- All 50 US states are included with district-level data
- Comprehensive entries data (100-200 per state) is loaded from `state-entries-data.json`
- The API automatically falls back to basic `state-data.json` if comprehensive data is unavailable
- The app includes fallback mechanisms if the API is unavailable
- CORS is enabled to allow frontend access from any origin

## Future Enhancements

- ✅ Real social media data integration (Twitter, Instagram, Facebook)
- ✅ Automatic sentiment analysis and rating calculation
- Add WebSocket support for true real-time updates
- Implement user authentication
- Add data visualization charts
- Export data functionality
- Machine learning for better sentiment analysis
- Automated issue detection from social media posts

