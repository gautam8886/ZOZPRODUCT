import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Products Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        price REAL NOT NULL,
        mrp REAL NOT NULL,
        discount INTEGER NOT NULL,
        stock INTEGER NOT NULL DEFAULT 10,
        rating REAL NOT NULL DEFAULT 4.2,
        rating_count INTEGER NOT NULL DEFAULT 120,
        review_count INTEGER NOT NULL DEFAULT 35,
        description TEXT NOT NULL,
        highlights TEXT NOT NULL, -- JSON array of strings
        specs TEXT NOT NULL,      -- JSON object of categories: { "General": {...}, ... }
        images TEXT NOT NULL,     -- JSON array of image URLs
        is_assured BOOLEAN NOT NULL DEFAULT 1,
        is_deal BOOLEAN NOT NULL DEFAULT 0,
        deal_tag TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Categories Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL,
        subcategories TEXT NOT NULL -- JSON array of strings
    )
    ''')

    # Orders Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        shipping_address TEXT NOT NULL, -- JSON object
        items TEXT NOT NULL,            -- JSON array of items
        total_amount REAL NOT NULL,
        discount_amount REAL NOT NULL,
        delivery_charges REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'Success',
        order_status TEXT NOT NULL DEFAULT 'Placed', -- Placed, Processing, Shipped, Out for Delivery, Delivered, Cancelled
        tracking_history TEXT NOT NULL, -- JSON array of status history with timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Reviews Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        title TEXT NOT NULL,
        comment TEXT NOT NULL,
        verified_purchase BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized successfully at", DB_PATH)

if __name__ == '__main__':
    init_db()
