// Simple local server to test the static site and serverless endpoints locally.
// Usage:
// 1) npm install
// 2) copy .env.example to .env and set values (PAYFAST_SANDBOX=1 for sandbox testing)
// 3) node server.js
// 4) open http://localhost:3000

const express = require('express');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// parse application/x-www-form-urlencoded (PayFast posts this)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from repo root
app.use(express.static(path.join(__dirname)));

// Import handlers
const createPayfast = require('./api/create-payfast');
const payfastWebhook = require('./api/payfast-webhook');

// Routes to emulate serverless endpoints
app.post('/api/create-payfast', (req, res) => {
  // Delegate to serverless handler
  return createPayfast(req, res);
});

app.post('/api/payfast-webhook', (req, res) => {
  return payfastWebhook(req, res);
});

app.listen(port, () => {
  console.log(`Local test server started: http://localhost:${port}`);
  console.log('Post PayFast notify to: http://localhost:' + port + '/api/payfast-webhook');
});
