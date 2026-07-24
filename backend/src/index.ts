import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { extractTenant } from './middleware/tenant';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow Next.js app to send requests with headers (X-Tenant-Slug, Authorization)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug'],
  credentials: true
}));

app.use(express.json());

// Global Tenant extraction
app.use(extractTenant);

// Routing registration
app.use('/api', apiRouter);

// Base health endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    sqliteFallback: true
  });
});

app.get('/', (req, res) => {
  res.send('Multi-Tenant SaaS E-Commerce API running.');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'An unexpected error occurred on the server' });
});

app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
});
