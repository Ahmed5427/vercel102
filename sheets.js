// Google Sheets API Configuration
const SPREADSHEET_ID = '1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk';
const API_KEY = 'AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A';
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Load settings from Google Sheets
async function loadSettings() {
    try {
        const range = 'Settings!A:G';
        const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            // Skip header row
            const settings = data.values.slice(1);
            return processSettings(settings);
        }
        
        return null;
    } catch (error) {
        console.error('Error loading settings:', error);
        return null;
    }
}

// Process settings data
function processSettings(settings) {
    const processed = {
        letterTypes: [],
        purposes: [],
        styles: []
    };
    
    settings.forEach(row => {
        if (row[1]) processed.letterTypes.push(row[1]); // Column B
        if (row[2]) processed.purposes.push(row[2]); // Column C
        if (row[6]) processed.styles.push(row[6]); // Column G
    });
    
    // Remove duplicates
    processed.letterTypes = [...new Set(processed.letterTypes)];
    processed.purposes = [...new Set(processed.purposes)];
    processed.styles = [...new Set(processed.styles)];
    
    return processed;
}

// Load submissions data
async function loadSubmissionsData() {
    try {
        const range = 'Submissions!A:K';
        const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            // Skip header row
            const submissions = data.values.slice(1);
            return processSubmissions(submissions);
        }
        
        return [];
    } catch (error) {
        console.error('Error loading submissions:', error);
        return [];
    }
}

// Process submissions data
function processSubmissions(submissions) {
    return submissions.map(row => ({
        id: row[0] || '',
        date: row[1] || '',
        type: row[3] || '',
        recipient: row[4] || '',
        subject: row[5] || '',
        reviewStatus: row[9] || 'في الانتظار',
        sendStatus: row[10] || 'في الانتظار'
    }));
}

// Populate dropdowns on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('letterType')) {
        const settings = await loadSettings();
        
        if (settings) {
            // Populate letter type dropdown
            const letterTypeSelect = document.getElementById('letterType');
            settings.letterTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                letterTypeSelect.appendChild(option);
            });
            
            // Populate purpose dropdown
            const purposeSelect = document.getElementById('letterPurpose');
            settings.purposes.forEach(purpose => {
                const option = document.createElement('option');
                option.value = purpose;
                option.textContent = purpose;
                purposeSelect.appendChild(option);
            });
            
            // Populate style dropdown
            const styleSelect = document.getElementById('letterStyle');
            settings.styles.forEach(style => {
                const option = document.createElement('option');
                option.value = style;
                option.textContent = style;
                styleSelect.appendChild(option);
            });
        }
    }
});