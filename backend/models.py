from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    preferred_brands: Optional[List[str]] = []

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    username_or_email: str

class ResetPasswordRequest(BaseModel):
    username_or_email: str
    reset_code: str
    new_password: str = Field(..., min_length=6)

class TestDriveBooking(BaseModel):
    car_id: str
    car_name: str
    full_name: str
    phone: str
    email: str
    city: str
    preferred_date: str
    preferred_time: str
    dealer_location: Optional[str] = "Nearest Authorized Dealership"

class CarReviewCreate(BaseModel):
    car_id: str
    rating: int = Field(..., ge=1, le=5)
    title: str
    comment: str
    user_name: str
