import { useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatNpr } from '../lib/format';

const provinces = ['Koshi Province','Madhesh Province','Bagmati Province','Gandaki Province','Lumbini Province','Karnali Province','Sudurpashchim Province'];
type OrderResult = { order: { orderNumber: string; subtotal: number; discount: number; shippingFee: number; total: number; paymentStatus: string; fulfilmentStatus: string; createdAt: string } };

export default function CheckoutPage() {
  const { cartLines, subtotal, content, clearCart, reloadCatalog } = useStore();
  const navigate = useNavigate();
  const [promo] = useState<{ code: string; amount: number } | null>(() => { try { return JSON.parse(sessionStorage.getItem('aavaran-discount') || 'null') as { code: string; amount: number } | null; } catch { return null; } });
  const [payment, setPayment] = useState('cod');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', province: 'Bagmati Province', district: '', city: '', ward: '', instructions: '' });
  const shipping = subtotal >= content.freeDeliveryThreshold ? 0 : content.shippingFee;
  const estimatedTotal = useMemo(() => Math.max(0, subtotal - (promo?.amount || 0)) + shipping, [subtotal, promo, shipping]);
  const change = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const placeOrder = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (cartLines.length === 0) { setError('Your bag is empty. Add a piece before checkout.'); return; }
    if (payment !== 'cod') { setError('Online payment is not available in this preview store.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        customer: { name: form.name, email: form.email, phone: form.phone },
        address: { line1: form.address, province: form.province, district: form.district, city: form.city, ward: Number(form.ward), instructions: form.instructions },
        items: cartLines.map((line) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantity })),
        paymentMethod: 'cod', discountCode: promo?.code || null,
      }) });
      const result = await response.json() as OrderResult & { message?: string; details?: string[] };
      if (!response.ok) throw new Error(result.message || result.details?.join(' ') || 'We could not place this order. Please review your bag and try again.');
      clearCart(); sessionStorage.removeItem('aavaran-discount'); sessionStorage.setItem(`aavaran-order-${result.order.orderNumber}`, JSON.stringify(result.order));
      await reloadCatalog();
      navigate(`/order-confirmation/${result.order.orderNumber}`, { state: result.order });
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not place order. Please try again.'); }
    finally { setBusy(false); }
  };

  if (cartLines.length === 0) return <main className="checkout-page page-shell"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Checkout</span></div><div className="bag-empty"><span className="empty-symbol">A.</span><h2>Your bag is empty.</h2><p>Explore the collection and find the right piece for you.</p><Link className="button button-dark" to="/shop">Shop the collection <ArrowRight size={16} /></Link></div></main>;

  return <main className="checkout-page page-shell"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/bag">Shopping bag</Link><span>/</span><span>Checkout</span></div><div className="checkout-heading"><div><span className="eyebrow">AAVARAN / SECURE CHECKOUT</span><h1>Delivery details<span>.</span></h1><p>We’ll use these details to get your order to the right place.</p></div><span className="checkout-secure"><LockKeyhole size={16} /> Secure order request</span></div>
    <form className="checkout-layout" onSubmit={placeOrder}>
      <div className="checkout-form-column">
        <section className="checkout-form-section"><div className="checkout-section-title"><span>01</span><div><h2>Contact</h2><p>Where we can reach you about your order.</p></div></div><div className="form-grid"><Field label="Full name" required value={form.name} onChange={(value) => change('name', value)} autoComplete="name" /><Field label="Email address" type="email" required value={form.email} onChange={(value) => change('email', value)} autoComplete="email" /><Field label="Nepal mobile number" type="tel" required value={form.phone} onChange={(value) => change('phone', value)} placeholder="98XXXXXXXX" autoComplete="tel" /></div></section>
        <section className="checkout-form-section"><div className="checkout-section-title"><span>02</span><div><h2>Delivery address</h2><p>Delivery is currently configured for Nepal addresses.</p></div></div><div className="form-grid"><Field className="form-span-2" label="Street address / tole" required value={form.address} onChange={(value) => change('address', value)} autoComplete="street-address" placeholder="House number, street or tole" /><label className="form-field"><span>Province <i>*</i></span><select value={form.province} onChange={(event) => change('province', event.target.value)} required>{provinces.map((province) => <option key={province}>{province}</option>)}</select></label><Field label="District" required value={form.district} onChange={(value) => change('district', value)} placeholder="e.g. Kathmandu" /><Field label="Municipality / city" required value={form.city} onChange={(value) => change('city', value)} /><Field label="Ward number" type="number" required value={form.ward} onChange={(value) => change('ward', value)} min="1" max="99" placeholder="e.g. 10" /><label className="form-field form-span-2"><span>Delivery instructions <small>(optional)</small></span><textarea rows={3} value={form.instructions} onChange={(event) => change('instructions', event.target.value)} placeholder="A nearby landmark or helpful note" /></label></div></section>
        <section className="checkout-form-section"><div className="checkout-section-title"><span>03</span><div><h2>Payment</h2><p>Choose how you’d like to pay.</p></div></div><div className="payment-options"><label className={`payment-option ${payment === 'cod' ? 'selected' : ''}`}><input type="radio" name="payment" value="cod" checked={payment === 'cod'} onChange={() => setPayment('cod')} /><span className="radio-art" /><div><strong>Cash on Delivery</strong><small>Pay in NPR when your order arrives.</small></div><span className="payment-tag">AVAILABLE</span></label><label className="payment-option disabled"><input type="radio" name="payment" value="online" disabled /><span className="radio-art" /><div><strong>Online payment</strong><small>eSewa and other gateways are not configured for this demo.</small></div><span className="payment-tag">NOT SET UP</span></label></div></section>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="checkout-action-row"><Link className="text-button" to="/bag"><ArrowLeft size={15} /> Back to bag</Link><span>By placing your order, you agree to our <Link to="/terms">terms</Link>.</span></div>
      </div>
      <aside className="checkout-summary"><span className="eyebrow">Order summary</span><h2>Your pieces.</h2><div className="checkout-items">{cartLines.map((line) => <div className="checkout-item" key={`${line.productId}-${line.variantId}`}><div className="checkout-item-image"><img src={line.product.images[0]} alt={line.product.name} /><span>{line.quantity}</span></div><div className="checkout-item-name"><strong>{line.product.name}</strong><small>{line.variant.color} · {line.variant.size}</small></div><strong>{formatNpr(line.lineTotal)}</strong></div>)}</div><div className="checkout-summary-lines"><div><span>Subtotal</span><strong>{formatNpr(subtotal)}</strong></div>{promo && <div className="checkout-discount"><span>Discount · {promo.code}</span><strong>− {formatNpr(promo.amount)}</strong></div>}<div><span>Delivery</span><strong>{shipping === 0 ? 'Complimentary' : formatNpr(shipping)}</strong></div></div><div className="checkout-total"><span>Total</span><strong>{formatNpr(estimatedTotal)}</strong></div><button className="button button-dark button-full checkout-submit" type="submit" disabled={busy}>{busy ? 'Placing order…' : 'Place Cash on Delivery order'} <ArrowRight size={16} /></button><p className="checkout-demo-note">This preview creates a real demo order record and decrements demo inventory. It does not charge a payment or dispatch goods.</p><div className="checkout-return"><span>↗</span><p><strong>Need to make a change?</strong><small><Link to="/bag">Return to your bag</Link> before placing the order.</small></p></div></aside>
    </form>
  </main>;
}

function Field({ label, value, onChange, type = 'text', required = false, className = '', placeholder, autoComplete, min, max }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; className?: string; placeholder?: string; autoComplete?: string; min?: string; max?: string }) {
  return <label className={`form-field ${className}`}><span>{label}{required && <i> *</i>}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} autoComplete={autoComplete} min={min} max={max} /></label>;
}
