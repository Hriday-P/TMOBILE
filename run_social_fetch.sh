#!/bin/bash

# Script to fetch and process social media data

echo "🚀 Starting Social Media Data Fetch..."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Please create .env file with your API credentials"
    echo "   See social_fetch/README.md for details"
    echo ""
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
pip3 install -q -r requirements.txt

# Run the fetch and process
echo ""
echo "📊 Fetching social media data..."
echo ""

python3 -m social_fetch.twitter_fetch
python3 -m social_fetch.instagram_fetch
python3 -m social_fetch.facebook_fetch

echo ""
echo "🔄 Processing and converting data..."
python3 -m social_fetch.process_social_data

echo ""
echo "✅ Complete! Data saved to api/entries-all.json"
echo ""

