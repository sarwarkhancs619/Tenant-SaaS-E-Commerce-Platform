import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';

// Help helper to get default configurations based on category
const getCategoryDefaults = (category: string) => {
  const normalized = category.toLowerCase();
  
  const defaults: Record<string, {
    categories: string[];
    products: Array<{ name: string; price: number; description: string; images: string[] }>;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
      textColor: string;
      fontFamily: string;
      layoutMode: string;
    };
  }> = {
    bakery: {
      categories: ['Cakes', 'Pastries', 'Bread', 'Cookies', 'Cupcakes'],
      products: [
        {
          name: 'Artisanal Sourdough Bread',
          price: 6.50,
          description: 'Naturally leavened sourdough bread baked daily with local stoneground flour. Crispy crust and soft airy crumb.',
          images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop']
        },
        {
          name: 'Chocolate Fudge Cake',
          price: 24.00,
          description: 'Rich and moist double chocolate cake frosted with thick chocolate fudge frosting. Perfect for birthdays and celebrations.',
          images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop']
        },
        {
          name: 'Butter Croissants (4-Pack)',
          price: 12.00,
          description: 'Flaky, buttery, multi-layered French pastries baked fresh every morning.',
          images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop']
        }
      ],
      theme: {
        primaryColor: '#8B4513', // amber-brown
        secondaryColor: '#D2B48C',
        backgroundColor: '#FFF8E7', // soft warm cream
        textColor: '#3E2723',
        fontFamily: 'Outfit',
        layoutMode: 'elegant'
      }
    },
    clothing: {
      categories: ['Men', 'Women', 'Kids', 'Shoes', 'Accessories'],
      products: [
        {
          name: 'Classic Denim Jacket',
          price: 69.99,
          description: 'Unisex heavyweight denim jacket with a relaxed fit. Metal button closure and dual chest pockets.',
          images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop']
        },
        {
          name: 'Cotton Crewneck T-Shirt',
          price: 22.50,
          description: 'Ultra-soft 100% organic cotton basic t-shirt. Tailored fit and breathable design.',
          images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop']
        },
        {
          name: 'Summer Floral Maxi Dress',
          price: 48.00,
          description: 'Lightweight flowy dress with side slits and adjustable shoulder straps. Perfect for warm sunny days.',
          images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop']
        }
      ],
      theme: {
        primaryColor: '#111111', // charcoal black
        secondaryColor: '#767676',
        backgroundColor: '#FAFAFA', // bright modern white
        textColor: '#1A1A1A',
        fontFamily: 'Inter',
        layoutMode: 'minimal'
      }
    },
    restaurant: {
      categories: ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Desserts'],
      products: [
        {
          name: 'Gourmet Truffle Burger',
          price: 18.00,
          description: 'Angus beef patty with truffle aioli, melted swiss cheese, caramelized onions, and wild arugula on a brioche bun.',
          images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop']
        },
        {
          name: 'Classic Margherita Pizza',
          price: 15.50,
          description: 'Wood-fired thin crust topped with fresh marinara sauce, fresh mozzarella, organic basil, and extra virgin olive oil.',
          images: ['https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop']
        },
        {
          name: 'Chocolate Lava Cake',
          price: 8.50,
          description: 'Warm chocolate cake with a molten liquid core, served with a scoop of premium vanilla bean gelato.',
          images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop']
        }
      ],
      theme: {
        primaryColor: '#D32F2F', // cherry red
        secondaryColor: '#FFA000',
        backgroundColor: '#FCFCFC',
        textColor: '#212121',
        fontFamily: 'Roboto',
        layoutMode: 'modern'
      }
    },
    grocery: {
      categories: ['Fruits', 'Vegetables', 'Dairy', 'Frozen Food', 'Household'],
      products: [
        {
          name: 'Organic Bananas (Bunch)',
          price: 3.20,
          description: 'Bunch of fresh, sustainably sourced organic bananas rich in potassium and nutrients.',
          images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop']
        },
        {
          name: 'Fresh Whole Milk (1 Gallon)',
          price: 4.50,
          description: 'Local pasteurized whole milk high in calcium, sourced from grass-fed cows.',
          images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop']
        }
      ],
      theme: {
        primaryColor: '#2E7D32', // forest green
        secondaryColor: '#81C784',
        backgroundColor: '#F9FDF9',
        textColor: '#1B5E20',
        fontFamily: 'Outfit',
        layoutMode: 'organic'
      }
    }
  };

  return defaults[normalized] || {
    categories: ['General'],
    products: [
      {
        name: 'Sample Product',
        price: 9.99,
        description: 'A sample product automatically created for your new store.',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop']
      }
    ],
    theme: {
      primaryColor: '#0F172A', // slate blue
      secondaryColor: '#64748B',
      backgroundColor: '#FFFFFF',
      textColor: '#0F172A',
      fontFamily: 'Inter',
      layoutMode: 'modern'
    }
  };
};

