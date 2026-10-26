import { useEffect } from 'react';
import { Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { CartDrawer, Footer, Toast } from './components/SiteChrome';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import CollectionsPage from './pages/CollectionsPage';
import ProductPage from './pages/ProductPage';
import DropsPage from './pages/DropsPage';
import BagPage from './pages/BagPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import WishlistPage from './pages/WishlistPage';
import InfoPage from './pages/InfoPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return <>
    <SeoManager />
    {isAdmin ? <AdminPage /> : <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage kind="all" />} />
        <Route path="/new-arrivals" element={<ShopPage kind="new" />} />
        <Route path="/trending" element={<ShopPage kind="trending" />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:slug" element={<CollectionRoute />} />
        <Route path="/summer" element={<ShopPage kind="summer" />} />
        <Route path="/winter" element={<ShopPage kind="winter" />} />
        <Route path="/accessories" element={<ShopPage kind="accessories" />} />
        <Route path="/drops" element={<DropsPage />} />
        <Route path="/drops/:slug" element={<DropsPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/bag" element={<BagPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/account" element={<InfoPage type="account" />} />
        <Route path="/story" element={<InfoPage type="story" />} />
        <Route path="/contact" element={<InfoPage type="contact" />} />
        <Route path="/size-guide" element={<InfoPage type="size-guide" />} />
        <Route path="/shipping" element={<InfoPage type="shipping" />} />
        <Route path="/returns" element={<InfoPage type="returns" />} />
        <Route path="/privacy" element={<InfoPage type="privacy" />} />
        <Route path="/terms" element={<InfoPage type="terms" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <CartDrawer />
      <Toast />
    </>}
  </>;
}

function CollectionRoute() { const { slug = '' } = useParams(); return <ShopPage kind="collection" collectionSlug={slug} />; }

function NotFound() { return <main className="not-found page-shell"><span className="eyebrow">AAVARAN / 404</span><h1>We lost the thread.</h1><p>The page you’re looking for isn’t here.</p><a className="button button-dark" href="/">Return home</a></main>; }

function SeoManager() {
  const location = useLocation();
  const { products } = useStore();
  useEffect(() => {
    const slug = location.pathname.split('/').filter(Boolean).at(-1) || '';
    const product = location.pathname.startsWith('/products/') ? products.find((item) => item.slug === slug) : undefined;
    const sectionName = location.pathname === '/' ? 'Home' : slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    const title = product ? `${product.name} | AAVARAN` : `${sectionName} | AAVARAN — Wear Your Own Story`;
    const description = product?.description || (location.pathname === '/' ? 'Contemporary Nepali fashion. Considered essentials, distinctive details, and a style that is entirely yours.' : `Explore ${sectionName.toLowerCase()} at AAVARAN, a contemporary Nepali fashion concept.`);
    document.title = title;
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) { descriptionTag = document.createElement('meta'); descriptionTag.setAttribute('name', 'description'); document.head.appendChild(descriptionTag); }
    descriptionTag.setAttribute('content', description);
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `${window.location.origin}${location.pathname}`;
    const old = document.getElementById('aavaran-product-schema');
    old?.remove();
    if (product) {
      const script = document.createElement('script'); script.id = 'aavaran-product-schema'; script.type = 'application/ld+json';
      script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description, image: product.images.map((image) => `${window.location.origin}${image}`), sku: product.variants[0]?.sku, brand: { '@type': 'Brand', name: 'AAVARAN' }, offers: { '@type': 'Offer', priceCurrency: 'NPR', price: product.price, availability: product.variants.some((variant) => variant.stock > 0) && product.dropStatus !== 'ended' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: `${window.location.origin}${location.pathname}` } }); document.head.appendChild(script);
    }
  }, [location.pathname, products]);
  return null;
}
