import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getPages = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const pages = await prisma.storePage.findMany({
      where: { tenantId: currentTenantId },
      orderBy: { isHome: 'desc' }
    });

    const formatted = pages.map(p => ({
      ...p,
      sections: JSON.parse(p.sections)
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Get pages error:', error);
    return res.status(500).json({ error: 'Failed to fetch pages' });
  }
};

export const getPageBySlug = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { slug } = req.params;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const page = await prisma.storePage.findFirst({
      where: {
        tenantId: currentTenantId,
        slug: slug.toLowerCase()
      }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    return res.json({
      ...page,
      sections: JSON.parse(page.sections)
    });
  } catch (error) {
    console.error('Get page error:', error);
    return res.status(500).json({ error: 'Failed to fetch page details' });
  }
};

export const updatePageSections = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { id } = req.params;
  const { sections, title } = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const page = await prisma.storePage.findFirst({
      where: { id, tenantId: currentTenantId }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const updated = await prisma.storePage.update({
      where: { id },
      data: {
        title: title || page.title,
        sections: JSON.stringify(sections)
      }
    });

    await prisma.auditLog.create({
      data: {
        tenantId: currentTenantId,
        userId: req.user?.id,
        action: 'PAGE_UPDATED',
        details: `Updated sections configuration for page: ${page.title}.`
      }
    });

    return res.json({
      ...updated,
      sections: JSON.parse(updated.sections)
    });
  } catch (error) {
    console.error('Update page sections error:', error);
    return res.status(500).json({ error: 'Failed to save page configuration' });
  }
};

export const createPage = async (req: Request, res: Response) => {
  const currentTenantId = req.tenantId;
  const { title, slug, sections } = req.body;

  if (!currentTenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required' });
    }

    const pageSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const existing = await prisma.storePage.findFirst({
      where: { tenantId: currentTenantId, slug: pageSlug }
    });

    if (existing) {
      return res.status(400).json({ error: 'Page with this slug already exists' });
    }

    const page = await prisma.storePage.create({
      data: {
        tenantId: currentTenantId,
        title,
        slug: pageSlug,
        sections: JSON.stringify(sections || []),
        isHome: false
      }
    });

    return res.status(201).json({
      ...page,
      sections: JSON.parse(page.sections)
    });
  } catch (error) {
    console.error('Create page error:', error);
    return res.status(500).json({ error: 'Failed to create page' });
  }
};
