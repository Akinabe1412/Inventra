-- Create database
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- Users table (for account system)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Items/Inventory table
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category_id INT,
    quantity INT NOT NULL DEFAULT 0,
    min_quantity INT DEFAULT 5,
    price DECIMAL(10, 2),
    location VARCHAR(255),
    description TEXT,
    barcode VARCHAR(100),
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Asset tracking table
CREATE TABLE assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    asset_tag VARCHAR(100) UNIQUE NOT NULL,
    serial_number VARCHAR(100),
    status ENUM('available', 'assigned', 'maintenance', 'retired') DEFAULT 'available',
    assigned_to INT,
    assigned_date DATE,
    purchase_date DATE,
    warranty_expiry DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    user_id INT,
    type ENUM('check_in', 'check_out', 'adjustment', 'transfer') NOT NULL,
    quantity_change INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert sample data
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@inventory.com', '$2b$10$YourHashedPasswordHere', 'System Admin', 'admin'),
('manager@inventory.com', '$2b$10$YourHashedPasswordHere', 'Inventory Manager', 'manager');

INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and components'),
('Office Supplies', 'Office stationery and supplies'),
('Furniture', 'Office furniture and fixtures'),
('IT Equipment', 'Computers, servers, and networking'),
('Tools', 'Maintenance and repair tools');

INSERT INTO items (name, sku, category_id, quantity, min_quantity, price, location, description) VALUES
('Laptop Dell XPS 13', 'LP-DELL-XPS13-001', 1, 15, 3, 1299.99, 'Storage A', 'Dell XPS 13" laptop, 16GB RAM, 512GB SSD'),
('Office Chair Ergonomic', 'OC-ERG-001', 3, 8, 2, 299.99, 'Main Office', 'Ergonomic office chair with lumbar support'),
('Network Switch 24-port', 'NS-CISCO-24P', 4, 5, 1, 499.99, 'Server Room', 'Cisco 24-port gigabit switch'),
('A4 Printer Paper', 'PP-A4-500', 2, 50, 10, 24.99, 'Supply Room', 'A4 printer paper, 500 sheets');

-- Create a view for low stock items
CREATE VIEW low_stock_items AS
SELECT i.*, c.name as category_name
FROM items i
JOIN categories c ON i.category_id = c.id
WHERE i.quantity <= i.min_quantity;

-- Add to existing database/schema.sql

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type ENUM('low_stock', 'order_confirmation', 'warranty_expiry', 'custom') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES email_templates(id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS saved_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('inventory', 'assets', 'transactions', 'custom') NOT NULL,
    filters JSON,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample email templates
INSERT INTO email_templates (name, subject, body, type) VALUES
('Low Stock Alert', 'Low Stock Alert for {{item_name}}', 
'Dear Manager,\n\nItem "{{item_name}}" is running low in stock.\nCurrent Quantity: {{current_quantity}}\nMinimum Required: {{min_quantity}}\nLocation: {{location}}\n\nPlease reorder soon.\n\nBest regards,\nInventory System', 
'low_stock'),

('New Order Confirmation', 'Order Confirmation #{{order_id}}', 
'Dear {{customer_name}},\n\nThank you for your order!\n\nOrder Details:\n- Order ID: {{order_id}}\n- Date: {{order_date}}\n- Total Items: {{total_items}}\n\nItems:\n{{items_list}}\n\nWe will process your order shortly.\n\nBest regards,\nInventory System', 
'order_confirmation'),

('Warranty Expiry Notice', 'Warranty Expiry Alert for {{asset_tag}}', 
'Dear {{assigned_to}},\n\nThe warranty for asset "{{asset_tag}}" ({{asset_name}}) will expire on {{expiry_date}}.\n\nPlease take necessary actions.\n\nBest regards,\nInventory System', 
'warranty_expiry');

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create trigger for auditing item changes
DELIMITER //
CREATE TRIGGER items_after_update
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
        NEW.created_by,
        'UPDATE',
        'items',
        NEW.id,
        JSON_OBJECT(
            'name', OLD.name,
            'quantity', OLD.quantity,
            'price', OLD.price,
            'location', OLD.location
        ),
        JSON_OBJECT(
            'name', NEW.name,
            'quantity', NEW.quantity,
            'price', NEW.price,
            'location', NEW.location
        )
    );
END//
DELIMITER ;