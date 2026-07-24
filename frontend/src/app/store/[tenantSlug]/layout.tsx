'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { ShoppingCart, User, Phone, ShoppingBag, Loader2 } from 'lucide-react';

interface TenantContextType {
  tenant: any;
  cart: Array<{ product: any; quantity: number }>;
  addToCart: (product: any, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  customer: any;
  customerToken: string | null;
  setCustomerSession: (customer: any, token: string | null) => void;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within a TenantProvider');
  return context;
};

export default function TenantStoreLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const slug = params.tenantSlug as string;

  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Array<any>>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(null);

  // Load customer session
  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      const savedToken = localStorage.getItem(`customer_token_${slug}`);
      const savedCust = localStorage.getItem(`customer_${slug}`);
      if (savedToken && savedCust) {
        setCustomerToken(savedToken);
        setCustomer(JSON.parse(savedCust));
      }
    }
  }, [slug]);

  const setCustomerSession = (cust: any, tokenVal: string | null) => {
    if (tokenVal) {
      localStorage.setItem(`customer_token_${slug}`, tokenVal);
      localStorage.setItem(`customer_${slug}`, JSON.stringify(cust));
      setCustomerToken(tokenVal);
      setCustomer(cust);
    } else {
      localStorage.removeItem(`customer_token_${slug}`);
      localStorage.removeItem(`customer_${slug}`);
      setCustomerToken(null);
      setCustomer(null);
    }
  };

  // Load cart from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      const saved = localStorage.getItem(`cart_${slug}`);
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [slug]);

  // Load tenant details
  useEffect(() => {
    if (!slug) return;
    
    const fetchTenantInfo = async () => {
      try {
        setLoading(true);
        const res = await api.get('/store/info');
        setTenant(res.data);
      } catch (err: any) {
        console.error(err);
        setError('Store not found or failed to load store configurations.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantInfo();
  }, [slug]);

  // Inject CSS custom properties when theme variables change
  useEffect(() => {
    if (!tenant) return;
    const theme = tenant.themeSettings;
    const root = document.documentElement;
    
    root.style.setProperty('--tenant-primary', theme.primaryColor || '#000000');
    root.style.setProperty('--tenant-secondary', theme.secondaryColor || '#666666');
    root.style.setProperty('--tenant-bg', theme.backgroundColor || '#ffffff');
    root.style.setProperty('--tenant-text', theme.textColor || '#333333');
  }, [tenant]);

  const addToCart = (product: any, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + qty } 
            : item
        );
      } else {
        updated = [...prev, { product, quantity: qty }];
      }
      localStorage.setItem(`cart_${slug}`, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.product.id !== productId);
      localStorage.setItem(`cart_${slug}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(`cart_${slug}`);
  };

  const cartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // If loading, display premium page skeleton loaders
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-slate-400 text-sm font-semibold tracking-wide animate-pulse">Loading store branding...</span>
      </div>
    );
  }

  // Admin pages layout override (do not render store header/footer)
  if (pathname.includes('/admin')) {
    return (
      <TenantContext.Provider value={{ tenant, cart, addToCart, removeFromCart, clearCart }}>
        <div className="bg-slate-950 min-h-screen text-slate-100 font-sans">
          {children}
        </div>
      </TenantContext.Provider>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-full mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Store Profile Offline</h2>
        <p className="text-slate-500 max-w-md mb-6">{error || 'The requested storefront could not be located on our platform.'}</p>
        <button 
          onClick={() => router.push('/')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg transition"
        >
          Return to Marketing Platform
        </button>
      </div>
    );
  }

  const theme = tenant.themeSettings;

  return (
    <TenantContext.Provider value={{ tenant, cart, addToCart, removeFromCart, clearCart, customer, customerToken, setCustomerSession }}>
      <div 
        className="min-h-screen flex flex-col font-sans transition-colors duration-300"
        style={{ backgroundColor: 'var(--tenant-bg)', color: 'var(--tenant-text)' }}
      >
        {/* Dynamic Store Header */}
        <header 
          className="border-b border-opacity-10 sticky top-0 z-40 backdrop-blur-md"
          style={{ 
            borderColor: 'var(--tenant-text)', 
            backgroundColor: `${theme.backgroundColor}dd` 
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Brand Logo/Name */}
            <div 
              onClick={() => router.push(`/store/${slug}`)}
              className="flex items-center space-x-3 cursor-pointer"
            >
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt={tenant.name} className="w-8 h-8 object-contain rounded-md" />
              ) : (
                <div 
                  className="p-2 rounded-lg text-white"
                  style={{ backgroundColor: 'var(--tenant-primary)' }}
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
              <span className="text-lg font-bold tracking-tight">{tenant.name}</span>
            </div>

            {/* Navigation shortcuts */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold opacity-85">
              <span onClick={() => router.push(`/store/${slug}`)} className="cursor-pointer hover:opacity-100 transition">Home</span>
              <span onClick={() => router.push(`/store/${slug}#products-grid`)} className="cursor-pointer hover:opacity-100 transition">Catalog</span>
              <span onClick={() => router.push(`/store/${slug}#contact-footer`)} className="cursor-pointer hover:opacity-100 transition">Contact</span>
            </nav>

            {/* Header Actions */}
            <div className="flex items-center space-x-5">
              {tenant.whatsapp && (
                <a 
                  href={`https://wa.me/${tenant.whatsapp.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-emerald-500 hover:scale-105 transition hidden sm:block"
                >
                  <Phone className="w-5 h-5 fill-emerald-500/10" />
                </a>
              )}
              <div 
                onClick={() => router.push(`/store/${slug}/cart`)}
                className="relative cursor-pointer hover:scale-105 transition p-2 rounded-full hover:bg-slate-100/10"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border animate-bounce"
                    style={{ 
                      backgroundColor: 'var(--tenant-primary)', 
                      borderColor: 'var(--tenant-bg)' 
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </div>
              {customer ? (
                <div className="flex items-center space-x-3 text-xs">
                  <span 
                    onClick={() => router.push(`/store/${slug}/profile`)}
                    className="cursor-pointer hover:underline font-bold"
                  >
                    Hi, {customer.name.split(' ')[0]}
                  </span>
                  <button 
                    onClick={() => setCustomerSession(null, null)}
                    className="opacity-70 hover:opacity-100 hover:text-red-500 font-semibold"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => router.push(`/store/${slug}/login`)}
                  className="text-xs font-bold hover:underline"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Store Contents */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Dynamic Store Footer */}
        <footer 
          id="contact-footer"
          className="border-t border-opacity-10 py-12 bg-black/5"
          style={{ borderColor: 'var(--tenant-text)' }}
        >
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-sm opacity-80">
            <div>
              <h3 className="font-bold text-base mb-3">{tenant.name}</h3>
              <p className="leading-relaxed opacity-70 mb-4">{tenant.description || 'Premium multi-tenant storefront powered by OmniSaaS E-Commerce.'}</p>
              <span className="text-xs opacity-60">Category: {tenant.category}</span>
            </div>
            <div>
              <h4 className="font-bold mb-3">Address & Contact</h4>
              <p className="opacity-70 leading-relaxed mb-2">{tenant.address || 'Online Store'}</p>
              <p className="opacity-70 mb-1">Email: {tenant.email}</p>
              {tenant.phone && <p className="opacity-70">Phone: {tenant.phone}</p>}
            </div>
            <div>
              <h4 className="font-bold mb-3">Powered by OmniSaaS</h4>
              <p className="opacity-70 leading-relaxed">This is an isolated store instance. Multiple store tenants run on the same shared backend code base safely and securely.</p>
            </div>
          </div>
        </footer>
      </div>
    </TenantContext.Provider>
  );
}
