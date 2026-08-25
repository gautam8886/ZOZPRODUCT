import unittest
import json
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import init_db
from seed_data import seed_database

class FlipkartAPITestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Reset and seed database
        seed_database()
        cls.client = app.test_client()

    def test_01_get_categories(self):
        res = self.client.get('/api/categories')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreater(len(data['categories']), 0)
        print("[PASS] GET /api/categories passed")

    def test_02_get_products(self):
        res = self.client.get('/api/products')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreater(len(data['products']), 0)
        print("[PASS] GET /api/products passed")

    def test_03_search_and_filter_products(self):
        # Category filter
        res = self.client.get('/api/products?category=Mobiles')
        data = res.get_json()
        self.assertTrue(all(p['category'] == 'Mobiles' for p in data['products']))

        # Search filter
        res = self.client.get('/api/products?search=iPhone')
        data = res.get_json()
        self.assertTrue(any('iPhone' in p['title'] for p in data['products']))

        # Sort price asc
        res = self.client.get('/api/products?sort=price_asc')
        data = res.get_json()
        prices = [p['price'] for p in data['products']]
        self.assertEqual(prices, sorted(prices))
        print("[PASS] Search & faceted filter passed")

    def test_04_add_new_product(self):
        new_prod = {
            "title": "OnePlus Nord CE4 (Dark Chrome, 128 GB)",
            "brand": "OnePlus",
            "category": "Mobiles",
            "subcategory": "OnePlus",
            "price": 24999,
            "mrp": 26999,
            "stock": 35,
            "description": "Fast & Smooth Snapdragon 7 Gen 3 processor with 100W SUPERVOOC charging.",
            "highlights": ["8 GB RAM | 128 GB ROM", "50MP Sony LYT-600 Camera", "5500 mAh Battery"],
            "images": ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"],
            "is_assured": True,
            "is_deal": True
        }
        res = self.client.post('/api/products', data=json.dumps(new_prod), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('product_id', data)
        self.__class__.created_product_id = data['product_id']
        print(f"[PASS] POST /api/products passed (Created ID: {data['product_id']})")

    def test_05_update_and_delete_product(self):
        p_id = self.__class__.created_product_id
        
        # Update
        update_data = {
            "title": "OnePlus Nord CE4 (Updated Edition)",
            "brand": "OnePlus",
            "category": "Mobiles",
            "subcategory": "OnePlus",
            "price": 23999,
            "mrp": 26999,
            "stock": 50,
            "description": "Updated description",
            "highlights": ["Updated highlight"],
            "images": ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"],
            "is_assured": True,
            "is_deal": False
        }
        res = self.client.put(f'/api/products/{p_id}', data=json.dumps(update_data), content_type='application/json')
        self.assertEqual(res.status_code, 200)

        # Verify update
        detail_res = self.client.get(f'/api/products/{p_id}')
        self.assertEqual(detail_res.get_json()['product']['title'], "OnePlus Nord CE4 (Updated Edition)")

        # Delete
        del_res = self.client.delete(f'/api/products/{p_id}')
        self.assertEqual(del_res.status_code, 200)
        print("[PASS] PUT & DELETE /api/products passed")

    def test_06_place_and_track_order(self):
        order_payload = {
            "customer_name": "Gautam Singh",
            "customer_email": "gautam@flipkart.com",
            "customer_phone": "9876543210",
            "shipping_address": {
                "name": "Gautam Singh",
                "phone": "9876543210",
                "pincode": "110001",
                "address": "Connaught Place",
                "city": "New Delhi",
                "state": "Delhi"
            },
            "items": [
                {
                    "product_id": 1,
                    "title": "Apple iPhone 15 Pro",
                    "price": 127990,
                    "mrp": 134900,
                    "quantity": 1,
                    "image": "https://images.unsplash.com/photo-1695048133142-1a20484d2569"
                }
            ],
            "total_amount": 127990,
            "discount_amount": 6910,
            "delivery_charges": 0,
            "payment_method": "UPI"
        }
        res = self.client.post('/api/orders', data=json.dumps(order_payload), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        order_id = data['order_id']

        # Update order tracking status
        status_res = self.client.patch(f'/api/orders/{order_id}/status', data=json.dumps({"status": "Shipped"}), content_type='application/json')
        self.assertEqual(status_res.status_code, 200)

        # Verify tracking
        fetch_res = self.client.get(f'/api/orders/{order_id}')
        order = fetch_res.get_json()['order']
        self.assertEqual(order['order_status'], 'Shipped')
        print("[PASS] POST /api/orders & PATCH tracking status passed")

    def test_07_admin_stats(self):
        res = self.client.get('/api/stats')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('total_products', data['stats'])
        self.assertIn('total_orders', data['stats'])
        self.assertIn('total_sales', data['stats'])
        print("[PASS] GET /api/stats passed")

if __name__ == '__main__':
    unittest.main()
