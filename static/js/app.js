/**
 * Flipkart Clone - Full Frontend Application Controller
 * Handles Routing, State, REST API synchronization, Catalog, Cart, Checkout & Admin Portal
 */

const app = {
    state: {
        currentView: 'home',
        user: JSON.parse(localStorage.getItem('fk_user')) || {
            name: 'Gautam Rathva',
            email: 'gautam.rathva@zozproducts.com',
            phone: '9876543210',
            isLoggedIn: true
        },
        categories: [],
        banners: [],
        deals: [],
        cart: JSON.parse(localStorage.getItem('fk_cart')) || [],
        wishlist: JSON.parse(localStorage.getItem('fk_wishlist')) || [],
        savedAddress: JSON.parse(localStorage.getItem('fk_address')) || {
            name: 'Gautam Rathva',
            phone: '9876543210',
            pincode: '110001',
            locality: 'Connaught Place',
            address: 'Flat 402, Block B, Central Towers',
            city: 'New Delhi',
            state: 'Delhi',
            landmark: 'Near Metro Station',
            type: 'Home'
        },
        catalogFilters: {
            category: 'all',
            subcategory: '',
            search: '',
            min_price: null,
            max_price: null,
            brands: [],
            min_rating: null,
            is_assured: false,
            is_deal: false,
            sort: 'relevance'
        },
        currentProduct: null,
        currentOrder: null,
        adminTab: 'add-product',
        activeBannerIndex: 0,
        bannerInterval: null,
        dealTimerInterval: null
    },

    // ----------------- INITIALIZATION -----------------
    init: async function() {
        console.log("🚀 Initializing Flipkart Application...");
        this.updateHeaderBadges();
        this.updateUserBtn();
        await this.loadCategories();
        await this.loadBanners();
        this.renderCategoryBar();
        this.navigate('home');
        this.startDealCountdown();
    },

    // ----------------- NAVIGATION & ROUTER -----------------
    navigate: function(view, params = {}) {
        this.state.currentView = view;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const container = document.getElementById('app-container');
        if (!container) return;

        // Clear intervals when leaving home
        if (view !== 'home' && this.state.bannerInterval) {
            clearInterval(this.state.bannerInterval);
            this.state.bannerInterval = null;
        }

        switch(view) {
            case 'home':
                this.renderHome();
                break;
            case 'catalog':
                if (params.category) this.state.catalogFilters.category = params.category;
                if (params.subcategory) this.state.catalogFilters.subcategory = params.subcategory;
                if (params.search !== undefined) this.state.catalogFilters.search = params.search;
                this.renderCatalog();
                break;
            case 'detail':
                if (params.id) this.renderProductDetail(params.id);
                break;
            case 'cart':
                this.renderCart();
                break;
            case 'wishlist':
                this.renderWishlist();
                break;
            case 'checkout':
                this.renderCheckout();
                break;
            case 'order-success':
                this.renderOrderSuccess();
                break;
            case 'my-orders':
                this.renderMyOrders();
                break;
            case 'admin':
                this.renderAdmin();
                break;
            default:
                this.renderHome();
        }
    },

    // ----------------- DATA FETCHING -----------------
    loadCategories: async function() {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                this.state.categories = data.categories;
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    },

    loadBanners: async function() {
        try {
            const res = await fetch('/api/banners');
            const data = await res.json();
            if (data.success) {
                this.state.banners = data.banners;
            }
        } catch (err) {
            console.error("Error loading banners:", err);
        }
    },

    // ----------------- CATEGORY NAVBAR -----------------
    renderCategoryBar: function() {
        const bar = document.getElementById('category-bar');
        if (!bar || !this.state.categories.length) return;

        let html = `
            <div class="flex items-center gap-1 min-w-[70px] flex-col cursor-pointer p-1.5 hover:text-fkBlue transition group" onclick="app.filterByCategory('all')">
                <div class="w-14 h-14 flex items-center justify-center rounded-full bg-blue-50 text-fkBlue group-hover:scale-105 transition-transform">
                    <i class="fa-solid fa-border-all text-xl"></i>
                </div>
                <span class="text-xs font-medium mt-1 text-gray-800 group-hover:text-fkBlue">All Categories</span>
            </div>
        `;

        this.state.categories.forEach(cat => {
            html += `
                <div class="relative group flex items-center gap-1 min-w-[80px] flex-col cursor-pointer p-1.5 transition" onclick="app.filterByCategory('${cat.name}')">
                    <div class="w-14 h-14 flex items-center justify-center overflow-hidden rounded-md group-hover:scale-105 transition-transform">
                        <img src="${cat.icon}" alt="${cat.name}" class="w-full h-full object-contain" onerror="this.src='https://rukminim2.flixcart.com/flap/128/128/image/22fddf3c7da4c4f4.png'">
                    </div>
                    <span class="text-xs font-semibold text-gray-800 group-hover:text-fkBlue flex items-center gap-0.5">
                        ${cat.name}
                        ${cat.subcategories && cat.subcategories.length ? '<i class="fa-solid fa-chevron-down text-[8px] text-gray-400 group-hover:rotate-180 transition-transform"></i>' : ''}
                    </span>

                    ${cat.subcategories && cat.subcategories.length ? `
                        <div class="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 min-w-[180px]">
                            <div class="bg-white text-gray-800 rounded shadow-xl border border-gray-200 py-1 text-xs">
                                ${cat.subcategories.map(sub => `
                                    <a href="javascript:void(0)" onclick="event.stopPropagation(); app.filterBySubcategory('${cat.name}', '${sub}')" class="block px-4 py-2 hover:bg-blue-50 hover:text-fkBlue font-medium">
                                        ${sub}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        bar.innerHTML = html;
    },

    filterByCategory: function(category) {
        this.state.catalogFilters.category = category;
        this.state.catalogFilters.subcategory = '';
        this.state.catalogFilters.search = '';
        this.navigate('catalog');
    },

    filterBySubcategory: function(category, subcategory) {
        this.state.catalogFilters.category = category;
        this.state.catalogFilters.subcategory = subcategory;
        this.state.catalogFilters.search = '';
        this.navigate('catalog');
    },

    // ----------------- VIEW: HOME -----------------
    renderHome: async function() {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="space-y-5">
                <!-- HERO JACKFRUIT AD BANNER -->
                <div class="relative bg-white rounded-sm shadow-sm overflow-hidden min-h-[220px] sm:min-h-[300px] md:min-h-[360px] border border-gray-200">
                    <div class="relative w-full h-full min-h-[220px] sm:min-h-[300px] md:min-h-[360px] flex items-center">
                        <img src="https://tse4.mm.bing.net/th/id/OIP.ahUGTGa38uwugjYINMfW2QHaE4?r=0&pid=Api&P=0&h=180" alt="Fresh Organic Jackfruit" class="absolute inset-0 w-full h-full object-cover">
                        <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent flex flex-col justify-center px-6 sm:px-12 text-white">
                            <span class="inline-flex items-center gap-1.5 bg-fkYellow text-gray-900 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider px-3 py-1 rounded-sm w-fit mb-2.5 shadow-sm">
                                <i class="fa-solid fa-leaf text-green-700"></i> 100% Organic & Farm Fresh
                            </span>
                            <h1 class="text-2xl sm:text-4xl md:text-5xl font-black font-inter tracking-tight drop-shadow-md max-w-2xl leading-tight">
                                Fresh Organic Farm Jackfruit <span class="text-fkYellow">(कटहल)</span>
                            </h1>
                            <p class="text-xs sm:text-base text-gray-200 mt-2 max-w-xl leading-relaxed drop-shadow">
                                Naturally grown, tender, high in dietary fiber & essential nutrients. Sourced directly from verified organic farms.
                            </p>
                            <div class="flex items-center gap-3 mt-5 flex-wrap">
                                <button onclick="app.filterByCategory('Grocery')" class="bg-fkYellow hover:bg-fkYellowDark text-gray-900 text-xs sm:text-sm font-bold px-6 py-2.5 rounded-sm shadow-lg transition flex items-center gap-2">
                                    <i class="fa-solid fa-bag-shopping"></i> Shop Fresh Jackfruit
                                </button>
                                <button onclick="app.openAddProductModal()" class="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-sm border border-white/40 transition flex items-center gap-2">
                                    <i class="fa-solid fa-plus"></i> Add New Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FEATURED PRODUCTS / STORE CATALOG SECTION -->
                <div class="bg-white rounded-sm shadow-sm p-4 sm:p-5 border border-gray-200">
                    <div class="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                        <div>
                            <h2 class="text-lg sm:text-xl font-bold font-inter text-gray-900">ZOZ Products Catalog</h2>
                            <p class="text-xs text-gray-500">Explore items available in our store</p>
                        </div>
                        <button onclick="app.filterByCategory('all')" class="bg-fkBlue hover:bg-fkBlueDark text-white text-xs font-semibold px-4 py-2 rounded-sm shadow-sm transition">
                            VIEW ALL
                        </button>
                    </div>

                    <!-- Products Grid -->
                    <div id="home-products-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                        <div class="col-span-full py-8 text-center text-gray-400 text-xs"><i class="fa-solid fa-circle-notch fa-spin text-lg text-fkBlue mb-2"></i><p>Loading products...</p></div>
                    </div>
                </div>

                <!-- VALUE PROPOSITIONS STRIP -->
                <div class="bg-white rounded-sm shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border border-gray-200">
                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 rounded-full bg-emerald-50 text-fkGreen flex items-center justify-center text-xl mb-2">
                            <i class="fa-solid fa-leaf"></i>
                        </div>
                        <h4 class="text-sm font-bold text-gray-800">100% Farm Fresh</h4>
                        <p class="text-xs text-gray-500 mt-0.5">Directly sourced organic & authentic items</p>
                    </div>

                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 rounded-full bg-yellow-50 text-fkYellowDark flex items-center justify-center text-xl mb-2">
                            <i class="fa-solid fa-truck-fast"></i>
                        </div>
                        <h4 class="text-sm font-bold text-gray-800">Fast & Free Delivery</h4>
                        <p class="text-xs text-gray-500 mt-0.5">ZOZ Assured express delivery on all orders</p>
                    </div>

                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 rounded-full bg-emerald-50 text-fkGreen flex items-center justify-center text-xl mb-2">
                            <i class="fa-solid fa-rotate-left"></i>
                        </div>
                        <h4 class="text-sm font-bold text-gray-800">Easy Replacement</h4>
                        <p class="text-xs text-gray-500 mt-0.5">Hassle-free returns & doorstep replacement</p>
                    </div>

                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-2">
                            <i class="fa-solid fa-headset"></i>
                        </div>
                        <h4 class="text-sm font-bold text-gray-800">24x7 Customer Support</h4>
                        <p class="text-xs text-gray-500 mt-0.5">Dedicated assistance for all your orders</p>
                    </div>
                </div>
            </div>
        `;

        // Fetch products for Home widgets
        this.loadHomeWidgets();
    },

    loadHomeWidgets: async function() {
        try {
            const res = await fetch('/api/products?sort=newest');
            const data = await res.json();
            const grid = document.getElementById('home-products-grid');
            if (grid) {
                if (data.success && data.products.length > 0) {
                    grid.innerHTML = data.products.map(p => this.renderProductMiniCard(p)).join('');
                } else {
                    grid.innerHTML = `
                        <div class="col-span-full py-8 text-center text-gray-500 bg-gray-50/70 rounded border border-dashed border-gray-200 p-6">
                            <div class="w-12 h-12 rounded-full bg-green-100 text-fkGreen flex items-center justify-center text-xl mx-auto mb-2">
                                <i class="fa-solid fa-box-open"></i>
                            </div>
                            <h4 class="text-sm font-bold text-gray-800">Store Ready!</h4>
                            <p class="text-xs text-gray-500 mt-0.5">Start by adding products with photos and pricing.</p>
                            <button onclick="app.openAddProductModal()" class="mt-3 bg-fkBlue hover:bg-fkBlueDark text-white px-5 py-2 rounded-sm text-xs font-bold shadow transition inline-flex items-center gap-1.5">
                                <i class="fa-solid fa-plus"></i> Add Product
                            </button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error("Error loading home widgets:", err);
        }
    },

    renderProductMiniCard: function(p) {
        const img = p.images && p.images.length ? p.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
        return `
            <div class="fk-product-card bg-white border border-gray-100 rounded-sm p-3 flex flex-col justify-between cursor-pointer group" onclick="app.navigate('detail', { id: ${p.id} })">
                <div class="relative w-full h-36 flex items-center justify-center overflow-hidden mb-2">
                    <img src="${img}" alt="${p.title}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform">
                    ${p.deal_tag ? `<span class="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">${p.deal_tag}</span>` : ''}
                </div>
                <div>
                    <h3 class="text-xs font-medium text-gray-800 line-clamp-1 group-hover:text-fkBlue" title="${p.title}">${p.title}</h3>
                    <div class="flex items-center gap-1.5 mt-1">
                        <span class="fk-rating-badge fk-rating-badge-sm">${p.rating} <i class="fa-solid fa-star text-[8px]"></i></span>
                        <span class="text-[10px] text-fkTextMuted">(${p.rating_count.toLocaleString()})</span>
                    </div>
                    <div class="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
                        <span class="text-sm font-bold text-gray-900">₹${p.price.toLocaleString('en-IN')}</span>
                        <span class="text-[11px] text-gray-400 line-through">₹${p.mrp.toLocaleString('en-IN')}</span>
                        <span class="text-[11px] font-bold text-fkGreen">${p.discount}% off</span>
                    </div>
                </div>
            </div>
        `;
    },

    // ----------------- VIEW: CATALOG / SEARCH / FILTER -----------------
    renderCatalog: async function() {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="flex flex-col md:flex-row gap-4 items-start">
                
                <!-- FILTER SIDEBAR -->
                <aside class="w-full md:w-64 bg-white rounded-sm shadow-sm p-4 border border-gray-200 select-none text-xs space-y-5" id="catalog-sidebar">
                    <div class="flex items-center justify-between border-b border-gray-200 pb-3">
                        <h3 class="text-base font-bold text-gray-900 uppercase tracking-wide">Filters</h3>
                        <button onclick="app.resetCatalogFilters()" class="text-fkBlue font-bold hover:underline uppercase text-[11px]">Clear All</button>
                    </div>

                    <!-- Categories Filter -->
                    <div class="border-b border-gray-200 pb-4">
                        <h4 class="font-bold text-gray-700 uppercase text-[11px] mb-2.5">Category</h4>
                        <div class="space-y-1.5 text-gray-700 max-h-44 overflow-y-auto pr-1">
                            <label class="flex items-center gap-2 cursor-pointer hover:text-fkBlue">
                                <input type="radio" name="cat-filter" value="all" ${this.state.catalogFilters.category === 'all' ? 'checked' : ''} onchange="app.handleFilterChange('category', 'all')" class="text-fkBlue">
                                <span>All Categories</span>
                            </label>
                            ${this.state.categories.map(c => `
                                <label class="flex items-center gap-2 cursor-pointer hover:text-fkBlue">
                                    <input type="radio" name="cat-filter" value="${c.name}" ${this.state.catalogFilters.category === c.name ? 'checked' : ''} onchange="app.handleFilterChange('category', '${c.name}')" class="text-fkBlue">
                                    <span>${c.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Price Filter -->
                    <div class="border-b border-gray-200 pb-4">
                        <h4 class="font-bold text-gray-700 uppercase text-[11px] mb-2.5">Price Range</h4>
                        <div class="space-y-2">
                            <div class="flex items-center justify-between gap-2">
                                <input type="number" id="filter-min-price" placeholder="Min" value="${this.state.catalogFilters.min_price || ''}" class="w-full px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:border-fkBlue" onchange="app.handleFilterChange('min_price', this.value ? parseFloat(this.value) : null)">
                                <span class="text-gray-400">to</span>
                                <input type="number" id="filter-max-price" placeholder="Max" value="${this.state.catalogFilters.max_price || ''}" class="w-full px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:border-fkBlue" onchange="app.handleFilterChange('max_price', this.value ? parseFloat(this.value) : null)">
                            </div>
                        </div>
                    </div>

                    <!-- Flipkart Assured Filter -->
                    <div class="border-b border-gray-200 pb-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="filter-assured" ${this.state.catalogFilters.is_assured ? 'checked' : ''} onchange="app.handleFilterChange('is_assured', this.checked)" class="w-4 h-4 text-fkBlue rounded">
                            <span class="fk-assured-pill text-xs">F-Assured</span>
                        </label>
                    </div>

                    <!-- Customer Ratings Filter -->
                    <div class="border-b border-gray-200 pb-4">
                        <h4 class="font-bold text-gray-700 uppercase text-[11px] mb-2.5">Customer Ratings</h4>
                        <div class="space-y-2">
                            <label class="flex items-center gap-2 cursor-pointer hover:text-fkBlue">
                                <input type="radio" name="rating-filter" value="4" ${this.state.catalogFilters.min_rating === 4 ? 'checked' : ''} onchange="app.handleFilterChange('min_rating', 4)" class="text-fkBlue">
                                <span class="flex items-center gap-1">4★ & above</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer hover:text-fkBlue">
                                <input type="radio" name="rating-filter" value="3" ${this.state.catalogFilters.min_rating === 3 ? 'checked' : ''} onchange="app.handleFilterChange('min_rating', 3)" class="text-fkBlue">
                                <span class="flex items-center gap-1">3★ & above</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer hover:text-fkBlue">
                                <input type="radio" name="rating-filter" value="" ${!this.state.catalogFilters.min_rating ? 'checked' : ''} onchange="app.handleFilterChange('min_rating', null)" class="text-fkBlue">
                                <span>All Ratings</span>
                            </label>
                        </div>
                    </div>

                    <!-- Brand Filter Container -->
                    <div id="brand-filter-box" class="border-b border-gray-200 pb-4">
                        <h4 class="font-bold text-gray-700 uppercase text-[11px] mb-2.5">Brand</h4>
                        <div id="brands-checkbox-list" class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            <span class="text-gray-400">Loading brands...</span>
                        </div>
                    </div>
                </aside>

                <!-- PRODUCTS RESULT MAIN PANEL -->
                <section class="flex-1 w-full bg-white rounded-sm shadow-sm p-4 border border-gray-200">
                    
                    <!-- Top Bar: Title & Sort Options -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3 mb-4">
                        <div>
                            <div class="text-xs text-gray-400 mb-0.5">
                                Home > <span class="text-gray-600">${this.state.catalogFilters.category === 'all' ? 'All Products' : this.state.catalogFilters.category}</span>
                                ${this.state.catalogFilters.subcategory ? ` > <span class="text-gray-800 font-semibold">${this.state.catalogFilters.subcategory}</span>` : ''}
                            </div>
                            <h2 class="text-lg font-bold font-inter text-gray-900">
                                ${this.state.catalogFilters.search ? `Results for "${this.state.catalogFilters.search}"` : (this.state.catalogFilters.category === 'all' ? 'All Products' : this.state.catalogFilters.category)}
                                <span id="catalog-count-badge" class="text-xs text-gray-500 font-normal ml-2"></span>
                            </h2>
                        </div>

                        <!-- Sort Tabs -->
                        <div class="flex items-center gap-2 text-xs font-medium text-gray-600 flex-wrap">
                            <span class="font-bold text-gray-800 uppercase text-[11px]">Sort By</span>
                            <button onclick="app.handleSortChange('relevance')" class="px-2.5 py-1 rounded ${this.state.catalogFilters.sort === 'relevance' ? 'text-fkBlue font-bold border-b-2 border-fkBlue' : 'hover:text-fkBlue'}">Relevance</button>
                            <button onclick="app.handleSortChange('price_asc')" class="px-2.5 py-1 rounded ${this.state.catalogFilters.sort === 'price_asc' ? 'text-fkBlue font-bold border-b-2 border-fkBlue' : 'hover:text-fkBlue'}">Price -- Low to High</button>
                            <button onclick="app.handleSortChange('price_desc')" class="px-2.5 py-1 rounded ${this.state.catalogFilters.sort === 'price_desc' ? 'text-fkBlue font-bold border-b-2 border-fkBlue' : 'hover:text-fkBlue'}">Price -- High to Low</button>
                            <button onclick="app.handleSortChange('discount_desc')" class="px-2.5 py-1 rounded ${this.state.catalogFilters.sort === 'discount_desc' ? 'text-fkBlue font-bold border-b-2 border-fkBlue' : 'hover:text-fkBlue'}">Discount</button>
                            <button onclick="app.handleSortChange('rating_desc')" class="px-2.5 py-1 rounded ${this.state.catalogFilters.sort === 'rating_desc' ? 'text-fkBlue font-bold border-b-2 border-fkBlue' : 'hover:text-fkBlue'}">Customer Rating</button>
                        </div>
                    </div>

                    <!-- Products List Grid -->
                    <div id="catalog-products-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div class="col-span-full py-16 text-center text-gray-400 text-sm">
                            <i class="fa-solid fa-circle-notch fa-spin text-2xl text-fkBlue mb-2"></i>
                            <p>Fetching matching ZOZ Products...</p>
                        </div>
                    </div>
                </section>
            </div>
        `;

        await this.fetchCatalogProducts();
    },

    fetchCatalogProducts: async function() {
        const f = this.state.catalogFilters;
        let url = `/api/products?category=${encodeURIComponent(f.category)}&sort=${f.sort}`;
        if (f.subcategory) url += `&subcategory=${encodeURIComponent(f.subcategory)}`;
        if (f.search) url += `&search=${encodeURIComponent(f.search)}`;
        if (f.min_price !== null) url += `&min_price=${f.min_price}`;
        if (f.max_price !== null) url += `&max_price=${f.max_price}`;
        if (f.min_rating) url += `&min_rating=${f.min_rating}`;
        if (f.is_assured) url += `&is_assured=1`;
        if (f.brands.length) url += `&brand=${encodeURIComponent(f.brands.join(','))}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const container = document.getElementById('catalog-products-container');
            const countBadge = document.getElementById('catalog-count-badge');

            if (!container) return;

            if (data.success && data.products.length) {
                if (countBadge) countBadge.innerText = `(${data.products.length} items)`;
                container.innerHTML = data.products.map(p => this.renderCatalogProductCard(p)).join('');
                
                // Populate Brands in filter sidebar if first time
                if (data.filter_meta && data.filter_meta.brands) {
                    this.renderBrandsFilter(data.filter_meta.brands);
                }
            } else {
                if (countBadge) countBadge.innerText = `(0 items)`;
                container.innerHTML = `
                    <div class="col-span-full py-16 text-center text-gray-500">
                        <i class="fa-solid fa-magnifying-glass text-4xl text-gray-300 mb-3"></i>
                        <h3 class="text-base font-bold text-gray-700">Sorry, no products found!</h3>
                        <p class="text-xs text-gray-400 mt-1">Please check your spelling or clear some filters.</p>
                        <button onclick="app.resetCatalogFilters()" class="mt-4 px-4 py-1.5 bg-fkBlue text-white rounded-sm text-xs font-semibold">Reset Filters</button>
                    </div>
                `;
            }
        } catch (err) {
            console.error("Error fetching catalog:", err);
        }
    },

    renderCatalogProductCard: function(p) {
        const img = p.images && p.images.length ? p.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
        const isWishlisted = this.state.wishlist.some(w => w.id === p.id);

        return `
            <div class="fk-product-card bg-white border border-gray-200 rounded-sm p-3.5 flex flex-col justify-between relative group cursor-pointer" onclick="app.navigate('detail', { id: ${p.id} })">
                
                <!-- Wishlist Heart Button -->
                <button onclick="event.stopPropagation(); app.toggleWishlist(${p.id}, '${escape(p.title)}', ${p.price}, ${p.mrp}, ${p.discount}, '${img}', ${p.rating}, ${p.is_assured})" class="absolute top-3 right-3 text-lg z-10 ${isWishlisted ? 'text-red-500' : 'text-gray-300 hover:text-red-400'} transition-colors">
                    <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>

                <!-- Product Image -->
                <div class="w-full h-44 flex items-center justify-center overflow-hidden mb-3">
                    <img src="${img}" alt="${p.title}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform">
                </div>

                <!-- Product Information -->
                <div class="space-y-1.5">
                    <h3 class="text-xs font-semibold text-gray-800 line-clamp-2 leading-relaxed group-hover:text-fkBlue" title="${p.title}">
                        ${p.title}
                    </h3>
                    
                    <div class="flex items-center gap-2">
                        <span class="fk-rating-badge fk-rating-badge-sm">${p.rating} <i class="fa-solid fa-star text-[8px]"></i></span>
                        <span class="text-[11px] text-fkTextMuted">(${p.rating_count.toLocaleString()})</span>
                        ${p.is_assured ? `<span class="fk-assured-pill text-[9px] ml-auto">F-Assured</span>` : ''}
                    </div>

                    <!-- Highlights Snippet -->
                    ${p.highlights && p.highlights.length ? `
                        <ul class="text-[11px] text-gray-500 list-disc list-inside line-clamp-2 pt-1 border-t border-gray-100">
                            ${p.highlights.slice(0, 2).map(h => `<li>${h}</li>`).join('')}
                        </ul>
                    ` : ''}

                    <!-- Pricing Details -->
                    <div class="flex items-baseline gap-2 pt-1 flex-wrap">
                        <span class="text-base font-bold text-gray-900">₹${p.price.toLocaleString('en-IN')}</span>
                        <span class="text-xs text-gray-400 line-through">₹${p.mrp.toLocaleString('en-IN')}</span>
                        <span class="text-xs font-bold text-fkGreen">${p.discount}% off</span>
                    </div>

                    <div class="text-[10px] text-fkGreen font-medium">Free Delivery</div>
                </div>

                <!-- Quick Add To Cart Button -->
                <button onclick="event.stopPropagation(); app.addToCart(${p.id}, '${escape(p.title)}', ${p.price}, ${p.mrp}, '${img}', ${p.is_assured})" class="mt-3 w-full bg-fkYellow hover:bg-fkYellowDark text-gray-900 font-bold py-1.5 rounded-sm text-xs shadow-sm transition flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-cart-plus text-xs"></i> Add to Cart
                </button>
            </div>
        `;
    },

    renderBrandsFilter: function(brands) {
        const container = document.getElementById('brands-checkbox-list');
        if (!container) return;
        container.innerHTML = brands.map(b => `
            <label class="flex items-center gap-2 cursor-pointer hover:text-fkBlue">
                <input type="checkbox" value="${b}" ${this.state.catalogFilters.brands.includes(b) ? 'checked' : ''} onchange="app.handleBrandFilterToggle('${b}', this.checked)" class="w-3.5 h-3.5 text-fkBlue rounded">
                <span>${b}</span>
            </label>
        `).join('');
    },

    handleFilterChange: function(key, val) {
        this.state.catalogFilters[key] = val;
        this.fetchCatalogProducts();
    },

    handleBrandFilterToggle: function(brand, isChecked) {
        if (isChecked) {
            if (!this.state.catalogFilters.brands.includes(brand)) this.state.catalogFilters.brands.push(brand);
        } else {
            this.state.catalogFilters.brands = this.state.catalogFilters.brands.filter(b => b !== brand);
        }
        this.fetchCatalogProducts();
    },

    handleSortChange: function(sort) {
        this.state.catalogFilters.sort = sort;
        this.renderCatalog();
    },

    resetCatalogFilters: function() {
        this.state.catalogFilters = {
            category: 'all',
            subcategory: '',
            search: '',
            min_price: null,
            max_price: null,
            brands: [],
            min_rating: null,
            is_assured: false,
            is_deal: false,
            sort: 'relevance'
        };
        this.renderCatalog();
    },

    // ----------------- VIEW: PRODUCT DETAIL -----------------
    renderProductDetail: async function(productId) {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="py-20 text-center text-gray-400">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl text-fkBlue mb-3"></i>
                <p>Loading full Flipkart product details...</p>
            </div>
        `;

        try {
            const res = await fetch(`/api/products/${productId}`);
            const data = await res.json();
            if (!data.success) {
                container.innerHTML = `<div class="bg-white p-8 text-center text-red-500 font-bold">Product not found.</div>`;
                return;
            }

            const p = data.product;
            this.state.currentProduct = p;
            const images = p.images && p.images.length ? p.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];
            const isWishlisted = this.state.wishlist.some(w => w.id === p.id);

            container.innerHTML = `
                <div class="bg-white rounded-sm shadow-sm p-4 sm:p-6 border border-gray-200">
                    
                    <!-- Breadcrumbs -->
                    <div class="text-xs text-gray-400 mb-4">
                        <a href="javascript:void(0)" onclick="app.navigate('home')" class="hover:text-fkBlue">Home</a> > 
                        <a href="javascript:void(0)" onclick="app.filterByCategory('${p.category}')" class="hover:text-fkBlue">${p.category}</a> > 
                        <span class="text-gray-700 font-medium">${p.brand}</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        
                        <!-- LEFT COLUMN: IMAGE GALLERY & ACTIONS (5 Cols) -->
                        <div class="md:col-span-5 sticky top-20">
                            <div class="flex flex-col-reverse sm:flex-row gap-3">
                                
                                <!-- Thumbnails -->
                                <div class="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[380px] no-scrollbar">
                                    ${images.map((img, idx) => `
                                        <div onclick="app.switchMainImage('${img}', this)" class="detail-thumb border-2 ${idx === 0 ? 'border-fkBlue' : 'border-gray-200'} rounded p-1 w-14 h-14 flex items-center justify-center cursor-pointer hover:border-fkBlue transition">
                                            <img src="${img}" alt="Thumbnail" class="max-h-full max-w-full object-contain">
                                        </div>
                                    `).join('')}
                                </div>

                                <!-- Main Image Box -->
                                <div class="flex-1 border border-gray-200 rounded p-4 h-[380px] flex items-center justify-center relative img-zoom-container">
                                    <img id="main-detail-img" src="${images[0]}" alt="${p.title}" class="max-h-full max-w-full object-contain">
                                    
                                    <button onclick="app.toggleWishlist(${p.id}, '${escape(p.title)}', ${p.price}, ${p.mrp}, ${p.discount}, '${images[0]}', ${p.rating}, ${p.is_assured})" class="absolute top-3 right-3 text-2xl z-10 ${isWishlisted ? 'text-red-500' : 'text-gray-300 hover:text-red-400'} transition">
                                        <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Big CTA Buttons (Add to Cart & Buy Now) -->
                            <div class="grid grid-cols-2 gap-3 mt-4">
                                <button onclick="app.addToCart(${p.id}, '${escape(p.title)}', ${p.price}, ${p.mrp}, '${images[0]}', ${p.is_assured})" class="bg-fkYellow hover:bg-fkYellowDark text-gray-900 font-bold py-3.5 rounded-sm text-sm uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-cart-shopping text-base"></i> Add to Cart
                                </button>
                                <button onclick="app.buyNow(${p.id}, '${escape(p.title)}', ${p.price}, ${p.mrp}, '${images[0]}', ${p.is_assured})" class="bg-fkOrange hover:bg-[#e05615] text-white font-bold py-3.5 rounded-sm text-sm uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-bolt text-base"></i> Buy Now
                                </button>
                            </div>
                        </div>

                        <!-- RIGHT COLUMN: PRODUCT DETAILS, SPECS, REVIEWS (7 Cols) -->
                        <div class="md:col-span-7 space-y-5">
                            
                            <!-- Title & Brand -->
                            <div>
                                <span class="text-xs font-bold text-gray-400 uppercase">${p.brand}</span>
                                <h1 class="text-xl sm:text-2xl font-bold font-inter text-gray-900 leading-snug mt-0.5">${p.title}</h1>
                            </div>

                            <!-- Rating & Reviews -->
                            <div class="flex items-center gap-3 text-xs">
                                <span class="fk-rating-badge">${p.rating} <i class="fa-solid fa-star text-[9px]"></i></span>
                                <span class="text-fkTextMuted font-medium">${p.rating_count.toLocaleString()} Ratings & ${p.review_count.toLocaleString()} Reviews</span>
                                ${p.is_assured ? `<span class="fk-assured-pill text-xs ml-2">F-Assured</span>` : ''}
                            </div>

                            <!-- Pricing -->
                            <div class="bg-green-50/60 p-3 rounded border border-green-100 space-y-1">
                                <div class="text-xs font-bold text-fkGreen">Special Price</div>
                                <div class="flex items-baseline gap-3 flex-wrap">
                                    <span class="text-3xl font-extrabold text-gray-900 font-inter">₹${p.price.toLocaleString('en-IN')}</span>
                                    <span class="text-sm text-gray-400 line-through">₹${p.mrp.toLocaleString('en-IN')}</span>
                                    <span class="text-sm font-bold text-fkGreen">${p.discount}% off</span>
                                </div>
                                <p class="text-[11px] text-gray-500">Inclusive of all taxes</p>
                            </div>

                            <!-- Available Offers -->
                            <div class="space-y-2 text-xs">
                                <h4 class="font-bold text-gray-900 text-sm">Available Offers</h4>
                                <div class="space-y-1.5 text-gray-700">
                                    <p class="flex items-start gap-2"><i class="fa-solid fa-tag text-fkGreen mt-0.5"></i> <span><strong>Bank Offer:</strong> 10% Instant Discount on HDFC Bank Credit Cards, up to ₹1,500</span></p>
                                    <p class="flex items-start gap-2"><i class="fa-solid fa-tag text-fkGreen mt-0.5"></i> <span><strong>Special Price:</strong> Get extra ₹2,000 off (price inclusive of discount)</span></p>
                                    <p class="flex items-start gap-2"><i class="fa-solid fa-tag text-fkGreen mt-0.5"></i> <span><strong>Partner Offer:</strong> Sign-up for ZOZ Pay Later & get free ₹500 Times Prime</span></p>
                                    <p class="flex items-start gap-2"><i class="fa-solid fa-tag text-fkGreen mt-0.5"></i> <span><strong>No Cost EMI:</strong> Avail No Cost EMI on select cards for orders above ₹3,000</span></p>
                                </div>
                            </div>

                            <!-- Pincode Delivery Checker -->
                            <div class="border-t border-b border-gray-200 py-3 text-xs space-y-2">
                                <span class="font-bold text-gray-700 uppercase text-[11px]">Delivery Options</span>
                                <div class="flex items-center gap-2 max-w-xs">
                                    <div class="relative flex-1">
                                        <i class="fa-solid fa-location-dot absolute left-2.5 top-2.5 text-gray-400"></i>
                                        <input type="text" id="pincode-input" value="110001" placeholder="Enter Pincode" class="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-xs outline-none focus:border-fkBlue">
                                    </div>
                                    <button onclick="app.checkPincode()" class="bg-gray-800 hover:bg-black text-white px-4 py-1.5 rounded font-semibold text-xs transition">Check</button>
                                </div>
                                <p id="pincode-result" class="text-fkGreen font-medium flex items-center gap-1.5">
                                    <i class="fa-solid fa-circle-check"></i> Free Delivery by Tomorrow, 11 PM | Faster delivery available
                                </p>
                            </div>

                            <!-- Highlights -->
                            ${p.highlights && p.highlights.length ? `
                                <div class="space-y-2 text-xs">
                                    <h4 class="font-bold text-gray-900 text-sm">Highlights</h4>
                                    <ul class="space-y-1.5 text-gray-700 list-disc list-inside">
                                        ${p.highlights.map(h => `<li>${h}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}

                            <!-- Description -->
                            <div class="space-y-2 text-xs">
                                <h4 class="font-bold text-gray-900 text-sm">Description</h4>
                                <p class="text-gray-600 leading-relaxed">${p.description}</p>
                            </div>

                            <!-- Technical Specifications Table -->
                            <div class="space-y-3 pt-2">
                                <h4 class="font-bold text-gray-900 text-sm">Specifications</h4>
                                <div class="border border-gray-200 rounded overflow-hidden text-xs">
                                    ${Object.keys(p.specs).map(catName => `
                                        <div class="bg-gray-100 px-3 py-2 font-bold text-gray-800 border-b border-gray-200">${catName}</div>
                                        <div class="divide-y divide-gray-100">
                                            ${Object.entries(p.specs[catName]).map(([key, val]) => `
                                                <div class="grid grid-cols-3 p-2.5 hover:bg-gray-50">
                                                    <span class="text-gray-500 font-medium">${key}</span>
                                                    <span class="col-span-2 text-gray-800">${val}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Ratings & Reviews Section -->
                            <div class="space-y-4 pt-4 border-t border-gray-200">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="font-bold text-gray-900 text-base">Ratings & Reviews</h4>
                                        <p class="text-xs text-gray-500">From verified ZOZ customers</p>
                                    </div>
                                    <button onclick="app.openReviewModal(${p.id})" class="bg-fkBlue hover:bg-fkBlueDark text-white px-4 py-2 rounded-sm text-xs font-semibold shadow-sm transition">
                                        Rate Product
                                    </button>
                                </div>

                                <!-- Reviews List -->
                                <div class="space-y-3">
                                    ${p.reviews && p.reviews.length ? p.reviews.map(rev => `
                                        <div class="border-b border-gray-100 pb-3 text-xs space-y-1">
                                            <div class="flex items-center gap-2">
                                                <span class="fk-rating-badge fk-rating-badge-sm">${rev.rating} <i class="fa-solid fa-star text-[8px]"></i></span>
                                                <strong class="text-gray-900 text-sm">${rev.title || 'Great product'}</strong>
                                            </div>
                                            <p class="text-gray-600 leading-relaxed">${rev.comment}</p>
                                            <div class="text-[11px] text-gray-400 flex items-center gap-2 pt-0.5">
                                                <span class="font-medium text-gray-600">${rev.user_name}</span>
                                                <span>•</span>
                                                <span class="text-fkGreen flex items-center gap-1"><i class="fa-solid fa-circle-check text-[10px]"></i> Certified Buyer</span>
                                                <span>•</span>
                                                <span>${rev.created_at ? rev.created_at.split(' ')[0] : 'Recent'}</span>
                                            </div>
                                        </div>
                                    `).join('') : `
                                        <p class="text-xs text-gray-400 italic">No customer reviews yet. Be the first to review this product!</p>
                                    `}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error("Error loading product detail:", err);
        }
    },

    switchMainImage: function(src, thumbElem) {
        const main = document.getElementById('main-detail-img');
        if (main) main.src = src;
        document.querySelectorAll('.detail-thumb').forEach(el => {
            el.classList.remove('border-fkBlue');
            el.classList.add('border-gray-200');
        });
        if (thumbElem) {
            thumbElem.classList.remove('border-gray-200');
            thumbElem.classList.add('border-fkBlue');
        }
    },

    checkPincode: function() {
        const input = document.getElementById('pincode-input');
        const res = document.getElementById('pincode-result');
        if (input && res) {
            const val = input.value.trim();
            if (val.length === 6 && !isNaN(val)) {
                res.innerHTML = `<span class="text-fkGreen font-semibold"><i class="fa-solid fa-circle-check"></i> Available! Delivery to ${val} by Tomorrow 11 PM with Free Shipping.</span>`;
            } else {
                res.innerHTML = `<span class="text-red-500 font-semibold"><i class="fa-solid fa-circle-xmark"></i> Please enter a valid 6-digit Indian pincode.</span>`;
            }
        }
    },

    // ----------------- CART & WISHLIST LOGIC -----------------
    addToCart: function(id, title, price, mrp, image, is_assured) {
        title = unescape(title);
        const existing = this.state.cart.find(item => item.product_id === id);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.state.cart.push({
                product_id: id,
                title: title,
                price: price,
                mrp: mrp,
                image: image,
                is_assured: is_assured,
                quantity: 1
            });
        }
        localStorage.setItem('fk_cart', JSON.stringify(this.state.cart));
        this.updateHeaderBadges();
        this.showToast(`"${title.slice(0, 24)}..." added to your ZOZ Cart!`, 'success');
    },

    buyNow: function(id, title, price, mrp, image, is_assured) {
        this.addToCart(id, title, price, mrp, image, is_assured);
        this.navigate('checkout');
    },

    updateCartQuantity: function(productId, delta) {
        const item = this.state.cart.find(i => i.product_id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            this.removeFromCart(productId);
            return;
        }
        localStorage.setItem('fk_cart', JSON.stringify(this.state.cart));
        this.updateHeaderBadges();
        this.renderCart();
    },

    removeFromCart: function(productId) {
        this.state.cart = this.state.cart.filter(i => i.product_id !== productId);
        localStorage.setItem('fk_cart', JSON.stringify(this.state.cart));
        this.updateHeaderBadges();
        this.renderCart();
        this.showToast('Item removed from cart', 'info');
    },

    toggleWishlist: function(id, title, price, mrp, discount, image, rating, is_assured) {
        title = unescape(title);
        const index = this.state.wishlist.findIndex(w => w.id === id);
        if (index > -1) {
            this.state.wishlist.splice(index, 1);
            this.showToast(`Removed from Wishlist`, 'info');
        } else {
            this.state.wishlist.push({ id, title, price, mrp, discount, image, rating, is_assured });
            this.showToast(`Added to Wishlist!`, 'success');
        }
        localStorage.setItem('fk_wishlist', JSON.stringify(this.state.wishlist));
        this.updateHeaderBadges();
        
        // Re-render if in wishlist view or detail view
        if (this.state.currentView === 'wishlist') {
            this.renderWishlist();
        } else if (this.state.currentView === 'detail' && this.state.currentProduct) {
            this.renderProductDetail(this.state.currentProduct.id);
        } else if (this.state.currentView === 'catalog') {
            this.fetchCatalogProducts();
        }
    },

    updateHeaderBadges: function() {
        const cartBadge = document.getElementById('cart-badge');
        const wishBadge = document.getElementById('wishlist-badge');

        const totalCartItems = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartBadge) {
            cartBadge.innerText = totalCartItems;
            cartBadge.classList.toggle('hidden', totalCartItems === 0);
        }

        if (wishBadge) {
            const count = this.state.wishlist.length;
            wishBadge.innerText = count;
            wishBadge.classList.toggle('hidden', count === 0);
        }
    },

    // ----------------- VIEW: CART -----------------
    renderCart: function() {
        const container = document.getElementById('app-container');
        if (!this.state.cart.length) {
            container.innerHTML = `
                <div class="bg-white rounded-sm shadow-sm p-12 text-center max-w-xl mx-auto border border-gray-200 my-8">
                    <img src="https://rukminim2.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png?q=90" alt="Empty Cart" class="w-48 mx-auto mb-4">
                    <h3 class="text-lg font-bold text-gray-800">Your ZOZ Products Cart is empty!</h3>
                    <p class="text-xs text-gray-500 mt-1">Explore our deals and add items to your cart now.</p>
                    <button onclick="app.navigate('home')" class="mt-5 bg-fkBlue hover:bg-fkBlueDark text-white px-8 py-2.5 rounded-sm font-semibold text-xs shadow transition">
                        Shop Now
                    </button>
                </div>
            `;
            return;
        }

        // Calculations
        let totalMrp = 0;
        let totalSellingPrice = 0;
        this.state.cart.forEach(item => {
            totalMrp += (item.mrp || item.price) * item.quantity;
            totalSellingPrice += item.price * item.quantity;
        });
        const totalDiscount = totalMrp - totalSellingPrice;
        const deliveryFee = totalSellingPrice > 500 ? 0 : 40;
        const finalAmount = totalSellingPrice + deliveryFee;

        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                <!-- LEFT: Cart Items (8 Cols) -->
                <div class="lg:col-span-8 space-y-3">
                    
                    <!-- Flipkart Delivery Pincode Bar -->
                    <div class="bg-white p-3 rounded-sm shadow-sm border border-gray-200 flex items-center justify-between text-xs">
                        <div class="flex items-center gap-2 text-gray-700">
                            <span>Deliver to: <strong>${this.state.savedAddress.name}, ${this.state.savedAddress.pincode}</strong></span>
                            <span class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">${this.state.savedAddress.type}</span>
                        </div>
                        <button onclick="app.navigate('checkout')" class="text-fkBlue font-bold hover:underline">Change</button>
                    </div>

                    <!-- Items List -->
                    <div class="bg-white rounded-sm shadow-sm border border-gray-200 divide-y divide-gray-200">
                        ${this.state.cart.map(item => `
                            <div class="p-4 flex flex-col sm:flex-row items-start gap-4">
                                <div class="w-24 h-24 flex items-center justify-center shrink-0 border border-gray-100 rounded">
                                    <img src="${item.image}" alt="${item.title}" class="max-h-full max-w-full object-contain">
                                </div>
                                <div class="flex-1 space-y-1.5">
                                    <h4 class="text-sm font-semibold text-gray-800 hover:text-fkBlue cursor-pointer" onclick="app.navigate('detail', { id: ${item.product_id} })">${item.title}</h4>
                                    <div class="text-[11px] text-gray-400">Seller: SuperComNet ${item.is_assured ? '<span class="fk-assured-pill ml-2">F-Assured</span>' : ''}</div>
                                    
                                    <div class="flex items-baseline gap-2 pt-1">
                                        <span class="text-base font-bold text-gray-900">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                        <span class="text-xs text-gray-400 line-through">₹${(item.mrp * item.quantity).toLocaleString('en-IN')}</span>
                                        <span class="text-xs font-bold text-fkGreen">${Math.round(((item.mrp - item.price) / item.mrp) * 100)}% Off</span>
                                    </div>

                                    <!-- Quantity Controls & Actions -->
                                    <div class="flex items-center gap-5 pt-3 text-xs">
                                        <div class="flex items-center border border-gray-300 rounded">
                                            <button onclick="app.updateCartQuantity(${item.product_id}, -1)" class="px-2.5 py-1 hover:bg-gray-100 font-bold text-gray-600">-</button>
                                            <span class="px-3 py-1 font-bold text-gray-800 text-center min-w-[28px] border-x border-gray-300">${item.quantity}</span>
                                            <button onclick="app.updateCartQuantity(${item.product_id}, 1)" class="px-2.5 py-1 hover:bg-gray-100 font-bold text-gray-600">+</button>
                                        </div>

                                        <button onclick="app.removeFromCart(${item.product_id})" class="font-bold text-gray-700 hover:text-red-600 uppercase tracking-wide">Remove</button>
                                        <button onclick="app.removeFromCart(${item.product_id})" class="font-bold text-gray-700 hover:text-fkBlue uppercase tracking-wide">Save for later</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}

                        <!-- Place Order Bar -->
                        <div class="p-4 flex justify-end bg-white sticky bottom-0 border-t border-gray-200">
                            <button onclick="app.navigate('checkout')" class="bg-fkOrange hover:bg-[#e05615] text-white font-bold px-10 py-3.5 rounded-sm text-sm uppercase tracking-wider shadow-lg transition">
                                Place Order
                            </button>
                        </div>
                    </div>

                </div>

                <!-- RIGHT: Price Details Card (4 Cols) -->
                <div class="lg:col-span-4 sticky top-20">
                    <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-4 text-xs space-y-4">
                        <h3 class="font-bold text-gray-400 uppercase text-[11px] tracking-wider border-b border-gray-200 pb-3">Price Details</h3>

                        <div class="space-y-3 text-gray-700">
                            <div class="flex justify-between">
                                <span>Price (${this.state.cart.length} items)</span>
                                <span>₹${totalMrp.toLocaleString('en-IN')}</span>
                            </div>
                            <div class="flex justify-between text-fkGreen">
                                <span>Discount</span>
                                <span>- ₹${totalDiscount.toLocaleString('en-IN')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Delivery Charges</span>
                                <span>${deliveryFee === 0 ? '<span class="text-fkGreen font-bold">FREE</span>' : `₹${deliveryFee}`}</span>
                            </div>
                        </div>

                        <div class="border-t border-b border-dashed border-gray-300 py-3 flex justify-between text-base font-bold text-gray-900 font-inter">
                            <span>Total Amount</span>
                            <span>₹${finalAmount.toLocaleString('en-IN')}</span>
                        </div>

                        <div class="text-fkGreen font-bold text-xs bg-green-50 p-2 rounded">
                            You will save ₹${totalDiscount.toLocaleString('en-IN')} on this order
                        </div>
                    </div>

                    <div class="mt-4 flex items-center gap-3 text-gray-400 text-xs px-2">
                        <i class="fa-solid fa-shield-halved text-2xl text-gray-400"></i>
                        <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
                    </div>
                </div>

            </div>
        `;
    },

    // ----------------- VIEW: WISHLIST -----------------
    renderWishlist: function() {
        const container = document.getElementById('app-container');
        if (!this.state.wishlist.length) {
            container.innerHTML = `
                <div class="bg-white rounded-sm shadow-sm p-12 text-center max-w-md mx-auto border border-gray-200 my-8">
                    <i class="fa-regular fa-heart text-5xl text-gray-300 mb-3"></i>
                    <h3 class="text-lg font-bold text-gray-800">Your ZOZ Products Wishlist is empty</h3>
                    <p class="text-xs text-gray-500 mt-1">Explore more and shortlist some items!</p>
                    <button onclick="app.navigate('catalog')" class="mt-5 bg-fkBlue hover:bg-fkBlueDark text-white px-6 py-2 rounded-sm font-semibold text-xs shadow transition">
                        Browse Products
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="bg-white rounded-sm shadow-sm p-4 sm:p-6 border border-gray-200">
                <div class="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                    <h2 class="text-lg font-bold text-gray-900">My Wishlist (${this.state.wishlist.length})</h2>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    ${this.state.wishlist.map(p => `
                        <div class="border border-gray-200 rounded-sm p-3 flex flex-col justify-between relative group">
                            <button onclick="app.toggleWishlist(${p.id})" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                            <div class="w-full h-36 flex items-center justify-center mb-2 cursor-pointer" onclick="app.navigate('detail', { id: ${p.id} })">
                                <img src="${p.image}" alt="${p.title}" class="max-h-full max-w-full object-contain">
                            </div>
                            <div>
                                <h3 class="text-xs font-semibold text-gray-800 line-clamp-1 cursor-pointer hover:text-fkBlue" onclick="app.navigate('detail', { id: ${p.id} })">${p.title}</h3>
                                <div class="flex items-baseline gap-2 mt-1">
                                    <span class="text-sm font-bold text-gray-900">₹${p.price.toLocaleString('en-IN')}</span>
                                    <span class="text-[11px] text-gray-400 line-through">₹${p.mrp.toLocaleString('en-IN')}</span>
                                    <span class="text-[11px] font-bold text-fkGreen">${p.discount}% off</span>
                                </div>
                            </div>
                            <button onclick="app.addToCart(${p.id}, '${escape(p.title)}', ${p.price}, ${p.mrp}, '${p.image}', ${p.is_assured})" class="mt-3 w-full bg-fkYellow hover:bg-fkYellowDark text-gray-900 font-bold py-1.5 rounded-sm text-xs shadow-sm">
                                Move to Cart
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // ----------------- VIEW: CHECKOUT ACCORDION -----------------
    renderCheckout: function() {
        const container = document.getElementById('app-container');
        if (!this.state.cart.length) {
            this.navigate('cart');
            return;
        }

        let totalSellingPrice = 0;
        let totalMrp = 0;
        this.state.cart.forEach(i => {
            totalMrp += (i.mrp || i.price) * i.quantity;
            totalSellingPrice += i.price * i.quantity;
        });
        const totalDiscount = totalMrp - totalSellingPrice;
        const deliveryFee = totalSellingPrice > 500 ? 0 : 40;
        const finalAmount = totalSellingPrice + deliveryFee;

        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                <!-- LEFT ACCORDION STEPS (8 Cols) -->
                <div class="lg:col-span-8 space-y-4">
                    
                    <!-- STEP 1: LOGIN -->
                    <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="w-6 h-6 rounded bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">1</span>
                                <div>
                                    <span class="text-xs font-bold text-gray-400 uppercase">Login</span>
                                    <h4 class="text-sm font-bold text-gray-800">${this.state.user.name} <span class="text-xs text-gray-500 font-normal ml-2">${this.state.user.phone || this.state.user.email}</span></h4>
                                </div>
                            </div>
                            <span class="text-fkGreen font-bold text-xs flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> Verified</span>
                        </div>
                    </div>

                    <!-- STEP 2: DELIVERY ADDRESS -->
                    <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-4 space-y-4 checkout-step checkout-step-active">
                        <div class="flex items-center justify-between border-b border-gray-200 pb-3">
                            <div class="flex items-center gap-3">
                                <span class="w-6 h-6 rounded bg-fkBlue text-white flex items-center justify-center font-bold text-xs">2</span>
                                <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Delivery Address</h4>
                            </div>
                        </div>

                        <!-- Address Form -->
                        <form id="checkout-address-form" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                                <label class="block font-semibold text-gray-700 mb-1">Full Name *</label>
                                <input type="text" id="ship-name" required value="${this.state.savedAddress.name}" class="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-fkBlue">
                            </div>
                            <div>
                                <label class="block font-semibold text-gray-700 mb-1">10-digit Mobile Number *</label>
                                <input type="text" id="ship-phone" required value="${this.state.savedAddress.phone}" class="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-fkBlue">
                            </div>
                            <div>
                                <label class="block font-semibold text-gray-700 mb-1">Pincode *</label>
                                <input type="text" id="ship-pincode" required value="${this.state.savedAddress.pincode}" class="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-fkBlue">
                            </div>
                            <div>
                                <label class="block font-semibold text-gray-700 mb-1">Locality *</label>
                                <input type="text" id="ship-locality" required value="${this.state.savedAddress.locality}" class="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-fkBlue">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block font-semibold text-gray-700 mb-1">Address (Area and Street) *</label>
                                <textarea id="ship-address" required rows="2" class="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-fkBlue">${this.state.savedAddress.address}</textarea>
                            </div>
                            <div>
                                <label class="block font-semibold text-gray-700 mb-1">City/District/Town *</label>
                                <input type="text" id="ship-city" required value="${this.state.savedAddress.city}" class="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-fkBlue">
                            </div>
                            <div>
                                <label class="block font-semibold text-gray-700 mb-1">State *</label>
                                <input type="text" id="ship-state" required value="${this.state.savedAddress.state}" class="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-fkBlue">
                            </div>
                        </form>
                    </div>

                    <!-- STEP 3: ORDER SUMMARY -->
                    <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-4 space-y-3">
                        <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                            <div class="flex items-center gap-3">
                                <span class="w-6 h-6 rounded bg-fkBlue text-white flex items-center justify-center font-bold text-xs">3</span>
                                <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Order Summary (${this.state.cart.length} Items)</h4>
                            </div>
                        </div>

                        <div class="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                            ${this.state.cart.map(i => `
                                <div class="py-2.5 flex items-center justify-between text-xs">
                                    <div class="flex items-center gap-3">
                                        <img src="${i.image}" alt="${i.title}" class="w-10 h-10 object-contain">
                                        <div>
                                            <h5 class="font-semibold text-gray-800 line-clamp-1">${i.title}</h5>
                                            <span class="text-gray-400">Qty: ${i.quantity}</span>
                                        </div>
                                    </div>
                                    <span class="font-bold text-gray-900">₹${(i.price * i.quantity).toLocaleString('en-IN')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- STEP 4: PAYMENT OPTIONS -->
                    <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-4 space-y-4">
                        <div class="flex items-center justify-between border-b border-gray-200 pb-2">
                            <div class="flex items-center gap-3">
                                <span class="w-6 h-6 rounded bg-fkBlue text-white flex items-center justify-center font-bold text-xs">4</span>
                                <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Payment Options</h4>
                            </div>
                        </div>

                        <div class="space-y-3 text-xs text-gray-800">
                            
                            <!-- UPI -->
                            <label class="flex items-start gap-3 p-3 border border-blue-200 bg-blue-50/50 rounded cursor-pointer">
                                <input type="radio" name="payment_method" value="UPI (Google Pay / PhonePe)" checked class="mt-0.5 text-fkBlue">
                                <div class="space-y-1">
                                    <div class="font-bold text-gray-900 flex items-center gap-2">
                                        <span>UPI - Google Pay, PhonePe, Paytm, BHIM</span>
                                        <span class="bg-green-100 text-fkGreen text-[10px] px-1.5 rounded font-bold">Fastest</span>
                                    </div>
                                    <p class="text-gray-500">Pay directly from your Bank Account with instant confirmation.</p>
                                </div>
                            </label>

                            <!-- Credit / Debit Card -->
                            <label class="flex items-start gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="payment_method" value="Credit / Debit / ATM Card" class="mt-0.5 text-fkBlue">
                                <div class="space-y-1">
                                    <div class="font-bold text-gray-900">Credit / Debit / ATM Card</div>
                                    <p class="text-gray-500">Visa, MasterCard, RuPay, Maestro & Diners Club</p>
                                </div>
                            </label>

                            <!-- Net Banking -->
                            <label class="flex items-start gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="payment_method" value="Net Banking" class="mt-0.5 text-fkBlue">
                                <div class="space-y-1">
                                    <div class="font-bold text-gray-900">Net Banking</div>
                                    <p class="text-gray-500">All major Indian banks supported (SBI, HDFC, ICICI, Axis, Kotak)</p>
                                </div>
                            </label>

                            <!-- Cash on Delivery -->
                            <label class="flex items-start gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="payment_method" value="Cash on Delivery" class="mt-0.5 text-fkBlue">
                                <div class="space-y-1">
                                    <div class="font-bold text-gray-900">Cash on Delivery (COD)</div>
                                    <p class="text-gray-500">Pay cash or scan QR at your doorstep upon delivery.</p>
                                </div>
                            </label>

                        </div>

                        <!-- Place Order Button -->
                        <div class="pt-3 border-t border-gray-200 flex justify-end">
                            <button id="btn-submit-order" onclick="app.submitOrder(${finalAmount}, ${totalDiscount}, ${deliveryFee})" class="bg-fkOrange hover:bg-[#e05615] text-white font-bold px-10 py-3.5 rounded-sm text-sm uppercase tracking-wider shadow-lg transition">
                                Confirm & Place Order (₹${finalAmount.toLocaleString('en-IN')})
                            </button>
                        </div>
                    </div>

                </div>

                <!-- RIGHT PRICE DETAILS (4 Cols) -->
                <div class="lg:col-span-4 sticky top-20">
                    <div class="bg-white rounded-sm shadow-sm border border-gray-200 p-4 text-xs space-y-4">
                        <h3 class="font-bold text-gray-400 uppercase text-[11px] tracking-wider border-b border-gray-200 pb-3">Price Details</h3>
                        <div class="space-y-2.5 text-gray-700">
                            <div class="flex justify-between"><span>Price (${this.state.cart.length} items)</span><span>₹${totalMrp.toLocaleString('en-IN')}</span></div>
                            <div class="flex justify-between text-fkGreen"><span>Discount</span><span>- ₹${totalDiscount.toLocaleString('en-IN')}</span></div>
                            <div class="flex justify-between"><span>Delivery Charges</span><span>${deliveryFee === 0 ? '<span class="text-fkGreen font-bold">FREE</span>' : `₹${deliveryFee}`}</span></div>
                        </div>
                        <div class="border-t border-b border-dashed border-gray-300 py-3 flex justify-between text-base font-bold text-gray-900">
                            <span>Total Payable</span>
                            <span>₹${finalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="text-fkGreen font-bold text-xs bg-green-50 p-2 rounded">
                            You will save ₹${totalDiscount.toLocaleString('en-IN')} on this order
                        </div>
                    </div>
                </div>

            </div>
        `;
    },

    submitOrder: async function(totalAmount, discountAmount, deliveryCharges) {
        const btn = document.getElementById('btn-submit-order');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing Order...`;
        }

        // Collect Shipping Address
        const shippingAddress = {
            name: document.getElementById('ship-name')?.value || this.state.savedAddress.name,
            phone: document.getElementById('ship-phone')?.value || this.state.savedAddress.phone,
            pincode: document.getElementById('ship-pincode')?.value || this.state.savedAddress.pincode,
            locality: document.getElementById('ship-locality')?.value || this.state.savedAddress.locality,
            address: document.getElementById('ship-address')?.value || this.state.savedAddress.address,
            city: document.getElementById('ship-city')?.value || this.state.savedAddress.city,
            state: document.getElementById('ship-state')?.value || this.state.savedAddress.state,
            type: 'Home'
        };

        // Save for future
        localStorage.setItem('fk_address', JSON.stringify(shippingAddress));
        this.state.savedAddress = shippingAddress;

        // Collect Payment Method
        const paymentRadio = document.querySelector('input[name="payment_method"]:checked');
        const paymentMethod = paymentRadio ? paymentRadio.value : 'UPI';

        const payload = {
            customer_name: shippingAddress.name,
            customer_email: this.state.user.email,
            customer_phone: shippingAddress.phone,
            shipping_address: shippingAddress,
            items: this.state.cart,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            delivery_charges: deliveryCharges,
            payment_method: paymentMethod
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                // Clear Cart
                this.state.cart = [];
                localStorage.removeItem('fk_cart');
                this.updateHeaderBadges();

                // Fetch full order for success view
                const ordRes = await fetch(`/api/orders/${data.order_id}`);
                const ordData = await ordRes.json();
                this.state.currentOrder = ordData.order;

                this.showToast('Order Placed Successfully!', 'success');
                this.navigate('order-success');
            } else {
                alert("Error placing order: " + data.message);
                if (btn) btn.disabled = false;
            }
        } catch (err) {
            console.error("Order error:", err);
            alert("Failed to submit order. Please try again.");
            if (btn) btn.disabled = false;
        }
    },

    // ----------------- VIEW: ORDER SUCCESS & TRACKING -----------------
    renderOrderSuccess: function() {
        const container = document.getElementById('app-container');
        const order = this.state.currentOrder;
        if (!order) {
            this.navigate('home');
            return;
        }

        container.innerHTML = `
            <div class="max-w-3xl mx-auto bg-white rounded-sm shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
                
                <!-- Success Header -->
                <div class="text-center space-y-2 border-b border-gray-200 pb-6">
                    <div class="w-16 h-16 bg-emerald-100 text-fkGreen rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <h2 class="text-2xl font-bold font-inter text-gray-900">Order Placed Successfully!</h2>
                    <p class="text-xs text-gray-500">Order ID: <strong class="text-fkBlue font-mono text-sm">${order.id}</strong></p>
                    <p class="text-xs text-gray-600">Confirmation has been sent to <strong>${order.customer_email}</strong></p>
                </div>

                <!-- Live Tracking Stepper -->
                <div class="space-y-4 bg-gray-50 p-4 rounded border border-gray-200 text-xs">
                    <h4 class="font-bold text-gray-800 uppercase text-[11px]">Delivery & Tracking Progress</h4>
                    
                    <div class="flex items-center justify-between relative py-2">
                        <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0"></div>
                        <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-fkGreen z-0" style="width: ${order.order_status === 'Delivered' ? '100%' : order.order_status === 'Shipped' ? '66%' : order.order_status === 'Processing' ? '33%' : '10%'}"></div>

                        <div class="flex flex-col items-center relative z-10">
                            <span class="w-7 h-7 rounded-full bg-fkGreen text-white flex items-center justify-center text-xs font-bold"><i class="fa-solid fa-check"></i></span>
                            <span class="font-bold text-gray-800 mt-1">Placed</span>
                        </div>

                        <div class="flex flex-col items-center relative z-10">
                            <span class="w-7 h-7 rounded-full ${['Processing', 'Shipped', 'Delivered'].includes(order.order_status) ? 'bg-fkGreen text-white' : 'bg-gray-300 text-gray-600'} flex items-center justify-center text-xs font-bold">2</span>
                            <span class="font-semibold text-gray-600 mt-1">Packed</span>
                        </div>

                        <div class="flex flex-col items-center relative z-10">
                            <span class="w-7 h-7 rounded-full ${['Shipped', 'Delivered'].includes(order.order_status) ? 'bg-fkGreen text-white' : 'bg-gray-300 text-gray-600'} flex items-center justify-center text-xs font-bold">3</span>
                            <span class="font-semibold text-gray-600 mt-1">Shipped</span>
                        </div>

                        <div class="flex flex-col items-center relative z-10">
                            <span class="w-7 h-7 rounded-full ${order.order_status === 'Delivered' ? 'bg-fkGreen text-white' : 'bg-gray-300 text-gray-600'} flex items-center justify-center text-xs font-bold">4</span>
                            <span class="font-semibold text-gray-600 mt-1">Delivered</span>
                        </div>
                    </div>

                    <div class="text-[11px] text-gray-500 bg-white p-2.5 rounded border border-gray-100 space-y-1">
                        ${order.tracking_history.map(t => `
                            <div class="flex items-center justify-between">
                                <span><strong class="text-gray-800">${t.status}:</strong> ${t.detail}</span>
                                <span class="text-gray-400 font-mono">${t.time}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Items Purchased -->
                <div class="space-y-3 text-xs">
                    <h4 class="font-bold text-gray-800 uppercase text-[11px]">Items in this Order</h4>
                    <div class="divide-y divide-gray-100 border border-gray-200 rounded p-2">
                        ${order.items.map(i => `
                            <div class="py-2 flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <img src="${i.image}" alt="${i.title}" class="w-10 h-10 object-contain">
                                    <div>
                                        <h5 class="font-semibold text-gray-800">${i.title}</h5>
                                        <span class="text-gray-400">Qty: ${i.quantity}</span>
                                    </div>
                                </div>
                                <span class="font-bold text-gray-900">₹${(i.price * i.quantity).toLocaleString('en-IN')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Delivery Address & Payment Summary -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div class="bg-gray-50 p-3 rounded border border-gray-200 space-y-1">
                        <span class="font-bold text-gray-500 uppercase text-[10px]">Shipping To:</span>
                        <p class="font-bold text-gray-800">${order.shipping_address.name}</p>
                        <p class="text-gray-600">${order.shipping_address.address}, ${order.shipping_address.locality}</p>
                        <p class="text-gray-600">${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}</p>
                        <p class="text-gray-600">Phone: ${order.shipping_address.phone}</p>
                    </div>

                    <div class="bg-gray-50 p-3 rounded border border-gray-200 space-y-1">
                        <span class="font-bold text-gray-500 uppercase text-[10px]">Payment Details:</span>
                        <p class="font-bold text-gray-800">${order.payment_method}</p>
                        <p class="text-gray-600">Total Paid: <strong class="text-gray-900 font-inter">₹${order.total_amount.toLocaleString('en-IN')}</strong></p>
                        <p class="text-fkGreen font-semibold"><i class="fa-solid fa-circle-check text-[10px]"></i> Payment Confirmed</p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200 text-xs">
                    <button onclick="window.print()" class="px-5 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5">
                        <i class="fa-solid fa-print"></i> Print Invoice
                    </button>
                    <div class="flex gap-2">
                        <button onclick="app.navigate('my-orders')" class="px-5 py-2 border border-fkBlue text-fkBlue rounded font-semibold hover:bg-blue-50">
                            View All Orders
                        </button>
                        <button onclick="app.navigate('home')" class="px-6 py-2 bg-fkBlue text-white rounded font-semibold hover:bg-fkBlueDark shadow">
                            Continue Shopping
                        </button>
                    </div>
                </div>

            </div>
        `;
    },

    // ----------------- VIEW: MY ORDERS -----------------
    renderMyOrders: async function() {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="py-16 text-center text-gray-400 text-xs">
                <i class="fa-solid fa-circle-notch fa-spin text-2xl text-fkBlue mb-2"></i>
                <p>Loading your Flipkart orders...</p>
            </div>
        `;

        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (!data.success || !data.orders.length) {
                container.innerHTML = `
                    <div class="bg-white rounded-sm shadow-sm p-12 text-center max-w-md mx-auto border border-gray-200 my-8">
                        <i class="fa-solid fa-box-open text-5xl text-gray-300 mb-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">No Orders Found</h3>
                        <p class="text-xs text-gray-500 mt-1">Looks like you haven't placed any order yet.</p>
                        <button onclick="app.navigate('home')" class="mt-5 bg-fkBlue hover:bg-fkBlueDark text-white px-6 py-2 rounded-sm font-semibold text-xs shadow transition">Start Shopping</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="bg-white rounded-sm shadow-sm p-4 sm:p-6 border border-gray-200 space-y-4">
                    <h2 class="text-xl font-bold font-inter text-gray-900 border-b border-gray-200 pb-3">My Orders (${data.orders.length})</h2>

                    <div class="space-y-4">
                        ${data.orders.map(o => `
                            <div class="border border-gray-200 rounded-sm p-4 hover:border-gray-300 transition text-xs space-y-3">
                                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                    <div class="space-y-0.5">
                                        <span class="text-gray-400 font-mono text-[11px]">ORDER #${o.id}</span>
                                        <div class="text-[11px] text-gray-500">Placed on ${o.created_at}</div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <span class="font-bold text-sm text-gray-900 font-inter">₹${o.total_amount.toLocaleString('en-IN')}</span>
                                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${o.order_status === 'Delivered' ? 'bg-green-100 text-fkGreen' : o.order_status === 'Shipped' ? 'bg-blue-100 text-fkBlue' : 'bg-amber-100 text-amber-700'}">${o.order_status}</span>
                                    </div>
                                </div>

                                <div class="divide-y divide-gray-100">
                                    ${o.items.map(item => `
                                        <div class="py-2 flex items-center justify-between">
                                            <div class="flex items-center gap-3 cursor-pointer" onclick="app.navigate('detail', { id: ${item.product_id} })">
                                                <img src="${item.image}" alt="${item.title}" class="w-12 h-12 object-contain">
                                                <div>
                                                    <h4 class="font-semibold text-gray-800 hover:text-fkBlue">${item.title}</h4>
                                                    <span class="text-gray-400">Qty: ${item.quantity} • ₹${item.price.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>

                                <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <span class="text-gray-500">Payment: <strong>${o.payment_method}</strong></span>
                                    <button onclick="app.viewOrderDetails('${o.id}')" class="text-fkBlue font-bold hover:underline flex items-center gap-1">
                                        <i class="fa-solid fa-location-arrow"></i> Track Order Details
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (err) {
            console.error("Error loading orders:", err);
        }
    },

    viewOrderDetails: async function(orderId) {
        try {
            const res = await fetch(`/api/orders/${orderId}`);
            const data = await res.json();
            if (data.success) {
                this.state.currentOrder = data.order;
                this.navigate('order-success');
            }
        } catch (err) {
            console.error("Error fetching order details:", err);
        }
    },

    // ----------------- VIEW: SELLER HUB / ADMIN PORTAL -----------------
    renderAdmin: async function() {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="space-y-5">
                
                <!-- Admin Header & Stats -->
                <div class="bg-gradient-to-r from-fkBlue to-[#122b20] text-white rounded-sm shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="bg-fkYellow text-fkBlue font-bold text-xs px-2 py-0.5 rounded">SELLER DASHBOARD</span>
                            <span class="text-xs text-blue-200">ZOZ Products Partner Portal</span>
                        </div>
                        <h1 class="text-2xl font-bold font-inter mt-1">Product Management & Store Inventory</h1>
                        <p class="text-xs text-blue-100 mt-0.5">Add new products, modify prices, update catalog & track customer orders</p>
                    </div>

                    <button onclick="app.openAddProductModal()" class="bg-fkYellow hover:bg-fkYellowDark text-gray-900 font-bold px-6 py-2.5 rounded text-sm shadow-md flex items-center gap-2 transition">
                        <i class="fa-solid fa-plus text-base"></i> Add New Product
                    </button>
                </div>

                <!-- KPI Metric Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="admin-stats-container">
                    <div class="bg-white p-4 rounded-sm shadow-sm border border-gray-200 text-center">
                        <span class="text-xs text-gray-500 font-semibold uppercase">Total Products</span>
                        <h3 class="text-2xl font-bold text-gray-900 mt-1" id="stat-total-products"><i class="fa-solid fa-circle-notch fa-spin text-sm text-fkBlue"></i></h3>
                    </div>
                    <div class="bg-white p-4 rounded-sm shadow-sm border border-gray-200 text-center">
                        <span class="text-xs text-gray-500 font-semibold uppercase">Total Orders</span>
                        <h3 class="text-2xl font-bold text-fkBlue mt-1" id="stat-total-orders"><i class="fa-solid fa-circle-notch fa-spin text-sm text-fkBlue"></i></h3>
                    </div>
                    <div class="bg-white p-4 rounded-sm shadow-sm border border-gray-200 text-center">
                        <span class="text-xs text-gray-500 font-semibold uppercase">Total Sales Revenue</span>
                        <h3 class="text-2xl font-bold text-fkGreen mt-1" id="stat-total-sales"><i class="fa-solid fa-circle-notch fa-spin text-sm text-fkBlue"></i></h3>
                    </div>
                    <div class="bg-white p-4 rounded-sm shadow-sm border border-gray-200 text-center">
                        <span class="text-xs text-gray-500 font-semibold uppercase">Low Stock Items</span>
                        <h3 class="text-2xl font-bold text-red-500 mt-1" id="stat-low-stock"><i class="fa-solid fa-circle-notch fa-spin text-sm text-fkBlue"></i></h3>
                    </div>
                </div>

                <!-- Admin Tabs -->
                <div class="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
                    <div class="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
                        <button onclick="app.switchAdminTab('inventory')" id="tab-btn-inventory" class="px-6 py-3 border-b-2 border-fkBlue text-fkBlue bg-white">
                            <i class="fa-solid fa-boxes-stacked mr-1.5"></i> All Products & Inventory
                        </button>
                        <button onclick="app.switchAdminTab('orders')" id="tab-btn-orders" class="px-6 py-3 border-b-2 border-transparent text-gray-600 hover:text-fkBlue">
                            <i class="fa-solid fa-truck-ramp-box mr-1.5"></i> Customer Orders
                        </button>
                    </div>

                    <!-- TAB 1: INVENTORY TABLE -->
                    <div id="admin-inventory-tab" class="p-4 space-y-4">
                        <div class="flex items-center justify-between gap-3">
                            <input type="text" id="admin-search-input" placeholder="Search catalog by title, brand, or category..." oninput="app.filterAdminInventory(this.value)" class="w-full max-w-sm px-3 py-1.5 border border-gray-300 rounded text-xs outline-none focus:border-fkBlue">
                            <button onclick="app.openAddProductModal()" class="bg-fkBlue hover:bg-fkBlueDark text-white px-4 py-1.5 rounded text-xs font-semibold shrink-0">
                                + Add Product
                            </button>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs border border-gray-200">
                                <thead class="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th class="p-2.5">Image</th>
                                        <th class="p-2.5">Title & Brand</th>
                                        <th class="p-2.5">Category</th>
                                        <th class="p-2.5">Price / MRP</th>
                                        <th class="p-2.5">Stock</th>
                                        <th class="p-2.5">Rating</th>
                                        <th class="p-2.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-products-tbody" class="divide-y divide-gray-200 text-gray-800">
                                    <tr><td colspan="7" class="p-6 text-center text-gray-400">Loading catalog...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TAB 2: ORDERS MANAGEMENT -->
                    <div id="admin-orders-tab" class="hidden p-4 space-y-4">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-xs border border-gray-200">
                                <thead class="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th class="p-2.5">Order ID</th>
                                        <th class="p-2.5">Customer</th>
                                        <th class="p-2.5">Items</th>
                                        <th class="p-2.5">Total Amount</th>
                                        <th class="p-2.5">Payment</th>
                                        <th class="p-2.5">Status</th>
                                        <th class="p-2.5 text-right">Update Status</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-orders-tbody" class="divide-y divide-gray-200 text-gray-800">
                                    <tr><td colspan="7" class="p-6 text-center text-gray-400">Loading orders...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

            </div>
        `;

        this.loadAdminStats();
        this.loadAdminInventory();
    },

    loadAdminStats: async function() {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            if (data.success) {
                const s = data.stats;
                document.getElementById('stat-total-products').innerText = s.total_products;
                document.getElementById('stat-total-orders').innerText = s.total_orders;
                document.getElementById('stat-total-sales').innerText = `₹${s.total_sales.toLocaleString('en-IN')}`;
                document.getElementById('stat-low-stock').innerText = s.low_stock_products;
            }
        } catch (err) {
            console.error("Error loading admin stats:", err);
        }
    },

    loadAdminInventory: async function() {
        try {
            const res = await fetch('/api/products?sort=newest');
            const data = await res.json();
            const tbody = document.getElementById('admin-products-tbody');
            if (!tbody) return;

            if (data.success && data.products.length) {
                this.adminProductList = data.products;
                tbody.innerHTML = data.products.map(p => {
                    const img = p.images && p.images.length ? p.images[0] : '';
                    return `
                        <tr class="hover:bg-blue-50/50 transition">
                            <td class="p-2.5">
                                <img src="${img}" alt="${p.title}" class="w-10 h-10 object-contain border border-gray-200 rounded">
                            </td>
                            <td class="p-2.5 max-w-xs">
                                <div class="font-bold text-gray-900 line-clamp-1">${p.title}</div>
                                <span class="text-[10px] text-gray-400 uppercase font-semibold">${p.brand}</span>
                                ${p.is_assured ? `<span class="fk-assured-pill text-[8px] ml-1">F-Assured</span>` : ''}
                            </td>
                            <td class="p-2.5">${p.category}</td>
                            <td class="p-2.5">
                                <span class="font-bold text-gray-900">₹${p.price.toLocaleString('en-IN')}</span>
                                <span class="text-gray-400 line-through ml-1">₹${p.mrp.toLocaleString('en-IN')}</span>
                                <span class="text-fkGreen font-bold block text-[10px]">${p.discount}% off</span>
                            </td>
                            <td class="p-2.5">
                                <span class="font-bold ${p.stock <= 5 ? 'text-red-500' : 'text-gray-800'}">${p.stock} units</span>
                            </td>
                            <td class="p-2.5">
                                <span class="fk-rating-badge fk-rating-badge-sm">${p.rating} <i class="fa-solid fa-star text-[7px]"></i></span>
                            </td>
                            <td class="p-2.5 text-right space-x-1">
                                <button onclick="app.openEditProductModal(${p.id})" class="px-2.5 py-1 bg-blue-50 text-fkBlue hover:bg-fkBlue hover:text-white rounded transition font-semibold">
                                    <i class="fa-solid fa-pen-to-square"></i> Edit
                                </button>
                                <button onclick="app.deleteProduct(${p.id}, '${escape(p.title)}')" class="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded transition font-semibold">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500">No products in catalog. Click "Add New Product" to start selling!</td></tr>`;
            }
        } catch (err) {
            console.error("Error loading admin inventory:", err);
        }
    },

    loadAdminOrders: async function() {
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            const tbody = document.getElementById('admin-orders-tbody');
            if (!tbody) return;

            if (data.success && data.orders.length) {
                tbody.innerHTML = data.orders.map(o => `
                    <tr class="hover:bg-blue-50/50 transition">
                        <td class="p-2.5 font-mono font-bold text-fkBlue">${o.id}</td>
                        <td class="p-2.5">
                            <div class="font-bold text-gray-900">${o.customer_name}</div>
                            <div class="text-gray-400 text-[10px]">${o.customer_phone}</div>
                        </td>
                        <td class="p-2.5">${o.items.length} item(s)</td>
                        <td class="p-2.5 font-bold text-gray-900">₹${o.total_amount.toLocaleString('en-IN')}</td>
                        <td class="p-2.5">${o.payment_method}</td>
                        <td class="p-2.5">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${o.order_status === 'Delivered' ? 'bg-green-100 text-fkGreen' : o.order_status === 'Shipped' ? 'bg-blue-100 text-fkBlue' : 'bg-amber-100 text-amber-700'}">${o.order_status}</span>
                        </td>
                        <td class="p-2.5 text-right">
                            <select onchange="app.updateOrderStatus('${o.id}', this.value)" class="px-2 py-1 border border-gray-300 rounded text-xs outline-none bg-white font-medium">
                                <option value="Placed" ${o.order_status === 'Placed' ? 'selected' : ''}>Placed</option>
                                <option value="Processing" ${o.order_status === 'Processing' ? 'selected' : ''}>Processing</option>
                                <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="Out for Delivery" ${o.order_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                                <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-400">No customer orders placed yet.</td></tr>`;
            }
        } catch (err) {
            console.error("Error loading admin orders:", err);
        }
    },

    switchAdminTab: function(tab) {
        this.state.adminTab = tab;
        const invTab = document.getElementById('admin-inventory-tab');
        const ordTab = document.getElementById('admin-orders-tab');
        const btnInv = document.getElementById('tab-btn-inventory');
        const btnOrd = document.getElementById('tab-btn-orders');

        if (tab === 'inventory') {
            invTab.classList.remove('hidden');
            ordTab.classList.add('hidden');
            btnInv.className = "px-6 py-3 border-b-2 border-fkBlue text-fkBlue bg-white font-bold";
            btnOrd.className = "px-6 py-3 border-b-2 border-transparent text-gray-600 hover:text-fkBlue font-bold";
            this.loadAdminInventory();
        } else {
            invTab.classList.add('hidden');
            ordTab.classList.remove('hidden');
            btnOrd.className = "px-6 py-3 border-b-2 border-fkBlue text-fkBlue bg-white font-bold";
            btnInv.className = "px-6 py-3 border-b-2 border-transparent text-gray-600 hover:text-fkBlue font-bold";
            this.loadAdminOrders();
        }
    },

    filterAdminInventory: function(query) {
        if (!this.adminProductList) return;
        query = query.toLowerCase().trim();
        const tbody = document.getElementById('admin-products-tbody');
        const filtered = this.adminProductList.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.brand.toLowerCase().includes(query) || 
            p.category.toLowerCase().includes(query)
        );

        if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-400">No matching products found.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            const img = p.images && p.images.length ? p.images[0] : '';
            return `
                <tr class="hover:bg-blue-50/50 transition">
                    <td class="p-2.5"><img src="${img}" alt="${p.title}" class="w-10 h-10 object-contain border border-gray-200 rounded"></td>
                    <td class="p-2.5 max-w-xs">
                        <div class="font-bold text-gray-900 line-clamp-1">${p.title}</div>
                        <span class="text-[10px] text-gray-400 uppercase font-semibold">${p.brand}</span>
                    </td>
                    <td class="p-2.5">${p.category}</td>
                    <td class="p-2.5"><span class="font-bold text-gray-900">₹${p.price.toLocaleString('en-IN')}</span></td>
                    <td class="p-2.5"><span class="font-bold ${p.stock <= 5 ? 'text-red-500' : 'text-gray-800'}">${p.stock} units</span></td>
                    <td class="p-2.5"><span class="fk-rating-badge fk-rating-badge-sm">${p.rating} <i class="fa-solid fa-star text-[7px]"></i></span></td>
                    <td class="p-2.5 text-right space-x-1">
                        <button onclick="app.openEditProductModal(${p.id})" class="px-2.5 py-1 bg-blue-50 text-fkBlue rounded font-semibold"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                        <button onclick="app.deleteProduct(${p.id}, '${escape(p.title)}')" class="px-2.5 py-1 bg-red-50 text-red-600 rounded font-semibold"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // ----------------- ADD / EDIT / DELETE PRODUCT & IMAGE UPLOAD -----------------
    handleImageFileUpload: async function(input) {
        if (!input.files || !input.files.length) return;
        const files = Array.from(input.files);

        for (const file of files) {
            const formData = new FormData();
            formData.append('image', file);

            try {
                this.showToast(`Uploading ${file.name}...`, 'info');
                const res = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success && data.url) {
                    const textarea = document.getElementById('p-images');
                    const currentUrls = textarea.value.split(',').map(s => s.trim()).filter(s => s);
                    currentUrls.push(data.url);
                    textarea.value = currentUrls.join(',\n');
                    this.renderImagePreviews(currentUrls);
                    this.showToast(`Uploaded ${file.name} successfully!`, 'success');
                } else {
                    // Fallback to local Data URL
                    this.readLocalFileDataUrl(file);
                }
            } catch (err) {
                console.error("Upload error, using local data URL fallback:", err);
                this.readLocalFileDataUrl(file);
            }
        }
        input.value = '';
    },

    readLocalFileDataUrl: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const textarea = document.getElementById('p-images');
            const currentUrls = textarea.value.split(',').map(s => s.trim()).filter(s => s);
            currentUrls.push(e.target.result);
            textarea.value = currentUrls.join(',\n');
            this.renderImagePreviews(currentUrls);
            this.showToast(`Image "${file.name}" added to product!`, 'success');
        };
        reader.readAsDataURL(file);
    },

    renderImagePreviews: function(urls) {
        const container = document.getElementById('p-image-previews');
        if (!container) return;
        if (!urls || !urls.length) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = urls.map((url, idx) => `
            <div class="relative group w-16 h-16 rounded border border-gray-300 p-1 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                <img src="${url}" alt="Preview" class="max-h-full max-w-full object-contain">
                <button type="button" onclick="app.removeImagePreview(${idx})" class="absolute top-0 right-0 bg-red-600 text-white rounded-bl w-4 h-4 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition" title="Remove image">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join('');
    },

    removeImagePreview: function(index) {
        const textarea = document.getElementById('p-images');
        const currentUrls = textarea.value.split(',').map(s => s.trim()).filter(s => s);
        if (index >= 0 && index < currentUrls.length) {
            currentUrls.splice(index, 1);
            textarea.value = currentUrls.join(',\n');
            this.renderImagePreviews(currentUrls);
        }
    },

    refreshImagePreviewsFromText: function() {
        const textarea = document.getElementById('p-images');
        if (!textarea) return;
        const urls = textarea.value.split(',').map(s => s.trim()).filter(s => s);
        this.renderImagePreviews(urls);
    },

    openAddProductModal: function() {
        document.getElementById('product-modal-title').innerText = "Add New Product to ZOZ Products Catalog";
        document.getElementById('edit-product-id').value = "";
        document.getElementById('product-form').reset();
        document.getElementById('p-discount-preview').innerText = "0% Off";
        document.getElementById('p-savings-preview').innerText = "₹0";
        this.renderImagePreviews([]);
        this.toggleProductModal(true);
    },

    openEditProductModal: async function(productId) {
        try {
            const res = await fetch(`/api/products/${productId}`);
            const data = await res.json();
            if (!data.success) return;

            const p = data.product;
            document.getElementById('product-modal-title').innerText = `Edit Product (ID: ${p.id})`;
            document.getElementById('edit-product-id').value = p.id;
            document.getElementById('p-title').value = p.title;
            document.getElementById('p-brand').value = p.brand;
            document.getElementById('p-category').value = p.category;
            document.getElementById('p-subcategory').value = p.subcategory;
            document.getElementById('p-price').value = p.price;
            document.getElementById('p-mrp').value = p.mrp;
            document.getElementById('p-stock').value = p.stock;
            document.getElementById('p-description').value = p.description;
            document.getElementById('p-highlights').value = p.highlights ? p.highlights.join('\n') : '';
            document.getElementById('p-images').value = p.images ? p.images.join(',\n') : '';
            document.getElementById('p-assured').checked = p.is_assured;
            document.getElementById('p-deal').checked = p.is_deal;

            this.renderImagePreviews(p.images || []);
            this.calculateDiscountPreview();
            this.toggleProductModal(true);
        } catch (err) {
            console.error("Error opening edit modal:", err);
        }
    },

    calculateDiscountPreview: function() {
        const price = parseFloat(document.getElementById('p-price')?.value) || 0;
        const mrp = parseFloat(document.getElementById('p-mrp')?.value) || price;
        const discEl = document.getElementById('p-discount-preview');
        const savEl = document.getElementById('p-savings-preview');

        if (mrp > price && mrp > 0) {
            const pct = Math.round(((mrp - price) / mrp) * 100);
            if (discEl) discEl.innerText = `${pct}% Off`;
            if (savEl) savEl.innerText = `₹${(mrp - price).toLocaleString('en-IN')}`;
        } else {
            if (discEl) discEl.innerText = `0% Off`;
            if (savEl) savEl.innerText = `₹0`;
        }
    },

    handleSaveProduct: async function() {
        const editId = document.getElementById('edit-product-id').value;
        const title = document.getElementById('p-title').value.trim();
        const brand = document.getElementById('p-brand').value.trim();
        const category = document.getElementById('p-category').value;
        const subcategory = document.getElementById('p-subcategory').value.trim();
        const price = parseFloat(document.getElementById('p-price').value);
        const mrp = parseFloat(document.getElementById('p-mrp').value) || price;
        const stock = parseInt(document.getElementById('p-stock').value) || 10;
        const description = document.getElementById('p-description').value.trim();
        const highlights = document.getElementById('p-highlights').value.split('\n').map(h => h.trim()).filter(h => h);
        const rawImages = document.getElementById('p-images').value.split(',').map(i => i.trim()).filter(i => i);
        const is_assured = document.getElementById('p-assured').checked;
        const is_deal = document.getElementById('p-deal').checked;

        const payload = {
            title, brand, category, subcategory, price, mrp, stock,
            description, highlights, images: rawImages, is_assured, is_deal,
            deal_tag: is_deal ? "Deal of the Day" : ""
        };

        try {
            let res;
            if (editId) {
                res = await fetch(`/api/products/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();
            if (data.success) {
                this.toggleProductModal(false);
                this.showToast(editId ? "Product updated successfully!" : "Product added to ZOZ Catalog!", "success");
                this.loadAdminStats();
                this.loadAdminInventory();
            } else {
                alert("Error: " + data.message);
            }
        } catch (err) {
            console.error("Save product error:", err);
            alert("Failed to save product.");
        }
    },

    deleteProduct: async function(productId, title) {
        title = unescape(title);
        if (!confirm(`Are you sure you want to permanently delete "${title}" from ZOZ Products catalog?`)) return;

        try {
            const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.showToast("Product deleted successfully", "info");
                this.loadAdminStats();
                this.loadAdminInventory();
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    },

    updateOrderStatus: async function(orderId, newStatus) {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, detail: `Package status updated to ${newStatus}` })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast(`Order #${orderId} marked as ${newStatus}`, 'success');
                this.loadAdminOrders();
            }
        } catch (err) {
            console.error("Update status error:", err);
        }
    },

    // ----------------- SEARCH & AUTOCOMPLETE -----------------
    handleSearchInput: function(query) {
        const box = document.getElementById('search-suggestions');
        if (!box) return;
        query = query.trim().toLowerCase();

        if (query.length < 2) {
            box.classList.add('hidden');
            return;
        }

        // Suggestions based on categories & popular keywords
        const suggestions = [
            { text: `in Mobiles`, category: 'Mobiles' },
            { text: `in Electronics`, category: 'Electronics' },
            { text: `in Fashion`, category: 'Fashion' },
            { text: `in TVs & Appliances`, category: 'TVs & Appliances' },
            { text: `in Home & Furniture`, category: 'Home & Furniture' }
        ];

        box.innerHTML = `
            <div class="py-1">
                <div class="px-4 py-2 hover:bg-blue-50 flex items-center gap-3 cursor-pointer text-gray-800 font-semibold border-b border-gray-100" onclick="app.submitSearch('${query}')">
                    <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                    <span>Search for "${query}"</span>
                </div>
                ${suggestions.map(s => `
                    <div class="px-4 py-2 hover:bg-blue-50 flex items-center justify-between cursor-pointer text-gray-600 text-xs" onclick="app.submitCategorySearch('${query}', '${s.category}')">
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-arrow-trend-up text-gray-400 text-[10px]"></i>
                            <span>${query} <strong class="text-fkBlue">${s.text}</strong></span>
                        </div>
                        <span class="text-[10px] text-gray-400">Category</span>
                    </div>
                `).join('')}
            </div>
        `;
        box.classList.remove('hidden');
    },

    handleSearch: function() {
        const input = document.getElementById('global-search-input');
        if (input) this.submitSearch(input.value);
    },

    submitSearch: function(query) {
        const box = document.getElementById('search-suggestions');
        if (box) box.classList.add('hidden');
        this.state.catalogFilters.search = query;
        this.state.catalogFilters.category = 'all';
        this.navigate('catalog');
    },

    submitCategorySearch: function(query, category) {
        const box = document.getElementById('search-suggestions');
        if (box) box.classList.add('hidden');
        this.state.catalogFilters.search = query;
        this.state.catalogFilters.category = category;
        this.navigate('catalog');
    },

    // ----------------- REVIEWS MODAL -----------------
    openReviewModal: function(productId) {
        document.getElementById('rev-product-id').value = productId;
        document.getElementById('rev-rating').value = 5;
        this.setRatingStar(5);
        this.toggleReviewModal(true);
    },

    setRatingStar: function(val) {
        document.getElementById('rev-rating').value = val;
        const stars = document.querySelectorAll('#rating-stars i');
        stars.forEach((s, idx) => {
            if (idx < val) {
                s.className = "fa-solid fa-star";
            } else {
                s.className = "fa-regular fa-star";
            }
        });
    },

    handleSubmitReview: async function() {
        const product_id = document.getElementById('rev-product-id').value;
        const rating = parseInt(document.getElementById('rev-rating').value);
        const user_name = document.getElementById('rev-name').value.trim() || this.state.user.name;
        const title = document.getElementById('rev-title').value.trim() || "Quality Product";
        const comment = document.getElementById('rev-comment').value.trim();

        if (!comment) return;

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id, rating, user_name, title, comment })
            });
            const data = await res.json();
            if (data.success) {
                this.toggleReviewModal(false);
                this.showToast("Review submitted successfully!", "success");
                this.renderProductDetail(product_id);
            }
        } catch (err) {
            console.error("Submit review error:", err);
        }
    },

    // ----------------- AUTH & USER HELPERS -----------------
    toggleLoginModal: function(show = true) {
        const modal = document.getElementById('login-modal');
        if (modal) modal.classList.toggle('hidden', !show);
    },

    toggleProductModal: function(show = true) {
        const modal = document.getElementById('product-modal');
        if (modal) modal.classList.toggle('hidden', !show);
    },

    toggleReviewModal: function(show = true) {
        const modal = document.getElementById('review-modal');
        if (modal) modal.classList.toggle('hidden', !show);
    },

    handleAuthSubmit: function() {
        const name = document.getElementById('auth-input-name').value.trim();
        const contact = document.getElementById('auth-input-contact').value.trim();
        if (!name) return;

        this.state.user = {
            name: name,
            email: contact.includes('@') ? contact : `${name.toLowerCase().replace(/\s+/g, '')}@flipkart.com`,
            phone: !contact.includes('@') ? contact : '9876543210',
            isLoggedIn: true
        };
        localStorage.setItem('fk_user', JSON.stringify(this.state.user));
        this.updateUserBtn();
        this.toggleLoginModal(false);
        this.showToast(`Welcome back, ${name}!`, 'success');
    },

    quickGuestLogin: function() {
        this.state.user = {
            name: 'Gautam Rathva',
            email: 'gautam.rathva@zozproducts.com',
            phone: '9876543210',
            isLoggedIn: true
        };
        localStorage.setItem('fk_user', JSON.stringify(this.state.user));
        this.updateUserBtn();
        this.toggleLoginModal(false);
        this.showToast(`Logged in as Gautam Rathva!`, 'success');
    },

    mockLogout: function() {
        this.state.user = { isLoggedIn: false };
        localStorage.removeItem('fk_user');
        this.updateUserBtn();
        this.showToast("Logged out from ZOZ Products session", "info");
        this.navigate('home');
    },

    updateUserBtn: function() {
        const text = document.getElementById('user-btn-text');
        if (text) {
            text.innerText = this.state.user.isLoggedIn ? (this.state.user.name.split(' ')[0] || 'My Account') : 'Login';
        }
    },

    // ----------------- TOAST NOTIFICATIONS -----------------
    showToast: function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        const bg = type === 'success' ? 'bg-[#388e3c]' : type === 'error' ? 'bg-red-600' : 'bg-gray-900';
        const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';

        toast.className = `${bg} text-white px-4 py-3 rounded shadow-2xl flex items-center gap-3 text-xs font-semibold animate-scaleUp pointer-events-auto min-w-[260px]`;
        toast.innerHTML = `
            <i class="fa-solid ${icon} text-base"></i>
            <span class="flex-1">${message}</span>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Close suggestions on outside click
document.addEventListener('click', (e) => {
    const searchForm = document.getElementById('search-form');
    const suggestions = document.getElementById('search-suggestions');
    if (searchForm && suggestions && !searchForm.contains(e.target)) {
        suggestions.classList.add('hidden');
    }
});
