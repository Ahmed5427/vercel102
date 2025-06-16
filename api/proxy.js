export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const API_BASE_URL = 'https://128.140.37.194:5000';
        
        // Check if this is a FormData request (for archive-letter)
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('multipart/form-data')) {
            // Handle file upload for archive-letter
            const targetUrl = `${API_BASE_URL}/archive-letter`;
            
            // Forward the multipart request directly
            const response = await fetch(targetUrl, {
                method: 'POST',
                body: req.body,
                headers: {
                    'Content-Type': contentType,
                }
            });
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }
            
            const result = await response.json();
            res.status(200).json(result);
            
        } else {
            // Handle JSON requests (for generate-letter)
            const { endpoint, data } = req.body;
            
            let targetUrl;
            if (endpoint === 'generate-letter') {
                targetUrl = `${API_BASE_URL}/generate-letter`;
            } else {
                res.status(400).json({ error: 'Invalid endpoint' });
                return;
            }
            
            // Make the API call with relaxed SSL verification
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }
            
            const result = await response.json();
            res.status(200).json(result);
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
