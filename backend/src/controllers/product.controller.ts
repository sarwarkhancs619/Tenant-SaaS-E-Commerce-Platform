import { Request, Response } from 'express';
import { prisma } from '../config/db';

// ==========================================
// CATEGORIES
// ==========================================

export const getCategories = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const categories = await prisma.category.findMany({
      where: { tenantId: currentTenantId },
      orderBy: { name: 'asc' }
    });
    return res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { name, slug, imageUrl } = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const existing = await prisma.category.findUnique({
      where: {
        tenantId_slug: {
          tenantId: currentTenantId,
          slug: catSlug
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'A category with this slug already exists' });
    }

    const category = await prisma.category.create({
      data: {
        tenantId: currentTenantId,
        name,
        slug: catSlug,
        imageUrl
      }
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ error: 'Failed to create category' });
  }
};

// ==========================================
// PRODUCTS
// ==========================================

export const getProducts = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { categorySlug, status, type } = req.query;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    // Filter builders
    const whereClause: any = { tenantId: currentTenantId };

    if (categorySlug) {
      whereClause.category = { slug: categorySlug as string };
    }
    
    if (status) {
      whereClause.status = status as string;
    }

    if (type) {
      whereClause.type = type as string;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        inventory: {
          include: { warehouse: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Parse JSON lists for convenience
    const formatted = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      variants: p.variants ? JSON.parse(p.variants) : null
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { slug } = req.params;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        tenantId_slug: {
          tenantId: currentTenantId,
          slug
        }
      },
      include: {
        category: true,
        reviews: {
          include: { customer: { select: { name: true } } }
        },
        inventory: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const formatted = {
      ...product,
      images: JSON.parse(product.images || '[]'),
      variants: product.variants ? JSON.parse(product.variants) : null
    };

    return res.json(formatted);
  } catch (error) {
    console.error('Get product by slug error:', error);
    return res.status(500).json({ error: 'Failed to fetch product details' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const {
    name,
    slug,
    description,
    price,
    comparePrice,
    images, // Array of strings
    sku,
    barcode,
    categoryId,
    status,
    type,
    variants,
    seoTitle,
    seoDesc,
    initialStock
  } = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const prodSlug = slug || name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const dbImages = JSON.stringify(images || []);

    const existing = await prisma.product.findUnique({
      where: {
        tenantId_slug: {
          tenantId: currentTenantId,
          slug: prodSlug
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Product slug already exists in this store.' });
    }

    // Write core product
    const product = await prisma.product.create({
      data: {
        tenantId: currentTenantId,
        categoryId: categoryId || null,
        name,
        slug: prodSlug,
        description: description || '',
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        images: dbImages,
        sku: sku || `${currentTenantId.substring(0, 4).toUpperCase()}-${prodSlug.substring(0, 3).toUpperCase()}`,
        barcode,
        status: status || 'ACTIVE',
        type: type || 'PHYSICAL',
        variants: variants ? JSON.stringify(variants) : null,
        seoTitle,
        seoDesc
      }
    });

    // Handle inventory link (create main warehouse link)
    const primaryWarehouse = await prisma.warehouse.findFirst({
      where: { tenantId: currentTenantId }
    });

    if (primaryWarehouse) {
      await prisma.inventoryItem.create({
        data: {
          productId: product.id,
          warehouseId: primaryWarehouse.id,
          quantity: initialStock ? parseInt(initialStock) : 0,
          lowStockThreshold: 5
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        userId: req.user?.id,
        action: 'PRODUCT_CREATED',
        details: `Created product ${name} with stock ${initialStock || 0}.`
      }
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { id } = req.params;
  const updates = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const product = await prisma.product.findFirst({
      where: { id, tenantId: currentTenantId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Format serialized values
    const dataToUpdate: any = { ...updates };
    if (updates.images) dataToUpdate.images = JSON.stringify(updates.images);
    if (updates.variants) dataToUpdate.variants = JSON.stringify(updates.variants);
    if (updates.price) dataToUpdate.price = parseFloat(updates.price);
    if (updates.comparePrice) dataToUpdate.comparePrice = parseFloat(updates.comparePrice);

    // Filter out fields that shouldn't change directly or require complex handling
    delete dataToUpdate.id;
    delete dataToUpdate.tenantId;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate
    });

    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        userId: req.user?.id,
        action: 'PRODUCT_UPDATED',
        details: `Updated product details for ${updated.name}.`
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
};

// ==========================================
// INVENTORY
// ==========================================

export const updateStock = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { productId, warehouseId, quantity } = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    if (!productId || !warehouseId || quantity === undefined) {
      return res.status(400).json({ error: 'Product ID, Warehouse ID and quantity are required' });
    }

    // Verify product belongs to tenant
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: currentTenantId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const inventory = await prisma.inventoryItem.upsert({
      where: {
        productId_warehouseId: { productId, warehouseId }
      },
      update: { quantity: parseInt(quantity) },
      create: { productId, warehouseId, quantity: parseInt(quantity) }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        userId: req.user?.id,
        action: 'STOCK_UPDATED',
        details: `Updated stock of ${product.name} to ${quantity}.`
      }
    });

    return res.json(inventory);
  } catch (error) {
    console.error('Update stock error:', error);
    return res.status(500).json({ error: 'Failed to update stock' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { id } = req.params;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    // 1. Verify product belongs to tenant
    const product = await prisma.product.findFirst({
      where: { id, tenantId: currentTenantId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. Check if product has been purchased (has OrderItems)
    const hasOrders = await prisma.orderItem.findFirst({
      where: { productId: id }
    });

    if (hasOrders) {
      // Archive it to protect order invoices
      await prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED' }
      });

      await prisma.auditLog.create({
        data: {
          tenantId: currentTenantId,
          userId: req.user?.id,
          action: 'PRODUCT_ARCHIVED',
          details: `Archived product ${product.name} due to historical sales.`
        }
      });

      return res.json({ 
        message: 'Product contains historical orders and cannot be hard deleted. It has been set to ARCHIVED status instead.',
        archived: true
      });
    }

    // 3. Hard delete
    await prisma.$transaction([
      prisma.inventoryItem.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } })
    ]);

    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        userId: req.user?.id,
        action: 'PRODUCT_DELETED',
        details: `Deleted product ${product.name} and related inventory.`
      }
    });

    return res.json({ message: 'Product deleted successfully', archived: false });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
};

