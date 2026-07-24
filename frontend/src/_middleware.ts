import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Exclude static assets, Next internals, api endpoints
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Local development host cleaning (e.g., tenant.localhost:3000 -> tenant.localhost)
  const host = hostname.split(':')[0];
  const parts = host.split('.');

  console.log("MIDDLEWARE TRACE:", {
    hostname,
    host,
    parts,
    urlPathname: url.pathname
  });

  let tenantSlug = '';

  // Extract subdomain if hostname has one
  // Examples: bakery.localhost, bakery.platform.local, bakery.platform.com
  if (parts.length > 1) {
    const localhostIndex = parts.indexOf('localhost');
    const platformIndex = parts.indexOf('platform');
    const mainDomainIndex = localhostIndex !== -1 ? localhostIndex : platformIndex;
    
    if (mainDomainIndex > 0) {
      const subdomain = parts[0];
      // Skip common routing keywords
      if (subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'api') {
        tenantSlug = subdomain;
      }
    }
  }

  // Rewrite matching subdomains to tenant store routing
  if (tenantSlug) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', tenantSlug);

    console.log("MIDDLEWARE REWRITE:", {
      tenantSlug,
      targetUrl: `/store/${tenantSlug}${url.pathname}`
    });

    return NextResponse.rewrite(
      new URL(`/store/${tenantSlug}${url.pathname}`, request.url),
      {
        request: {
          headers: requestHeaders,
        },
      }
    );
  }

  // If path is like "/store/bakery", inject the header manually so the backend matches it
  if (url.pathname.startsWith('/store/')) {
    const pathParts = url.pathname.split('/');
    const pathSlug = pathParts[2];
    if (pathSlug) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-tenant-slug', pathSlug);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        }
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
