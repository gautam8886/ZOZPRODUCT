# 🛒 Ramdev Store - Modern E-Commerce Platform

A feature-rich, high-performance, full-stack E-Commerce web application built with Python Flask, SQLite, and vanilla JavaScript + Tailwind CSS. Designed with an authentic shopping experience, custom dark pastel green branding, direct product image uploads, and seller dashboard.

---

## 🌟 Key Features

- **🌿 Premium Branding**: Custom Dark Pastel Green (#1f513b) & Gold aesthetic with custom Z-Icon branding.
- **📸 Direct Photo Uploads**: Drag-and-drop or file upload for product images with instant preview and local storage fallback.
- **🏬 Store Management & Seller Hub**:
  - Add, edit, and delete products with rich categorized specifications, highlights, and stock tracking.
  - KPI Analytics: Total Products, Total Orders, Total Revenue, and Low Stock Alerts.
  - Manage and update customer order lifecycle status (Placed, Processing, Shipped, Delivered).
- **🛍️ Complete Shopping Flow**:
  - Hero Ad Banners (Featuring Farm Fresh Organic Jackfruit).
  - Search Autocomplete with instant keyword filtering.
  - Dynamic Filters: Categories, Price Range, Ratings, Brands, and Assured Products.
  - Product Details: Multi-image gallery with zoom, Pincode Delivery checker, Key Highlights, Specifications table, and verified customer ratings/reviews.
  - Shopping Cart with real-time savings calculator.
  - 4-Step Checkout Accordion with Address, Order Summary, and UPI/Card/COD payments.
  - Live 4-Stage Order Tracking Stepper with printable invoice generation.
- **⚡ Lightweight & Fast**: Zero complex build chains, fast loading times, and full responsive design across desktop, tablet, and mobile.

---

## 📂 Project Architecture

`
ramdevstore/
├── app.py              # Main Flask REST API & routing server
├── models.py           # SQLite database schema initialization
├── seed_data.py        # Database seeder
├── database.db         # Persistent SQLite database
├── requirements.txt    # Python dependencies
├── Procfile            # Deployment process definition (Render, Heroku, Railway)
├── templates/
│   └── index.html      # Single Page Application HTML shell
├── static/
│   ├── css/styles.css  # Custom CSS styles, badge styles, zoom & animations
│   ├── js/app.js       # Frontend controller (SPA router, state, cart, checkout)
│   └── uploads/        # Uploaded product images directory
└── tests/
    └── test_api.py     # Automated backend API test suite
`

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9 or higher

### 2. Installation
Clone the repository and install dependencies:
`ash
git clone <repository_url>
cd ramdevstore
pip install -r requirements.txt
`

### 3. Run Locally
`ash
python app.py
`
Open your browser and visit: **http://localhost:5000**

---

## ☁️ Deployment (Render / Railway / PythonAnywhere)

1. Push this repository to your GitHub account.
2. Link the repository to [Render.com](https://render.com) or [Railway.app](https://railway.app).
3. Set the **Build Command** to: pip install -r requirements.txt
4. Set the **Start Command** to: gunicorn app:app

---

## 📜 License
MIT License • Built with ❤️ for Ramdev Store
