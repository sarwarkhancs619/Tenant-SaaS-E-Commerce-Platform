import axios from 'axios';

let API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Handle cases where the environment variable is configured as a plain domain (e.g. without protocol and /api suffix)
if (API_BASE && !API_BASE.startsWith('http://') && !API_BASE.startsWith('https://') && !API_BASE.startsWith('/')) {
  const isLocal = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');
  API_BASE = `${isLocal ? 'http://' : 'https://'}${API_BASE}`;
}
if (API_BASE && !API_BASE.endsWith('/api') && !API_BASE.endsWith('/api/')) {
  API_BASE = API_BASE.endsWith('/') ? `${API_BASE}api` : `${API_BASE}/api`;
}

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
