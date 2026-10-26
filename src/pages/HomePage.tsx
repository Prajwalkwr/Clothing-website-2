import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatNpr } from '../lib/format';
import { ProductGrid } from '../components/ProductGrid';
import { NewsletterForm } from '../components/NewsletterForm';
import { CollectionRail } from '../components/CollectionRail';

const categoryTiles = [
  { title: 'Clothing', kicker: 'The everyday rotation', image: '/images/product-shirt.jpg', href: '/shop', className: 'category-wide' },
  { title: 'Accessories', kicker: 'Small details, considered', image: '/images/accessories-stilllife.jpg', href: '/accessories', className: '' },
  { title: 'Summer', kicker: 'Light on its feet', image: '/images/campaign-summer.jpg', href: '/summer', className: '' },
  { title: 'Winter', kicker: 'Made for the in-between', image: '/images/product-hoodie.jpg', href: '/winter', className: 'category-low' },
];

export default function HomePage() {
  const { products, drops, content } = useStore();
  const published = products.filter((product) => product.published);
  const newArrivals = [...published].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 4);
  const trending = published.filter((product) => product.featuredTrending && product.dropStatus !== 'ended').slice(0, 4);
  const activeDrop = drops.find((drop) => drop.visible);

  return <main>
    <section className="hero-section page-shell">
      <div className="hero-media"><img src="/images/hero-campaign.jpg" alt="AAVARAN campaign: two people in relaxed everyday layers on a Kathmandu-inspired street" fetchPriority="high" /><span className="hero-photo-credit">AAVARAN CAMPAIGN · 01</span></div>
      <div className="hero-copy">
        <span className="eyebrow hero-eyebrow"><i className="eyebrow-line" />{content.heroEyebrow}</span>
        <h1>{content.heroTitle}</h1>
        <p>{content.heroBody}</p>
        <div className="hero-actions"><Link className="button button-dark" to="/new-arrivals">Shop new arrivals <ArrowRight size={16} /></Link><Link className="button button-outline" to="/collections">Explore the collection</Link></div>
        <div className="hero-foot"><span>CONTEMPORARY NEPALI FASHION</span><span>01 / 04</span></div>
      </div>
      <div className="hero-side-note"><span>01</span><i /> Everyday, considered.</div>
    </section>

    <CollectionRail products={published} />

    <section className="section category-section page-shell">
      <div className="section-heading"><div><span className="eyebrow">Start somewhere</span><h2>Shop by mood.</h2></div><p>Pieces for the daily rhythm,<br />whatever the weather.</p></div>
      <div className="category-grid">{categoryTiles.map((tile, index) => <Link key={tile.title} to={tile.href} className={`category-tile ${tile.className}`}>
        <img src={tile.image} alt={`${tile.title} collection`} loading="lazy" />
        <span className="tile-index">0{index + 1}</span><div className="category-tile-copy"><small>{tile.kicker}</small><strong>{tile.title}</strong><span className="circle-arrow"><ArrowUpRight size={17} /></span></div>
      </Link>)}</div>
    </section>

    <section className="section new-arrivals-section page-shell">
      <div className="section-heading section-heading-row"><div><span className="eyebrow">Just landed</span><h2>New arrivals.</h2></div><Link className="underlined-link" to="/new-arrivals">View all new arrivals <ArrowRight size={15} /></Link></div>
      <ProductGrid products={newArrivals} />
    </section>

    <section className="trending-section">
      <div className="trending-intro"><span className="eyebrow eyebrow-light">The edit</span><h2>Things we<br /><em>keep reaching for.</em></h2><p>Our team’s current favourites, selected and updated by the AAVARAN store team. No sales claims, just good pieces.</p><Link className="button button-light" to="/trending">Explore the edit <ArrowRight size={16} /></Link><span className="trending-index">EDIT / 02</span></div>
      <div className="trending-products"><div className="trending-image"><img src="/images/product-overshirt.jpg" alt="Muted rust overshirt styled for an everyday city look" loading="lazy" /><span className="image-caption">THE UTILITY LAYER · 01</span></div><div className="trending-list"><div className="trending-list-head"><span className="eyebrow">A considered rotation</span><Link to="/trending" aria-label="View all trending picks"><ArrowUpRight size={16} /></Link></div>{trending.slice(0, 3).map((product, i) => <Link to={`/products/${product.slug}`} className="trending-row" key={product.id}><span className="trending-num">0{i + 1}</span><span className="trending-row-img"><img src={product.images[0]} alt="" /></span><span className="trending-row-name">{product.name}<small>{product.category}</small></span><strong>{formatNpr(product.price)}</strong><ArrowUpRight size={15} /></Link>)}{trending.length === 0 && <p className="muted">The edit is being updated.</p>}</div></div>
    </section>

    <section className="seasonal-section page-shell">
      <div className="section-heading"><div><span className="eyebrow">Made for the moment</span><h2>Seasonal notes.</h2></div><p>Two considered edits.<br />Choose what feels right.</p></div>
      <div className="seasonal-grid">
        <Link to="/summer" className="season-card season-summer"><div className="season-photo"><img src="/images/campaign-summer.jpg" alt="Summer campaign look in warm white and olive tones" loading="lazy" /><span className="season-label">01 / SUMMER EDIT</span></div><div className="season-copy"><div><span className="eyebrow">A lighter layer</span><h3>Longer days,<br /><em>easier dressing.</em></h3></div><span className="season-link">Explore summer <ArrowUpRight size={17} /></span><p>Relaxed shirts, easy tees, and useful pieces in a lighter palette.</p></div></Link>
        <Link to="/winter" className="season-card season-winter"><div className="season-photo"><img src="/images/product-hoodie.jpg" alt="Winter layering campaign in muted moss and charcoal" loading="lazy" /><span className="season-label">02 / WINTER EDIT</span></div><div className="season-copy"><div><span className="eyebrow">Layers, thoughtfully</span><h3>Good layers.<br /><em>Better days.</em></h3></div><span className="season-link">Explore winter <ArrowUpRight size={17} /></span><p>Hoodies, overshirts, and dependable layers for cooler days.</p></div></Link>
      </div>
    </section>

    <section className="drop-feature page-shell">
      <div className="drop-art"><img src={activeDrop?.image || '/images/hero-campaign.jpg'} alt="AAVARAN Drop 001 campaign image" loading="lazy" /><span className="drop-art-index">A / 001</span><span className="drop-art-caption">AAVARAN · VISUAL DIARY</span></div>
      <div className="drop-copy"><span className="eyebrow">Small stories, held close</span><h2>Limited<br /><em>by intention.</em></h2><p>{activeDrop?.description || 'A first-edition story from the AAVARAN archive.'}</p>{activeDrop && <div className="drop-status-line"><span className={`status-dot status-${activeDrop.status}`} />{activeDrop.status === 'ended' ? 'Drop ended · archived' : activeDrop.status.replace('-', ' ')}</div>}<Link className="button button-dark" to={activeDrop ? `/drops/${activeDrop.slug}` : '/drops'}>Explore the drop <ArrowRight size={16} /></Link><small className="quiet-note">No live countdowns or quantities are shown for archived demo drops.</small></div>
    </section>

    <section className="collection-feature">
      <div className="collection-feature-visual"><img src="/images/product-trousers.jpg" alt="A relaxed everyday outfit in muted olive and cream" loading="lazy" /><div className="collection-stamp">A<br />/U</div></div>
      <div className="collection-feature-copy"><span className="eyebrow">AAVARAN / 01</span><h2>The Everyday<br /><em>Uniform.</em></h2><p>Pieces that meet you where you are: easy to wear, easy to make your own, and never too much of anything.</p><Link className="button button-outline" to="/collections/everyday-uniform">Discover the collection <ArrowRight size={16} /></Link><span className="collection-feature-foot">A COLLECTION BUILT AROUND THE EVERYDAY</span></div>
    </section>

    <section className="story-section page-shell">
      <div className="story-image"><img src="/images/hero-campaign.jpg" alt="AAVARAN campaign imagery in a Kathmandu-inspired urban setting" loading="lazy" /><span className="story-photo-note">KATHMANDU · EVERYDAY LIFE</span></div>
      <div className="story-copy"><span className="eyebrow">A note on AAVARAN</span><h2>Rooted in place.<br /><em>Open to everywhere.</em></h2><p>Rooted in the spirit of Nepal and shaped by modern everyday life, AAVARAN brings together considered design, wearable silhouettes, and thoughtful details. We create pieces made to become part of your everyday story.</p><p className="proposed-copy-note">Proposed brand story · edit before launch</p><Link className="underlined-link" to="/story">Explore our story <ArrowRight size={15} /></Link><span className="story-side-mark">A.</span></div>
    </section>

    <section className="journal-section page-shell"><div className="section-heading section-heading-row"><div><span className="eyebrow">AAVARAN visual notes</span><h2>In the everyday.</h2></div><p>Campaign imagery from the first<br />AAVARAN concept collection.</p></div><div className="journal-grid"><div><img src="/images/product-tee.jpg" alt="Charcoal oversized tee in soft studio light" loading="lazy" /><span>01 / FORM</span></div><div><img src="/images/product-shirt.jpg" alt="Pale stone boxy shirt with relaxed tailoring" loading="lazy" /><span>02 / DETAIL</span></div><div><img src="/images/accessories-stilllife.jpg" alt="Canvas tote and cap on a stone plinth" loading="lazy" /><span>03 / OBJECTS</span></div><div><img src="/images/product-overshirt.jpg" alt="Rust overshirt layered over charcoal" loading="lazy" /><span>04 / LAYER</span></div></div></section>

    <section className="newsletter-section"><div className="newsletter-mark">A.</div><div className="newsletter-copy"><span className="eyebrow">A quieter inbox</span><h2>Get first access.</h2><p>Be the first to hear about new arrivals, upcoming drops, and the collections worth waiting for.</p></div><div className="newsletter-form-wrap"><NewsletterForm /><small>By subscribing, you agree to receive AAVARAN updates. You can unsubscribe at any time.</small></div><span className="newsletter-vertical">THE AAVARAN LETTER</span></section>

    <section className="demo-note page-shell"><span className="demo-note-icon">i</span><p>{content.demoNotice}</p><Link to="/admin">Manage demo catalogue <ArrowDownRight size={15} /></Link></section>
  </main>;
}
