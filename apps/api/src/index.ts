import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {initializeServices} from '@stashl/domain/src/services';
import {authRoutes} from './routes/auth';
import {userRoutes} from './routes/users';
import {linkRoutes} from './routes/links';
import {authMiddleware} from './middleware/auth';

const app = new Hono();

// Add CORS middleware
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:8081'], // web and mobile dev servers
  credentials: true,
}));

// Initialize the domain services
try {
  initializeServices();
  console.log('✅ Domain services initialized');
} catch (error) {
  console.error('❌ Failed to initialize domain services:', error.message);
  process.exit(1);
}

// Health check endpoint
app.get('/ping', (c) =>
  c.json({
    alive: true,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }),
);

// API routes
app.route('/api/auth', authRoutes);

// Protected routes with auth middleware
app.use('/api/users/*', authMiddleware());
app.route('/api/users', userRoutes);

app.use('/api/links/*', authMiddleware());
app.route('/api/links', linkRoutes);

// Error handling middleware
app.onError((err, c) => {
  console.error('API Error:', err);
  
  if (err.message.includes('Authentication required') || err.message.includes('Invalid credentials')) {
    return c.json({error: 'Authentication required'}, 401);
  }
  
  if (err.message.includes('Unauthorized')) {
    return c.json({error: 'Unauthorized'}, 403);
  }
  
  if (err.message.includes('not found') || err.message.includes('Not found')) {
    return c.json({error: 'Resource not found'}, 404);
  }
  
  if (err.message.includes('already exists') || err.message.includes('Invalid')) {
    return c.json({error: err.message}, 400);
  }
  
  return c.json({error: 'Internal server error'}, 500);
});

export default {
  port: process.env.API_PORT || 3001,
  fetch: app.fetch,
};