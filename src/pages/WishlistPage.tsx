import { ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ProductGrid } from '../components/ProductGrid';

export default function WishlistPage() {
  const { products, wishlist } = useStore();
  const saved = products.filter((product) => wishlist.includes(product.id) && product.published);
  return <main className="wishlist-page page-shell"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Wishlist</span></div><div className="wishlist-heading"><div><span className="eyebrow">AAVARAN / SAVED FOR LATER</span><h1>Your wishlist<span>.</span></h1><p>Pieces you’ve saved for another day.</p></div><Heart size={27} strokeWidth={1.3} /></div>{saved.length ? <ProductGrid products={saved} /> : <div className="bag-empty wishlist-empty"><span className="empty-symbol">♡</span><h2>Nothing saved just yet.</h2><p>Tap the heart on a piece to keep it close.</p><Link className="button button-dark" to="/shop">Browse the collection <ArrowRight size={16} /></Link></div>}</main>;
}
