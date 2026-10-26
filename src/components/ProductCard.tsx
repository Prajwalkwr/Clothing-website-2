import { useState } from 'react';
import { ArrowUpRight, Heart, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product, Variant } from '../data/types';
import { useStore } from '../context/StoreContext';
import { formatNpr } from '../lib/format';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const [quickOpen, setQuickOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name ?? '');
  const [selectedSize, setSelectedSize] = useState('');
  const favorite = wishlist.includes(product.id);
  const isEnded = product.dropStatus === 'ended';
  const firstAvailable = (size: string): Variant | undefined => product.variants.find((variant) => variant.color === selectedColor && variant.size === size && variant.active && variant.stock > 0);

  const quickAdd = () => {
    if (!selectedSize) return;
    const variant = firstAvailable(selectedSize);
    if (!variant) return;
    if (addToCart(product.id, variant.id, 1)) setQuickOpen(false);
  };

  return <article className={`product-card reveal-on-scroll ${index < 4 ? 'visible' : ''}`} style={{ animationDelay: `${Math.min(index, 6) * 55}ms` }}>
    <div className="product-image-wrap">
      <Link to={`/products/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
        <img className="product-image primary-image" src={product.images[0]} alt={`${product.name} — product view`} loading={index > 3 ? 'lazy' : 'eager'} />
        {product.images[1] && <img className="product-image secondary-image" src={product.images[1]} alt="" loading="lazy" />}
      </Link>
      <div className="product-labels">{product.labels.filter((label) => label !== 'New').slice(0, 1).map((label) => <span key={label} className={`product-label ${label === 'Limited Drop' ? 'label-rust' : ''}`}>{label}</span>)}{product.publishedAt && new Date(product.publishedAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 30 && <span className="product-label">New</span>}{isEnded && <span className="product-label label-ended">Archived</span>}</div>
      <button className={`wish-button ${favorite ? 'is-favorite' : ''}`} aria-label={favorite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} onClick={() => toggleWishlist(product.id)}><Heart size={18} fill={favorite ? 'currentColor' : 'none'} /></button>
      {!isEnded && <button className="quick-add-button" onClick={() => setQuickOpen(true)}><Plus size={16} /> Quick add</button>}
    </div>
    <div className="product-card-meta">
      <div className="product-title-line"><Link to={`/products/${product.slug}`}>{product.name}</Link><Link className="product-arrow" to={`/products/${product.slug}`} aria-label={`View ${product.name}`}><ArrowUpRight size={16} /></Link></div>
      <div className="product-subline"><span>{formatNpr(product.price)}</span><span className="product-colors">{product.colors.slice(0, 3).map((color) => <i key={color.name} style={{ background: color.hex }} title={color.name} />)}<small>{product.colors.length} colour{product.colors.length > 1 ? 's' : ''}</small></span></div>
    </div>

    {quickOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Quick add ${product.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setQuickOpen(false); }}>
      <div className="quick-modal">
        <button className="modal-close icon-button" aria-label="Close quick add" onClick={() => setQuickOpen(false)}><X size={20} /></button>
        <div className="quick-modal-image"><img src={product.images[0]} alt={product.name} /></div>
        <div className="quick-modal-info"><span className="eyebrow">Quick add</span><h3>{product.name}</h3><p>{formatNpr(product.price)}</p>
          <div className="option-group"><span className="option-label">Colour — {selectedColor}</span><div className="swatch-row">{product.colors.map((color) => <button key={color.name} className={`color-swatch ${selectedColor === color.name ? 'selected' : ''}`} style={{ backgroundColor: color.hex }} title={color.name} aria-label={color.name} onClick={() => setSelectedColor(color.name)} />)}</div></div>
          <div className="option-group"><span className="option-label">Choose a size</span><div className="size-options">{product.sizes.map((size) => { const variant = firstAvailable(size); return <button key={size} className={`size-chip ${selectedSize === size ? 'selected' : ''}`} disabled={!variant} onClick={() => setSelectedSize(size)}>{size === 'One size' ? 'One size' : size}</button>; })}</div></div>
          <button className="button button-dark button-full" onClick={quickAdd} disabled={!selectedSize || !firstAvailable(selectedSize)}>Add to bag <span>{formatNpr(product.price)}</span></button>
          {!selectedSize && <small className="form-hint">Select an available size to continue.</small>}
        </div>
      </div>
    </div>}
  </article>;
}
