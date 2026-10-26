import { useMemo, useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatNpr } from '../lib/format';
import { ProductGrid } from '../components/ProductGrid';

export type ShopKind = 'all' | 'new' | 'trending' | 'summer' | 'winter' | 'accessories' | 'collection';

const collectionInfo: Record<string, { title: string; intro: string; image: string }> = {
  'everyday-uniform': { title: 'The Everyday Uniform', intro: 'Easy, considered essentials for the many small moments that make up a day.', image: '/images/hero-campaign.jpg' },
  'summer': { title: 'Summer Edit', intro: 'Relaxed shirts, easy tees, and useful pieces in a lighter palette.', image: '/images/campaign-summer.jpg' },
  'winter': { title: 'Winter Edit', intro: 'Comfortable layers, thoughtful proportions, and everyday warmth.', image: '/images/product-hoodie.jpg' },
  'accessories': { title: 'Accessories', intro: 'Small details to make the everyday feel like your own.', image: '/images/accessories-stilllife.jpg' },
  'drop-001': { title: 'Drop 001', intro: 'A first-edition story from the AAVARAN archive.', image: '/images/hero-campaign.jpg' },
};

const kindCopy: Record<ShopKind, { title: string; intro: string; image?: string; eyebrow: string }> = {
  all: { title: 'Shop all', intro: 'Considered essentials for the everyday, in a palette that goes with the way you move.', eyebrow: 'The full collection' },
  new: { title: 'New arrivals', intro: 'The latest pieces, sorted by publication date. Fresh additions to the everyday rotation.', eyebrow: 'Just landed' },
  trending: { title: 'Trending now', intro: 'A team-curated edit. Featured pieces are selected in the catalogue; no sales figures are implied.', eyebrow: 'The current edit' },
  summer: { title: 'Summer edit', intro: 'Relaxed shirts, easy tees, and useful pieces in a lighter palette.', image: '/images/campaign-summer.jpg', eyebrow: 'Longer days, lighter layers' },
  winter: { title: 'Winter edit', intro: 'Hoodies, overshirts, and dependable layers for cooler days.', image: '/images/product-hoodie.jpg', eyebrow: 'Layers, thoughtfully' },
  accessories: { title: 'Accessories', intro: 'Small details, made to move with you.', image: '/images/accessories-stilllife.jpg', eyebrow: 'The finishing touch' },
  collection: { title: 'Collection', intro: 'Explore the AAVARAN edit.', eyebrow: 'Collections' },
};

function uniqueOptions<T>(values: T[]) { return [...new Set(values)]; }

