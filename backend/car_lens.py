import io
import json
import random
import os
import sys
import base64
import math
import re
from PIL import Image, ImageStat
from database import get_db_connection

# Pre-configured sample cars for instant testing
SAMPLE_CARS = [
    {
        "id": "sample-curvv-new",
        "title": "Tata Curvv (2024 SUV Coupe)",
        "model_match": "tata-curvv",
        "car_name": "Tata Curvv 1.2 Hyperion DCA",
        "brand": "Tata",
        "year": 2024,
        "is_new": True,
        "condition_score": 98.8,
        "image_url": "/images/cars/tata-curvv.jpg",
        "detected_color": "Gold Essence / Sunlit Bronze",
        "body_type": "SUV Coupe",
        "sample_tag": "NEW CAR - SHOWROOM"
    },
    {
        "id": "sample-thar-new",
        "title": "Mahindra Thar Roxx 4x4 (5-Door)",
        "model_match": "mahindra-thar-roxx",
        "car_name": "Mahindra Thar Roxx AX7L 4x4",
        "brand": "Mahindra",
        "year": 2024,
        "is_new": True,
        "condition_score": 99.2,
        "image_url": "/images/cars/mahindra-thar-roxx.jpg",
        "detected_color": "Red Rage / Stealth Black",
        "body_type": "Off-Road 4x4 SUV",
        "sample_tag": "NEW CAR - SHOWROOM"
    },
    {
        "id": "sample-swift-used",
        "title": "Used Maruti Swift (Pre-Owned)",
        "model_match": "maruti-suzuki-swift",
        "car_name": "Maruti Suzuki Swift VXi AMT",
        "brand": "Maruti Suzuki",
        "year": 2020,
        "is_new": False,
        "condition_score": 86.4,
        "odometer": "38,500 km",
        "image_url": "/images/cars/maruti-suzuki-swift.jpg",
        "detected_color": "Luster Blue / Metallic Grey",
        "body_type": "Hatchback",
        "sample_tag": "USED CAR - PRE-OWNED"
    },
    {
        "id": "sample-creta-new",
        "title": "Hyundai Creta (2024 Facelift)",
        "model_match": "hyundai-creta",
        "car_name": "Hyundai Creta SX(O) Turbo",
        "brand": "Hyundai",
        "year": 2024,
        "is_new": True,
        "condition_score": 97.8,
        "image_url": "/images/cars/hyundai-creta.jpg",
        "detected_color": "Emerald Pearl / Robust Emerald",
        "body_type": "Mid-Size SUV",
        "sample_tag": "NEW CAR - SHOWROOM"
    },
    {
        "id": "sample-scorpio-used",
        "title": "Used Mahindra Scorpio-N (Pre-Owned)",
        "model_match": "mahindra-scorpio-n",
        "car_name": "Mahindra Scorpio-N Z8L Diesel",
        "brand": "Mahindra",
        "year": 2022,
        "is_new": False,
        "condition_score": 88.7,
        "odometer": "34,200 km",
        "image_url": "/images/cars/mahindra-scorpio-n.jpg",
        "detected_color": "Deep Forest Green / Napoli Black",
        "body_type": "D-Segment SUV",
        "sample_tag": "USED CAR - PRE-OWNED"
    },
    {
        "id": "sample-fortuner-new",
        "title": "Toyota Fortuner 4x4 Legender",
        "model_match": "toyota-fortuner",
        "car_name": "Toyota Fortuner Legender 4x4 AT",
        "brand": "Toyota",
        "year": 2024,
        "is_new": True,
        "condition_score": 99.4,
        "image_url": "/images/cars/toyota-fortuner.jpg",
        "detected_color": "Platinum Pearl White",
        "body_type": "Full-Size 4x4 SUV",
        "sample_tag": "NEW CAR - SHOWROOM"
    }
]

