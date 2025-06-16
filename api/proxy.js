const axios = require('axios');
const https = require('https');

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
        const API_BASE_URL = 'https://128.140.37.194:5000';
        
        // Create an HTTPS agent for self-signed certificates
        const agent = new https.Agent({
            rejectUnauthorized: false // Only for self-signed certificates
        });

        // Check if this is a FormData request (for archive-letter)
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('multipart/form-data')) {
            // Handle file upload for archive-letter
            const targetUrl = `${API_BASE_URL}/archive-letter`;
            
            try {
                // Axios handles FormData automatically when passed as body
                const response = await axios.post(targetUrl, req.body, {
                    headers: {
                        'Content-Type': contentType, // Ensure content-type is passed for FormData
                    },
                    httpsAgent: agent,
                });
                
                res.status(200).json(response.data);
                
            } catch (axiosError) {
                console.error('Archive API error:', axiosError.message);
                res.status(500).json({
                    error: 'Internal server error',
                    message: 'Failed to archive letter. Please try again later.'
                });
            }
            
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
            
            if (endpoint === 'generate-letter') {
                const targetUrl = `${API_BASE_URL}/generate-letter`;
                
                try {
                    console.log('Attempting real API call to:', targetUrl);
                    console.log('Payload:', data);
                    
                    const response = await axios.post(targetUrl, data, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        httpsAgent: agent,
                    });
                    
                    res.status(200).json(response.data);
                    
                } catch (axiosError) {
                    console.error('Generate API error:', axiosError.message);
                    res.status(500).json({
                        error: 'Internal server error',
                        message: 'Failed to generate letter. Please try again later.'
                    });
                }
            } else {
                res.status(400).json({ error: 'Invalid endpoint' });
            }
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

