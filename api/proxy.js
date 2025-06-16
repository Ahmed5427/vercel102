// Vercel serverless function to proxy API calls
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
                },
                // Add agent for self-signed certificates
                agent: new (await import('https')).Agent({
                    rejectUnauthorized: false
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API call failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            res.status(200).json(result);
            
        } else {
            // Handle JSON requests (for generate-letter)
            let requestData;
            try {
                requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            } catch (parseError) {
                res.status(400).json({ error: 'Invalid JSON in request body' });
                return;
            }
            
            const { endpoint, data } = requestData;
            
            let targetUrl;
            if (endpoint === 'generate-letter') {
                targetUrl = `${API_BASE_URL}/generate-letter`;
            } else {
                res.status(400).json({ error: 'Invalid endpoint' });
                return;
            }
            
            // Use dynamic import for https module
            const https = await import('https');
            
            // Make the API call with relaxed SSL verification
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                // Add agent for self-signed certificates
                agent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API call failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            res.status(200).json(result);
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
