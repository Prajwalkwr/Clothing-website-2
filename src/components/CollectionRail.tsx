import { useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../data/types';
import { formatNpr } from '../lib/format';

const featuredSlugs = [
  'kathmandu-boxy-shirt',
  'utility-overshirt',
  'core-pullover-hoodie',
  'lightweight-summer-shirt',
  'everyday-oversized-tee',
];

export function CollectionRail({ products }: { products: Product[] }) {
  const railProducts = featuredSlugs
    .map((slug) => products.find((product) => product.slug === slug && product.published))
    .filter((product): product is Product => Boolean(product));
  const initialProduct = railProducts.find((product) => product.slug === 'core-pullover-hoodie') ?? railProducts[0];
  const [selectedId, setSelectedId] = useState(initialProduct?.id ?? '');
  const [hoveredId, setHoveredId] = useState('');
  const selectedProduct = railProducts.find((product) => product.id === selectedId) ?? initialProduct;
  const hoveredProduct = railProducts.find((product) => product.id === hoveredId);

  if (railProducts.length === 0 || !selectedProduct) return null;

  return <section className="collection-rail-section" aria-labelledby="collection-rail-title">
    <div className="collection-rail-heading page-shell">
      <div>
        <span className="eyebrow">New collection <i /> Premium everyday wear</span>
        <h2 id="collection-rail-title">The pieces on <em>our rail.</em></h2>
      </div>
      <p>Meet the latest edit.<br />Hover to preview, select to explore.</p>
    </div>

    <div className="collection-rail-scene">
      <div className="rail-track" aria-hidden="true" />
      <div className="collection-rail-items">
        {railProducts.map((product, index) => <button
          type="button"
          key={product.id}
          className={`rail-piece${product.id === selectedId ? ' is-selected' : ''}${product.id === hoveredId ? ' is-previewed' : ''}`}
          aria-label={`Select ${product.name} for details`}
          aria-pressed={product.id === selectedId}
          onMouseEnter={() => setHoveredId(product.id)}
          onMouseLeave={() => setHoveredId('')}
          onFocus={() => setHoveredId(product.id)}
          onBlur={() => setHoveredId('')}
          onClick={() => setSelectedId(product.id)}
        >
          <span className="rail-piece-number">0{index + 1}</span>
          <HangingGarment product={product} />
          <span className="rail-piece-label">
            <strong>{product.name}</strong>
            <small>{formatNpr(product.price)}</small>
          </span>
          {product.labels.includes('New') && <span className="rail-piece-badge">New</span>}
        </button>)}
      </div>
      {hoveredProduct && <div className="rail-hover-card" aria-live="polite">
        <span>{hoveredProduct.category}</span>
        <strong>{hoveredProduct.name}</strong>
        <small>{formatNpr(hoveredProduct.price)}</small>
      </div>}
      <span className="rail-scene-caption">AAVARAN / THE EVERYDAY EDIT</span>
    </div>

    <div className="rail-product-detail page-shell" aria-live="polite">
      <div className="rail-detail-image"><img src={selectedProduct.images[0]} alt={`${selectedProduct.name} product view`} loading="lazy" /></div>
      <div className="rail-detail-copy">
        <span className="eyebrow">Selected piece · {String(railProducts.indexOf(selectedProduct) + 1).padStart(2, '0')} / {String(railProducts.length).padStart(2, '0')}</span>
        <h3>{selectedProduct.name}</h3>
        <p>{selectedProduct.description}</p>
        <div className="rail-detail-meta">
          <strong>{formatNpr(selectedProduct.price)}</strong>
          <span>{selectedProduct.colors.slice(0, 3).map((color) => <i key={color.name} style={{ backgroundColor: color.hex }} title={color.name} />)} {selectedProduct.colors[0]?.name}</span>
        </div>
        <Link className="button button-dark" to={`/products/${selectedProduct.slug}`}>View piece <ArrowRight size={15} /></Link>
      </div>
      <Link className="rail-view-all" to="/new-arrivals" aria-label="View all new arrivals"><ArrowUpRight size={18} /></Link>
    </div>
  </section>;
}

function HangingGarment({ product }: { product: Product }) {
  const garmentColor = product.colors[0]?.hex ?? '#777b63';
  const gradientId = `garment-${product.id}`;
  const isHoodie = product.slug.includes('hoodie');
  const isOvershirt = product.slug.includes('overshirt');
  const isTee = product.slug.includes('tee');
  const isSummer = product.slug.includes('summer');

  return <svg className={`hanging-garment${isHoodie ? ' garment-hoodie' : ''}`} viewBox="0 0 180 250" aria-hidden="true">
    <defs>
      <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor={garmentColor} />
        <stop offset="100%" stopColor="#242421" stopOpacity=".23" />
      </linearGradient>
    </defs>
    <path className="hanger-hook" d="M90 8c-10 0-10 14 0 14 5 0 8-4 8-8" />
    <path className="hanger-wire" d="M90 22v12L43 56l47 9 47-9-47-22" />
    {isHoodie && <path className="garment-hood" d="M72 58 74 39q16-22 32 0l2 19-18 11z" fill={`url(#${gradientId})`} />}
    <path className="garment-body" d="M71 55 52 62l-21 43 17 9 15-26v112q27 12 54 0V88l15 26 17-9-21-43-19-7q-18 12-38 0z" fill={`url(#${gradientId})`} />
    {!isTee && !isHoodie && <path className="garment-collar" d="m72 56 18 17 18-17-8-4q-10 8-20 0z" />}
    {isHoodie ? <>
      <path className="garment-seam" d="M90 73v20m-5-2 5 5 5-5" />
      <path className="garment-pocket" d="M70 139q20 8 40 0l-4 19H74z" />
    </> : <>
      <path className="garment-placket" d="M90 74v104" />
      {isOvershirt && <><path className="garment-pocket" d="M69 99h14v18H69zm28 0h14v18H97z" /><path className="garment-pocket-flap" d="M69 99h14v5H69zm28 0h14v5H97z" /></>}
      {isSummer && <path className="garment-pocket" d="M98 102h14v20H98z" />}
      {[91, 105, 119, 133, 147, 161].map((y) => <circle key={y} className="garment-button" cx="94" cy={y} r="1.5" />)}
    </>}
    <path className="garment-hem" d="M63 198q27 11 54 0" />
  </svg>;
}
