# ELEN Coffee — Premium WooCommerce Storefront

A production-ready, custom-built WordPress/WooCommerce theme + supporting
mu-plugins for **ELEN Coffee**, a specialty coffee brand. No page builder,
no theme-shop template, no bloated plugin stack — a small, auditable
codebase built directly against WordPress and WooCommerce APIs.

This repository ships the **application code** (theme + mu-plugins). It does
not ship WordPress core, WooCommerce, or a database — those are installed
per the setup steps below, same as any WordPress project.

---

## 1. What was built

```
wp-content/
├── themes/elen-coffee/          # The storefront theme
│   ├── style.css                 # Theme header only — real CSS lives in assets/css
│   ├── functions.php             # Bootstraps inc/ modules
│   ├── header.php, footer.php, index.php, 404.php, search.php
│   ├── front-page.php            # Premium landing page (hero → story → philosophy → CTA)
│   ├── page-about.php            # Storytelling About page (slug: about)
│   ├── page-contact.php          # Contact form + details (slug: contact)
│   ├── inc/
│   │   ├── class-theme-setup.php     # Theme supports, menus, image sizes, sidebars
│   │   ├── class-enqueue.php         # CSS/JS loading, font preload, WC default dequeue
│   │   ├── class-woocommerce.php     # WooCommerce integration & hooks (see §3)
│   │   ├── class-security.php        # Hardening (see §6)
│   │   ├── class-seo.php             # Meta/canonical/OG/robots (see §5)
│   │   ├── class-schema.php          # JSON-LD structured data
│   │   ├── class-contact-form.php    # Contact + newsletter form handling
│   │   ├── class-cart-drawer.php     # Mini-cart drawer markup
│   │   ├── class-customizer.php      # Admin-editable hero/story/contact copy
│   │   ├── template-tags.php         # Inline icon set + nav fallback
│   │   └── wp-cli-seed-products.php  # `wp elen seed_products`
│   ├── woocommerce/                  # Template overrides (see §3)
│   │   ├── archive-product.php, single-product.php, content-product.php
│   │   ├── content-single-product.php
│   │   └── cart/mini-cart.php
│   └── assets/
│       ├── css/  tokens.css, base.css, components.css, layout.css, woocommerce.css, utilities.css, rtl.css
│       └── js/   main.js
└── mu-plugins/                    # Business logic that must survive a theme switch
    ├── elen-coffee-payments.php   # ZarinPal + Zibal gateways (see §7)
    ├── elen-coffee-sms.php        # SMS notification abstraction (see §8)
    └── inc/                       # Gateway + SMS provider classes
```

---

## 2. Architecture decisions (why, briefly)

- **Custom theme, not a page builder.** A premium editorial layout with this
  level of visual-hierarchy control is faster, lighter, and more
  maintainable as hand-written PHP templates + a small CSS design system
  than as an Elementor/Divi build — no builder JS/CSS payload, no
  proprietary lock-in.
- **Six CSS files, cascade-ordered, no bundler.** `tokens → base →
  components → layout → woocommerce → utilities`. Small enough to audit,
  no build step required, easy to reason about specificity.
- **One JS file, vanilla, deferred.** Mobile nav, mobile filter drawer,
  mini-cart drawer, scroll-reveal (IntersectionObserver), and a toast
  helper — a few hundred lines total. No animation library: every motion
  effect is a CSS `transform`/`opacity` transition triggered by a class
  toggle, so it runs on the compositor and respects
  `prefers-reduced-motion`.
- **WooCommerce native wherever possible.** Cart and checkout use
  WooCommerce's own templates completely unmodified — only CSS and field
  filters touch them (update-safe). Shop archive and single product ARE
  template-overridden because a premium editorial layout isn't reachable
  through hooks alone; those overrides carry the same relative path as
  the WooCommerce core templates they mirror so `WooCommerce → Status`
  will flag them if a future WooCommerce version changes the original.