// Wizard onboarding handler
export const bootstrapStore = async (req: Request, res: Response) => {
  const {
    // Step 1: Business Details
    businessName,
    subdomain,
    description,
    email,
    phone,
    whatsapp,
    address,
    city,
    state,
    country,
    currency,
    language,
    timezone,
    taxRate,
    
    // Step 2 & 3: Industry Category & Theme
    category,
    themeName,
    
    // Step 4 & 5 & 6: Features, Payments, Shipping
    enabledFeatures, // Array of string keys
    paymentMethods, // Array of string keys
    shippingMethods, // Array of configurations
    
    // Admin Details
    adminEmail,
    adminPassword,
    adminName
  } = req.body;

  try {
    // 1. Validations
    if (!businessName || !subdomain || !adminEmail || !adminPassword || !adminName) {
      return res.status(400).json({ error: 'Missing mandatory fields' });
    }

    const slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    // Ensure uniqueness
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain already taken. Please choose another one.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Admin email already registered.' });
    }

    // 2. Fetch Default Bootstrapped Data based on Industry Category
    const configDefaults = getCategoryDefaults(category || 'custom');

    // Theme Config Compilation
    const themeSettingsObj = {
      themeName: themeName || 'Modern',
      ...configDefaults.theme,
      customCss: ''
    };

    // Features Compiler
    const featuresObj = {
      inventory: enabledFeatures?.includes('inventory') ?? true,
      coupons: enabledFeatures?.includes('coupons') ?? true,
      reviews: enabledFeatures?.includes('reviews') ?? true,
      whatsappOrders: enabledFeatures?.includes('whatsapp') ?? true,
      appointments: enabledFeatures?.includes('appointments') ?? false,
      loyalty: enabledFeatures?.includes('loyalty') ?? false,
      aiAssistant: enabledFeatures?.includes('ai') ?? true,
    };

    // 3. Create Tenant in Database
    const tenant = await prisma.tenant.create({
      data: {
        name: businessName,
        slug,
        category: category || 'Custom',
        description,
        email,
        phone,
        whatsapp,
        address,
        city,
        state,
        country,
        currency: currency || 'USD',
        language: language || 'en',
        timezone: timezone || 'UTC',
        taxRate: taxRate ? parseFloat(taxRate) : 0.0,
        themeSettings: JSON.stringify(themeSettingsObj),
        enabledFeatures: JSON.stringify(featuresObj),
      }
    });

    // 4. Create Owner User
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const owner = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: 'OWNER',
        tenantId: tenant.id
      }
    });

    // 5. Create Default Warehouse and Inventory structure
    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Store Warehouse',
        address: address || 'Main Store Address'
      }
    });

    // 6. Bootstrap Categories and Products
    const createdCategories: Record<string, string> = {};
    for (const catName of configDefaults.categories) {
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const dbCat = await prisma.category.create({
        data: {
          tenantId: tenant.id,
          name: catName,
          slug: catSlug,
        }
      });
      createdCategories[catName] = dbCat.id;
    }

    // Bootstrap default products
    for (const prod of configDefaults.products) {
      const prodSlug = prod.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const dbProd = await prisma.product.create({
        data: {
          tenantId: tenant.id,
          categoryId: createdCategories[configDefaults.categories[0]] || null,
          name: prod.name,
          slug: prodSlug,
          description: prod.description,
          price: prod.price,
          images: JSON.stringify(prod.images),
          sku: `${slug.toUpperCase()}-${prod.name.substring(0, 3).toUpperCase()}-1`,
          status: 'ACTIVE',
          type: 'PHYSICAL',
        }
      });

      // Link to warehouse inventory
      await prisma.inventoryItem.create({
        data: {
          productId: dbProd.id,
          warehouseId: warehouse.id,
          quantity: 50, // default demo stock
          lowStockThreshold: 5
        }
      });
    }

    // 7. Bootstrap Store Home Page Sections for dynamic website builder
    const defaultSections = [
      {
        id: 'hero-banner',
        type: 'HeroBanner',
        settings: {
          title: `Welcome to ${businessName}`,
          subtitle: description || `Browse our exclusive collection of premium ${category} items.`,
          backgroundImage: configDefaults.products[0]?.images[0] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
          ctaText: 'Shop All Products',
          ctaUrl: '/products',
          alignment: 'center'
        }
      },
      {
        id: 'categories-grid',
        type: 'CategoriesGrid',
        settings: {
          title: 'Shop by Department',
          limit: 6
        }
      },
      {
        id: 'featured-products',
        type: 'FeaturedProducts',
        settings: {
          title: 'Trending Favorites',
          layout: 'grid',
          limit: 4
        }
      },
      {
        id: 'contact-section',
        type: 'ContactSection',
        settings: {
          title: 'Visit Us',
          showPhone: true,
          showWhatsapp: true,
          showForm: true
        }
      }
    ];

    await prisma.storePage.create({
      data: {
        tenantId: tenant.id,
        title: 'Home Page',
        slug: 'index',
        isHome: true,
        sections: JSON.stringify(defaultSections)
      }
    });

    // 8. Sign Token
    const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-12345';
    const token = jwt.sign(
      {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        role: owner.role,
        tenantId: owner.tenantId
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Write audit log
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: owner.id,
        action: 'STORE_ONBOARDED',
        details: `Successfully set up and bootstrapped store for ${businessName} (${category}).`
      }
    });

    return res.status(201).json({
      message: 'Store created successfully',
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        category: tenant.category,
        currency: tenant.currency
      },
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role
      }
    });

  } catch (error) {
    console.error('Wizard onboarding error:', error);
    return res.status(500).json({ error: 'Server failed to build and bootstrap store' });
  }
};
