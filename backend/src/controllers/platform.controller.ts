import { Request, Response } from 'express';
import { prisma } from '../config/db';

/**
 * Helper to verify platform admin secret
 */
const verifyAdminSecret = (req: Request): boolean => {
  const adminSecret = req.headers['x-platform-admin-secret'];
  const expectedSecret = process.env.PLATFORM_ADMIN_SECRET || 'super-platform-admin-secret-key-999';
  return adminSecret === expectedSecret;
};

/**
 * GET /api/platform/stats
 * Get platform-wide metrics (Stores, Products, Orders, Revenue)
 */
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    if (!verifyAdminSecret(req)) {
      return res.status(401).json({ error: 'Unauthorized. Invalid Platform Admin Secret.' });
    }

    const totalStores = await prisma.tenant.count();
    const activeStores = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    
    const revenueAggregate = await prisma.order.aggregate({
      _sum: {
        total: true
      }
    });
    const totalRevenue = revenueAggregate._sum.total || 0;

    return res.json({
      totalStores,
      activeStores,
      totalProducts,
      totalOrders,
      totalRevenue
    });
  } catch (error: any) {
    console.error('Platform getPlatformStats error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/platform/stores
 * Get list of all stores with details and order/product counts
 */
export const getPlatformStores = async (req: Request, res: Response) => {
  try {
    if (!verifyAdminSecret(req)) {
      return res.status(401).json({ error: 'Unauthorized. Invalid Platform Admin Secret.' });
    }

    const stores = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    });

    const formatted = stores.map(store => ({
      id: store.id,
      name: store.name,
      slug: store.slug,
      category: store.category,
      email: store.email,
      status: store.status,
      plan: store.plan,
      customDomain: store.customDomain,
      createdAt: store.createdAt,
      productsCount: store._count.products,
      ordersCount: store._count.orders
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Platform getPlatformStores error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * PATCH /api/platform/stores/:slug/status
 * Suspend or activate a store
 */
export const updateStoreStatus = async (req: Request, res: Response) => {
  try {
    if (!verifyAdminSecret(req)) {
      return res.status(401).json({ error: 'Unauthorized. Invalid Platform Admin Secret.' });
    }

    const { slug } = req.params;
    const { status } = req.body; // EXPECTS: ACTIVE, SUSPENDED

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Choose ACTIVE or SUSPENDED.' });
    }

    const store = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!store) {
      return res.status(404).json({ error: `Store with slug '${slug}' not found.` });
    }

    const updated = await prisma.tenant.update({
      where: { slug },
      data: { status }
    });

    return res.json({
      success: true,
      message: `Store '${updated.name}' status updated to '${status}'.`,
      store: {
        slug: updated.slug,
        status: updated.status
      }
    });
  } catch (error: any) {
    console.error('Platform updateStoreStatus error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * PATCH /api/platform/stores/:slug/plan
 * Upgrade/Downgrade store subscription plan
 */
export const updateStorePlan = async (req: Request, res: Response) => {
  try {
    if (!verifyAdminSecret(req)) {
      return res.status(401).json({ error: 'Unauthorized. Invalid Platform Admin Secret.' });
    }

    const { slug } = req.params;
    const { plan } = req.body; // EXPECTS: FREE, PRO, ENTERPRISE

    if (!plan || !['FREE', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Choose FREE, PRO, or ENTERPRISE.' });
    }

    const store = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!store) {
      return res.status(404).json({ error: `Store with slug '${slug}' not found.` });
    }

    const updated = await prisma.tenant.update({
      where: { slug },
      data: { plan }
    });

    return res.json({
      success: true,
      message: `Store '${updated.name}' upgraded to plan '${plan}'.`,
      store: {
        slug: updated.slug,
        plan: updated.plan
      }
    });
  } catch (error: any) {
    console.error('Platform updateStorePlan error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * DELETE /api/platform/stores/:slug
 * Cascading delete of a store
 */
export const deleteStore = async (req: Request, res: Response) => {
  try {
    if (!verifyAdminSecret(req)) {
      return res.status(401).json({ error: 'Unauthorized. Invalid Platform Admin Secret.' });
    }

    const { slug } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!tenant) {
      return res.status(404).json({ error: `Store with slug '${slug}' not found.` });
    }

    // Run cascading delete
    await prisma.tenant.delete({
      where: { slug }
    });

    return res.json({ 
      success: true, 
      message: `Store '${tenant.name}' (slug: '${slug}') and all its products, orders, pages, and reviews have been permanently deleted.` 
    });
  } catch (error: any) {
    console.error('Platform deleteStore error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
