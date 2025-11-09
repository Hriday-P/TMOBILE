const fs = require('fs');
const path = require('path');

// Load existing state data with counties
const stateData = JSON.parse(fs.readFileSync(path.join(__dirname, 'state-data.json'), 'utf8'));

// State abbreviations mapping
const stateAbbreviations = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
    "District of Columbia": "DC"
};

// Load existing entries
let existingEntries = [];
try {
    const existingData = JSON.parse(fs.readFileSync(path.join(__dirname, 'api', 'entries-all.json'), 'utf8'));
    existingEntries = existingData.entries || [];
    console.log(`Loaded ${existingEntries.length} existing entries`);
} catch (e) {
    console.log('No existing entries file found, starting fresh');
}

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

// Generate positive review text based on rating and category
function generatePositiveReview(rating, category) {
    const reviews = {
        "Coverage": {
            excellent: [
                "Outstanding coverage everywhere I go. Never have any dropped calls!",
                "Best coverage I've ever experienced. Works perfectly in all areas.",
                "Excellent signal strength. Can't believe how reliable it is.",
                "Amazing coverage! Works great even in remote areas.",
                "Perfect coverage throughout my entire area. Very impressed!"
            ],
            veryGood: [
                "Great coverage overall. Very reliable service.",
                "Good coverage in most areas. Very satisfied.",
                "Coverage is excellent. No complaints at all.",
                "Reliable coverage everywhere I need it.",
                "Strong signal and great coverage quality."
            ]
        },
        "Price": {
            excellent: [
                "Best value for money! Great plans at affordable prices.",
                "Excellent pricing. Can't beat the value!",
                "Amazing deals and fair pricing. Very happy!",
                "Great value for what you get. Highly recommend!",
                "Best pricing in the market. Very satisfied customer!"
            ],
            veryGood: [
                "Fair pricing for quality service. Good value.",
                "Reasonable prices with great features.",
                "Good pricing structure. Worth every penny.",
                "Affordable plans with excellent service.",
                "Great value for the price. Very pleased!"
            ]
        },
        "Customer Service": {
            excellent: [
                "Outstanding customer service! Always helpful and friendly.",
                "Best customer support I've ever experienced. Top notch!",
                "Excellent service team. Quick responses and very professional.",
                "Amazing customer service. They go above and beyond!",
                "Outstanding support. Best in the business!"
            ],
            veryGood: [
                "Great customer service. Always helpful when needed.",
                "Good support team. Quick to resolve any issues.",
                "Professional and friendly customer service.",
                "Reliable customer support. Very satisfied.",
                "Helpful service representatives. Good experience."
            ]
        },
        "Network Speed": {
            excellent: [
                "Lightning fast speeds! Perfect for streaming and work.",
                "Incredibly fast network. Best speeds I've ever had!",
                "Blazing fast data speeds. Excellent performance!",
                "Amazing network speeds. Works flawlessly!",
                "Super fast! Can stream 4K without any issues."
            ],
            veryGood: [
                "Fast and reliable network speeds. Very good!",
                "Good data speeds. Works well for all my needs.",
                "Quick network performance. Very satisfied.",
                "Fast speeds for streaming and browsing.",
                "Reliable high-speed network. Great experience!"
            ]
        },
        "Reliability": {
            excellent: [
                "Most reliable service I've ever used. Never fails!",
                "Rock solid reliability. Can always count on it.",
                "Extremely reliable. Never had any issues!",
                "Perfect reliability. Works consistently every time.",
                "Outstanding reliability. Best carrier I've used!"
            ],
            veryGood: [
                "Very reliable service. Consistent performance.",
                "Good reliability. Works well most of the time.",
                "Dependable service. Very satisfied.",
                "Reliable network. Good overall experience.",
                "Consistent and reliable. Great service!"
            ]
        }
    };

    const categoryReviews = reviews[category] || reviews["Coverage"];
    let reviewSet;
    
    if (rating >= 4.5) {
        reviewSet = categoryReviews.excellent;
    } else {
        reviewSet = categoryReviews.veryGood;
    }
    
    return reviewSet[Math.floor(Math.random() * reviewSet.length)];
}

