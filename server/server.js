const express = require('express');
const cors = require('cors');
const path = require('path');
const auth = require('./middleware/auth');
require('dotenv').config();

const { pool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client
app.use(express.static(path.join(__dirname, '../client')));

// Import routes
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const assetRoutes = require('./routes/assets');
const categoryRoutes = require('./routes/categories');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const transactionRoutes = require('./routes/transactions');
const emailRoutes = require('./routes/email');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/items', auth, itemRoutes);
app.use('/api/assets', auth, assetRoutes);
app.use('/api/categories', auth, categoryRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/reports', auth, reportRoutes);
app.use('/api/transactions', auth, transactionRoutes);
app.use('/api/email', auth, emailRoutes);
app.use('/api/settings', auth, settingsRoutes);
app.use('/api/backup', auth, backupRoutes);

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      timestamp: new Date(),
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      error: {
        message: 'Database connection failed',
        details: err.message
      }
    });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});