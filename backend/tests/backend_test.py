"""Backend tests for Iraqchi Store"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://iraqi-ecommerce.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")

ADMIN_EMAIL = "ghhh8326@gmail.com"
ADMIN_PASSWORD = "Admin@2026"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["is_admin"] is True
    return data["token"]


@pytest.fixture(scope="session")
def customer_token(session):
    # Register a fresh customer
    email = f"TEST_cust_{uuid.uuid4().hex[:8]}@example.com"
    r = session.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "Test@2026", "name": "Test Customer"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# -------- Categories --------
class TestCategories:
    def test_categories_returns_six(self, session):
        r = session.get(f"{BASE_URL}/api/categories")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 6
        ids = {c["id"] for c in data}
        assert ids == {"clothing", "electronics", "appliances", "home", "kitchen", "toys"}


# -------- Products --------
class TestProducts:
    def test_list_products(self, session):
        r = session.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        p = data[0]
        assert "product_id" in p
        assert "name_ar" in p and "name_en" in p
        assert "_id" not in p

    def test_get_single_product(self, session):
        items = session.get(f"{BASE_URL}/api/products").json()
        pid = items[0]["product_id"]
        r = session.get(f"{BASE_URL}/api/products/{pid}")
        assert r.status_code == 200
        assert r.json()["product_id"] == pid

    def test_get_product_404(self, session):
        r = session.get(f"{BASE_URL}/api/products/nonexistent_id")
        assert r.status_code == 404


# -------- Auth --------
class TestAuth:
    def test_login_admin(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["is_admin"] is True

    def test_login_invalid_password(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_register_creates_user(self, session):
        email = f"TEST_reg_{uuid.uuid4().hex[:8]}@example.com"
        r = session.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "Pass@2026", "name": "Reg User"})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["email"] == email
        assert data["user"]["is_admin"] is False

    def test_register_duplicate(self, session):
        r = session.post(f"{BASE_URL}/api/auth/register", json={"email": ADMIN_EMAIL, "password": "x", "name": "x"})
        assert r.status_code == 400

    def test_me_with_token(self, session, admin_token):
        r = session.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_without_token(self, session):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


# -------- Admin Products CRUD --------
class TestAdminProducts:
    @pytest.fixture
    def created_product(self, session, admin_token):
        payload = {
            "name_ar": "TEST منتج تجريبي",
            "name_en": "TEST Sample Product",
            "description_ar": "وصف",
            "description_en": "desc",
            "price_iqd": 12345,
            "category": "electronics",
            "image_url": "https://example.com/img.jpg",
            "stock": 10,
            "sizes": ["M", "L"],
            "colors": ["red"],
            "is_dropship": True,
            "alibaba_link": "https://www.alibaba.com/test",
        }
        r = session.post(f"{BASE_URL}/api/products", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text
        prod = r.json()
        yield prod
        # teardown
        session.delete(f"{BASE_URL}/api/products/{prod['product_id']}", headers={"Authorization": f"Bearer {admin_token}"})

    def test_create_product_persists(self, session, created_product):
        r = session.get(f"{BASE_URL}/api/products/{created_product['product_id']}")
        assert r.status_code == 200
        d = r.json()
        assert d["name_en"] == "TEST Sample Product"
        assert d["is_dropship"] is True
        assert d["alibaba_link"] == "https://www.alibaba.com/test"
        assert d["price_iqd"] == 12345
        assert d["stock"] == 10

    def test_update_product(self, session, admin_token, created_product):
        upd = {**{k: v for k, v in created_product.items() if k not in ["product_id", "created_at"]}}
        upd["price_iqd"] = 99999
        upd["stock"] = 50
        r = session.put(f"{BASE_URL}/api/products/{created_product['product_id']}", json=upd, headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        check = session.get(f"{BASE_URL}/api/products/{created_product['product_id']}").json()
        assert check["price_iqd"] == 99999
        assert check["stock"] == 50

    def test_delete_product(self, session, admin_token):
        r = session.post(f"{BASE_URL}/api/products", json={
            "name_ar": "TEST del", "name_en": "TEST Del", "price_iqd": 100,
            "category": "toys", "image_url": "https://example.com/x.jpg", "stock": 1,
        }, headers={"Authorization": f"Bearer {admin_token}"})
        pid = r.json()["product_id"]
        d = session.delete(f"{BASE_URL}/api/products/{pid}", headers={"Authorization": f"Bearer {admin_token}"})
        assert d.status_code == 200
        check = session.get(f"{BASE_URL}/api/products/{pid}")
        assert check.status_code == 404

    def test_non_admin_create_forbidden(self, session, customer_token):
        r = session.post(f"{BASE_URL}/api/products", json={
            "name_ar": "x", "name_en": "x", "price_iqd": 1, "category": "toys",
            "image_url": "https://example.com/x.jpg", "stock": 1,
        }, headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 403

    def test_non_admin_dashboard_forbidden(self, session, customer_token):
        r = session.get(f"{BASE_URL}/api/admin/dashboard", headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 403


# -------- Discounts --------
class TestDiscounts:
    def test_validate_welcome10(self, session):
        r = session.get(f"{BASE_URL}/api/discounts/validate/WELCOME10")
        assert r.status_code == 200
        d = r.json()
        assert d["code"] == "WELCOME10"
        assert d["percent"] == 10

    def test_validate_invalid(self, session):
        r = session.get(f"{BASE_URL}/api/discounts/validate/NOTREAL_XYZ")
        assert r.status_code == 404


# -------- Orders --------
class TestOrders:
    def test_create_order_with_discount(self, session, customer_token):
        # Get a product with stock
        products = session.get(f"{BASE_URL}/api/products").json()
        prod = next(p for p in products if p["stock"] >= 2)
        initial_stock = prod["stock"]

        order_payload = {
            "items": [{"product_id": prod["product_id"], "quantity": 2, "size": None, "color": None}],
            "customer_name": "TEST Customer",
            "customer_phone": "07700000000",
            "customer_address": "Test Street",
            "customer_city": "Baghdad",
            "discount_code": "WELCOME10",
        }
        r = session.post(f"{BASE_URL}/api/orders", json=order_payload, headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "whatsapp_link" in data and data["whatsapp_link"].startswith("https://wa.me/9647747742908")
        order = data["order"]
        assert order["payment_method"] == "cod"
        assert order["status"] == "pending"
        assert order["discount_iqd"] > 0
        expected_subtotal = prod["price_iqd"] * 2
        assert abs(order["subtotal_iqd"] - expected_subtotal) < 1
        assert abs(order["total_iqd"] - expected_subtotal * 0.9) < 1

        # Verify stock decremented
        new_prod = session.get(f"{BASE_URL}/api/products/{prod['product_id']}").json()
        assert new_prod["stock"] == initial_stock - 2

    def test_order_insufficient_stock(self, session, customer_token):
        products = session.get(f"{BASE_URL}/api/products").json()
        prod = products[0]
        r = session.post(f"{BASE_URL}/api/orders", json={
            "items": [{"product_id": prod["product_id"], "quantity": 99999}],
            "customer_name": "T", "customer_phone": "0", "customer_address": "a", "customer_city": "b",
        }, headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 400

    def test_my_orders(self, session, customer_token):
        # Create one
        prod = next(p for p in session.get(f"{BASE_URL}/api/products").json() if p["stock"] >= 1)
        session.post(f"{BASE_URL}/api/orders", json={
            "items": [{"product_id": prod["product_id"], "quantity": 1}],
            "customer_name": "TEST Me", "customer_phone": "0770", "customer_address": "x", "customer_city": "Baghdad",
        }, headers={"Authorization": f"Bearer {customer_token}"})
        r = session.get(f"{BASE_URL}/api/orders/me", headers={"Authorization": f"Bearer {customer_token}"})
        assert r.status_code == 200
        orders = r.json()
        assert len(orders) >= 1


# -------- Admin Orders & Dashboard --------
class TestAdminOps:
    def test_admin_orders_list(self, session, admin_token):
        r = session.get(f"{BASE_URL}/api/admin/orders", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_dashboard(self, session, admin_token):
        r = session.get(f"{BASE_URL}/api/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        d = r.json()
        for k in ["total_orders", "total_products", "pending_orders", "total_revenue_iqd", "low_stock_products"]:
            assert k in d
        assert isinstance(d["low_stock_products"], list)

    def test_update_order_status(self, session, admin_token, customer_token):
        prod = next(p for p in session.get(f"{BASE_URL}/api/products").json() if p["stock"] >= 1)
        co = session.post(f"{BASE_URL}/api/orders", json={
            "items": [{"product_id": prod["product_id"], "quantity": 1}],
            "customer_name": "TEST status", "customer_phone": "0770", "customer_address": "x", "customer_city": "y",
        }, headers={"Authorization": f"Bearer {customer_token}"})
        order_id = co.json()["order"]["order_id"]
        r = session.put(f"{BASE_URL}/api/admin/orders/{order_id}/status?status=confirmed", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        all_orders = session.get(f"{BASE_URL}/api/admin/orders", headers={"Authorization": f"Bearer {admin_token}"}).json()
        target = next(o for o in all_orders if o["order_id"] == order_id)
        assert target["status"] == "confirmed"
