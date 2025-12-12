const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');

// GET dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total items count
    const [itemsResult] = await promisePool.query(`
      SELECT 
        COUNT(*) as totalItems,
        SUM(CASE WHEN quantity > min_quantity THEN 1 ELSE 0 END) as inStock,
        SUM(CASE WHEN quantity > 0 AND quantity <= min_quantity THEN 1 ELSE 0 END) as lowStock,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStock
      FROM items
    `);
    
    // Get total categories count
    const [categoriesResult] = await promisePool.query('SELECT COUNT(*) as totalCategories FROM categories');
    
    // Get total assets count
    const [assetsResult] = await promisePool.query('SELECT COUNT(*) as totalAssets FROM assets');
    
    // Get recent items
    const [recentItems] = await promisePool.query(`
      SELECT i.*, c.name as category_name 
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id 
      ORDER BY i.created_at DESC 
      LIMIT 5
    `);
    
    const stats = {
      ...itemsResult[0],
      ...categoriesResult[0],
      ...assetsResult[0],
      itemsChange: Math.floor(Math.random() * 20) + 5, // Mock data for now
      recentItems
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;