- **Global product attributes (Roast/Grind/Origin), not custom taxonomies.**
  This is what makes them filterable via WooCommerce's native "Filter
  Products by Attribute" widget with zero custom filtering code.
- **Payments and SMS live in mu-plugins, not the theme.** Business logic
  that must survive a theme switch doesn't belong coupled to presentation.
- **No SEO plugin, no page builder, no icon font, no animation library, no
  form plugin.** Each would add an admin screen, a database footprint, and
  an update-security surface for functionality this project implements in
  well under 500 lines total.

---

## 3. WooCommerce integration

- **Attributes**: `Roast` (Light/Medium/Medium-Dark/Dark), `Grind` (Whole
  Bean/Espresso/Filter/French Press/Turkish), `Origin` (Ethiopia/Colombia/
  Brazil/Guatemala/Kenya/Yemen) are registered as global WooCommerce
  attributes on theme activation (`ELEN_WooCommerce::register_attributes`).
- **Coffee-specific fields** (Flavor Notes, Brewing Method) are a small
  custom meta box on the product edit screen — everything else (price,
  sale price, stock, weight, SKU, images, categories) is 100% native
  WooCommerce.
- **Filtering** is done with WooCommerce's own "Filter Products by
  Attribute" and "Filter Products by Price" widgets, placed in
  **Appearance → Widgets → Shop Filters** — no custom filter query code.
  On mobile they render in a slide-in drawer.
- **Sorting/pagination**: native `woocommerce_catalog_ordering` /
  `the_posts_pagination`, restyled only.
- **AJAX add-to-cart**: native WooCommerce behavior; the mini-cart drawer
  opens on the native `added_to_cart` JS event and its content is kept in
  sync via WooCommerce's own cart-fragments mechanism (`elen-coffee.css`
  targets `.mini-cart-drawer__body` and `.cart-drawer-trigger__count` as
  fragment selectors).
- **Checkout**: default WooCommerce checkout markup, restyled; only the
  `Company` and `Order notes` fields are removed as unnecessary friction.
- **Sample products**: `wp elen seed_products` (WP-CLI) creates the 5
  required coffee products with attributes, weight, SKU, stock, flavor
  notes, and a brewing guide each. Idempotent by SKU — safe to re-run.
- **Shipping methods** (Post/Express/Courier/Local delivery): configured
  entirely through native **WooCommerce → Settings → Shipping → Zones**
  using "Flat rate" (renamed per method, e.g. "Post", "Express Courier")
  and "Local pickup" for local delivery — no custom shipping code needed
  or written, per the "native WooCommerce first" instruction.

---

## 4. Design system

Tokens live in `assets/css/tokens.css` as CSS custom properties: brand
colors (Olive, Coffee Brown, Cream, Warm Beige, Near Black), a full type
scale (Display/H1/H2/H3/Body/Small/Caption/Button) with `clamp()`-based
fluid sizing, an 8-step 4px spacing scale, radius/shadow/motion tokens.
Components (buttons, inputs, cards, badges, drawer/modal shell, alerts,
toasts, product cards) are built from those tokens only — no magic numbers
in component CSS. RTL is handled primarily through CSS logical properties
(`inset-inline-*`, `margin-inline-*`) with a small `rtl.css` for the
handful of physical-property exceptions, loaded only when `is_rtl()`.

---

## 5. SEO

- WordPress core's own XML sitemap (`/wp-sitemap.xml`, since WP 5.5) is
  used as-is — no sitemap plugin.
- Custom, lightweight `<head>` output: meta description, canonical URL,
  robots meta (noindex on search/404/cart/checkout/account), Open Graph +
  Twitter card tags, `product:price:*` tags on product pages.
- JSON-LD via `class-schema.php`: `Organization`, `WebSite` (with
  `SearchAction`), `BreadcrumbList` on every non-home page, and `Product`
  (with `Offer`/`AggregateRating`) on product pages. WooCommerce's own
  structured-data output is disabled to avoid a duplicate/conflicting
  `Product` schema.
