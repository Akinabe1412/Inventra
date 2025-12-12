// server/routes/reports.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Export inventory report
router.get('/export/inventory', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    const [items] = await pool.promise().query(`
      SELECT i.*, c.name as category_name 
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id 
      ORDER BY i.name ASC
    `);
    
    if (format === 'csv') {
      let csv = 'ID,Name,SKU,Category,Quantity,Min Quantity,Price,Location,Status\n';
      
      items.forEach(item => {
        const status = item.quantity === 0 ? 'Out of Stock' : 
                      item.quantity <= item.min_quantity ? 'Low Stock' : 'In Stock';
        
        csv += `${item.id},"${item.name}","${item.sku || ''}","${item.category_name || 'Uncategorized'}",`;
        csv += `${item.quantity},${item.min_quantity},${item.price || '0'},"${item.location || ''}","${status}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_export.csv"');
      return res.send(csv);
    } else {
      res.json({ success: true, data: items });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export inventory' });
  }
});

// Export assets report
router.get('/export/assets', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    const [assets] = await pool.promise().query(`
      SELECT a.*, i.name as item_name, 
             CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
      FROM assets a 
      LEFT JOIN items i ON a.item_id = i.id
      LEFT JOIN users u ON a.assigned_to = u.id
      ORDER BY a.asset_tag ASC
    `);
    
    if (format === 'csv') {
      let csv = 'Asset Tag,Serial Number,Item,Status,Assigned To,Purchase Date,Warranty Expiry\n';
      
      assets.forEach(asset => {
        csv += `"${asset.asset_tag}","${asset.serial_number || ''}","${asset.item_name || 'N/A'}",`;
        csv += `"${asset.status}",`;
        csv += `"${asset.assigned_to_name || 'N/A'}",`;
        csv += `"${asset.purchase_date || ''}","${asset.warranty_expiry || ''}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="assets_export.csv"');
      return res.send(csv);
    } else {
      res.json({ success: true, data: assets });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export assets' });
  }
});

// Get asset statistics for reports
router.get('/assets/stats', async (req, res) => {
  try {
    const [stats] = await pool.promise().query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END) as retired
      FROM assets
    `);
    
    res.json({ success: true, ...stats[0] });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch asset statistics' });
  }
});

// Get recent transactions
router.get('/transactions/recent', async (req, res) => {
  try {
    const [transactions] = await pool.promise().query(`
      SELECT 
        t.*,
        i.name as item_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM item_transactions t
      LEFT JOIN items i ON t.item_id = i.id
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);
    
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

module.exports = router;