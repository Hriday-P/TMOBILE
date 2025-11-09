const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Serve static files (HTML, CSS, JS, JSON)
app.use(express.static(__dirname));

// Helper function to add random variation to simulate real-time updates
function addVariation(value, variance = 0.1) {
    const change = (Math.random() - 0.5) * variance;
    return Math.max(0, Math.min(5, value + change));
}

// Load state data with error handling
let stateData = {};
let comprehensiveData = {};
let dataLoadError = null;

function loadStateData() {
    try {
        // Try to load comprehensive data first (with entries)
        const comprehensivePath = path.join(__dirname, 'state-entries-data.json');
        if (fs.existsSync(comprehensivePath)) {
            const data = fs.readFileSync(comprehensivePath, 'utf8');
            comprehensiveData = JSON.parse(data);
            // Also populate stateData for backward compatibility
            Object.keys(comprehensiveData).forEach(stateName => {
                const { entries, totalEntries, lastUpdated, ...stateInfo } = comprehensiveData[stateName];
                stateData[stateName] = stateInfo;
            });
            dataLoadError = null;
            const totalEntries = Object.values(comprehensiveData).reduce((sum, state) => sum + (state.totalEntries || 0), 0);
            console.log(`✅ Loaded comprehensive data for ${Object.keys(comprehensiveData).length} states`);
            console.log(`📊 Total entries: ${totalEntries.toLocaleString()}`);
            return true;
        }
        
        // Fallback to basic state data
        const dataPath = path.join(__dirname, 'state-data.json');
        if (!fs.existsSync(dataPath)) {
            throw new Error('No state data files found');
        }
        const data = fs.readFileSync(dataPath, 'utf8');
        stateData = JSON.parse(data);
        dataLoadError = null;
        console.log(`✅ Loaded basic data for ${Object.keys(stateData).length} states`);
        return true;
    } catch (error) {
        console.error('❌ Error loading state data:', error.message);
        dataLoadError = error.message;
        return false;
    }
}

// Initial data load
loadStateData();

// Reload data endpoint (for development)
app.post('/api/admin/reload', (req, res) => {
    const success = loadStateData();
    res.json({
        success: success,
        message: success ? 'Data reloaded successfully' : 'Failed to reload data',
        statesLoaded: Object.keys(stateData).length,
        error: dataLoadError
    });
});

