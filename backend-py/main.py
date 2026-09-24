# Day 9: FastAPI parity port of the Express backend.
# Same routes, same envelope, same database. The frontend can't tell the difference.
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
db = client.get_default_database()


def doc(d):
    """Recursively convert ObjectId/datetime to JSON-safe types."""
    if d is None:
        return None
    if isinstance(d, ObjectId):
        return str(d)
    if isinstance(d, datetime):
        return d.isoformat()
    if isinstance(d, list):
        return [doc(x) for x in d]
    if isinstance(d, dict):
        return {k: doc(v) for k, v in d.items()}
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
        q["category"] = category.lower()
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
    elif inStock == "false":
        q["stock"] = 0
    docs = await db.products.find(q).sort([("category", 1), ("name", 1)]).to_list(1000)
    return {"success": True, "count": len(docs), "data": [doc(d) for d in docs]}


@app.get("/api/products/{pid}")
async def get_product(pid: str):
    try:
        d = await db.products.find_one({"_id": ObjectId(pid)})
    except Exception:
        d = None
    if not d:
        return err(404, f"Product not found: {pid}")
    return {"success": True, "count": 1, "data": doc(d)}


class OrderItem(BaseModel):          # mirror Express: { productId, qty }
    productId: str
    qty: int

class OrderIn(BaseModel):            # mirror Express: { userId, items }
    userId: str
    items: list[OrderItem]


@app.post("/api/orders", status_code=201)
async def create_order(body: OrderIn):
    # ---- 400: request shape ----
    if not body.items:
        return err(400, "userId and a non-empty items array are required")

    try:
        user_oid = ObjectId(body.userId)
    except Exception:
        return err(400, f"Invalid userId: {body.userId}")

    # ---- 404: user must exist ----
    user = await db.users.find_one({"_id": user_oid})
    if not user:
        return err(404, f"User not found: {body.userId}")

    # ---- resolve products + stock check (409) BEFORE touching anything ----
    lines = []
    for it in body.items:
        if it.qty < 1:
            return err(400, "Each item needs productId and integer qty >= 1")
        try:
            prod_oid = ObjectId(it.productId)
        except Exception:
            return err(400, f"Invalid productId: {it.productId}")
        prod = await db.products.find_one({"_id": prod_oid})
        if not prod:
            return err(404, f"Product not found: {it.productId}")
        if prod["stock"] < it.qty:
            return err(409, f'Insufficient stock for "{prod["name"]}": '
                            f'requested {it.qty}, available {prod["stock"]}')
        lines.append({"product": prod, "qty": it.qty})

    # ---- all checks passed: decrement stock, then create the order ----
    for l in lines:
        await db.products.update_one(
            {"_id": l["product"]["_id"]},
            {"$inc": {"stock": -l["qty"]}}
        )

    order = {
        "userId": user["_id"],                              # ObjectId — Express matches on this
        "items":  [{"productId": l["product"]["_id"],       # ObjectId — Express populates this
                    "qty":       l["qty"],
                    "price":     l["product"]["price"]} for l in lines],
        "total":   round(sum(l["product"]["price"] * l["qty"] for l in lines), 2),
        "status":  "pending",
        "createdAt": datetime.now(timezone.utc),
    }
    res = await db.orders.insert_one(order)
    order["_id"] = res.inserted_id
    return {"success": True, "count": 1, "data": doc(order)}


@app.get("/api/orders/{user_id}")
async def get_orders(user_id: str):
    try:
        oid = ObjectId(user_id)
    except Exception:
        return err(400, f"Invalid userId: {user_id}")

    orders = await db.orders.find({"userId": oid}).sort("createdAt", -1).to_list(1000)

    # populate items[].productId -> { _id, name, price, image }
    # (mirrors Mongoose .populate('items.productId', 'name price image'))
    for o in orders:
        for line in o.get("items", []):
            pid = line.get("productId")
            if isinstance(pid, ObjectId):
                prod = await db.products.find_one(
                    {"_id": pid},
                    {"name": 1, "price": 1, "image": 1}
                )
                if prod:
                    line["productId"] = prod      # replace id with doc
            # convert nested ObjectId/datetime on the way out via doc()

    return {"success": True, "count": len(orders), "data": [doc(o) for o in orders]}


@app.get("/api/users/lookup")
async def lookup_user(email: str = Query(...)):
    user = await db.users.find_one({"email": email.lower()})
    if not user:
        return err(404, f"User not found: {email}")
    return {"success": True, "count": 1, "data": {
        "_id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
    }}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)