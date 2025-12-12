// server/routes/categories.js
const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await promisePool.query('SELECT * FROM categories ORDER BY name');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch categories' 
    });
  }
});

// POST create new category
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category name is required' 
      });
    }
    
    const [result] = await promisePool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    
    // Get the newly created category
    const [newCategory] = await promisePool.query(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create category' 
    });
  }
});

module.exports = router;