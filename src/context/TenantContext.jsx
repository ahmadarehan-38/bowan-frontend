import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { normalizeBrandColor } from '../lib/normalizeBrandColor';

const TenantContext = createContext(null);
const DEFAULT_BRAND = { primaryColor: '#7450bd', secondaryColor: '#eee8fa' };

function slugFromLocation(location) {
  const pathMatch = location.pathname.match(/^\/academy\/([^/]+)/i);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);
  const querySlug = new URLSearchParams(location.search).get('tenant');
  if (querySlug) return querySlug;
  const host = window.location.hostname.toLowerCase();
  const baseDomain = (import.meta.env.VITE_BASE_DOMAIN || 'bowan.com').toLowerCase();
  if (host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.slice(0, -(baseDomain.length + 1));
    if (subdomain && !['www', 'api'].includes(subdomain)) return subdomain;
  }
  return null;
}

export function TenantProvider({ children }) {
  const location = useLocation();
  const [tenant, setTenantState] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(false);

  const setTenant = useCallback((value) => {
    setTenantState(value || null);
    if (value?.slug) localStorage.setItem('bowan.tenantSlug', value.slug);
    else localStorage.removeItem('bowan.tenantSlug');
  }, []);

  const resolve = useCallback(async (slug) => {
    if (!slug) return setTenantState(null);
    setLoadingTenant(true);
    localStorage.setItem('bowan.tenantSlug', slug);
    try {
      const { data } = await api.get('/tenants/resolve', { params: { slug } });
      setTenantState(data.academy || data);
    } catch {
      setTenantState(null);
    } finally {
      setLoadingTenant(false);
    }
  }, []);

  useEffect(() => {
    const slug = slugFromLocation(location);
    if (slug) {
      resolve(slug);
    } else if (location.pathname.startsWith('/dashboard')) {
      const storedSlug = localStorage.getItem('bowan.tenantSlug');
      if (storedSlug && !tenant) resolve(storedSlug);
    } else {
      setTenantState(null);
      localStorage.removeItem('bowan.tenantSlug');
    }
  }, [location.pathname, location.search, resolve]);

  useEffect(() => {
    const primary = normalizeBrandColor(tenant?.primaryColor, DEFAULT_BRAND.primaryColor);
    const secondary = normalizeBrandColor(tenant?.secondaryColor, DEFAULT_BRAND.secondaryColor);
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    document.documentElement.style.setProperty('--primary-soft', `${primary}16`);
  }, [tenant]);

  const value = useMemo(() => ({ tenant, setTenant, loadingTenant }), [tenant, setTenant, loadingTenant]);
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const value = useContext(TenantContext);
  if (!value) throw new Error('useTenant must be used within TenantProvider');
  return value;
}
