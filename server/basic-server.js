const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'EasyMove server is running' });
});

// Basic quote calculation endpoint
app.post('/api/quotes/calculate', (req, res) => {
  const { distance, vanSize = 'medium' } = req.body;
  
  // Basic pricing calculation
  const baseRate = 1.30; // £1.30 per mile
  const vanMultipliers = {
    small: 1.0,
    medium: 1.1,
    large: 1.2,
    luton: 1.3
  };
  
  const multiplier = vanMultipliers[vanSize] || 1.1;
  const price = distance * baseRate * multiplier;
  const returnJourney = price * 0.35; // 35% for return journey
  const totalPrice = price + returnJourney;
  
  res.json({
    success: true,
    quote: {
      distance,
      vanSize,
      basePrice: price,
      returnJourney,
      totalPrice,
      formattedPrice: `£${totalPrice.toFixed(2)}`
    }
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EasyMove server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});