import { useEffect } from 'react';
import { ArrowRight, Minus, Plus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatNpr } from '../lib/format';
import { NewsletterForm } from './NewsletterForm';

export function Footer() {
  const { content } = useStore();
  return <>
    <section className="footer-signoff"><div className="footer-signoff-mark">A.</div><p>Designed for everyday life.<br /><em>Wear your own story.</em></p><span className="footer-signoff-note">AAVARAN · CONTEMPORARY NEPALI FASHION</span></section>
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand"><Link to="/" className="brand-wordmark">{content.brandName}<span className="brand-dot">.</span></Link><p>Considered design. Wearable silhouettes.<br />A style that is entirely yours.</p><div className="footer-social"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">Instagram <ArrowRight size={13} /></a><a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok">TikTok <ArrowRight size={13} /></a></div></div>
        <div className="footer-column"><h3>Shop</h3><Link to="/shop">Shop all</Link><Link to="/new-arrivals">New arrivals</Link><Link to="/trending">Trending now</Link><Link to="/summer">Summer edit</Link><Link to="/winter">Winter edit</Link><Link to="/drops">Limited drops</Link></div>
        <div className="footer-column"><h3>Help & information</h3><Link to="/shipping">Shipping & delivery</Link><Link to="/returns">Returns & exchanges</Link><Link to="/size-guide">Size guide</Link><Link to="/contact">Contact</Link><Link to="/account">Your account</Link><Link to="/admin">Store administration</Link></div>
        <div className="footer-column footer-newsletter"><h3>Get first access</h3><p>New arrivals, quiet updates, and the collections worth waiting for.</p><NewsletterForm compact /></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} {content.brandName}. All rights reserved.</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><span className="demo-footnote">Sample catalogue · Prices in NPR</span></div></div>
    </footer>
  </>;
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, cartLines, subtotal, updateQuantity, removeFromCart, content } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    const open = () => setCartOpen(true);
    window.addEventListener('aavaran:open-cart', open);
    return () => window.removeEventListener('aavaran:open-cart', open);
  }, [setCartOpen]);
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setCartOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cartOpen, setCartOpen]);
  if (!cartOpen) return null;
  const remaining = Math.max(0, content.freeDeliveryThreshold - subtotal);
  return <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="Shopping bag" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
    <aside className="cart-drawer">
      <div className="drawer-head"><div><span className="eyebrow">Your selection</span><h2>Shopping bag <small>({cartLines.reduce((sum, line) => sum + line.quantity, 0)})</small></h2></div><button className="icon-button" aria-label="Close bag" onClick={() => setCartOpen(false)}><X size={20} /></button></div>
      {cartLines.length === 0 ? <div className="drawer-empty"><span className="empty-symbol">A.</span><h3>Your bag is taking a breather.</h3><p>Find something that feels like you.</p><button className="button button-dark" onClick={() => { setCartOpen(false); navigate('/shop'); }}>Explore the collection <ArrowRight size={15} /></button></div> : <>
        <div className="drawer-delivery">{remaining > 0 ? <>You are <strong>{formatNpr(remaining)}</strong> away from complimentary delivery.</> : 'Complimentary delivery unlocked.'}<div className="delivery-progress"><i style={{ width: `${Math.min(100, subtotal / content.freeDeliveryThreshold * 100)}%` }} /></div></div>
        <div className="drawer-items">{cartLines.map((line) => <div className="drawer-item" key={`${line.productId}-${line.variantId}`}>
          <Link to={`/products/${line.product.slug}`} onClick={() => setCartOpen(false)} className="drawer-item-image"><img src={line.product.images[0]} alt={line.product.name} /></Link>
          <div className="drawer-item-info"><div className="drawer-item-title"><Link to={`/products/${line.product.slug}`} onClick={() => setCartOpen(false)}>{line.product.name}</Link><button aria-label={`Remove ${line.product.name}`} onClick={() => removeFromCart(line.productId, line.variantId)}><X size={15} /></button></div><p>{line.variant.color} · {line.variant.size}</p><strong>{formatNpr(line.lineTotal)}</strong><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity - 1)}><Minus size={13} /></button><span>{line.quantity}</span><button aria-label="Increase quantity" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity + 1)}><Plus size={13} /></button></div></div>
        </div>)}</div>
        <div className="drawer-total"><div><span>Subtotal</span><strong>{formatNpr(subtotal)}</strong></div><p>Shipping and any discount are calculated at checkout.</p><button className="button button-dark button-full" onClick={() => { setCartOpen(false); navigate('/checkout'); }}>Continue to checkout <ArrowRight size={16} /></button><button className="text-button drawer-continue" onClick={() => { setCartOpen(false); navigate('/shop'); }}>Continue shopping</button></div>
      </>}
    </aside>
  </div>;
}

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return <div className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>{toast.message}</div>;
}
