import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export const extractTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Check header (passed by Next.js middleware)
    let slug = req.headers['x-tenant-slug'] as string;
    
    // 2. Check custom domain or host
    const host = req.headers.host || '';

    // If no header, parse subdomain
    if (!slug && host) {
      const parts = host.split('.');
      // If we have store.platform.local:3000 -> parts = ['store', 'platform', 'local:3000']
      if (parts.length > 2) {
        const potentialSlug = parts[0];
        if (potentialSlug !== 'www' && potentialSlug !== 'admin' && potentialSlug !== 'localhost') {
          slug = potentialSlug;
        }
      }
    }

    if (!slug) {
      // Let it pass, some routes (e.g. system health, global wizard creation) do not require a tenant
      return next();
    }

    // Query database for tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: slug.toLowerCase() },
          { customDomain: host.toLowerCase() }
        ]
      }
    });

    if (tenant) {
      req.tenantId = tenant.id;
      req.tenant = tenant;
    }

    next();
  } catch (error) {
    console.error('Tenant identification middleware error:', error);
    res.status(500).json({ error: 'Failed to process tenant context' });
  }
};

// Middleware to strictly enforce tenant presence for tenant-specific routes
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenantId || !req.tenant) {
    return res.status(404).json({ error: 'Store not found' });
  }

  if (req.tenant.status === 'SUSPENDED') {
    return res.status(403).json({ 
      error: 'SUSPENDED', 
      message: 'This storefront has been suspended by the platform administrator.' 
    });
  }

  next();
};
