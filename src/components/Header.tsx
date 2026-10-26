import { useMemo, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const navItems = [
  { label: 'New arrivals', to: '/new-arrivals' },
  { label: 'Shop', to: '/shop' },
  { label: 'Trending', to: '/trending' },
  { label: 'Collections', to: '/collections' },
  { label: 'Limited drops', to: '/drops' },
];

export function Header() {
  const { products, content, itemCount, wishlist } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const categories = useMemo(() => Array.from(new Map(products.filter((p) => p.published).map((p) => [p.categorySlug, { label: p.category, slug: p.categorySlug }])).values()), [products]);
  const matches = query.trim().length > 1
    ? products.filter((product) => product.published && `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : [];

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    setSearchOpen(false);
    setMobileOpen(false);
    if (value) navigate(`/shop?q=${encodeURIComponent(value)}`);
  };

  const closeMobile = () => setMobileOpen(false);

  return <>
    <div className={`announcement-bar${isHome ? ' announcement-home' : ''}`}>
      <span>{content.announcement}</span>
      <span className="announcement-right">Complimentary delivery over {content.freeDeliveryThreshold.toLocaleString('en-NP')} NPR <span aria-hidden="true">↗</span></span>
    </div>
    <header className="site-header">
      <div className="header-inner">
        <button className="icon-button mobile-menu-toggle" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <Link className="brand-wordmark" to="/" aria-label="AAVARAN home">AAVARAN<span className="brand-dot">.</span></Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => item.label === 'Shop' ? <div className="nav-shop" key={item.label}>
            <NavLink to={item.to} className={({ isActive }) => `nav-link ${isActive && location.pathname === '/shop' ? 'active' : ''}`}>Shop <span className="nav-chevron">⌄</span></NavLink>
            <div className="shop-menu">
              <div className="shop-menu-intro"><span className="eyebrow">Find your uniform</span><strong>Made for the everyday.</strong><Link to="/shop">Shop all <ArrowRight size={14} /></Link></div>
              <div className="shop-menu-links">
                {categories.map((category) => <Link key={category.slug} to={`/shop?category=${category.slug}`}>{category.label}<ArrowRight size={13} /></Link>)}
              </div>
              <div className="shop-menu-links">
                <Link to="/summer">Summer edit<ArrowRight size={13} /></Link>
                <Link to="/winter">Winter edit<ArrowRight size={13} /></Link>
                <Link to="/accessories">Accessories<ArrowRight size={13} /></Link>
                <Link to="/drops">Limited drops<ArrowRight size={13} /></Link>
              </div>
            </div>
          </div> : <NavLink key={item.label} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{item.label}</NavLink>)}
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="Search products" onClick={() => setSearchOpen(true)}><Search size={19} /></button>
          <Link className="icon-button account-link" to="/account" aria-label="Customer account"><UserRound size={19} /></Link>
          <Link className="icon-button wishlist-link" to="/wishlist" aria-label={`Wishlist, ${wishlist.length} items`}><Heart size={19} />{wishlist.length > 0 && <span className="tiny-count">{wishlist.length}</span>}</Link>
          <button className="bag-link" onClick={() => window.dispatchEvent(new CustomEvent('aavaran:open-cart'))} aria-label={`Shopping bag, ${itemCount} items`}>
            <ShoppingBag size={19} /><span className="bag-label">Bag</span><span className="bag-count">{itemCount}</span>
          </button>
        </div>
      </div>
      {mobileOpen && <div className="mobile-menu" aria-label="Mobile navigation">
        {navItems.map((item) => <Link key={item.label} to={item.to} onClick={closeMobile}>{item.label}<ArrowRight size={15} /></Link>)}
        <div className="mobile-menu-sub">
          <span className="eyebrow">Browse by category</span>
          {categories.map((category) => <Link key={category.slug} to={`/shop?category=${category.slug}`} onClick={closeMobile}>{category.label}</Link>)}
          <Link to="/summer" onClick={closeMobile}>Summer edit</Link><Link to="/winter" onClick={closeMobile}>Winter edit</Link><Link to="/accessories" onClick={closeMobile}>Accessories</Link>
        </div>
      </div>}
    </header>

    {searchOpen && <div className="search-layer" role="dialog" aria-modal="true" aria-label="Search AAVARAN" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
      <div className="search-panel">
        <div className="search-panel-top"><span className="eyebrow">Search the collection</span><button className="icon-button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={20} /></button></div>
        <form className="search-form" onSubmit={submitSearch}><Search size={21} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘overshirt’ or ‘summer’" aria-label="Search products" /><button type="submit" aria-label="Submit search"><ArrowRight size={20} /></button></form>
        <div className="search-suggestions">
          {matches.length > 0 ? matches.map((product) => <Link key={product.id} to={`/products/${product.slug}`} onClick={() => setSearchOpen(false)}><img src={product.images[0]} alt="" /><span>{product.name}<small>{product.category}</small></span><strong>NPR {product.price.toLocaleString('en-NP')}</strong></Link>) : <p>{query.length > 1 ? 'No matching pieces yet. Try another search.' : 'Popular: T-shirts · Overshirts · Summer edit'}</p>}
        </div>
      </div>
    </div>}
  </>;
}
