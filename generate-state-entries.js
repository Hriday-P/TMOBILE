const fs = require('fs');
const path = require('path');

// Load existing state data
const stateData = JSON.parse(fs.readFileSync(path.join(__dirname, 'state-data.json'), 'utf8'));

// Cities for each state (sample data)
const stateCities = {
    "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "Oakland", "Fresno", "Long Beach", "San Jose"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi"],
    "New York": ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse", "Yonkers", "Utica", "White Plains"],
    "Florida": ["Miami", "Tampa", "Orlando", "Jacksonville", "Tallahassee", "Fort Lauderdale", "St. Petersburg", "Pensacola"],
    "Illinois": ["Chicago", "Aurora", "Rockford", "Joliet", "Naperville", "Springfield", "Peoria", "Elgin"],
    "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster"],
    "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton"],
    "Georgia": ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Sandy Springs", "Roswell", "Macon"],
    "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington"],
    "Michigan": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn"]
};

// Generate random entries for a state
function generateEntries(stateName, baseRating, numEntries = 150) {
    const entries = [];
    const cities = stateCities[stateName] || ["City A", "City B", "City C"];
    const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Christopher", "Karen"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee"];
    
    for (let i = 0; i < numEntries; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        
        // Generate rating with some variation around base rating
        const ratingVariation = (Math.random() - 0.5) * 1.5;
        const rating = Math.max(1, Math.min(5, Math.round((baseRating + ratingVariation) * 2) / 2));
        
        // Generate date within last 6 months
        const daysAgo = Math.floor(Math.random() * 180);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        // Generate satisfaction score (0-100)
        const score = Math.round(rating * 20);
        
        // Generate review text based on rating
        let reviewText = "";
        if (rating >= 4.5) {
            reviewText = "Excellent service! T-Mobile has been amazing. Great coverage and customer support.";
        } else if (rating >= 4.0) {
            reviewText = "Very satisfied with T-Mobile. Good coverage and reasonable prices.";
        } else if (rating >= 3.5) {
            reviewText = "Decent service overall. Some areas could use better coverage but generally good.";
        } else if (rating >= 3.0) {
            reviewText = "Service is okay. Had some issues but customer support helped resolve them.";
        } else {
            reviewText = "Service needs improvement. Experienced some connectivity issues.";
        }
        
        entries.push({
            id: `${stateName.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
            customerName: `${firstName} ${lastName.charAt(0)}.`,
            location: `${city}, ${stateName.substring(0, 2).toUpperCase()}`,
            rating: rating,
            score: score,
            review: reviewText,
            date: date.toISOString(),
            category: ["Coverage", "Price", "Customer Service", "Network Speed", "Reliability"][Math.floor(Math.random() * 5)],
            verified: Math.random() > 0.3 // 70% verified
        });
    }
    
    return entries;
}

// Generate comprehensive data structure
const comprehensiveData = {};

Object.keys(stateData).forEach(stateName => {
    const state = stateData[stateName];
    const numEntries = 100 + Math.floor(Math.random() * 100); // 100-200 entries
    
    comprehensiveData[stateName] = {
        ...state,
        entries: generateEntries(stateName, state.averageRating, numEntries),
        totalEntries: numEntries,
        lastUpdated: new Date().toISOString()
    };
});

// Save to new file
fs.writeFileSync(
    path.join(__dirname, 'state-entries-data.json'),
    JSON.stringify(comprehensiveData, null, 2),
    'utf8'
);

console.log(`✅ Generated comprehensive data for ${Object.keys(comprehensiveData).length} states`);
console.log(`📊 Total entries: ${Object.values(comprehensiveData).reduce((sum, state) => sum + state.totalEntries, 0)}`);

