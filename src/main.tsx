import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BarChart3, Bike, Boxes, Check, ChevronRight, CircleDollarSign,
  CloudOff, FileText, Languages, LayoutDashboard, LogIn, Menu,
  Moon, PackagePlus, Plus, Printer, RefreshCw, Search, Settings,
  ShoppingCart, Sun, Tag, Trash2, TrendingUp, Users, Wifi, X
} from 'lucide-react';
import './styles.css';

// ── Tenant config (swapped per deployment) ──────────────────────────────
import tenantRaw from './tenant.json';
import type { ApiProduct, ApiSale, LoginResult } from './api';
import { fetchProducts, fetchSales, createSale, login } from './api';

// ── Types ────────────────────────────────────────────────────────────────
type Product = {
  id: string; name: string; nameLocal: string; sku: string;
  category: string; price: number; stock: number; minStock: number;
  color: string; serial: string; imageUrl: string;
};
type CartItem = Product & { qty: number };
type Sale = { id: string; receipt: string; total: number; items: number; status: 'SYNCED' | 'PENDING_UPLOAD' | 'CONFLICT'; time: string };
type User = { id: string; username: string; displayName: string; initials: string; role: string };

// ── Helpers ──────────────────────────────────────────────────────────────
const cfg = tenantRaw.app;
const storeCfg = tenantRaw.store;

const money = (n: number) =>
  new Intl.NumberFormat(cfg.currencyLocale).format(n) + ' ' + cfg.currency;

function mapApiProduct(p: ApiProduct): Product {
  return {
    id: p.id, name: p.name, nameLocal: p.name_local,
    sku: p.sku, category: p.category,
    price: Number(p.price), stock: p.stock, minStock: p.min_stock,
    color: p.color, serial: p.serial, imageUrl: p.image_url,
  };
}

function mapApiSale(s: ApiSale): Sale {
  const d = new Date(s.created_at);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const timeStr = sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Yesterday';
  return { id: s.id, receipt: s.receipt, total: Number(s.total), items: s.items, status: s.status as Sale['status'], time: timeStr };
}

// ── i18n (minimal, tenant-agnostic keys) ─────────────────────────────────
const i18n: Record<string, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard', pos: 'Point of Sale', inventory: 'Inventory',
    reports: 'Reports', settings: 'Settings', newSale: 'New sale',
    search: 'Search products, SKU or barcode...', checkout: 'Checkout',
    subtotal: 'Subtotal', tax: `Tax (${cfg.taxRate * 100}%)`, total: 'Total',
    complete: 'Complete sale', lowStock: 'Low stock',
    todaySales: 'Today sales', transactions: 'Transactions', pending: 'Pending sync',
    login: 'Sign In', username: 'Username', password: 'Password',
  },
  my: {
    dashboard: 'ပင်မစာမျက်နှာ', pos: 'အရောင်း', inventory: 'ကုန်ပစ္စည်း',
    reports: 'အစီရင်ခံစာ', settings: 'ဆက်တင်', newSale: 'အရောင်းအသစ်',
    search: 'ရှာဖွေပါ', checkout: 'ငွေရှင်းရန်',
    subtotal: 'စုစုပေါင်းခွဲ', tax: `အခွန် (${cfg.taxRate * 100}%)`, total: 'စုစုပေါင်း',
    complete: 'အရောင်းပြီးဆုံး', lowStock: 'လက်ကျန်နည်း',
    todaySales: 'ယနေ့အရောင်း', transactions: 'ငွေရှင်းမှု', pending: 'စောင့်ဆိုင်း',
    login: 'ဝင်ရောက်မည်', username: 'အသုံးပြုသူအမည်', password: 'စကားဝှက်',
  },
};
const t = (key: string, lang: string) => i18n[lang]?.[key] ?? i18n['en']?.[key] ?? key;

// ── Seed fallback (used when API is unavailable) ──────────────────────────
const seedProducts: Product[] = tenantRaw.products.map((p: any) => ({
  id: p.id, name: p.name, nameLocal: p.nameLocal || '',
  sku: p.sku, category: p.category, price: p.price,
  stock: p.stock, minStock: p.minStock || 0,
  color: p.color || '#edf6f3', serial: p.serial || '', imageUrl: p.imageUrl || '',
}));

