import 'dotenv/config';
import express from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const storeFile = process.env.STORE_FILE || path.join(__dirname, 'data', 'store.json');
const catalogFile = path.join(root, 'shared', 'catalog.json');
const dropsFile = path.join(root, 'shared', 'drops.json');
const contentFile = path.join(root, 'shared', 'content.json');
const port = Number(process.env.PORT || 4100);
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

const catalogSeed = JSON.parse(await fs.readFile(catalogFile, 'utf8'));
const dropsSeed = JSON.parse(await fs.readFile(dropsFile, 'utf8'));
const contentSeed = JSON.parse(await fs.readFile(contentFile, 'utf8'));

async function ensureStore() {
  await fs.mkdir(path.dirname(storeFile), { recursive: true });
  try { await fs.access(storeFile); }
  catch {
    const seed = { products: catalogSeed, drops: dropsSeed, content: contentSeed, orders: [], newsletter: [], contacts: [], dropNotifications: [], auditLogs: [], discounts: [{ code: 'WELCOME10', percent: 10, enabled: true }], inventoryAdjustments: [] };
    await atomicWrite(seed);
  }
}
async function readStore() { await ensureStore(); return JSON.parse(await fs.readFile(storeFile, 'utf8')); }
async function atomicWrite(data) {
  const temp = `${storeFile}.${process.pid}.${crypto.randomBytes(3).toString('hex')}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await fs.rename(temp, storeFile);
}
async function updateStore(mutator) {
  const current = await readStore();
  const result = await mutator(current);
  await atomicWrite(current);
  return result;
}
let transactionQueue = Promise.resolve();
function serializeTransaction(operation) {
  const run = transactionQueue.then(operation, operation);
  transactionQueue = run.then(() => undefined, () => undefined);
  return run;
}

function zodErrorMessage(error) {
  if (!(error instanceof z.ZodError)) return 'Invalid request.';
  return error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ');
}
function validate(schema, req, res) {
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ message: zodErrorMessage(result.error) }); return null; }
  return result.data;
}
function makeLimiter({ windowMs = 60000, max = 12 } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key) || { resetAt: now + windowMs, count: 0 };
    if (now > bucket.resetAt) { bucket.resetAt = now + windowMs; bucket.count = 0; }
    bucket.count += 1; buckets.set(key, bucket);
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - bucket.count));
    if (bucket.count > max) return res.status(429).json({ message: 'Too many requests. Please try again shortly.' });
    next();
  };
}
const sensitiveLimiter = makeLimiter({ windowMs: 60000, max: 20 });

const adminSecret = process.env.ADMIN_KEY || 'DEMO-AAVARAN-26';
function adminAuth(req, res, next) {
  const supplied = Buffer.from(String(req.get('x-admin-key') || ''));
  const expected = Buffer.from(adminSecret);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return res.status(401).json({ message: 'Invalid admin access key.' });
  next();
}
function addAudit(store, action, entity, entityId, details = {}) {
  store.auditLogs.push({ id: crypto.randomUUID(), action, entity, entityId, details, createdAt: new Date().toISOString() });
  store.auditLogs = store.auditLogs.slice(-500);
}
function getVariant(product, variantId) { return product.variants.find((item) => item.id === variantId); }
function calculateDiscount(store, code, subtotal) {
  if (!code) return { code: null, amount: 0, message: '' };
  const discount = store.discounts.find((item) => item.code.toUpperCase() === String(code).trim().toUpperCase() && item.enabled);
  if (!discount) return { code: null, amount: 0, message: 'That discount code is not valid.' };
  return { code: discount.code, amount: Math.round(subtotal * discount.percent / 100), message: '' };
}

const orderSchema = z.object({
  customer: z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), phone: z.string().trim().regex(/^(?:\+?977[-\s]?)?9[6-9]\d{8}$/, 'Enter a valid Nepal mobile number.') }),
  address: z.object({ line1: z.string().trim().min(3).max(200), province: z.string().trim().min(3).max(80), district: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(100), ward: z.number().int().min(1).max(99), instructions: z.string().trim().max(400).optional().default('') }),
  items: z.array(z.object({ productId: z.string().min(1).max(100), variantId: z.string().min(1).max(160), quantity: z.number().int().min(1).max(10) })).min(1).max(30),
  paymentMethod: z.literal('cod'),
  discountCode: z.string().trim().max(40).nullable().optional(),
});
const newsletterSchema = z.object({ email: z.string().trim().email().max(254), consent: z.literal(true) });
const discountCheckSchema = z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().min(0).max(100000000) });
const contactSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), subject: z.string().trim().min(2).max(140), message: z.string().trim().min(10).max(3000) });

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'aavaran-demo-api', time: new Date().toISOString() }));
app.get('/api/products', async (_req, res, next) => {
  try { const store = await readStore(); res.json({ products: store.products.filter((product) => product.published), drops: store.drops.filter((drop) => drop.visible) }); }
  catch (error) { next(error); }
});
app.get('/api/products/:slug', async (req, res, next) => {
  try { const store = await readStore(); const product = store.products.find((item) => item.slug === req.params.slug && item.published); if (!product) return res.status(404).json({ message: 'Product not found.' }); res.json({ product }); }
  catch (error) { next(error); }
});
app.get('/api/content', async (_req, res, next) => {
  try { const store = await readStore(); res.json({ content: store.content }); }
  catch (error) { next(error); }
});
app.get('/api/drops', async (_req, res, next) => {
  try { const store = await readStore(); res.json({ drops: store.drops.filter((drop) => drop.visible) }); }
  catch (error) { next(error); }
});

app.post('/api/discounts/validate', sensitiveLimiter, async (req, res, next) => {
  try {
    const data = validate(discountCheckSchema, req, res); if (!data) return;
    const store = await readStore(); const result = calculateDiscount(store, data.code, data.subtotal);
    if (result.message) return res.status(422).json({ message: result.message });
    res.json({ code: result.code, discountAmount: result.amount });
  } catch (error) { next(error); }
});

app.post('/api/orders', sensitiveLimiter, async (req, res, next) => {
  const data = validate(orderSchema, req, res); if (!data) return;
  try {
    const order = await serializeTransaction(async () => updateStore(async (store) => {
      const items = [];
      let subtotal = 0;
      for (const requested of data.items) {
        const product = store.products.find((item) => item.id === requested.productId && item.published);
        if (!product) { const error = new Error('A product in your bag is no longer available.'); error.status = 409; throw error; }
        if (product.dropStatus && product.dropStatus !== 'live') { const error = new Error(product.dropStatus === 'ended' ? `${product.name} belongs to a drop that has ended.` : 'This drop is not live yet.'); error.status = 409; throw error; }
        const variant = getVariant(product, requested.variantId);
        if (!variant || !variant.active || variant.stock < requested.quantity) { const error = new Error(`${product.name} is no longer available in the selected colour and size. Please review your bag.`); error.status = 409; throw error; }
        const unitPrice = Number(variant.priceOverride ?? product.price);
        subtotal += unitPrice * requested.quantity;
        items.push({ productId: product.id, productSlug: product.slug, variantId: variant.id, sku: variant.sku, name: product.name, variant: `${variant.color} / ${variant.size}`, color: variant.color, size: variant.size, quantity: requested.quantity, unitPrice, lineTotal: unitPrice * requested.quantity, image: product.images[0] });
      }
      const discountResult = calculateDiscount(store, data.discountCode || '', subtotal);
      if (data.discountCode && discountResult.message) { const error = new Error(discountResult.message); error.status = 422; throw error; }
      const discount = discountResult.amount;
      const shippingFee = subtotal >= Number(store.content.freeDeliveryThreshold) ? 0 : Number(store.content.shippingFee);
      const total = Math.max(0, subtotal - discount) + shippingFee;
      const createdAt = new Date().toISOString();
      const orderNumber = `AV-${createdAt.slice(2,10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const order = { id: crypto.randomUUID(), orderNumber, customer: data.customer, address: { ...data.address, ward: Number(data.address.ward) }, items, subtotal, discount, discountCode: discountResult.code, shippingFee, total, paymentMethod: 'cod', paymentStatus: 'cod_due', fulfilmentStatus: 'pending_confirmation', trackingNumber: '', createdAt, updatedAt: createdAt, statusHistory: [{ status: 'pending_confirmation', at: createdAt, note: 'Guest COD order created; payment is due on delivery.' }] };
      // Mutate stock only after all lines, variants, discounts and totals validate.
      for (const requested of data.items) {
        const product = store.products.find((item) => item.id === requested.productId);
        const variant = product && getVariant(product, requested.variantId);
        if (variant) variant.stock -= requested.quantity;
      }
      store.orders.push(order);
      addAudit(store, 'order.created', 'order', order.orderNumber, { paymentMethod: 'cod', itemCount: items.length, total });
      return order;
    }));
    res.status(201).json({ order: { orderNumber: order.orderNumber, subtotal: order.subtotal, discount: order.discount, shippingFee: order.shippingFee, total: order.total, paymentStatus: order.paymentStatus, fulfilmentStatus: order.fulfilmentStatus, createdAt: order.createdAt } });
  } catch (error) { const status = error.status || 500; if (status >= 500) return next(error); res.status(status).json({ message: error.message }); }
});