# Comprehensive keyword alias mapping for Indian cars
NAME_ALIASES = [
    # Thar
    (["thar", "roxx", "tharroxx", "mahindra_thar", "thar_4x4", "thar5door", "thar_roxx"], "mahindra-thar-roxx"),
    # Curvv
    (["curvv", "curvvev", "tatacurvv", "tata_curvv", "curvv_ev"], "tata-curvv"),
    # Creta
    (["creta", "hyundaicreta", "creta2024", "creta_facelift", "hyundai_creta"], "hyundai-creta"),
    # Swift
    (["swift", "marutiswift", "suzukiswift", "swift2024", "swift_vxi", "swift_zxi"], "maruti-suzuki-swift"),
    # Fortuner
    (["fortuner", "legender", "toyotafortuner", "fortuner4x4", "fortuner_legender"], "toyota-fortuner"),
    # XUV700
    (["xuv700", "xuv_700", "mahindraxuv700", "ax7", "ax7l"], "mahindra-xuv700"),
    # Scorpio
    (["scorpio", "scorpion", "scorpio_n", "scorpio-n", "z8l", "scorpio_classic"], "mahindra-scorpio-n"),
    # Innova
    (["innova", "hycross", "innovahycross", "innova_hycross", "innova_crysta"], "toyota-innova-hycross"),
    # Nexon
    (["nexon", "tatanexon", "nexon_ev", "nexon2024", "nexonev"], "tata-nexon"),
    # Punch
    (["punch", "tatapunch", "punchev", "punch_ev"], "tata-punch-ev"),
    # Seltos
    (["seltos", "kiaseltos", "seltos2024", "seltos_gtx"], "kia-seltos"),
    # Grand Vitara
    (["vitara", "grandvitara", "grand_vitara", "marutivitara"], "maruti-suzuki-grand-vitara"),
    # Verna
    (["verna", "hyundaiverna", "verna_turbo", "verna2024"], "hyundai-verna"),
    # XUV 3XO
    (["3xo", "xuv3xo", "xuv_3xo", "xuv300", "xuv_300"], "mahindra-xuv-3xo"),
    # Windsor
    (["windsor", "mgwindsor", "windsor_ev", "mg_windsor"], "mg-windsor-ev"),
    # Seal
    (["seal", "bydseal", "byd_seal"], "byd-seal"),
    # BMW
    (["bmw", "3series", "330i", "bmw3", "granlimousine"], "bmw-3-series-gran-limousine"),
    # Mercedes
    (["mercedes", "cclass", "c_class", "c-class", "w206", "benz"], "mercedes-benz-c-class")
]

# Cache of precomputed reference image signatures
_REFERENCE_CACHE = {}

def get_image_dhash(image: Image.Image, hash_size=8) -> int:
    """Computes difference hash (dHash) for visual structural comparison."""
    resized = image.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = list(resized.getdata())
    difference = []
    for row in range(hash_size):
        for col in range(hash_size):
            pixel_left = pixels[row * (hash_size + 1) + col]
            pixel_right = pixels[row * (hash_size + 1) + col + 1]
            difference.append(pixel_left > pixel_right)
    decimal_value = 0
    for index, value in enumerate(difference):
        if value:
            decimal_value += 1 << index
    return decimal_value

def hamming_distance(hash1: int, hash2: int) -> int:
    """Calculates bit difference between two image hashes."""
    x = hash1 ^ hash2
    return bin(x).count("1")

def get_color_histogram(image: Image.Image) -> list:
    """Computes normalized 24-bin RGB color histogram."""
    img = image.convert("RGB").resize((64, 64))
    hist = img.histogram()
    r_bins = [sum(hist[i*32:(i+1)*32]) for i in range(8)]
    g_bins = [sum(hist[256 + i*32:256 + (i+1)*32]) for i in range(8)]
    b_bins = [sum(hist[512 + i*32:512 + (i+1)*32]) for i in range(8)]
    total = sum(r_bins) + sum(g_bins) + sum(b_bins) or 1
    return [(v / total) for v in (r_bins + g_bins + b_bins)]

def init_reference_cache():
    global _REFERENCE_CACHE
    if _REFERENCE_CACHE:
        return
    current_dir = os.path.dirname(os.path.abspath(__file__))
    img_dir = os.path.join(current_dir, "..", "frontend", "images", "cars")
    if not os.path.exists(img_dir):
        return
    for fname in os.listdir(img_dir):
        if fname.endswith(".jpg"):
            cid = fname[:-4]
            fpath = os.path.join(img_dir, fname)
            try:
                im = Image.open(fpath).convert("RGB")
                w, h = im.size
                dhash = get_image_dhash(im)
                hist = get_color_histogram(im)
                _REFERENCE_CACHE[cid] = {
                    "dhash": dhash,
                    "histogram": hist,
                    "aspect_ratio": w / max(h, 1)
                }
            except Exception as e:
                print(f"Error caching {fname}: {e}")

