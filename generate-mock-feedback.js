const fs = require('fs');
const path = require('path');

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

// Categories
const categories = ["Coverage", "Price", "Customer Service", "Network Speed", "Reliability"];

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

// States with major cities and counties
const statesData = {
    "Alabama": { cities: ["Birmingham", "Montgomery", "Mobile", "Huntsville"], counties: ["Jefferson County", "Montgomery County", "Mobile County", "Madison County"] },
    "Alaska": { cities: ["Anchorage", "Fairbanks", "Juneau"], counties: ["Anchorage Municipality", "Fairbanks North Star Borough", "Juneau City and Borough"] },
    "Arizona": { cities: ["Phoenix", "Tucson", "Mesa", "Chandler"], counties: ["Maricopa County", "Pima County", "Maricopa County", "Maricopa County"] },
    "Arkansas": { cities: ["Little Rock", "Fort Smith", "Fayetteville"], counties: ["Pulaski County", "Sebastian County", "Washington County"] },
    "California": { cities: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland"], counties: ["Los Angeles County", "San Diego County", "Santa Clara County", "San Francisco County", "Fresno County", "Sacramento County", "Los Angeles County", "Alameda County"] },
    "Colorado": { cities: ["Denver", "Colorado Springs", "Aurora"], counties: ["Denver County", "El Paso County", "Arapahoe County"] },
    "Connecticut": { cities: ["Bridgeport", "New Haven", "Hartford"], counties: ["Fairfield County", "New Haven County", "Hartford County"] },
    "Delaware": { cities: ["Wilmington", "Dover", "Newark"], counties: ["New Castle County", "Kent County", "New Castle County"] },
    "Florida": { cities: ["Jacksonville", "Miami", "Tampa", "Orlando"], counties: ["Duval County", "Miami-Dade County", "Hillsborough County", "Orange County"] },
    "Georgia": { cities: ["Atlanta", "Augusta", "Columbus"], counties: ["Fulton County", "Richmond County", "Muscogee County"] },
    "Hawaii": { cities: ["Honolulu", "Hilo", "Kailua"], counties: ["Honolulu County", "Hawaii County", "Honolulu County"] },
    "Idaho": { cities: ["Boise", "Nampa", "Meridian"], counties: ["Ada County", "Canyon County", "Ada County"] },
    "Illinois": { cities: ["Chicago", "Aurora", "Naperville"], counties: ["Cook County", "Kane County", "DuPage County"] },
    "Indiana": { cities: ["Indianapolis", "Fort Wayne", "Evansville"], counties: ["Marion County", "Allen County", "Vanderburgh County"] },
    "Iowa": { cities: ["Des Moines", "Cedar Rapids", "Davenport"], counties: ["Polk County", "Linn County", "Scott County"] },
    "Kansas": { cities: ["Wichita", "Overland Park", "Kansas City"], counties: ["Sedgwick County", "Johnson County", "Wyandotte County"] },
    "Kentucky": { cities: ["Louisville", "Lexington", "Bowling Green"], counties: ["Jefferson County", "Fayette County", "Warren County"] },
    "Louisiana": { cities: ["New Orleans", "Baton Rouge", "Shreveport"], counties: ["Orleans Parish", "East Baton Rouge Parish", "Caddo Parish"] },
    "Maine": { cities: ["Portland", "Lewiston", "Bangor"], counties: ["Cumberland County", "Androscoggin County", "Penobscot County"] },
    "Maryland": { cities: ["Baltimore", "Frederick", "Rockville"], counties: ["Baltimore City", "Frederick County", "Montgomery County"] },
    "Massachusetts": { cities: ["Boston", "Worcester", "Springfield"], counties: ["Suffolk County", "Worcester County", "Hampden County"] },
    "Michigan": { cities: ["Detroit", "Grand Rapids", "Warren"], counties: ["Wayne County", "Kent County", "Macomb County"] },
    "Minnesota": { cities: ["Minneapolis", "Saint Paul", "Rochester"], counties: ["Hennepin County", "Ramsey County", "Olmsted County"] },
    "Mississippi": { cities: ["Jackson", "Gulfport", "Southaven"], counties: ["Hinds County", "Harrison County", "DeSoto County"] },
    "Missouri": { cities: ["Kansas City", "Saint Louis", "Springfield"], counties: ["Jackson County", "St. Louis City", "Greene County"] },
    "Montana": { cities: ["Billings", "Missoula", "Great Falls"], counties: ["Yellowstone County", "Missoula County", "Cascade County"] },
    "Nebraska": { cities: ["Omaha", "Lincoln", "Bellevue"], counties: ["Douglas County", "Lancaster County", "Sarpy County"] },
    "Nevada": { cities: ["Las Vegas", "Henderson", "Reno"], counties: ["Clark County", "Clark County", "Washoe County"] },
    "New Hampshire": { cities: ["Manchester", "Nashua", "Concord"], counties: ["Hillsborough County", "Hillsborough County", "Merrimack County"] },
    "New Jersey": { cities: ["Newark", "Jersey City", "Paterson"], counties: ["Essex County", "Hudson County", "Passaic County"] },
    "New Mexico": { cities: ["Albuquerque", "Las Cruces", "Rio Rancho"], counties: ["Bernalillo County", "Dona Ana County", "Sandoval County"] },
    "New York": { cities: ["New York", "Buffalo", "Rochester"], counties: ["New York County", "Erie County", "Monroe County"] },
    "North Carolina": { cities: ["Charlotte", "Raleigh", "Greensboro"], counties: ["Mecklenburg County", "Wake County", "Guilford County"] },
    "North Dakota": { cities: ["Fargo", "Bismarck", "Grand Forks"], counties: ["Cass County", "Burleigh County", "Grand Forks County"] },
    "Ohio": { cities: ["Columbus", "Cleveland", "Cincinnati"], counties: ["Franklin County", "Cuyahoga County", "Hamilton County"] },
    "Oklahoma": { cities: ["Oklahoma City", "Tulsa", "Norman"], counties: ["Oklahoma County", "Tulsa County", "Cleveland County"] },
    "Oregon": { cities: ["Portland", "Eugene", "Salem"], counties: ["Multnomah County", "Lane County", "Marion County"] },
    "Pennsylvania": { cities: ["Philadelphia", "Pittsburgh", "Allentown"], counties: ["Philadelphia County", "Allegheny County", "Lehigh County"] },
    "Rhode Island": { cities: ["Providence", "Warwick", "Cranston"], counties: ["Providence County", "Kent County", "Providence County"] },
    "South Carolina": { cities: ["Charleston", "Columbia", "North Charleston"], counties: ["Charleston County", "Richland County", "Charleston County"] },
    "South Dakota": { cities: ["Sioux Falls", "Rapid City", "Aberdeen"], counties: ["Minnehaha County", "Pennington County", "Brown County"] },
    "Tennessee": { cities: ["Nashville", "Memphis", "Knoxville"], counties: ["Davidson County", "Shelby County", "Knox County"] },
    "Texas": { cities: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso"], counties: ["Harris County", "Bexar County", "Dallas County", "Travis County", "Tarrant County", "El Paso County"] },
    "Utah": { cities: ["Salt Lake City", "West Valley City", "Provo"], counties: ["Salt Lake County", "Salt Lake County", "Utah County"] },
    "Vermont": { cities: ["Burlington", "Essex", "South Burlington"], counties: ["Chittenden County", "Chittenden County", "Chittenden County"] },
    "Virginia": { cities: ["Virginia Beach", "Norfolk", "Richmond"], counties: ["Virginia Beach City", "Norfolk City", "Richmond City"] },
    "Washington": { cities: ["Seattle", "Spokane", "Tacoma"], counties: ["King County", "Spokane County", "Pierce County"] },
    "West Virginia": { cities: ["Charleston", "Huntington", "Parkersburg"], counties: ["Kanawha County", "Cabell County", "Wood County"] },
    "Wisconsin": { cities: ["Milwaukee", "Madison", "Green Bay"], counties: ["Milwaukee County", "Dane County", "Brown County"] },
    "Wyoming": { cities: ["Cheyenne", "Casper", "Laramie"], counties: ["Laramie County", "Natrona County", "Albany County"] },
    "District of Columbia": { cities: ["Washington"], counties: ["District of Columbia"] }
};

// Review templates by category and rating
const reviewTemplates = {
    "Coverage": {
        excellent: [
            "Outstanding coverage everywhere I go. Never have any dropped calls!",
            "Best coverage I've ever experienced. Works perfectly in all areas.",
            "Excellent signal strength. Can't believe how reliable it is.",
            "Amazing coverage! Works great even in remote areas.",
            "Perfect coverage throughout my entire area. Very impressed!"
        ],
        good: [
            "Great coverage overall. Very reliable service.",
            "Good coverage in most areas. Very satisfied.",
            "Coverage is excellent. No complaints at all.",
            "Reliable coverage everywhere I need it.",
            "Strong signal and great coverage quality."
        ],
        average: [
            "Coverage is decent but could be better in some areas.",
            "Generally good coverage with occasional dead zones.",
            "Coverage works well in most places.",
            "Average coverage. Works in urban areas but struggles in rural.",
            "Coverage is okay but not exceptional."
        ],
        poor: [
            "Poor coverage in many areas. Frequent dropped calls.",
            "Coverage is terrible. Can't make calls from home.",
            "Very disappointed with coverage quality.",
            "Many dead zones. Coverage is inconsistent.",
            "Worst coverage I've ever had. Can't make calls from my home."
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
        good: [
            "Fair pricing for quality service. Good value.",
            "Reasonable prices with great features.",
            "Good pricing structure. Worth every penny.",
            "Affordable plans with excellent service.",
            "Great value for the price. Very pleased!"
        ],
        average: [
            "Prices are reasonable but could be better.",
            "Decent pricing for what you get.",
            "Fair pricing overall.",
            "Prices are okay but not the best.",
            "Average pricing. Could be more competitive."
        ],
        poor: [
            "Too expensive for what you get.",
            "Billing errors every month. Very frustrating.",
            "Overpriced compared to competitors.",
            "Billing department is a nightmare. Overcharged multiple times.",
            "Billing issues persist. Multiple calls haven't resolved the problem."
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
        good: [
            "Great customer service. Always helpful when needed.",
            "Good support team. Quick to resolve any issues.",
            "Professional and friendly customer service.",
            "Reliable customer support. Very satisfied.",
            "Helpful service representatives. Good experience."
        ],
        average: [
            "Customer service is okay. Sometimes helpful.",
            "Average customer support. Could be better.",
            "Service is decent but not exceptional.",
            "Customer service is average. Could be more proactive.",
            "Sometimes helpful, sometimes not."
        ],
        poor: [
            "Terrible customer service. Unhelpful and rude.",
            "Customer support is awful. Long wait times.",
            "Very poor customer service experience.",
            "Customer service is awful. Long wait times and unhelpful representatives.",
            "Terrible customer service. Waited on hold for hours with no resolution."
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
        good: [
            "Fast and reliable network speeds. Very good!",
            "Good data speeds. Works well for all my needs.",
            "Quick network performance. Very satisfied.",
            "Fast speeds for streaming and browsing.",
            "Reliable high-speed network. Great experience!"
        ],
        average: [
            "Speeds are decent but could be faster.",
            "Network speed is okay for most tasks.",
            "Average speeds, works for basic use.",
            "Network speeds are decent. Works well for most applications.",
            "Speeds fluctuate. Sometimes fast, sometimes slow."
        ],
        poor: [
            "Very slow network speeds. Can't stream videos.",
            "Terrible data speeds. Almost unusable.",
            "Network is extremely slow.",
            "Data speeds are too slow. Can't stream videos properly.",
            "Network speeds are terrible. Can't use my phone for work."
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
        good: [
            "Very reliable service. Consistent performance.",
            "Good reliability. Works well most of the time.",
            "Dependable service. Very satisfied.",
            "Reliable network. Good overall experience.",
            "Consistent and reliable. Great service!"
        ],
        average: [
            "Generally reliable with occasional issues.",
            "Reliability is okay but not perfect.",
            "Service is mostly reliable.",
            "Service is mostly reliable. Occasional issues but generally good.",
            "Reliability is good but could be better."
        ],
        poor: [
            "Unreliable service. Frequent outages.",
            "Very unreliable. Constant problems.",
            "Service reliability is terrible.",
            "Very unreliable service. Frequent outages and connection problems.",
            "Service reliability is terrible. Constant problems and outages."
        ]
    }
};

function getReviewText(rating, category) {
    const templates = reviewTemplates[category];
    let quality;
    
    if (rating >= 4.5) {
        quality = "excellent";
    } else if (rating >= 3.5) {
        quality = "good";
    } else if (rating >= 2.5) {
        quality = "average";
    } else {
        quality = "poor";
    }
    
    const reviewList = templates[quality] || templates["average"];
    return reviewList[Math.floor(Math.random() * reviewList.length)];
}

function generateCountyContact(stateName, countyName) {
    const firstNames = ["Sarah", "Michael", "David", "Jennifer", "Robert", "Lisa", "James", "Patricia", "John", "Linda"];
    const lastNames = ["Martinez", "Johnson", "Chen", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 10000);
    
    return {
        name: `${firstName} ${lastName}`,
        title: "Regional Director",
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@t-mobile.com`,
        phone: `(${areaCode}) ${exchange}-${String(number).padStart(4, '0')}`
    };
}

function generateMockFeedback() {
    const entries = [];
    const numEntries = 11000; // Generate 11,000 entries
    
    const states = Object.keys(statesData);
    const entriesPerState = Math.floor(numEntries / states.length);
    
    let entryId = 1;
    
    states.forEach(stateName => {
        const stateInfo = statesData[stateName];
        const cities = stateInfo.cities || [stateName];
        const counties = stateInfo.counties || [`${stateName} County`];
        
        // Generate entries for this state
        for (let i = 0; i < entriesPerState; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const cityIndex = Math.floor(Math.random() * cities.length);
            const city = cities[cityIndex];
            const county = counties[cityIndex] || counties[0] || `${stateName} County`;
            
            // Generate rating (weighted towards positive but with variety)
            const rand = Math.random();
            let rating;
            if (rand < 0.6) {
                // 60% positive (4.0-5.0)
                rating = Math.round((4.0 + Math.random() * 1.0) * 2) / 2;
            } else if (rand < 0.85) {
                // 25% neutral (3.0-3.9)
                rating = Math.round((3.0 + Math.random() * 0.9) * 2) / 2;
            } else {
                // 15% negative (1.0-2.9)
                rating = Math.round((1.0 + Math.random() * 1.9) * 2) / 2;
            }
            
            // Generate score based on rating
            const score = Math.round(20 + (rating - 1.0) * 20); // Scale 1.0-5.0 to 20-100
            
            // Select category
            const category = categories[Math.floor(Math.random() * categories.length)];
            
            // Generate review text
            const review = getReviewText(rating, category);
            
            // Generate date (last 6 months)
            const daysAgo = Math.floor(Math.random() * 180);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            // Verified status (80% verified for positive, 50% for negative)
            const verified = rating >= 4.0 ? Math.random() > 0.2 : Math.random() > 0.5;
            
            // Generate county contact
            const countyContact = generateCountyContact(stateName, county);
            
            // Location format
            const stateAbbr = stateAbbreviations[stateName] || stateName.substring(0, 2).toUpperCase();
            const location = `${city}, ${stateAbbr}`;
            
            entries.push({
                id: `mock-${entryId}`,
                customerName: `${firstName} ${lastName.charAt(0)}.`,
                location: location,
                state: stateName,
                county: county,
                city: city,
                rating: rating,
                score: score,
                review: review,
                date: date.toISOString().split('T')[0],
                category: category,
                verified: verified,
                countyContact: countyContact
            });
            
            entryId++;
        }
    });
    
    // Fill remaining entries to reach exactly 11,000
    while (entries.length < numEntries) {
        const stateName = states[Math.floor(Math.random() * states.length)];
        const stateInfo = statesData[stateName];
        const cities = stateInfo.cities || [stateName];
        const counties = stateInfo.counties || [`${stateName} County`];
        const cityIndex = Math.floor(Math.random() * cities.length);
        const city = cities[cityIndex];
        const county = counties[cityIndex] || counties[0] || `${stateName} County`;
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        const rand = Math.random();
        let rating;
        if (rand < 0.6) {
            rating = Math.round((4.0 + Math.random() * 1.0) * 2) / 2;
        } else if (rand < 0.85) {
            rating = Math.round((3.0 + Math.random() * 0.9) * 2) / 2;
        } else {
            rating = Math.round((1.0 + Math.random() * 1.9) * 2) / 2;
        }
        
        const score = Math.round(20 + (rating - 1.0) * 20);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const review = getReviewText(rating, category);
        
        const daysAgo = Math.floor(Math.random() * 180);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        const verified = rating >= 4.0 ? Math.random() > 0.2 : Math.random() > 0.5;
        const countyContact = generateCountyContact(stateName, county);
        const stateAbbr = stateAbbreviations[stateName] || stateName.substring(0, 2).toUpperCase();
        const location = `${city}, ${stateAbbr}`;
        
        entries.push({
            id: `mock-${entryId}`,
            customerName: `${firstName} ${lastName.charAt(0)}.`,
            location: location,
            state: stateName,
            county: county,
            city: city,
            rating: rating,
            score: score,
            review: review,
            date: date.toISOString().split('T')[0],
            category: category,
            verified: verified,
            countyContact: countyContact
        });
        
        entryId++;
    }
    
    return entries;
}

// Generate the mock feedback data
console.log('Generating 11,000 mock feedback entries...');
const mockFeedbackData = generateMockFeedback();

// Save to a JSON file
const outputPath = path.join(__dirname, 'mock-feedback-data.json');
fs.writeFileSync(outputPath, JSON.stringify(mockFeedbackData, null, 2), 'utf8');

console.log(`✅ Generated ${mockFeedbackData.length} mock feedback entries`);
console.log(`📁 Saved to: ${outputPath}`);

// Statistics
const states = [...new Set(mockFeedbackData.map(e => e.state))];
const avgRating = mockFeedbackData.reduce((sum, e) => sum + e.rating, 0) / mockFeedbackData.length;
const avgScore = mockFeedbackData.reduce((sum, e) => sum + e.score, 0) / mockFeedbackData.length;
const verifiedCount = mockFeedbackData.filter(e => e.verified).length;
const positiveCount = mockFeedbackData.filter(e => e.rating >= 4.0).length;

console.log(`\n📊 Statistics:`);
console.log(`   States covered: ${states.length}`);
console.log(`   Average rating: ${avgRating.toFixed(2)}`);
console.log(`   Average score: ${avgScore.toFixed(2)}`);
console.log(`   Verified entries: ${verifiedCount} (${((verifiedCount/mockFeedbackData.length)*100).toFixed(1)}%)`);
console.log(`   Positive entries (4+): ${positiveCount} (${((positiveCount/mockFeedbackData.length)*100).toFixed(1)}%)`);

