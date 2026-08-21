import json
import os
import sys
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

sys.path.insert(0, os.path.dirname(__file__))
from database import get_db_connection, init_db
from models import UserRegister, UserLogin, ForgotPasswordRequest, ResetPasswordRequest, TestDriveBooking, CarReviewCreate
import auth
import car_lens

app = FastAPI(title="CarWale AI Portal API", version="2.0.0")

# Enable CORS for easy local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# ==================== CARS API ====================

@app.get("/api/cars")
def get_cars(
    q: Optional[str] = None,
    search: Optional[str] = None,
    brand: Optional[str] = None,
    body_type: Optional[str] = None,
    fuel_type: Optional[str] = None,
    transmission: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    seating: Optional[int] = None,
    is_electric: Optional[int] = None,
    is_new_launch: Optional[int] = None,
    is_featured: Optional[int] = None,
    sort_by: Optional[str] = "popularity"
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM cars WHERE 1=1"
    params = []
    
    search_q = q or search
    if search_q and search_q.strip():
        search_term = f"%{search_q.strip().lower()}%"
        query += " AND (LOWER(brand) LIKE ? OR LOWER(model) LIKE ? OR LOWER(body_type) LIKE ? OR LOWER(tagline) LIKE ? OR LOWER(fuel_types) LIKE ? OR LOWER(key_features) LIKE ?)"
        params.extend([search_term, search_term, search_term, search_term, search_term, search_term])
        
    if brand and brand.strip() and brand.lower() != "all":
        query += " AND LOWER(brand) = ?"
        params.append(brand.strip().lower())
        
    if body_type and body_type.strip() and body_type.lower() != "all":
        query += " AND LOWER(body_type) LIKE ?"
        params.append(f"%{body_type.strip().lower()}%")
        
    if fuel_type and fuel_type.strip() and fuel_type.lower() != "all":
        query += " AND LOWER(fuel_types) LIKE ?"
        params.append(f"%{fuel_type.strip().lower()}%")
        
    if transmission and transmission.strip() and transmission.lower() != "all":
        query += " AND LOWER(transmissions) LIKE ?"
        params.append(f"%{transmission.strip().lower()}%")
        
    if min_price is not None and min_price > 0:
        query += " AND max_price >= ?"
        params.append(min_price)
        
    if max_price is not None and max_price > 0:
        query += " AND min_price <= ?"
        params.append(max_price)
        
    if seating is not None and seating > 0:
        query += " AND seating = ?"
        params.append(seating)
        
    if is_electric is not None:
        query += " AND is_electric = ?"
        params.append(is_electric)
        
    if is_new_launch is not None:
        query += " AND is_new_launch = ?"
        params.append(is_new_launch)
        
    if is_featured is not None:
        query += " AND is_featured = ?"
        params.append(is_featured)
        
    # Sorting
    if sort_by == "price_asc":
        query += " ORDER BY min_price ASC"
    elif sort_by == "price_desc":
        query += " ORDER BY min_price DESC"
    elif sort_by == "rating":
        query += " ORDER BY rating DESC"
    elif sort_by == "newest":
        query += " ORDER BY year DESC, is_new_launch DESC"
    else: # popularity / default
        query += " ORDER BY is_featured DESC, rating DESC, reviews_count DESC"
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    cars = []
    for r in rows:
        cars.append({
            "id": r["id"],
            "brand": r["brand"],
            "model": r["model"],
            "year": r["year"],
            "tagline": r["tagline"],
            "body_type": r["body_type"],
            "min_price": r["min_price"],
            "max_price": r["max_price"],
            "price_display": r["price_display"],
            "fuel_types": json.loads(r["fuel_types"]),
            "transmissions": json.loads(r["transmissions"]),
            "mileage": r["mileage"],
            "engine": r["engine"],
            "power": r["power"],
            "torque": r["torque"],
            "seating": r["seating"],
            "safety_rating": r["safety_rating"],
            "boot_space": r["boot_space"],
            "ground_clearance": r["ground_clearance"],
            "is_electric": bool(r["is_electric"]),
            "is_new_launch": bool(r["is_new_launch"]),
            "is_featured": bool(r["is_featured"]),
            "rating": r["rating"],
            "reviews_count": r["reviews_count"],
            "image_url": r["image_url"],
            "colors": json.loads(r["colors"]),
            "variants": json.loads(r["variants"]),
            "key_features": json.loads(r["key_features"])
        })
        
    return {"total": len(cars), "cars": cars}

@app.get("/api/cars/featured")
def get_featured_cars():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cars WHERE is_featured = 1 OR is_new_launch = 1 ORDER BY rating DESC LIMIT 8")
    rows = cursor.fetchall()
    conn.close()
    
    cars = []
    for r in rows:
        cars.append({
            "id": r["id"],
            "brand": r["brand"],
            "model": r["model"],
            "year": r["year"],
            "tagline": r["tagline"],
            "body_type": r["body_type"],
            "min_price": r["min_price"],
            "max_price": r["max_price"],
            "price_display": r["price_display"],
            "fuel_types": json.loads(r["fuel_types"]),
            "transmissions": json.loads(r["transmissions"]),
            "mileage": r["mileage"],
            "power": r["power"],
            "safety_rating": r["safety_rating"],
            "is_electric": bool(r["is_electric"]),
            "is_new_launch": bool(r["is_new_launch"]),
            "rating": r["rating"],
            "image_url": r["image_url"]
        })
    return {"cars": cars}

@app.get("/api/cars/meta/brands")
def get_brands():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT brand, COUNT(*) as count FROM cars GROUP BY brand ORDER BY count DESC")
    rows = cursor.fetchall()
    conn.close()
    return [{"brand": r["brand"], "count": r["count"]} for r in rows]

@app.get("/api/cars/compare")
def compare_cars_get(car_ids: Optional[str] = Query(None)):
    if not car_ids:
        return {"comparison": [], "cars": []}
    ids = [i.strip() for i in car_ids.split(",") if i.strip()]
    return _do_compare(ids)

@app.post("/api/cars/compare")
def compare_cars_post(car_ids: List[str]):
    return _do_compare(car_ids)

def _do_compare(car_ids: List[str]):
    if not car_ids:
        return {"comparison": [], "cars": []}
        
    conn = get_db_connection()
    cursor = conn.cursor()
    placeholders = ",".join("?" * len(car_ids))
    cursor.execute(f"SELECT * FROM cars WHERE id IN ({placeholders})", car_ids)
    rows = cursor.fetchall()
    conn.close()
    
    comparison = []
    for r in rows:
        comparison.append({
            "id": r["id"],
            "brand": r["brand"],
            "model": r["model"],
            "price_display": r["price_display"],
            "min_price": r["min_price"],
            "max_price": r["max_price"],
            "body_type": r["body_type"],
            "fuel_types": json.loads(r["fuel_types"]),
            "transmissions": json.loads(r["transmissions"]),
            "mileage": r["mileage"],
            "engine": r["engine"],
            "power": r["power"],
            "torque": r["torque"],
            "seating": r["seating"],
            "safety_rating": r["safety_rating"],
            "boot_space": r["boot_space"],
            "ground_clearance": r["ground_clearance"],
            "rating": r["rating"],
            "image_url": r["image_url"],
            "key_features": json.loads(r["key_features"])
        })
    return {"comparison": comparison, "cars": comparison}

@app.get("/api/cars/{car_id}")
def get_car_detail(car_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cars WHERE id = ?", (car_id,))
    r = cursor.fetchone()
    
    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail="Car not found")
        
    cursor.execute("SELECT * FROM reviews WHERE car_id = ? ORDER BY created_at DESC", (car_id,))
    review_rows = cursor.fetchall()
    conn.close()
    
    reviews = []
    for rev in review_rows:
        reviews.append({
            "id": rev["id"],
            "user_name": rev["user_name"],
            "rating": rev["rating"],
            "title": rev["title"],
            "comment": rev["comment"],
            "created_at": rev["created_at"]
        })
        
    return {
        "id": r["id"],
        "brand": r["brand"],
        "model": r["model"],
        "year": r["year"],
        "tagline": r["tagline"],
        "body_type": r["body_type"],
        "min_price": r["min_price"],
        "max_price": r["max_price"],
        "price_display": r["price_display"],
        "fuel_types": json.loads(r["fuel_types"]),
        "transmissions": json.loads(r["transmissions"]),
        "mileage": r["mileage"],
        "engine": r["engine"],
        "power": r["power"],
        "torque": r["torque"],
        "seating": r["seating"],
        "safety_rating": r["safety_rating"],
        "boot_space": r["boot_space"],
        "ground_clearance": r["ground_clearance"],
        "is_electric": bool(r["is_electric"]),
        "is_new_launch": bool(r["is_new_launch"]),
        "is_featured": bool(r["is_featured"]),
        "rating": r["rating"],
        "reviews_count": r["reviews_count"],
        "image_url": r["image_url"],
        "colors": json.loads(r["colors"]),
        "variants": json.loads(r["variants"]),
        "key_features": json.loads(r["key_features"]),
        "pros": json.loads(r["pros"] or "[]"),
        "cons": json.loads(r["cons"] or "[]"),
        "overview": r["overview"],
        "reviews": reviews
    }

@app.post("/api/cars/{car_id}/reviews")
def add_car_review(car_id: str, review: CarReviewCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO reviews (car_id, user_name, rating, title, comment)
    VALUES (?, ?, ?, ?, ?)
    ''', (car_id, review.user_name, review.rating, review.title, review.comment))
    
    # Update reviews count
    cursor.execute("UPDATE cars SET reviews_count = reviews_count + 1 WHERE id = ?", (car_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Review submitted successfully!"}

# ==================== AUTH API ====================

@app.post("/api/auth/register")
def register(user_data: UserRegister):
    res = auth.register_user(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        phone=user_data.phone or "",
        preferred_brands=user_data.preferred_brands or []
    )
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@app.post("/api/auth/login")
def login(login_data: UserLogin):
    res = auth.login_user(login_data.username_or_email, login_data.password)
    if not res["success"]:
        raise HTTPException(status_code=401, detail=res["message"])
    return res

@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    res = auth.request_password_reset(req.username_or_email)
    if not res["success"]:
        raise HTTPException(status_code=404, detail=res["message"])
    return res

@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    res = auth.reset_password(req.username_or_email, req.reset_code, req.new_password)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res

# ==================== CAR LENS (AI IMAGE DETECTOR & VALUATION) ====================

@app.get("/api/lens/samples")
def get_lens_samples():
    return {"samples": car_lens.get_sample_cars()}

from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Depends, Request
import base64

@app.post("/api/lens/analyze")
async def analyze_lens_image(
    request: Request,
    file: Optional[UploadFile] = File(None),
    sample_id: Optional[str] = Form(None),
    car_id: Optional[str] = Form(None),
    model_hint: Optional[str] = Form(None)
):
    image_bytes = None
    filename = ""
    target_sample_id = sample_id
    target_car_id = car_id or model_hint
    
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            target_sample_id = body.get("sample_id") or target_sample_id
            target_car_id = body.get("car_id") or body.get("model_hint") or target_car_id
            if body.get("image_base64"):
                b64_str = body["image_base64"]
                if "," in b64_str:
                    b64_str = b64_str.split(",")[1]
                try:
                    image_bytes = base64.b64decode(b64_str)
                except Exception:
                    pass
        except Exception:
            pass
            
    if file:
        image_bytes = await file.read()
        filename = file.filename
        
    result = car_lens.analyze_car_image(
        image_bytes=image_bytes, 
        filename=filename, 
        sample_id=target_sample_id,
        target_car_id=target_car_id
    )
    return result

@app.get("/api/lens/history")
def get_lens_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lens_scans ORDER BY scanned_at DESC LIMIT 10")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "car_name": r["car_name"], "is_new": bool(r["is_new"]), "condition_score": r["condition_score"], "estimated_min": r["estimated_min"], "estimated_max": r["estimated_max"], "scanned_at": r["scanned_at"]} for r in rows]

# ==================== TEST DRIVE & SAVED CARS ====================

@app.post("/api/user/test-drive")
def book_test_drive(booking: TestDriveBooking):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO test_drives (car_id, car_name, full_name, phone, email, city, preferred_date, preferred_time, dealer_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (booking.car_id, booking.car_name, booking.full_name, booking.phone, booking.email, booking.city, booking.preferred_date, booking.preferred_time, booking.dealer_location))
    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "success": True,
        "booking_id": f"TD-{booking_id:04d}",
        "message": f"Test Drive confirmed for {booking.car_name} in {booking.city}! Dealer executive will call you within 2 business hours."
    }

# ==================== STATIC FRONTEND SERVING ====================

frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/css", StaticFiles(directory=os.path.join(frontend_dir, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(frontend_dir, "js")), name="js")
    images_dir = os.path.join(frontend_dir, "images")
    if os.path.exists(images_dir):
        app.mount("/images", StaticFiles(directory=images_dir), name="images")
    
    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    print("Starting CarWale AI Portal on http://127.0.0.1:8000 ...")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