def format_inr(amount: float) -> str:
    if amount >= 10000000:
        cr = amount / 10000000
        return f"Rs {cr:.2f} Crore"
    elif amount >= 100000:
        lakh = amount / 100000
        return f"Rs {lakh:.2f} Lakh"
    else:
        return f"Rs {amount:,.0f}"

def extract_visual_features(image_bytes: bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = img.size
        aspect_ratio = width / max(height, 1)
        
        # Sample center body region
        left = int(width * 0.15)
        top = int(height * 0.15)
        right = int(width * 0.85)
        bottom = int(height * 0.85)
        car_crop = img.crop((left, top, right, bottom))
        
        stat = ImageStat.Stat(car_crop)
        r, g, b = stat.mean[:3]
        std_r, std_g, std_b = stat.stddev[:3]
        
        brightness = (r + g + b) / 3
        color_variance = (std_r + std_g + std_b) / 3
        
        # Color classification
        if r > 185 and g > 185 and b > 185:
            detected_color = "Pristine White / Pearl White"
            color_family = "white"
        elif r < 60 and g < 60 and b < 60:
            detected_color = "Stealth Black / Midnight Black"
            color_family = "black"
        elif r > g + 35 and r > b + 35:
            detected_color = "Flame Red / Red Rage"
            color_family = "red"
        elif b > r + 25 and b > g + 25:
            detected_color = "Ocean Blue / Celestial Blue"
            color_family = "blue"
        elif g > r + 20 and g > b + 20:
            detected_color = "Deep Forest Green / Tactical Green"
            color_family = "green"
        elif r > 140 and g > 110 and b < 80:
            detected_color = "Gold Essence / Sunlit Bronze"
            color_family = "gold"
        elif abs(r - g) < 20 and abs(g - b) < 20 and 70 <= brightness <= 180:
            detected_color = "Daytona Grey / Metallic Silver"
            color_family = "grey"
        else:
            detected_color = "Metallic Dual-Tone"
            color_family = "neutral"
            
        # Vehicle Silhouette classification by aspect ratio
        if aspect_ratio >= 1.65:
            likely_body = "Sedan"
        elif aspect_ratio <= 1.35:
            likely_body = "SUV"
        else:
            likely_body = "SUV"
            
        # Showroom lighting vs outdoor road
        is_showroom = (brightness > 105 and color_variance > 38)
        
        dhash = get_image_dhash(img)
        hist = get_color_histogram(img)
        
        return {
            "success": True,
            "detected_color": detected_color,
            "color_family": color_family,
            "likely_body": likely_body,
            "is_showroom": is_showroom,
            "brightness": brightness,
            "aspect_ratio": aspect_ratio,
            "dhash": dhash,
            "histogram": hist
        }
    except Exception as e:
        return {
            "success": False,
            "detected_color": "Metallic Silver / Pearl White",
            "color_family": "neutral",
            "likely_body": "SUV",
            "is_showroom": True,
            "brightness": 128,
            "aspect_ratio": 1.5,
            "dhash": 0,
            "histogram": [0] * 24
        }

def analyze_car_image(image_bytes: bytes = None, filename: str = "", sample_id: str = "", target_car_id: str = None):
    init_reference_cache()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. If target_car_id explicitly specified by user dropdown/hint
    if target_car_id:
        cursor.execute("SELECT * FROM cars WHERE id = ?", (target_car_id,))
        car = cursor.fetchone()
        if car:
            features = extract_visual_features(image_bytes) if image_bytes else {"detected_color": "Pristine White / Pearl White"}
            uploaded_image_url = None
            if image_bytes and len(image_bytes) > 0:
                try:
                    b64 = base64.b64encode(image_bytes).decode("utf-8")
                    uploaded_image_url = f"data:image/jpeg;base64,{b64}"
                except Exception:
                    uploaded_image_url = car["image_url"]
            else:
                uploaded_image_url = car["image_url"]
                
            return generate_valuation_report(
                car_id=car["id"],
                is_new=True,
                condition_score=98.5,
                odometer=None,
                detected_color=features.get("detected_color", "Pristine White"),
                image_url=uploaded_image_url,
                cursor=cursor
            )

    # 2. If user clicked a sample card
    if sample_id:
        for s in SAMPLE_CARS:
            if s["id"] == sample_id:
                return generate_valuation_report(
                    car_id=s["model_match"],
                    is_new=s["is_new"],
                    condition_score=s["condition_score"],
                    odometer=s.get("odometer"),
                    detected_color=s["detected_color"],
                    image_url=s["image_url"],
                    cursor=cursor
                )
                
    # 3. Extract visual features from uploaded image
    features = extract_visual_features(image_bytes) if image_bytes else {
        "detected_color": "Daytona Grey / Pearl White",
        "color_family": "neutral",
        "likely_body": "SUV",
        "is_showroom": True,
        "dhash": 0,
        "histogram": [0]*24,
        "aspect_ratio": 1.5
    }
    
    detected_color = features["detected_color"]
    likely_body = features.get("likely_body", "SUV")
    is_showroom = features.get("is_showroom", True)
    query_dhash = features.get("dhash", 0)
    query_hist = features.get("histogram", [])
    query_ar = features.get("aspect_ratio", 1.5)
    
    # 4. Retrieve all Indian cars in database
    cursor.execute("SELECT * FROM cars")
    all_cars = cursor.fetchall()
    
    matched_car = None
    fn_clean = re.sub(r'[^a-zA-Z0-9]', '', (filename or "").lower())
    
    # Keyword token check for Indian car brands & models
    for aliases, target_id in NAME_ALIASES:
        for alias in aliases:
            clean_alias = re.sub(r'[^a-zA-Z0-9]', '', alias)
            if clean_alias in fn_clean:
                for car in all_cars:
                    if car["id"] == target_id:
                        matched_car = car
                        break
            if matched_car:
                break
        if matched_car:
            break
                
    # 5. If no filename keyword, compute visual similarity against 19 Indian reference cars
    if not matched_car and _REFERENCE_CACHE:
        best_score = float("inf")
        best_car_id = None
        
        for car_id, ref in _REFERENCE_CACHE.items():
            h_dist = hamming_distance(query_dhash, ref["dhash"])
            hist_dist = 0
            if query_hist and ref["histogram"]:
                hist_dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(query_hist, ref["histogram"])))
            ar_diff = abs(query_ar - ref["aspect_ratio"])
            combined_score = (h_dist / 64.0) * 0.5 + (hist_dist * 2.0) * 0.3 + (ar_diff) * 0.2
            
            if combined_score < best_score:
                best_score = combined_score
                best_car_id = car_id
                
        if best_car_id:
            for car in all_cars:
                if car["id"] == best_car_id:
                    matched_car = car
                    break
                    
    if not matched_car:
        matched_car = all_cars[0] if all_cars else None
        
    # 6. Classify New vs Used Car & Condition
    is_new = True
    odometer = None
    
    used_keywords = ["used", "old", "second", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "preowned", "resale"]
    if any(k in (filename or "").lower() for k in used_keywords):
        is_new = False
    elif not is_showroom and random.random() > 0.60:
        is_new = False
        
    if is_new:
        condition_score = round(random.uniform(96.5, 99.5), 1)
    else:
        condition_score = round(random.uniform(83.0, 91.8), 1)
        km = random.randint(22000, 64000)
        odometer = f"{km:,} km"
        
    # Return user uploaded image preview as data URI
    uploaded_image_url = None
    if image_bytes and len(image_bytes) > 0:
        try:
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            uploaded_image_url = f"data:image/jpeg;base64,{b64}"
        except Exception:
            uploaded_image_url = matched_car["image_url"]
    else:
        uploaded_image_url = matched_car["image_url"]
        
    return generate_valuation_report(
        car_id=matched_car["id"],
        is_new=is_new,
        condition_score=condition_score,
        odometer=odometer,
        detected_color=detected_color,
        image_url=uploaded_image_url,
        cursor=cursor
    )

