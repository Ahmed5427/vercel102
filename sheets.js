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
        recipientTitles: [], // For "لقب المرسل إليه"
        styles: []
    };
    
    settings.forEach(row => {
        if (row[1]) processed.letterTypes.push(row[1]); // Column B
        if (row[2]) processed.recipientTitles.push(row[2]); // Column C
        if (row[6]) processed.styles.push(row[6]); // Column G
    });
    
    // Remove duplicates
    processed.letterTypes = [...new Set(processed.letterTypes)];
    processed.recipientTitles = [...new Set(processed.recipientTitles)];
    processed.styles = [...new Set(processed.styles)];
    
    return processed;
}

// Load submissions data
async function loadSubmissionsData() {
    try {
        const range = 'Submissions!A:N'; // Updated range to include columns M and N
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
        content: row[6] || '', // Column G
        reviewStatus: row[9] || 'في الانتظار',
        sendStatus: row[10] || 'في الانتظار',
        reviewerName: row[12] || '', // Column M
        reviewNotes: row[13] || '' // Column N
    }));
}

// Update review status in Google Sheets
async function updateReviewStatusInSheet(letterId, status, reviewerName, reviewNotes) {
    try {
        const submissions = await loadSubmissionsData();
        const rowIndex = submissions.findIndex(letter => letter.id === letterId) + 2; // +2 for header row and 0-based index
        
        if (rowIndex === 1) { // Letter not found
            console.error('Letter not found for update:', letterId);
            return;
        }

        // Prepare data for update (status in column J (index 9), reviewer name in M (index 12), notes in N (index 13))
        const values = [
            [status, '', '', reviewerName, reviewNotes] // J, K, L, M, N
        ];
        const range = `Submissions!J${rowIndex}:N${rowIndex}`;

        const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}&valueInputOption=USER_ENTERED`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Review status updated successfully!');
    } catch (error) {
        console.error('Error updating review status:', error);
    }
}

// Delete letter from Google Sheets
async function deleteLetterFromSheet(letterId) {
    try {
        const submissions = await loadSubmissionsData();
        const rowIndex = submissions.findIndex(letter => letter.id === letterId) + 2; // +2 for header row and 0-based index

        if (rowIndex === 1) { // Letter not found
            console.error('Letter not found for deletion:', letterId);
            return;
        }

        const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/Submissions!A${rowIndex}:N${rowIndex}:clear?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Letter deleted successfully!');
    } catch (error) {
        console.error('Error deleting letter:', error);
    }
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
            
            // Populate recipient title dropdown
            const recipientTitleSelect = document.getElementById('recipientTitle');
            if (recipientTitleSelect) {
                settings.recipientTitles.forEach(title => {
                    const option = document.createElement('option');
                    option.value = title;
                    option.textContent = title;
                    recipientTitleSelect.appendChild(option);
                });
                // Add the 'أخرى' option
                const otherOption = document.createElement('option');
                otherOption.value = 'أخرى';
                otherOption.textContent = 'أخرى';
                recipientTitleSelect.appendChild(otherOption);
            }
            
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
