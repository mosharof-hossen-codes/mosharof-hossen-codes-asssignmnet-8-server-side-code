import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { seedData } from './seed';
import authRoutes from './routes/auth.routes';
import studiosRoutes from './routes/studios.routes';
import bookingsRoutes from './routes/bookings.routes';
import wishlistRoutes from './routes/wishlist.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Middlewares
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'StudioSpace Backend API',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/studios', studiosRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server and Connect DB
async function startServer() {
  await connectDB();
  await seedData();

  app.listen(PORT, () => {
    console.log(`[StudioSpace Server] Running on http://localhost:${PORT}`);
    console.log(`[StudioSpace Server] CORS enabled for ${CLIENT_URL}`);
  });
}

startServer();