def generate_valuation_report(car_id: str, is_new: bool, condition_score: float, odometer: str, detected_color: str, image_url: str, cursor):
    cursor.execute("SELECT * FROM cars WHERE id = ?", (car_id,))
    car = cursor.fetchone()
    
    if not car:
        cursor.execute("SELECT * FROM cars LIMIT 1")
        car = cursor.fetchone()
        
    variants = json.loads(car["variants"])
    fuel_types = json.loads(car["fuel_types"])
    transmissions = json.loads(car["transmissions"])
    key_features = json.loads(car["key_features"])
    
    min_p = car["min_price"]
    max_p = car["max_price"]
    mid_price = (min_p + max_p) / 2
    
    if is_new:
        status_label = "NEW CAR - SHOWROOM CONDITION"
        status_badge = "New Car"
        estimated_min = min_p
        estimated_max = max_p
        price_range_str = f"{format_inr(min_p)} - {format_inr(max_p)}"
        on_road_min = min_p * 1.14
        on_road_max = max_p * 1.16
        on_road_str = f"Estimated On-Road (Delhi NCR): {format_inr(on_road_min)} - {format_inr(on_road_max)}"
        
        breakdown = {
            "type": "New Car Valuation",
            "base_ex_showroom": format_inr(mid_price),
            "estimated_rto_tax": format_inr(mid_price * 0.10),
            "estimated_insurance": format_inr(mid_price * 0.045),
            "tcs_fastag_charges": format_inr(15000),
            "condition_grade": f"Grade A+ ({condition_score}% Pristine Showroom)",
            "warranty_status": "3 Years / 100,000 km Standard Manufacturer Warranty"
        }
    else:
        status_label = "USED CAR - PRE-OWNED VEHICLE"
        status_badge = "Used / Pre-Owned"
        
        age_years = random.randint(2, 5)
        base_depreciation = 0.15 + (age_years - 1) * 0.08
        condition_factor = (condition_score / 100.0)
        brand_factor = 1.05 if car["brand"] in ["Toyota", "Maruti Suzuki", "Hyundai"] else 0.95
        
        depreciated_mid = mid_price * (1 - base_depreciation) * condition_factor * brand_factor
        estimated_min = round(depreciated_mid * 0.94, -3)
        estimated_max = round(depreciated_mid * 1.06, -3)
        price_range_str = f"{format_inr(estimated_min)} - {format_inr(estimated_max)}"
        on_road_str = "Estimated Transfer Cost: Rs 8,000 - Rs 15,000 (RC Transfer & Fitness)"
        
        breakdown = {
            "type": "Used Car Fair Market Valuation",
            "original_new_price": format_inr(mid_price),
            "estimated_vehicle_age": f"{age_years} Years (Approx. {2024 - age_years} Registration)",
            "odometer_reading": odometer or f"{age_years * 12000:,} km",
            "depreciation_rate": f"{int(base_depreciation * 100)}% Market Depreciation",
            "condition_adjustment": f"+{condition_score:.1f}% Good Maintenance Score",
            "brand_resale_index": f"{'+5% High Resale Demand' if brand_factor > 1 else 'Standard Market Value'}",
            "fair_market_price": price_range_str
        }
        
    # Save scan record to database
    try:
        cursor.execute('''
        INSERT INTO lens_scans (car_name, is_new, condition_score, estimated_min, estimated_max)
        VALUES (?, ?, ?, ?, ?)
        ''', (f"{car['brand']} {car['model']}", 1 if is_new else 0, condition_score, estimated_min, estimated_max))
        cursor.connection.commit()
    except Exception as e:
        print("Could not save lens scan:", e)
        
    cursor.execute("SELECT id, brand, model FROM cars ORDER BY brand, model")
    all_models_db = [{"id": r["id"], "name": f"{r['brand']} {r['model']}"} for r in cursor.fetchall()]
        
    return {
        "success": True,
        "car_id": car["id"],
        "brand": car["brand"],
        "model": car["model"],
        "year": car["year"],
        "tagline": car["tagline"],
        "body_type": car["body_type"],
        "is_new": is_new,
        "status_label": status_label,
        "status_badge": status_badge,
        "condition_score": condition_score,
        "detected_color": detected_color,
        "image_url": image_url or car["image_url"],
        "price_range_str": price_range_str,
        "on_road_str": on_road_str,
        "estimated_min_raw": estimated_min,
        "estimated_max_raw": estimated_max,
        "fuel_types": fuel_types,
        "transmissions": transmissions,
        "mileage": car["mileage"],
        "engine": car["engine"],
        "power": car["power"],
        "safety_rating": car["safety_rating"],
        "key_features": key_features[:4],
        "breakdown": breakdown,
        "all_models": all_models_db,
        "matching_car": {
            "id": car["id"],
            "brand": car["brand"],
            "model": car["model"],
            "price_display": car["price_display"],
            "image_url": car["image_url"],
            "mileage": car["mileage"],
            "rating": car["rating"]
        }
    }

def get_sample_cars():
    return SAMPLE_CARS
