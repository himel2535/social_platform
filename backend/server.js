require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { corsOptions } = require('./src/config/cors');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (process.env.MONGODB_URI) {
    await connectDB();
  } else {
    console.warn('MONGODB_URI not set — server starting without database connection');
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
      credentials: true,
    },
  });

  require('./src/socket')(io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
