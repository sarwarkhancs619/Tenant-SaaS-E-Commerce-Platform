'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useTenant } from '../../layout';
import { ChevronLeft, ShoppingCart, Plus, Minus, Star, Heart, Shield, RefreshCw } from 'lucide-react';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.tenantSlug as string;
  const productSlug = params.slug as string;
  const { tenant, cart, addToCart, customer } = useTenant();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  
  // Feedback flags
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<Array<any>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Fetch reviews
  useEffect(() => {
    if (product) {
      const fetchReviews = async () => {
        try {
          setReviewsLoading(true);
          const res = await api.get(`/store/products/${product.id}/reviews`);
          setReviews(res.data);
        } catch (e) {
          console.error(e);
        } finally {
          setReviewsLoading(false);
        }
      };
      fetchReviews();
    }
  }, [product]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment) {
      setReviewError('Please type a comment.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');

    try {
      const res = await api.post(`/store/products/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });

      // Append new review to list
      setReviews(prev => [res.data, ...prev]);
      // Reset form
      setReviewComment('');
      setReviewRating(5);
      alert('Review posted successfully!');
    } catch (err: any) {
      console.error(err);
      setReviewError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!productSlug) return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/store/products/${productSlug}`);
        setProduct(res.data);
        if (res.data.images && res.data.images.length > 0) {
          setActiveImage(res.data.images[0]);
        }
      } catch (e) {
        console.error('Failed to fetch product specifications:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productSlug]);

  const incrementQty = () => setQty(q => q + 1);
  const decrementQty = () => setQty(q => Math.max(1, q - 1));

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-slate-800 rounded-3xl" />
        <div className="space-y-6 py-4">
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-8 bg-slate-800 rounded w-3/4" />
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-20 bg-slate-800 rounded" />
          <div className="h-12 bg-slate-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Product Specifications Offline</h2>
        <p className="text-sm opacity-70">This product is no longer available in our store catalog.</p>
        <button 
          onClick={() => router.push(`/store/${storeSlug}`)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  // Stock tracking check
  const availableStock = product.inventory?.[0]?.quantity ?? 0;
  const isOutOfStock = availableStock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Back link */}
      <button 
        onClick={() => router.push(`/store/${storeSlug}`)}
        className="flex items-center space-x-1.5 text-xs font-bold mb-8 opacity-75 hover:opacity-100 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Store Catalog</span>
      </button>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* Left Side: Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-black/[0.02] border border-opacity-5 rounded-3xl overflow-hidden" style={{ borderColor: 'var(--tenant-text)' }}>
            <img 
              src={activeImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'} 
              alt={product.name} 
              className="object-cover w-full h-full"
            />
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                    activeImage === img ? 'border-indigo-500' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="space-y-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider opacity-60">
              {product.category?.name || 'General'}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline space-x-4 border-b border-opacity-10 pb-6" style={{ borderColor: 'var(--tenant-text)' }}>
            <span className="text-2xl font-extrabold">
              {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
              {product.price.toFixed(2)}
            </span>
            {product.comparePrice && (
              <span className="text-sm line-through opacity-50">
                {tenant.currency === 'USD' ? '$' : `${tenant.currency} `}
                {product.comparePrice.toFixed(2)}
              </span>
            )}
            
            <div className="ml-auto text-xs opacity-75">
              {isOutOfStock ? (
                <span className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-full">Out of Stock</span>
              ) : (
                <span className="text-emerald-600 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">
                  {availableStock} items in stock
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 text-sm opacity-90 leading-relaxed">
            <h3 className="font-bold text-base">Product Description</h3>
            <p>{product.description || 'No description provided.'}</p>
          </div>

          {/* Quantity and Actions */}
          {!isOutOfStock && (
            <div className="pt-4 space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-xs font-bold opacity-75 uppercase">Quantity</span>
                <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: 'var(--tenant-text)' }}>
                  <button 
                    onClick={decrementQty}
                    className="p-3.5 hover:bg-slate-100/10 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-5 font-bold text-sm">{qty}</span>
                  <button 
                    onClick={incrementQty}
                    className="p-3.5 hover:bg-slate-100/10 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-grow flex items-center justify-center space-x-2 text-white font-bold py-4 px-6 rounded-2xl text-sm shadow-lg hover:scale-[1.01] transition duration-200"
                  style={{ backgroundColor: 'var(--tenant-primary)' }}
                >
                  <ShoppingCart className="w-4.5 h-4.5" />
                  <span>{added ? 'Added to Cart!' : 'Add to Shopping Cart'}</span>
                </button>
                <button className="p-4 border rounded-2xl hover:bg-slate-100/10 transition" style={{ borderColor: 'var(--tenant-text)' }}>
                  <Heart className="w-5 h-5 fill-transparent" />
                </button>
              </div>
            </div>
          )}

          {/* Badges / Guarantees */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-opacity-10 text-xs opacity-75" style={{ borderColor: 'var(--tenant-text)' }}>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>Safe payment gateway</span>
            </div>
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-indigo-500" />
              <span>Easy 14-day returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Reviews Section */}
      <div className="mt-16 border-t border-opacity-10 pt-12 space-y-8" style={{ borderColor: 'var(--tenant-text)' }}>
        <h2 className="text-2xl font-bold tracking-tight">Customer Feedback Reviews</h2>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* Write a review form */}
          <div 
            className="md:col-span-1 bg-black/[0.01] border border-opacity-10 rounded-3xl p-6 space-y-4"
            style={{ borderColor: 'var(--tenant-text)' }}
          >
            <h3 className="font-bold text-sm">Write a Product Review</h3>
            
            {customer ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {reviewError && (
                  <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-3 rounded-xl text-xs font-semibold">
                    {reviewError}
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Star Rating</label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-amber-500 focus:outline-none"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-500' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Your Comment</label>
                  <textarea
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us what you think of this product..."
                    rows={3}
                    className="w-full bg-black/5 border border-opacity-10 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    style={{ borderColor: 'var(--tenant-text)' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full text-white py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                  style={{ backgroundColor: 'var(--tenant-primary)' }}
                >
                  {submittingReview ? 'Posting Review...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-xs opacity-70">Please sign in to share your experience with this product.</p>
                <button
                  onClick={() => router.push(`/store/${storeSlug}/login`)}
                  className="w-full bg-black/5 hover:bg-black/10 border border-opacity-10 py-2.5 rounded-xl text-xs font-bold transition"
                  style={{ borderColor: 'var(--tenant-text)' }}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* List of reviews */}
          <div className="md:col-span-2 space-y-4">
            {reviewsLoading ? (
              <div className="flex items-center space-x-2 py-6 text-xs font-semibold opacity-70">
                <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span>Loading product reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-black/[0.01] border border-opacity-5 rounded-3xl p-8 text-center opacity-70" style={{ borderColor: 'var(--tenant-text)' }}>
                <span className="text-xs font-semibold">No reviews posted yet. Be the first to review this product!</span>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div 
                    key={r.id}
                    className="bg-black/[0.01] border border-opacity-5 rounded-3xl p-5 space-y-2"
                    style={{ borderColor: 'var(--tenant-text)' }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs">{r.customer?.name}</span>
                        <span className="opacity-60 text-[10px]">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star 
                            key={idx}
                            className={`w-3 h-3 ${idx < r.rating ? 'fill-amber-500' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed font-medium">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