app.get('/api/orders/:orderNumber', async (req, res, next) => {
  try {
    const store = await readStore(); const order = store.orders.find((item) => item.orderNumber === req.params.orderNumber);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ order: { orderNumber: order.orderNumber, subtotal: order.subtotal, discount: order.discount, shippingFee: order.shippingFee, total: order.total, paymentStatus: order.paymentStatus, fulfilmentStatus: order.fulfilmentStatus, createdAt: order.createdAt } });
  } catch (error) { next(error); }
});

app.post('/api/newsletter', sensitiveLimiter, async (req, res, next) => {
  const data = validate(newsletterSchema, req, res); if (!data) return;
  try {
    const email = data.email.toLowerCase();
    const result = await updateStore(async (store) => {
      const existing = store.newsletter.find((item) => item.email === email);
      if (existing && !existing.unsubscribedAt) return { duplicate: true };
      if (existing) { existing.unsubscribedAt = null; existing.subscribedAt = new Date().toISOString(); existing.consent = true; return { duplicate: false, resubscribed: true }; }
      store.newsletter.push({ email, consent: true, subscribedAt: new Date().toISOString(), unsubscribedAt: null, source: 'website' });
      addAudit(store, 'newsletter.subscribed', 'newsletter', email);
      return { duplicate: false, resubscribed: false };
    });
    if (result.duplicate) return res.status(409).json({ message: 'This email is already subscribed.' });
    res.status(201).json({ message: result.resubscribed ? 'Welcome back — your subscription is active again.' : 'You’re on the list. Look out for a note from AAVARAN.' });
  } catch (error) { next(error); }
});
app.post('/api/newsletter/unsubscribe', sensitiveLimiter, async (req, res, next) => {
  const schema = z.object({ email: z.string().trim().email().max(254) }); const data = validate(schema, req, res); if (!data) return;
  try {
    const result = await updateStore(async (store) => { const entry = store.newsletter.find((item) => item.email === data.email.toLowerCase()); if (!entry || entry.unsubscribedAt) return false; entry.unsubscribedAt = new Date().toISOString(); addAudit(store, 'newsletter.unsubscribed', 'newsletter', entry.email); return true; });
    res.json({ message: result ? 'You have been unsubscribed.' : 'No active subscription was found for that email.' });
  } catch (error) { next(error); }
});

