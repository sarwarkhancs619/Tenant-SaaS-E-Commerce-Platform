import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamically inject tenant identity and auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const host = window.location.host.split(':')[0];
    const parts = host.split('.');

    let slug = '';
    
    // Subdomain extraction
    if (parts.length > 1) {
      const localhostIndex = parts.indexOf('localhost');
      const platformIndex = parts.indexOf('platform');
      const mainDomainIndex = localhostIndex !== -1 ? localhostIndex : platformIndex;
      if (mainDomainIndex > 0) {
        slug = parts[0];
      }
    }

    // Path-based fallback resolution for local testing
    if ((slug === '' || slug === 'www' || slug === 'admin') && window.location.pathname.startsWith('/store/')) {
      const pathParts = window.location.pathname.split('/');
      if (pathParts[2]) {
        slug = pathParts[2];
      }
    }

    if (slug && slug !== 'www' && slug !== 'admin') {
      config.headers['x-tenant-slug'] = slug;
    }

    // Attach correct JWT token based on request URL context
    let token = null;
    if (config.url?.startsWith('/admin/')) {
      token = localStorage.getItem('saas_token');
    } else if (config.url?.startsWith('/store/')) {
      token = localStorage.getItem(`customer_token_${slug}`);
    } else {
      token = localStorage.getItem(`customer_token_${slug}`) || localStorage.getItem('saas_token');
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});
