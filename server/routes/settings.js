// routes/settings.js
const express = require('express');
const router = express.Router();

// GET settings
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        system_name: 'Inventra',
        currency: 'PHP', // Philippine Peso as default
        timezone: 'UTC',
        date_format: 'MM/DD/YYYY'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// POST save settings
router.post('/save', async (req, res) => {
  try {
    console.log('Settings saved:', req.body);
    res.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// POST reset settings
router.post('/reset', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Settings reset to default'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reset settings' });
  }
});

module.exports = router;