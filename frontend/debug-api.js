// Debug script to test API endpoints
console.log('Starting API endpoint tests...');

// Test 1: Basic health check
fetch('/api/v1/health')
  .then(response => {
    console.log('Health check status:', response.status);
    return response.json();
  })
  .then(data => console.log('Health check data:', data))
  .catch(error => console.error('Health check error:', error));

// Test 2: Check authentication with stored token
const token = localStorage.getItem('access_token');
console.log('Stored token:', token ? 'Present' : 'Missing');

if (token) {
  // Test 3: Paper trading portfolio with auth
  fetch('/api/v1/paper-trading/portfolio', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      console.log('Paper trading portfolio status:', response.status);
      return response.json();
    })
    .then(data => console.log('Paper trading portfolio data:', data))
    .catch(error => console.error('Paper trading portfolio error:', error));

  // Test 4: AI insights with auth
  fetch('/api/v1/insights/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      symbol: 'AAPL',
      user_role: 'beginner'
    })
  })
    .then(response => {
      console.log('AI insights status:', response.status);
      return response.json();
    })
    .then(data => console.log('AI insights data:', data))
    .catch(error => console.error('AI insights error:', error));
}

// Test 5: Check current URL and base URL
console.log('Current URL:', window.location.href);
console.log('Base URL for API calls:', window.location.origin);