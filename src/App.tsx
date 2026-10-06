import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  Search,
  CheckCircle2,
  Download,
  Filter,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react';
import {
  Product,
  Category,
  SiteSettings,
  Order,
  AdminUser,
  DashboardStats,
} from './types';
import { storeApi, adminApi, authStorage } from './services/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminCategories } from './components/admin/AdminCategories';
import { AdminSettings } from './components/admin/AdminSettings';

export default function App() {
  // Store Data State
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');

  // Customer Modals State
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string>('');
  const [activeTrackingEmail, setActiveTrackingEmail] = useState<string>('');
  const [orderSuccessBanner, setOrderSuccessBanner] = useState<{
    orderId: string;
    email: string;
  } | null>(null);

  // Admin State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminViewActive, setAdminViewActive] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard');
  const [adminStats, setAdminStats] = useState<DashboardStats | null>(null);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminOrderFilter, setAdminOrderFilter] = useState('All');
  const [selectedOrderForInspection, setSelectedOrderForInspection] = useState<Order | null>(null);
  const [openNewProductDirectly, setOpenNewProductDirectly] = useState(false);

  // Fetch initial public store data
  const loadStoreData = async () => {
    try {
      setIsLoadingStore(true);
      const [settingsData, catData, prodData] = await Promise.all([
        storeApi.getStoreInfo(),
        storeApi.getCategories(),
        storeApi.getProducts(),
      ]);
      setSettings(settingsData);
      setCategories(catData);
      setProducts(prodData);
    } catch (err) {
      console.error('Failed to load store catalog:', err);
    } finally {
      setIsLoadingStore(false);
    }
  };

  // Check if admin token is cached in localStorage
  const checkAdminAuth = async () => {
    const token = authStorage.getToken();
    if (!token) return;

    try {
      const user = await adminApi.getMe();
      setAdminUser(user);
      loadAdminData();
    } catch {
      authStorage.clearToken();
      setAdminUser(null);
    }
  };

  // Load all admin statistics & records
  const loadAdminData = async () => {
    try {
      const [stats, orders, customers, prods, cats, sets] = await Promise.all([
        adminApi.getStats(),
        adminApi.getOrders(),
        adminApi.getCustomers(),
        adminApi.getProducts(),
        adminApi.getCategories(),
        adminApi.getSettings(),
      ]);
      setAdminStats(stats);
      setAdminOrders(orders);
      setAdminCustomers(customers);
      setProducts(prods);
      setCategories(cats);
      setSettings(sets);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadStoreData();
    checkAdminAuth();
  }, []);

  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setAdminUser(admin);
    setAdminModalOpen(false);
    setAdminViewActive(true);
    setAdminActiveTab('dashboard');
    loadAdminData();
  };

  const handleAdminLogout = () => {
    authStorage.clearToken();
    setAdminUser(null);
    setAdminViewActive(false);
  };

  const handleCheckoutSuccess = (order: Order) => {
    setCheckoutProduct(null);
    setOrderSuccessBanner({
      orderId: order.id,
      email: order.customer_email,
    });
    // Scroll to top to see banner
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter products for customer storefront
  const currency = settings?.general.currency || 'PKR';
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      !selectedCategory ||
      prod.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesType =
      selectedTypeFilter === 'All' || prod.product_type === selectedTypeFilter;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      prod.name.toLowerCase().includes(q) ||
      prod.short_description.toLowerCase().includes(q) ||
      prod.category.toLowerCase().includes(q) ||
      prod.product_type.toLowerCase().includes(q);

    return matchesCategory && matchesType && matchesSearch;
  });

  const featuredProducts = products.filter((p) => p.featured);

  // -------------------------------------------------------------
  // ADMIN VIEW RENDERING
  // -------------------------------------------------------------
  if (adminViewActive && adminUser) {
    return (
      <AdminLayout
        admin={adminUser}
        stats={adminStats}
        settings={settings}
        activeTab={adminActiveTab}
        onTabChange={(tab) => {
          setAdminActiveTab(tab);
          setOpenNewProductDirectly(false);
          setSelectedOrderForInspection(null);
        }}
        onLogout={handleAdminLogout}
        onBackToStore={() => setAdminViewActive(false)}
      >
        {adminActiveTab === 'dashboard' && adminStats && (
          <AdminDashboard
            stats={adminStats}
            currency={currency}
            onNavigateTab={(tab, filter) => {
              setAdminActiveTab(tab);
              if (filter) setAdminOrderFilter(filter);
            }}
            onInspectOrder={(order) => {
              setSelectedOrderForInspection(order);
              setAdminActiveTab('orders');
            }}
            onAddNewProduct={() => {
              setOpenNewProductDirectly(true);
              setAdminActiveTab('products');
            }}
          />
        )}

        {adminActiveTab === 'orders' && (
          <AdminOrders
            orders={adminOrders}
            currency={currency}
            initialFilter={adminOrderFilter}
            onRefresh={loadAdminData}
            selectedOrderForInspection={selectedOrderForInspection}
          />
        )}

        {adminActiveTab === 'products' && (
          <AdminProducts
            products={products}
            categories={categories}
            currency={currency}
            onRefresh={loadAdminData}
            openNewModalDirectly={openNewProductDirectly}
          />
        )}

        {adminActiveTab === 'customers' && (
          <AdminCustomers
            customers={adminCustomers}
            currency={currency}
            onFilterOrdersByCustomer={(email) => {
              setAdminOrderFilter('All');
              setAdminActiveTab('orders');
            }}
          />
        )}

        {adminActiveTab === 'categories' && (
          <AdminCategories categories={categories} onRefresh={loadAdminData} />
        )}

        {adminActiveTab === 'settings' && settings && (
          <AdminSettings settings={settings} onRefresh={loadAdminData} />
        )}
      </AdminLayout>
    );
  }

  // -------------------------------------------------------------
  // CUSTOMER STOREFRONT VIEW RENDERING
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        adminUser={adminUser}
        onOpenAdmin={() => {
          if (adminUser) {
            setAdminViewActive(true);
          } else {
            setAdminModalOpen(true);
          }
        }}
        onOpenTracking={() => {
          setActiveTrackingOrderId('');
          setActiveTrackingEmail('');
          setTrackingModalOpen(true);
        }}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Order Submission Success Alert Banner */}
        {orderSuccessBanner && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/50 p-4 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    Order Submitted! Your Order ID is:{' '}
                    <span className="font-mono text-emerald-300">
                      {orderSuccessBanner.orderId}
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-200/80">
                    Your EasyPaisa / JazzCash payment proof has been forwarded to administration. You can track status anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setActiveTrackingOrderId(orderSuccessBanner.orderId);
                    setActiveTrackingEmail(orderSuccessBanner.email);
                    setTrackingModalOpen(true);
                  }}
                  className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Check Verification Status</span>
                </button>
                <button
                  onClick={() => setOrderSuccessBanner(null)}
                  className="p-2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-zinc-800/80 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings?.homepage.hero_badge || 'Instant Digital Delivery • EasyPaisa & JazzCash'}</span>
            </div>

            {/* Hero Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight mb-6">
              {settings?.homepage.hero_heading || 'Elite Digital Assets Built for High-Impact Execution'}
            </h1>

            {/* Hero Subtitle */}
            <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
              {settings?.homepage.hero_description ||
                'Download battle-tested AI prompt vaults, legal agreements, marketing formulas, and templates. Pay securely via EasyPaisa or JazzCash.'}
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('catalog');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{settings?.homepage.hero_cta || 'Browse Digital Catalog'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveTrackingOrderId('');
                  setActiveTrackingEmail('');
                  setTrackingModalOpen(true);
                }}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Track Order / Access Downloads</span>
              </button>
            </div>

            {/* Live Trust Points */}
            <div className="pt-12 grid grid-cols-2 sm:grid-cols-3 max-w-3xl mx-auto gap-4 text-left">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Manual Verified</div>
                  <div className="text-[11px] text-zinc-400">EasyPaisa & JazzCash</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Cryptographic Vault</div>
                  <div className="text-[11px] text-zinc-400">Zero Public File URLs</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">1-Click Online Access</div>
                  <div className="text-[11px] text-zinc-400">Interactive Prompt Bank</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED BESTSELLERS SECTION */}
        {featuredProducts.length > 0 && !selectedCategory && !searchQuery && (
          <section className="py-12 bg-zinc-950 border-b border-zinc-800/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    Hand-Selected
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Featured Digital Vaults
                  </h2>
                </div>
                <span className="text-xs text-zinc-400 hidden sm:inline">
                  Proven frameworks ready for instant execution
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.slice(0, 3).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currency={currency}
                    onViewDetails={setInspectingProduct}
                    onBuyNow={setCheckoutProduct}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FULL PRODUCT CATALOG SECTION */}
        <section id="catalog" className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Catalog Directory
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {selectedCategory ? `${selectedCategory} Assets` : 'All Digital Products'}
                </h2>
              </div>

              {/* Product Type Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {['All', 'Prompt Pack', 'PDF', 'Template', 'Digital Bundle'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedTypeFilter === type
                        ? 'bg-zinc-200 text-black font-extrabold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === null
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                All Categories ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.name
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/40 rounded-2xl border border-zinc-800">
                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h4 className="font-bold text-white text-base">Store is getting ready!</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  No products have been added yet. Products will appear here once you add them from the Admin Panel.
                </p>
                <button
                  onClick={() => {
                    if (adminUser) {
                      setAdminViewActive(true);
                      setAdminActiveTab('products');
                      setOpenNewProductDirectly(true);
                    } else {
                      setAdminModalOpen(true);
                    }
                  }}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  + Add First Product (Admin Panel)
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/40 rounded-2xl border border-zinc-800">
                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h4 className="font-bold text-white text-base">No products match your filter</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Try adjusting your search terms or category selection.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedTypeFilter('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currency={currency}
                    onViewDetails={setInspectingProduct}
                    onBuyNow={setCheckoutProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* WHY CHOOSE US TRUST SECTION */}
        <section className="py-16 bg-zinc-900/60 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Security & Delivery
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                How Manual Verification & Instant Delivery Works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-base">
                  1
                </div>
                <h4 className="font-bold text-white text-base">
                  Select Product & Send EasyPaisa / JazzCash
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Choose your asset. Send the exact price directly to our verified EasyPaisa or JazzCash mobile account from your smartphone.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-base">
                  2
                </div>
                <h4 className="font-bold text-white text-base">
                  Upload Screenshot & Submit TID
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Paste your 11 or 12 digit Transaction ID (TID) and upload the receipt screenshot. A unique Order ID (e.g. DP-20261006-8F32) is minted instantly.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-base">
                  3
                </div>
                <h4 className="font-bold text-white text-base">
                  Instant Vault Unlock
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upon verification by the admin, your download button and online interactive prompt vault unlock immediately on your order tracking portal.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={() => {
          if (adminUser) setAdminViewActive(true);
          else setAdminModalOpen(true);
        }}
        onOpenTracking={() => {
          setActiveTrackingOrderId('');
          setActiveTrackingEmail('');
          setTrackingModalOpen(true);
        }}
      />

      {/* MODALS */}
      {/* 1. Product Detail Modal */}
      {inspectingProduct && (
        <ProductDetailModal
          product={inspectingProduct}
          currency={currency}
          onClose={() => setInspectingProduct(null)}
          onBuyNow={(prod) => {
            setInspectingProduct(null);
            setCheckoutProduct(prod);
          }}
        />
      )}

      {/* 2. Checkout Modal */}
      {checkoutProduct && settings && (
        <CheckoutModal
          product={checkoutProduct}
          settings={settings}
          onClose={() => setCheckoutProduct(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* 3. Order Tracking & Digital Downloads Portal Modal */}
      {trackingModalOpen && (
        <OrderTrackingModal
          initialOrderId={activeTrackingOrderId}
          initialEmail={activeTrackingEmail}
          onClose={() => setTrackingModalOpen(false)}
        />
      )}

      {/* 4. Admin Login Modal */}
      {adminModalOpen && (
        <AdminLoginModal
          onClose={() => setAdminModalOpen(false)}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      )}
    </div>
  );
}
