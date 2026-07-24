import { Request, Response, NextFunction } from 'express';

export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
    }

    // Ensure staff/owner can only access resources matching their tenant
    if (req.user.role !== 'SUPERADMIN' && req.tenantId && req.user.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'Access forbidden: Tenant mismatch' });
    }

    next();
  }
};
