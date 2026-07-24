'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminDashboardOverview() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/reports');
        setReports(res.data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load dashboard metrics. Check token or database status.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-slate-900 border border-slate-850 rounded-2xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-64 md:col-span-2 bg-slate-900 border border-slate-850 rounded-2xl" />
          <div className="h-64 bg-slate-900 border border-slate-850 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !reports) {
    return (
      <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-6 text-red-200 flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
        <span>{error || 'Internal analytics database communication error.'}</span>
      </div>
    );
  }

  const { summary, salesOverTime, bestSellers } = reports;

  const stats = [
    { label: 'Gross Revenue', value: `$${summary.grossRevenue.toFixed(2)}`, desc: 'Completed payment sums', icon: DollarSign, color: 'text-indigo-400 bg-indigo-500/10' },
    { label: 'Total Orders', value: summary.totalOrders, desc: 'All checkout submissions', icon: ShoppingCart, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Active Catalog', value: summary.activeProducts, desc: 'Products live in store', icon: Package, color: 'text-amber-400 bg-amber-500/10' },
    { label: 'Registered Customers', value: summary.customersCount, desc: 'Unique buyer profiles', icon: Users, color: 'text-purple-400 bg-purple-500/10' }
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h2>
        <p className="text-xs text-slate-400 mt-1">Real-time indicators of your store's operations and sales pipelines.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                <span className="block text-2xl font-extrabold text-white">{stat.value}</span>
                <span className="block text-[10px] text-slate-500">{stat.desc}</span>
              </div>
              <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Chart (Simulated) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-850 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white uppercase">Sales & Orders Trends</h3>
            <span className="text-[10px] text-slate-500">Distribution over the past 7 business days</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-4">
            {salesOverTime.map((day: any, idx: number) => {
              // Calculate a percentage height for visual representation
              const maxVal = Math.max(...salesOverTime.map((d: any) => d.sales)) || 1;
              const pct = (day.sales / maxVal) * 100;
              return (
                <div key={idx} className="flex flex-col items-center flex-grow group">
                  <div className="w-full relative flex flex-col justify-end h-36">
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-950 text-white font-mono text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap mb-1">
                      ${day.sales} ({day.orders} ord)
                    </span>
                    <div 
                      className="bg-indigo-600 rounded-t-md w-2/3 mx-auto group-hover:bg-indigo-500 transition-all duration-300"
                      style={{ height: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-2">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide text-white uppercase">Popular Products</h3>
            <span className="text-[10px] text-slate-500">Ranked by gross sales volume</span>
          </div>

          <div className="space-y-4 my-4 flex-grow">
            {bestSellers.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="font-mono font-bold text-indigo-400 w-4 shrink-0">{idx+1}.</span>
                  <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-bold text-white">${item.revenue.toFixed(2)}</span>
                  <span className="block text-[10px] text-slate-500">{item.sales} units sold</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-xl flex items-center space-x-3 text-indigo-300 text-xs">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Store traffic has risen by 15% today.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
