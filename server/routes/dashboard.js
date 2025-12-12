// server/routes/dashboard.js
const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');

// GET dashboard summary (frontend expects this at /api/dashboard/summary)
router.get('/summary', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard summary...');
    
    // Get total items
    const [itemsResult] = await promisePool.query('SELECT COUNT(*) as total_items FROM items');
    
    // Get low stock items
    const [lowStockResult] = await promisePool.query(
      'SELECT COUNT(*) as low_stock FROM items WHERE quantity > 0 AND quantity <= min_quantity'
    );
    
    // Get out of stock items
    const [outOfStockResult] = await promisePool.query(
      'SELECT COUNT(*) as out_of_stock FROM items WHERE quantity = 0'
    );
    
    // Get total value
    const [totalValueResult] = await promisePool.query(
      'SELECT SUM(quantity * COALESCE(price, 0)) as total_value FROM items'
    );
    
    // Get average price
    const [avgPriceResult] = await promisePool.query(
      'SELECT AVG(price) as avg_price FROM items WHERE price IS NOT NULL AND price > 0'
    );
    
    const stats = {
      total_items: itemsResult[0].total_items || 0,
      low_stock: lowStockResult[0].low_stock || 0,
      out_of_stock: outOfStockResult[0].out_of_stock || 0,
      total_value: totalValueResult[0].total_value || 0,
      avg_price: avgPriceResult[0].avg_price || 0
    };
    
    console.log('✅ Dashboard stats:', stats);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

module.exports = router;