import { useEffect, useMemo, useState, type TouchEvent } from 'react';
import { ArrowLeft, ArrowRight, Heart, Minus, Plus, Ruler, Share2, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatNpr } from '../lib/format';
import { ProductGrid } from '../components/ProductGrid';
import type { Product } from '../data/types';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products, wishlist, toggleWishlist, addToCart, setCartOpen, notify } = useStore();
  const product = products.find((item) => item.slug === slug && item.published);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]?.name ?? '');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [expanded, setExpanded] = useState('details');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    setImageIndex(0);
    setSelectedColor(product?.colors[0]?.name ?? '');
    setSelectedSize('');
    setQuantity(1);
  }, [slug, product?.id]);

  useEffect(() => {
    if (!product) return;
    try {
      const current = JSON.parse(localStorage.getItem('aavaran-recently-viewed') || '[]') as string[];
      const next = [product.id, ...current.filter((id) => id !== product.id)].slice(0, 5);
      localStorage.setItem('aavaran-recently-viewed', JSON.stringify(next));
      setRecentlyViewed(current.filter((id) => id !== product.id).slice(0, 4));
    } catch { setRecentlyViewed([]); }
  }, [product]);

  const currentVariant = useMemo(() => product?.variants.find((variant) => variant.color === selectedColor && variant.size === selectedSize && variant.active && variant.stock > 0), [product, selectedColor, selectedSize]);
  const isArchived = product?.dropStatus === 'ended';
  const isUnavailable = !product || isArchived || !product.variants.some((variant) => variant.stock > 0 && variant.active);
  const availableSizes = product?.sizes ?? [];
  const related = products.filter((item) => item.published && item.id !== product?.id && item.collections.some((collection) => product?.collections.includes(collection))).slice(0, 4);
  const recentProducts = recentlyViewed.map((id) => products.find((item) => item.id === id)).filter((item): item is Product => !!item && item.published && item.id !== product?.id);

  const pickImage = (direction: number) => {
    if (!product?.images.length) return;
    setImageIndex((current) => (current + direction + product.images.length) % product.images.length);
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) pickImage(delta < 0 ? 1 : -1);
    setTouchStartX(null);
  };
  const onAdd = (buyNow = false) => {
    if (!product) return;
    if (!selectedSize) { notify('Please choose a size before adding this piece.', 'error'); return; }
    if (!currentVariant) { notify('That colour and size combination is unavailable.', 'error'); return; }
    const added = addToCart(product.id, currentVariant.id, quantity);
    if (added && buyNow) { setCartOpen(false); navigate('/checkout'); }
  };
  const isFavorite = product ? wishlist.includes(product.id) : false;

  if (!product) return <main className="not-found page-shell"><span className="eyebrow">AAVARAN / 404</span><h1>This piece isn’t here.</h1><Link className="button button-dark" to="/shop">Back to the collection <ArrowRight size={16} /></Link></main>;

  return <main className="product-page page-shell">
    <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><span>{product.name}</span></div>
    <div className="product-detail-layout">
      <section className="product-gallery" aria-label={`${product.name} images`}>
        <div className="product-main-image" onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)} onTouchEnd={onTouchEnd}>
          <img src={product.images[imageIndex] || product.images[0]} alt={`${product.name}, view ${imageIndex + 1}`} onClick={() => setZoomOpen(true)} />
          <div className="gallery-index">0{imageIndex + 1}<span> / 0{product.images.length}</span></div>
          {product.images.length > 1 && <div className="gallery-arrows"><button aria-label="Previous image" onClick={() => pickImage(-1)}><ArrowLeft size={17} /></button><button aria-label="Next image" onClick={() => pickImage(1)}><ArrowRight size={17} /></button></div>}
          <button className="zoom-hint" onClick={() => setZoomOpen(true)}>View full image <Share2 size={13} /></button>
        </div>
        <div className="gallery-thumbnails">{product.images.map((image, index) => <button key={image} className={imageIndex === index ? 'active' : ''} aria-label={`Show image ${index + 1}`} onClick={() => setImageIndex(index)}><img src={image} alt="" /></button>)}</div>
        <div className="gallery-note"><span>IMAGE / 0{imageIndex + 1}</span><span>DEMO CAMPAIGN PHOTOGRAPHY</span></div>
      </section>
      <section className="product-info">
        <div className="product-crumb-label"><span className="eyebrow">{product.category}</span><button className={`product-wishlist-inline ${isFavorite ? 'is-favorite' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} /></button></div>
        <h1>{product.name}<span>.</span></h1>
        <div className="product-price-row"><span className="product-price">{formatNpr(product.price)}</span>{product.compareAtPrice && product.compareAtPrice > product.price && <span className="product-compare-price">{formatNpr(product.compareAtPrice)}</span>}<span className="price-note">Inclusive of taxes</span></div>
        {product.labels.length > 0 && <div className="pdp-labels">{product.labels.map((label) => <span key={label}>{label}</span>)}</div>}
        <p className="product-description">{product.description}</p>
        {isArchived && <div className="archived-alert"><span className="status-dot status-ended" /><div><strong>This drop has ended.</strong><p>This archived demo piece is displayed for the collection story and cannot be purchased.</p></div></div>}
        <div className="pdp-options">
          <div className="option-head"><span>Colour <strong>— {selectedColor}</strong></span></div>
          <div className="pdp-swatches">{product.colors.map((color) => <button key={color.name} className={`pdp-swatch ${selectedColor === color.name ? 'selected' : ''}`} style={{ backgroundColor: color.hex }} aria-label={`Choose ${color.name}`} title={color.name} onClick={() => { setSelectedColor(color.name); setSelectedSize(''); }} />)}</div>
          <div className="option-head size-head"><span>Size <strong>— {selectedSize || 'Select a size'}</strong></span><button className="text-button size-guide-trigger" onClick={() => setSizeGuideOpen(true)}><Ruler size={14} /> Size guide</button></div>
          <div className="pdp-size-options">{availableSizes.map((size) => { const variant = product.variants.find((item) => item.color === selectedColor && item.size === size && item.active && item.stock > 0); return <button key={size} className={`size-chip ${selectedSize === size ? 'selected' : ''}`} disabled={!variant || isArchived} onClick={() => setSelectedSize(size)}>{size}</button>; })}</div>
          {selectedSize && !currentVariant && !isArchived && <p className="option-error">This size and colour combination is not available. Choose another option.</p>}
          {currentVariant && <p className="availability-note"><span className="stock-dot" /> Available in the selected option · availability is confirmed at checkout</p>}
        </div>
        {!isUnavailable && <div className="pdp-purchase-row"><div className="quantity-control quantity-large"><button aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(currentVariant?.stock ?? 1, value + 1))} disabled={quantity >= (currentVariant?.stock ?? 1)}><Plus size={15} /></button></div><button className="button button-dark pdp-add" onClick={() => onAdd(false)} disabled={!currentVariant}>Add to bag <span>{formatNpr(product.price * quantity)}</span></button></div>}
        {!isUnavailable && <button className="button button-rust button-full" onClick={() => onAdd(true)} disabled={!currentVariant}>Buy now <ArrowRight size={16} /></button>}
        {isUnavailable && !isArchived && <button className="button button-outline button-full" disabled>Currently unavailable</button>}
        <div className="delivery-estimate"><div className="delivery-icon">↗</div><p><strong>Delivery across Nepal</strong><span>Estimated 2–5 business days after dispatch. Delivery fees are confirmed at checkout.</span></p></div>
        <div className="product-accordions">
          <Accordion title="Details & fit" id="details" expanded={expanded} setExpanded={setExpanded}><p>{product.description}</p><dl><dt>Fit</dt><dd>{product.fit}</dd><dt>Fabric</dt><dd>{product.material}</dd><dt>Care</dt><dd>{product.care}</dd></dl></Accordion>
          <Accordion title="Shipping & returns" id="shipping" expanded={expanded} setExpanded={setExpanded}><p>Orders in this preview store are demo Cash on Delivery orders. Standard delivery fees are calculated at checkout. For a real launch, add your confirmed delivery and returns policy here.</p><Link to="/shipping" className="underlined-link">Read delivery information <ArrowRight size={14} /></Link></Accordion>
          <Accordion title="Product information" id="information" expanded={expanded} setExpanded={setExpanded}><p>Prices, product details, and inventory are editable demonstration data. Please confirm all specifications before publishing a live catalogue.</p></Accordion>
        </div>
      </section>
    </div>

    {related.length > 0 && <section className="related-products section"><div className="section-heading section-heading-row"><div><span className="eyebrow">Made to go together</span><h2>More to consider.</h2></div><Link className="underlined-link" to="/shop">Shop all <ArrowRight size={15} /></Link></div><ProductGrid products={related} /></section>}
    {recentProducts.length > 0 && <section className="related-products section"><div className="section-heading"><div><span className="eyebrow">Your journey</span><h2>Recently viewed.</h2></div></div><ProductGrid products={recentProducts} /></section>}

    {zoomOpen && <div className="image-zoom" role="dialog" aria-modal="true" aria-label="Product image zoom" onClick={() => setZoomOpen(false)}><button className="icon-button" aria-label="Close image zoom"><X size={22} /></button><img src={product.images[imageIndex]} alt={`${product.name} enlarged`} /></div>}
    {sizeGuideOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Size guide" onMouseDown={(event) => { if (event.target === event.currentTarget) setSizeGuideOpen(false); }}><div className="size-guide-modal"><button className="modal-close icon-button" aria-label="Close size guide" onClick={() => setSizeGuideOpen(false)}><X size={20} /></button><span className="eyebrow">AAVARAN / FIT NOTES</span><h2>Size guide<span>.</span></h2><p>Use this as a starting point. Measurements are demo guidance and should be verified against final product samples.</p><table><thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Fit note</th></tr></thead><tbody>{['XS','S','M','L','XL'].map((size, index) => <tr key={size}><td>{size}</td><td>{82 + index * 5}–{86 + index * 5} cm</td><td>{66 + index * 5}–{70 + index * 5} cm</td><td>{index === 2 ? 'Regular reference' : 'Compare with your usual fit'}</td></tr>)}</tbody></table><button className="button button-dark button-full" onClick={() => setSizeGuideOpen(false)}>Got it</button></div></div>}
  </main>;
}

function Accordion({ title, id, expanded, setExpanded, children }: { title: string; id: string; expanded: string; setExpanded: (value: string) => void; children: React.ReactNode }) {
  const isOpen = expanded === id;
  return <div className={`product-accordion ${isOpen ? 'open' : ''}`}><button className="accordion-trigger" onClick={() => setExpanded(isOpen ? '' : id)} aria-expanded={isOpen}>{title}<span>{isOpen ? '−' : '+'}</span></button>{isOpen && <div className="accordion-content">{children}</div>}</div>;
}
