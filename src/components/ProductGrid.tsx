import type { Product } from '../data/types';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return <div className="empty-state"><span className="empty-symbol">A.</span><h3>Nothing here just yet.</h3><p>Try a different filter, or explore the full collection.</p></div>;
  return <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>;
}
