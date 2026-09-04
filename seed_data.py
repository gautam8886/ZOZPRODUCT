import sqlite3
import json
from models import get_db_connection, init_db

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing data
    cursor.execute('DELETE FROM products')
    cursor.execute('DELETE FROM categories')
    cursor.execute('DELETE FROM reviews')
    cursor.execute('DELETE FROM orders')

    # Categories Data with modern icons (Unsplash or SVG friendly)
    categories = [
        {
            "name": "Mobiles",
            "slug": "mobiles",
            "icon": "https://rukminim2.flixcart.com/flap/128/128/image/22fddf3c7da4c4f4.png?q=100",
            "subcategories": ["Apple", "Samsung", "OnePlus", "Realme", "Xiaomi", "Motorola", "Accessories"]
        },
        {
            "name": "Electronics",
            "slug": "electronics",
            "icon": "https://rukminim2.flixcart.com/flap/128/128/image/69c6589653afdb9a.png?q=100",
            "subcategories": ["Laptops", "Smartwatches", "Headphones", "Tablets", "Cameras", "Gaming Consoles"]
        },
        {
            "name": "TVs & Appliances",
            "slug": "appliances",
            "icon": "https://rukminim2.flixcart.com/flap/128/128/image/0ff199d1bd27eb98.png?q=100",
            "subcategories": ["Smart TVs", "Refrigerators", "Washing Machines", "Air Conditioners", "Microwaves"]
        },
        {
            "name": "Fashion",
            "slug": "fashion",
            "icon": "https://rukminim2.flixcart.com/fk-p-flap/128/128/image/0d750f284f6804e2.png?q=100",
            "subcategories": ["Men's Top Wear", "Men's Footwear", "Women's Ethnic", "Women's Western", "Watches & Bags"]
        },
        {
            "name": "Home & Furniture",
            "slug": "home-furniture",
            "icon": "https://rukminim2.flixcart.com/flap/128/128/image/ab7e2b022a4587dd.jpg?q=100",
            "subcategories": ["Sofas & Seating", "Beds & Mattresses", "Office Chairs", "Home Decor", "Kitchen Storage"]
        },
        {
            "name": "Beauty, Food & Toys",
            "slug": "beauty-toys",
            "icon": "https://rukminim2.flixcart.com/flap/128/128/image/dff3f7adcf3a90c6.png?q=100",
            "subcategories": ["Skincare", "Makeup", "Fragrances", "Toys & Games", "Baby Care", "Nutrition & Health"]
        },
        {
            "name": "Grocery",
            "slug": "grocery",
            "icon": "https://rukminim2.flixcart.com/flap/128/128/image/29327f40e9c4d26b.png?q=100",
            "subcategories": ["Staples", "Snacks & Beverages", "Packaged Food", "Household Essentials", "Dairy & Eggs"]
        }
    ]

    for cat in categories:
        cursor.execute('''
        INSERT INTO categories (name, slug, icon, subcategories)
        VALUES (?, ?, ?, ?)
        ''', (cat['name'], cat['slug'], cat['icon'], json.dumps(cat['subcategories'])))

    # Realistic Ramdev Store Products
    products = [
        {
            "title": "Apple iPhone 15 Pro (Natural Titanium, 128 GB)",
            "brand": "Apple",
            "category": "Mobiles",
            "subcategory": "Apple",
            "price": 127990,
            "mrp": 134900,
            "discount": 5,
            "stock": 25,
            "rating": 4.7,
            "rating_count": 8420,
            "review_count": 640,
            "description": "iPhone 15 Pro forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever with 48MP main sensor.",
            "highlights": [
                "128 GB ROM",
                "15.49 cm (6.1 inch) Super Retina XDR Display with ProMotion 120Hz",
                "48MP + 12MP + 12MP | 12MP Front Camera",
                "A17 Pro Chip, 6 Core Processor with Ray Tracing",
                "Aerospace-Grade Titanium Design with Action Button",
                "USB-C with USB 3 Speeds up to 10Gb/s"
            ],
            "specs": {
                "General": {
                    "In The Box": "iPhone, USB-C Charge Cable, Documentation",
                    "Model Number": "MTV13HN/A",
                    "Color": "Natural Titanium",
                    "SIM Type": "Dual SIM (Nano + eSIM)"
                },
                "Display Features": {
                    "Display Size": "6.1 inch",
                    "Resolution": "2556 x 1179 Pixels",
                    "Display Type": "All-screen OLED Display",
                    "Other Display Features": "Dynamic Island, Always-On display, 2000 nits peak brightness"
                },
                "Camera Features": {
                    "Primary Camera": "48MP + 12MP + 12MP",
                    "Secondary Camera": "12MP TrueDepth Front Camera",
                    "Video Recording": "4K at 60 fps, ProRes video, Spatial video recording"
                },
                "Battery & Power": {
                    "Battery Type": "Lithium-ion",
                    "Charging": "Up to 50% charge in ~30 minutes with 20W adapter, MagSafe wireless charging"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": True,
            "deal_tag": "Deal of the Day"
        },
        {
            "title": "Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256 GB, 12 GB RAM)",
            "brand": "Samsung",
            "category": "Mobiles",
            "subcategory": "Samsung",
            "price": 119999,
            "mrp": 134999,
            "discount": 11,
            "stock": 18,
            "rating": 4.6,
            "rating_count": 5230,
            "review_count": 412,
            "description": "Meet Samsung Galaxy S24 Ultra with Galaxy AI. Search like never before with Circle to Search, get real-time voice translation on a call, and shoot epic low-light portraits with 200MP Quad Tele zoom.",
            "highlights": [
                "12 GB RAM | 256 GB ROM",
                "17.27 cm (6.8 inch) Quad HD+ Dynamic AMOLED 2X Display",
                "200MP + 50MP + 12MP + 10MP | 12MP Front Camera",
                "5000 mAh Battery with 45W Fast Charging",
                "Snapdragon 8 Gen 3 for Galaxy Processor",
                "Built-in S Pen & Armor Titanium Frame"
            ],
            "specs": {
                "General": {
                    "In The Box": "Handset, S Pen, Data Cable (Type C-to-C), Ejection Pin",
                    "Color": "Titanium Gray",
                    "SIM Type": "Dual SIM (Nano + eSIM)"
                },
                "Processor & OS": {
                    "Operating System": "Android 14 (One UI 6.1 with 7 years OS updates)",
                    "Processor Type": "Snapdragon 8 Gen 3 Mobile Platform for Galaxy"
                },
                "Camera Features": {
                    "Rear Camera": "200MP Wide + 50MP 5x Optical Zoom + 12MP Ultra-Wide + 10MP 3x Optical Zoom",
                    "Front Camera": "12MP Dual Pixel AF"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": True,
            "deal_tag": "Top Brand Offer"
        },
        {
            "title": "OnePlus 12 (Flowy Emerald, 512 GB, 16 GB RAM)",
            "brand": "OnePlus",
            "category": "Mobiles",
            "subcategory": "OnePlus",
            "price": 64999,
            "mrp": 69999,
            "discount": 7,
            "stock": 30,
            "rating": 4.5,
            "rating_count": 3890,
            "review_count": 298,
            "description": "Smooth Beyond Belief. The OnePlus 12 delivers flagship performance powered by Qualcomm Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, and revolutionary 2K 120Hz ProXDR Display.",
            "highlights": [
                "16 GB RAM | 512 GB ROM",
                "17.32 cm (6.82 inch) 2K 120Hz ProXDR AMOLED Display",
                "50MP Sony LYT-808 + 64MP Periscope + 48MP Ultra-Wide | 32MP Front",
                "5400 mAh Battery with 100W SUPERVOOC + 50W AIRVOOC Wireless",
                "Snapdragon 8 Gen 3 with Dual Cryo-velocity VC Cooling"
            ],
            "specs": {
                "General": {
                    "In The Box": "OnePlus 12, 100W SUPERVOOC Power Adapter, Type-C Cable, Quick Guide, Case",
                    "Color": "Flowy Emerald"
                },
                "Battery": {
                    "Capacity": "5400 mAh Dual-cell",
                    "Fast Charge": "100W Wired (1-100% in 26 mins), 50W Wireless"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": False,
            "deal_tag": ""
        },
        {
            "title": "Apple MacBook Air Apple M3 (16 GB Unified Memory / 512 GB SSD / macOS Sonoma) 13.6-inch",
            "brand": "Apple",
            "category": "Electronics",
            "subcategory": "Laptops",
            "price": 124990,
            "mrp": 134900,
            "discount": 7,
            "stock": 15,
            "rating": 4.8,
            "rating_count": 1420,
            "review_count": 180,
            "description": "Supercharged by the next-generation M3 chip, the redesigned MacBook Air combines incredible performance and up to 18 hours of battery life into its strikingly thin aluminum enclosure.",
            "highlights": [
                "Apple M3 Chip with 8-Core CPU and 10-Core GPU",
                "16 GB Unified Memory | 512 GB Superfast SSD",
                "34.54 cm (13.6 Inch) Liquid Retina Display with True Tone (500 nits)",
                "Up to 18 hours battery life",
                "1080p FaceTime HD Camera & MagSafe 3 Charging Port",
                "Backlit Magic Keyboard with Touch ID"
            ],
            "specs": {
                "General": {
                    "Model Name": "MacBook Air 13-inch M3",
                    "Color": "Midnight",
                    "Operating System": "macOS Sonoma"
                },
                "Performance": {
                    "Processor": "Apple M3 (8-core CPU, 10-core GPU, 16-core Neural Engine)",
                    "RAM": "16 GB Unified RAM",
                    "Storage": "512 GB SSD"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": True,
            "deal_tag": "Best of Electronics"
        },
        {
            "title": "Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones",
            "brand": "Sony",
            "category": "Electronics",
            "subcategory": "Headphones",
            "price": 26990,
            "mrp": 34990,
            "discount": 23,
            "stock": 40,
            "rating": 4.6,
            "rating_count": 9320,
            "review_count": 810,
            "description": "Industry-leading noise cancellation optimized automatically with two processors and 8 microphones. Enjoy magnificent sound quality, crystal clear hands-free calling, and 30-hour battery life.",
            "highlights": [
                "Industry Leading Noise Cancellation with 2 processors & 8 mics",
                "Up to 30 Hours Battery Life (3 min charge gives 3 hours playback)",
                "Multipoint Connection: Pair with two Bluetooth devices at once",
                "Ultra-comfortable lightweight design in soft fit leather",
                "Speak-to-Chat and Instant Pause/Play sensors"
            ],
            "specs": {
                "General": {
                    "Type": "Over-Ear Wireless",
                    "Connectivity": "Bluetooth 5.2 / 3.5mm Aux",
                    "Color": "Black"
                },
                "Audio": {
                    "Driver Unit": "30 mm Carbon Fiber composite dome",
                    "Hi-Res Audio": "Supported (LDAC & DSEE Extreme)"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": True,
            "deal_tag": "Deal of the Day"
        },
        {
            "title": "LG 55 inch Ultra HD (4K) OLED Smart TV (OLED55C3PSA)",
            "brand": "LG",
            "category": "TVs & Appliances",
            "subcategory": "Smart TVs",
            "price": 104990,
            "mrp": 174990,
            "discount": 40,
            "stock": 12,
            "rating": 4.8,
            "rating_count": 1840,
            "review_count": 210,
            "description": "Self-lit OLED pixels shine brighter with Light Boosting Algorithm powered by α9 AI Processor Gen6. Experience infinite contrast, Dolby Vision & Atmos, and 0.1ms response time with 120Hz NVIDIA G-Sync gaming.",
            "highlights": [
                "Ultra HD (4K) 3840 x 2160 Pixels OLED Display",
                "120 Hz Refresh Rate | 0.1ms Response Time",
                "Dolby Vision IQ & Dolby Atmos with 40W 2.2 Channel Audio",
                "α9 Gen6 AI Processor 4K with AI Picture Pro & AI Sound Pro",
                "4x HDMI 2.1 Ports, eARC, VRR, ALLM, FreeSync Premium"
            ],
            "specs": {
                "Display": {
                    "Size": "55 inch (139 cm)",
                    "Technology": "Self-Lit OLED 4K",
                    "Refresh Rate": "120Hz Native"
                },
                "Smart Features": {
                    "OS": "webOS 23 with ThinQ AI",
                    "Supported Apps": "Netflix, Prime Video, Disney+ Hotstar, YouTube, Apple TV"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": True,
            "deal_tag": "Big Saving Days"
        },
        {
            "title": "Nike Air Max 270 Men's Running & Lifestyle Sneakers",
            "brand": "Nike",
            "category": "Fashion",
            "subcategory": "Men's Footwear",
            "price": 11495,
            "mrp": 14995,
            "discount": 23,
            "stock": 45,
            "rating": 4.4,
            "rating_count": 4290,
            "review_count": 380,
            "description": "Boasting Nike's biggest heel Air unit yet, the Nike Air Max 270 delivers unmatched visible cushioning underfoot and super breathable engineered mesh upper.",
            "highlights": [
                "Outer Material: Breathable Knit & Mesh",
                "Sole Material: Rubber with Max Air 270 unit",
                "Closure: Lace-Up with stretchy inner sleeve",
                "Ideal for: Running, Gym, Casual Lifestyle"
            ],
            "specs": {
                "General": {
                    "Type": "Casual / Sports Running Sneakers",
                    "Color": "Triple Black / White Swoosh",
                    "Care Instructions": "Wipe with a clean, dry cloth"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": False,
            "deal_tag": "Trending Style"
        },
        {
            "title": "Levi's Men's 511 Slim Fit Mid Rise Stretch Denim Jeans",
            "brand": "Levi's",
            "category": "Fashion",
            "subcategory": "Men's Top Wear",
            "price": 2199,
            "mrp": 3999,
            "discount": 45,
            "stock": 60,
            "rating": 4.3,
            "rating_count": 6840,
            "review_count": 520,
            "description": "A modern slim with room to move. The 511 Slim Fit Jeans are a classic since right now. These jeans sit below the waist with a slim fit from hip to ankle.",
            "highlights": [
                "Fabric: 99% Cotton, 1% Elastane for comfort stretch",
                "Fit: Slim Fit | Mid Rise",
                "Classic 5-Pocket styling with iconic Red Tab",
                "Zip fly with button closure"
            ],
            "specs": {
                "General": {
                    "Pattern": "Clean Washed Solid",
                    "Color": "Dark Indigo Blue",
                    "Wash Care": "Machine wash cold with like colors"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": True,
            "deal_tag": "Min 40% Off"
        },
        {
            "title": "Ergonomic High Back Mesh Office Chair with Lumbar Support & 3D Armrests",
            "brand": "Green Soul",
            "category": "Home & Furniture",
            "subcategory": "Office Chairs",
            "price": 8999,
            "mrp": 18990,
            "discount": 52,
            "stock": 22,
            "rating": 4.5,
            "rating_count": 3120,
            "review_count": 270,
            "description": "Experience superior lumbar comfort during long working hours. Engineered with breathable Korean mesh, synchronous tilt lock mechanism, and heavy-duty nylon base.",
            "highlights": [
                "Adjustable 2D Lumbar Support & 3D Multi-directional Armrests",
                "Breathable Korean Mesh Backrest with soft Molded Foam Seat",
                "Heavy-Duty Class 4 Gas Lift (Certified up to 135 kg)",
                "Smooth Rolling 60mm PU Castor Wheels",
                "3 Years Manufacturer Warranty"
            ],
            "specs": {
                "General": {
                    "Material": "Korean Mesh + High Density Molded Foam",
                    "Color": "Smart Grey & Black",
                    "Assembly": "DIY (Tool kit & manual included)"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": True,
            "deal_tag": "Special Price"
        },
        {
            "title": "Samsung 253 L 3 Star Frost Free Double Door Refrigerator (Digital Inverter)",
            "brand": "Samsung",
            "category": "TVs & Appliances",
            "subcategory": "Refrigerators",
            "price": 24490,
            "mrp": 31990,
            "discount": 23,
            "stock": 14,
            "rating": 4.4,
            "rating_count": 8910,
            "review_count": 710,
            "description": "Keep food fresh up to 15 days with All-around Cooling and Smart Digital Inverter Compressor with 20 Years Warranty.",
            "highlights": [
                "Capacity: 253 Litres | Suitable for families with 2 to 3 members",
                "3 Star Energy Rating with Energy Saving Digital Inverter",
                "Toughened Glass Shelves with 175kg load bearing capacity",
                "Stabilizer Free Operation (100V - 300V)",
                "20-Year Warranty on Inverter Compressor"
            ],
            "specs": {
                "General": {
                    "Defrosting Type": "Frost Free",
                    "Door Type": "Double Door",
                    "Color": "Elegant Inox Steel"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": False,
            "deal_tag": ""
        },
        {
            "title": "L'Oreal Paris Revitalift 1.5% Hyaluronic Acid Serum (50 ml)",
            "brand": "L'Oreal",
            "category": "Beauty, Food & Toys",
            "subcategory": "Skincare",
            "price": 799,
            "mrp": 1099,
            "discount": 27,
            "stock": 80,
            "rating": 4.5,
            "rating_count": 14500,
            "review_count": 1200,
            "description": "Our highest concentration of Hyaluronic Acid. Instantly hydrates skin and reduces fine lines by 60% with regular use. Lightweight, non-sticky and suitable for all skin types.",
            "highlights": [
                "1.5% Pure Hyaluronic Acid concentration",
                "Instantly plumps & deeply hydrates skin",
                "Dermatologically tested & fragrance free",
                "Paraben-free and non-comedogenic formula"
            ],
            "specs": {
                "General": {
                    "Quantity": "50 ml",
                    "Skin Type": "All Skin Types",
                    "Formulation": "Lightweight Liquid Serum"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1608248597359-299f1873130d?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": True,
            "deal_tag": "Flash Sale"
        },
        {
            "title": "Fortune Sunlite Refined Sunflower Oil Pouch (5 L)",
            "brand": "Fortune",
            "category": "Grocery",
            "subcategory": "Staples",
            "price": 649,
            "mrp": 820,
            "discount": 20,
            "stock": 100,
            "rating": 4.6,
            "rating_count": 22400,
            "review_count": 1800,
            "description": "Fortune Sunlite Refined Sunflower Oil is enriched with Vitamins A and D. It is light, easy to digest and helps keep your heart healthy.",
            "highlights": [
                "Pack of 1 x 5 Litre Jar / Can",
                "Rich in Omega 6 and Vitamin A & D",
                "Light & Non-Greasy cooking oil",
                "High Smoke Point suitable for all Indian cooking"
            ],
            "specs": {
                "General": {
                    "Type": "Sunflower Oil",
                    "Net Quantity": "5 Litres",
                    "Shelf Life": "9 Months"
                }
            },
            "images": [
                "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80"
            ],
            "is_assured": True,
            "is_deal": False,
            "deal_tag": ""
        }
    ]

    for p in products:
        cursor.execute('''
        INSERT INTO products (
            title, brand, category, subcategory, price, mrp, discount, stock,
            rating, rating_count, review_count, description, highlights, specs,
            images, is_assured, is_deal, deal_tag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            p['title'], p['brand'], p['category'], p['subcategory'], p['price'], p['mrp'],
            p['discount'], p['stock'], p['rating'], p['rating_count'], p['review_count'],
            p['description'], json.dumps(p['highlights']), json.dumps(p['specs']),
            json.dumps(p['images']), 1 if p['is_assured'] else 0, 1 if p['is_deal'] else 0,
            p['deal_tag']
        ))
        product_id = cursor.lastrowid

        # Insert some sample verified reviews for products
        sample_reviews = [
            {
                "user_name": "Rahul Sharma",
                "rating": 5,
                "title": "Exceptional Quality! Ramdev Store delivery was super fast.",
                "comment": "Totally worth every rupee. Outstanding build quality, packaging was 10/10 and received genuine sealed product.",
                "verified_purchase": True
            },
            {
                "user_name": "Priya Patel",
                "rating": 4,
                "title": "Very Good Product",
                "comment": "Loving the performance so far. Value for money purchase during festive offers.",
                "verified_purchase": True
            },
            {
                "user_name": "Amit Kumar",
                "rating": 5,
                "title": "Awesome! Ramdev Store Assured promise kept.",
                "comment": "Got delivery in just 24 hours. Highly recommended to everyone looking for premium experience.",
                "verified_purchase": True
            }
        ]
        for rev in sample_reviews:
            cursor.execute('''
            INSERT INTO reviews (product_id, user_name, rating, title, comment, verified_purchase)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', (product_id, rev['user_name'], rev['rating'], rev['title'], rev['comment'], 1 if rev['verified_purchase'] else 0))

    # Add a sample placed order
    sample_order = {
        "id": "OD13948201948",
        "customer_name": "Gautam Rathva",
        "customer_email": "gautam.rathva@ramdevstore.com",
        "customer_phone": "9876543210",
        "shipping_address": {
            "name": "Gautam Rathva",
            "phone": "9876543210",
            "pincode": "110001",
            "locality": "Connaught Place",
            "address": "Flat 402, Block B, Central Towers",
            "city": "New Delhi",
            "state": "Delhi",
            "landmark": "Near Metro Gate 2",
            "type": "Home"
        },
        "items": [
            {
                "product_id": 5,
                "title": "Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones",
                "price": 26990,
                "mrp": 34990,
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                "quantity": 1
            }
        ],
        "total_amount": 26990,
        "discount_amount": 8000,
        "delivery_charges": 0,
        "payment_method": "UPI (Google Pay)",
        "payment_status": "Success",
        "order_status": "Shipped",
        "tracking_history": [
            {"status": "Placed", "time": "2026-08-24 14:30", "detail": "Order placed successfully"},
            {"status": "Processing", "time": "2026-08-24 16:00", "detail": "Seller has processed your order"},
            {"status": "Shipped", "time": "2026-08-25 08:15", "detail": "Item shipped with Express Logistics"}
        ]
    }

    cursor.execute('''
    INSERT INTO orders (
        id, customer_name, customer_email, customer_phone, shipping_address,
        items, total_amount, discount_amount, delivery_charges, payment_method,
        payment_status, order_status, tracking_history
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        sample_order['id'], sample_order['customer_name'], sample_order['customer_email'],
        sample_order['customer_phone'], json.dumps(sample_order['shipping_address']),
        json.dumps(sample_order['items']), sample_order['total_amount'],
        sample_order['discount_amount'], sample_order['delivery_charges'],
        sample_order['payment_method'], sample_order['payment_status'],
        sample_order['order_status'], json.dumps(sample_order['tracking_history'])
    ))

    conn.commit()
    conn.close()
    print("Database seeded with sample Ramdev Store categories, products, reviews & orders!")

if __name__ == '__main__':
    seed_database()
