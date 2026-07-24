'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ChevronUp, ChevronDown, Check, Save, Sparkles, Layers } from 'lucide-react';

export default function AdminPageBuilder() {
  const params = useParams();
  const slug = params.tenantSlug as string;

  const [pageId, setPageId] = useState('');
  const [sections, setSections] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchPageConfig = async () => {
      try {
        setLoading(true);
        const res = await api.get('/store/pages/index');
        setPageId(res.data.id);
        setSections(res.data.sections || []);
      } catch (e) {
        console.error('Failed to load page config:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPageConfig();
  }, [slug]);

  // Handle re-ordering
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const nextIdx = direction === 'up' ? index - 1 : index + 1;
    if (nextIdx < 0 || nextIdx >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[nextIdx];
    updated[nextIdx] = temp;
    setSections(updated);
  };

  // Handle updates to fields within settings
  const handleSettingChange = (secId: string, key: string, value: string) => {
    setSections(prev => 
      prev.map(sec => 
        sec.id === secId 
          ? { ...sec, settings: { ...sec.settings, [key]: value } }
          : sec
      )
    );
  };

  const handleSaveLayout = async () => {
    if (!pageId) return;
    
    setSaving(true);
    setSuccess(false);

    try {
      await api.patch(`/admin/builder/pages/${pageId}`, {
        sections
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to save layout configuration.');
    } finally {
      setSaving(false);
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
      {/* Toast Save Alert */}
      {success && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center space-x-2 animate-bounce">
          <div className="bg-emerald-500 p-1 rounded-full text-white">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">Homepage custom settings saved!</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Homepage Layout Builder</h2>
          <p className="text-xs text-slate-400 mt-1">Reorder dynamic components and customize settings without modifying template source code.</p>
        </div>

        <button
          onClick={handleSaveLayout}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition flex items-center space-x-2"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{saving ? 'Saving...' : 'Save Page Layout'}</span>
        </button>
      </div>

      {/* Reorder list and settings editors */}
      <div className="space-y-6">
        {sections.map((sec, idx) => {
          const settings = sec.settings || {};
          
          return (
            <div 
              key={sec.id}
              className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6"
            >
              {/* Left Side: Ordering arrows & Component Tag */}
              <div className="flex items-center space-x-4 shrink-0">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Component type</span>
                  <div className="flex items-center space-x-2 text-white font-bold text-sm">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>{sec.type}</span>
                  </div>
                </div>
              </div>

              {/* Center: Dynamic inputs editor */}
              <div className="flex-grow grid md:grid-cols-2 gap-4">
                
                {/* Hero Inputs */}
                {sec.type === 'HeroBanner' && (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Banner Title</label>
                      <input 
                        type="text" 
                        value={settings.title || ''}
                        onChange={e => handleSettingChange(sec.id, 'title', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Banner Subtitle</label>
                      <input 
                        type="text" 
                        value={settings.subtitle || ''}
                        onChange={e => handleSettingChange(sec.id, 'subtitle', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </>
                )}

                {/* Categories Grid Inputs */}
                {sec.type === 'CategoriesGrid' && (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Grid Heading</label>
                      <input 
                        type="text" 
                        value={settings.title || ''}
                        onChange={e => handleSettingChange(sec.id, 'title', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Display Limit</label>
                      <input 
                        type="number" 
                        value={settings.limit || 6}
                        onChange={e => handleSettingChange(sec.id, 'limit', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                  </>
                )}

                {/* Featured Products Inputs */}
                {sec.type === 'FeaturedProducts' && (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Grid Heading</label>
                      <input 
                        type="text" 
                        value={settings.title || ''}
                        onChange={e => handleSettingChange(sec.id, 'title', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Layout Mode</label>
                      <select 
                        value={settings.layout || 'grid'}
                        onChange={e => handleSettingChange(sec.id, 'layout', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="grid">Product Grid Layout</option>
                        <option value="carousel">Product Carousel Layout</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Contact Section Inputs */}
                {sec.type === 'ContactSection' && (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Contact Heading</label>
                      <input 
                        type="text" 
                        value={settings.title || ''}
                        onChange={e => handleSettingChange(sec.id, 'title', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Options</label>
                      <div className="flex space-x-3 pt-2 text-[10px] font-semibold text-slate-400">
                        <span>Show WhatsApp Contact</span>
                        <span className="text-indigo-400">Enabled</span>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
