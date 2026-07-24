'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTenant } from './layout';
import { ShoppingBag, ArrowRight, Star, Heart, Check, Plus, MessageSquare } from 'lucide-react';

export default function StoreFrontHome() {
  const params = useParams();
  const router = useRouter();
  const slug = params.tenantSlug as string;
  const { tenant, addToCart } = useTenant();

  const [sections, setSections] = useState<Array<any>>([]);
  const [categories, setCategories] = useState<Array<any>>([]);
  const [products, setProducts] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Feedback popup for adding to cart
  const [addedItem, setAddedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchStoreData = async () => {
      try {
        setLoading(true);
        // Load page layout sections
        const pageRes = await api.get('/store/pages/index');
        setSections(pageRes.data.sections || []);

        // Load store categories
        const catRes = await api.get('/store/categories');
        setCategories(catRes.data || []);

        // Load store products
        const prodRes = await api.get('/store/products');
        setProducts(prodRes.data || []);
      } catch (e) {
        console.error('Failed to load homepage elements:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [slug]);

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 animate-pulse">
        <div className="h-64 md:h-96 bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="h-12 bg-slate-800 rounded-xl" />
          <div className="h-12 bg-slate-800 rounded-xl" />
          <div className="h-12 bg-slate-800 rounded-xl" />
          <div className="h-12 bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="space-y-3">
              <div className="h-48 bg-slate-800 rounded-2xl" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter products by category
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category?.slug === selectedCategory)
    : products;

  return (
    <div className="space-y-16 pb-20">
      {/* Toast Notification for Adding to Cart */}
      {addedItem && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center space-x-2 animate-bounce">
          <div className="bg-emerald-500 p-1 rounded-full text-white">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">Added to shopping cart!</span>
        </div>
      )}

      {sections.map((sec) => {
        // ==========================================
        // HERO BANNER SECTION
        // ==========================================
        if (sec.type === 'HeroBanner') {
          const settings = sec.settings || {};
          return (
            <section 
              key={sec.id}
              className="relative py-24 md:py-36 px-6 overflow-hidden bg-slate-900 text-white"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.65)), url(${settings.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                  {settings.title}
                </h1>
                <p className="text-base md:text-lg opacity-90 max-w-xl mx-auto">
                  {settings.subtitle}
                </p>
                <div className="pt-4">
                  <a 
                    href="#products-grid"
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition hover:scale-105"
                    style={{ backgroundColor: 'var(--tenant-primary)' }}
                  >
                    <span>{settings.ctaText || 'Browse Shop'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </section>
          );
        }

        // ==========================================
        // CATEGORIES GRID SECTION
        // ==========================================
        if (sec.type === 'CategoriesGrid') {
          const settings = sec.settings || {};
          return (
            <section key={sec.id} className="max-w-7xl mx-auto px-6">
              <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl font-bold tracking-tight">{settings.title || 'Browse Categories'}</h2>
                <div className="w-12 h-1 rounded mt-2" style={{ backgroundColor: 'var(--tenant-primary)' }} />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold border transition ${
                    selectedCategory === null 
                      ? 'text-white border-transparent' 
                      : 'border-opacity-10 border-slate-700 bg-transparent hover:bg-slate-100/10'
                  }`}
                  style={selectedCategory === null ? { backgroundColor: 'var(--tenant-primary)' } : {}}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold border transition ${
                      selectedCategory === cat.slug 
                        ? 'text-white border-transparent' 
                        : 'border-opacity-10 border-slate-700 bg-transparent hover:bg-slate-100/10'
                    }`}
                    style={selectedCategory === cat.slug ? { backgroundColor: 'var(--tenant-primary)' } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>
          );
        }

        // ==========================================
        // FEATURED PRODUCTS SECTION
        // ==========================================
        if (sec.type === 'FeaturedProducts') {
          const settings = sec.settings || {};
          return (
            <section id="products-grid" key={sec.id} className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between mb-8 border-b border-opacity-10 pb-4" style={{ borderColor: 'var(--tenant-text)' }}>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{settings.title || 'Our Products'}</h2>
                  {selectedCategory && (
                    <span className="text-xs font-semibold opacity-70">
                      Filtering: {categories.find(c => c.slug === selectedCategory)?.name}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold opacity-60">{filteredProducts.length} items found</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-black/5 border border-opacity-5 rounded-2xl">
                  <span className="text-lg font-bold block mb-1">No products found</span>
                  <span className="text-xs opacity-60">Check back later or choose another category filter.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => {
                    const firstImage = p.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
                    return (
                      <div 
                        key={p.id}
                        onClick={() => router.push(`/store/${slug}/products/${p.slug}`)}
                        className="group border border-opacity-5 bg-black/[0.02] rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg transition duration-300 flex flex-col"
                        style={{ borderColor: 'var(--tenant-text)' }}
                      >
                        {/* Product Image */}
                        <div className="relative aspect-square overflow-hidden bg-slate-100">
                          <img 
                            src={firstImage} 
                            alt={p.name} 
                            className="object-cover w-full h-full group-hover:scale-105 transition duration-500" 
                          />
                        </div>

                        {/* Product Info */}
                        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{p.category?.name || 'General'}</span>
                            <h3 className="font-bold text-sm leading-snug mt-1 group-hover:text-indigo-400 transition">
                              {p.name}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="font-extrabold text-base">
                              {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                              {p.price.toFixed(2)}
                            </span>
                            <button
                              onClick={(e) => handleAddToCart(p, e)}
                              className="p-2.5 rounded-lg text-white hover:scale-105 transition shrink-0"
                              style={{ backgroundColor: 'var(--tenant-primary)' }}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        }

        // ==========================================
        // CONTACT SECTION
        // ==========================================
        if (sec.type === 'ContactSection') {
          const settings = sec.settings || {};
          return (
            <section key={sec.id} className="max-w-4xl mx-auto px-6">
              <div className="bg-black/[0.03] border border-opacity-10 rounded-3xl p-8 md:p-10" style={{ borderColor: 'var(--tenant-text)' }}>
                <div className="text-center max-w-lg mx-auto mb-8 space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">{settings.title || 'Get in Touch'}</h2>
                  <p className="text-xs opacity-75">Send us an message, or order directly via WhatsApp chats.</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4 text-sm opacity-85">
                    <div>
                      <span className="block font-bold mb-1">Our Location</span>
                      <span className="block opacity-75">{tenant.address || 'Online only'}</span>
                      <span className="block opacity-75">{tenant.city}, {tenant.country}</span>
                    </div>
                    <div>
                      <span className="block font-bold mb-1">Support Contacts</span>
                      <span className="block opacity-75">Email: {tenant.email}</span>
                      {tenant.phone && <span className="block opacity-75">Phone: {tenant.phone}</span>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {tenant.whatsapp && (
                      <a 
                        href={`https://wa.me/${tenant.whatsapp.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center space-x-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm transition"
                      >
                        <MessageSquare className="w-4.5 h-4.5" />
                        <span>Chat via WhatsApp</span>
                      </a>
                    )}
                    <button 
                      onClick={() => alert('Contact submissions sandbox. In production this triggers email logs.')}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl text-sm transition border border-slate-800"
                    >
                      Email Contact Form
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
