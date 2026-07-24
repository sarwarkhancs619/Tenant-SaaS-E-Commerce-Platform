import { Tenant, User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: Tenant;
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        tenantId: string | null;
      };
    }
  }
}
