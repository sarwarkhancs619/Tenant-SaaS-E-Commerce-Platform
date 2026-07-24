import { Request, Response } from 'express';
import { prisma } from '../config/db';

/**
 * Platform Super-Admin Endpoint to delete a store tenant.
 * Deleting the Tenant automatically deletes all related Category, Product,
 * Warehouse, InventoryItem, Customer, Order, OrderItem, StorePage, Coupon, and Review records.
 */
export const deleteStore = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const adminSecret = req.headers['x-platform-admin-secret'];
    const expectedSecret = process.env.PLATFORM_ADMIN_SECRET || 'super-platform-admin-secret-key-999';

    if (!adminSecret || adminSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized. Invalid Platform Admin Secret.' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!tenant) {
      return res.status(404).json({ error: `Store with slug '${slug}' not found.` });
    }

    // Run delete. Cascade triggers in schema will wipe all dependencies cleanly.
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
