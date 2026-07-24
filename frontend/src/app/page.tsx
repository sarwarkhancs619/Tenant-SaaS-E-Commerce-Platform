'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Shield, Cpu, RefreshCw, Zap, Layers, Globe } from 'lucide-react';

export default function PlatformLandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              OmniSaaS
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#categories" className="hover:text-white transition">Industries</a>
            <a href="#architecture" className="hover:text-white transition">Architecture</a>
          </nav>
          <Link 
            href="/wizard" 
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
          >
            <span>Launch Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-4.5 py-1.5 text-xs text-indigo-400 font-semibold mb-8 backdrop-blur">
            <Zap className="w-3.5 h-3.5 fill-indigo-400/20" />
            <span>Next-Gen Multi-Tenant Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Create a Complete Online Store in{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              10 Minutes
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            One single codebase powering thousands of high-converting storefronts. Auto-bootstrapped catalogs, customizable layouts, localized payments, and built-in AI generators.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/wizard" 
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl text-base font-bold shadow-xl shadow-indigo-600/25 transition flex items-center justify-center space-x-3"
            >
              <span>Build Your Store</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-8 py-4 rounded-xl text-base font-semibold transition text-center"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-t border-slate-800 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Enterprise SaaS Abstractions</h2>
            <p className="text-slate-400">Everything needed to host, scale, and customize independent store builders out of a single engine.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-2xl">
              <div className="bg-indigo-500/10 p-3 rounded-xl w-12 h-12 flex items-center justify-center text-indigo-400 mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Isolated Tenant Schema</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Database structures separated by dynamic discriminator contexts. Complete privacy for products, sales lists, settings, and audits.
              </p>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-2xl">
              <div className="bg-emerald-500/10 p-3 rounded-xl w-12 h-12 flex items-center justify-center text-emerald-400 mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Dynamic Routing Middleware</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Seamless URL rewrites mapping hostnames, custom subdomains, or local pathways to isolate specific storefronts.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-2xl">
              <div className="bg-purple-500/10 p-3 rounded-xl w-12 h-12 flex items-center justify-center text-purple-400 mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Built-in Content AI</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Instantly write product specifications, meta attributes, tags, and translate catalog languages via integrated language models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section id="categories" className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Choose Your Business Layout</h2>
            <p className="text-slate-400">The platform automatically loads custom styles, navigation menus, and default categories tailored to your industry.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Bakery', desc: 'Warm theme, cakes & pastry defaults', icon: '🍞' },
              { name: 'Clothing', desc: 'Minimal layout, custom sizes & variants', icon: '🧥' },
              { name: 'Restaurant', desc: 'Food lists, hot red colors, menu sections', icon: '🍔' },
              { name: 'Grocery', desc: 'Fresh green accents, warehouse tracking', icon: '🥦' }
            ].map((cat, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl hover:border-indigo-500/40 transition group">
                <span className="text-4xl mb-4 block group-hover:scale-110 transition duration-300">{cat.icon}</span>
                <h3 className="text-lg font-bold mb-1">{cat.name}</h3>
                <p className="text-slate-500 text-xs">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 text-center text-sm text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 OmniSaaS E-Commerce Platform Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
