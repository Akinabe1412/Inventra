const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { body, validationResult } = require('express-validator');

// GET all items with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      category, status, search, 
      sortBy = 'name', order = 'ASC',
      page = 1, limit = 20 
    } = req.query;
    
    let query = `
      SELECT i.*, c.name as category_name,
        CASE 
          WHEN i.quantity = 0 THEN 'out_of_stock'
          WHEN i.quantity <= i.min_quantity THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id 
      WHERE i.status != 'inactive'
      GROUP BY stock_status
    `;
    
    const params = [];
    
    // Apply filters
    if (category && category !== 'all') {
      query += ' AND c.name = ?';
      params.push(category);
    }
    
    if (status && status !== 'all') {
      if (status === 'low_stock') {
        query += ' AND i.quantity <= i.min_quantity AND i.quantity > 0';
      } else if (status === 'out_of_stock') {
        query += ' AND i.quantity = 0';
      } else if (status === 'in_stock') {
        query += ' AND i.quantity > i.min_quantity';
      }
    }
    
    if (search) {
      query += ' AND (i.name LIKE ? OR i.description LIKE ? OR i.sku LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Sorting
    const validSortColumns = ['name', 'quantity', 'price', 'created_at', 'category_name'];
    const validOrders = ['ASC', 'DESC'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';
    
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [items] = await promisePool.query(query, params);
    
    // Get total count
    const countQuery = query.includes('ORDER BY') 
      ? query.split('ORDER BY')[0].replace('SELECT i.*, c.name as category_name', 'SELECT COUNT(*) as total')
      : query.replace('SELECT i.*, c.name as category_name', 'SELECT COUNT(*) as total');
    
    const [countResult] = await promisePool.query(countQuery.split('ORDER BY')[0], params.slice(0, -2));
    
    res.json({
      success: true,
      data: items,
      pagination: {
        total: countResult[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((countResult[0]?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch items',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET single item by ID
router.get('/:id', async (req, res) => {
  try {
    const [items] = await promisePool.query(
      `SELECT i.*, c.name as category_name FROM items i 
       LEFT JOIN categories c ON i.category_id = c.id 
       WHERE i.id = ? AND i.status != 'inactive'`,
      [req.params.id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Item not found' 
      });
    }
    
    res.json({
      success: true,
      data: items[0]
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch item'
    });
  }
});

// POST create new item
router.post('/', [
  body('name').notEmpty().trim().withMessage('Item name is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or greater'),
  body('min_quantity').optional().isInt({ min: 0 }),
  body('price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { 
      name, category_id, quantity = 0, 
      min_quantity = 5, price, location, 
      description, sku, barcode 
    } = req.body;
    
    // Generate SKU if not provided
    let finalSku = sku;
    if (!finalSku) {
      finalSku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO items (
        name, category_id, quantity, min_quantity, 
        price, location, description, sku, barcode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, category_id || null, quantity, min_quantity,
        price || null, location || '', description || '',
        finalSku, barcode || null
      ]
    );
    
    // Create transaction log
    await promisePool.query(
      `INSERT INTO transactions (
        item_id, user_id, type, quantity_change,
        previous_quantity, new_quantity, notes
      ) VALUES (?, 1, 'check_in', ?, 0, ?, 'Initial stock entry')`,
      [result.insertId, quantity, quantity]
    );
    
    // Get the newly created item
    const [newItem] = await promisePool.query(
      `SELECT i.*, c.name as category_name FROM items i 
       LEFT JOIN categories c ON i.category_id = c.id 
       WHERE i.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem[0]
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create item'
    });
  }
});

// PUT update item
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('quantity').optional().isInt({ min: 0 }),
  body('price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    // Get current item
    const [currentItems] = await promisePool.query(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );
    
    if (currentItems.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Item not found' 
      });
    }
    
    const currentItem = currentItems[0];
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    
    const allowedFields = ['name', 'category_id', 'quantity', 'min_quantity', 'price', 'location', 'description'];
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
    
    const query = `UPDATE items SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await promisePool.query(query, values);
    
    // Log quantity changes
    if (updates.quantity !== undefined && updates.quantity !== currentItem.quantity) {
      const change = updates.quantity - currentItem.quantity;
      const type = change > 0 ? 'check_in' : 'check_out';
      
      await promisePool.query(
        `INSERT INTO transactions (
          item_id, user_id, type, quantity_change,
          previous_quantity, new_quantity, notes
        ) VALUES (?, 1, ?, ?, ?, ?, 'Manual adjustment')`,
        [id, type, Math.abs(change), currentItem.quantity, updates.quantity]
      );
    }
    
    // Get updated item
    const [updatedItem] = await promisePool.query(
      `SELECT i.*, c.name as category_name FROM items i 
       LEFT JOIN categories c ON i.category_id = c.id 
       WHERE i.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem[0]
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update item'
    });
  }
});

// DELETE item (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - update status instead of hard delete
    const [result] = await promisePool.query(
      'UPDATE items SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Item not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete item'
    });
  }
});

// GET item statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const [stats] = await promisePool.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        SUM(price * quantity) as total_value,
        AVG(price) as avg_price,
        COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN quantity > 0 AND quantity <= min_quantity THEN 1 END) as low_stock,
        COUNT(DISTINCT category_id) as unique_categories
      FROM items
      WHERE status = 'active'
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error fetching item stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics'
    });
  }
});

// GET items with limit for dashboard
router.get('/dashboard/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const [items] = await promisePool.query(`
      SELECT i.*, c.name as category_name 
      FROM items i 
      LEFT JOIN categories c ON i.category_id = c.id 
      WHERE i.status != 'inactive'
      ORDER BY i.created_at DESC 
      LIMIT ?
    `, [limit]);
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching recent items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch recent items'
    });
  }
});

module.exports = router;