app.post('/api/contact', sensitiveLimiter, async (req, res, next) => {
  const data = validate(contactSchema, req, res); if (!data) return;
  try {
    await updateStore(async (store) => { store.contacts.push({ id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString(), status: 'received' }); addAudit(store, 'contact.received', 'contact', data.email, { subject: data.subject }); });
    res.status(201).json({ message: 'Your message has been recorded for the demo store. No email reply service is connected.' });
  } catch (error) { next(error); }
});

app.post('/api/drop-notifications', sensitiveLimiter, async (req, res, next) => {
  const schema = z.object({ email: z.string().trim().email().max(254), dropSlug: z.string().min(1).max(100) }); const data = validate(schema, req, res); if (!data) return;
  try {
    const result = await updateStore(async (store) => {
      const drop = store.drops.find((item) => item.slug === data.dropSlug && item.visible);
      if (!drop || !drop.notifyEnabled || drop.status !== 'scheduled') return { allowed: false };
      const email = data.email.toLowerCase();
      if (store.dropNotifications.some((item) => item.dropSlug === data.dropSlug && item.email === email)) return { duplicate: true };
      store.dropNotifications.push({ id: crypto.randomUUID(), dropSlug: data.dropSlug, email, createdAt: new Date().toISOString() });
      return { allowed: true, duplicate: false };
    });
    if (!result.allowed) return res.status(409).json({ message: 'Notifications are not enabled for this drop.' });
    if (result.duplicate) return res.status(409).json({ message: 'That email is already on the notification list.' });
    res.status(201).json({ message: 'Your release reminder request has been saved.' });
  } catch (error) { next(error); }
});

