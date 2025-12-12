// routes/transactions.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET recent transactions
router.get('/recent', async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
