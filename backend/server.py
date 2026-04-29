from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ.get("JWT_SECRET", "iraqchi-store-secret-2026-production")
JWT_ALGO = "HS256"
ADMIN_EMAIL = "ghhh8326@gmail.com"
SUPPORT_EMAIL = "ejjkio3@gmail.com"
WHATSAPP_NUMBER = "9647747742908"

app = FastAPI(title="Iraqchi Store API")
api_router = APIRouter(prefix="/api")


# ============ MODELS ============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionIn(BaseModel):
    session_id: str


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_admin: bool = False
    auth_provider: str = "email"
    created_at: datetime


class ProductVariant(BaseModel):
    sizes: List[str] = []
    colors: List[str] = []


class ProductIn(BaseModel):
    name_ar: str
    name_en: str
    description_ar: str = ""
    description_en: str = ""
    price_iqd: float
    category: str
    image_url: str
    images: List[str] = []
    stock: int = 0
    sizes: List[str] = []
    colors: List[str] = []
    is_dropship: bool = False
    alibaba_link: Optional[str] = None
    low_stock_threshold: int = 5


class Product(ProductIn):
    product_id: str
    created_at: datetime


class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: Optional[str] = None
    color: Optional[str] = None


class OrderIn(BaseModel):
    items: List[CartItem]
    customer_name: str
    customer_phone: str
    customer_address: str
    customer_city: str
    customer_country: str = "Iraq"
    notes: Optional[str] = None
    discount_code: Optional[str] = None


class OrderItem(BaseModel):
    product_id: str
    name_ar: str
    name_en: str
    price_iqd: float
    quantity: int
    size: Optional[str] = None
    color: Optional[str] = None
    image_url: str


class Order(BaseModel):
    order_id: str
    user_id: Optional[str] = None
    items: List[OrderItem]
    subtotal_iqd: float
    discount_iqd: float = 0
    total_iqd: float
    customer_name: str
    customer_phone: str
    customer_address: str
    customer_city: str
    customer_country: str
    notes: Optional[str] = None
    discount_code: Optional[str] = None
    payment_method: str = "cod"
    status: str = "pending"
    created_at: datetime


class DiscountIn(BaseModel):
    code: str
    percent: float
    active: bool = True
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = None


class Discount(DiscountIn):
    discount_id: str
    uses: int = 0
    created_at: datetime