app.use('/api/admin', adminAuth);
app.get('/api/admin/store', async (_req, res, next) => { try { const store = await readStore(); res.json({ products: store.products, orders: store.orders, content: store.content, drops: store.drops, discounts: store.discounts, newsletter: store.newsletter.filter((item) => !item.unsubscribedAt) }); } catch (error) { next(error); } });
app.get('/api/admin/overview', async (_req, res, next) => {
  try {
    const store = await readStore();
    const paidRevenue = store.orders.filter((order) => order.paymentStatus === 'paid').reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = store.orders.filter((order) => !['delivered', 'cancelled'].includes(order.fulfilmentStatus)).length;
    const lowStock = store.products.flatMap((product) => product.dropStatus === 'ended' ? [] : product.variants.filter((variant) => variant.active && variant.stock > 0 && variant.stock <= 3)).length;
    const counts = new Map();
    for (const order of store.orders) for (const item of order.items) counts.set(item.productId, (counts.get(item.productId) || 0) + item.quantity);
    const bestSellers = [...counts.entries()].map(([id, quantity]) => ({ name: store.products.find((product) => product.id === id)?.name || id, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    res.json({ totalOrders: store.orders.length, paidRevenue, pendingOrders, lowStock, bestSellers });
  } catch (error) { next(error); }
});
app.patch('/api/admin/products/:id', async (req, res, next) => {
  const schema = z.object({ name: z.string().trim().min(2).max(120).optional(), description: z.string().trim().min(2).max(3000).optional(), price: z.number().int().min(0).max(10000000).optional(), published: z.boolean().optional(), featuredTrending: z.boolean().optional(), labels: z.array(z.string().trim().min(1).max(40)).max(10).optional(), collections: z.array(z.string().trim().min(1).max(80)).max(20).optional() }).strict();
  const data = validate(schema, req, res); if (!data) return;
  if (!Object.keys(data).length) return res.status(400).json({ message: 'Provide at least one field to update.' });
  try {
    const result = await updateStore(async (store) => { const product = store.products.find((item) => item.id === req.params.id); if (!product) return null; Object.assign(product, data); product.updatedAt = new Date().toISOString(); addAudit(store, 'product.updated', 'product', product.id, data); return product; });
    if (!result) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product: result });
  } catch (error) { next(error); }
});
app.patch('/api/admin/inventory/:variantId', async (req, res, next) => {
  const data = validate(z.object({ stock: z.number().int().min(0).max(9999) }).strict(), req, res); if (!data) return;
  try {
    const result = await updateStore(async (store) => {
      for (const product of store.products) { const variant = product.variants.find((item) => item.id === req.params.variantId); if (variant) { const previous = variant.stock; variant.stock = data.stock; addAudit(store, 'inventory.adjusted', 'variant', variant.id, { previous, current: data.stock }); store.inventoryAdjustments.push({ id: crypto.randomUUID(), variantId: variant.id, productId: product.id, previous, current: data.stock, createdAt: new Date().toISOString() }); return { product, variant }; } }
      return null;
    });
    if (!result) return res.status(404).json({ message: 'Variant not found.' });
    res.json(result);
  } catch (error) { next(error); }
});
app.patch('/api/admin/content', async (req, res, next) => {
  const schema = z.object({ brandName: z.string().trim().min(2).max(50).optional(), tagline: z.string().trim().max(120).optional(), announcement: z.string().trim().min(2).max(160).optional(), freeDeliveryThreshold: z.number().int().min(0).max(10000000).optional(), shippingFee: z.number().int().min(0).max(1000000).optional(), heroEyebrow: z.string().trim().max(80).optional(), heroTitle: z.string().trim().min(2).max(120).optional(), heroBody: z.string().trim().max(400).optional(), demoNotice: z.string().trim().max(200).optional(), socialLinks: z.object({ instagram: z.string().max(200), tiktok: z.string().max(200) }).optional() }).strict();
  const data = validate(schema, req, res); if (!data) return;
  try { const content = await updateStore(async (store) => { store.content = { ...store.content, ...data }; addAudit(store, 'content.updated', 'content', 'store', data); return store.content; }); res.json({ content }); }
  catch (error) { next(error); }
});
app.patch('/api/admin/orders/:orderNumber', async (req, res, next) => {
  const schema = z.object({ fulfilmentStatus: z.enum(['pending_confirmation', 'processing', 'shipped', 'delivered', 'cancelled']), trackingNumber: z.string().trim().max(120).optional() }).strict();
  const data = validate(schema, req, res); if (!data) return;
  try {
    const order = await serializeTransaction(async () => updateStore(async (store) => {
      const target = store.orders.find((item) => item.orderNumber === req.params.orderNumber); if (!target) return null;
      const previous = target.fulfilmentStatus;
      if (previous !== 'cancelled' && data.fulfilmentStatus === 'cancelled') {
        for (const item of target.items) { const product = store.products.find((entry) => entry.id === item.productId); const variant = product && getVariant(product, item.variantId); if (variant) variant.stock += item.quantity; }
      }
      if (previous === 'cancelled' && data.fulfilmentStatus !== 'cancelled') { const error = new Error('Cancelled orders cannot be reopened from this demo dashboard.'); error.status = 409; throw error; }
      target.fulfilmentStatus = data.fulfilmentStatus;
      if (data.trackingNumber !== undefined) target.trackingNumber = data.trackingNumber;
      target.updatedAt = new Date().toISOString(); target.statusHistory.push({ status: data.fulfilmentStatus, at: target.updatedAt, note: `Admin changed fulfilment from ${previous} to ${data.fulfilmentStatus}.` });
      addAudit(store, 'order.status.updated', 'order', target.orderNumber, { previous, current: data.fulfilmentStatus });
      return target;
    }));
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ order });
  } catch (error) { const status = error.status || 500; if (status >= 500) return next(error); res.status(status).json({ message: error.message }); }
});

const clientDist = path.join(root, 'dist');
try { await fs.access(clientDist); app.use(express.static(clientDist, { maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 })); }
catch { /* Vite serves the client during local development. */ }
app.get(/^(?!\/api\/).*/, async (_req, res, next) => {
  try { await fs.access(path.join(clientDist, 'index.html')); res.sendFile(path.join(clientDist, 'index.html')); }
  catch { res.status(404).send('AAVARAN API is running. Start the Vite client for the storefront.'); }
});
app.use((error, _req, res, _next) => {
  console.error('[aavaran-api]', error?.message || error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

await ensureStore();
app.listen(port, '0.0.0.0', () => console.log(`AAVARAN demo API listening on 0.0.0.0:${port}`));
