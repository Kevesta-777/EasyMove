const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

// Basic CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Quote calculation logic
function calculateQuote(distance, vanSize = 'medium') {
  const baseRate = 1.30; // £1.30 per mile
  const vanMultipliers = {
    small: 1.0,
    medium: 1.1,
    large: 1.2,
    luton: 1.3
  };
  
  const multiplier = vanMultipliers[vanSize] || 1.1;
  const basePrice = distance * baseRate * multiplier;
  const returnJourney = basePrice * 0.35; // 35% for return journey
  const totalPrice = basePrice + returnJourney;
  
  return {
    distance,
    vanSize,
    basePrice: Math.round(basePrice * 100) / 100,
    returnJourney: Math.round(returnJourney * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    formattedPrice: `£${totalPrice.toFixed(2)}`
  };
}

// Simple HTML page
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EasyMove - Man and Van Service</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .quote-form { background: #f4f4f4; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        button { background: #007bff; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0056b3; }
        .result { background: #e9f7ef; padding: 20px; border-radius: 10px; margin-top: 20px; }
        .price { font-size: 24px; font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EasyMove Man and Van Service</h1>
            <p>Professional moving services at competitive rates</p>
        </div>
        
        <div class="quote-form">
            <h2>Get Your Quote</h2>
            <form id="quoteForm">
                <div class="form-group">
                    <label for="distance">Distance (miles):</label>
                    <input type="number" id="distance" min="1" max="500" required>
                </div>
                
                <div class="form-group">
                    <label for="vanSize">Van Size:</label>
                    <select id="vanSize">
                        <option value="small">Small Van</option>
                        <option value="medium" selected>Medium Van</option>
                        <option value="large">Large Van</option>
                        <option value="luton">Luton Van</option>
                    </select>
                </div>
                
                <button type="submit">Calculate Quote</button>
            </form>
        </div>
        
        <div id="result" style="display: none;" class="result">
            <h3>Your Quote</h3>
            <div id="quoteDetails"></div>
        </div>
    </div>

    <script>
        document.getElementById('quoteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const distance = document.getElementById('distance').value;
            const vanSize = document.getElementById('vanSize').value;
            
            try {
                const response = await fetch('/api/quotes/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ distance: parseFloat(distance), vanSize })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    const resultDiv = document.getElementById('result');
                    const detailsDiv = document.getElementById('quoteDetails');
                    
                    detailsDiv.innerHTML = \`
                        <p><strong>Distance:</strong> \${data.quote.distance} miles</p>
                        <p><strong>Van Size:</strong> \${data.quote.vanSize}</p>
                        <p><strong>Base Price:</strong> £\${data.quote.basePrice.toFixed(2)}</p>
                        <p><strong>Return Journey:</strong> £\${data.quote.returnJourney.toFixed(2)}</p>
                        <p class="price"><strong>Total Price: \${data.quote.formattedPrice}</strong></p>
                    \`;
                    
                    resultDiv.style.display = 'block';
                } else {
                    alert('Error calculating quote');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }
  
  // API endpoints
  if (pathname === '/api/quotes/calculate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const quote = calculateQuote(data.distance, data.vanSize);
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        });
        res.end(JSON.stringify({ success: true, quote }));
      } catch (error) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }
  
  // Health check
  if (pathname === '/health') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      ...corsHeaders 
    });
    res.end(JSON.stringify({ status: 'ok', message: 'EasyMove server is running' }));
    return;
  }
  
  // Serve index page
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexHtml);
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`EasyMove server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});