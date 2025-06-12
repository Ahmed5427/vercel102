const axios = require('axios');

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
        const { endpoint, data } = req.body;
        const url = `https://128.140.37.194:5000/${endpoint}`;
        
        // Make request to the actual API
        // Note: In production, you should handle SSL certificates properly
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            httpsAgent: new (require('https').Agent)({
                rejectUnauthorized: false // Only for self-signed certificates
            })
        });
        
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Failed to process request',
            message: error.message 
        });
    }
};