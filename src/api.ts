/**
 * api.ts — thin fetch wrapper for the POS Express API.
 * Falls back to local data when offline.
 */

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Products ──────────────────────────────────────────────────────────────
export interface ApiProduct {
  id: string;
  name: string;
  name_local: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  color: string;
  serial: string;
  image_url: string;
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  return get<ApiProduct[]>('/products');
}

// ── Sales ─────────────────────────────────────────────────────────────────
export interface ApiSale {
  id: string;
  receipt: string;
  total: number;
  items: number;
  status: 'SYNCED' | 'PENDING_UPLOAD' | 'CONFLICT';
  payload: unknown[];
  created_at: string;
}

export async function fetchSales(limit = 100): Promise<ApiSale[]> {
  return get<ApiSale[]>(`/sales?limit=${limit}`);
}

export async function createSale(sale: Omit<ApiSale, 'created_at'>): Promise<ApiSale> {
  return post<ApiSale>('/sales', sale);
}

// ── Auth ──────────────────────────────────────────────────────────────────
export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    initials: string;
    role: string;
  };
}

export async function login(username: string, password: string): Promise<LoginResult> {
  return post<LoginResult>('/auth/login', { username, password });
}

// ── Tenant (safe config) ──────────────────────────────────────────────────
export interface TenantConfig {
  app: {
    name: string;
    tagline: string;
    logoUrl: string;
    themeColor: string;
    currency: string;
    currencyLocale: string;
    taxRate: number;
    languages: string[];
    defaultLanguage: string;
  };
  store: { name: string; deviceId: string };
  categories: string[];
}

export async function fetchTenantConfig(): Promise<TenantConfig> {
  return get<TenantConfig>('/tenant');
}
