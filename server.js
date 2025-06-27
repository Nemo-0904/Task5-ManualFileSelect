// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Import custom modules
const connectDB = require('./config/db');
// const checkoutRoutes = require('./routes/checkout'); // <--- REMOVE OR COMMENT OUT THIS LINE
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment'); // <--- CRITICAL: ADD THIS LINE to import payment routes

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: false })); // Body parser for URL-encoded data (if needed)

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
}));

// API Routes
// app.use('/api/checkout', checkoutRoutes); // <--- CRITICAL: REMOVE OR COMMENT OUT THIS LINE
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes); // <--- CRITICAL: ADD/UPDATE THIS LINE to mount your payment routes at /api/payment

// Health Check Route
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Robotic Co API is running' });
});

// Serve frontend (React/Vite) in production
if (process.env.NODE_ENV === 'production') {
  const __dirnamePath = path.resolve();
  app.use(express.static(path.join(__dirnamePath, 'frontend/dist')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirnamePath, 'frontend', 'dist', 'index.html'))
  );
}

// Error handler (optional - best placed at the very end of your middleware stack)
app.use((error, req, res, next) => {
  console.error('Global Error Handler:', error.stack);
  res.status(error.statusCode || 500).json({
    message: error.message || 'An unexpected server error occurred',
    // Only expose error details in development mode for security
    error: process.env.NODE_ENV === 'development' ? error : {},
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