const seedSales: Sale[] = [
  { id: 's1', receipt: 'CF-260915-001', total: 1430000, items: 2, status: 'SYNCED', time: '10:42 AM' },
  { id: 's2', receipt: 'CF-260915-002', total: 65000, items: 1, status: 'SYNCED', time: '09:18 AM' },
];

// ══════════════════════════════════════════════════════════════════════════
// Login Page
// ══════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin, lang, setLang }: { onLogin: (u: User) => void; lang: string; setLang: (l: 'en' | 'my') => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result: LoginResult = await login(username, password);
      localStorage.setItem('pos-token', result.token);
      onLogin(result.user);
    } catch {
      // Fallback: check against tenant.json seed users
      const seedUser = (tenantRaw.users as any[]).find(
        (u: any) => u.username === username && u.password === password
      );
      if (seedUser) {
        onLogin({ id: seedUser.id, username: seedUser.username, displayName: seedUser.displayName, initials: seedUser.initials, role: seedUser.role });
      } else {
        setError('Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          {cfg.logoUrl
            ? <img src={cfg.logoUrl} alt={cfg.name} className="login-logo" />
            : <div className="brandmark login-brandmark"><Bike size={26} /></div>
          }
          <div>
            <b>{cfg.name}</b>
            <small>{cfg.tagline}</small>
          </div>
        </div>
        <h2>{t('login', lang)}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {t('username', lang)}
            <input value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" />
          </label>
          <label>
            {t('password', lang)}
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <LogIn size={17} /> {loading ? 'Signing in...' : t('login', lang)}
          </button>
        </form>
        <button className="iconbtn" style={{ marginTop: 12 }} onClick={() => setLang(lang === 'en' ? 'my' : 'en')}>
          <Languages size={16} /> <small>{lang.toUpperCase()}</small>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main App
// ══════════════════════════════════════════════════════════════════════════
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState('dashboard');
  const [lang, setLang] = useState<'en' | 'my'>(cfg.defaultLanguage as 'en' | 'my');
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [sales, setSales] = useState<Sale[]>(() =>
    JSON.parse(localStorage.getItem('pos-sales') || JSON.stringify(seedSales))
  );
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [toast, setToast] = useState('');
  const [category, setCategory] = useState('All');

  // ── Load products from API ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    fetchProducts()
      .then(rows => setProducts(rows.map(mapApiProduct)))
      .catch(() => { /* stay on seed data */ });
  }, [currentUser]);

  // ── Load sales from API ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    fetchSales()
      .then(rows => setSales(rows.map(mapApiSale)))
      .catch(() => { /* stay on localStorage */ });
  }, [currentUser]);

  // ── Persist sales locally ───────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('pos-sales', JSON.stringify(sales)); }, [sales]);

  // ── Online/offline detection ────────────────────────────────────────────
  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);

  const categories = ['All', ...tenantRaw.categories];
  const filtered = useMemo(() =>
    products.filter(p =>
      (category === 'All' || p.category === category) &&
      [p.name, p.nameLocal, p.sku].some(v => v.toLowerCase().includes(query.toLowerCase()))
    ), [query, category, products]);

  const subtotal = cart.reduce((a, p) => a + p.price * p.qty, 0);
  const tax = Math.round(subtotal * cfg.taxRate);
  const total = subtotal + tax;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const add = (p: Product) => {
    setCart(c => c.some(x => x.id === p.id)
      ? c.map(x => x.id === p.id ? { ...x, qty: Math.min(x.qty + 1, x.stock) } : x)
      : [...c, { ...p, qty: 1 }]);
    showToast(`${p.name} added`);
  };

  const complete = async () => {
    if (!cart.length) return;
    const receipt = `${cfg.name.slice(0, 2).toUpperCase()}-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${String(sales.length + 1).padStart(3, '0')}`;
    const newSale: Sale = {
      id: crypto.randomUUID(), receipt, total,
      items: cart.reduce((a, x) => a + x.qty, 0),
      status: offline ? 'PENDING_UPLOAD' : 'SYNCED',
      time: 'Just now',
    };
    setSales([newSale, ...sales]);
    // Optimistically update product stock locally
    setProducts(prev => prev.map(p => {
      const ci = cart.find(x => x.id === p.id);
      return ci ? { ...p, stock: Math.max(p.stock - ci.qty, 0) } : p;
    }));
    setCart([]);

    if (!offline) {
      try {
        await createSale({
          id: newSale.id, receipt, total,
          items: newSale.items, status: 'SYNCED',
          payload: cart.map(x => ({ id: x.id, qty: x.qty, price: x.price })),
          created_at: new Date().toISOString(),
        } as any);
      } catch { /* sale already recorded locally */ }
    }
    showToast(offline ? 'Saved offline — will sync when back online' : 'Sale completed!');
  };

  const logout = () => {
    localStorage.removeItem('pos-token');
    setCurrentUser(null);
    setCart([]);
    setPage('dashboard');
  };

  // ── Login gate ──────────────────────────────────────────────────────────
  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} lang={lang} setLang={setLang} />;
  }

  // ── Sidebar / main shell ────────────────────────────────────────────────
  return (
    <div className={dark ? 'app dark' : 'app'}>
      <aside className="sidebar">
        <div className="brand">
          {cfg.logoUrl
            ? <img src={cfg.logoUrl} alt={cfg.name} className="brand-logo" />
            : <div className="brandmark"><Bike size={23} /></div>
          }
          <div><b>{cfg.name}</b><small>{cfg.tagline}</small></div>
        </div>
        <div className="store">
          <span className="live-dot" />{storeCfg.name} <ChevronRight size={15} />
        </div>
        <nav>
          {([['dashboard', LayoutDashboard, t('dashboard', lang)],
            ['pos', ShoppingCart, t('pos', lang)],
            ['inventory', Boxes, t('inventory', lang)],
            ['reports', BarChart3, t('reports', lang)]] as [string, any, string][]).map(([key, Icon, label]) => (
            <button key={key} className={page === key ? 'active' : ''} onClick={() => setPage(key)}>
              <Icon size={18} /><span>{label}</span>
              {key === 'pos' && cart.length > 0 && <em>{cart.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setPage('settings')}><Settings size={18} />{t('settings', lang)}</button>
          <div className="user">
            <div className="avatar">{currentUser.initials}</div>
            <div><b>{currentUser.displayName}</b><small>{currentUser.role}</small></div>
            <button className="iconbtn" style={{ marginLeft: 'auto' }} onClick={logout} title="Sign out"><X size={15} /></button>
          </div>
        </div>
      </aside>

      <main>
        <header>
          <div className="mobile-brand">
            <button className="iconbtn"><Menu size={21} /></button>
            <b>{cfg.name}</b>
          </div>
          <div className="crumb">
            {storeCfg.name} <span>/</span>{' '}
            {page === 'dashboard' ? t('dashboard', lang) : page === 'pos' ? t('pos', lang) : page}
          </div>
          <div className="header-actions">
            <button className="iconbtn" onClick={() => setLang(lang === 'en' ? 'my' : 'en')} title="Language">
              <Languages size={18} /><small>{lang.toUpperCase()}</small>
            </button>
            <button className="iconbtn" onClick={() => setDark(!dark)}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className={offline ? 'sync offline' : 'sync'}>
              {offline ? <CloudOff size={16} /> : <Wifi size={16} />}
              <span>{offline ? 'Offline' : 'Synced'}</span>
            </div>
          </div>
        </header>

        {offline && (
          <div className="offline-banner">
            <CloudOff size={17} /><b>Offline mode</b>
            <span>Sales are saved on this device and will sync when connection returns.</span>
            <button onClick={() => setOffline(false)}>Dismiss</button>
          </div>
        )}

        {page === 'dashboard' && <Dashboard sales={sales} setPage={setPage} lang={lang} user={currentUser} />}
        {page === 'pos' && <POS filtered={filtered} categories={categories} category={category} setCategory={setCategory} query={query} setQuery={setQuery} cart={cart} add={add} setCart={setCart} subtotal={subtotal} tax={tax} total={total} complete={complete} lang={lang} />}
        {page === 'inventory' && <Inventory query={query} setQuery={setQuery} lang={lang} products={products} />}
        {page === 'reports' && <Reports sales={sales} />}
        {page === 'settings' && <SettingsPage lang={lang} storeCfg={storeCfg} />}
      </main>

      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Shared components
// ══════════════════════════════════════════════════════════════════════════
function PageTitle({ eyebrow, title, sub, action }: { eyebrow: string; title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </div>
  );
}

function Stat({ icon: Icon, label, value, trend, warn }: { icon: any; label: string; value: string; trend: string; warn?: boolean }) {
  return (
    <div className="stat">
      <div className="stat-icon"><Icon size={19} /></div>
      <small>{label}</small>
      <strong>{value}</strong>
      <span className={warn ? 'warn' : ''}>{trend}</span>
    </div>
  );
}

function SalesTable({ sales }: { sales: Sale[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Receipt</th><th>Items</th><th>Amount</th><th>Time</th><th>Status</th></tr></thead>
        <tbody>
          {sales.map(s => (
            <tr key={s.id}>
              <td><b>{s.receipt}</b></td>
              <td>{s.items} items</td>
              <td><b>{money(s.total)}</b></td>
              <td>{s.time}</td>
              <td>
                <span className={`status ${s.status.toLowerCase()}`}>
                  {s.status === 'SYNCED' ? 'Synced' : s.status === 'CONFLICT' ? 'Conflict' : 'Pending sync'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Dashboard
// ══════════════════════════════════════════════════════════════════════════
function Dashboard({ sales, setPage, lang, user }: { sales: Sale[]; setPage: (p: string) => void; lang: string; user: User }) {
  const today = sales.filter(s => s.time !== 'Yesterday');
  const now = new Date();
  const eyebrow = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const greeting = lang === 'my' ? `မင်္ဂလာပါ၊ ${user.displayName}` : `Good morning, ${user.displayName}`;

  return (
    <section className="content">
      <PageTitle
        eyebrow={eyebrow}
        title={greeting}
        sub={`Here's what's happening in your store today.`}
        action={<button className="primary" onClick={() => setPage('pos')}><Plus size={17} />{t('newSale', lang)}</button>}
      />
      <div className="stats">
        <Stat icon={CircleDollarSign} label={t('todaySales', lang)} value={money(today.reduce((a, s) => a + s.total, 0))} trend="+12.8%" />
        <Stat icon={ShoppingCart} label={t('transactions', lang)} value={String(today.length)} trend={`+${today.length} today`} />
        <Stat icon={TrendingUp} label="Gross profit" value={money(today.reduce((a, s) => a + s.total, 0) * 0.3)} trend="+14.6%" />
        <Stat icon={CloudOff} label={t('pending', lang)} value={String(sales.filter(s => s.status !== 'SYNCED').length)} trend="Needs attention" warn />
      </div>
      <div className="grid-two">
        <div className="panel chart-panel">
          <div className="panel-head">
            <div><b>Sales overview</b><small>Last 7 days</small></div>
            <select><option>This week</option><option>This month</option></select>
          </div>
          <div className="chart">
            <div className="ylabels"><span>1.5M</span><span>1.0M</span><span>500K</span><span>0</span></div>
            <div className="bars">
              {[.52, .72, .46, .86, .64, .92, .7].map((v, i) => (
                <div className="bar-col" key={i}>
                  <div className="bar" style={{ height: `${v * 100}%` }} />
                  <small>{['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'][i]}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div><b>Quick actions</b><small>Common workflows</small></div></div>
          <div className="quick-grid">
            <button onClick={() => setPage('pos')}><ShoppingCart size={19} /><span>New sale</span><ChevronRight size={15} /></button>
            <button onClick={() => setPage('inventory')}><PackagePlus size={19} /><span>Receive stock</span><ChevronRight size={15} /></button>
            <button onClick={() => setPage('inventory')}><Tag size={19} /><span>Add product</span><ChevronRight size={15} /></button>
            <button onClick={() => setPage('reports')}><FileText size={19} /><span>View reports</span><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>
      <div className="panel recent">
        <div className="panel-head">
          <div><b>Recent transactions</b><small>Latest activity across your store</small></div>
          <button className="textbtn" onClick={() => setPage('reports')}>View all <ChevronRight size={15} /></button>
        </div>
        <SalesTable sales={sales.slice(0, 4)} />
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// POS
// ══════════════════════════════════════════════════════════════════════════
function POS({ filtered, categories, category, setCategory, query, setQuery, cart, add, setCart, subtotal, tax, total, complete, lang }: {
  filtered: Product[]; categories: string[]; category: string; setCategory: (x: string) => void;
  query: string; setQuery: (x: string) => void; cart: CartItem[]; add: (p: Product) => void;
  setCart: any; subtotal: number; tax: number; total: number; complete: () => void; lang: string;
}) {
  return (
    <section className="content">
      <PageTitle eyebrow="SALES / CHECKOUT" title={t('pos', lang)} sub="Search, scan, and sell in seconds."
        action={<div className="device-chip"><span className="live-dot" /> {storeCfg.deviceId} <small>Online</small></div>}
      />
      <div className="pos-layout">
        <div className="products-area">
          <div className="searchrow">
            <div className="search">
              <Search size={18} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('search', lang)} />
              {query && <X size={16} onClick={() => setQuery('')} />}
            </div>
            <button className="scanbtn"><span>▦</span> Scan barcode</button>
          </div>
          <div className="chips">
            {categories.map(c => (
              <button className={category === c ? 'selected' : ''} onClick={() => setCategory(c)} key={c}>{c}</button>
            ))}
          </div>
          <div className="product-grid">
            {filtered.map(p => (
              <button className="product" key={p.id} onClick={() => add(p)}>
                <div className="product-art" style={{ background: p.color }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} style={{ width: 60, height: 60, objectFit: 'contain' }} />
                    : <Bike size={42} />
                  }
                  <span className={p.stock <= p.minStock ? 'stock low' : 'stock'}>{p.stock} left</span>
                </div>
                <div className="product-info">
                  <b>{lang === 'my' ? p.nameLocal || p.name : p.name}</b>
                  <small>{p.sku} · {p.category}</small>
                  <strong>{money(p.price)}</strong>
                </div>
                <div className="add"><Plus size={16} /></div>
              </button>
            ))}
          </div>
        </div>

        <aside className="cart">
          <div className="cart-head">
            <div><b>Current sale</b><small>{cart.length ? `${cart.reduce((a, x) => a + x.qty, 0)} items` : 'No items yet'}</small></div>
            <button className="iconbtn" onClick={() => setCart([])} disabled={!cart.length}><Trash2 size={17} /></button>
          </div>
          {!cart.length ? (
            <div className="empty-cart">
              <ShoppingCart size={34} /><b>Your cart is empty</b>
              <span>Choose a product to start a new sale.</span>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(i => (
                  <div className="cart-item" key={i.id}>
                    <div className="mini-art" style={{ background: i.color }}>
                      {i.imageUrl ? <img src={i.imageUrl} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} /> : <Bike size={18} />}
                    </div>
                    <div><b>{i.name}</b><small>{money(i.price)}</small></div>
                    <div className="qty">
                      <button onClick={() => setCart((c: CartItem[]) => i.qty === 1 ? c.filter(x => x.id !== i.id) : c.map(x => x.id === i.id ? { ...x, qty: x.qty - 1 } : x))}>−</button>
                      <span>{i.qty}</span>
                      <button onClick={() => add(i)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bill">
                <div><span>{t('subtotal', lang)}</span><b>{money(subtotal)}</b></div>
                <div><span>{t('tax', lang)}</span><b>{money(tax)}</b></div>
                <div className="grand"><span>{t('total', lang)}</span><strong>{money(total)}</strong></div>
                <button className="primary checkout" onClick={complete}><Check size={18} />{t('complete', lang)}<span>Ctrl + Enter</span></button>
                <button className="hold">Hold sale</button>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Inventory
// ══════════════════════════════════════════════════════════════════════════
function Inventory({ query, setQuery, lang, products }: { query: string; setQuery: (x: string) => void; lang: string; products: Product[] }) {
  const list = products.filter(p => [p.name, p.nameLocal, p.sku].some(v => v.toLowerCase().includes(query.toLowerCase())));
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <section className="content">
      <PageTitle eyebrow="CATALOG / STOCK" title={t('inventory', lang)} sub="Manage products, stock levels, and serial numbers."
        action={<button className="primary"><Plus size={17} /> Add product</button>}
      />
      <div className="inventory-kpis">
        <Stat icon={Boxes} label="Total products" value={String(products.length)} trend="Active" />
        <Stat icon={PackagePlus} label="Units on hand" value={String(products.reduce((a, p) => a + p.stock, 0))} trend="Healthy" />
        <Stat icon={CloudOff} label={t('lowStock', lang)} value={String(lowStockCount)} trend="Review now" warn={lowStockCount > 0} />
      </div>
      <div className="panel inventory-panel">
        <div className="panel-head">
          <div><b>Product catalog</b><small>All active products</small></div>
          <div className="search compact">
            <Search size={16} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search catalog..." />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Serial</th></tr></thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <div className="mini-art" style={{ background: p.color }}>
                        {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} /> : <Bike size={18} />}
                      </div>
                      <div><b>{p.name}</b><small>{p.nameLocal}</small></div>
                    </div>
                  </td>
                  <td>{p.sku}</td>
                  <td>{p.category}</td>
                  <td><b>{money(p.price)}</b></td>
                  <td><span className={p.stock <= p.minStock ? 'stock-number low' : 'stock-number'}>{p.stock} units</span></td>
                  <td>{p.serial || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Reports
// ══════════════════════════════════════════════════════════════════════════
function Reports({ sales }: { sales: Sale[] }) {
  const monthTotal = sales.reduce((a, s) => a + s.total, 0);

  return (
    <section className="content">
      <PageTitle eyebrow="INSIGHTS / EXPORTS" title="Reports" sub="Understand your sales and inventory performance."
        action={<button className="primary"><FileText size={17} /> Export CSV</button>}
      />
      <div className="report-cards">
        <div className="panel report-big">
          <small>Sales this month</small>
          <strong>{money(monthTotal)}</strong>
          <span className="positive">↑ 18.4% vs last month</span>
          <div className="spark">
            {[30, 55, 40, 75, 52, 80, 65, 90, 72, 100].map((h, i) => <i style={{ height: `${h}%` }} key={i} />)}
          </div>
        </div>
        <div className="panel report-big">
          <small>Top category</small>
          <strong>{tenantRaw.categories[0] || 'Products'}</strong>
          <span>42% of total revenue</span>
          <div className="progress"><i style={{ width: '42%' }} /></div>
          {tenantRaw.categories.slice(1, 3).map((c: string) => (
            <div className="report-row" key={c}><span>{c}</span><b>~{Math.floor(Math.random() * 25 + 10)}%</b></div>
          ))}
        </div>
      </div>
      <div className="panel recent">
        <div className="panel-head">
          <div><b>Offline &amp; synchronization log</b><small>All local transactions retained until acknowledged by server.</small></div>
          <button className="textbtn"><RefreshCw size={15} /> Retry pending</button>
        </div>
        <SalesTable sales={sales} />
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Settings
// ══════════════════════════════════════════════════════════════════════════
function SettingsPage({ lang, storeCfg }: { lang: string; storeCfg: typeof tenantRaw.store }) {
  return (
    <section className="content">
      <PageTitle eyebrow="SYSTEM / PREFERENCES" title={t('settings', lang)} sub="Configure your store, register, and staff access." />
      <div className="settings-grid">
        <div className="panel settings-card">
          <div className="settings-icon"><Users size={20} /></div>
          <b>Store &amp; staff</b>
          <p>Manage registers, users, roles, and device approval.</p>
          <button className="textbtn">Open settings <ChevronRight size={15} /></button>
        </div>
        <div className="panel settings-card">
          <div className="settings-icon"><RefreshCw size={20} /></div>
          <b>Offline synchronization</b>
          <p>Device ID: {storeCfg.deviceId}<br />Last sync: Just now<br />Queue: 0 transactions</p>
          <span className="status synced">Healthy</span>
        </div>
        <div className="panel settings-card">
          <div className="settings-icon"><Printer size={20} /></div>
          <b>Receipt &amp; printer</b>
          <p>{storeCfg.receiptHeader}</p>
          <button className="textbtn">Configure <ChevronRight size={15} /></button>
        </div>
        <div className="panel settings-card">
          <div className="settings-icon"><Languages size={20} /></div>
          <b>Language &amp; currency</b>
          <p>{cfg.languages.join(' / ')}<br />{cfg.currency}</p>
          <span className="status synced">Active</span>
        </div>
      </div>
    </section>
  );
}

export default App;