- Clean permalinks (assumed — set **Settings → Permalinks** to "Post
  name" during setup), forced `alt` fallback to post title on images
  missing one, `robots.txt` sitemap pointer.

## 6. Security

- Hardening implemented in the theme (`class-security.php`): WP version
  string stripped from head/asset URLs, XML-RPC disabled, `?author=N`
  user-enumeration blocked, `X-Content-Type-Options` /
  `X-Frame-Options` / `Referrer-Policy` / `Permissions-Policy` / HSTS
  (when HTTPS) response headers, generic login error messages, a
  transient-based login rate limiter (5 attempts / 10 min per IP+user),
  the REST `/wp/v2/users` endpoint hidden from anonymous requests, SVG
  uploads blocked.
- All form input (contact form, newsletter, coffee meta box) is
  **nonce-verified, sanitized on input, and escaped on output**. The
  contact form adds a honeypot field, a submission-timing trap, and an IP
  rate limit (5 / 10 min) against spam/bot abuse.
- Payment gateway credentials are stored as WooCommerce gateway settings
  (admin-only `wp_options`) and never rendered to the page. Only the
  gateway's own redirect URL reaches the browser.
- Payment callbacks are **idempotent**: a `_elen_gateway_verified` order
  meta flag prevents a duplicated/replayed callback from double-crediting
  an order; a cancelled/failed verification moves the order to `failed`/
  `cancelled` rather than silently leaving it `pending`.
- **Not set by the theme (host/server responsibility — see §9)**: HTTPS
  enforcement, `DISALLOW_FILE_EDIT`/`DISALLOW_FILE_MODS` in
  `wp-config.php`, database credentials, backups, a WAF, and the final
  Content-Security-Policy (deliberately not sent from the theme — see the
  comment in `class-security.php::security_headers()` for why).

## 7. Payments

Two direct-integration WooCommerce gateways (`mu-plugins/elen-coffee-payments.php`
+ `mu-plugins/inc/class-elen-gateway-*.php`): **ZarinPal** and **Zibal**,
both sharing an abstract base (`ELEN_Gateway_Base`) that implements
`process_payment()`, the return-callback handler, and idempotent
verification. Each subclass only implements `request_payment()` and
`verify_payment()` against its provider's documented REST API. Configure
under **WooCommerce → Settings → Payments** once you have real merchant
credentials (see §9) — sandbox mode is on by default.

Handled explicitly: successful payment (`payment_complete()`), failed
payment (`failed` status + customer-facing notice), customer cancel
(`cancelled` status), duplicate/replayed callback (short-circuited via the
verified-flag), and gateway timeouts/errors (`WP_Error` → order held as
`failed`, never left in limbo).

## 8. SMS notifications

`mu-plugins/elen-coffee-sms.php` defines an `ELEN_SMS_Provider` interface
and two ready-to-configure providers, **Kavenegar** and **Melipayamak**
(`ELEN_SMS_Manager::provider()` picks one via the `elen_sms_provider`
option or `ELEN_SMS_PROVIDER` constant). Order-lifecycle events wired up:
order created, processing (payment successful), failed, cancelled/on-hold,
and completed — plus an `ELEN_SMS_Manager::on_shipped()` entry point for a
shipment-tracking plugin/flow to call once a tracking number exists (core
WooCommerce has no "shipped" status by default). Adding a third provider
means implementing the interface and adding one line to `provider()` —
nothing else changes.

## 9. What needs real information from the client / hosting setup

These cannot be filled in without access the client controls:

- **Hosting & domain**: PHP 8.1+/MySQL 8 (or MariaDB 10.5+) hosting, SSL
  certificate, DNS pointed at the host.
- **`wp-config.php`**: DB credentials, unique auth keys/salts,
  `DISALLOW_FILE_EDIT`/`DISALLOW_FILE_MODS` set to `true`,
  `WP_HOME`/`WP_SITEURL` set to the real HTTPS domain.
- **WooCommerce base setup**: store address/currency, tax settings,
  shipping zones and rates for Post/Express/Courier/Local delivery
  (native WooCommerce UI, see §3).
- **Payment gateway credentials**: real ZarinPal merchant ID and/or Zibal
  API key, entered under WooCommerce → Settings → Payments; sandbox
  toggled off for production.
- **SMS provider credentials**: Kavenegar API key or Melipayamak
  username/password/sender line, via the constants in
  `mu-plugins/inc/class-elen-sms-provider-*.php` or their option
  equivalents.
- **Real content**: product photography, hero/about/story images and
  copy (editable in **Appearance → Customize → ELEN Site Content** —
  no developer needed), contact phone/email/address, social links, and
  the actual product catalog beyond the 5 seeded samples.
- **DNS/CDN/WAF and the final Content-Security-Policy** — intentionally
  left to the hosting layer once the exact set of active
  scripts/analytics/gateway SDKs is known (see §6).

## 10. Setup

1. Install WordPress + WooCommerce (latest stable of both) on PHP 8.1+.
2. Copy `wp-content/themes/elen-coffee` into your WordPress install's
   `wp-content/themes/`, and `wp-content/mu-plugins/*` into
   `wp-content/mu-plugins/` (mu-plugins load automatically, no activation
   step).
3. Activate the **ELEN Coffee** theme in **Appearance → Themes**.
4. **Settings → Permalinks** → "Post name" (required for clean URLs and
   the schema/canonical logic above).
5. Create two Pages with slugs `about` and `contact`, and set **Contact**
   as needed; set your **Home** page to the site's front page under
   **Settings → Reading** (front-page.php renders automatically once a
   static front page is set).
6. Run `wp elen seed_products` (WP-CLI) to create the 5 sample coffee
   products, or add products manually via **Products → Add New**.
7. Add "Filter Products by Attribute" (Roast, Grind) and "Filter Products
   by Price" widgets to **Appearance → Widgets → Shop Filters**.
8. Fill in **Appearance → Customize → ELEN Site Content** (hero, story,
   philosophy, about, contact, social links).
9. Configure **WooCommerce → Settings → Shipping** zones/methods and
   **→ Payments** (ZarinPal/Zibal credentials).

## 11. Verification status — read before trusting any performance/SEO claim

This was built and code-reviewed in a sandbox with **no live WordPress/
WooCommerce/MySQL runtime and no browser available** — there is no
installed site to run Lighthouse, an accessibility scanner, or a real
checkout flow against. Every PHP file in this repository was checked with
`php -l` (no syntax errors) and the plugin/gateway/schema logic was
reviewed line-by-line against the documented WordPress/WooCommerce/
ZarinPal/Zibal APIs it calls, but none of the following has been run and
none should be taken as measured:

- **Lighthouse / Core Web Vitals scores** — Not verified. No number is
  claimed anywhere in this codebase; the CSS/JS/font choices above are
  the standard levers for good LCP/CLS/INP, applied deliberately, but the
  actual scores depend on the final host, images, and network.
- **Live checkout / payment gateway round-trip** — Not verified. The
  gateway classes are code-complete against ZarinPal's and Zibal's
  published REST APIs but have not executed against a live or sandbox
  merchant account from this environment.
- **Accessibility audit (axe/WAVE/screen reader)** — Not verified.
  Semantic HTML, labels, focus states, skip link, and reduced-motion
  handling are implemented, but no automated or manual a11y tool was run.
- **Cross-browser/device rendering** — Not verified (no browser in this
  environment).

Run these yourself (or ask for a follow-up session with a live WordPress
install / staging URL) before treating this as launch-ready: Lighthouse
in Chrome DevTools, WooCommerce's own `wp_mail` test + a sandbox payment
round-trip, and an axe/WAVE pass on Home, Shop, Product, Cart, and
Checkout.
