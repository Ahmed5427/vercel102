// Simplified Vercel serverless function for testing
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        console.log('Proxy received request:', req.body);
        
        // Check if this is a FormData request (for archive-letter)
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('multipart/form-data')) {
            // For now, return a mock response for archiving
            res.status(200).json({
                message: "Letter archived successfully (mock)",
                id: "ARCHIVE-" + Date.now()
            });
            return;
        }
        
        // Handle JSON requests (for generate-letter)
        let requestData;
        try {
            requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (parseError) {
            res.status(400).json({ error: 'Invalid JSON in request body' });
            return;
        }
        
        const { endpoint, data } = requestData;
        
        if (endpoint === 'generate-letter') {
            // Return a mock response for testing
            const mockLetter = `
بسم الله الرحمن الرحيم

${data.recipient} المحترم/المحترمة

السلام عليكم ورحمة الله وبركاته

الموضوع: ${data.title}

${data.prompt}

نأمل منكم التكرم بالنظر في هذا الطلب والموافقة عليه في أقرب وقت ممكن.

وتفضلوا بقبول فائق الاحترام والتقدير.

مقدم الطلب
التاريخ: ${new Date().toLocaleDateString('ar-SA')}
            `.trim();
            
            res.status(200).json({
                Letter: mockLetter,
                ID: "MOCK-" + Date.now(),
                Date: new Date().toLocaleDateString('ar-SA'),
                Title: data.title || "خطاب تجريبي"
            });
        } else {
            res.status(400).json({ error: 'Invalid endpoint' });
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
};

