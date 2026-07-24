import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';

export const registerCustomer = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { name, email, password, phone } = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing name, email, or password' });
    }

    // Check if customer email already exists for this tenant
    const existing = await prisma.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: currentTenantId,
          email: email.toLowerCase()
        }
      }
    });

    if (existing && existing.passwordHash) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let customer;
    if (existing) {
      // If customer was created via guest checkout, upgrade them with a password
      customer = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name,
          phone,
          passwordHash
        }
      });
    } else {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          tenantId: currentTenantId,
          email: email.toLowerCase(),
          name,
          phone,
          passwordHash
        }
      });
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        action: 'CUSTOMER_REGISTERED',
        details: `Customer account registered: ${name} (${email}).`
      }
    });

    return res.status(201).json({
      message: 'Account created successfully',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      }
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    return res.status(500).json({ error: 'Server error during customer account creation.' });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { email, password } = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: currentTenantId,
          email: email.toLowerCase()
        }
      }
    });

    if (!customer || !customer.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, customer.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-12345';
    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role: 'CUSTOMER',
        tenantId: customer.tenantId
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        walletBalance: customer.walletBalance,
        rewardPoints: customer.rewardPoints
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

export const getCustomerProfile = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const customerId = req.user?.id; // Attached by requireAuth middleware

  if (!currentTenantId || !customerId) {
    return res.status(400).json({ error: 'Customer context not found' });
  }

  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: currentTenantId
      },
      include: {
        orders: {
          include: {
            items: {
              include: { product: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        walletBalance: customer.walletBalance,
        rewardPoints: customer.rewardPoints,
        orders: customer.orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          total: o.total,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
          items: o.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price
          }))
        }))
      }
    });
  } catch (error) {
    console.error('Fetch customer profile error:', error);
    return res.status(500).json({ error: 'Server error fetching account profile.' });
  }
};
