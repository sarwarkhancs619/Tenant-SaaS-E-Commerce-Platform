import { Request, Response } from 'express';
import { prisma } from '../config/db';

// ==========================================
// AI UTILITIES
// ==========================================

export const generateDescription = async (req: Request, res: Response) => {
  const { name, category, keywords } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Product name is required for AI generation' });
  }

  // High-quality pre-written prompts / simulated AI descriptions based on category
  const keywordList = keywords ? keywords.split(',').map((k: string) => k.trim()) : [];
  const bulletPoints = keywordList.length > 0 
    ? `Featuring premium features like ${keywordList.slice(0, 3).join(', ')}.` 
    : 'Designed with maximum functionality and durability in mind.';

  let descriptionText = `Introducing the all-new ${name}. Carefully crafted for customers seeking the ultimate experience in our ${category || 'general'} category. ${bulletPoints} Perfect for daily use or as a special gift.`;

  if (category?.toLowerCase() === 'bakery') {
    descriptionText = `Indulge in our freshly baked ${name}! Made from premium, organic ingredients and crafted using traditional recipes. Crisp, delicious, and guaranteed to satisfy your sweet tooth. ${bulletPoints}`;
  } else if (category?.toLowerCase() === 'clothing') {
    descriptionText = `Upgrade your wardrobe with this stylish ${name}. Crafted from premium breathable fabric that offers comfort and durability. Features a contemporary tailored fit suitable for all occasions. ${bulletPoints}`;
  } else if (category?.toLowerCase() === 'restaurant') {
    descriptionText = `Savor the exquisite flavors of our ${name}. Chef-curated using the freshest seasonal ingredients, prepared to perfection, and served hot. A delicious culinary experience you won't forget. ${bulletPoints}`;
  }

  const seoTitle = `${name} - Buy Premium ${category || ''} Online`;
  const seoDesc = `Shop ${name} today. Best prices, premium quality, and fast shipping directly to your door.`;

  // Simulate networking delay
  setTimeout(() => {
    return res.json({
      description: descriptionText,
      seoTitle,
      seoDesc,
      tags: [category || 'featured', 'new-arrival', name.toLowerCase().replace(/[^a-z0-9]/g, '-')]
    });
  }, 800);
};

// ==========================================
// STORE SETTINGS
// ==========================================

export const updateStoreSettings = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const {
    name,
    category,
    logoUrl,
    description,
    email,
    phone,
    whatsapp,
    address,
    city,
    state,
    country,
    currency,
    language,
    timezone,
    taxRate,
    themeSettings,
    enabledFeatures
  } = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: currentTenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const updated = await prisma.tenant.update({
      where: { id: currentTenantId },
      data: {
        name: name || tenant.name,
        category: category || tenant.category,
        logoUrl: logoUrl !== undefined ? logoUrl : tenant.logoUrl,
        description: description !== undefined ? description : tenant.description,
        email: email || tenant.email,
        phone: phone !== undefined ? phone : tenant.phone,
        whatsapp: whatsapp !== undefined ? whatsapp : tenant.whatsapp,
        address: address !== undefined ? address : tenant.address,
        city: city !== undefined ? city : tenant.city,
        state: state !== undefined ? state : tenant.state,
        country: country !== undefined ? country : tenant.country,
        currency: currency || tenant.currency,
        language: language || tenant.language,
        timezone: timezone || tenant.timezone,
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : tenant.taxRate,
        themeSettings: themeSettings ? JSON.stringify(themeSettings) : tenant.themeSettings,
        enabledFeatures: enabledFeatures ? JSON.stringify(enabledFeatures) : tenant.enabledFeatures
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        userId: req.user?.id,
        action: 'SETTINGS_UPDATED',
        details: `Updated tenant settings and configuration.`
      }
    });

    return res.json({
      ...updated,
      themeSettings: JSON.parse(updated.themeSettings),
      enabledFeatures: JSON.parse(updated.enabledFeatures)
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Failed to update store settings' });
  }
};

// ==========================================
// ANALYTICS REPORTS
// ==========================================

export const getReports = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    // 1. Gather counts
    const totalOrders = await prisma.order.count({ where: { tenantId: currentTenantId } });
    const activeProducts = await prisma.product.count({ where: { tenantId: currentTenantId, status: 'ACTIVE' } });
    const customersCount = await prisma.customer.count({ where: { tenantId: currentTenantId } });

    // 2. Sum Revenue
    const revenueSum = await prisma.order.aggregate({
      where: {
        tenantId: currentTenantId,
        paymentStatus: 'PAID'
      },
      _sum: {
        total: true
      }
    });

    const grossRevenue = revenueSum._sum.total || 0;

    // 3. Simulated time-series orders (e.g. last 7 days)
    const salesOverTime = [
      { date: 'Mon', sales: Math.round(grossRevenue * 0.1) || 120, orders: Math.round(totalOrders * 0.1) || 2 },
      { date: 'Tue', sales: Math.round(grossRevenue * 0.15) || 180, orders: Math.round(totalOrders * 0.15) || 3 },
      { date: 'Wed', sales: Math.round(grossRevenue * 0.08) || 90, orders: Math.round(totalOrders * 0.1) || 1 },
      { date: 'Thu', sales: Math.round(grossRevenue * 0.22) || 260, orders: Math.round(totalOrders * 0.2) || 4 },
      { date: 'Fri', sales: Math.round(grossRevenue * 0.25) || 310, orders: Math.round(totalOrders * 0.25) || 5 },
      { date: 'Sat', sales: Math.round(grossRevenue * 0.12) || 150, orders: Math.round(totalOrders * 0.1) || 2 },
      { date: 'Sun', sales: Math.round(grossRevenue * 0.08) || 90, orders: Math.round(totalOrders * 0.1) || 1 }
    ];

    // 4. Product lists
    const products = await prisma.product.findMany({
      where: { tenantId: currentTenantId },
      take: 5
    });

    const bestSellers = products.map((p, idx) => ({
      name: p.name,
      sales: Math.max(10 - idx * 2, 2),
      revenue: Math.max((10 - idx * 2) * p.price, 2 * p.price)
    }));

    return res.json({
      summary: {
        grossRevenue,
        totalOrders,
        activeProducts,
        customersCount,
        averageOrderValue: totalOrders > 0 ? (grossRevenue / totalOrders) : 0
      },
      salesOverTime,
      bestSellers
    });

  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics metrics' });
  }
};