// API endpoint: Get overall customer satisfaction rating
app.get('/api/satisfaction/overall', (req, res) => {
    try {
        // Try to serve pre-generated API response first
        const preGeneratedPath = path.join(__dirname, 'api', 'satisfaction-overall.json');
        if (fs.existsSync(preGeneratedPath)) {
            const preGenerated = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf8'));
            return res.json(preGenerated);
        }
        
        if (Object.keys(stateData).length === 0) {
            return res.status(503).json({
                error: 'Service temporarily unavailable',
                message: 'State data not loaded. Please check server logs.',
                timestamp: new Date().toISOString()
            });
        }

        // Calculate overall average from all states
        const states = Object.keys(stateData);
        let totalRating = 0;
        let count = 0;
        let totalReviews = 0;
        
        // Use comprehensive data if available for accurate totals
        if (Object.keys(comprehensiveData).length > 0) {
            let totalRatingSum = 0;
            let totalEntriesCount = 0;
            
            Object.keys(comprehensiveData).forEach(stateName => {
                const state = comprehensiveData[stateName];
                if (state && state.entries && state.entries.length > 0) {
                    const stateRating = state.entries.reduce((sum, e) => sum + e.rating, 0) / state.entries.length;
                    totalRatingSum += stateRating * state.entries.length;
                    totalEntriesCount += state.entries.length;
                } else if (stateData[stateName] && stateData[stateName].averageRating) {
                    // Fallback to state average if no entries
                    totalRatingSum += stateData[stateName].averageRating * 100; // Estimate
                    totalEntriesCount += 100;
                }
            });
            
            if (totalEntriesCount > 0) {
                totalRating = totalRatingSum / totalEntriesCount;
                totalReviews = totalEntriesCount;
                count = Object.keys(comprehensiveData).length;
            }
        }
        
        // Fallback to basic calculation if comprehensive data not available
        if (count === 0) {
            states.forEach(state => {
                if (stateData[state] && stateData[state].averageRating) {
                    totalRating += stateData[state].averageRating;
                    count++;
                    // Estimate reviews per state (for demo purposes)
                    totalReviews += Math.floor(Math.random() * 1000) + 500;
                }
            });
        }
        
        const overallRating = count > 0 ? totalRating / count : 0;
        
        // Add real-time variation
        const realTimeRating = addVariation(overallRating, 0.05);
        const stars = Math.max(1, Math.min(5, Math.round(realTimeRating)));
        const score = Math.max(0, Math.min(100, Math.round(realTimeRating * 20)));
        const recommendRate = Math.max(85, Math.min(98, Math.round(overallRating * 20 + 5)));
        
        res.json({
            success: true,
            averageRating: parseFloat(realTimeRating.toFixed(2)),
            stars: stars,
            score: score,
            totalStates: count,
            totalReviews: totalReviews,
            recommendRate: recommendRate,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /api/satisfaction/overall:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint: Get all states data with real-time updates
app.get('/api/satisfaction/states', (req, res) => {
    try {
        // Try to serve pre-generated API response first
        const preGeneratedPath = path.join(__dirname, 'api', 'satisfaction-states.json');
        if (fs.existsSync(preGeneratedPath)) {
            const preGenerated = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf8'));
            return res.json(preGenerated);
        }
        
        if (Object.keys(stateData).length === 0) {
            return res.status(503).json({
                error: 'Service temporarily unavailable',
                message: 'State data not loaded',
                timestamp: new Date().toISOString()
            });
        }

        const updatedStates = {};
        
        Object.keys(stateData).forEach(stateName => {
            const state = stateData[stateName];
            if (!state || !state.averageRating) return;
            
            const updatedRating = addVariation(state.averageRating, 0.08);
            const updatedStars = Math.max(1, Math.min(5, Math.round(updatedRating)));
            const updatedScore = Math.max(0, Math.min(100, Math.round(updatedRating * 20)));
            
            // Update districts with variation
            const updatedDistricts = (state.districts || []).map(district => ({
                ...district,
                averageRating: parseFloat(addVariation(district.averageRating || 4.0, 0.1).toFixed(2))
            }));
            
            updatedStates[stateName] = {
                averageRating: parseFloat(updatedRating.toFixed(2)),
                stars: updatedStars,
                score: updatedScore,
                districts: updatedDistricts,
                lastUpdated: new Date().toISOString()
            };
        });
        
        res.json({
            success: true,
            states: updatedStates,
            totalStates: Object.keys(updatedStates).length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /api/satisfaction/states:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Helper function to find state by name (case-insensitive, handles variations)
function findStateByName(stateName) {
    if (!stateName || typeof stateName !== 'string') {
        return null;
    }
    
    const normalized = stateName.trim();
    
    if (!normalized) {
        return null;
    }
    
    // Try exact match first
    if (stateData[normalized]) {
        return { name: normalized, data: stateData[normalized] };
    }
    
    // Try case-insensitive match
    const stateKeys = Object.keys(stateData);
    for (const key of stateKeys) {
        if (key.toLowerCase() === normalized.toLowerCase()) {
            return { name: key, data: stateData[key] };
        }
    }
    
    // Try partial match
    for (const key of stateKeys) {
        const keyLower = key.toLowerCase();
        const normalizedLower = normalized.toLowerCase();
        if (keyLower.includes(normalizedLower) || normalizedLower.includes(keyLower)) {
            // Prefer longer matches
            if (keyLower.length >= normalizedLower.length) {
                return { name: key, data: stateData[key] };
            }
        }
    }
    
    return null;
}

// API endpoint: Get specific state data
app.get('/api/satisfaction/state/:stateName', (req, res) => {
    try {
        const stateName = decodeURIComponent(req.params.stateName);
        
        if (!stateName) {
            return res.status(400).json({
                success: false,
                error: 'Bad request',
                message: 'State name is required',
                timestamp: new Date().toISOString()
            });
        }
        
        // Try to serve pre-generated API response first
        const preGeneratedPath = path.join(__dirname, 'api', 'satisfaction', 'state', encodeURIComponent(stateName) + '.json');
        if (fs.existsSync(preGeneratedPath)) {
            const preGenerated = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf8'));
            return res.json(preGenerated);
        }
        
        const stateMatch = findStateByName(stateName);
        
        if (!stateMatch) {
            return res.status(404).json({
                success: false,
                error: 'State not found',
                requestedState: stateName,
                availableStates: Object.keys(stateData).slice(0, 20),
                suggestion: 'Check spelling or try a different state name',
                timestamp: new Date().toISOString()
            });
        }
        
        const state = stateMatch.data;
        
        // Validate state data structure
        if (!state || !state.averageRating) {
            return res.status(500).json({
                success: false,
                error: 'Invalid state data',
                message: 'State data is missing required fields',
                timestamp: new Date().toISOString()
            });
        }
        
        // Add real-time variation
        const updatedRating = addVariation(state.averageRating, 0.08);
        const updatedStars = Math.max(1, Math.min(5, Math.round(updatedRating)));
        const updatedScore = Math.max(0, Math.min(100, Math.round(updatedRating * 20)));
        
        // Update districts with variation
        const updatedDistricts = (state.districts || []).map(district => ({
            ...district,
            averageRating: parseFloat(addVariation(district.averageRating || 4.0, 0.1).toFixed(2))
        }));
        
        // Include county data if available
        const responseData = {
            success: true,
            stateName: stateMatch.name,
            averageRating: parseFloat(updatedRating.toFixed(2)),
            stars: updatedStars,
            score: updatedScore,
            districts: updatedDistricts,
            lastUpdated: new Date().toISOString()
        };
        
        // Add county information if available
        if (state.highestCounty && state.lowestCounty) {
            responseData.highestCounty = state.highestCounty;
            responseData.lowestCounty = state.lowestCounty;
        }
        
        res.json(responseData);
    } catch (error) {
        console.error('Error in /api/satisfaction/state/:stateName:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Expanded customer reviews database
const reviewsDatabase = [
    {
        id: 1,
        name: "Sarah M.",
        location: "Los Angeles, CA",
        rating: 5,
        text: "Switched from Verizon and couldn't be happier! The coverage is excellent and customer service is top-notch.",
    },
    {
        id: 2,
        name: "Michael R.",
        location: "Austin, TX",
        rating: 5,
        text: "Best value for money. The 5G speeds are incredible and I'm saving so much compared to my old carrier.",
    },
    {
        id: 3,
        name: "Jennifer L.",
        location: "Seattle, WA",
        rating: 4,
        text: "Great service overall. Had a small issue with billing but customer support resolved it quickly.",
    },
    {
        id: 4,
        name: "David K.",
        location: "Miami, FL",
        rating: 5,
        text: "T-Mobile's network has improved dramatically. I get great coverage everywhere I go now.",
    },
    {
        id: 5,
        name: "Emily C.",
        location: "Denver, CO",
        rating: 4,
        text: "Love the unlimited data plans. The family plan is a great deal and everyone in my family is happy.",
    },
    {
        id: 6,
        name: "Robert T.",
        location: "Chicago, IL",
        rating: 5,
        text: "Switched three months ago and it's been perfect. Fast speeds, reliable connection, and great customer service.",
    },
    {
        id: 7,
        name: "Amanda P.",
        location: "Phoenix, AZ",
        rating: 5,
        text: "The 5G network is amazing! I can stream videos without any buffering. Best carrier I've ever had.",
    },
    {
        id: 8,
        name: "James W.",
        location: "Boston, MA",
        rating: 4,
        text: "Good coverage and reasonable prices. Customer service could be faster but they're helpful when you reach them.",
    },
    {
        id: 9,
        name: "Lisa H.",
        location: "San Diego, CA",
        rating: 5,
        text: "Switched from AT&T and saved $50/month. The service is just as good, if not better. Highly recommend!",
    },
    {
        id: 10,
        name: "Mark S.",
        location: "Portland, OR",
        rating: 4,
        text: "Solid network coverage. The unlimited data is great for my work. Only minor complaint is occasional slow speeds in rural areas.",
    },
    {
        id: 11,
        name: "Rachel B.",
        location: "Nashville, TN",
        rating: 5,
        text: "Excellent customer service! They helped me switch seamlessly and even gave me a better deal than advertised.",
    },
    {
        id: 12,
        name: "Chris M.",
        location: "Las Vegas, NV",
        rating: 4,
        text: "Great value for the price. Network is reliable and fast. The app is user-friendly too.",
    }
];

// API endpoint: Get recent customer reviews
app.get('/api/reviews', (req, res) => {
    try {
        // Try to serve pre-generated API response first
        const preGeneratedPath = path.join(__dirname, 'api', 'reviews.json');
        if (fs.existsSync(preGeneratedPath)) {
            const preGenerated = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf8'));
            const limit = parseInt(req.query.limit) || 6;
            const maxLimit = 20;
            const actualLimit = Math.min(limit, maxLimit);
            if (actualLimit !== preGenerated.reviews.length && preGenerated.reviews.length >= actualLimit) {
                preGenerated.reviews = preGenerated.reviews.slice(0, actualLimit);
                preGenerated.total = actualLimit;
            }
            return res.json(preGenerated);
        }
        
        const limit = parseInt(req.query.limit) || 6;
        const maxLimit = 20;
        const actualLimit = Math.min(limit, maxLimit);
        
        // Shuffle and return reviews with slight rating variations
        const shuffled = [...reviewsDatabase].sort(() => 0.5 - Math.random());
        const selectedReviews = shuffled.slice(0, actualLimit);
        
        const updatedReviews = selectedReviews.map(review => ({
            ...review,
            rating: Math.max(4, Math.min(5, Math.round(addVariation(review.rating, 0.2)))),
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));
        
        res.json({
            success: true,
            reviews: updatedReviews,
            total: updatedReviews.length,
            available: reviewsDatabase.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /api/reviews:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint: Get list of all available states
app.get('/api/states/list', (req, res) => {
    try {
        // Try to serve pre-generated API response first
        const preGeneratedPath = path.join(__dirname, 'api', 'states-list.json');
        if (fs.existsSync(preGeneratedPath)) {
            const preGenerated = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf8'));
            return res.json(preGenerated);
        }
        
        const states = Object.keys(stateData).sort();
        res.json({
            success: true,
            states: states,
            count: states.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /api/states/list:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint: Get all entries for a specific state
app.get('/api/state/:stateName/entries', (req, res) => {
    try {
        const stateName = decodeURIComponent(req.params.stateName);
        
        // Try to serve pre-generated API response first (if no filters applied)
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const minRating = parseFloat(req.query.minRating) || 0;
        const maxRating = parseFloat(req.query.maxRating) || 5;
        
        if (offset === 0 && minRating === 0 && maxRating === 5) {
            const preGeneratedPath = path.join(__dirname, 'api', 'state', encodeURIComponent(stateName), 'entries.json');
            if (fs.existsSync(preGeneratedPath)) {
                const preGenerated = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf8'));
                // Apply limit if different from default
                if (limit !== 100 && preGenerated.entries) {
                    preGenerated.entries = preGenerated.entries.slice(0, limit);
                    preGenerated.pagination.limit = limit;
                    preGenerated.pagination.hasMore = preGenerated.pagination.total > limit;
                }
                return res.json(preGenerated);
            }
        }
        
        const stateMatch = findStateByName(stateName);
        
        if (!stateMatch) {
            return res.status(404).json({
                success: false,
                error: 'State not found',
                requestedState: stateName,
                timestamp: new Date().toISOString()
            });
        }
        
        const stateFullData = comprehensiveData[stateMatch.name];
        
        if (!stateFullData || !stateFullData.entries) {
            return res.status(404).json({
                success: false,
                error: 'Entries not available',
                message: 'Comprehensive data not loaded for this state',
                timestamp: new Date().toISOString()
            });
        }
        
        // Filter entries by rating
        let filteredEntries = stateFullData.entries.filter(entry => 
            entry.rating >= minRating && entry.rating <= maxRating
        );
        
        // Sort by date (newest first)
        filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Apply pagination
        const total = filteredEntries.length;
        const paginatedEntries = filteredEntries.slice(offset, offset + limit);
        
        res.json({
            success: true,
            stateName: stateMatch.name,
            entries: paginatedEntries,
            pagination: {
                total: total,
                limit: limit,
                offset: offset,
                hasMore: offset + limit < total
            },
            filters: {
                minRating: minRating,
                maxRating: maxRating
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /api/state/:stateName/entries:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint: Get statistics for a state based on entries
app.get('/api/state/:stateName/statistics', (req, res) => {
    try {
        const stateName = decodeURIComponent(req.params.stateName);
        
        // Try to serve pre-generated API response first
        const preGeneratedPath = path.join(__dirname, 'api', 'state', encodeURIComponent(stateName), 'statistics.json');
        if (fs.existsSync(preGeneratedPath)) {
            const preGenerated = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf8'));
            return res.json(preGenerated);
        }
        
        const stateMatch = findStateByName(stateName);
        
        if (!stateMatch) {
            return res.status(404).json({
                success: false,
                error: 'State not found',
                requestedState: stateName,
                timestamp: new Date().toISOString()
            });
        }
        
        const stateFullData = comprehensiveData[stateMatch.name];
        
        if (!stateFullData || !stateFullData.entries) {
            return res.status(404).json({
                success: false,
                error: 'Entries not available',
                message: 'Comprehensive data not loaded for this state',
                timestamp: new Date().toISOString()
            });
        }
        
        const entries = stateFullData.entries;
        
        // Calculate statistics
        const totalEntries = entries.length;
        const avgRating = entries.reduce((sum, e) => sum + e.rating, 0) / totalEntries;
        const avgScore = entries.reduce((sum, e) => sum + e.score, 0) / totalEntries;
        
        // Rating distribution
        const ratingDistribution = {
            5: entries.filter(e => e.rating === 5).length,
            4: entries.filter(e => e.rating === 4).length,
            3: entries.filter(e => e.rating === 3).length,
            2: entries.filter(e => e.rating === 2).length,
            1: entries.filter(e => e.rating === 1).length
        };
        
        // Category distribution
        const categoryCounts = {};
        entries.forEach(entry => {
            categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
        });
        
        // Verified vs unverified
        const verifiedCount = entries.filter(e => e.verified).length;
        
        // Recent entries (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentEntries = entries.filter(e => new Date(e.date) >= thirtyDaysAgo).length;
        
        res.json({
            success: true,
            stateName: stateMatch.name,
            statistics: {
                totalEntries: totalEntries,
                averageRating: parseFloat(avgRating.toFixed(2)),
                averageScore: Math.round(avgScore),
                ratingDistribution: ratingDistribution,
                categoryDistribution: categoryCounts,
                verifiedEntries: verifiedCount,
                unverifiedEntries: totalEntries - verifiedCount,
                recentEntries: recentEntries,
                verifiedPercentage: Math.round((verifiedCount / totalEntries) * 100)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /api/state/:stateName/statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint: Get all entries across all states (with filtering)
app.get('/api/entries/all', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const stateFilter = req.query.state ? decodeURIComponent(req.query.state) : null;
        const minRating = parseFloat(req.query.minRating) || 0;
        const maxRating = parseFloat(req.query.maxRating) || 5;
        
        // Try to serve pre-generated API response first (if no filters applied)
        if (offset === 0 && !stateFilter && minRating === 0 && maxRating === 5) {
            const preGeneratedPath = path.join(__dirname, 'api', 'entries-all.json');
            if (fs.existsSync(preGeneratedPath)) {
                const preGenerated = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf8'));
                // Apply limit if different from default
                if (limit !== 50 && preGenerated.entries) {
                    preGenerated.entries = preGenerated.entries.slice(0, limit);
                    preGenerated.pagination.limit = limit;
                    preGenerated.pagination.hasMore = preGenerated.pagination.total > limit;
                }
                return res.json(preGenerated);
            }
        }
        
        let allEntries = [];
        
        Object.keys(comprehensiveData).forEach(stateName => {
            if (stateFilter && stateName.toLowerCase() !== stateFilter.toLowerCase()) {
                return;
            }
            
            const stateData = comprehensiveData[stateName];
            if (stateData.entries) {
                stateData.entries.forEach(entry => {
                    if (entry.rating >= minRating && entry.rating <= maxRating) {
                        allEntries.push({
                            ...entry,
                            state: stateName
                        });
                    }
                });
            }
        });
        
        // Sort by date (newest first)
        allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Apply pagination
        const total = allEntries.length;
        const paginatedEntries = allEntries.slice(offset, offset + limit);
        
        res.json({
            success: true,
            entries: paginatedEntries,
            pagination: {
                total: total,
                limit: limit,
                offset: offset,
                hasMore: offset + limit < total
            },
            filters: {
                state: stateFilter || 'all',
                minRating: minRating,
                maxRating: maxRating
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /api/entries/all:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
    const statesLoaded = Object.keys(stateData).length;
    const isHealthy = statesLoaded > 0 && !dataLoadError;
    
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'T-Mobile Customer Satisfaction API',
        version: '1.0.0',
        statesLoaded: statesLoaded,
        dataLoadError: dataLoadError,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
        message: `API endpoint ${req.method} ${req.path} not found`,
        availableEndpoints: [
            'GET /api/satisfaction/overall',
            'GET /api/satisfaction/states',
            'GET /api/satisfaction/state/:stateName',
            'GET /api/reviews',
            'GET /api/states/list',
            'GET /api/health',
            'POST /api/admin/reload'
        ],
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 T-Mobile Customer Satisfaction API Server`);
    console.log(`📡 Running on http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log(`\n📊 Available API Endpoints:`);
    console.log(`   GET  /api/satisfaction/overall          - Overall satisfaction rating`);
    console.log(`   GET  /api/satisfaction/states            - All states data`);
    console.log(`   GET  /api/satisfaction/state/:stateName  - Specific state data`);
    console.log(`   GET  /api/state/:stateName/entries      - Get entries for a state (100-200 per state)`);
    console.log(`   GET  /api/state/:stateName/statistics   - Get statistics for a state`);
    console.log(`   GET  /api/entries/all                   - Get all entries across states`);
    console.log(`   GET  /api/reviews                        - Customer reviews`);
    console.log(`   GET  /api/states/list                    - List all available states`);
    console.log(`   GET  /api/health                         - Health check`);
    console.log(`   POST /api/admin/reload                   - Reload state data`);
    console.log(`\n🌐 Web App:`);
    console.log(`   http://localhost:${PORT}/index.html`);
    console.log(`   http://localhost:${PORT}/details.html`);
    console.log(`\n✅ Server ready!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM signal received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT signal received. Shutting down gracefully...');
    process.exit(0);
});
