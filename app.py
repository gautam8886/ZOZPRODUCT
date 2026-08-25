import os
import json
import sqlite3
import random
import string
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from models import get_db_connection, init_db

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Ensure DB is initialized
init_db()

def generate_order_id():
    digits = ''.join(random.choices(string.digits, k=11))
    return f"OD{digits}"

# ----------------- PAGE ROUTES -----------------
@app.route('/')
def index():
    return render_template('index.html')

# ----------------- BANNERS API -----------------
@app.route('/api/banners', methods=['GET'])
def get_banners():
    banners = [
        {
            "id": 1,
            "title": "Fresh Organic Jackfruit (कटहल)",
            "subtitle": "100% Naturally Grown, Tender, High in Fiber & Rich in Nutrients • Direct from Farm",
            "image": "https://tse4.mm.bing.net/th/id/OIP.ahUGTGa38uwugjYINMfW2QHaE4?r=0&pid=Api&P=0&h=180",
            "category": "Grocery",
            "badge": "Farm Fresh • Special Harvest"
        }
    ]
    return jsonify({"success": True, "banners": banners})

# ----------------- CATEGORIES API -----------------
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM categories')
    rows = cursor.fetchall()
    conn.close()

    categories = []
    for r in rows:
        categories.append({
            "id": r["id"],
            "name": r["name"],
            "slug": r["slug"],
            "icon": r["icon"],
            "subcategories": json.loads(r["subcategories"]) if r["subcategories"] else []
        })
    return jsonify({"success": True, "categories": categories})

# ----------------- PRODUCTS API -----------------
@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    subcategory = request.args.get('subcategory')
    search = request.args.get('search', '').strip()
    brand = request.args.get('brand')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    min_rating = request.args.get('min_rating', type=float)
    is_assured = request.args.get('is_assured')
    is_deal = request.args.get('is_deal')
    sort = request.args.get('sort', 'relevance') # relevance, price_asc, price_desc, discount_desc, rating_desc, newest

    query = 'SELECT * FROM products WHERE 1=1'
    params = []

    if category and category.lower() != 'all':
        query += ' AND category = ?'
        params.append(category)

    if subcategory:
        query += ' AND subcategory = ?'
        params.append(subcategory)

    if search:
        search_term = f"%{search}%"
        query += ' AND (title LIKE ? OR brand LIKE ? OR description LIKE ? OR category LIKE ? OR subcategory LIKE ?)'
        params.extend([search_term, search_term, search_term, search_term, search_term])

    if brand:
        brand_list = [b.strip() for b in brand.split(',') if b.strip()]
        if brand_list:
            placeholders = ','.join(['?'] * len(brand_list))
            query += f' AND brand IN ({placeholders})'
            params.extend(brand_list)

    if min_price is not None:
        query += ' AND price >= ?'
        params.append(min_price)

    if max_price is not None:
        query += ' AND price <= ?'
        params.append(max_price)

    if min_rating is not None:
        query += ' AND rating >= ?'
        params.append(min_rating)

    if is_assured in ('1', 'true', 'True'):
        query += ' AND is_assured = 1'

    if is_deal in ('1', 'true', 'True'):
        query += ' AND is_deal = 1'

    # Sorting
    if sort == 'price_asc':
        query += ' ORDER BY price ASC'
    elif sort == 'price_desc':
        query += ' ORDER BY price DESC'
    elif sort == 'discount_desc':
        query += ' ORDER BY discount DESC'
    elif sort == 'rating_desc':
        query += ' ORDER BY rating DESC'
    elif sort == 'newest':
        query += ' ORDER BY id DESC'
    else:
        query += ' ORDER BY is_deal DESC, rating DESC, id DESC'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    # Available Brands for filter metadata
    cursor.execute('SELECT DISTINCT brand FROM products ORDER BY brand ASC')
    all_brands = [row['brand'] for row in cursor.fetchall() if row['brand']]

    # Min/Max price for filter metadata
    cursor.execute('SELECT MIN(price) as min_p, MAX(price) as max_p FROM products')
    price_stats = cursor.fetchone()

    conn.close()

    products = []
    for r in rows:
        products.append({
            "id": r["id"],
            "title": r["title"],
            "brand": r["brand"],
            "category": r["category"],
            "subcategory": r["subcategory"],
            "price": r["price"],
            "mrp": r["mrp"],
            "discount": r["discount"],
            "stock": r["stock"],
            "rating": r["rating"],
            "rating_count": r["rating_count"],
            "review_count": r["review_count"],
            "description": r["description"],
            "highlights": json.loads(r["highlights"]) if r["highlights"] else [],
            "specs": json.loads(r["specs"]) if r["specs"] else {},
            "images": json.loads(r["images"]) if r["images"] else [],
            "is_assured": bool(r["is_assured"]),
            "is_deal": bool(r["is_deal"]),
            "deal_tag": r["deal_tag"] or "",
            "created_at": r["created_at"]
        })

    return jsonify({
        "success": True,
        "total": len(products),
        "products": products,
        "filter_meta": {
            "brands": all_brands,
            "min_price": price_stats['min_p'] if price_stats and price_stats['min_p'] else 0,
            "max_price": price_stats['max_p'] if price_stats and price_stats['max_p'] else 100000
        }
    })

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    r = cursor.fetchone()

    if not r:
        conn.close()
        return jsonify({"success": False, "message": "Product not found"}), 404

    # Fetch reviews for this product
    cursor.execute('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC', (product_id,))
    review_rows = cursor.fetchall()
    reviews = []
    for rev in review_rows:
        reviews.append({
            "id": rev["id"],
            "user_name": rev["user_name"],
            "rating": rev["rating"],
            "title": rev["title"],
            "comment": rev["comment"],
            "verified_purchase": bool(rev["verified_purchase"]),
            "created_at": rev["created_at"]
        })

    # Fetch similar products in same category
    cursor.execute('SELECT id, title, price, mrp, discount, rating, images, is_assured FROM products WHERE category = ? AND id != ? LIMIT 6', (r["category"], product_id))
    similar_rows = cursor.fetchall()
    similar_products = []
    for sim in similar_rows:
        sim_images = json.loads(sim["images"]) if sim["images"] else []
        similar_products.append({
            "id": sim["id"],
            "title": sim["title"],
            "price": sim["price"],
            "mrp": sim["mrp"],
            "discount": sim["discount"],
            "rating": sim["rating"],
            "image": sim_images[0] if sim_images else "",
            "is_assured": bool(sim["is_assured"])
        })

    conn.close()

    product = {
        "id": r["id"],
        "title": r["title"],
        "brand": r["brand"],
        "category": r["category"],
        "subcategory": r["subcategory"],
        "price": r["price"],
        "mrp": r["mrp"],
        "discount": r["discount"],
        "stock": r["stock"],
        "rating": r["rating"],
        "rating_count": r["rating_count"],
        "review_count": len(reviews),
        "description": r["description"],
        "highlights": json.loads(r["highlights"]) if r["highlights"] else [],
        "specs": json.loads(r["specs"]) if r["specs"] else {},
        "images": json.loads(r["images"]) if r["images"] else [],
        "is_assured": bool(r["is_assured"]),
        "is_deal": bool(r["is_deal"]),
        "deal_tag": r["deal_tag"] or "",
        "created_at": r["created_at"],
        "reviews": reviews,
        "similar_products": similar_products
    }

    return jsonify({"success": True, "product": product})

