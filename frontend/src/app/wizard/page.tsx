'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Business Details
    businessName: '',
    subdomain: '',
    description: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    country: 'United States',
    currency: 'USD',
    language: 'en',
    timezone: 'UTC',
    taxRate: '0',

    // Step 2: Category
    category: 'Bakery',

    // Step 3: Theme
    themeName: 'Modern',

    // Step 4: Enabled Features
    enabledFeatures: ['inventory', 'coupons', 'reviews', 'whatsapp'],

    // Step 5: Payment Gateway Options
    paymentMethods: ['cod', 'stripe'],

    // Admin Account Credentials
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const updateField = (name: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-populate slug and admin email based on business name
      if (name === 'businessName') {
        updated.subdomain = value.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!updated.adminEmail && value) {
          updated.adminEmail = `admin@${updated.subdomain}.com`;
        }
      }
      return updated;
    });
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => {
      const current = [...prev.enabledFeatures];
      const index = current.indexOf(feature);
      if (index === -1) {
        current.push(feature);
      } else {
        current.splice(index, 1);
      }
      return { ...prev, enabledFeatures: current };
    });
  };

  const handlePaymentToggle = (gateway: string) => {
    setFormData(prev => {
      const current = [...prev.paymentMethods];
      const index = current.indexOf(gateway);
      if (index === -1) {
        current.push(gateway);
      } else {
        current.splice(index, 1);
      }
      return { ...prev, paymentMethods: current };
    });
  };

  const handleNext = () => {
    // Basic step validations
    if (step === 1) {
      if (!formData.businessName || !formData.subdomain || !formData.email) {
        setError('Please fill in business name, subdomain slug, and contact email.');
        return;
      }
      setError('');
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      setError('Please set up your owner name, login email, and login password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/wizard/bootstrap', formData);
      const data = response.data;
      
      // Store auth session
      localStorage.setItem('saas_token', data.token);
      localStorage.setItem('saas_tenant_id', data.tenant.id);
      localStorage.setItem('saas_tenant_slug', data.tenant.slug);
      
      setSuccessData(data);
      setStep(8); // Success page
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to complete store setup. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative selection:bg-indigo-600 selection:text-white">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-2xl w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 backdrop-blur-md">
        
        {/* Wizard Progress Line */}
        {step < 8 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Step {step} of 7</span>
              <span className="text-sm font-bold text-indigo-400">
                {step === 1 && 'Store Details'}
                {step === 2 && 'Business Category'}
                {step === 3 && 'Theme Design'}
                {step === 4 && 'Key Features'}
                {step === 5 && 'Payment Methods'}
                {step === 6 && 'Shipping Methods'}
                {step === 7 && 'Review & Credentials'}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-center space-x-3 text-red-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* ==========================================
            STEP 1: BUSINESS INFO
            ========================================== */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Tell us about your business</h2>
              <p className="text-slate-400 text-sm">Enter the fundamental profile details of your brand store catalog.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Store Name</label>
                <input 
                  type="text" 
                  value={formData.businessName}
                  onChange={e => updateField('businessName', e.target.value)}
                  placeholder="e.g. Sourdough Bites"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Store Subdomain</label>
                <div className="flex">
                  <input 
                    type="text" 
                    value={formData.subdomain}
                    onChange={e => updateField('subdomain', e.target.value)}
                    placeholder="sourdoughbites"
                    className="w-full bg-slate-950 border border-slate-800 rounded-l-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition text-white"
                  />
                  <span className="bg-slate-800 border border-l-0 border-slate-800 rounded-r-xl px-4 py-3 text-sm text-slate-400 font-medium">
                    .platform.com
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Store Description</label>
              <textarea 
                value={formData.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="Brief summary of what you sell..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition text-white"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Contact Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="hello@shop.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">WhatsApp Contact</label>
                <input 
                  type="text" 
                  value={formData.whatsapp}
                  onChange={e => updateField('whatsapp', e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 2: CATEGORY SELECTOR
            ========================================== */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Select your Business Category</h2>
              <p className="text-slate-400 text-sm">We will bootstrap default categories, layout designs, and colors matching this category.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'Bakery', name: 'Bakery & Sweets', icon: '🍞' },
                { key: 'Clothing', name: 'Clothing & Fashion', icon: '🧥' },
                { key: 'Restaurant', name: 'Food & Dining', icon: '🍔' },
                { key: 'Grocery', name: 'Groceries & Foods', icon: '🥦' }
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => updateField('category', cat.key)}
                  className={`p-6 rounded-2xl border text-left transition group ${
                    formData.category === cat.key 
                      ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5' 
                      : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                  }`}
                >
                  <span className="text-3xl block mb-4 group-hover:scale-110 transition duration-300">{cat.icon}</span>
                  <h3 className="text-base font-bold text-white mb-1">{cat.name}</h3>
                  <span className="text-xs text-slate-500">Auto-bootstrap default layout</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 3: THEME SELECTOR
            ========================================== */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Select your Storefront Theme</h2>
              <p className="text-slate-400 text-sm">You can change the typography and color sliders later in your page customizer.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Modern', desc: 'Sleek, round components, default palettes' },
                { name: 'Minimal', desc: 'High typography details, bold lines, thin shapes' },
                { name: 'Elegant', desc: 'Luxury style, serif headers, amber highlights' },
                { name: 'Organic', desc: 'Nature styles, green layout accents' }
              ].map(theme => (
                <button
                  key={theme.name}
                  onClick={() => updateField('themeName', theme.name)}
                  className={`p-6 rounded-2xl border text-left transition ${
                    formData.themeName === theme.name 
                      ? 'border-indigo-500 bg-indigo-500/5' 
                      : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                  }`}
                >
                  <h3 className="text-base font-bold text-white mb-1">{theme.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{theme.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 4: ENABLE FEATURES
            ========================================== */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Enable On-demand SaaS Modules</h2>
              <p className="text-slate-400 text-sm">Activate built-in systems to match your operational workflow.</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'inventory', name: 'Inventory tracking', desc: 'Track stock counts in warehouse and trigger low stock notifications.' },
                { id: 'coupons', name: 'Coupons & Discounts', desc: 'Generate percent and fixed-value codes for marketing promotions.' },
                { id: 'reviews', name: 'Customer Reviews', desc: 'Allow store customers to rate products and leave text reviews.' },
                { id: 'whatsapp', name: 'WhatsApp Checkout Orders', desc: 'Allows customers to direct order receipts straight to your phone chat.' }
              ].map(feat => (
                <label 
                  key={feat.id}
                  className="flex items-start space-x-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/10 cursor-pointer hover:border-slate-700 transition"
                >
                  <input 
                    type="checkbox"
                    checked={formData.enabledFeatures.includes(feat.id)}
                    onChange={() => handleFeatureToggle(feat.id)}
                    className="mt-1 w-4.5 h-4.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-white mb-1">{feat.name}</span>
                    <span className="block text-xs text-slate-500 leading-relaxed">{feat.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 5: PAYMENT GATEWAYS
            ========================================== */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Configure Payments</h2>
              <p className="text-slate-400 text-sm">Select payment channels available to your customers at checkout.</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Customers pay in cash upon receiving the package.' },
                { id: 'stripe', name: 'Stripe Payments', desc: 'Process Visa, Mastercard, Apple Pay immediately (Sandbox activated).' },
                { id: 'bank_transfer', name: 'Bank Wire Transfer', desc: 'Provides wire information for manual verification.' }
              ].map(pay => (
                <label 
                  key={pay.id}
                  className="flex items-start space-x-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/10 cursor-pointer hover:border-slate-700 transition"
                >
                  <input 
                    type="checkbox"
                    checked={formData.paymentMethods.includes(pay.id)}
                    onChange={() => handlePaymentToggle(pay.id)}
                    className="mt-1 w-4.5 h-4.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-white mb-1">{pay.name}</span>
                    <span className="block text-xs text-slate-500 leading-relaxed">{pay.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 6: SHIPPING METHODS
            ========================================== */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Define Store Shipping Rules</h2>
              <p className="text-slate-400 text-sm">Specify flat rates and threshold guidelines.</p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <div>
                  <span className="block text-sm font-semibold text-white">Flat Rate Shipping</span>
                  <span className="block text-xs text-slate-500">Charged on all standard catalog orders.</span>
                </div>
                <span className="text-sm font-bold text-indigo-400">$10.00 Flat Fee</span>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="block text-sm font-semibold text-white">Free Delivery Threshold</span>
                  <span className="block text-xs text-slate-500">Enable free shipping when subtotal exceeds limit.</span>
                </div>
                <span className="text-sm font-bold text-indigo-400">Orders over $50.00</span>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 7: CREDENTIALS & ONBOARDING ADMIN
            ========================================== */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Create Store Admin Login</h2>
              <p className="text-slate-400 text-sm">Set up the master credentials for your dashboard access.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Owner Full Name</label>
                <input 
                  type="text" 
                  value={formData.adminName}
                  onChange={e => updateField('adminName', e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Login Email Address</label>
                <input 
                  type="email" 
                  value={formData.adminEmail}
                  onChange={e => updateField('adminEmail', e.target.value)}
                  placeholder="admin@shop.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Admin Password</label>
                <input 
                  type="password" 
                  value={formData.adminPassword}
                  onChange={e => updateField('adminPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            STEP 8: SUCCESS SCREEN
            ========================================== */}
        {step === 8 && successData && (
          <div className="text-center space-y-6 py-6">
            <div className="mx-auto bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-full w-20 h-20 flex items-center justify-center text-emerald-400 mb-2 shadow-lg shadow-emerald-500/10">
              <Check className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-white mb-2">Store Ready to Launch!</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                We have generated your database tables, default categories, catalog catalog, and page layouts.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl max-w-md mx-auto text-left space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-slate-800/60 pb-2.5">
                <span className="text-slate-500">Store Name:</span>
                <span className="font-semibold text-white">{successData.tenant.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-800/60 pb-2.5">
                <span className="text-slate-500">Subdomain:</span>
                <span className="font-mono text-indigo-400 font-semibold">{successData.tenant.slug}.platform.com</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-800/60 pb-2.5">
                <span className="text-slate-500">Staff Account:</span>
                <span className="font-semibold text-white">{successData.user.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Currency:</span>
                <span className="font-semibold text-white">{successData.tenant.currency}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4">
              <button
                onClick={() => router.push(`/store/${successData.tenant.slug}/admin`)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg transition"
              >
                Go to Admin Dashboard
              </button>
              <button
                onClick={() => router.push(`/store/${successData.tenant.slug}`)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-6 py-3.5 rounded-xl text-sm font-semibold transition"
              >
                Visit Live Storefront
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 8 && (
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-800/60">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`flex items-center space-x-2 text-sm font-semibold transition px-4 py-2.5 rounded-xl ${
                step === 1 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {step < 7 ? (
              <button
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-7 py-3 rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/30 transition flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Bootstrapping Database...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-white/10" />
                    <span>Complete Setup</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
