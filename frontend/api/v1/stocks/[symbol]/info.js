import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter required' });
    }

    // Get stock information using yahoo-finance2
    const quote = await yahooFinance.quote(symbol.toUpperCase());
    
    if (!quote) {
      return res.status(404).json({ error: `Stock information not found for ${symbol}` });
    }

    const response = {
      symbol: symbol.toUpperCase(),
      name: quote.longName || quote.shortName || '',
      sector: quote.sector || null,
      industry: quote.industry || null,
      market_cap: quote.marketCap || null,
      price: quote.regularMarketPrice || quote.bid || null
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Stock info error:', error);
    
    // Fallback with basic info if Yahoo Finance fails
    if (error.message.includes('Not Found') || error.message.includes('404')) {
      return res.status(404).json({ error: `Stock information not found for ${symbol}` });
    }
    
    res.status(500).json({ error: 'Error fetching stock information' });
  }
}