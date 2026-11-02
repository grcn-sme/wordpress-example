# wordpress-example

A zero-framework, static/client-rendered emulation of a **WordPress + WooCommerce** e-commerce website built with **Vite** and deployed as a Multi-Page Application (MPA) to **Cloudflare Pages** (not Cloudflare Workers or GitHub Pages).

## Purpose

This project serves as a realistic demo and training sandbox for web analytics, tag management (e.g., Google Tag Manager, `gtag.js`), DOM scraping, and Google Tag First-Party Mode (FPS):
- **Local & Remote Custom Code Injection**: Inject custom `<head>` and `<body>` HTML/JS snippets locally via `localStorage` (`/my-account`) or remotely via a Google Docs export link (`?serverUrlId=<gdocId>`), with deterministic DOM lifecycle event sequencing (`readystatechange`, `DOMContentLoaded`, `load`, `pageshow`).
- **Realistic WooCommerce Camouflage**: Retains real WordPress/WooCommerce markup, stylesheets, and inline scripts as camouflage so trainees practice on a realistic, production-like DOM.
- **Simulated E-Commerce & Form Flows**: Includes functional catalog (`/shop`), product pages (`/product/<slug>`), cart (`/cart`) and checkout (`/checkout`) with 3 shipping options (Free `$0.00`, Flat rate `$6.80`, Express `$20.00`), order confirmation & IndexedDB-backed order history (`/order-received?order_id=...`), dark mode support, and contact/inquiry forms (`/contact-us`).
- **Google Tag First-Party Mode Proxy**: Proxies `/gtg/*` requests to `<tagId>.fps.goog` via a Cloudflare Pages Function (`functions/gtg/[[path]].js`).

See [`AGENTS.md`](./AGENTS.md) for detailed architecture, code injection sequencing, and development guardrails.

## Development & Local Testing

### Vite Dev Server
```bash
npm run dev
```

### Production Build & Preview
```bash
npm run build
npm run preview
```

### Linting & Unit Tests (Vitest)
```bash
npm run lint
npx vitest run
```

### Cloudflare Pages & Functions (`/gtg/*`)
To test the built `./dist` site together with Cloudflare Pages Functions locally:
```bash
npm run build
npx wrangler pages dev
```
