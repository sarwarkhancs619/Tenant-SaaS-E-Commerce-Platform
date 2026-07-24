'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Sparkles, Loader2, Edit2, Check, AlertCircle, Trash2 } from 'lucide-react';

export default function AdminProductsPage() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const [products, setProducts] = useState<Array<any>>([]);
  const [categories, setCategories] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form Drawer Toggle
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Form Fields
  const [newProd, setNewProd] = useState({
    name: '',
    price: '',
    categoryId: '',
    initialStock: '50',
    description: '',
    images: [] as string[],
    sku: '',
    status: 'ACTIVE',
    seoTitle: '',
    seoDesc: '',
    keywords: '' // For AI prompt
  });

  const addImageUrl = () => {
    if (!newImageUrl) return;
    setNewProd(prev => ({
      ...prev,
      images: [...prev.images, newImageUrl]
    }));
    setNewImageUrl('');
  };

  const removeImageUrl = (index: number) => {
    setNewProd(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      const prodRes = await api.get('/admin/products');
      setProducts(prodRes.data || []);
      const catRes = await api.get('/admin/categories');
      setCategories(catRes.data || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load store catalog files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchCatalogData();
  }, [slug]);

  const startEditingProduct = (p: any) => {
    setEditingProductId(p.id);
    setNewProd({
      name: p.name,
      price: p.price.toString(),
      categoryId: p.categoryId || '',
      initialStock: (p.inventory?.[0]?.quantity ?? 0).toString(),
      images: p.images || [],
      description: p.description || '',
      sku: p.sku || '',
      status: p.status,
      seoTitle: p.seoTitle || '',
      seoDesc: p.seoDesc || '',
      keywords: ''
    });
    setNewImageUrl('');
    setShowAddForm(true);
  };

  const resetForm = () => {
    setNewProd({
      name: '',
      price: '',
      categoryId: '',
      initialStock: '50',
      description: '',
      images: [],
      sku: '',
      status: 'ACTIVE',
      seoTitle: '',
      seoDesc: '',
      keywords: ''
    });
    setNewImageUrl('');
    setEditingProductId(null);
    setShowAddForm(false);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) {
      alert('Please fill in product name and price.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingProductId) {
        // Edit mode
        await api.patch(`/admin/products/${editingProductId}`, {
          ...newProd,
          price: parseFloat(newProd.price),
          initialStock: parseInt(newProd.initialStock)
        });
        alert('Product updated successfully.');
      } else {
        // Create mode
        await api.post('/admin/products', {
          ...newProd,
          price: parseFloat(newProd.price),
          initialStock: parseInt(newProd.initialStock)
        });
        alert('Product created successfully.');
      }

      resetForm();
      fetchCatalogData();
    } catch (err) {
      console.error(err);
      alert('Failed to save product details.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action is irreversible.')) {
      return;
    }

    try {
      const res = await api.delete(`/admin/products/${productId}`);
      const data = res.data;

      if (data.archived) {
        alert(data.message);
        fetchCatalogData();
      } else {
        alert('Product deleted successfully.');
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || 'Failed to delete product.');
    }
  };

  const handleAiGenerate = async () => {
    if (!newProd.name) {
      alert('Please enter a product name first before generating descriptions.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await api.post('/admin/ai/description', {
        name: newProd.name,
        category: slug,
        keywords: newProd.keywords
      });

      setNewProd(prev => ({
        ...prev,
        description: res.data.description,
        seoTitle: res.data.seoTitle,
        seoDesc: res.data.seoDesc
      }));
    } catch (e) {
      console.error(e);
      alert('AI generator model is offline.');
    } finally {
      setAiLoading(false);
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
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Catalog & Inventory</h2>
          <p className="text-xs text-slate-400 mt-1">Manage active product listings, warehouse units, and execute description generations.</p>
        </div>
        
        <button
          onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Drawer' : 'Create Product'}</span>
        </button>
      </div>

      {/* Product Onboarding Drawer */}
      {showAddForm && (
        <form onSubmit={handleSubmitForm} className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 md:p-8 space-y-6">
          <h3 className="font-bold text-base text-white">{editingProductId ? 'Edit Product Specifications' : 'New Product Specifications'}</h3>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Product Title</label>
              <input 
                type="text" 
                required
                value={newProd.name}
                onChange={e => setNewProd(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Sourdough Cranberry Bagel"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Unit Pricing</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={newProd.price}
                onChange={e => setNewProd(prev => ({ ...prev, price: e.target.value }))}
                placeholder="10.50"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Product Category</label>
              <select 
                value={newProd.categoryId}
                onChange={e => setNewProd(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Uncategorized</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Warehouse Initial Stock</label>
              <input 
                type="number" 
                value={newProd.initialStock}
                onChange={e => setNewProd(prev => ({ ...prev, initialStock: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* AI Generator Panel */}
          <div className="border border-indigo-950 bg-indigo-950/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Copywriting Assistant</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={newProd.keywords}
                onChange={e => setNewProd(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="Enter keywords (e.g. organic, vegan, sugar-free)"
                className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Copy & SEO</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Product Description</label>
            <textarea 
              value={newProd.description}
              onChange={e => setNewProd(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Provide a detailed description of the product copy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Product Images Gallery</label>
            <div className="flex gap-3 mb-4">
              <input 
                type="text" 
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                placeholder="Paste product image URL (e.g. Unsplash, CDN)"
                className="flex-grow bg-slate-950 border border-slate-805 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl text-xs transition"
              >
                Add Image
              </button>
            </div>
            
            {/* Gallery Previews Grid */}
            {newProd.images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 border border-slate-850 p-4 rounded-2xl bg-slate-950/20">
                {newProd.images.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-850">
                    <img src={url} alt="" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => removeImageUrl(idx)}
                      className="absolute inset-0 bg-red-650/90 text-white font-bold flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition duration-150"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">SEO Header Meta Title</label>
              <input 
                type="text" 
                value={newProd.seoTitle}
                onChange={e => setNewProd(prev => ({ ...prev, seoTitle: e.target.value }))}
                placeholder="Product SEO Title"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">SEO Meta Description</label>
              <input 
                type="text" 
                value={newProd.seoDesc}
                onChange={e => setNewProd(prev => ({ ...prev, seoDesc: e.target.value }))}
                placeholder="Product SEO Meta Description"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl text-xs transition"
          >
            {formLoading ? 'Submitting details...' : (editingProductId ? 'Save Product Changes' : 'Insert Product into Database')}
          </button>
        </form>
      )}

      {/* Catalog Listings Table */}
      <div className="bg-slate-900/40 border border-slate-855 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">SKU / Code</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Warehouse Stock</th>
                <th className="px-6 py-4">State</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {products.map(p => {
                const stock = p.inventory?.[0]?.quantity ?? 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-900/30 transition text-slate-300">
                    <td className="px-6 py-4 flex items-center space-x-3">
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-800" />
                      )}
                      <span className="font-bold text-white text-sm">{p.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                        {p.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{p.sku || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-white">${p.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {stock <= 5 ? (
                        <span className="text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded">
                          {stock} (Low Stock)
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                          {stock} Units
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold flex items-center space-x-1.5 uppercase ${
                        p.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => startEditingProduct(p)}
                        className="text-indigo-400 hover:text-indigo-300 p-2 rounded-xl hover:bg-indigo-500/10 transition inline-flex items-center"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-red-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition inline-flex items-center"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
