'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '../layout';
import { api } from '@/lib/api';
import { CreditCard, Star, ShoppingBag, ArrowLeft, Loader2, MessageSquare, AlertCircle } from 'lucide-react';

export default function CustomerProfileDashboard() {
  const params = useParams();
  const router = useRouter();
  const slug = params.tenantSlug as string;
  const { tenant, customer, customerToken, setCustomerSession } = useTenant();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // If no session, redirect to login
    if (!customerToken) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        // api wrapper automatically sends 'x-tenant-slug' and 'Authorization' bearer headers
        const res = await api.get('/store/auth/profile');
        setProfile(res.data.customer);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load profile history.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [customerToken]);

  const handleLogout = () => {
    setCustomerSession(null, null);
    router.push(`/store/${slug}`);
  };

  // Auth Guard Gate
  if (!customerToken) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-6">
        <div className="mx-auto bg-slate-100/10 border border-opacity-5 p-5 rounded-full w-20 h-20 flex items-center justify-center opacity-75" style={{ borderColor: 'var(--tenant-text)' }}>
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
          <p className="text-xs opacity-60">Please sign in to view your orders dashboard.</p>
        </div>
        <button 
          onClick={() => router.push(`/store/${slug}/login`)}
          className="w-full text-white font-bold py-3.5 rounded-xl text-sm transition"
          style={{ backgroundColor: 'var(--tenant-primary)' }}
        >
          Sign In to Account
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center justify-center space-y-4 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--tenant-primary)' }} />
        <span className="text-xs font-bold opacity-70">Fetching account summary...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold">Profile Fetch Error</h2>
        <p className="text-xs opacity-75">{error || 'Unable to sync with database servers.'}</p>
        <button onClick={handleLogout} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs">
          Sign Out & Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Header Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-opacity-10 pb-6" style={{ borderColor: 'var(--tenant-text)' }}>
        <div className="space-y-1">
          <button 
            onClick={() => router.push(`/store/${slug}`)}
            className="flex items-center space-x-1.5 text-xs font-bold opacity-75 hover:opacity-100 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog Storefront</span>
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight">Customer Dashboard</h1>
          <p className="text-xs opacity-70">Hi, {profile.name}. Review your wallet balances and checkout histories.</p>
        </div>

        <button 
          onClick={handleLogout}
          className="bg-black/5 border border-opacity-10 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black/10 transition"
          style={{ borderColor: 'var(--tenant-text)' }}
        >
          Sign Out of Account
        </button>
      </div>

      {/* Grid: Loyalty & Balances */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Reward Points */}
        <div className="bg-black/[0.01] border border-opacity-5 rounded-3xl p-6 flex items-center justify-between" style={{ borderColor: 'var(--tenant-text)' }}>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider opacity-60">Loyalty Balance</span>
            <span className="block text-3xl font-black">{profile.rewardPoints} Points</span>
            <span className="block text-xs opacity-70">Redeemable for discount coupon codes</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
            <Star className="w-6 h-6 fill-amber-500/20" />
          </div>
        </div>

        {/* Digital Wallet */}
        <div className="bg-black/[0.01] border border-opacity-5 rounded-3xl p-6 flex items-center justify-between" style={{ borderColor: 'var(--tenant-text)' }}>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider opacity-60">Store Wallet Balance</span>
            <span className="block text-3xl font-black">
              {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
              {profile.walletBalance.toFixed(2)}
            </span>
            <span className="block text-xs opacity-70">Used for fast checkouts & store refunds</span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Order Logs</h2>
        
        {profile.orders.length === 0 ? (
          <div className="text-center py-12 bg-black/[0.01] border border-opacity-5 rounded-3xl" style={{ borderColor: 'var(--tenant-text)' }}>
            <span className="text-sm font-semibold opacity-70">No previous orders found.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {profile.orders.map((o: any) => (
              <div 
                key={o.id}
                className="bg-black/[0.01] border border-opacity-5 rounded-3xl p-6 space-y-4"
                style={{ borderColor: 'var(--tenant-text)' }}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-opacity-5 pb-3 gap-2" style={{ borderColor: 'var(--tenant-text)' }}>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="font-mono font-bold">{o.orderNumber}</span>
                    <span className="opacity-60 text-xs">Date: {new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs font-bold">
                    <span className="uppercase opacity-70 bg-black/5 px-2.5 py-0.5 rounded">
                      Pay: {o.paymentStatus}
                    </span>
                    <span className={`uppercase px-2.5 py-0.5 rounded ${
                      o.status === 'DELIVERED' ? 'text-emerald-600 bg-emerald-500/10' : 'text-amber-600 bg-amber-500/10'
                    }`}>
                      Delivery: {o.status}
                    </span>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-1.5 text-xs opacity-90">
                  {o.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="opacity-75">{item.name} (x{item.quantity})</span>
                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Total cost */}
                <div className="flex justify-between items-center pt-3 border-t border-opacity-5 text-sm" style={{ borderColor: 'var(--tenant-text)' }}>
                  <span className="font-semibold opacity-75">Paid Sum:</span>
                  <span className="font-extrabold text-base">${o.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
