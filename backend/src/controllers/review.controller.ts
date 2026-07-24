import { Request, Response } from 'express';
import { prisma } from '../config/db';

// ==========================================
// STOREFRONT CLIENT REVIEWS
// ==========================================

export const getProductReviews = async (req: Request, res: Response) => {
  const { productId } = req.params;

  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        customer: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(reviews);
  } catch (error) {
    console.error('Fetch product reviews error:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews for this product.' });
  }
};

export const createProductReview = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { productId } = req.params;
  const customerId = req.user?.id; // Attached by requireAuth
  const { rating, comment } = req.body;

  if (!currentTenantId || !customerId) {
    return res.status(401).json({ error: 'Customer context required.' });
  }

  try {
    if (!rating || !comment) {
      return res.status(400).json({ error: 'Rating and comment are required.' });
    }

    const valRating = parseInt(rating);
    if (valRating < 1 || valRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: currentTenantId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        customerId,
        rating: valRating,
        comment
      },
      include: {
        customer: { select: { name: true } }
      }
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ error: 'Failed to post review.' });
  }
};

// ==========================================
// ADMIN PORTAL REVIEWS MODERATION
// ==========================================

export const getAdminReviews = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    // Get all reviews for products belonging to this tenant
    const reviews = await prisma.review.findMany({
      where: {
        product: {
          tenantId: currentTenantId
        }
      },
      include: {
        product: {
          select: { name: true, slug: true }
        },
        customer: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(reviews);
  } catch (error) {
    console.error('Get admin reviews error:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
};

export const deleteAdminReview = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { id } = req.params;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    // Verify review exists and belongs to this tenant's product
    const review = await prisma.review.findFirst({
      where: {
        id,
        product: {
          tenantId: currentTenantId
        }
      },
      include: {
        product: true
      }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    await prisma.review.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        userId: req.user?.id,
        action: 'REVIEW_DELETED',
        details: `Deleted review from product ${review.product.name}.`
      }
    });

    return res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ error: 'Failed to delete review.' });
  }
};
