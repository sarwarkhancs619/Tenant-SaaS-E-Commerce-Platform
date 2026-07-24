'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '../layout';
import { api } from '@/lib/api';
import { Check, ShoppingBag, Printer, ExternalLink } from 'lucide-react';

export default function StoreSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeSlug = params.tenantSlug as string;
  const orderId = searchParams.get('orderId');
  const { tenant } = useTenant();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/orders/${orderId}/invoice`);
        setInvoice(res.data);
      } catch (e) {
        console.error('Invoice retrieval failed. Might need admin auth headers context:', e);
        // Fallback: we can display order number from query string directly if invoice fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [orderId]);

  const orderNumberQuery = searchParams.get('orderNumber') || 'ORD-1002';

  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-8">
      {/* Circle Icon */}
      <div 
        className="mx-auto text-white p-5 rounded-full w-20 h-20 flex items-center justify-center shadow-lg shadow-emerald-500/10"
        style={{ backgroundColor: 'var(--tenant-primary)' }}
      >
        <Check className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Thank you for your order!</h1>
        <p className="text-sm opacity-70">
          Your order has been recorded successfully. Invoice Code: <span className="font-mono font-bold text-indigo-400">{orderNumberQuery}</span>
        </p>
      </div>

      {invoice && (
        <div className="bg-black/[0.01] border border-opacity-5 rounded-3xl p-6 text-left space-y-4 text-xs" style={{ borderColor: 'var(--tenant-text)' }}>
          <h3 className="font-bold text-sm border-b border-opacity-10 pb-3" style={{ borderColor: 'var(--tenant-text)' }}>Receipt Invoice</h3>
          
          <div className="space-y-2">
            {invoice.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span className="opacity-75">{item.name} (x{item.quantity})</span>
                <span className="font-semibold">
                  {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                  {item.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-opacity-10 pt-3 space-y-2" style={{ borderColor: 'var(--tenant-text)' }}>
            <div className="flex justify-between">
              <span className="opacity-60">Subtotal</span>
              <span>
                {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                {invoice.subtotal.toFixed(2)}
              </span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between">
                <span className="opacity-60">Tax</span>
                <span>
                  {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                  {invoice.tax.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="opacity-60">Shipping</span>
              <span>
                {invoice.shippingFee === 0 ? 'FREE' : `${tenant.currency === 'USD' ? '$' : `${tenant.currency} `}${invoice.shippingFee.toFixed(2)}`}
              </span>
            </div>
            
            <div className="flex justify-between text-sm font-bold border-t border-opacity-10 pt-2" style={{ borderColor: 'var(--tenant-text)', color: 'var(--tenant-text)' }}>
              <span>Grand Total</span>
              <span>
                {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                {invoice.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
        <button 
          onClick={() => router.push(`/store/${storeSlug}`)}
          className="w-full text-white font-bold py-3 px-6 rounded-xl text-xs transition"
          style={{ backgroundColor: 'var(--tenant-primary)' }}
        >
          Continue Shopping
        </button>
        <button 
          onClick={() => window.print()}
          className="w-full bg-black/10 border border-opacity-10 py-3 px-6 rounded-xl text-xs font-semibold hover:bg-black/20 transition flex items-center justify-center space-x-2"
          style={{ borderColor: 'var(--tenant-text)' }}
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>
    </div>
  );
}
