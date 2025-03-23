const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'test-secret-key';

// Parse JSON body
app.use(express.json());

// Enable CORS for all requests
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware for test server
const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  // Allow requests without auth for testing
  if (!authHeader) {
    return next();
  }
  
  // Extract token (remove "Bearer " prefix)
  const token = authHeader.split(' ')[1];
  
  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token validation error:', err);
    // Continue anyway for testing purposes
    next();
  }
};

// Mock login endpoint
app.post('/api/auth', (req, res) => {
  // Create a test token
  const payload = {
    user: {
      id: '123456789'
    }
  };
  
  jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '1h' },
    (err, token) => {
      if (err) throw err;
      res.json({ token });
    }
  );
});

// Mock API endpoints for testing
app.get('/api/users/me', authMiddleware, (req, res) => {
  res.json({
    _id: '123456789',
    name: 'Test User',
    email: 'test@example.com',
    bio: 'This is a test user for development',
    avatar: 'images/default-avatar.png',
    coverPhoto: 'images/default-cover.jpg',
    location: 'Test City'
  });
});

app.get('/api/users/stats', authMiddleware, (req, res) => {
  res.json({
    blogsCount: 5,
    roomsCount: 3,
    bookingsCount: 2
  });
});

app.get('/api/blogs/user', authMiddleware, (req, res) => {
  res.json([]);
});

app.get('/api/rooms/my', authMiddleware, (req, res) => {
  res.json([]);
});

app.get('/api/bookings', authMiddleware, (req, res) => {
  res.json([]);
});

// Catch-all route to serve the main HTML page for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`Test login token will be automatically provided for development`);
}); 