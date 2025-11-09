const fs = require('fs');
const path = require('path');

// Load state data
let stateData = {};
let comprehensiveData = {};

function loadStateData() {
    try {
        // Try to load comprehensive data first
        const comprehensivePath = path.join(__dirname, 'state-entries-data.json');
        if (fs.existsSync(comprehensivePath)) {
            const data = fs.readFileSync(comprehensivePath, 'utf8');
            comprehensiveData = JSON.parse(data);
            // Also populate stateData for backward compatibility
            Object.keys(comprehensiveData).forEach(stateName => {
                const { entries, totalEntries, lastUpdated, ...stateInfo } = comprehensiveData[stateName];
                stateData[stateName] = stateInfo;
            });
            console.log(`✅ Loaded comprehensive data for ${Object.keys(comprehensiveData).length} states`);
            return true;
        }
        
        // Fallback to basic state data
        const dataPath = path.join(__dirname, 'state-data.json');
        if (!fs.existsSync(dataPath)) {
            throw new Error('No state data files found');
        }
        const data = fs.readFileSync(dataPath, 'utf8');
        stateData = JSON.parse(data);
        console.log(`✅ Loaded basic data for ${Object.keys(stateData).length} states`);
        return true;
    } catch (error) {
        console.error('❌ Error loading state data:', error.message);
        return false;
    }
}

// Helper function to add variation (same as API server)
function addVariation(value, variance = 0.1) {
    const change = (Math.random() - 0.5) * variance;
    return Math.max(0, Math.min(5, value + change));
}

// Helper function to find state by name
function findStateByName(stateName) {
    if (!stateName || typeof stateName !== 'string') {
        return null;
    }
    
    const normalized = stateName.trim();
    if (!normalized) {
        return null;
    }
    
    if (stateData[normalized]) {
        return { name: normalized, data: stateData[normalized] };
    }
    
    const stateKeys = Object.keys(stateData);
    for (const key of stateKeys) {
        if (key.toLowerCase() === normalized.toLowerCase()) {
            return { name: key, data: stateData[key] };
        }
    }
    
    for (const key of stateKeys) {
        const keyLower = key.toLowerCase();
        const normalizedLower = normalized.toLowerCase();
        if (keyLower.includes(normalizedLower) || normalizedLower.includes(keyLower)) {
            if (keyLower.length >= normalizedLower.length) {
                return { name: key, data: stateData[key] };
            }
        }
    }
    
    return null;
}

// Create API directory
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
}

// 1. Generate /api/satisfaction/overall
function generateOverallSatisfaction() {
    const states = Object.keys(stateData);
    let totalRating = 0;
    let count = 0;
    let totalReviews = 0;
    
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
                totalRatingSum += stateData[stateName].averageRating * 100;
                totalEntriesCount += 100;
            }
        });
        
        if (totalEntriesCount > 0) {
            totalRating = totalRatingSum / totalEntriesCount;
            totalReviews = totalEntriesCount;
            count = Object.keys(comprehensiveData).length;
        }
    }
    
    if (count === 0) {
        states.forEach(state => {
            if (stateData[state] && stateData[state].averageRating) {
                totalRating += stateData[state].averageRating;
                count++;
                totalReviews += Math.floor(Math.random() * 1000) + 500;
            }
        });
    }
    
    const overallRating = count > 0 ? totalRating / count : 0;
    const realTimeRating = addVariation(overallRating, 0.05);
    const stars = Math.max(1, Math.min(5, Math.round(realTimeRating)));
    const score = Math.max(0, Math.min(100, Math.round(realTimeRating * 20)));
    const recommendRate = Math.max(85, Math.min(98, Math.round(overallRating * 20 + 5)));
    
    const response = {
        success: true,
        averageRating: parseFloat(realTimeRating.toFixed(2)),
        stars: stars,
        score: score,
        totalStates: count,
        totalReviews: totalReviews,
        recommendRate: recommendRate,
        lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(
        path.join(apiDir, 'satisfaction-overall.json'),
        JSON.stringify(response, null, 2)
    );
    console.log('✅ Generated /api/satisfaction/overall');
}

