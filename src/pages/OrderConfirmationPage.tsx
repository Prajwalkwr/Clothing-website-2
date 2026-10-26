import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { formatDate, formatNpr } from '../lib/format';

type OrderView = { orderNumber: string; subtotal: number; discount: number; shippingFee: number; total: number; paymentStatus: string; fulfilmentStatus: string; createdAt: string };
export default function OrderConfirmationPage() {
  const { orderNumber = '' } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState((location.state as OrderView | null) || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');
  useEffect(() => {
    if (order) return;
    try {
      const stored = sessionStorage.getItem(`aavaran-order-${orderNumber}`);
      if (stored) { setOrder(JSON.parse(stored) as OrderView); setLoading(false); return; }
    } catch { /* continue to API */ }
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`).then(async (response) => {
      const result = await response.json() as { order?: OrderView; message?: string };
      if (!response.ok || !result.order) throw new Error(result.message || 'Order details could not be loaded.');
      setOrder(result.order);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Order details could not be loaded.')).finally(() => setLoading(false));
  }, [order, orderNumber]);
  if (loading) return <main className="confirmation-page page-shell"><div className="loading-state">Loading order details…</div></main>;
  if (error || !order) return <main className="confirmation-page page-shell"><span className="eyebrow">AAVARAN / ORDER</span><h1>We couldn’t find this order.</h1><p>{error || 'Please check the order link or contact the store team.'}</p><Link className="button button-dark" to="/shop">Return to the store <ArrowRight size={16} /></Link></main>;
  return <main className="confirmation-page page-shell"><div className="confirmation-mark"><Check size={28} /></div><span className="eyebrow">AAVARAN / ORDER RECEIVED</span><h1>Thank you<span>.</span></h1><p className="confirmation-intro">Your order request is in. We’ve recorded the Cash on Delivery order and the store team can follow up using the details you provided.</p><div className="confirmation-card"><div className="confirmation-card-head"><div><span className="eyebrow">ORDER REFERENCE</span><strong>{order.orderNumber}</strong></div><span className="order-status">{order.fulfilmentStatus.replace(/_/g, ' ')}</span></div><div className="confirmation-details"><div><span>Placed</span><strong>{formatDate(order.createdAt)}</strong></div><div><span>Payment</span><strong>Cash on Delivery · due on delivery</strong></div><div><span>Delivery</span><strong>{order.shippingFee === 0 ? 'Complimentary' : formatNpr(order.shippingFee)}</strong></div>{order.discount > 0 && <div><span>Discount</span><strong>− {formatNpr(order.discount)}</strong></div>}<div className="confirmation-total"><span>Total</span><strong>{formatNpr(order.total)}</strong></div></div><small>Demo store order — this confirmation does not represent a real payment or shipment.</small></div><div className="confirmation-actions"><Link className="button button-dark" to="/shop">Continue shopping <ArrowRight size={16} /></Link><Link className="underlined-link" to="/contact">Contact the store team</Link></div></main>;
}
