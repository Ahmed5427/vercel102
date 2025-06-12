// API Configuration
const API_BASE_URL = 'https://128.140.37.194:5000';

// Generate Letter API
async function generateLetter(formData) {
    const loader = document.getElementById('loader');
    loader.classList.add('active');
    
    try {
        // Prepare the payload
        const payload = {
            category: formData.get('category'),
            sub_category: formData.get('sub_category'),
            title: formData.get('title'),
            recipient: formData.get('recipient'),
            isFirst: formData.get('isFirst') === 'true',
            prompt: formData.get('prompt'),
            tone: formData.get('tone')
        };
        
        // Since we can't directly call HTTPS with self-signed cert from browser,
        // we'll use a proxy endpoint
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                endpoint: 'generate-letter',
                data: payload
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate letter');
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error generating letter:', error);
        alert('حدث خطأ أثناء إنشاء الخطاب. الرجاء المحاولة مرة أخرى.');
        return null;
    } finally {
        loader.classList.remove('active');
    }
}

// Archive Letter API
async function archiveLetter(letterData) {
    try {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                endpoint: 'archive-letter',
                data: letterData
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to archive letter');
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error archiving letter:', error);
        alert('حدث خطأ أثناء حفظ الخطاب. الرجاء المحاولة مرة أخرى.');
        return null;
    }
}

// Form submission handler
if (document.getElementById('letterForm')) {
    document.getElementById('letterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const result = await generateLetter(formData);
        
        if (result) {
            // Display the generated letter
            document.getElementById('letterPreview').value = result.Letter || 'محتوى الخطاب المُنشأ سيظهر هنا...';
            document.getElementById('previewSection').style.display = 'block';
            
            // Store the generated letter data
            window.generatedLetterData = result;
        }
    });
}

// Save button handler
if (document.getElementById('saveButton')) {
    document.getElementById('saveButton').addEventListener('click', async () => {
        const letterContent = document.getElementById('letterPreview').value;
        const selectedTemplate = document.querySelector('input[name="template"]:checked').value;
        
        // Prepare archive data
        const archiveData = {
            file: 'letter.pdf', // This would be generated based on template
            letter_content: letterContent,
            letter_type: document.getElementById('letterType').value,
            recipient: document.getElementById('recipient').value,
            title: document.getElementById('letterTitle').value,
            is_first: document.querySelector('input[name="isFirst"]:checked').value,
            ID: generateUniqueId()
        };
        
        const result = await archiveLetter(archiveData);
        
        if (result) {
            alert('تم حفظ الخطاب بنجاح!');
            window.location.href = '/';
        }
    });
}

// Generate unique ID
function generateUniqueId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
}
