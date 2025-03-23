const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// API Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/blogs', require('./routes/api/blogs'));
app.use('/api/rooms', require('./routes/api/rooms'));
app.use('/api/bookings', require('./routes/api/bookings'));

// Socket.io connection
require('./utils/socket')(io);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// MongoDb validation error handler
app.use((err, req, res, next) => {
  // Check if it's a Mongoose/MongoDB validation error
  if (err.name === 'ValidationError' || err.name === 'MongoServerError' || err.name === 'CastError') {
    console.error('MongoDB validation error:', err);
    return res.status(400).json({
      success: false,
      msg: 'Validation error',
      details: err.message,
      errors: err.errors
    });
  }
  next(err);
});

// Global error handler - ensure all errors return JSON instead of HTML
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  
  // Check if the request expects JSON
  const acceptJson = req.headers.accept && req.headers.accept.includes('application/json');
  const requestJson = req.headers['content-type'] && req.headers['content-type'].includes('application/json');
  
  // Always return JSON for API routes
  if (req.path.startsWith('/api') || acceptJson || requestJson) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      msg: err.message || 'Server Error',
      error: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  }
  
  // For non-API routes, pass to Express's default error handler
  next(err);
});

// Add 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    msg: 'API endpoint not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 