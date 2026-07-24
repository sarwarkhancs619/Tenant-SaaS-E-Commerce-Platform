import { Request, Response } from 'express';
import { prisma } from '../config/db';

// Checkout / Place Order (Public Customer Flow)
export const checkout = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const currentTenant = req.tenant;

  const {
    customerEmail,
    customerName,
    customerPhone,
    shippingAddress, // object
    paymentMethod,
    items // Array of { productId, quantity }
  } = req.body;

  if (!currentTenantId || !currentTenant) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    if (!customerEmail || !customerName || !items || !items.length) {
      return res.status(400).json({ error: 'Customer details and order items are required' });
    }

    // 1. Get or Create Customer
    let customer = await prisma.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: currentTenantId,
          email: customerEmail.toLowerCase()
        }
      }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: currentTenantId,
          email: customerEmail.toLowerCase(),
          name: customerName,
          phone: customerPhone
        }
      });
    }

    // 2. Validate Items and Calculate Prices
    let subtotal = 0;
    const orderItemsToCreate: Array<{
      productId: string;
      quantity: number;
      price: number;
    }> = [];
    const stockUpdates: Array<{
      inventoryId: string;
      newQty: number;
    }> = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, tenantId: currentTenantId }
      });

      if (!product || product.status !== 'ACTIVE') {
        return res.status(400).json({ error: `Product with ID ${item.productId} is not available.` });
      }

      // Check stock
      const inventory = await prisma.inventoryItem.findFirst({
        where: { productId: product.id }
      });

      if (!inventory || inventory.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product: ${product.name}.` });
      }

      const itemCost = product.price * item.quantity;
      subtotal += itemCost;

      orderItemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });

      stockUpdates.push({
        inventoryId: inventory.id,
        newQty: inventory.quantity - item.quantity
      });
    }

    // 3. Tax and Shipping calculations
    const taxRate = currentTenant.taxRate || 0.0;
    const tax = subtotal * taxRate;
    const shippingFee = subtotal > 50 ? 0.0 : 10.0; // Free shipping above $50, else $10 flat
    const total = subtotal + tax + shippingFee;

    // 4. Generate unique Order Number
    const count = await prisma.order.count({ where: { tenantId: currentTenantId } });
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}-${(count + 1001)}`;

    // 5. Run Transaction: Create Order, subtract Stock
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const dbOrder = await tx.order.create({
        data: {
          tenantId: currentTenantId,
          customerId: customer.id,
          orderNumber,
          status: 'PENDING',
          subtotal,
          tax,
          shippingFee,
          total,
          shippingAddress: JSON.stringify(shippingAddress),
          paymentMethod: paymentMethod || 'cod',
          paymentStatus: paymentMethod === 'cod' ? 'PENDING' : 'PAID',
          items: {
            create: orderItemsToCreate
          }
        },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      // Deduct stock
      for (const update of stockUpdates) {
        await tx.inventoryItem.update({
          where: { id: update.inventoryId },
          data: { quantity: update.newQty }
        });
      }

      return dbOrder;
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        action: 'ORDER_PLACED',
        details: `Customer ${customerName} placed order ${orderNumber} totaling ${currentTenant.currency} ${total.toFixed(2)}.`
      }
    });

    return res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax,
        shippingFee: order.shippingFee,
        shippingAddress: JSON.parse(order.shippingAddress),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        items: order.items
      }
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Server error during checkout process' });
  }
};

// ==========================================
// ADMIN ORDER MANAGEMENT
// ==========================================

export const getOrders = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: currentTenantId },
      include: {
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = orders.map(o => ({
      ...o,
      shippingAddress: JSON.parse(o.shippingAddress)
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { id } = req.params;
  const { status, trackingNumber, paymentStatus } = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id, tenantId: currentTenantId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: status || order.status,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : order.trackingNumber,
        paymentStatus: paymentStatus || order.paymentStatus
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        userId: req.user?.id,
        action: 'ORDER_UPDATED',
        details: `Updated order ${order.orderNumber} status to ${status || order.status}.`
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ error: 'Failed to update order' });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { id } = req.params;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id, tenantId: currentTenantId },
      include: {
        customer: true,
        tenant: true,
        items: { include: { product: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const invoiceData = {
      invoiceNumber: `INV-${order.orderNumber.split('-')[1]}-${order.orderNumber.split('-')[2]}`,
      date: order.createdAt,
      storeName: order.tenant.name,
      storeEmail: order.tenant.email,
      storePhone: order.tenant.phone,
      storeAddress: `${order.tenant.address || ''}, ${order.tenant.city || ''}, ${order.tenant.country || ''}`,
      customerName: order.customer?.name,
      customerEmail: order.customer?.email,
      shippingAddress: JSON.parse(order.shippingAddress),
      paymentMethod: order.paymentMethod.toUpperCase(),
      paymentStatus: order.paymentStatus.toUpperCase(),
      currency: order.tenant.currency,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingFee: order.shippingFee,
      total: order.total,
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity
      }))
    };

    return res.json(invoiceData);
  } catch (error) {
    console.error('Get invoice error:', error);
    return res.status(500).json({ error: 'Failed to generate invoice details' });
  }
};
