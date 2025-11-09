const fs = require('fs');
const path = require('path');

// Load existing state data with counties
const stateData = JSON.parse(fs.readFileSync(path.join(__dirname, 'state-data.json'), 'utf8'));

// First names and last names for generating customer names
const firstNames = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
    "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Christopher", "Karen",
    "Daniel", "Nancy", "Matthew", "Lisa", "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra",
    "Steven", "Ashley", "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna", "Kenneth", "Michelle",
    "Kevin", "Carol", "Brian", "Amanda", "George", "Dorothy", "Edward", "Melissa", "Ronald", "Deborah",
    "Timothy", "Stephanie", "Jason", "Rebecca", "Jeffrey", "Sharon", "Ryan", "Laura", "Jacob", "Cynthia",
    "Gary", "Kathleen", "Nicholas", "Amy", "Eric", "Angela", "Jonathan", "Shirley", "Stephen", "Anna",
    "Larry", "Brenda", "Justin", "Pamela", "Scott", "Emma", "Brandon", "Nicole", "Benjamin", "Helen",
    "Samuel", "Samantha", "Frank", "Katherine", "Gregory", "Christine", "Raymond", "Debra", "Alexander", "Rachel",
    "Patrick", "Carolyn", "Jack", "Janet", "Dennis", "Virginia", "Jerry", "Maria", "Tyler", "Heather",
    "Aaron", "Diane", "Jose", "Julie", "Henry", "Joyce", "Adam", "Victoria", "Douglas", "Kelly",
    "Nathan", "Christina", "Zachary", "Joan", "Kyle", "Evelyn", "Noah", "Judith", "Ethan", "Megan"
];

const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
    "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams",
    "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips",
    "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris",
    "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks",
    "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez",
    "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins"
];

// Categories for feedback
const categories = ["Coverage", "Price", "Customer Service", "Network Speed", "Reliability"];

// Generate review text based on rating
function generateReviewText(rating, category) {
    const reviews = {
        "Coverage": {
            high: ["Excellent coverage in my area. Never have dropped calls.", "Great signal strength everywhere I go.", "Best coverage I've ever had. Very reliable."],
            medium: ["Coverage is decent but could be better in some areas.", "Generally good coverage with occasional dead zones.", "Coverage works well in most places."],
            low: ["Poor coverage in many areas. Frequent dropped calls.", "Coverage is terrible. Can't make calls from home.", "Very disappointed with coverage quality."]
        },
        "Price": {
            high: ["Great value for the price. Very satisfied.", "Affordable plans with good features.", "Best pricing in the market. Highly recommend."],
            medium: ["Prices are reasonable but could be better.", "Decent pricing for what you get.", "Fair pricing overall."],
            low: ["Too expensive for what you get.", "Billing errors every month. Very frustrating.", "Overpriced compared to competitors."]
        },
        "Customer Service": {
            high: ["Outstanding customer service. Very helpful and friendly.", "Customer support is excellent. Quick responses.", "Best customer service experience ever."],
            medium: ["Customer service is okay. Sometimes helpful.", "Average customer support. Could be better.", "Service is decent but not exceptional."],
            low: ["Terrible customer service. Unhelpful and rude.", "Customer support is awful. Long wait times.", "Very poor customer service experience."]
        },
        "Network Speed": {
            high: ["Lightning fast speeds. Great for streaming.", "Excellent data speeds. Very fast.", "Best network speeds I've experienced."],
            medium: ["Speeds are decent but could be faster.", "Network speed is okay for most tasks.", "Average speeds, works for basic use."],
            low: ["Very slow network speeds. Can't stream videos.", "Terrible data speeds. Almost unusable.", "Network is extremely slow."]
        },
        "Reliability": {
            high: ["Very reliable service. Never have issues.", "Rock solid reliability. Highly dependable.", "Most reliable carrier I've used."],
            medium: ["Generally reliable with occasional issues.", "Reliability is okay but not perfect.", "Service is mostly reliable."],
            low: ["Unreliable service. Frequent outages.", "Very unreliable. Constant problems.", "Service reliability is terrible."]
        }
    };

    const categoryReviews = reviews[category] || reviews["Coverage"];
    let reviewSet;
    
    if (rating >= 4.0) {
        reviewSet = categoryReviews.high;
    } else if (rating >= 3.0) {
        reviewSet = categoryReviews.medium;
    } else {
        reviewSet = categoryReviews.low;
    }
    
    return reviewSet[Math.floor(Math.random() * reviewSet.length)];
}

