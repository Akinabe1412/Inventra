// server/routes/assets.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

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
    
    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch assets' 
    });
  }
});

// GET single asset by ID
router.get('/:id', async (req, res) => {
  try {
    const [assets] = await promisePool.query(
      `SELECT a.*, i.name as item_name, u.full_name as assigned_to_name 
       FROM assets a 
       LEFT JOIN items i ON a.item_id = i.id 
       LEFT JOIN users u ON a.assigned_to = u.id 
       WHERE a.id = ?`,
      [req.params.id]
    );
    
    if (assets.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Asset not found' 
      });
    }
    
    res.json({
      success: true,
      data: assets[0]
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch asset' 
    });
  }
});

// POST create new asset
router.post('/', async (req, res) => {
  try {
    const { item_id, asset_tag, serial_number, status, assigned_to, purchase_date, warranty_expiry, notes } = req.body;
    
    if (!asset_tag) {
      return res.status(400).json({ 
        success: false, 
        error: 'Asset tag is required' 
      });
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO assets (item_id, asset_tag, serial_number, status, assigned_to, purchase_date, warranty_expiry, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_id || null, asset_tag, serial_number || null, status || 'available', assigned_to || null, 
       purchase_date || null, warranty_expiry || null, notes || '']
    );
    
    // Get the newly created asset
    const [newAsset] = await promisePool.query(
      `SELECT a.*, i.name as item_name, u.full_name as assigned_to_name 
       FROM assets a 
       LEFT JOIN items i ON a.item_id = i.id 
       LEFT JOIN users u ON a.assigned_to = u.id 
       WHERE a.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: newAsset[0]
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create asset' 
    });
  }
});

// PUT update asset
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updateFields = [];
    const values = [];
    
    const allowedFields = ['item_id', 'asset_tag', 'serial_number', 'status', 'assigned_to', 'purchase_date', 'warranty_expiry', 'notes'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid fields to update' 
      });
    }
    
    values.push(id);
    
    const query = `UPDATE assets SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await promisePool.query(query, values);
    
    // Get updated asset
    const [updatedAsset] = await promisePool.query(
      `SELECT a.*, i.name as item_name, u.full_name as assigned_to_name 
       FROM assets a 
       LEFT JOIN items i ON a.item_id = i.id 
       LEFT JOIN users u ON a.assigned_to = u.id 
       WHERE a.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: updatedAsset[0]
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update asset' 
    });
  }
});

// DELETE asset
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await promisePool.query(
      'DELETE FROM assets WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Asset not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete asset' 
    });
  }
});

module.exports = router;