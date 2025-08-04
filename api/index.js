// Vercel serverless function entry point
require('dotenv').config();

const { createApp } = require('./src/app');

let app;

async function handler(req, res) {
  if (!app) {
    try {
      app = await createApp({ logger: false });
      await app.ready();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
      return;
    }
  }
  
  try {
    await app.inject({
      method: req.method,
      url: req.url,
      headers: req.headers,
      payload: req.body
    }).then(response => {
      res.statusCode = response.statusCode;
      
      // Set headers
      Object.keys(response.headers).forEach(key => {
        res.setHeader(key, response.headers[key]);
      });
      
      res.end(response.payload);
    });
  } catch (error) {
    console.error('Request handling error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

module.exports = handler;