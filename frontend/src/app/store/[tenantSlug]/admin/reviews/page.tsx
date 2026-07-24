'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Star, Trash2, Loader2, AlertCircle, MessageSquare } from 'lucide-react';

export default function AdminReviewsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const [reviews, setReviews] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      // api automatically injects Authorization token and x-tenant-slug
      const res = await api.get('/admin/reviews');
      setReviews(res.data);
    } catch (e: any) {
      console.error(e);
      setError('Failed to fetch reviews logs. Check authentication.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchReviews();
  }, [slug]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) {
      return;
    }

    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      alert('Review deleted successfully.');
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || 'Failed to delete review.');
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

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl flex items-center space-x-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Synchronization Failure</h4>
          <p className="text-xs opacity-75 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Reviews Moderation</h2>
        <p className="text-xs text-slate-400 mt-1">Read customer comments, monitor product ratings, and delete flagged feedback reviews.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-855 rounded-3xl p-12 text-center space-y-4">
          <div className="mx-auto bg-slate-800/40 p-4 rounded-full w-14 h-14 flex items-center justify-center text-slate-500">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-bold text-sm">No reviews found</h3>
            <p className="text-slate-400 text-xs">Customer feedback rating logs will show up here.</p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-855 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {reviews.map(r => (
                  <tr key={r.id} className="hover:bg-slate-900/30 transition text-slate-300">
                    <td className="px-6 py-4">
                      <span className="font-bold text-white text-sm block">{r.product?.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">slug: {r.product?.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-200 block">{r.customer?.name}</span>
                      <span className="text-[10px] text-slate-500">{r.customer?.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star 
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < r.rating ? 'fill-amber-500' : 'text-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-200" title={r.comment}>
                      {r.comment}
                    </td>
                    <td className="px-6 py-4 opacity-75">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        className="text-red-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
