const { pool } = require('../config/db');

class Item {
  static async findAll() {
    const [rows] = await promisePool.query('SELECT * FROM items');
    return rows;
  }
  
  static async findById(id) {
    const [rows] = await promisePool.query('SELECT * FROM items WHERE id = ?', [id]);
    return rows[0];
  }
  
  static async create(itemData) {
    const { name, category_id, quantity, price, location, description } = itemData;
    const [result] = await promisePool.query(
      'INSERT INTO items (name, category_id, quantity, price, location, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category_id, quantity, price, location, description]
    );
    return result.insertId;
  }
}

module.exports = Item;