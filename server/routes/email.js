// routes/email.js
const express = require('express');
const router = express.Router();

// GET email templates
router.get('/templates', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Low Stock Alert',
          type: 'low_stock',
          subject: 'Low Stock Alert for {{item_name}}',
          body: 'Item {{item_name}} is running low. Current quantity: {{quantity}}',
          is_active: true
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch email templates' });
  }
});

// GET email logs
router.get('/logs', async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch email logs' });
  }
});

// POST send email
router.post('/send', async (req, res) => {
  try {
    console.log('Email would be sent:', req.body);
    res.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

module.exports = router;
