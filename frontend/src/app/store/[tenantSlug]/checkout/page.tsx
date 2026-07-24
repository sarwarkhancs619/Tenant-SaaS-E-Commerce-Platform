'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '../layout';
import { api } from '@/lib/api';
import { Lock, ChevronLeft, CreditCard } from 'lucide-react';

export default function StoreCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.tenantSlug as string;
  const { tenant, cart, clearCart, customer } = useTenant();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Checkout Form State
  const [shippingForm, setShippingForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: tenant?.country || 'United States',
    paymentMethod: 'cod'
  });

  // Prefill details if customer is logged in
  React.useEffect(() => {
    if (customer) {
      setShippingForm(prev => ({
        ...prev,
        name: customer.name || prev.name,
        email: customer.email || prev.email,
        phone: customer.phone || prev.phone
      }));
    }
  }, [customer]);

  const updateField = (name: string, value: string) => {
    setShippingForm(prev => ({ ...prev, [name]: value }));
  };

  const subtotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  const taxRate = tenant?.taxRate || 0.0;
  const tax = subtotal * taxRate;
  const shippingFee = subtotal === 0 ? 0.0 : (subtotal > 50 ? 0.0 : 10.0);
  const total = subtotal + tax + shippingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingForm.name || !shippingForm.email || !shippingForm.address) {
      setError('Please fill in name, email address, and shipping address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customerEmail: shippingForm.email,
        customerName: shippingForm.name,
        customerPhone: shippingForm.phone,
        shippingAddress: {
          address: shippingForm.address,
          city: shippingForm.city,
          zip: shippingForm.zip,
          country: shippingForm.country
        },
        paymentMethod: shippingForm.paymentMethod,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      const res = await api.post('/store/checkout', payload);
      const data = res.data;
      
      // Clear Cart state
      clearCart();

      // Redirect to success page
      router.push(`/store/${storeSlug}/success?orderNumber=${data.order.orderNumber}&orderId=${data.order.id}`);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render check
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <h2 className="text-xl font-bold mb-4">Empty Cart</h2>
        <button onClick={() => router.push(`/store/${storeSlug}`)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl">
          Browse Products
        </button>
      </div>
    );
  }

  // Parse enabled payments
  let paymentSettings = ['cod'];
  try {
    const parsed = JSON.parse(tenant.themeSettings).paymentMethods || [];
    if (parsed.length > 0) paymentSettings = parsed;
  } catch (e) {}

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={() => router.push(`/store/${storeSlug}/cart`)}
        className="flex items-center space-x-1.5 text-xs font-bold mb-8 opacity-75 hover:opacity-100 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Return to Shopping Cart</span>
      </button>

      <h1 className="text-3xl font-extrabold tracking-tight mb-8">Secure Checkout</h1>

      {error && (
        <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-10 items-start">
        {/* Shipping Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/[0.01] border border-opacity-5 rounded-3xl p-6 md:p-8 space-y-6" style={{ borderColor: 'var(--tenant-text)' }}>
            <h2 className="text-lg font-bold text-white" style={{ color: 'var(--tenant-text)' }}>Shipping Coordinates</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold opacity-75 uppercase mb-2">Customer Full Name</label>
                <input 
                  type="text" 
                  required
                  value={shippingForm.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/10 border border-opacity-10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition"
                  style={{ borderColor: 'var(--tenant-text)' }}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold opacity-75 uppercase mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={shippingForm.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-black/10 border border-opacity-10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition"
                    style={{ borderColor: 'var(--tenant-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold opacity-75 uppercase mb-2">Phone Number</label>
                  <input 
                    type="text" 
                    value={shippingForm.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full bg-black/10 border border-opacity-10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition"
                    style={{ borderColor: 'var(--tenant-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold opacity-75 uppercase mb-2">Street Address</label>
                <input 
                  type="text" 
                  required
                  value={shippingForm.address}
                  onChange={e => updateField('address', e.target.value)}
                  placeholder="123 Main Street, Apt 4"
                  className="w-full bg-black/10 border border-opacity-10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition"
                  style={{ borderColor: 'var(--tenant-text)' }}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold opacity-75 uppercase mb-2">City</label>
                  <input 
                    type="text" 
                    value={shippingForm.city}
                    onChange={e => updateField('city', e.target.value)}
                    placeholder="New York"
                    className="w-full bg-black/10 border border-opacity-10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition"
                    style={{ borderColor: 'var(--tenant-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold opacity-75 uppercase mb-2">ZIP Code</label>
                  <input 
                    type="text" 
                    value={shippingForm.zip}
                    onChange={e => updateField('zip', e.target.value)}
                    placeholder="10001"
                    className="w-full bg-black/10 border border-opacity-10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition"
                    style={{ borderColor: 'var(--tenant-text)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selectors */}
          <div className="bg-black/[0.01] border border-opacity-5 rounded-3xl p-6 md:p-8 space-y-6" style={{ borderColor: 'var(--tenant-text)' }}>
            <h2 className="text-lg font-bold text-white" style={{ color: 'var(--tenant-text)' }}>Select Payment Channel</h2>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-4 rounded-xl border border-opacity-10 cursor-pointer bg-black/5" style={{ borderColor: 'var(--tenant-text)' }}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="cod" 
                  checked={shippingForm.paymentMethod === 'cod'} 
                  onChange={() => updateField('paymentMethod', 'cod')}
                  className="text-indigo-600 focus:ring-indigo-500" 
                />
                <div>
                  <span className="block text-sm font-semibold">Cash on Delivery (COD)</span>
                  <span className="block text-xs opacity-65">Pay with cash upon receipt.</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 rounded-xl border border-opacity-10 cursor-pointer bg-black/5" style={{ borderColor: 'var(--tenant-text)' }}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="stripe" 
                  checked={shippingForm.paymentMethod === 'stripe'} 
                  onChange={() => updateField('paymentMethod', 'stripe')}
                  className="text-indigo-600 focus:ring-indigo-500" 
                />
                <div className="flex justify-between items-center w-full">
                  <div>
                    <span className="block text-sm font-semibold">Credit/Debit Card (Stripe Sandbox)</span>
                    <span className="block text-xs opacity-65">Authorize secure charge instantly.</span>
                  </div>
                  <CreditCard className="w-5 h-5 opacity-50 shrink-0" />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing Panel */}
        <div className="bg-black/[0.02] border border-opacity-5 rounded-3xl p-6 space-y-6" style={{ borderColor: 'var(--tenant-text)' }}>
          <h2 className="font-bold text-lg border-b border-opacity-10 pb-4" style={{ borderColor: 'var(--tenant-text)' }}>Payment Summary</h2>
          
          <div className="space-y-3 text-sm opacity-85">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                {subtotal.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Taxes ({taxRate * 100}%)</span>
              <span>
                {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                {tax.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Shipping cost</span>
              <span className="text-indigo-400">
                {shippingFee === 0 ? 'FREE' : `${tenant.currency === 'USD' ? '$' : `${tenant.currency} `}${shippingFee.toFixed(2)}`}
              </span>
            </div>

            <div className="border-t border-opacity-10 pt-4 flex justify-between text-base font-extrabold" style={{ borderColor: 'var(--tenant-text)', color: 'var(--tenant-text)' }}>
              <span>Total due</span>
              <span>
                {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                {total.toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-4 rounded-xl text-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            style={{ backgroundColor: 'var(--tenant-primary)' }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Submit Secure Order</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