export default function ShopPage({ kind = 'all', collectionSlug }: { kind?: ShopKind; collectionSlug?: string }) {
  const { products } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const published = products.filter((product) => product.published);
  const query = (searchParams.get('q') || '').trim();
  const sort = searchParams.get('sort') || (kind === 'new' ? 'newest' : '');
  const categoryFilter = searchParams.get('category') || '';
  const sizeFilter = searchParams.get('size') || '';
  const colorFilter = searchParams.get('color') || '';
  const priceFilter = searchParams.get('price') || '';
  const availabilityFilter = searchParams.get('availability') || '';
  const collectionFilter = searchParams.get('collection') || '';

  const info = kind === 'collection' && collectionSlug ? {
    title: collectionInfo[collectionSlug]?.title || collectionSlug.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' '),
    intro: collectionInfo[collectionSlug]?.intro || 'A considered edit from the AAVARAN collection.',
    image: collectionInfo[collectionSlug]?.image,
    eyebrow: 'AAVARAN collection',
  } : kindCopy[kind];

  const scopedProducts = useMemo(() => {
    let result = published;
    if (kind === 'new') result = [...result].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    if (kind === 'trending') result = result.filter((product) => product.featuredTrending && product.dropStatus !== 'ended');
    if (kind === 'summer') result = result.filter((product) => product.season === 'summer' || product.collections.includes('summer'));
    if (kind === 'winter') result = result.filter((product) => product.season === 'winter' || product.collections.includes('winter'));
    if (kind === 'accessories') result = result.filter((product) => product.categorySlug === 'accessories');
    if (kind === 'collection' && collectionSlug) result = result.filter((product) => product.collections.includes(collectionSlug));
    return result;
  }, [published, kind, collectionSlug]);

  const filteredProducts = useMemo(() => {
    let result = [...scopedProducts];
    if (query) result = result.filter((product) => `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.toLowerCase()));
    if (categoryFilter) result = result.filter((product) => product.categorySlug === categoryFilter);
    if (sizeFilter) result = result.filter((product) => product.variants.some((variant) => variant.size === sizeFilter && variant.active));
    if (colorFilter) result = result.filter((product) => product.colors.some((color) => color.name === colorFilter));
    if (availabilityFilter === 'in-stock') result = result.filter((product) => product.variants.some((variant) => variant.active && variant.stock > 0) && product.dropStatus !== 'ended');
    if (collectionFilter) result = result.filter((product) => product.collections.includes(collectionFilter));
    if (priceFilter === 'under-3000') result = result.filter((product) => product.price < 3000);
    if (priceFilter === '3000-6000') result = result.filter((product) => product.price >= 3000 && product.price <= 6000);
    if (priceFilter === 'over-6000') result = result.filter((product) => product.price > 6000);
    if (sort === 'newest') result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort === 'popular') result.sort((a, b) => b.popularityScore - a.popularityScore);
    return result;
  }, [scopedProducts, query, categoryFilter, sizeFilter, colorFilter, priceFilter, availabilityFilter, collectionFilter, sort]);

  const categories = uniqueOptions(published.map((product) => ({ value: product.categorySlug, label: product.category })) .map((item) => JSON.stringify(item))).map((item) => JSON.parse(item) as { value: string; label: string });
  const sizes = uniqueOptions(scopedProducts.flatMap((product) => product.sizes)).filter((size) => size !== 'One size');
  const colors = uniqueOptions(scopedProducts.flatMap((product) => product.colors.map((color) => color.name)));
  const collections = uniqueOptions(scopedProducts.flatMap((product) => product.collections)).filter((item) => !['new-arrivals', 'trending', 'drop-001'].includes(item));
  const activeCount = [categoryFilter, sizeFilter, colorFilter, priceFilter, availabilityFilter, collectionFilter].filter(Boolean).length;
  const updateParam = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(name, value); else params.delete(name);
    setSearchParams(params, { replace: true });
    setVisibleCount(8);
  };
  const clearFilters = () => { const params = new URLSearchParams(); if (query) params.set('q', query); if (sort) params.set('sort', sort); setSearchParams(params, { replace: true }); };

  useEffect(() => { setVisibleCount(8); }, [kind, collectionSlug, searchParams.toString()]);

  return <main className="shop-page">
    <section className={`shop-hero page-shell ${info.image ? 'shop-hero-image' : ''}`}>
      {info.image && <div className="shop-hero-image-wrap"><img src={info.image} alt="" /></div>}
      <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>{info.title}</span></div>
      <div className="shop-hero-copy"><span className="eyebrow">{info.eyebrow}</span><h1>{query ? `Search: “${query}”` : info.title}<span>.</span></h1><p>{info.intro}</p>{kind === 'new' && <small>Newest pieces are ordered by publication date.</small>}</div>
      <div className="shop-hero-foot"><span>AAVARAN · {published.length} EDITABLE DEMO PIECES</span><span>01 — 10</span></div>
    </section>
    <section className="shop-main page-shell">
      <div className="shop-toolbar-top"><div className="category-pills"><Link to="/shop" className={!categoryFilter ? 'active' : ''}>All</Link>{categories.map((category) => <button key={category.value} className={categoryFilter === category.value ? 'active' : ''} onClick={() => updateParam('category', category.value)}>{category.label}</button>)}</div><button className="filter-mobile-trigger" onClick={() => setMobileFiltersOpen(true)}><SlidersHorizontal size={15} /> Filters {activeCount > 0 && <span>{activeCount}</span>}</button></div>
      <div className="shop-toolbar"><span className="product-count">{filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}</span><div className="toolbar-controls">{activeCount > 0 && <button className="clear-filters-link" onClick={clearFilters}>Clear filters <X size={13} /></button>}<label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => updateParam('sort', event.target.value)} aria-label="Sort products"><option value="">Recommended</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="popular">Popularity</option></select><ChevronDown size={14} /></label></div></div>
      <div className="shop-layout">
        <aside className={`filter-sidebar ${mobileFiltersOpen ? 'filter-open' : ''}`}>
          <div className="filter-mobile-head"><span>Filter by</span><button className="icon-button" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)}><X size={19} /></button></div>
          <div className="filter-head"><span>Filter by</span>{activeCount > 0 && <button onClick={clearFilters}>Clear all</button>}</div>
          <FilterSelect label="Category" value={categoryFilter} options={categories.map((item) => ({ value: item.value, label: item.label }))} onChange={(value) => updateParam('category', value)} />
          <FilterSelect label="Size" value={sizeFilter} options={sizes.map((size) => ({ value: size, label: size }))} onChange={(value) => updateParam('size', value)} />
          <FilterSelect label="Colour" value={colorFilter} options={colors.map((color) => ({ value: color, label: color }))} onChange={(value) => updateParam('color', value)} />
          <FilterSelect label="Price" value={priceFilter} options={[{ value: 'under-3000', label: `Under ${formatNpr(3000)}` }, { value: '3000-6000', label: `${formatNpr(3000)}–${formatNpr(6000)}` }, { value: 'over-6000', label: `Over ${formatNpr(6000)}` }]} onChange={(value) => updateParam('price', value)} />
          <FilterSelect label="Availability" value={availabilityFilter} options={[{ value: 'in-stock', label: 'In stock' }, { value: 'all', label: 'All items' }]} onChange={(value) => updateParam('availability', value === 'all' ? '' : value)} />
          <FilterSelect label="Collection" value={collectionFilter} options={collections.map((collection) => ({ value: collection, label: collection.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }))} onChange={(value) => updateParam('collection', value)} />
          <div className="filter-note"><span className="filter-note-icon">i</span><p>Stock quantities are demo data. Final availability is checked when an order is placed.</p></div>
          <button className="button button-dark button-full filter-apply" onClick={() => setMobileFiltersOpen(false)}>Show {filteredProducts.length} pieces</button>
        </aside>
        {mobileFiltersOpen && <button className="filter-scrim" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} />}
        <div className="shop-results">
          {activeCount > 0 && <div className="active-filters">{[[categoryFilter, 'category'], [sizeFilter, 'size'], [colorFilter, 'color'], [priceFilter, 'price'], [availabilityFilter, 'availability'], [collectionFilter, 'collection']].filter(([value]) => value).map(([value, key]) => <button key={key} onClick={() => updateParam(key as string, '')}>{String(value).replace(/-/g, ' ')} <X size={12} /></button>)}</div>}
          <ProductGrid products={filteredProducts.slice(0, visibleCount)} />
          {filteredProducts.length > visibleCount && <div className="load-more-wrap"><span>Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} pieces</span><button className="button button-outline" onClick={() => setVisibleCount((count) => count + 8)}>Load more <ArrowRight size={15} /></button></div>}
        </div>
      </div>
    </section>
  </main>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <details className="filter-group" open={label === 'Category' || !!value}><summary>{label}<ChevronDown size={14} /></summary><div className="filter-options"><button className={!value ? 'filter-option active' : 'filter-option'} onClick={() => onChange('')}>All</button>{options.map((option) => <button key={option.value} className={value === option.value ? 'filter-option active' : 'filter-option'} onClick={() => onChange(option.value)}>{option.label}<span>{value === option.value ? '✓' : ''}</span></button>)}</div></details>;
}
