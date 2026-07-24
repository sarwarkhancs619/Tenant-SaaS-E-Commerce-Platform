'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '../layout';
import { Trash2, ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';

export default function ShoppingCartPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.tenantSlug as string;
  const { tenant, cart, addToCart, removeFromCart } = useTenant();

  const handleQtyChange = (product: any, delta: number) => {
    if (delta < 0) {
      // Deduct quantity. If it reaches 0, remove it.
      const currentItem = cart.find(item => item.product.id === product.id);
      if (currentItem && currentItem.quantity === 1) {
        removeFromCart(product.id);
        return;
      }
    }
    addToCart(product, delta);
  };

  const subtotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  const taxRate = tenant?.taxRate || 0.0;
  const tax = subtotal * taxRate;
  const shippingFee = subtotal === 0 ? 0.0 : (subtotal > 50 ? 0.0 : 10.0);
  const total = subtotal + tax + shippingFee;

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-6">
        <div className="mx-auto bg-slate-100/10 border border-opacity-5 p-5 rounded-full w-20 h-20 flex items-center justify-center opacity-75" style={{ borderColor: 'var(--tenant-text)' }}>
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight">Your shopping cart is empty</h2>
          <p className="text-xs opacity-60">Add items from the store catalog to continue.</p>
        </div>
        <button 
          onClick={() => router.push(`/store/${storeSlug}`)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition"
          style={{ backgroundColor: 'var(--tenant-primary)' }}
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-10 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const firstImage = item.product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
            return (
              <div 
                key={item.product.id}
                className="flex items-center space-x-4 p-4 border border-opacity-5 rounded-2xl bg-black/[0.01]"
                style={{ borderColor: 'var(--tenant-text)' }}
              >
                {/* Product Image */}
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                  <img src={firstImage} alt={item.product.name} className="object-cover w-full h-full" />
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-sm truncate">{item.product.name}</h3>
                  <span className="block text-xs font-semibold mt-1 opacity-70">
                    {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                    {item.product.price.toFixed(2)} each
                  </span>
                </div>

                {/* Quantity Toggles */}
                <div className="flex items-center border rounded-lg overflow-hidden shrink-0" style={{ borderColor: 'var(--tenant-text)' }}>
                  <button 
                    onClick={() => handleQtyChange(item.product, -1)}
                    className="p-2 hover:bg-slate-100/10 transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-3 text-xs font-bold">{item.quantity}</span>
                  <button 
                    onClick={() => handleQtyChange(item.product, 1)}
                    className="p-2 hover:bg-slate-100/10 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove Button */}
                <button 
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Pricing Summary Panel */}
        <div className="bg-black/[0.02] border border-opacity-5 rounded-3xl p-6 space-y-6" style={{ borderColor: 'var(--tenant-text)' }}>
          <h2 className="font-bold text-lg border-b border-opacity-10 pb-4" style={{ borderColor: 'var(--tenant-text)' }}>Order Summary</h2>
          
          <div className="space-y-3 text-sm opacity-85">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">
                {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                {subtotal.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Estimated Tax ({taxRate * 100}%)</span>
              <span className="font-semibold">
                {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                {tax.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Shipping Delivery</span>
              <span className="font-semibold text-indigo-400">
                {shippingFee === 0 ? 'FREE' : `${tenant.currency === 'USD' ? '$' : `${tenant.currency} `}${shippingFee.toFixed(2)}`}
              </span>
            </div>

            <div className="border-t border-opacity-10 pt-4 flex justify-between text-base font-extrabold text-white" style={{ borderColor: 'var(--tenant-text)', color: 'var(--tenant-text)' }}>
              <span>Grand Total</span>
              <span>
                {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                {total.toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            onClick={() => router.push(`/store/${storeSlug}/checkout`)}
            className="w-full text-white font-bold py-4 rounded-xl text-sm transition flex items-center justify-center space-x-2 hover:scale-[1.01]"
            style={{ backgroundColor: 'var(--tenant-primary)' }}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
