import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bell, Clock3 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/ProductGrid';
import type { Drop } from '../data/types';

export default function DropsPage() {
  const { slug } = useParams();
  const { drops, products } = useStore();
  const drop = drops.find((item) => item.slug === slug && item.visible);
  const [notifyStatus, setNotifyStatus] = useState('');
  const [email, setEmail] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!drop?.releaseAt || drop.status !== 'scheduled') return; const interval = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(interval); }, [drop?.releaseAt, drop?.status]);
  const productItems = drop ? products.filter((product) => drop.productIds.includes(product.id) && product.published) : [];

  const notify = async (event: React.FormEvent) => {
    event.preventDefault(); setNotifyStatus('');
    try {
      const response = await fetch('/api/drop-notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, dropSlug: drop?.slug }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || 'Could not save your request.');
      setNotifyStatus(result.message || 'You’re on the list.'); setEmail('');
    } catch (error) { setNotifyStatus(error instanceof Error ? error.message : 'Please try again later.'); }
  };

  if (slug && !drop) return <main className="not-found page-shell"><span className="eyebrow">AAVARAN / DROPS</span><h1>That drop isn’t here.</h1><Link className="button button-dark" to="/drops">Back to limited drops <ArrowRight size={16} /></Link></main>;

  if (drop) {
    let countdown = '';
    if (drop.status === 'scheduled' && drop.releaseAt) {
      const difference = Math.max(0, new Date(drop.releaseAt).getTime() - now);
      const days = Math.floor(difference / 86400000); const hours = Math.floor((difference % 86400000) / 3600000); const minutes = Math.floor((difference % 3600000) / 60000); const seconds = Math.floor((difference % 60000) / 1000);
      countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    const statusText = drop.status === 'ended' ? 'Ended · archived' : drop.status.replace('-', ' ');
    return <main className="drop-detail-page page-shell"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/drops">Limited drops</Link><span>/</span><span>{drop.name}</span></div><section className="drop-detail-hero"><div className="drop-detail-image"><img src={drop.image} alt={`${drop.name} campaign`} /><span className="drop-detail-index">AAVARAN / {drop.id.toUpperCase()}</span></div><div className="drop-detail-copy"><span className="eyebrow">THE AAVARAN DROP SERIES</span><h1>{drop.name}<span>.</span></h1><p>{drop.description}</p><div className="drop-detail-status"><span className={`status-dot status-${drop.status}`} />{statusText}</div>{drop.status === 'scheduled' && drop.releaseAt && <div className="drop-countdown"><Clock3 size={17} /><div><span>Releases at</span><strong>{new Date(drop.releaseAt).toLocaleString('en-NP', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kathmandu' })} NPT</strong><small>{countdown}</small></div></div>}{drop.editionQuantity !== null && <p className="drop-edition-note">Configured edition quantity: {drop.editionQuantity}</p>}{drop.notifyEnabled && <form className="drop-notify-form" onSubmit={notify}><label htmlFor="drop-email">Get a release reminder</label><div><input id="drop-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" /><button className="button button-dark" type="submit"><Bell size={15} /> Notify me</button></div>{notifyStatus && <small role="status">{notifyStatus}</small>}</form>}{drop.status === 'ended' && <div className="drop-archive-note">This is an archived demo drop. No quantity or release countdown is configured.</div>}{drop.status === 'live' && productItems.some((item) => item.variants.some((variant) => variant.stock > 0)) && <Link className="button button-dark" to={`/products/${productItems[0]?.slug}`}>Shop the drop <ArrowRight size={16} /></Link>}</div></section>{productItems.length > 0 && <section className="section drop-product-section"><div className="section-heading"><div><span className="eyebrow">The pieces</span><h2>Drop selection.</h2></div></div><ProductGrid products={productItems} /></section>}<Link className="drop-back-link" to="/drops"><ArrowRight size={15} /> All drops</Link></main>;
  }

  return <main className="drops-page page-shell"><div className="drops-intro"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Limited drops</span></div><div className="drops-intro-copy"><span className="eyebrow">AAVARAN / CAPSULE RELEASES</span><h1>Small stories.<br /><em>Made to matter.</em></h1><p>Limited drops are their own little worlds: a campaign, a point of view, a piece to keep. Releases appear here only when scheduled by the store team.</p></div><div className="drops-intro-mark">A<br />/D</div></div><div className="drop-list">{drops.filter((item) => item.visible).map((item, index) => <DropCard key={item.id} drop={item} index={index} />)}{drops.filter((item) => item.visible).length === 0 && <div className="empty-state"><span className="empty-symbol">A.</span><h3>No drops are announced right now.</h3><p>Check back for the next AAVARAN release.</p><Link className="underlined-link" to="/new-arrivals">Explore new arrivals <ArrowRight size={14} /></Link></div>}</div><div className="drops-footnote"><span>01 / {String(drops.filter((item) => item.visible).length).padStart(2, '0')}</span><p>Countdowns and edition quantities are shown only when an actual schedule or quantity is configured. Demo content is labelled as such.</p></div></main>;
}

function DropCard({ drop, index }: { drop: Drop; index: number }) {
  const products = useStore().products.filter((product) => drop.productIds.includes(product.id) && product.published);
  const statusLabel = drop.status === 'ended' ? 'Ended · archived' : drop.status.replace('-', ' ');
  return <article className={`drop-list-card ${index % 2 ? 'reverse' : ''}`}><Link to={`/drops/${drop.slug}`} className="drop-list-image"><img src={drop.image} alt={`${drop.name} campaign`} loading="lazy" /><span className="drop-list-number">0{index + 1}</span><span className="drop-list-arrow"><ArrowUpRight size={18} /></span></Link><div className="drop-list-copy"><span className="eyebrow">AAVARAN / DROP {String(index + 1).padStart(2, '0')}</span><h2>{drop.name}</h2><p>{drop.description}</p><div className="drop-card-meta"><span className={`status-dot status-${drop.status}`} />{statusLabel}{drop.releaseAt && <span className="drop-date"> · {new Date(drop.releaseAt).toLocaleDateString('en-NP')}</span>}</div>{products.length > 0 && <div className="drop-product-preview"><img src={products[0].images[0]} alt="" /><span>{products[0].name}</span></div>}<Link className="underlined-link" to={`/drops/${drop.slug}`}>{drop.status === 'ended' ? 'Explore the archive' : 'Explore drop'} <ArrowRight size={15} /></Link>{drop.editionQuantity !== null && <small className="drop-edition-note">Configured edition quantity: {drop.editionQuantity}</small>}</div></article>;
}
