const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await promisePool.query('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST create new category
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const [result] = await promisePool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    
    res.status(201).json({
      message: 'Category created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

module.exports = router;