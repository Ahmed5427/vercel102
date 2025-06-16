// Vercel serverless function to proxy API calls with real backend integration
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
        
        // Check if this is a FormData request (for archive-letter)
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('multipart/form-data')) {
            // Handle file upload for archive-letter
            const targetUrl = `${API_BASE_URL}/archive-letter`;
            
            try {
                // Use fetch with proper configuration for Vercel environment
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    body: req.body,
                    headers: {
                        'Content-Type': contentType,
                    },
                    // For Vercel, we'll try without the agent first
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Archive API error:', response.status, errorText);
                    throw new Error(`Archive API call failed: ${response.status} - ${errorText}`);
                }
                
                const result = await response.json();
                res.status(200).json(result);
                
            } catch (fetchError) {
                console.error("Archive fetch error:", fetchError.message);
                res.status(500).json({
                    error: "Internal server error",
                    message: "Failed to archive letter. Please try again later."
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
                    
                    // Try the real API call first
                    const response = await fetch(targetUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Generate API error:', response.status, errorText);
                        throw new Error(`Generate API call failed: ${response.status} - ${errorText}`);
                    }
                    
                    const result = await response.json();
                    console.log('Real API success:', result);
                    res.status(200).json(result);
                    
                } catch (fetchError) {
                    console.error("Generate fetch error:", fetchError.message);
                    res.status(500).json({
                        error: "Internal server error",
                        message: "Failed to generate letter. Please try again later."
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

