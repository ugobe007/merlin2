import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import placesRouter from './routes/places.js';
import locationRouter from './routes/location.js';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS middleware (for local development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Routes
app.use('/api/places', placesRouter);
app.use('/api/location', locationRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'merlin-api', endpoints: ['/api/places', '/api/location'] });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Merlin API running on port ${PORT}`);
  console.log(`📍 Places endpoints: http://localhost:${PORT}/api/places`);
  console.log(`🌎 Location endpoints: http://localhost:${PORT}/api/location`);
});
