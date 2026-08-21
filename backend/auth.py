import hashlib
import secrets
import sqlite3
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from database import get_db_connection

def hash_password(password: str, salt: str = None):
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return f"{salt}${hashed}", salt

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, hash_val = stored_hash.split('$', 1)
        check_hash = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
        return secrets.compare_digest(check_hash, hash_val)
    except Exception:
        return False

def register_user(username: str, email: str, password: str, full_name: str, phone: str = '', preferred_brands: list = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username.strip().lower(), email.strip().lower()))
    if cursor.fetchone():
        conn.close()
        return {"success": False, "message": "Username or Email already registered"}
        
    pwd_hash, _ = hash_password(password)
    brands_json = json.dumps(preferred_brands or [])
    
    sql = "INSERT INTO users (username, email, password_hash, full_name, phone, preferred_brands) VALUES (?, ?, ?, ?, ?, ?)"
    cursor.execute(sql, (username.strip().lower(), email.strip().lower(), pwd_hash, full_name.strip(), phone.strip(), brands_json))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": "Account created successfully!",
        "user": {
            "id": user_id,
            "username": username.strip().lower(),
            "email": email.strip().lower(),
            "full_name": full_name.strip(),
            "phone": phone.strip()
        },
        "token": f"tok_{secrets.token_hex(20)}"
    }

def login_user(username_or_email: str, password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query_str = username_or_email.strip().lower()
    cursor.execute("SELECT id, username, email, password_hash, full_name, phone, preferred_brands FROM users WHERE username = ? OR email = ?", (query_str, query_str))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return {"success": False, "message": "Invalid username/email or password"}
        
    if not verify_password(password, user["password_hash"]):
        return {"success": False, "message": "Invalid username/email or password"}
        
    return {
        "success": True,
        "message": "Login successful!",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "phone": user["phone"] or "",
            "preferred_brands": json.loads(user["preferred_brands"] or "[]")
        },
        "token": f"tok_{secrets.token_hex(20)}"
    }

def request_password_reset(username_or_email: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query_str = username_or_email.strip().lower()
    cursor.execute("SELECT id, username, email FROM users WHERE username = ? OR email = ?", (query_str, query_str))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return {"success": False, "message": "No account found with this username or email"}
        
    otp = str(secrets.randbelow(900000) + 100000)
    cursor.execute("UPDATE users SET reset_code = ? WHERE id = ?", (otp, user["id"]))
    conn.commit()
    conn.close()
    
    email_parts = user["email"].split("@")
    email_hint = f"{email_parts[0][:3]}***@{email_parts[1]}"
    
    return {
        "success": True,
        "message": "Verification code generated successfully.",
        "email_hint": email_hint,
        "demo_otp": otp
    }

def reset_password(username_or_email: str, reset_code: str, new_password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query_str = username_or_email.strip().lower()
    cursor.execute("SELECT id, username, email, reset_code FROM users WHERE username = ? OR email = ?", (query_str, query_str))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return {"success": False, "message": "User not found"}
        
    if not user["reset_code"] or user["reset_code"].strip() != reset_code.strip():
        conn.close()
        return {"success": False, "message": "Invalid or expired verification code"}
        
    new_hash, _ = hash_password(new_password)
    cursor.execute("UPDATE users SET password_hash = ?, reset_code = NULL WHERE id = ?", (new_hash, user["id"]))
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "message": "Password has been reset successfully! You can now log in with your new password."
    }
