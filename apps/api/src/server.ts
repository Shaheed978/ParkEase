import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import parkingRoutes from './routes/parkingRoutes';
import bookingRoutes from './routes/bookingRoutes';
import ownerRoutes from './routes/ownerRoutes';
import adminRoutes from './routes/adminRoutes';
import extraRoutes from './routes/extraRoutes';
import { sendError, sendSuccess } from './utils/response';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  return sendSuccess(res, 'ParkEase API Service is running smoothly', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/extras', extraRoutes);

// Global 404 Handler
app.use((req, res) => {
  return sendError(res, `Route ${req.originalUrl} not found`, 'NOT_FOUND', 404);
});

// Global Error Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Global Error:', err);
  return sendError(res, err.message || 'Internal Server Error', 'SERVER_ERROR', 500);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 ParkEase Backend API server running on port ${PORT}`);
    console.log(`📡 Base URL: http://localhost:${PORT}/api`);
  });
}

export default app;
