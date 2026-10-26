# AAVARAN — implementation plan

## Reference inspection

Inspected the supplied Wix “Shoe Store (Urban)” template in desktop view and reviewed its accessible page content and screenshot. The visible pattern is a very restrained storefront: a narrow high-contrast shipping strip; a spacious header with wordmark/cart/menu; a large split editorial hero pairing a model image with a product-led panel; a concise category introduction; a short brand/utility story; product-led merchandising; newsletter signup; and a multi-column utility footer. Product imagery and whitespace carry most of the visual weight.

AAVARAN adapts those useful patterns rather than copying the template: warm off-white and charcoal, muted olive/rust accents, South Asian urban campaign imagery, an editorial serif/sans pairing, a clear shop navigation, and a more complete fashion-commerce information architecture. No Wix marks or template assets are used.

## Build plan

1. **Foundation and tokens** — create a Vite + React + TypeScript app, reusable layout/components, responsive type and color tokens, and route structure.
2. **Storefront** — build the AAVARAN campaign homepage, shop/collection listings, product pages, search, sorting, filters, quick add, size selection, wishlist, and responsive navigation.
3. **Shopping flow** — implement a persistent guest bag, size/color/quantity snapshots, discount-code validation, Nepal address fields, order summary, and COD demo-order placement with clear demo status.
4. **Admin** — add a separate dashboard surface with editable demo products/content and order view; protect it in the demo with a local admin gate while documenting that production authorization must move to the server.
5. **API and data boundary** — add a small Express API with validation and JSON-file persistence for demo orders/newsletter submissions, plus environment placeholders and seed data. Keep online gateway integration disabled until real merchant credentials and server verification are configured.
6. **Verification** — run production build, API smoke checks, and browser checks for desktop/mobile, filtering, product variants, bag, and checkout; fix discovered issues and document test scope and remaining production integrations.

## Delivery scope

The implementation prioritizes a polished, coherent storefront and working demo shopping journey. It will include representative page routes and real interactions backed by editable sample data. Production requirements that need merchant infrastructure (MongoDB, payment gateway credentials/webhooks, transactional email, user authentication, Cloudinary, deployment secrets) will be clearly isolated and documented rather than represented by fake integrations.
