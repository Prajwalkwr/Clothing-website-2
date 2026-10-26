import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultContent, fallbackDrops, fallbackProducts } from '../data/catalog';
import type { CartLine, CartLineView, Drop, Product, StoreContent } from '../data/types';

const CART_KEY = 'aavaran-cart-v1';
const WISHLIST_KEY = 'aavaran-wishlist-v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

type StoreContextValue = {
  products: Product[];
  drops: Drop[];
  content: StoreContent;
  cart: CartLine[];
  cartLines: CartLineView[];
  wishlist: string[];
  itemCount: number;
  subtotal: number;
  cartOpen: boolean;
  toast: { message: string; kind: 'success' | 'error' } | null;
  addToCart: (productId: string, variantId: string, quantity?: number) => boolean;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  setCartOpen: (open: boolean) => void;
  notify: (message: string, kind?: 'success' | 'error') => void;
  reloadCatalog: () => Promise<void>;
  setProducts: (products: Product[]) => void;
  setContent: (content: StoreContent) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [drops, setDrops] = useState<Drop[]>(fallbackDrops);
  const [content, setContent] = useState<StoreContent>(defaultContent);
  const [cart, setCart] = useState<CartLine[]>(() => readJson(CART_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => readJson(WISHLIST_KEY, []));
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<StoreContextValue['toast']>(null);

  const reloadCatalog = useCallback(async () => {
    try {
      const [productResponse, contentResponse] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/content'),
      ]);
      if (productResponse.ok) {
        const data = await productResponse.json() as { products: Product[]; drops?: Drop[] };
        setProducts(data.products);
        if (data.drops) setDrops(data.drops);
      }
      if (contentResponse.ok) {
        const data = await contentResponse.json() as { content: StoreContent };
        setContent(data.content);
      }
    } catch {
      // The bundled editable demo catalogue remains available if the API is not running.
    }
  }, []);

  useEffect(() => { void reloadCatalog(); }, [reloadCatalog]);
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string, kind: 'success' | 'error' = 'success') => setToast({ message, kind }), []);

  const addToCart = useCallback((productId: string, variantId: string, quantity = 1) => {
    const product = products.find((item) => item.id === productId);
    const variant = product?.variants.find((item) => item.id === variantId);
    if (!product || !variant || !variant.active || variant.stock < 1) {
      notify('That option is currently unavailable.', 'error');
      return false;
    }
    if (product.dropStatus && product.dropStatus !== 'live') {
      notify(product.dropStatus === 'ended' ? 'This drop has ended.' : 'This drop is not live yet.', 'error');
      return false;
    }
    const alreadyInCart = cart.find((line) => line.productId === productId && line.variantId === variantId)?.quantity ?? 0;
    if (alreadyInCart + quantity > variant.stock) {
      notify('There is not enough available stock for that quantity.', 'error');
      return false;
    }
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId && line.variantId === variantId);
      return existing
        ? current.map((line) => line.productId === productId && line.variantId === variantId
          ? { ...line, quantity: line.quantity + quantity }
          : line)
        : [...current, { productId, variantId, quantity }];
    });
    setCartOpen(true);
    notify(`${product.name} added to your bag.`);
    return true;
  }, [cart, notify, products]);

  const updateQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((current) => current.filter((line) => !(line.productId === productId && line.variantId === variantId)));
      return;
    }
    const product = products.find((item) => item.id === productId);
    const variant = product?.variants.find((item) => item.id === variantId);
    if (variant && quantity > variant.stock) {
      notify('Quantity exceeds the currently available demo stock.', 'error');
      return;
    }
    setCart((current) => current.map((line) => line.productId === productId && line.variantId === variantId ? { ...line, quantity } : line));
  }, [notify, products]);

  const removeFromCart = useCallback((productId: string, variantId: string) => {
    setCart((current) => current.filter((line) => !(line.productId === productId && line.variantId === variantId)));
    notify('Item removed from your bag.');
  }, [notify]);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    const exists = wishlist.includes(productId);
    setWishlist((current) => exists ? current.filter((id) => id !== productId) : [...current, productId]);
    notify(exists ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
  }, [notify, wishlist]);

  const cartLines = useMemo(() => cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    const variant = product?.variants.find((item) => item.id === line.variantId);
    if (!product || !variant) return [];
    return [{ ...line, product, variant, lineTotal: product.price * line.quantity }];
  }), [cart, products]);

  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);

  const value: StoreContextValue = {
    products, drops, content, cart, cartLines, wishlist, itemCount, subtotal, cartOpen, toast,
    addToCart, updateQuantity, removeFromCart, clearCart, toggleWishlist, setCartOpen, notify,
    reloadCatalog, setProducts, setContent,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
