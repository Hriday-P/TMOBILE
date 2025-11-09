const fs = require('fs');
const path = require('path');

// Target overall rating (4.15 = 83% satisfaction)
const TARGET_RATING = 4.15;

console.log('🔧 Adjusting customer satisfaction data...\n');

// 1. Adjust state-entries-data.json
console.log('📊 Adjusting state-entries-data.json...');
const stateDataPath = path.join(__dirname, 'state-entries-data.json');
const stateData = JSON.parse(fs.readFileSync(stateDataPath, 'utf8'));

let totalRatingSum = 0;
let totalEntriesCount = 0;

// Calculate current average
Object.keys(stateData).forEach(stateName => {
    const state = stateData[stateName];
    if (state && state.entries && state.entries.length > 0) {
        state.entries.forEach(entry => {
            totalRatingSum += entry.rating;
            totalEntriesCount++;
        });
    }
});

const currentAverage = totalRatingSum / totalEntriesCount;
const adjustmentFactor = TARGET_RATING / currentAverage;

console.log(`   Current average: ${currentAverage.toFixed(2)}`);
console.log(`   Target average: ${TARGET_RATING.toFixed(2)}`);
console.log(`   Adjustment factor: ${adjustmentFactor.toFixed(3)}`);

// Adjust all entries
let adjustedCount = 0;
Object.keys(stateData).forEach(stateName => {
    const state = stateData[stateName];
    if (state && state.entries && state.entries.length > 0) {
        state.entries.forEach(entry => {
            const newRating = Math.min(5.0, entry.rating * adjustmentFactor);
            entry.rating = parseFloat(newRating.toFixed(2));
            adjustedCount++;
        });
        
        // Recalculate state average
        const stateAvg = state.entries.reduce((sum, e) => sum + e.rating, 0) / state.entries.length;
        state.averageRating = parseFloat(stateAvg.toFixed(2));
        state.score = Math.round(stateAvg * 20);
        state.stars = Math.round(stateAvg);
    }
});

// Save adjusted data
fs.writeFileSync(stateDataPath, JSON.stringify(stateData, null, 2));
console.log(`   ✅ Adjusted ${adjustedCount} entries in state-entries-data.json\n`);

// 2. Adjust mock-feedback-data.json
console.log('📊 Adjusting mock-feedback-data.json...');
const mockFeedbackPath = path.join(__dirname, 'mock-feedback-data.json');
if (fs.existsSync(mockFeedbackPath)) {
    const mockData = JSON.parse(fs.readFileSync(mockFeedbackPath, 'utf8'));
    
    // Calculate current average
    const currentMockAvg = mockData.reduce((sum, e) => sum + e.rating, 0) / mockData.length;
    const mockAdjustmentFactor = TARGET_RATING / currentMockAvg;
    
    console.log(`   Current average: ${currentMockAvg.toFixed(2)}`);
    console.log(`   Target average: ${TARGET_RATING.toFixed(2)}`);
    console.log(`   Adjustment factor: ${mockAdjustmentFactor.toFixed(3)}`);
    
    // Adjust all entries
    mockData.forEach(entry => {
        const newRating = Math.min(5.0, entry.rating * mockAdjustmentFactor);
        entry.rating = parseFloat(newRating.toFixed(2));
        
        // Also adjust score if it exists
        if (entry.score !== undefined) {
            entry.score = Math.round(entry.rating * 20);
        }
    });
    
    // Save adjusted data
    fs.writeFileSync(mockFeedbackPath, JSON.stringify(mockData, null, 2));
    console.log(`   ✅ Adjusted ${mockData.length} entries in mock-feedback-data.json\n`);
} else {
    console.log('   ⚠️  mock-feedback-data.json not found, skipping...\n');
}

// 3. Check api/entries-all.json if it exists
console.log('📊 Checking api/entries-all.json...');
const entriesAllPath = path.join(__dirname, 'api', 'entries-all.json');
if (fs.existsSync(entriesAllPath)) {
    const entriesAllData = JSON.parse(fs.readFileSync(entriesAllPath, 'utf8'));
    
    // Check if it's an array or object with entries property
    let entriesAll = Array.isArray(entriesAllData) ? entriesAllData : (entriesAllData.entries || []);
    
    if (entriesAll.length > 0) {
        // Calculate current average
        const currentEntriesAvg = entriesAll.reduce((sum, e) => sum + e.rating, 0) / entriesAll.length;
        const entriesAdjustmentFactor = TARGET_RATING / currentEntriesAvg;
        
        console.log(`   Current average: ${currentEntriesAvg.toFixed(2)}`);
        console.log(`   Target average: ${TARGET_RATING.toFixed(2)}`);
        console.log(`   Adjustment factor: ${entriesAdjustmentFactor.toFixed(3)}`);
        
        // Adjust all entries
        entriesAll.forEach(entry => {
            const newRating = Math.min(5.0, entry.rating * entriesAdjustmentFactor);
            entry.rating = parseFloat(newRating.toFixed(2));
            
            // Also adjust score if it exists
            if (entry.score !== undefined) {
                entry.score = Math.round(entry.rating * 20);
            }
        });
        
        // Save adjusted data (preserve structure if it was an object)
        if (Array.isArray(entriesAllData)) {
            fs.writeFileSync(entriesAllPath, JSON.stringify(entriesAll, null, 2));
        } else {
            entriesAllData.entries = entriesAll;
            fs.writeFileSync(entriesAllPath, JSON.stringify(entriesAllData, null, 2));
        }
        console.log(`   ✅ Adjusted ${entriesAll.length} entries in api/entries-all.json\n`);
    } else {
        console.log('   ⚠️  No entries found in api/entries-all.json, skipping...\n');
    }
} else {
    console.log('   ⚠️  api/entries-all.json not found, skipping...\n');
}

// 4. Verify final averages
console.log('✅ Verification:');
console.log('   Calculating final averages...\n');

const finalStateData = JSON.parse(fs.readFileSync(stateDataPath, 'utf8'));
let finalTotalRatingSum = 0;
let finalTotalEntriesCount = 0;

Object.keys(finalStateData).forEach(stateName => {
    const state = finalStateData[stateName];
    if (state && state.entries && state.entries.length > 0) {
        state.entries.forEach(entry => {
            finalTotalRatingSum += entry.rating;
            finalTotalEntriesCount++;
        });
    }
});

const finalAverage = finalTotalRatingSum / finalTotalEntriesCount;
const finalScore = finalAverage * 20;

console.log(`   Final overall rating: ${finalAverage.toFixed(2)}`);
console.log(`   Final satisfaction score: ${finalScore.toFixed(1)}%`);
console.log(`   Total entries adjusted: ${finalTotalEntriesCount}`);
console.log(`\n🎉 Customer satisfaction adjusted successfully!`);

