import { Router } from 'express';
import { bootstrapStore } from '../controllers/wizard.controller';
import { 
  deleteStore, 
  getPlatformStats, 
  getPlatformStores, 
  updateStoreStatus, 
  updateStorePlan 
} from '../controllers/platform.controller';
import { login, registerStaff, getProfile } from '../controllers/auth.controller';
import { 
  getCategories, 
  createCategory, 
  getProducts, 
  getProductBySlug, 
  createProduct, 
  updateProduct, 
  updateStock,
  deleteProduct
} from '../controllers/product.controller';
import {
  getProductReviews,
  createProductReview,
  getAdminReviews,
  deleteAdminReview
} from '../controllers/review.controller';
import { checkout, getOrders, updateOrderStatus, getInvoice } from '../controllers/order.controller';
import { getPages, getPageBySlug, updatePageSections, createPage } from '../controllers/builder.controller';
import { generateDescription, updateStoreSettings, getReports } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/role';
import { registerCustomer, loginCustomer, getCustomerProfile } from '../controllers/customer.controller';
// Let's import directly from our middleware folder
import { extractTenant, requireTenant } from '../middleware/tenant';

// Wait! In the import above: '../role' might be wrong. It should be '../middleware/role'!
// Let's make sure it is corrected to '../middleware/role'.

const router = Router();

// ==========================================
// PUBLIC WIZARD ONBOARDING & PLATFORM UTILS
// ==========================================
router.post('/wizard/bootstrap', bootstrapStore);
router.get('/platform/stats', getPlatformStats);
router.get('/platform/stores', getPlatformStores);
router.patch('/platform/stores/:slug/status', updateStoreStatus);
router.patch('/platform/stores/:slug/plan', updateStorePlan);
router.delete('/platform/stores/:slug', deleteStore);

// ==========================================
// PUBLIC CUSTOMER STOREFRONT APIs
// (Requires extractTenant + requireTenant)
// ==========================================

// Get Tenant info and styles
router.get('/store/info', extractTenant, requireTenant, (req, res) => {
  const t = req.tenant!;
  res.json({
    id: t.id,
    name: t.name,
    slug: t.slug,
    category: t.category,
    logoUrl: t.logoUrl,
    description: t.description,
    email: t.email,
    phone: t.phone,
    whatsapp: t.whatsapp,
    address: t.address,
    city: t.city,
    country: t.country,
    currency: t.currency,
    language: t.language,
    themeSettings: JSON.parse(t.themeSettings),
    enabledFeatures: JSON.parse(t.enabledFeatures)
  });
});

// Catalog browse
router.get('/store/categories', extractTenant, requireTenant, getCategories);
router.get('/store/products', extractTenant, requireTenant, getProducts);
router.get('/store/products/:slug', extractTenant, requireTenant, getProductBySlug);

// Page builder render
router.get('/store/pages/:slug', extractTenant, requireTenant, getPageBySlug);

// Checkout order placement
router.post('/store/checkout', extractTenant, requireTenant, checkout);

// Customer Account Auth & Profile
router.post('/store/auth/register', extractTenant, requireTenant, registerCustomer);
router.post('/store/auth/login', extractTenant, requireTenant, loginCustomer);
router.get('/store/auth/profile', extractTenant, requireTenant, requireAuth, getCustomerProfile);

// Product Reviews
router.get('/store/products/:productId/reviews', extractTenant, requireTenant, getProductReviews);
router.post('/store/products/:productId/reviews', extractTenant, requireTenant, requireAuth, createProductReview);


// ==========================================
// TENANT ADMIN DASHBOARD APIs
// (Requires Auth + Tenant identification context)
// ==========================================

// Login doesn't need tenant header since email is globally unique in our simple schema,
// but it returns the tenant slug to the user.
router.post('/admin/auth/login', login);
router.get('/admin/auth/profile', requireAuth, getProfile);

// Authenticated staff endpoints
const adminStaffRoles = ['OWNER', 'ADMIN', 'STAFF'];
const adminOwnerRoles = ['OWNER', 'ADMIN'];

router.post('/admin/auth/staff', extractTenant, requireTenant, requireAuth, requireRoles(adminOwnerRoles), registerStaff);
router.patch('/admin/settings', extractTenant, requireTenant, requireAuth, requireRoles(adminOwnerRoles), updateStoreSettings);

// Products & Inventory Management
router.get('/admin/categories', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), getCategories);
router.post('/admin/categories', extractTenant, requireTenant, requireAuth, requireRoles(adminOwnerRoles), createCategory);

router.get('/admin/products', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), getProducts);
router.post('/admin/products', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), createProduct);
router.patch('/admin/products/:id', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), updateProduct);
router.delete('/admin/products/:id', extractTenant, requireTenant, requireAuth, requireRoles(adminOwnerRoles), deleteProduct);

router.post('/admin/inventory/stock', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), updateStock);

// Order Management
router.get('/admin/orders', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), getOrders);
router.patch('/admin/orders/:id', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), updateOrderStatus);
router.get('/admin/orders/:id/invoice', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), getInvoice);

// Review Moderation
router.get('/admin/reviews', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), getAdminReviews);
router.delete('/admin/reviews/:id', extractTenant, requireTenant, requireAuth, requireRoles(adminOwnerRoles), deleteAdminReview);

// Page Builder CMS
router.get('/admin/builder/pages', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), getPages);
router.post('/admin/builder/pages', extractTenant, requireTenant, requireAuth, requireRoles(adminOwnerRoles), createPage);
router.patch('/admin/builder/pages/:id', extractTenant, requireTenant, requireAuth, requireRoles(adminOwnerRoles), updatePageSections);

// AI utilities
router.post('/admin/ai/description', extractTenant, requireTenant, requireAuth, requireRoles(adminStaffRoles), generateDescription);

// Dashboard Reports
router.get('/admin/reports', extractTenant, requireTenant, requireAuth, requireRoles(adminOwnerRoles), getReports);

export default router;
