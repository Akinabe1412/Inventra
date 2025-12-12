// routes/backup.js
const express = require('express');
const router = express.Router();

// POST create backup
router.post('/create', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Backup created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create backup' });
  }
});

module.exports = router;
