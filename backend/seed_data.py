import json
import sqlite3
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from database import get_db_connection, init_db

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM cars')
    cursor.execute('DELETE FROM reviews')
    
    json_path = os.path.join(os.path.dirname(__file__), 'cars.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        cars = json.load(f)
        
    sql = '''
    INSERT INTO cars (
        id, brand, model, year, tagline, body_type, min_price, max_price, price_display,
        fuel_types, transmissions, mileage, engine, power, torque, seating,
        safety_rating, boot_space, ground_clearance, is_electric, is_new_launch,
        is_featured, rating, reviews_count, image_url, colors, variants,
        key_features, pros, cons, overview
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    '''
    
    for car in cars:
        cursor.execute(sql, (
            car['id'],
            car['brand'],
            car['model'],
            car['year'],
            car.get('tagline', ''),
            car['body_type'],
            car['min_price'],
            car['max_price'],
            car['price_display'],
            json.dumps(car['fuel_types']),
            json.dumps(car['transmissions']),
            car.get('mileage', ''),
            car.get('engine', ''),
            car.get('power', ''),
            car.get('torque', ''),
            car.get('seating', 5),
            car.get('safety_rating', ''),
            car.get('boot_space', ''),
            car.get('ground_clearance', ''),
            car.get('is_electric', 0),
            car.get('is_new_launch', 0),
            car.get('is_featured', 0),
            car.get('rating', 4.5),
            car.get('reviews_count', 10),
            car['image_url'],
            json.dumps(car.get('colors', [])),
            json.dumps(car.get('variants', [])),
            json.dumps(car.get('key_features', [])),
            json.dumps(car.get('pros', [])),
            json.dumps(car.get('cons', [])),
            car.get('overview', '')
        ))
        
        cursor.execute('''
        INSERT INTO reviews (car_id, user_name, rating, title, comment)
        VALUES (?, ?, ?, ?, ?)
        ''', (
            car['id'],
            'Rahul Sharma (Verified Owner)',
            5,
            'Best decision! Exceptional performance and build quality.',
            'Purchased 3 months ago. The cabin insulation and highway stability at 120 km/h is phenomenal. Mileage is very close to claimed numbers.'
        ))
        
        cursor.execute('''
        INSERT INTO reviews (car_id, user_name, rating, title, comment)
        VALUES (?, ?, ?, ?, ?)
        ''', (
            car['id'],
            'Priya Sundaram',
            4,
            'Super comfortable for family trips',
            'The rear seating space and boot capacity easily accommodated our family luggage. Infotainment screen and sound quality are top notch.'
        ))
        
    conn.commit()
    conn.close()
    print(f'Successfully populated {len(cars)} cars into SQLite cars.db')

if __name__ == '__main__':
    seed_database()
