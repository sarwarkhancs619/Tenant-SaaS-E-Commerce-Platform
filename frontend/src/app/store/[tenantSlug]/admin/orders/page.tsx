'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Truck, CheckCircle, Package, DollarSign, Printer, X } from 'lucide-react';

export default function AdminOrdersPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const [orders, setOrders] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected Order for Invoice view
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/orders');
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch orders database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchOrders();
  }, [slug]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      let trackingNumber = undefined;
      if (status === 'SHIPPED') {
        const trk = prompt('Enter shipping carrier tracking code (optional):');
        if (trk !== null) trackingNumber = trk;
      }

      await api.patch(`/admin/orders/${orderId}`, {
        status,
        ...(trackingNumber !== undefined && { trackingNumber })
      });
      fetchOrders();
    } catch (e) {
      console.error(e);
      alert('Failed to modify order state.');
    }
  };

  const handleUpdatePayment = async (orderId: string, paymentStatus: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { paymentStatus });
      fetchOrders();
    } catch (e) {
      console.error(e);
      alert('Failed to modify payment state.');
    }
  };

  const handleViewInvoice = async (orderId: string) => {
    setInvoiceLoading(true);
    try {
      const res = await api.get(`/admin/orders/${orderId}/invoice`);
      setSelectedInvoice(res.data);
    } catch (e) {
      console.error(e);
      alert('Failed to construct invoice document.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-900 rounded-xl w-1/4" />
        <div className="h-64 bg-slate-900 border border-slate-850 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Customer Orders</h2>
        <p className="text-xs text-slate-400 mt-1">Manage order statuses, input shipping numbers, and review printable invoice details.</p>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Delivery State</th>
                <th className="px-6 py-4">Total Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-900/30 transition text-slate-300">
                  <td className="px-6 py-4 font-mono font-bold text-white text-sm">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <span className="block text-slate-200 font-semibold">{order.customer?.name}</span>
                    <span className="block text-[10px] text-slate-500">{order.customer?.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        order.paymentStatus === 'PAID' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                      }`}>
                        {order.paymentStatus}
                      </span>
                      {order.paymentStatus !== 'PAID' && (
                        <button 
                          onClick={() => handleUpdatePayment(order.id, 'PAID')}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      order.status === 'DELIVERED' ? 'text-emerald-400 bg-emerald-500/10' :
                      order.status === 'SHIPPED' ? 'text-blue-400 bg-blue-500/10' : 'text-amber-400 bg-amber-500/10'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-sm">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right space-x-3 shrink-0">
                    <button
                      onClick={() => handleViewInvoice(order.id)}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1.5 rounded-lg font-bold"
                    >
                      Invoice
                    </button>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                        className="bg-indigo-650 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold"
                      >
                        Confirm
                      </button>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                        className="bg-blue-650 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold"
                      >
                        Ship
                      </button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                        className="bg-emerald-650 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold"
                      >
                        Deliver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal Overlay */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-slate-900">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {/* Printable Area */}
            <div id="invoice-printable" className="space-y-6 text-xs text-slate-600">
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">{selectedInvoice.storeName}</h2>
                  <p className="opacity-80 mt-1">{selectedInvoice.storeAddress}</p>
                  <p className="opacity-80">Support: {selectedInvoice.storeEmail}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-slate-900">INVOICE DOCUMENT</h3>
                  <span className="font-mono block text-indigo-600 font-bold mt-1">{selectedInvoice.invoiceNumber}</span>
                  <span className="opacity-85 text-[10px] block mt-1">Date: {new Date(selectedInvoice.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block font-bold text-slate-900 uppercase tracking-wide mb-1">Bill To</span>
                  <span className="block font-semibold text-slate-800">{selectedInvoice.customerName}</span>
                  <span className="block opacity-85">{selectedInvoice.customerEmail}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-900 uppercase tracking-wide mb-1">Shipment Target</span>
                  <span className="block opacity-85">{selectedInvoice.shippingAddress.address}</span>
                  <span className="block opacity-85">{selectedInvoice.shippingAddress.city}, {selectedInvoice.shippingAddress.zip}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse mt-4">
                <thead>
                  <tr className="border-b-2 border-slate-300 font-bold text-slate-900">
                    <th className="py-2">Item Description</th>
                    <th className="py-2">Quantity</th>
                    <th className="py-2">Unit Price</th>
                    <th className="py-2 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedInvoice.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="text-slate-800">
                      <td className="py-3 font-semibold">{item.name}</td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-right font-bold">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Price Calculations */}
              <div className="border-t pt-4 flex flex-col items-end space-y-2 text-slate-700">
                <div className="flex justify-between w-64">
                  <span className="opacity-75">Subtotal:</span>
                  <span className="font-semibold">${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.tax > 0 && (
                  <div className="flex justify-between w-64">
                    <span className="opacity-75">Tax:</span>
                    <span className="font-semibold">${selectedInvoice.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64">
                  <span className="opacity-75">Shipping cost:</span>
                  <span className="font-semibold">{selectedInvoice.shippingFee === 0 ? 'FREE' : `$${selectedInvoice.shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between w-64 text-sm font-extrabold text-slate-900 border-t pt-2">
                  <span>Grand Total:</span>
                  <span>${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Print trigger */}
            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <button
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