# ============ HELPERS ============
def hash_password(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()


def verify_password(pwd: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pwd.encode(), hashed.encode())
    except Exception:
        return False


def make_jwt(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.replace("Bearer ", "")
    # First try as JWT
    user_id = None
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = decoded.get("user_id")
    except jwt.PyJWTError:
        # Try as Emergent session_token
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if not session:
            raise HTTPException(401, "Invalid token")
        expires_at = session["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(401, "Session expired")
        user_id = session["user_id"]
    if not user_id:
        raise HTTPException(401, "Invalid token")
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(401, "User not found")
    return User(**user_doc)


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403, "Admin only")
    return user


# ============ AUTH ROUTES ============
@api_router.post("/auth/register")
async def register(data: RegisterIn):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    is_admin = data.email.lower() == ADMIN_EMAIL.lower()
    doc = {
        "user_id": user_id,
        "email": data.email.lower(),
        "name": data.name,
        "password_hash": hash_password(data.password),
        "is_admin": is_admin,
        "auth_provider": "email",
        "picture": None,
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(doc)
    token = make_jwt(user_id)
    return {
        "token": token,
        "user": User(**{k: v for k, v in doc.items() if k != "password_hash"}).dict(),
    }


@api_router.post("/auth/login")
async def login(data: LoginIn):
    user_doc = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(401, "Invalid credentials")
    if not verify_password(data.password, user_doc["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_jwt(user_doc["user_id"])
    user_doc.pop("password_hash", None)
    return {"token": token, "user": User(**user_doc).dict()}


@api_router.post("/auth/google/session")
async def google_session(data: GoogleSessionIn):
    # Call Emergent Auth
    async with httpx.AsyncClient() as http:
        resp = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id},
        )
    if resp.status_code != 200:
        raise HTTPException(401, "Invalid Google session")
    payload = resp.json()
    email = payload["email"].lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    is_admin = email == ADMIN_EMAIL.lower()
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": payload.get("name"), "picture": payload.get("picture"), "is_admin": is_admin}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one(
            {
                "user_id": user_id,
                "email": email,
                "name": payload.get("name", ""),
                "picture": payload.get("picture"),
                "is_admin": is_admin,
                "auth_provider": "google",
                "created_at": datetime.now(timezone.utc),
            }
        )
    # Store session
    session_token = payload["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one(
        {
            "session_token": session_token,
            "user_id": user_id,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        }
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user_doc.pop("password_hash", None)
    return {"token": session_token, "user": User(**user_doc).dict()}


@api_router.get("/auth/me")
async def me(user: User = Depends(get_current_user)):
    return user.dict()


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        await db.user_sessions.delete_one({"session_token": token})
    return {"ok": True}


# ============ PRODUCT ROUTES ============
@api_router.get("/products")
async def list_products(category: Optional[str] = None, search: Optional[str] = None):
    q = {}
    if category:
        q["category"] = category
    if search:
        q["$or"] = [
            {"name_ar": {"$regex": search, "$options": "i"}},
            {"name_en": {"$regex": search, "$options": "i"}},
        ]
    cursor = db.products.find(q, {"_id": 0}).sort("created_at", -1)
    products = await cursor.to_list(500)
    return products


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    doc = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product not found")
    return doc


@api_router.post("/products")
async def create_product(data: ProductIn, user: User = Depends(require_admin)):
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    doc = data.dict()
    doc["product_id"] = product_id
    doc["created_at"] = datetime.now(timezone.utc)
    await db.products.insert_one(doc.copy())
    saved = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return saved


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductIn, user: User = Depends(require_admin)):
    update = data.dict()
    res = await db.products.update_one({"product_id": product_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Product not found")
    saved = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return saved


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: User = Depends(require_admin)):
    res = await db.products.delete_one({"product_id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Product not found")
    return {"ok": True}


@api_router.get("/categories")
async def categories():
    return [
        {"id": "clothing", "name_ar": "الملابس", "name_en": "Clothing", "icon": "shirt-outline"},
        {"id": "electronics", "name_ar": "الإلكترونيات", "name_en": "Electronics", "icon": "phone-portrait-outline"},
        {"id": "appliances", "name_ar": "الأجهزة الكهربائية", "name_en": "Appliances", "icon": "tv-outline"},
        {"id": "home", "name_ar": "المستلزمات المنزلية", "name_en": "Home Goods", "icon": "home-outline"},
        {"id": "kitchen", "name_ar": "أدوات المطبخ", "name_en": "Kitchenware", "icon": "restaurant-outline"},
        {"id": "toys", "name_ar": "ألعاب الأطفال", "name_en": "Children's Toys", "icon": "game-controller-outline"},
    ]


# ============ DISCOUNT ROUTES ============
@api_router.post("/discounts")
async def create_discount(data: DiscountIn, user: User = Depends(require_admin)):
    existing = await db.discounts.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(400, "Code already exists")
    doc = data.dict()
    doc["code"] = data.code.upper()
    doc["discount_id"] = f"disc_{uuid.uuid4().hex[:10]}"
    doc["uses"] = 0
    doc["created_at"] = datetime.now(timezone.utc)
    await db.discounts.insert_one(doc.copy())
    saved = await db.discounts.find_one({"discount_id": doc["discount_id"]}, {"_id": 0})
    return saved


@api_router.get("/discounts")
async def list_discounts(user: User = Depends(require_admin)):
    docs = await db.discounts.find({}, {"_id": 0}).to_list(200)
    return docs


@api_router.delete("/discounts/{discount_id}")
async def delete_discount(discount_id: str, user: User = Depends(require_admin)):
    await db.discounts.delete_one({"discount_id": discount_id})
    return {"ok": True}


@api_router.get("/discounts/validate/{code}")
async def validate_discount(code: str):
    doc = await db.discounts.find_one({"code": code.upper(), "active": True}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Invalid code")
    if doc.get("expires_at"):
        exp = doc["expires_at"]
        if isinstance(exp, str):
            exp = datetime.fromisoformat(exp)
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise HTTPException(400, "Code expired")
    if doc.get("max_uses") and doc.get("uses", 0) >= doc["max_uses"]:
        raise HTTPException(400, "Code limit reached")
    return {"code": doc["code"], "percent": doc["percent"]}


# ============ ORDER ROUTES ============
@api_router.post("/orders")
async def create_order(data: OrderIn, authorization: Optional[str] = Header(None)):
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            user = await get_current_user(authorization)
            user_id = user.user_id
        except HTTPException:
            user_id = None

    items_full: List[OrderItem] = []
    subtotal = 0.0
    low_stock_alerts = []
    for ci in data.items:
        prod = await db.products.find_one({"product_id": ci.product_id}, {"_id": 0})
        if not prod:
            raise HTTPException(400, f"Product {ci.product_id} not found")
        if prod["stock"] < ci.quantity:
            raise HTTPException(400, f"Insufficient stock for {prod['name_en']}")
        items_full.append(
            OrderItem(
                product_id=prod["product_id"],
                name_ar=prod["name_ar"],
                name_en=prod["name_en"],
                price_iqd=prod["price_iqd"],
                quantity=ci.quantity,
                size=ci.size,
                color=ci.color,
                image_url=prod["image_url"],
            )
        )
        subtotal += prod["price_iqd"] * ci.quantity
        new_stock = prod["stock"] - ci.quantity
        await db.products.update_one({"product_id": prod["product_id"]}, {"$set": {"stock": new_stock}})
        if new_stock <= prod.get("low_stock_threshold", 5):
            low_stock_alerts.append({"product_id": prod["product_id"], "name_en": prod["name_en"], "stock": new_stock})

    discount_amount = 0.0
    if data.discount_code:
        disc = await db.discounts.find_one({"code": data.discount_code.upper(), "active": True}, {"_id": 0})
        if disc:
            discount_amount = subtotal * (disc["percent"] / 100.0)
            await db.discounts.update_one({"code": disc["code"]}, {"$inc": {"uses": 1}})

    total = subtotal - discount_amount
    order_id = f"ord_{uuid.uuid4().hex[:10].upper()}"
    order_doc = {
        "order_id": order_id,
        "user_id": user_id,
        "items": [i.dict() for i in items_full],
        "subtotal_iqd": subtotal,
        "discount_iqd": discount_amount,
        "total_iqd": total,
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_address": data.customer_address,
        "customer_city": data.customer_city,
        "customer_country": data.customer_country,
        "notes": data.notes,
        "discount_code": data.discount_code,
        "payment_method": "cod",
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
    }
    await db.orders.insert_one(order_doc.copy())
    saved = await db.orders.find_one({"order_id": order_id}, {"_id": 0})

    # Build WhatsApp link
    items_text = "\n".join(
        [f"- {i.name_ar} × {i.quantity} ({int(i.price_iqd):,} د.ع)" for i in items_full]
    )
    wa_message = (
        f"طلب جديد - عراقچي ستور\n"
        f"رقم الطلب: {order_id}\n"
        f"الزبون: {data.customer_name}\n"
        f"الهاتف: {data.customer_phone}\n"
        f"العنوان: {data.customer_address}, {data.customer_city}, {data.customer_country}\n"
        f"المنتجات:\n{items_text}\n"
        f"المجموع: {int(total):,} د.ع\n"
        f"طريقة الدفع: الدفع عند الاستلام"
    )
    import urllib.parse
    wa_link = f"https://wa.me/{WHATSAPP_NUMBER}?text={urllib.parse.quote(wa_message)}"

    return {
        "order": saved,
        "whatsapp_link": wa_link,
        "low_stock_alerts": low_stock_alerts,
    }


@api_router.get("/orders/me")
async def my_orders(user: User = Depends(get_current_user)):
    docs = await db.orders.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api_router.get("/admin/orders")
async def all_orders(user: User = Depends(require_admin)):
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: User = Depends(require_admin)):
    if status not in ["pending", "confirmed", "shipped", "delivered", "cancelled"]:
        raise HTTPException(400, "Invalid status")
    res = await db.orders.update_one({"order_id": order_id}, {"$set": {"status": status}})
    if res.matched_count == 0:
        raise HTTPException(404, "Order not found")
    return {"ok": True}


@api_router.get("/admin/dashboard")
async def admin_dashboard(user: User = Depends(require_admin)):
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    low_stock_cursor = db.products.find(
        {"$expr": {"$lte": ["$stock", "$low_stock_threshold"]}}, {"_id": 0}
    )
    low_stock = await low_stock_cursor.to_list(100)
    revenue_pipeline = [
        {"$match": {"status": {"$ne": "cancelled"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_iqd"}}},
    ]
    rev = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = rev[0]["total"] if rev else 0
    return {
        "total_orders": total_orders,
        "total_products": total_products,
        "pending_orders": pending_orders,
        "total_revenue_iqd": total_revenue,
        "low_stock_products": low_stock,
    }


# ============ SEED ============
@api_router.post("/seed")
async def seed_data():
    if await db.products.count_documents({}) > 0:
        return {"ok": True, "message": "Already seeded"}

    sample = [
        # Clothing
        {"name_ar": "قميص قطن أنيق", "name_en": "Elegant Cotton Shirt", "description_ar": "قميص قطني فاخر بقصة عصرية", "description_en": "Premium cotton shirt with modern fit", "price_iqd": 35000, "category": "clothing", "image_url": "https://images.unsplash.com/photo-1593765947316-5945ff9b77bc?w=800", "stock": 50, "sizes": ["S", "M", "L", "XL"], "colors": ["أبيض", "أسود", "أزرق"]},
        {"name_ar": "فستان صيفي", "name_en": "Summer Dress", "description_ar": "فستان خفيف للأجواء الحارة", "description_en": "Light dress for warm weather", "price_iqd": 55000, "category": "clothing", "image_url": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800", "stock": 30, "sizes": ["S", "M", "L"], "colors": ["وردي", "أحمر", "أزرق"]},
        {"name_ar": "حذاء رياضي", "name_en": "Sports Shoes", "description_ar": "حذاء رياضي مريح للجري والتمارين", "description_en": "Comfortable sports shoes for running", "price_iqd": 75000, "category": "clothing", "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", "stock": 40, "sizes": ["40", "41", "42", "43", "44"], "colors": ["أسود", "أبيض"], "is_dropship": True, "alibaba_link": "https://www.alibaba.com/sample"},
        # Electronics
        {"name_ar": "سماعة بلوتوث", "name_en": "Bluetooth Headphones", "description_ar": "سماعة لاسلكية بجودة صوت عالية", "description_en": "Wireless headphones with premium sound", "price_iqd": 85000, "category": "electronics", "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", "stock": 25, "colors": ["أسود", "أبيض"]},
        {"name_ar": "ساعة ذكية", "name_en": "Smart Watch", "description_ar": "ساعة ذكية بشاشة AMOLED", "description_en": "Smart watch with AMOLED display", "price_iqd": 120000, "category": "electronics", "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", "stock": 15, "colors": ["أسود", "فضي", "ذهبي"], "is_dropship": True, "alibaba_link": "https://www.alibaba.com/sample"},
        {"name_ar": "مكبر صوت ذكي", "name_en": "Smart Speaker", "description_ar": "مكبر صوت بمساعد ذكي", "description_en": "Smart speaker with AI assistant", "price_iqd": 65000, "category": "electronics", "image_url": "https://images.unsplash.com/photo-1544380935-17ce6a107313?w=800", "stock": 20},
        # Appliances
        {"name_ar": "خلاط كهربائي", "name_en": "Electric Blender", "description_ar": "خلاط متعدد الاستخدامات", "description_en": "Multi-purpose blender", "price_iqd": 45000, "category": "appliances", "image_url": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800", "stock": 18},
        {"name_ar": "مكواة بخار", "name_en": "Steam Iron", "description_ar": "مكواة بخار قوية", "description_en": "Powerful steam iron", "price_iqd": 38000, "category": "appliances", "image_url": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800", "stock": 22},
        # Home
        {"name_ar": "وسادة فاخرة", "name_en": "Luxury Pillow", "description_ar": "وسادة قطن فاخرة", "description_en": "Premium cotton pillow", "price_iqd": 22000, "category": "home", "image_url": "https://images.unsplash.com/photo-1592789705501-f9ae4287c4cf?w=800", "stock": 60, "colors": ["أبيض", "بيج", "رمادي"]},
        {"name_ar": "مصباح طاولة", "name_en": "Table Lamp", "description_ar": "مصباح طاولة عصري", "description_en": "Modern table lamp", "price_iqd": 48000, "category": "home", "image_url": "https://images.pexels.com/photos/5531015/pexels-photo-5531015.jpeg?auto=compress&cs=tinysrgb&w=800", "stock": 14},
        # Kitchen
        {"name_ar": "طقم صحون", "name_en": "Dinnerware Set", "description_ar": "طقم صحون سيراميك أنيق", "description_en": "Elegant ceramic dinnerware set", "price_iqd": 95000, "category": "kitchen", "image_url": "https://images.unsplash.com/photo-1767851522865-40fdc830afc1?w=800", "stock": 12},
        {"name_ar": "غلاية كهربائية", "name_en": "Electric Kettle", "description_ar": "غلاية كهربائية بسعة 1.7 لتر", "description_en": "1.7L electric kettle", "price_iqd": 32000, "category": "kitchen", "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800", "stock": 28},
        # Toys
        {"name_ar": "دمية أطفال", "name_en": "Children's Doll", "description_ar": "دمية ناعمة للأطفال", "description_en": "Soft children's doll", "price_iqd": 25000, "category": "toys", "image_url": "https://images.unsplash.com/photo-1771355467801-4a4be5bbd8a9?w=800", "stock": 35},
        {"name_ar": "سيارة ريموت", "name_en": "RC Car", "description_ar": "سيارة لعبة بريموت كنترول", "description_en": "Remote control toy car", "price_iqd": 42000, "category": "toys", "image_url": "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800", "stock": 20, "is_dropship": True, "alibaba_link": "https://www.alibaba.com/sample"},
        {"name_ar": "ألعاب تعليمية", "name_en": "Educational Toys", "description_ar": "مجموعة ألعاب تعليمية", "description_en": "Educational toys set", "price_iqd": 30000, "category": "toys", "image_url": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800", "stock": 25},
    ]
    docs = []
    for s in sample:
        docs.append(
            {
                **s,
                "product_id": f"prod_{uuid.uuid4().hex[:12]}",
                "images": [],
                "low_stock_threshold": 5,
                "is_dropship": s.get("is_dropship", False),
                "alibaba_link": s.get("alibaba_link"),
                "description_ar": s.get("description_ar", ""),
                "description_en": s.get("description_en", ""),
                "sizes": s.get("sizes", []),
                "colors": s.get("colors", []),
                "created_at": datetime.now(timezone.utc),
            }
        )
    await db.products.insert_many(docs)

    # Seed sample discount
    if await db.discounts.count_documents({}) == 0:
        await db.discounts.insert_one(
            {
                "discount_id": f"disc_{uuid.uuid4().hex[:10]}",
                "code": "WELCOME10",
                "percent": 10,
                "active": True,
                "expires_at": None,
                "max_uses": None,
                "uses": 0,
                "created_at": datetime.now(timezone.utc),
            }
        )

    return {"ok": True, "products_added": len(docs)}


@api_router.get("/")
async def root():
    return {"message": "Iraqchi Store API", "support_email": SUPPORT_EMAIL}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    # Auto-seed
    if await db.products.count_documents({}) == 0:
        await seed_data()
    # Ensure admin role for ADMIN_EMAIL if user exists
    await db.users.update_one({"email": ADMIN_EMAIL.lower()}, {"$set": {"is_admin": True}})


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
