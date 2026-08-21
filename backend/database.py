import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'cars.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        preferred_brands TEXT,
        reset_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cars (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        tagline TEXT,
        body_type TEXT NOT NULL,
        min_price REAL NOT NULL,
        max_price REAL NOT NULL,
        price_display TEXT NOT NULL,
        fuel_types TEXT NOT NULL,
        transmissions TEXT NOT NULL,
        mileage TEXT,
        engine TEXT,
        power TEXT,
        torque TEXT,
        seating INTEGER,
        safety_rating TEXT,
        boot_space TEXT,
        ground_clearance TEXT,
        is_electric INTEGER DEFAULT 0,
        is_new_launch INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        rating REAL DEFAULT 4.5,
        reviews_count INTEGER DEFAULT 10,
        image_url TEXT NOT NULL,
        colors TEXT NOT NULL,
        variants TEXT NOT NULL,
        key_features TEXT NOT NULL,
        pros TEXT,
        cons TEXT,
        overview TEXT
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        car_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, car_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (car_id) REFERENCES cars(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS test_drives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        car_id TEXT NOT NULL,
        car_name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        city TEXT NOT NULL,
        preferred_date TEXT NOT NULL,
        preferred_time TEXT NOT NULL,
        dealer_location TEXT,
        status TEXT DEFAULT 'Confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        title TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lens_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_name TEXT NOT NULL,
        is_new INTEGER NOT NULL,
        condition_score REAL NOT NULL,
        estimated_min REAL NOT NULL,
        estimated_max REAL NOT NULL,
        currency TEXT DEFAULT 'INR',
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print('Database schema ready.')