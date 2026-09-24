# Day 9: FastAPI parity port. Same routes, same envelope, same DB.
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ecommerce")
PORT = int(os.getenv("PORT", "5001"))
CLIENT_URLS = [u.strip() for u in os.getenv("CLIENT_URLS", "http://localhost:3000").split(",")]

client = AsyncIOMotorClient(MONGO_URI)
db = client.get_default_database()   # name comes from the URI


def doc(d):
    """Mongo doc -> JSON-safe. ObjectId + datetime are NOT JSON types."""
    if d is None:
        return None
    d["_id"] = str(d["_id"])
    for k, v in d.items():
        if isinstance(v, datetime):
            d[k] = v.isoformat()
        elif isinstance(v, ObjectId):
            d[k] = str(v)
    return d


def err(status, msg):
    return JSONResponse(status_code=status, content={"success": False, "error": msg})


@asynccontextmanager
async def lifespan(app: FastAPI):
    p = await db.products.count_documents({})
    u = await db.users.count_documents({})
    o = await db.orders.count_documents({})
    print("=" * 46)
    print(" E-COMMERCE API (PYTHON/FASTAPI)  v1.0")
    print("=" * 46)
    print(f" Port: {PORT}     URL: http://localhost:{PORT}")
    print(f" Database: Connected ✅  ({p} products / {u} users / {o} orders)")
    print(" Products:  GET  /api/products · GET /api/products/{id}")
    print(" Orders:    POST /api/orders · GET /api/orders/{userId}")
    print(" Users:     GET  /api/users/lookup?email=")
    print(" Health:    GET  /api/health")
    print("=" * 46)
    yield
    client.close()


app = FastAPI(title="ecommerce-api-python", version="1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CLIENT_URLS,
                   allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(404)
async def not_found(request: Request, exc):
    return err(404, f"Route not found: {request.method} {request.url.path}")


@app.get("/api/health")
async def health():
    return {"success": True, "service": "ecommerce-api-python", "version": "1.0",
            "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/products")
async def list_products(category: Optional[str] = None, search: Optional[str] = None,
                        minPrice: Optional[float] = None, maxPrice: Optional[float] = None,
                        inStock: Optional[str] = None):
    q = {}
    if category:
        q["category"] = category
    if search:
        q["$or"] = [{"name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"tags": {"$regex": search, "$options": "i"}}]
    price = {}
    if minPrice is not None:
        price["$gte"] = minPrice
    if maxPrice is not None:
        price["$lte"] = maxPrice
    if price:
        q["price"] = price
    if inStock == "true":
        q["stock"] = {"$gt": 0}
    docs = await db.products.find(q).to_list(1000)
    return {"success": True, "count": len(docs), "data": [doc(d) for d in docs]}


@app.get("/api/products/{pid}")
async def get_product(pid: str):
    try:
        d = await db.products.find_one({"_id": ObjectId(pid)})
    except Exception:
        d = None
    if not d:
        return err(404, "Product not found")
    return {"success": True, "count": 1, "data": doc(d)}


class OrderItem(BaseModel):          # ⚠️ mirror YOUR Express order shape
    productId: str
    qty: int

class OrderIn(BaseModel):
    email: str
    items: list[OrderItem]
    address: Optional[str] = None


@app.post("/api/orders")
async def create_order(body: OrderIn):
    if "@" not in body.email:
        return err(400, "Valid email required")
    if not body.items:
        return err(400, "Order must contain at least one item")
    user = await db.users.find_one({"email": body.email})
    if not user:
        return err(404, "User not found")

    line_items, total = [], 0.0
    for it in body.items:
        if it.qty < 1:
            return err(400, "Quantity must be at least 1")
        try:
            prod = await db.products.find_one({"_id": ObjectId(it.productId)})
        except Exception:
            prod = None
        if not prod:
            return err(404, f"Unknown product: {it.productId}")
        claimed = await db.products.find_one_and_update(
            {"_id": prod["_id"], "stock": {"$gte": it.qty}},
            {"$inc": {"stock": -it.qty}})
        if not claimed:
            return err(409, f"Out of stock: {prod['name']}")
        line_items.append({"product": str(prod["_id"]), "name": prod["name"],
                           "price": prod["price"], "qty": it.qty})
        total += prod["price"] * it.qty

    order = {"userId": str(user["_id"]), "email": body.email, "items": line_items,
             "total": round(total, 2), "address": body.address,
             "status": "pending", "createdAt": datetime.now(timezone.utc)}
    res = await db.orders.insert_one(order)
    order["_id"] = res.inserted_id
    return {"success": True, "data": doc(order)}


@app.get("/api/orders/{user_id}")
async def get_orders(user_id: str):
    docs = await db.orders.find({"userId": user_id}).to_list(1000)
    return {"success": True, "count": len(docs), "data": [doc(d) for d in docs]}


@app.get("/api/users/lookup")
async def lookup_user(email: str = Query(...)):
    user = await db.users.find_one({"email": email})
    if not user:
        return err(404, "User not found")
    return {"success": True, "count": 1, "data": doc(user)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)