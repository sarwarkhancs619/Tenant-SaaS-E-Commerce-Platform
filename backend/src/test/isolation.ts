import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';

async function runIsolationTest() {
  console.log('\n==================================================');
  console.log('[TEST] STARTING MULTI-TENANT ISOLATION CHECK...');
  console.log('==================================================\n');

  try {
    // 1. Clean previous test items if any
    await prisma.product.deleteMany({
      where: {
        OR: [
          { slug: 'test-donut' },
          { slug: 'test-mouse' }
        ]
      }
    });

    await prisma.category.deleteMany({
      where: {
        OR: [
          { slug: 'test-pastries' },
          { slug: 'test-electronics' }
        ]
      }
    });

    await prisma.tenant.deleteMany({
      where: {
        OR: [
          { slug: 'test-bakery-tenant' },
          { slug: 'test-electronics-tenant' }
        ]
      }
    });

    // 2. Create Tenant A (Bakery Store)
    console.log('[+] Registering Tenant A: Bakery Store...');
    const tenantA = await prisma.tenant.create({
      data: {
        name: 'Test Bakery Store',
        slug: 'test-bakery-tenant',
        category: 'Bakery',
        email: 'bakery-test@shop.com',
        themeSettings: '{}',
        enabledFeatures: '{}'
      }
    });

    // 3. Create Tenant B (Electronics Store)
    console.log('[+] Registering Tenant B: Electronics Store...');
    const tenantB = await prisma.tenant.create({
      data: {
        name: 'Test Electronics Store',
        slug: 'test-electronics-tenant',
        category: 'Electronics',
        email: 'electronics-test@shop.com',
        themeSettings: '{}',
        enabledFeatures: '{}'
      }
    });

    // 4. Create Category under Tenant A
    console.log('[+] Creating Bakery Category under Tenant A...');
    const catA = await prisma.category.create({
      data: {
        tenantId: tenantA.id,
        name: 'Pastries',
        slug: 'test-pastries'
      }
    });

    // 5. Create Category under Tenant B
    console.log('[+] Creating Electronics Category under Tenant B...');
    const catB = await prisma.category.create({
      data: {
        tenantId: tenantB.id,
        name: 'Gadgets',
        slug: 'test-electronics'
      }
    });

    // 6. Create Product under Tenant A
    console.log('[+] Writing "Glazed Donut" under Tenant A...');
    await prisma.product.create({
      data: {
        tenantId: tenantA.id,
        categoryId: catA.id,
        name: 'Glazed Donut',
        slug: 'test-donut',
        price: 2.50,
        description: 'Warm sugar-glazed yeast donut.',
        images: '[]',
        sku: 'BAKE-DONUT-1',
        status: 'ACTIVE'
      }
    });

    // 7. Create Product under Tenant B
    console.log('[+] Writing "Gaming Mouse" under Tenant B...');
    await prisma.product.create({
      data: {
        tenantId: tenantB.id,
        categoryId: catB.id,
        name: 'Gaming Mouse',
        slug: 'test-mouse',
        price: 59.99,
        description: 'RGB wireless gaming mouse.',
        images: '[]',
        sku: 'ELEC-MOUSE-1',
        status: 'ACTIVE'
      }
    });

    // ==========================================
    // DATA ISOLATION ASSERTIONS
    // ==========================================
    console.log('\n[+] RUNNING DATABASE SECURITY ASSERTIONS...\n');

    // Query 1: Get products for Tenant A only
    const bakeryProducts = await prisma.product.findMany({
      where: { tenantId: tenantA.id }
    });

    console.log(`[Bakery Query] Retrieved ${bakeryProducts.length} products.`);
    bakeryProducts.forEach(p => console.log(`  -> Found Product: ${p.name} (SKU: ${p.sku})`));

    // Assert that Bakery Products only contain Glazed Donut, not Gaming Mouse
    const containsDonut = bakeryProducts.some(p => p.slug === 'test-donut');
    const containsMouse = bakeryProducts.some(p => p.slug === 'test-mouse');

    console.assert(containsDonut === true, 'Test Fail: Bakery products list missing "Glazed Donut"!');
    console.assert(containsMouse === false, 'CRITICAL SECURITY BREACH: Bakery query leaked Electronics "Gaming Mouse"!');

    if (containsDonut && !containsMouse) {
      console.log('✅ Assertion Passed: Tenant A (Bakery) data is strictly isolated.');
    } else {
      console.error('❌ Assertion Failed: Tenant A has data leakage or missing attributes.');
      process.exit(1);
    }

    // Query 2: Get products for Tenant B only
    const electronicsProducts = await prisma.product.findMany({
      where: { tenantId: tenantB.id }
    });

    console.log(`\n[Electronics Query] Retrieved ${electronicsProducts.length} products.`);
    electronicsProducts.forEach(p => console.log(`  -> Found Product: ${p.name} (SKU: ${p.sku})`));

    const containsDonutInElec = electronicsProducts.some(p => p.slug === 'test-donut');
    const containsMouseInElec = electronicsProducts.some(p => p.slug === 'test-mouse');

    console.assert(containsMouseInElec === true, 'Test Fail: Electronics products list missing "Gaming Mouse"!');
    console.assert(containsDonutInElec === false, 'CRITICAL SECURITY BREACH: Electronics query leaked Bakery "Glazed Donut"!');

    if (containsMouseInElec && !containsDonutInElec) {
      console.log('✅ Assertion Passed: Tenant B (Electronics) data is strictly isolated.');
    } else {
      console.error('❌ Assertion Failed: Tenant B has data leakage or missing attributes.');
      process.exit(1);
    }

    console.log('\n==================================================');
    console.log('✅ [TEST SUCCESS] ALL MULTI-TENANT ISOLATION CHECKS PASSED.');
    console.log('==================================================\n');

    // Cleanup test data
    await prisma.product.deleteMany({
      where: {
        OR: [
          { slug: 'test-donut' },
          { slug: 'test-mouse' }
        ]
      }
    });
    await prisma.category.deleteMany({
      where: {
        OR: [
          { slug: 'test-pastries' },
          { slug: 'test-electronics' }
        ]
      }
    });
    await prisma.tenant.deleteMany({
      where: {
        OR: [
          { slug: 'test-bakery-tenant' },
          { slug: 'test-electronics-tenant' }
        ]
      }
    });

  } catch (error) {
    console.error('❌ Test script run threw an unhandled error:', error);
    process.exit(1);
  }
}

runIsolationTest();
