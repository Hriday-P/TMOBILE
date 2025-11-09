const fs = require('fs');
const path = require('path');

// Load existing state data
const stateData = JSON.parse(fs.readFileSync(path.join(__dirname, 'state-data.json'), 'utf8'));

// Sample counties for each state with contact information
const stateCounties = {
    "California": [
        { name: "Los Angeles County", city: "Los Angeles", contact: { name: "Sarah Martinez", title: "Regional Director", email: "sarah.martinez@t-mobile.com", phone: "(310) 555-0123" } },
        { name: "San Diego County", city: "San Diego", contact: { name: "Michael Chen", title: "Regional Director", email: "michael.chen@t-mobile.com", phone: "(619) 555-0145" } },
        { name: "Orange County", city: "Santa Ana", contact: { name: "Jennifer Lee", title: "Regional Director", email: "jennifer.lee@t-mobile.com", phone: "(714) 555-0167" } },
        { name: "Riverside County", city: "Riverside", contact: { name: "David Kim", title: "Regional Director", email: "david.kim@t-mobile.com", phone: "(951) 555-0189" } },
        { name: "San Bernardino County", city: "San Bernardino", contact: { name: "Amanda Rodriguez", title: "Regional Director", email: "amanda.rodriguez@t-mobile.com", phone: "(909) 555-0201" } }
    ],
    "Texas": [
        { name: "Harris County", city: "Houston", contact: { name: "Robert Johnson", title: "Regional Director", email: "robert.johnson@t-mobile.com", phone: "(713) 555-0123" } },
        { name: "Dallas County", city: "Dallas", contact: { name: "Lisa Williams", title: "Regional Director", email: "lisa.williams@t-mobile.com", phone: "(214) 555-0145" } },
        { name: "Tarrant County", city: "Fort Worth", contact: { name: "James Brown", title: "Regional Director", email: "james.brown@t-mobile.com", phone: "(817) 555-0167" } },
        { name: "Travis County", city: "Austin", contact: { name: "Patricia Davis", title: "Regional Director", email: "patricia.davis@t-mobile.com", phone: "(512) 555-0189" } },
        { name: "Bexar County", city: "San Antonio", contact: { name: "Christopher Miller", title: "Regional Director", email: "christopher.miller@t-mobile.com", phone: "(210) 555-0201" } }
    ],
    "New York": [
        { name: "New York County", city: "New York City", contact: { name: "Maria Garcia", title: "Regional Director", email: "maria.garcia@t-mobile.com", phone: "(212) 555-0123" } },
        { name: "Kings County", city: "Brooklyn", contact: { name: "Daniel Martinez", title: "Regional Director", email: "daniel.martinez@t-mobile.com", phone: "(718) 555-0145" } },
        { name: "Queens County", city: "Queens", contact: { name: "Elizabeth Anderson", title: "Regional Director", email: "elizabeth.anderson@t-mobile.com", phone: "(718) 555-0167" } },
        { name: "Erie County", city: "Buffalo", contact: { name: "Thomas Wilson", title: "Regional Director", email: "thomas.wilson@t-mobile.com", phone: "(716) 555-0189" } },
        { name: "Monroe County", city: "Rochester", contact: { name: "Nancy Moore", title: "Regional Director", email: "nancy.moore@t-mobile.com", phone: "(585) 555-0201" } }
    ]
};

// Generate county data for all states
function generateCountyData(stateName, baseRating) {
    // Get counties for state or generate default ones
    let counties = stateCounties[stateName];
    
    if (!counties) {
        // Generate default counties for states not in the list
        const defaultCityNames = ["Main City", "Second City", "Third City", "Fourth City", "Fifth City"];
        counties = defaultCityNames.map((city, index) => ({
            name: `${city} County`,
            city: city,
            contact: {
                name: `Regional Director ${index + 1}`,
                title: "Regional Director",
                email: `director${index + 1}.${stateName.toLowerCase().replace(/\s+/g, '')}@t-mobile.com`,
                phone: `(${String(100 + index).padStart(3, '0')}) 555-${String(1000 + index).padStart(4, '0')}`
            }
        }));
    }
    
    // Generate ratings for each county with variation
    return counties.map(county => {
        const ratingVariation = (Math.random() - 0.5) * 1.2;
        const countyRating = Math.max(2.5, Math.min(5.0, baseRating + ratingVariation));
        const countyScore = Math.round(countyRating * 20);
        
        return {
            ...county,
            averageRating: parseFloat(countyRating.toFixed(2)),
            averageScore: countyScore,
            stars: Math.round(countyRating)
        };
    });
}

// Update state data with county information
const updatedStateData = {};

Object.keys(stateData).forEach(stateName => {
    const state = stateData[stateName];
    const counties = generateCountyData(stateName, state.averageRating);
    
    // Sort counties by rating to find highest and lowest
    const sortedCounties = [...counties].sort((a, b) => b.averageRating - a.averageRating);
    const highestCounty = sortedCounties[0];
    const lowestCounty = sortedCounties[sortedCounties.length - 1];
    
    updatedStateData[stateName] = {
        ...state,
        counties: counties,
        highestCounty: {
            name: highestCounty.name,
            city: highestCounty.city,
            averageRating: highestCounty.averageRating,
            averageScore: highestCounty.averageScore,
            stars: highestCounty.stars,
            contact: highestCounty.contact
        },
        lowestCounty: {
            name: lowestCounty.name,
            city: lowestCounty.city,
            averageRating: lowestCounty.averageRating,
            averageScore: lowestCounty.averageScore,
            stars: lowestCounty.stars,
            contact: lowestCounty.contact
        }
    };
});

// Save updated state data
fs.writeFileSync(
    path.join(__dirname, 'state-data.json'),
    JSON.stringify(updatedStateData, null, 2),
    'utf8'
);

console.log(`✅ Updated state data with county information for ${Object.keys(updatedStateData).length} states`);