// 2. Generate /api/satisfaction/states
function generateAllStates() {
    const updatedStates = {};
    
    Object.keys(stateData).forEach(stateName => {
        const state = stateData[stateName];
        if (!state || !state.averageRating) return;
        
        const updatedRating = addVariation(state.averageRating, 0.08);
        const updatedStars = Math.max(1, Math.min(5, Math.round(updatedRating)));
        const updatedScore = Math.max(0, Math.min(100, Math.round(updatedRating * 20)));
        
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
    
    const response = {
        success: true,
        states: updatedStates,
        totalStates: Object.keys(updatedStates).length,
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
        path.join(apiDir, 'satisfaction-states.json'),
        JSON.stringify(response, null, 2)
    );
    console.log('✅ Generated /api/satisfaction/states');
}

// 3. Generate /api/satisfaction/state/:stateName for each state
function generateStateData() {
    const statesDir = path.join(apiDir, 'satisfaction', 'state');
    if (!fs.existsSync(statesDir)) {
        fs.mkdirSync(statesDir, { recursive: true });
    }
    
    Object.keys(stateData).forEach(stateName => {
        const state = stateData[stateName];
        if (!state || !state.averageRating) return;
        
        const updatedRating = addVariation(state.averageRating, 0.08);
        const updatedStars = Math.max(1, Math.min(5, Math.round(updatedRating)));
        const updatedScore = Math.max(0, Math.min(100, Math.round(updatedRating * 20)));
        
        const updatedDistricts = (state.districts || []).map(district => ({
            ...district,
            averageRating: parseFloat(addVariation(district.averageRating || 4.0, 0.1).toFixed(2))
        }));
        
        const responseData = {
            success: true,
            stateName: stateName,
            averageRating: parseFloat(updatedRating.toFixed(2)),
            stars: updatedStars,
            score: updatedScore,
            districts: updatedDistricts,
            lastUpdated: new Date().toISOString()
        };
        
        if (state.highestCounty && state.lowestCounty) {
            responseData.highestCounty = state.highestCounty;
            responseData.lowestCounty = state.lowestCounty;
        }
        
        const fileName = encodeURIComponent(stateName) + '.json';
        fs.writeFileSync(
            path.join(statesDir, fileName),
            JSON.stringify(responseData, null, 2)
        );
    });
    
    console.log(`✅ Generated /api/satisfaction/state/:stateName for ${Object.keys(stateData).length} states`);
}

// 4. Generate /api/state/:stateName/statistics for each state
function generateStateStatistics() {
    const statsDir = path.join(apiDir, 'state');
    if (!fs.existsSync(statsDir)) {
        fs.mkdirSync(statsDir, { recursive: true });
    }
    
    Object.keys(comprehensiveData).forEach(stateName => {
        const stateFullData = comprehensiveData[stateName];
        if (!stateFullData || !stateFullData.entries) {
            return;
        }
        
        const entries = stateFullData.entries;
        const totalEntries = entries.length;
        const avgRating = entries.reduce((sum, e) => sum + e.rating, 0) / totalEntries;
        const avgScore = entries.reduce((sum, e) => sum + e.score, 0) / totalEntries;
        
        const ratingDistribution = {
            5: entries.filter(e => e.rating === 5).length,
            4: entries.filter(e => e.rating === 4).length,
            3: entries.filter(e => e.rating === 3).length,
            2: entries.filter(e => e.rating === 2).length,
            1: entries.filter(e => e.rating === 1).length
        };
        
        const categoryCounts = {};
        entries.forEach(entry => {
            categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
        });
        
        const verifiedCount = entries.filter(e => e.verified).length;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentEntries = entries.filter(e => new Date(e.date) >= thirtyDaysAgo).length;
        
        const response = {
            success: true,
            stateName: stateName,
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
        };
        
        const stateStatsDir = path.join(statsDir, encodeURIComponent(stateName));
        if (!fs.existsSync(stateStatsDir)) {
            fs.mkdirSync(stateStatsDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(stateStatsDir, 'statistics.json'),
            JSON.stringify(response, null, 2)
        );
    });
    
    console.log(`✅ Generated /api/state/:stateName/statistics for ${Object.keys(comprehensiveData).length} states`);
}

// 5. Generate /api/state/:stateName/entries for each state
function generateStateEntries() {
    const entriesDir = path.join(apiDir, 'state');
    if (!fs.existsSync(entriesDir)) {
        fs.mkdirSync(entriesDir, { recursive: true });
    }
    
    Object.keys(comprehensiveData).forEach(stateName => {
        const stateFullData = comprehensiveData[stateName];
        if (!stateFullData || !stateFullData.entries) {
            return;
        }
        
        const entries = stateFullData.entries;
        const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const response = {
            success: true,
            stateName: stateName,
            entries: sortedEntries.slice(0, 100), // First 100 entries
            pagination: {
                total: entries.length,
                limit: 100,
                offset: 0,
                hasMore: entries.length > 100
            },
            filters: {
                minRating: 0,
                maxRating: 5
            },
            timestamp: new Date().toISOString()
        };
        
        const stateEntriesDir = path.join(entriesDir, encodeURIComponent(stateName));
        if (!fs.existsSync(stateEntriesDir)) {
            fs.mkdirSync(stateEntriesDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(stateEntriesDir, 'entries.json'),
            JSON.stringify(response, null, 2)
        );
    });
    
    console.log(`✅ Generated /api/state/:stateName/entries for ${Object.keys(comprehensiveData).length} states`);
}

// 6. Generate /api/entries/all
function generateAllEntries() {
    let allEntries = [];
    
    Object.keys(comprehensiveData).forEach(stateName => {
        const stateData = comprehensiveData[stateName];
        if (stateData.entries) {
            stateData.entries.forEach(entry => {
                allEntries.push({
                    ...entry,
                    state: stateName
                });
            });
        }
    });
    
    allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Include up to 200 entries for the carousel
    const maxEntries = Math.min(200, allEntries.length);
    
    const response = {
        success: true,
        entries: allEntries.slice(0, maxEntries),
        pagination: {
            total: allEntries.length,
            limit: maxEntries,
            offset: 0,
            hasMore: allEntries.length > maxEntries
        },
        filters: {
            state: 'all',
            minRating: 0,
            maxRating: 5
        },
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
        path.join(apiDir, 'entries-all.json'),
        JSON.stringify(response, null, 2)
    );
    console.log('✅ Generated /api/entries/all');
}

// 7. Generate /api/states/list
function generateStatesList() {
    const states = Object.keys(stateData).sort();
    const response = {
        success: true,
        states: states,
        count: states.length,
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
        path.join(apiDir, 'states-list.json'),
        JSON.stringify(response, null, 2)
    );
    console.log('✅ Generated /api/states/list');
}

// 8. Generate /api/reviews
function generateReviews() {
    const reviewsDatabase = [
        { id: 1, name: "Sarah M.", location: "Los Angeles, CA", rating: 5, text: "Switched from Verizon and couldn't be happier! The coverage is excellent and customer service is top-notch." },
        { id: 2, name: "Michael R.", location: "Austin, TX", rating: 5, text: "Best value for money. The 5G speeds are incredible and I'm saving so much compared to my old carrier." },
        { id: 3, name: "Jennifer L.", location: "Seattle, WA", rating: 4, text: "Great service overall. Had a small issue with billing but customer support resolved it quickly." },
        { id: 4, name: "David K.", location: "Miami, FL", rating: 5, text: "T-Mobile's network has improved dramatically. I get great coverage everywhere I go now." },
        { id: 5, name: "Emily C.", location: "Denver, CO", rating: 4, text: "Love the unlimited data plans. The family plan is a great deal and everyone in my family is happy." },
        { id: 6, name: "Robert T.", location: "Chicago, IL", rating: 5, text: "Switched three months ago and it's been perfect. Fast speeds, reliable connection, and great customer service." },
        { id: 7, name: "Amanda P.", location: "Phoenix, AZ", rating: 5, text: "The 5G network is amazing! I can stream videos without any buffering. Best carrier I've ever had." },
        { id: 8, name: "James W.", location: "Boston, MA", rating: 4, text: "Good coverage and reasonable prices. Customer service could be faster but they're helpful when you reach them." },
        { id: 9, name: "Lisa H.", location: "San Diego, CA", rating: 5, text: "Switched from AT&T and saved $50/month. The service is just as good, if not better. Highly recommend!" },
        { id: 10, name: "Mark S.", location: "Portland, OR", rating: 4, text: "Solid network coverage. The unlimited data is great for my work. Only minor complaint is occasional slow speeds in rural areas." },
        { id: 11, name: "Rachel B.", location: "Nashville, TN", rating: 5, text: "Excellent customer service! They helped me switch seamlessly and even gave me a better deal than advertised." },
        { id: 12, name: "Chris M.", location: "Las Vegas, NV", rating: 4, text: "Great value for the price. Network is reliable and fast. The app is user-friendly too." }
    ];
    
    const shuffled = [...reviewsDatabase].sort(() => 0.5 - Math.random());
    const selectedReviews = shuffled.slice(0, 6);
    
    const updatedReviews = selectedReviews.map(review => ({
        ...review,
        rating: Math.max(4, Math.min(5, Math.round(addVariation(review.rating, 0.2)))),
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    const response = {
        success: true,
        reviews: updatedReviews,
        total: updatedReviews.length,
        available: reviewsDatabase.length,
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
        path.join(apiDir, 'reviews.json'),
        JSON.stringify(response, null, 2)
    );
    console.log('✅ Generated /api/reviews');
}

// Main execution
console.log('\n🚀 Pre-generating API responses...\n');

if (!loadStateData()) {
    console.error('❌ Failed to load state data. Exiting.');
    process.exit(1);
}

generateOverallSatisfaction();
generateAllStates();
generateStateData();
generateStateStatistics();
generateStateEntries();
generateAllEntries();
generateStatesList();
generateReviews();

console.log('\n✅ All API responses pre-generated successfully!');
console.log(`📁 API files saved to: ${apiDir}\n`);