// Generate entries for a state with county distribution
function generateStateEntries(stateName, stateInfo, numEntries = 120) {
    const entries = [];
    const counties = stateInfo.counties || [];
    
    // If no counties, create default county structure
    let countyList = counties;
    if (counties.length === 0) {
        // Create 5 default counties
        countyList = [
            { name: `${stateName} County`, city: stateName, averageRating: stateInfo.averageRating || 4.0 },
            { name: `Central ${stateName} County`, city: `Central ${stateName}`, averageRating: (stateInfo.averageRating || 4.0) + 0.2 },
            { name: `Northern ${stateName} County`, city: `Northern ${stateName}`, averageRating: (stateInfo.averageRating || 4.0) - 0.1 },
            { name: `Southern ${stateName} County`, city: `Southern ${stateName}`, averageRating: (stateInfo.averageRating || 4.0) + 0.1 },
            { name: `Eastern ${stateName} County`, city: `Eastern ${stateName}`, averageRating: (stateInfo.averageRating || 4.0) - 0.2 }
        ];
    }
    
    // Distribute entries across counties (weighted by county size/population simulation)
    const countyWeights = countyList.map((county, index) => {
        // Larger counties get more entries (simulate with index-based weighting)
        return Math.max(1, Math.floor((countyList.length - index) * 0.3 + 1));
    });
    const totalWeight = countyWeights.reduce((sum, w) => sum + w, 0);
    
    let entryIndex = 0;
    countyList.forEach((county, countyIndex) => {
        const countyEntries = Math.floor((countyWeights[countyIndex] / totalWeight) * numEntries);
        const countyBaseRating = county.averageRating || stateInfo.averageRating || 4.0;
        
        for (let i = 0; i < countyEntries && entryIndex < numEntries; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            
            // Generate rating with variation around county base rating
            const ratingVariation = (Math.random() - 0.5) * 1.5;
            const rating = Math.max(1, Math.min(5, Math.round((countyBaseRating + ratingVariation) * 2) / 2));
            
            // Generate date within last 6 months
            const daysAgo = Math.floor(Math.random() * 180);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            // Generate satisfaction score (0-100)
            const score = Math.round(rating * 20);
            
            // Select category
            const category = categories[Math.floor(Math.random() * categories.length)];
            
            // Generate review text
            const reviewText = generateReviewText(rating, category);
            
            // Determine location format
            const location = county.city ? `${county.city}, ${stateName.substring(0, 2).toUpperCase()}` : `${stateName}`;
            
            entries.push({
                id: `${stateName.toLowerCase().replace(/\s+/g, '-')}-${entryIndex + 1}`,
                customerName: `${firstName} ${lastName.charAt(0)}.`,
                location: location,
                state: stateName,
                county: county.name || `${stateName} County`,
                city: county.city || stateName,
                rating: rating,
                score: score,
                review: reviewText,
                date: date.toISOString().split('T')[0],
                category: category,
                verified: Math.random() > 0.3, // 70% verified
                countyContact: county.contact || null
            });
            
            entryIndex++;
        }
    });
    
    // Fill remaining entries if needed
    while (entryIndex < numEntries) {
        const county = countyList[Math.floor(Math.random() * countyList.length)];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        const countyBaseRating = county.averageRating || stateInfo.averageRating || 4.0;
        const ratingVariation = (Math.random() - 0.5) * 1.5;
        const rating = Math.max(1, Math.min(5, Math.round((countyBaseRating + ratingVariation) * 2) / 2));
        
        const daysAgo = Math.floor(Math.random() * 180);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        const score = Math.round(rating * 20);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const reviewText = generateReviewText(rating, category);
        const location = county.city ? `${county.city}, ${stateName.substring(0, 2).toUpperCase()}` : `${stateName}`;
        
        entries.push({
            id: `${stateName.toLowerCase().replace(/\s+/g, '-')}-${entryIndex + 1}`,
            customerName: `${firstName} ${lastName.charAt(0)}.`,
            location: location,
            state: stateName,
            county: county.name || `${stateName} County`,
            city: county.city || stateName,
            rating: rating,
            score: score,
            review: reviewText,
            date: date.toISOString().split('T')[0],
            category: category,
            verified: Math.random() > 0.3,
            countyContact: county.contact || null
        });
        
        entryIndex++;
    }
    
    return entries;
}

// Generate comprehensive data for all states
const comprehensiveData = {};
const allEntries = [];

Object.keys(stateData).forEach(stateName => {
    const state = stateData[stateName];
    const numEntries = 100 + Math.floor(Math.random() * 50); // 100-150 entries per state
    
    const entries = generateStateEntries(stateName, state, numEntries);
    
    comprehensiveData[stateName] = {
        ...state,
        entries: entries,
        totalEntries: entries.length,
        lastUpdated: new Date().toISOString()
    };
    
    // Add to all entries array
    entries.forEach(entry => {
        allEntries.push(entry);
    });
});

// Save state-specific data
fs.writeFileSync(
    path.join(__dirname, 'state-entries-data.json'),
    JSON.stringify(comprehensiveData, null, 2),
    'utf8'
);

// Save all entries in a single file for easy access
const allEntriesData = {
    success: true,
    entries: allEntries,
    total: allEntries.length,
    states: Object.keys(stateData).length,
    generatedAt: new Date().toISOString()
};

fs.writeFileSync(
    path.join(__dirname, 'api', 'entries-all.json'),
    JSON.stringify(allEntriesData, null, 2),
    'utf8'
);

// Generate statistics
const totalEntries = allEntries.length;
const avgRating = allEntries.reduce((sum, e) => sum + e.rating, 0) / totalEntries;
const avgScore = allEntries.reduce((sum, e) => sum + e.score, 0) / totalEntries;
const verifiedCount = allEntries.filter(e => e.verified).length;

console.log('✅ Generated comprehensive data for all states');
console.log(`📊 Total entries: ${totalEntries.toLocaleString()}`);
console.log(`📈 Average rating: ${avgRating.toFixed(2)}`);
console.log(`📈 Average score: ${avgScore.toFixed(2)}`);
console.log(`✓ Verified entries: ${verifiedCount.toLocaleString()} (${((verifiedCount/totalEntries)*100).toFixed(1)}%)`);
console.log(`🗺️  States covered: ${Object.keys(stateData).length}`);
console.log(`📁 Files saved:`);
console.log(`   - state-entries-data.json`);
console.log(`   - api/entries-all.json`);

