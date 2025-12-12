const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');

// GET all assets
router.get('/', async (req, res) => {
  try {
    const [assets] = await promisePool.query(`
      SELECT a.*, i.name as item_name, u.full_name as assigned_to_name 
      FROM assets a 
      LEFT JOIN items i ON a.item_id = i.id 
      LEFT JOIN users u ON a.assigned_to = u.id 
      ORDER BY a.created_at DESC
    `);
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// POST create new asset
router.post('/', async (req, res) => {
  try {
    const { item_id, asset_tag, serial_number, status, assigned_to, purchase_date, warranty_expiry, notes } = req.body;
    
    if (!asset_tag) {
      return res.status(400).json({ error: 'Asset tag is required' });
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO assets (item_id, asset_tag, serial_number, status, assigned_to, purchase_date, warranty_expiry, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_id || null, asset_tag, serial_number || null, status || 'available', assigned_to || null, 
       purchase_date || null, warranty_expiry || null, notes || '']
    );
    
    res.status(201).json({
      message: 'Asset created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

module.exports = router;