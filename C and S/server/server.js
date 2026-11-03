import './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // 1. Establish database connection before accepting traffic
    console.log('[Startup] Initializing MongoDB connection...');
    await connectDB();

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🌱 Food Link Server running on http://localhost:${PORT}`);
      console.log(`🏷️  Tagline: Good food deserves another chance.`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });

    // Process exception & signal handling
    process.on('unhandledRejection', (err) => {
      console.error('[Process] Unhandled Rejection:', err);
    });

    process.on('uncaughtException', (err) => {
      console.error('[Process] Uncaught Exception:', err);
    });

    process.on('SIGTERM', () => {
      console.log('[Process] SIGTERM received. Closing server gracefully...');
      server.close(() => {
        console.log('[Process] Server closed.');
        process.exit(0);
      });
    });

    return server;
  } catch (err) {
    console.error('[Startup Error] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
