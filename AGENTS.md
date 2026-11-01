# AGENTS.md

## Project Overview

`wordpress-example` is a zero-framework, static/client-rendered emulation of a **WordPress + WooCommerce** e-commerce storefront bundled with **Vite** and deployed to **Cloudflare Pages**.

Its primary purpose is to serve as a realistic sandbox and testbed for:
- **Third-party script & tag injection** (e.g., Google Tag Manager, `gtag.js`, analytics, conversion/form tracking) via local `<head>`/`<body>` snippets or remote Google Docs channels.
- **Google Tag First-Party Mode (FPS)** proxying via a Cloudflare Pages Function (`functions/gtg/[[path]].js`).
- **E-commerce user flows** (product catalog, product detail pages, cart, checkout, order confirmation, and contact/inquiry forms) backed entirely by `localStorage` and client-side JavaScript.

---

## Tech Stack & Tooling

- **Runtime / Language**: Vanilla JavaScript (ES2024+ Modules, `.js` / `.mjs`), raw HTML partials, static WordPress 6.7 & WooCommerce 9.1.2 CSS.
- **Build Tool**: [Vite](https://vitejs.dev/) (`^7.1.6`).
- **Hosting & Edge Functions**: [Cloudflare Pages](https://pages.cloudflare.com/) + [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (`wrangler.jsonc`, `functions/`).
- **PWA / Offline**: Web App Manifest (`public/manifest.json`) + Workbox 6.4.1 Service Worker (`public/sw.js`).
- **Linting & Type Hints**: ESLint 9 flat config (`eslint.config.mjs`), JSDoc annotations, `jsconfig.json`, and `deno.json`.

### Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite development server (`http://localhost:5173/`) |
| `npm run build` | Bundle production assets into `./dist` (drops `console` & `debugger`) |
| `npm run preview` | Preview the built `./dist` folder using Vite |
| `npm run build-n-preview` | Run `vite build && vite preview` |
| `npx wrangler pages dev` | Test `./dist` + Cloudflare Pages Functions (`functions/`) locally |
| `npm run lint` | Run ESLint across the repository (`eslint .`) |

---

## Directory Structure

```text
.
├── index.html                  # App shell (<nav>, #app container, #remote-setting__status, #_dialog-alert)
├── vite.config.js              # Vite configuration (appType: 'spa', drops console/debugger in build)
├── wrangler.jsonc              # Cloudflare Pages configuration (output dir: ./dist)
├── eslint.config.mjs           # ESLint 9 flat config
├── jsconfig.json               # IDE path mappings (/src/*, @/* -> ./src/*)
├── deno.json                   # Deno linter & compiler options
├── custom-code/                # Sample head.html & body.html snippets for injection testing
├── functions/
│   └── gtg/[[path]].js         # Cloudflare Pages Function: First-Party Mode proxy to <tagId>.fps.goog
├── public/                     # Static files copied as-is to dist/
│   ├── _routes.json            # Cloudflare Pages Function routing rules (includes /gtg/*)
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Workbox 6.4.1 service worker
│   ├── css/                    # Static WordPress & WooCommerce block stylesheets
│   └── page/product/img/       # Product catalog images
└── src/
    ├── main.mpa.js             # Active entry point: pathname-based router & code injector
    ├── main.js                 # Alternative hash-based (#/path) SPA router & code injector
    ├── alert.mjs               # Modal dialog helper driving <dialog id="_dialog-alert">
    ├── remote.mjs              # Fetches default remote static code from Google Docs export URL
    ├── html.js                 # Trusted Types HTML sanitizer & reactive HtmlFragment helper
    ├── IdbWrapper.mjs          # Promise-based IndexedDB wrapper + Gzip stream helpers
    ├── idb_example.mjs         # Example IndexedDB CRUD implementation
    ├── style.css               # Global custom styles (nav, forms, dialog, dark-mode/motion media queries)
    ├── _test/                  # Manual test fixtures for verifying script load event sequencing
    └── page/                   # Route-based HTML templates and JS controllers
        ├── _.html              # Home page (/)
        ├── shop/               # Catalog page (/shop) - _.html, _.js
        ├── product/            # Product pages (/product/<slug>)
        │   ├── product.mjs     # Product model & hardcoded catalog of 6 products
        │   ├── _onload.js      # Shared controller executed on all /product/* routes
        │   └── <slug>/_.html   # Individual product HTML templates (6 products)
        ├── cart/               # Shopping cart (/cart) - _.html, _.js, cart.mjs
        ├── checkout/           # Checkout flow (/checkout) - _.html, _.js
        ├── order-received/     # Order confirmation (/order-received) - _.html, _.js, order-received.mjs
        ├── contact-us/         # Contact & XHR test forms (/contact-us, /contact-us/inquiry-submitted)
        ├── my-account/         # Custom/remote code injection settings UI (/my-account) - _.html, _.js
        ├── privacy-policy/     # Static privacy policy (/privacy-policy) - _.html
        └── indexeddb/          # IndexedDB test UI (/indexeddb) - _.html, _.js
```

---

## Architecture & Core Mechanics

### 1. Client-Side Routing & Lifecycle (`src/main.mpa.js` vs `src/main.js`)

Vite is configured with `appType: 'spa'`, serving [`index.html`](file:///home/mingliangc/wordpress-example/index.html) for all routes.
- **Active Entry (`src/main.mpa.js`)**: Uses `location.pathname` to resolve views on page load. Standard `<a href="/...">` links trigger full browser navigation (MPA behavior).
- **SPA Variant (`src/main.js`)**: Uses `location.hash` (`#/shop`, `#/cart`) and listens to `window.onpopstate`. Even in `main.js`, if custom or remote code is active (`isMPA()`), `onpopstate` forces `location.reload()` to prevent global state/listener leaks across third-party tags.

#### Page Load Sequence (`navigatePage`)
When navigating to a route `pathname` (e.g., `/product/3-speed-bike`):
1. **Reset Container**: `_resetAppBody()` replaces `<div id="app">` with a fresh clone to strip previous event listeners.
2. **Template Lookup**: Looks up `./page${pathname === '/' ? '' : pathname}/_.html` from `import.meta.glob('./page/**/*.html', { eager: false, query: 'raw' })`. Renders a `404` message if not found.
3. **Head Code Injection**: If no remote server URL is configured (`localStorage['txtRemoteCodeUrl']`), injects `localStorage['txtCodeHead']` into `document.head` via `injectCustomCode()`.
4. **Render HTML**: Mounts the raw HTML into `#app` using the `passthrough` Trusted Types policy.
5. **Execute Route Modules** (from `import.meta.glob('./page/**/*.js', { eager: false })`, each exporting `default function(appBody)`):
   - `_loadSharedResources`: Runs `./page/.../_shared.js` from **top-level to deepest** directory.
   - `_loadIndividualResources`: Runs `./page${pathname}/_.js` for the exact route (skipped on `/`).
   - `_loadSharedResources2`: Runs `./page/.../_onload.js` from **deepest to top-level** directory (e.g., `src/page/product/_onload.js` runs for every `/product/<slug>`).
6. **Body & Remote Code Injection**:
   - If local mode: injects `localStorage['txtCodeBody']` into `document.body`.
   - If remote mode (`RemoteCodeInjector`): fetches plain text from `https://docs.google.com/document/d/<ID>/export?format=txt`, injects it into `document.body`, and updates the sticky `#remote-setting__status` bar (`loading`, `success`, `offline`, `error`).
   - Dispatches synthetic `readystatechange`, `DOMContentLoaded` (on `appBody`), `load`, and `pageshow` (on `window`) events so injected third-party scripts expecting standard DOM lifecycle hooks execute reliably.
   - Calls `injectStaticRemoteCode()` (`src/remote.mjs`) to fetch and inject the default remote Google Doc snippet.

### 2. Custom Code Injection (`injectCustomCode`)
Both `src/main.mpa.js` and `src/main.js` implement `injectCustomCode(htmlCode, intoElement)`:
- Parses HTML via `<template>` and iterates over child nodes.
- Recreates `<script>` elements so the browser executes them.
- For synchronous external scripts (`src` present and no `async` attribute), awaits script `load`/`error` (with a 5000ms timeout) before continuing sequential injection.
- For inline or `async` scripts, yields a macrotask (`setTimeout(..., 0)`) so inline scripts execute in order.
- Text nodes targeted at `document.head` are prepended to `document.body` to avoid invalid head text placement.

### 3. E-Commerce Data Models & `localStorage` State

All store state is persisted client-side in `localStorage`:

| `localStorage` Key | Format | Managed By | Purpose |
| :--- | :--- | :--- | :--- |
| `product-cart` | Hex-encoded comma-separated UTF-8 bytes of JSON `string[]` | `Cart` (`src/page/cart/cart.mjs`) | Stores list of product IDs in cart (max 69 per item). |
| `last order` | Hex-encoded UTF-8 bytes of JSON `OrderSummary` | `OrderSummary` (`src/page/order-received/order-received.mjs`) | Stores the most recent completed checkout order. |
| `txtCodeHead` | Raw HTML string | `/my-account` (`src/page/my-account/_.js`) | Custom HTML/scripts injected into `<head>`. |
| `txtCodeBody` | Raw HTML string | `/my-account` (`src/page/my-account/_.js`) | Custom HTML/scripts injected at the end of `<body>`. |
| `txtRemoteCodeUrl` | Google Docs URL string | `/my-account` or `?serverUrlId=<id>` query param | Remote Google Doc URL whose plain-text export is injected into `<body>`. When set, local `txtCodeHead`/`txtCodeBody` are disabled. |

#### Hardcoded Product Catalog (`src/page/product/product.mjs`)
`Product` defines 6 valid string IDs (all priced in `USD`):
- `'83'`: 3-Speed Bike (`$115.00`, `/product/3-speed-bike`)
- `'85'`: Black and White Summer Portrait (`$115.00`, `/product/black-and-white-summer-portrait`)
- `'75'`: Crayfish (`$59.00`, `/product/crayfish`)
- `'87'`: Leather-Clad Leisure Chair (`$249.00`, `/product/leather-clad-leisure-chair`)
- `'59'`: Teddy Bear (`$13.99`, `/product/teddy-bear`)
- `'89'`: Vintage Typewriter (`$90.00`, `/product/vintage-typewriter`)

Passing an unknown ID to `new Product(id)` throws an error (`undefined product id`), which `Cart` uses to validate items and reset corrupted cart state.

### 4. Cloudflare Pages Function (`/gtg/*`)
- Defined in [`functions/gtg/[[path]].js`](file:///home/mingliangc/wordpress-example/functions/gtg/%5B%5Bpath%5D%5D.js) and routed via [`public/_routes.json`](file:///home/mingliangc/wordpress-example/public/_routes.json).
- Proxies requests to `https://<tagId>.fps.goog` for Google Tag First-Party Mode:
  - Extracts `tagId` from `?id=G-xxx` (and strips `id` from search params) or falls back to the last non-empty segment of the URL pathname.
  - Returns `400` if no `tagId` is found (`Error: Missing Google Tag ID (?id=G-xxx)`).
  - Handles CORS `OPTIONS` preflight requests (`204`).
  - Forwards `User-Agent`, `Accept`, `Accept-Language`, and Cloudflare geo headers (`X-Forwarded-Country`, `X-Forwarded-Region`, `X-Forwarded-CountryRegion`).
  - Supports both `GET` and `POST` bodies and sets `Cache-Control: public, max-age=3600` and `Access-Control-Allow-Origin: *` on responses.

---

## Development Conventions & Gotchas

1. **Adding or Modifying Pages**:
   - Create `src/page/<route>/_.html` for the markup and `src/page/<route>/_.js` (exporting `default function(appBody) {}`) for route-specific behavior.
   - Use `_shared.js` for parent-to-child setup or `_onload.js` for child-to-parent post-render hooks.
2. **Fragile DOM Selectors**:
   - Controllers in `src/page/cart/_.js`, `src/page/checkout/_.js`, and `src/page/order-received/_.js` query deeply nested WooCommerce block selectors (e.g., `#wp--skip-link--target > div.entry-content...`). If you modify the HTML hierarchy in `_.html`, update the corresponding `querySelector` paths in `_.js`.
3. **Production Build Drops Console & Debugger**:
   - `vite.config.js` sets `esbuild: { drop: ['console', 'debugger'] }`. Never put required side effects inside `console.*()` arguments.
4. **Trusted Types**:
   - `main.mpa.js`, `main.js`, and `html.js` create `trustedTypes` policies (`passthrough`, `html-sanatizer`). Keep Trusted Types compatibility in mind when assigning to `innerHTML`.
5. **Code Style**:
   - Use ES module imports (root-relative `/src/...` or relative `./...`).
   - Always include semicolons (`semi: ['warn', 'always']` in `eslint.config.mjs`).
   - Run `npm run lint` to verify there are no `no-undef` or syntax errors after making changes.
