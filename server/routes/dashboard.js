// routes/dashboard.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');  // Use pool, not promisePool

// GET dashboard summary
router.get('/summary', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard summary...');
    
    // Get all stats in one query (optimized)
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN quantity > 0 AND quantity <= min_quantity THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
        COALESCE(SUM(price * quantity), 0) as total_value,
        COALESCE(AVG(CASE WHEN price > 0 THEN price END), 0) as avg_price,
        COUNT(DISTINCT category_id) as categories_count
      FROM items 
      WHERE status != 'inactive'
    `);
    
    // Get recent items
    const [recentItems] = await pool.query(`
      SELECT i.*, c.name as category_name 
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id 
      WHERE i.status != 'inactive'
      ORDER BY i.created_at DESC 
      LIMIT 5
    `);
    
    // Get category distribution
    const [categories] = await pool.query(`
      SELECT 
        c.name,
        COUNT(i.id) as item_count,
        COALESCE(SUM(i.price * i.quantity), 0) as total_value
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id AND i.status != 'inactive'
      GROUP BY c.id, c.name
      ORDER BY item_count DESC
      LIMIT 5
    `);
    
    console.log('✅ Dashboard stats fetched successfully');
    
    res.json({
      success: true,
      data: {
        ...stats[0],
        recent_items: recentItems,
        top_categories: categories,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
