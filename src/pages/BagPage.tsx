import { useState } from 'react';
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatNpr } from '../lib/format';

export default function BagPage() {
  const { cartLines, subtotal, updateQuantity, removeFromCart, content, notify } = useStore();
  const [code, setCode] = useState(() => {
    try { return (JSON.parse(sessionStorage.getItem('aavaran-discount') || 'null') as { code?: string } | null)?.code || ''; } catch { return ''; }
  });
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(() => {
    try { return JSON.parse(sessionStorage.getItem('aavaran-discount') || 'null') as { code: string; amount: number } | null; } catch { return null; }
  });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const shipping = subtotal >= content.freeDeliveryThreshold ? 0 : content.shippingFee;

  const applyCode = async () => {
    if (!code.trim()) { notify('Enter a discount code first.', 'error'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/discounts/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim(), subtotal }) });
      const result = await response.json() as { code?: string; discountAmount?: number; message?: string };
      if (!response.ok) throw new Error(result.message || 'That code could not be applied.');
      const applied = { code: result.code || code.trim().toUpperCase(), amount: result.discountAmount || 0 };
      setDiscount(applied); sessionStorage.setItem('aavaran-discount', JSON.stringify(applied)); notify(`Discount applied: ${formatNpr(applied.amount)} off.`);
    } catch (error) { setDiscount(null); sessionStorage.removeItem('aavaran-discount'); notify(error instanceof Error ? error.message : 'Could not validate the code.', 'error'); }
    finally { setBusy(false); }
  };
  const removeCode = () => { setDiscount(null); setCode(''); sessionStorage.removeItem('aavaran-discount'); };

  return <main className="bag-page page-shell">
    <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Shopping bag</span></div>
    <div className="bag-heading"><div><span className="eyebrow">AAVARAN / YOUR SELECTION</span><h1>Shopping bag<span>.</span></h1></div><Link className="underlined-link" to="/shop"><ArrowLeft size={15} /> Continue shopping</Link></div>
    {cartLines.length === 0 ? <div className="bag-empty"><span className="empty-symbol">A.</span><h2>Your bag is taking a breather.</h2><p>When you find a piece that feels like you, it will be here.</p><Link className="button button-dark" to="/shop">Explore the collection <ArrowRight size={16} /></Link></div> : <div className="bag-layout">
      <section className="bag-items">
        <div className="bag-table-head"><span>Piece</span><span>Quantity</span><span>Total</span></div>
        {cartLines.map((line) => <article className="bag-item" key={`${line.productId}-${line.variantId}`}><Link className="bag-item-image" to={`/products/${line.product.slug}`}><img src={line.product.images[0]} alt={line.product.name} /></Link><div className="bag-item-info"><span className="eyebrow">{line.product.category}</span><Link to={`/products/${line.product.slug}`} className="bag-item-name">{line.product.name}</Link><p>{line.variant.color} · {line.variant.size}</p><span className="bag-item-price-mobile">{formatNpr(line.lineTotal)}</span><div className="bag-item-actions"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity - 1)}><Minus size={13} /></button><span>{line.quantity}</span><button aria-label="Increase quantity" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity + 1)} disabled={line.quantity >= line.variant.stock}><Plus size={13} /></button></div><button className="remove-line" onClick={() => removeFromCart(line.productId, line.variantId)}><Trash2 size={14} /> Remove</button></div></div><strong className="bag-line-total">{formatNpr(line.lineTotal)}</strong></article>)}
        <div className="bag-footnote"><span className="small-info">i</span><p>Demo catalogue prices and stock are illustrative. Final price and stock are revalidated by the server when placing an order.</p></div>
      </section>
      <aside className="bag-summary"><span className="eyebrow">Order summary</span><h2>Almost yours.</h2><div className="discount-entry"><label htmlFor="bag-discount">Discount code</label><div><input id="bag-discount" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter code" /><button onClick={applyCode} disabled={busy}>{busy ? 'Checking…' : 'Apply'}</button></div>{discount && <p className="discount-applied">{discount.code} applied <button onClick={removeCode}>Remove</button></p>}<small>Demo code: <strong>WELCOME10</strong></small></div><div className="summary-lines"><div><span>Subtotal</span><strong>{formatNpr(subtotal)}</strong></div>{discount && <div><span>Discount</span><strong>− {formatNpr(discount.amount)}</strong></div>}<div><span>Estimated delivery</span><strong>{shipping === 0 ? 'Complimentary' : formatNpr(shipping)}</strong></div></div><div className="summary-total"><span>Estimated total</span><strong>{formatNpr(Math.max(0, subtotal - (discount?.amount || 0)) + shipping)}</strong></div><button className="button button-dark button-full" onClick={() => navigate('/checkout')}>Continue to checkout <ArrowRight size={16} /></button><p className="payment-note">Cash on Delivery is available for this preview store. Online payment is not configured.</p><div className="bag-assurance"><span>01</span><p><strong>Clear, simple delivery</strong><small>Delivery cost is calculated at checkout.</small></p></div><div className="bag-assurance"><span>02</span><p><strong>Need a hand?</strong><small>Visit our <Link to="/contact">contact page</Link> for assistance.</small></p></div></aside>
    </div>}
  </main>;
}
