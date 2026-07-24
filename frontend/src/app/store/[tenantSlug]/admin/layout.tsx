'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { LayoutDashboard, ShoppingCart, Settings, Layers, LogOut, Lock, LogIn, Eye, Sparkles, MessageSquare } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const slug = params.tenantSlug as string;

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('saas_token');
      setToken(savedToken);
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in your admin credentials.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await api.post('/admin/auth/login', { email, password });
      const data = res.data;

      localStorage.setItem('saas_token', data.token);
      localStorage.setItem('saas_tenant_id', data.user.tenantId);
      
      setToken(data.token);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setAuthError(err.response?.data?.error || 'Invalid credentials or connection failure.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_tenant_id');
    setToken(null);
    router.push(`/store/${slug}/admin`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-500 text-xs tracking-wider uppercase font-semibold">Validating Dashboard Auth...</span>
      </div>
    );
  }

  // Auth Barrier Login Page
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-md w-full bg-slate-900/40 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
          <div className="text-center mb-8">
            <div className="mx-auto bg-indigo-600/10 border border-indigo-500/20 p-3 rounded-2xl w-12 h-12 flex items-center justify-center text-indigo-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Store Admin Portal</h2>
            <p className="text-slate-400 text-xs mt-1">Authenticate to manage product listings, inventory, and order receipts.</p>
          </div>

          {authError && (
            <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-3 text-red-300 text-xs font-semibold">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Login Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@shop.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
            >
              {authLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  <span>Authenticate Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Sidebar Layout
  const links = [
    { label: 'Overview Metrics', path: `/store/${slug}/admin`, icon: LayoutDashboard },
    { label: 'Catalog & Inventory', path: `/store/${slug}/admin/products`, icon: Settings },
    { label: 'Customer Orders', path: `/store/${slug}/admin/orders`, icon: ShoppingCart },
    { label: 'Reviews Moderation', path: `/store/${slug}/admin/reviews`, icon: MessageSquare },
    { label: 'Customizer Layout', path: `/store/${slug}/admin/builder`, icon: Layers }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 shrink-0 hidden md:flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Dashboard Header Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Sparkles className="w-4.5 h-4.5 fill-white/10" />
            </div>
            <span className="text-sm font-bold tracking-wider uppercase bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Tenant Admin
            </span>
          </div>

          {/* Links list */}
          <nav className="space-y-1">
            {links.map((link, idx) => {
              const Icon = link.icon;
              const isActive = pathname === link.path;
              return (
                <button
                  key={idx}
                  onClick={() => router.push(link.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-2 pt-6 border-t border-slate-900">
          <button
            onClick={() => router.push(`/store/${slug}`)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/40 transition"
          >
            <Eye className="w-4 h-4" />
            <span>Customer View</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Portal</span>
          </button>
        </div>
      </aside>

      {/* Contents Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md px-8 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="font-bold text-sm text-slate-400 uppercase tracking-wider">OmniSaaS Console</h1>
            <span className="bg-slate-800 text-[10px] text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
              Isolated Env
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-slate-400">Storefront: {slug}.platform.com</span>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition md:hidden"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Children page viewport */}
        <main className="flex-grow overflow-y-auto px-8 py-8">
          {children}
        </main>
      </div>

    </div>
  );
}
