'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '../layout';
import { api } from '@/lib/api';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

export default function CustomerRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.tenantSlug as string;
  const { tenant } = useTenant();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateField = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in name, email address, and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/store/auth/register', formData);
      setSuccess(true);
      
      // Auto redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/store/${slug}/login`);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed. Try checking your email address.');
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
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-xs opacity-70">Register to keep track of orders and save shipping details.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3.5 rounded-xl text-xs font-semibold text-center">
            Registration successful! Redirecting to login...
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 opacity-75">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/5 border border-opacity-10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--tenant-text)' }}
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 opacity-75">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-black/5 border border-opacity-10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--tenant-text)' }}
                  />
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 opacity-75">Phone</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full bg-black/5 border border-opacity-10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--tenant-text)' }}
                  />
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 opacity-75">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={e => updateField('password', e.target.value)}
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
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-opacity-5 text-xs opacity-75" style={{ borderColor: 'var(--tenant-text)' }}>
          <span>Already have a secure account? </span>
          <button 
            onClick={() => router.push(`/store/${slug}/login`)}
            className="font-bold underline"
            style={{ color: 'var(--tenant-primary)' }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
