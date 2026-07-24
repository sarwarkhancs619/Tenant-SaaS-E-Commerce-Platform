'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '../layout';
import { api } from '@/lib/api';
import { Mail, Lock, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CustomerLoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.tenantSlug as string;
  const { tenant, setCustomerSession } = useTenant();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/store/auth/login', { email, password });
      const data = res.data;

      // Save customer session inside Layout context & localStorage
      setCustomerSession(data.customer, data.token);

      // Navigate to customer profile
      router.push(`/store/${slug}/profile`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 flex flex-col justify-center min-h-[70vh]">
      <div 
        className="bg-black/[0.01] border border-opacity-10 rounded-3xl p-8 space-y-6 shadow-sm"
        style={{ borderColor: 'var(--tenant-text)' }}
      >
        <div className="text-center space-y-2">
          <div 
            className="mx-auto p-3 rounded-2xl text-white w-12 h-12 flex items-center justify-center"
            style={{ backgroundColor: 'var(--tenant-primary)' }}
          >
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to your account</h1>
          <p className="text-xs opacity-70">Manage your order receipts and view your loyalty points balance.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 opacity-75">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full bg-black/5 border border-opacity-10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                style={{ borderColor: 'var(--tenant-text)' }}
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 opacity-75">Password</label>
            <div className="relative">
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/5 border border-opacity-10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                style={{ borderColor: 'var(--tenant-text)' }}
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3.5 rounded-xl text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
            style={{ backgroundColor: 'var(--tenant-primary)' }}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-opacity-5 text-xs opacity-75" style={{ borderColor: 'var(--tenant-text)' }}>
          <span>Don't have a secure account? </span>
          <button 
            onClick={() => router.push(`/store/${slug}/register`)}
            className="font-bold underline"
            style={{ color: 'var(--tenant-primary)' }}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
