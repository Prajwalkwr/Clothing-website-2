import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const curatedCollections = [
  { slug: 'everyday-uniform', title: 'The Everyday Uniform', kicker: 'AAVARAN / 01', description: 'A considered rotation of pieces built around the everyday.', image: '/images/hero-campaign.jpg' },
  { slug: 'summer', title: 'Summer Edit', kicker: 'SEASONAL NOTES / 01', description: 'Easy dressing for longer days and lighter layers.', image: '/images/campaign-summer.jpg' },
  { slug: 'winter', title: 'Winter Edit', kicker: 'SEASONAL NOTES / 02', description: 'Dependable layers for cooler mornings and later evenings.', image: '/images/product-hoodie.jpg' },
  { slug: 'accessories', title: 'Objects for everyday', kicker: 'THE DETAILS', description: 'Small details to make a familiar look your own.', image: '/images/accessories-stilllife.jpg' },
];

export default function CollectionsPage() {
  const { products } = useStore();
  return <main className="collections-page page-shell">
    <div className="collections-intro"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Collections</span></div><span className="eyebrow">AAVARAN / THE EDITS</span><h1>Collections<span>.</span></h1><p>Thoughtful edits, made to move with the everyday. Each collection is built from the pieces we believe belong together.</p><span className="collections-intro-side">04<br />EDITIONS</span></div>
    <div className="collections-mosaic">{curatedCollections.map((collection, index) => {
      const count = products.filter((product) => product.published && product.collections.includes(collection.slug)).length;
      return <Link to={`/collections/${collection.slug}`} className={`collection-card collection-card-${index + 1}`} key={collection.slug}><div className="collection-card-image"><img src={collection.image} alt="" loading="lazy" /><span className="collection-card-kicker">{collection.kicker}</span><span className="collection-card-arrow"><ArrowUpRight size={18} /></span></div><div className="collection-card-copy"><div><h2>{collection.title}</h2><p>{collection.description}</p></div><span>{count} pieces</span></div></Link>;
    })}</div>
    <div className="collections-endline"><span>THE AAVARAN COLLECTION · EDITABLE DEMO CONTENT</span><Link to="/shop">Shop all pieces <ArrowUpRight size={15} /></Link></div>
  </main>;
}