// Generate positive entries for a state
function generatePositiveEntries(stateName, stateInfo, numEntries = 200) {
    const entries = [];
    const counties = stateInfo.counties || [];
    
    // If no counties, create default county structure
    let countyList = counties;
    if (counties.length === 0) {
        countyList = [
            { name: `${stateName} County`, city: stateName, averageRating: stateInfo.averageRating || 4.5 },
            { name: `Central ${stateName} County`, city: `Central ${stateName}`, averageRating: (stateInfo.averageRating || 4.5) + 0.1 },
            { name: `Northern ${stateName} County`, city: `Northern ${stateName}`, averageRating: (stateInfo.averageRating || 4.5) + 0.2 },
            { name: `Southern ${stateName} County`, city: `Southern ${stateName}`, averageRating: (stateInfo.averageRating || 4.5) + 0.1 },
            { name: `Eastern ${stateName} County`, city: `Eastern ${stateName}`, averageRating: (stateInfo.averageRating || 4.5) + 0.15 }
        ];
    }
    
    // Distribute entries across counties (weighted by county size/population simulation)
    const countyWeights = countyList.map((county, index) => {
        return Math.max(1, Math.floor((countyList.length - index) * 0.3 + 1));
    });
    const totalWeight = countyWeights.reduce((sum, w) => sum + w, 0);
    
    let entryIndex = existingEntries.length;
    countyList.forEach((county, countyIndex) => {
        const countyEntries = Math.floor((countyWeights[countyIndex] / totalWeight) * numEntries);
        const countyBaseRating = county.averageRating || stateInfo.averageRating || 4.5;
        
        for (let i = 0; i < countyEntries && entryIndex < existingEntries.length + numEntries; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            
            // Generate positive rating (4.0 to 5.0)
            const ratingVariation = Math.random() * 0.5; // 0 to 0.5
            const basePositiveRating = Math.max(4.0, countyBaseRating - 0.3); // Ensure at least 4.0
            const rating = Math.min(5.0, Math.round((basePositiveRating + ratingVariation) * 2) / 2);
            
            // Generate date within last 6 months
            const daysAgo = Math.floor(Math.random() * 180);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            // Generate satisfaction score (80-100 for positive feedback)
            const score = Math.round(80 + (rating - 4.0) * 20); // 80-100 range
            
            // Select category
            const category = categories[Math.floor(Math.random() * categories.length)];
            
            // Generate positive review text
            const reviewText = generatePositiveReview(rating, category);
            
            // Determine location format
            const stateAbbr = stateAbbreviations[stateName] || stateName.substring(0, 2).toUpperCase();
            const location = county.city ? `${county.city}, ${stateAbbr}` : `${stateName}`;
            
            entries.push({
                id: `${stateName.toLowerCase().replace(/\s+/g, '-')}-positive-${entryIndex + 1}`,
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
                verified: Math.random() > 0.2, // 80% verified for positive feedback
                countyContact: county.contact || null
            });
            
            entryIndex++;
        }
    });
    
    // Fill remaining entries if needed
    while (entryIndex < existingEntries.length + numEntries) {
        const county = countyList[Math.floor(Math.random() * countyList.length)];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        const countyBaseRating = county.averageRating || stateInfo.averageRating || 4.5;
        const basePositiveRating = Math.max(4.0, countyBaseRating - 0.3);
        const ratingVariation = Math.random() * 0.5;
        const rating = Math.min(5.0, Math.round((basePositiveRating + ratingVariation) * 2) / 2);
        
        const daysAgo = Math.floor(Math.random() * 180);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        const score = Math.round(80 + (rating - 4.0) * 20);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const reviewText = generatePositiveReview(rating, category);
        const location = county.city ? `${county.city}, ${stateName.substring(0, 2).toUpperCase()}` : `${stateName}`;
        
        entries.push({
            id: `${stateName.toLowerCase().replace(/\s+/g, '-')}-positive-${entryIndex + 1}`,
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
            verified: Math.random() > 0.2,
            countyContact: county.contact || null
        });
        
        entryIndex++;
    }
    
    return entries;
}

// Generate positive feedback for all states
const allPositiveEntries = [];
const allEntries = [...existingEntries];

Object.keys(stateData).forEach(stateName => {
    const state = stateData[stateName];
    const positiveEntries = generatePositiveEntries(stateName, state, 200);
    allPositiveEntries.push(...positiveEntries);
    allEntries.push(...positiveEntries);
});

// Save all entries in a single file
const allEntriesData = {
    success: true,
    entries: allEntries,
    total: allEntries.length,
    states: Object.keys(stateData).length,
    positiveEntries: allPositiveEntries.length,
    existingEntries: existingEntries.length,
    generatedAt: new Date().toISOString()
};

// Ensure api directory exists
if (!fs.existsSync(path.join(__dirname, 'api'))) {
    fs.mkdirSync(path.join(__dirname, 'api'), { recursive: true });
}

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
const positiveCount = allEntries.filter(e => e.rating >= 4.0).length;

console.log('✅ Generated positive feedback data');
console.log(`📊 Total entries: ${totalEntries.toLocaleString()}`);
console.log(`   - Existing entries: ${existingEntries.length.toLocaleString()}`);
console.log(`   - New positive entries: ${allPositiveEntries.length.toLocaleString()}`);
console.log(`📈 Average rating: ${avgRating.toFixed(2)}`);
console.log(`📈 Average score: ${avgScore.toFixed(2)}`);
console.log(`✓ Verified entries: ${verifiedCount.toLocaleString()} (${((verifiedCount/totalEntries)*100).toFixed(1)}%)`);
console.log(`⭐ Positive entries (4+ stars): ${positiveCount.toLocaleString()} (${((positiveCount/totalEntries)*100).toFixed(1)}%)`);
console.log(`🗺️  States covered: ${Object.keys(stateData).length}`);
console.log(`📁 File saved: api/entries-all.json`);

