'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Shield, 
  Key, 
  TrendingUp, 
  ShoppingBag, 
  Folder, 
  DollarSign, 
  Trash2, 
  Ban, 
  CheckCircle, 
  ArrowRight, 
  Search, 
  Loader2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SuperAdminDashboard() {
  const [secretKey, setSecretKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Dashboard Data
  const [stats, setStats] = useState<any>(null);
  const [stores, setStores] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action Loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if session key already exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('platform_admin_secret');
      if (saved) {
        setSecretKey(saved);
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey) return;

    setLoading(true);
    setAuthError('');

    try {
      // Test the secret by making a call to stats endpoint
      await axios.get(`${API_BASE}/platform/stats`, {
        headers: { 'x-platform-admin-secret': secretKey }
      });

      // On success, save to session
      sessionStorage.setItem('platform_admin_secret', secretKey);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.response?.data?.error || 'Invalid platform secret key.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!secretKey) return;
    try {
      setLoading(true);
      setError('');

      const headers = { 'x-platform-admin-secret': secretKey };

      const [statsRes, storesRes] = await Promise.all([
        axios.get(`${API_BASE}/platform/stats`, { headers }),
        axios.get(`${API_BASE}/platform/stores`, { headers })
      ]);

      setStats(statsRes.data);
      setStores(storesRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to retrieve platform data. Please verify your secret key.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const handleToggleStatus = async (slug: string, currentStatus: string) => {
    if (!confirm(`Are you sure you want to ${currentStatus === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'} store: ${slug}?`)) {
      return;
    }

    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setActionLoading(slug + '_status');

    try {
      await axios.patch(`${API_BASE}/platform/stores/${slug}/status`, 
        { status: nextStatus }, 
        { headers: { 'x-platform-admin-secret': secretKey } }
      );
      
      // Update local state
      setStores(prev => prev.map(s => s.slug === slug ? { ...s, status: nextStatus } : s));
      // Refresh stats
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update store status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async (slug: string, newPlan: string) => {
    setActionLoading(slug + '_plan');

    try {
      await axios.patch(`${API_BASE}/platform/stores/${slug}/plan`, 
        { plan: newPlan }, 
        { headers: { 'x-platform-admin-secret': secretKey } }
      );
      
      setStores(prev => prev.map(s => s.slug === slug ? { ...s, plan: newPlan } : s));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update subscription plan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStore = async (slug: string) => {
    if (!confirm(`🚨 DANGER ZONE! 🚨\nAre you sure you want to PERMANENTLY delete store "${slug}"?\nThis action cannot be undone and will delete all products, orders, pages, and reviews!`)) {
      return;
    }

    setActionLoading(slug + '_delete');

    try {
      await axios.delete(`${API_BASE}/platform/stores/${slug}`, {
        headers: { 'x-platform-admin-secret': secretKey }
      });
      
      setStores(prev => prev.filter(s => s.slug !== slug));
      fetchDashboardData();
      alert(`Store "${slug}" has been permanently deleted.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete store.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('platform_admin_secret');
    setSecretKey('');
    setIsAuthenticated(false);
  };

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Background blur highlight */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-3 relative z-10">
            <div className="bg-indigo-500/10 p-3 rounded-2xl w-14 h-14 flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/20">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Platform Admin Console</h1>
            <p className="text-slate-400 text-xs leading-relaxed">Input your SaaS Platform administrator secret key to manage global parameters.</p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-5 mt-8 relative z-10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Platform Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={secretKey}
                  onChange={e => setSecretKey(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl text-xs tracking-wider uppercase transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span>Unlock Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard UI
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Platform Owner Access</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">SaaS Admin Overview</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-3 rounded-xl transition text-slate-300 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-950/40 hover:bg-red-900/30 border border-red-900/30 text-red-400 font-bold px-4 py-2.5 rounded-xl text-xs transition"
            >
              Lock Console
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Stores */}
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stores</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black">{stats.totalStores}</span>
                <p className="text-[10px] text-slate-500">{stats.activeStores} active storefronts</p>
              </div>
            </div>

            {/* Total Products */}
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Products</span>
                <Folder className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black">{stats.totalProducts}</span>
                <p className="text-[10px] text-slate-500">Across all tenant catalogs</p>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-purple-400" />
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black">{stats.totalOrders}</span>
                <p className="text-[10px] text-slate-500">Shopper checkouts</p>
              </div>
            </div>

            {/* Platform GMV */}
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform GMV</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-black">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <p className="text-[10px] text-slate-500">Gross Merchandise Value</p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Stores Table */}
        <div className="bg-slate-900/50 border border-slate-850 rounded-3xl overflow-hidden p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight">Manage Tenant Instances</h2>
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search stores by name, slug, email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400">Loading active storefront directories...</span>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-medium flex items-center space-x-3 justify-center">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
              <span className="text-sm font-bold block mb-1 text-slate-400">No stores found</span>
              <span className="text-xs text-slate-500">Create a store using the platform Wizard or adjust your search filter.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 font-semibold">
                    <th className="pb-3 pr-4">Store Name</th>
                    <th className="pb-3 px-4">Slug</th>
                    <th className="pb-3 px-4">Plan (Subscription)</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Activity Counts</th>
                    <th className="pb-3 px-4">Created Date</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {filteredStores.map((store) => (
                    <tr key={store.id} className="group hover:bg-slate-900/20 transition duration-150">
                      
                      {/* Name */}
                      <td className="py-4 pr-4">
                        <div className="font-bold text-white text-sm">{store.name}</div>
                        <div className="text-slate-500 text-[10px]">{store.email}</div>
                      </td>
                      
                      {/* Slug */}
                      <td className="py-4 px-4 font-mono text-slate-300">
                        {store.slug}
                      </td>
                      
                      {/* Plan Changer */}
                      <td className="py-4 px-4">
                        <div className="relative inline-block">
                          <select
                            disabled={actionLoading === store.slug + '_plan'}
                            value={store.plan}
                            onChange={(e) => handleChangePlan(store.slug, e.target.value)}
                            className={`appearance-none bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-1.5 font-semibold text-[10px] focus:outline-none transition ${
                              store.plan === 'ENTERPRISE' ? 'text-purple-400 border-purple-500/20' :
                              store.plan === 'PRO' ? 'text-blue-400 border-blue-500/20' : 'text-slate-400'
                            }`}
                          >
                            <option value="FREE">FREE</option>
                            <option value="PRO">PRO</option>
                            <option value="ENTERPRISE">ENTERPRISE</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            ▼
                          </div>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          store.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            store.status === 'ACTIVE' ? 'bg-emerald-450 animate-pulse' : 'bg-amber-400'
                          }`} />
                          {store.status}
                        </span>
                      </td>

                      {/* Products / Orders Count */}
                      <td className="py-4 px-4 text-slate-300">
                        <div>🛍️ {store.productsCount} products</div>
                        <div className="text-[10px] text-slate-500">📦 {store.ordersCount} orders</div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-slate-500 font-medium">
                        {new Date(store.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          
                          {/* Suspend / Activate toggle */}
                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleToggleStatus(store.slug, store.status)}
                            className={`p-2 rounded-xl border transition ${
                              store.status === 'ACTIVE'
                                ? 'bg-amber-950/20 border-amber-900/30 text-amber-400 hover:bg-amber-900/30'
                                : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/30'
                            }`}
                            title={store.status === 'ACTIVE' ? 'Suspend Storefront' : 'Activate Storefront'}
                          >
                            {actionLoading === store.slug + '_status' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : store.status === 'ACTIVE' ? (
                              <Ban className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </button>
                          
                          {/* Delete Store */}
                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleDeleteStore(store.slug)}
                            className="bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 text-red-400 p-2 rounded-xl transition"
                            title="Permanently Delete Store"
                          >
                            {actionLoading === store.slug + '_delete' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