# ----------------- ADD PRODUCT (ADMIN) -----------------
@app.route('/api/products', methods=['POST'])
def add_product():
    try:
        data = request.get_json(force=True)
        title = data.get('title', '').strip()
        brand = data.get('brand', '').strip()
        category = data.get('category', '').strip()
        subcategory = data.get('subcategory', '').strip()
        price = float(data.get('price', 0))
        mrp = float(data.get('mrp', price))
        stock = int(data.get('stock', 10))
        description = data.get('description', '').strip()
        
        # Calculate discount percentage
        if mrp > price and mrp > 0:
            discount = int(round(((mrp - price) / mrp) * 100))
        else:
            discount = 0

        # Highlights & Specs JSON
        highlights = data.get('highlights', [])
        if isinstance(highlights, str):
            try:
                highlights = json.loads(highlights)
            except Exception:
                highlights = [h.strip() for h in highlights.split('\n') if h.strip()]

        specs = data.get('specs', {})
        if isinstance(specs, str):
            try:
                specs = json.loads(specs)
            except Exception:
                specs = {"General": {"Description": specs}}

        images = data.get('images', [])
        if isinstance(images, str):
            try:
                images = json.loads(images)
            except Exception:
                images = [img.strip() for img in images.split(',') if img.strip()]

        if not images:
            # Default placeholder image
            images = ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"]

        is_assured = 1 if data.get('is_assured', True) else 0
        is_deal = 1 if data.get('is_deal', False) else 0
        deal_tag = data.get('deal_tag', '')

        if not title or not category or price <= 0:
            return jsonify({"success": False, "message": "Title, category, and a valid price are required."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO products (
            title, brand, category, subcategory, price, mrp, discount, stock,
            rating, rating_count, review_count, description, highlights, specs,
            images, is_assured, is_deal, deal_tag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 4.5, 1, 0, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            title, brand, category, subcategory, price, mrp, discount, stock,
            description, json.dumps(highlights), json.dumps(specs),
            json.dumps(images), is_assured, is_deal, deal_tag
        ))
        product_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Product added successfully to catalog!",
            "product_id": product_id
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ----------------- EDIT PRODUCT (ADMIN) -----------------
@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.get_json(force=True)
        title = data.get('title', '').strip()
        brand = data.get('brand', '').strip()
        category = data.get('category', '').strip()
        subcategory = data.get('subcategory', '').strip()
        price = float(data.get('price', 0))
        mrp = float(data.get('mrp', price))
        stock = int(data.get('stock', 10))
        description = data.get('description', '').strip()
        
        if mrp > price and mrp > 0:
            discount = int(round(((mrp - price) / mrp) * 100))
        else:
            discount = 0

        highlights = data.get('highlights', [])
        if isinstance(highlights, str):
            try:
                highlights = json.loads(highlights)
            except Exception:
                highlights = [h.strip() for h in highlights.split('\n') if h.strip()]

        specs = data.get('specs', {})
        if isinstance(specs, str):
            try:
                specs = json.loads(specs)
            except Exception:
                specs = {"General": {"Description": specs}}

        images = data.get('images', [])
        if isinstance(images, str):
            try:
                images = json.loads(images)
            except Exception:
                images = [img.strip() for img in images.split(',') if img.strip()]

        is_assured = 1 if data.get('is_assured', True) else 0
        is_deal = 1 if data.get('is_deal', False) else 0
        deal_tag = data.get('deal_tag', '')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        UPDATE products SET
            title = ?, brand = ?, category = ?, subcategory = ?, price = ?,
            mrp = ?, discount = ?, stock = ?, description = ?, highlights = ?,
            specs = ?, images = ?, is_assured = ?, is_deal = ?, deal_tag = ?
        WHERE id = ?
        ''', (
            title, brand, category, subcategory, price, mrp, discount, stock,
            description, json.dumps(highlights), json.dumps(specs),
            json.dumps(images), is_assured, is_deal, deal_tag, product_id
        ))
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Product updated successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ----------------- DELETE PRODUCT (ADMIN) -----------------
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
        cursor.execute('DELETE FROM reviews WHERE product_id = ?', (product_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Product deleted successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ----------------- IMAGE UPLOAD HELPER -----------------
@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"success": False, "message": "No image file provided"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"success": False, "message": "No image file selected"}), 400

    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_filename = f"{timestamp}_{filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(file_path)
    
    url = f"/static/uploads/{unique_filename}"
    return jsonify({"success": True, "url": url})

# ----------------- ORDERS API -----------------
@app.route('/api/orders', methods=['GET'])
def get_orders():
    email = request.args.get('email')
    conn = get_db_connection()
    cursor = conn.cursor()
    if email:
        cursor.execute('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC', (email,))
    else:
        cursor.execute('SELECT * FROM orders ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()

    orders = []
    for r in rows:
        orders.append({
            "id": r["id"],
            "customer_name": r["customer_name"],
            "customer_email": r["customer_email"],
            "customer_phone": r["customer_phone"],
            "shipping_address": json.loads(r["shipping_address"]) if r["shipping_address"] else {},
            "items": json.loads(r["items"]) if r["items"] else [],
            "total_amount": r["total_amount"],
            "discount_amount": r["discount_amount"],
            "delivery_charges": r["delivery_charges"],
            "payment_method": r["payment_method"],
            "payment_status": r["payment_status"],
            "order_status": r["order_status"],
            "tracking_history": json.loads(r["tracking_history"]) if r["tracking_history"] else [],
            "created_at": r["created_at"]
        })
    return jsonify({"success": True, "orders": orders})

@app.route('/api/orders/<string:order_id>', methods=['GET'])
def get_order_detail(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    r = cursor.fetchone()
    conn.close()

    if not r:
        return jsonify({"success": False, "message": "Order not found"}), 404

    order = {
        "id": r["id"],
        "customer_name": r["customer_name"],
        "customer_email": r["customer_email"],
        "customer_phone": r["customer_phone"],
        "shipping_address": json.loads(r["shipping_address"]) if r["shipping_address"] else {},
        "items": json.loads(r["items"]) if r["items"] else [],
        "total_amount": r["total_amount"],
        "discount_amount": r["discount_amount"],
        "delivery_charges": r["delivery_charges"],
        "payment_method": r["payment_method"],
        "payment_status": r["payment_status"],
        "order_status": r["order_status"],
        "tracking_history": json.loads(r["tracking_history"]) if r["tracking_history"] else [],
        "created_at": r["created_at"]
    }
    return jsonify({"success": True, "order": order})

@app.route('/api/orders', methods=['POST'])
def place_order():
    try:
        data = request.get_json(force=True)
        order_id = generate_order_id()
        customer_name = data.get('customer_name', 'Customer').strip()
        customer_email = data.get('customer_email', 'user@flipkart.com').strip()
        customer_phone = data.get('customer_phone', '').strip()
        shipping_address = data.get('shipping_address', {})
        items = data.get('items', [])
        total_amount = float(data.get('total_amount', 0))
        discount_amount = float(data.get('discount_amount', 0))
        delivery_charges = float(data.get('delivery_charges', 0))
        payment_method = data.get('payment_method', 'UPI')
        payment_status = 'Success'
        order_status = 'Placed'

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        tracking_history = [
            {"status": "Placed", "time": now_str, "detail": "Order placed successfully. Seller is preparing your item."}
        ]

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO orders (
            id, customer_name, customer_email, customer_phone, shipping_address,
            items, total_amount, discount_amount, delivery_charges, payment_method,
            payment_status, order_status, tracking_history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            order_id, customer_name, customer_email, customer_phone,
            json.dumps(shipping_address), json.dumps(items), total_amount,
            discount_amount, delivery_charges, payment_method, payment_status,
            order_status, json.dumps(tracking_history)
        ))

        # Decrement stock for purchased items
        for item in items:
            p_id = item.get('product_id')
            qty = item.get('quantity', 1)
            if p_id:
                cursor.execute('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', (qty, p_id))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Order placed successfully!",
            "order_id": order_id
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/orders/<string:order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    try:
        data = request.get_json(force=True)
        new_status = data.get('status')
        custom_note = data.get('detail', f"Status updated to {new_status}")
        
        if not new_status:
            return jsonify({"success": False, "message": "New status is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT tracking_history FROM orders WHERE id = ?', (order_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({"success": False, "message": "Order not found"}), 404

        history = json.loads(row['tracking_history']) if row['tracking_history'] else []
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        history.append({"status": new_status, "time": now_str, "detail": custom_note})

        cursor.execute('''
        UPDATE orders SET order_status = ?, tracking_history = ? WHERE id = ?
        ''', (new_status, json.dumps(history), order_id))
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": f"Order status updated to {new_status}"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ----------------- REVIEWS API -----------------
@app.route('/api/reviews', methods=['POST'])
def add_review():
    try:
        data = request.get_json(force=True)
        product_id = int(data.get('product_id'))
        user_name = data.get('user_name', 'Verified Buyer').strip()
        rating = int(data.get('rating', 5))
        title = data.get('title', '').strip()
        comment = data.get('comment', '').strip()

        if not product_id or not comment:
            return jsonify({"success": False, "message": "Product ID and comment are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO reviews (product_id, user_name, rating, title, comment, verified_purchase)
        VALUES (?, ?, ?, ?, ?, 1)
        ''', (product_id, user_name, rating, title, comment))

        # Recalculate average rating & review count for product
        cursor.execute('SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE product_id = ?', (product_id,))
        stats = cursor.fetchone()
        new_rating = round(stats['avg_r'], 1) if stats and stats['avg_r'] else rating
        new_review_count = stats['cnt'] if stats else 1

        cursor.execute('''
        UPDATE products SET rating = ?, review_count = ?, rating_count = rating_count + 1 WHERE id = ?
        ''', (new_rating, new_review_count, product_id))

        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Review added successfully!"}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ----------------- ADMIN STATS API -----------------
@app.route('/api/stats', methods=['GET'])
def get_admin_stats():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) as total_products, SUM(CASE WHEN stock <= 3 THEN 1 ELSE 0 END) as low_stock FROM products')
    prod_stats = cursor.fetchone()

    cursor.execute('SELECT COUNT(*) as total_orders, SUM(total_amount) as total_sales FROM orders')
    order_stats = cursor.fetchone()

    cursor.execute('SELECT category, COUNT(*) as count FROM products GROUP BY category')
    cat_distribution = [{"category": row['category'], "count": row['count']} for row in cursor.fetchall()]

    conn.close()

    return jsonify({
        "success": True,
        "stats": {
            "total_products": prod_stats['total_products'] or 0,
            "low_stock_products": prod_stats['low_stock'] or 0,
            "total_orders": order_stats['total_orders'] or 0,
            "total_sales": round(order_stats['total_sales'] or 0, 2),
            "category_distribution": cat_distribution
        }
    })

if __name__ == '__main__':
    print("=" * 60)
    print(" Flipkart Clone Server running at http://localhost:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
