# Key Improvements & Bug Fixes Plan

## Goal Description

This project is a static/client-rendered emulation of a **WordPress + WooCommerce** storefront designed for demos and trainee exercises (such as GTM / `gtag.js` tag injection, DOM scraping, and event/conversion tracking).
- The non-functional WordPress/WooCommerce HTML, CSS, and inline script blocks intentionally act as **camouflage** to mirror the complexity of a real production site.
- The custom HTML code injection logic (`injectCustomCode`) and synthetic DOM event sequencing (`readystatechange` $\rightarrow$ `DOMContentLoaded` $\rightarrow$ `load` $\rightarrow$ `pageshow`) in [`src/main.mpa.js`](file:///home/mingliangc/wordpress-example/src/main.mpa.js) are timing-critical and **must not be altered**.

The goal of this plan is to **preserve all existing UI visuals, WooCommerce camouflage markup, and `src/main.mpa.js` injection timing** while fixing isolated functional bugs in the e-commerce/form flows and keeping [`AGENTS.md`](file:///home/mingliangc/wordpress-example/AGENTS.md) and [`README.md`](file:///home/mingliangc/wordpress-example/README.md) up to date.

---

## Strict Guardrails

> [!CAUTION]
> **Do Not Alter `injectCustomCode` or Lifecycle Timing in `src/main.mpa.js`**:
> The sequential `<script>` loading, `setTimeout(..., 0)` macrotask yields, `<head>` vs `<body>` injection order, and synthetic event dispatching in [`src/main.mpa.js`](file:///home/mingliangc/wordpress-example/src/main.mpa.js#L9-L150) are strictly preserved.

> [!IMPORTANT]
> **Preserve Camouflage & UI Appearance**:
> None of the dead WordPress/WooCommerce CSS files, inline `wcSettings` scripts, or decoy HTML blocks will be removed or restyled.

---

## Proposed Changes

### 1. Remote Server URL Default Check (`src/main.mpa.js`, `src/main.js`, `src/page/my-account/`)

On a fresh browser profile where `localStorage['txtRemoteCodeUrl']` has never been initialized:
- [`RemoteCodeInjector.prototype.remoteCodeUrl`](file:///home/mingliangc/wordpress-example/src/main.mpa.js#L322) returns `undefined`.
- In [`navigatePage`](file:///home/mingliangc/wordpress-example/src/main.mpa.js#L92), `const hasRemoteCode = dynamicServerCode.remoteCodeUrl !== '';` evaluates `undefined !== ''` as **`true`**.
- **Impact**: Local custom code (`localStorage['txtCodeHead']` and `localStorage['txtCodeBody']`) is skipped on fresh browsers, and [`hideLocaltxtCode`](file:///home/mingliangc/wordpress-example/src/main.mpa.js#L392-L403) locks `#txtCodeHead` and `#txtCodeBody` as `readonly` on `/my-account` even though no remote server URL is set.

Additionally, [`src/page/my-account/_.html`](file:///home/mingliangc/wordpress-example/src/page/my-account/_.html#L1-L3) includes `<script type="module" src="/src/page/my-account.js"></script>`, which does not exist (the actual controller is `src/page/my-account/_.js`), producing a 404 console error.

#### [MODIFY] [main.mpa.js](file:///home/mingliangc/wordpress-example/src/main.mpa.js)
- Without touching `injectCustomCode` or `navigatePage` sequencing, normalize the `remoteCodeUrl` getter to return `localStorage['txtRemoteCodeUrl'] || ''` so `hasRemoteCode` is `false` when unset.

```diff
--- a/src/main.mpa.js
+++ b/src/main.mpa.js
@@ -319,7 +319,7 @@
 class RemoteCodeInjector {
   constructor() { };
 
-  get remoteCodeUrl() { return localStorage['txtRemoteCodeUrl']; };
+  get remoteCodeUrl() { return localStorage['txtRemoteCodeUrl'] || ''; };
```

#### [MODIFY] [main.js](file:///home/mingliangc/wordpress-example/src/main.js)
- Apply the same `get remoteCodeUrl() { return localStorage['txtRemoteCodeUrl'] || ''; };` fix to keep `main.js` consistent.

#### [MODIFY] [_.html](file:///home/mingliangc/wordpress-example/src/page/my-account/_.html)
- Remove the non-existent `<script type="module" src="/src/page/my-account.js"></script>` tag at lines 1–3.

---

### 2. Cart, Checkout & Order Confirmation Fixes (`src/page/cart/`, `src/page/checkout/`, `src/page/order-received/`)

1. **Cart Product Links (`src/page/cart/_.js:22,25`)**: Uses `href="#${p.url}"` (legacy hash-SPA link) instead of `href="${p.url}"`, preventing navigation to product pages from `/cart` in MPA mode.
2. **Cart Quantity Input `blur` Bug (`src/page/cart/_.js:99-106`)**:
   ```js
   if (qty > Cart.maxQuantityPerItem) {
       e.target.value = Cart.maxQuantityPerItem;
   } else {
       e.target.value = 1;
   }
   ```
   Focusing and blurring a quantity input with any valid quantity `<= 69` (e.g., `5`) hits the `else` branch and resets the input to `1`. Changing `else` to `else if (isNaN(qty) || qty < 1)` fixes this.
3. **Cart Plus Button Event Bubbling (`src/page/cart/_.js:135`)**: The `＋` button dispatches `new Event('change')` without `{ bubbles: true }` (unlike the `－` button on line 120), preventing delegated `change` listeners on `document`/`body` from firing.
4. **Cart Shipping Fee Formatting (`src/page/cart/_.js:146-153`)**: Displays raw number `6.8` instead of formatted `$6.80`.
5. **Checkout "Return to Cart" Link (`src/page/checkout/_.html:403`)**: Points to `/wordpress-example/cart` (legacy GitHub Pages base path), which results in a 404 instead of `/cart`.
6. **Checkout Hardcoded Item Alt (`src/page/checkout/_.js:129`)**: Renders `alt="Black and White Summer Portrait"` for every product instead of `alt="${p.name}"`.
7. **Order Received Alert Dialog (`src/page/order-received/_.js:20`)**: Missing `import { alert } from '/src/alert.mjs';`, causing `noOrderYet()` to invoke native `window.alert` instead of `<dialog id="_dialog-alert">`.

#### [MODIFY] [_.js](file:///home/mingliangc/wordpress-example/src/page/cart/_.js)
```diff
--- a/src/page/cart/_.js
+++ b/src/page/cart/_.js
@@ -1,4 +1,5 @@
 import { Cart } from './cart.mjs';
+import { Product } from '../product/product.mjs';
 
 export default function (appBody) {
     const cart = new Cart();
@@ -19,10 +20,10 @@
     for (const p of cart.allProducts()) {
         console.log({ p });
         const html = `
         <tr class="wc-block-cart-items__row" tabindex="-1">
-            <td class="wc-block-cart-item__image" aria-hidden="true"><a href="#${p.url}" tabindex="-1"><img src="${p.img_src}"
+            <td class="wc-block-cart-item__image" aria-hidden="true"><a href="${p.url}" tabindex="-1"><img src="${p.img_src}"
                         alt="${p.name}"></a></td>
             <td class="wc-block-cart-item__product">
-                <div class="wc-block-cart-item__wrap"><a class="wc-block-components-product-name" href="#${p.url}">${p.name}</a>
+                <div class="wc-block-cart-item__wrap"><a class="wc-block-components-product-name" href="${p.url}">${p.name}</a>
                     <div class="wc-block-cart-item__prices"><span class="price wc-block-components-product-price"><span
                                 class="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-product-price__value">${p.priceText()}</span></span>
@@ -100,7 +101,7 @@
                 const qty = parseInt(e.target.value);
                 if (qty > Cart.maxQuantityPerItem) {
                     e.target.value = Cart.maxQuantityPerItem;
-                } else {
+                } else if (isNaN(qty) || qty < 1) {
                     e.target.value = 1;
                 }
             });
@@ -132,7 +133,7 @@
                     e.target.parentElement.querySelector('.wc-block-components-quantity-selector__input')
                     ;
                 txtQuantity.value = parseInt(txtQuantity.value) + 1;
-                txtQuantity.dispatchEvent(new Event('change'));
+                txtQuantity.dispatchEvent(new Event('change', { bubbles: true }));
             });
         }
     }
@@ -144,11 +145,12 @@
 }
 
 function displayShippingFee(shippingFee) {
+    const formattedFee = Product.formatPrice('USD', shippingFee);
     document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div:nth-child(4) > div > div > div.wc-block-components-sidebar.wc-block-cart__sidebar.wp-block-woocommerce-cart-totals-block > div.wp-block-woocommerce-cart-order-summary-block > div.wp-block-woocommerce-cart-order-summary-totals-block > div.wp-block-woocommerce-cart-order-summary-shipping-block.wc-block-components-totals-wrapper > div > div > span.wc-block-formatted-money-amount.wc-block-components-formatted-money-amount.wc-block-components-totals-item__value")
-        .textContent = shippingFee;
+        .textContent = formattedFee;
 
     // shipping fee option
     document.body.querySelector("#radio-control-0-flat_rate\\:3__description > span")
-        .textContent = shippingFee;
+        .textContent = formattedFee;
 }
```

#### [MODIFY] [_.html](file:///home/mingliangc/wordpress-example/src/page/checkout/_.html)
- Update `<a href="/wordpress-example/cart"` on line 403 to `<a href="/cart"`.

#### [MODIFY] [_.js](file:///home/mingliangc/wordpress-example/src/page/checkout/_.js)
- Update `alt="Black and White Summer Portrait"` in `generateHTML_item` to `alt="${p.name}"`.

#### [MODIFY] [_.js](file:///home/mingliangc/wordpress-example/src/page/order-received/_.js)
- Add `import { alert } from '/src/alert.mjs';` at the top of the file.

---

### 3. Contact Us Inquiry Form Redirect in MPA Mode (`src/page/contact-us/inquiry-submitted/`)

In [`src/page/contact-us/_.js`](file:///home/mingliangc/wordpress-example/src/page/contact-us/_.js#L70-L80), submitting `#inquiry-form` schedules a 5-second `setTimeout` to return to `previousPage` and immediately sets `l.pathname += '/inquiry-submitted'`. In MPA mode, setting `location.pathname` triggers a full browser navigation, unloading the page and cancelling the timer. As a result, `/contact-us/inquiry-submitted` stays on *"redirecting you back to previous page..."* indefinitely.

#### [NEW] [_.js](file:///home/mingliangc/wordpress-example/src/page/contact-us/inquiry-submitted/_.js)
- Add a route controller for `/contact-us/inquiry-submitted` that redirects back to `/contact-us` after 5000ms.

```javascript
export default function () {
    setTimeout(() => {
        window.location.pathname = '/contact-us';
    }, 5000);
}
```

---

### 4. Linting Configuration (`eslint.config.mjs`)

- Running `npm run lint` currently reports an error on the minified Workbox snippet in [`public/sw.js`](file:///home/mingliangc/wordpress-example/public/sw.js#L5).

#### [MODIFY] [eslint.config.mjs](file:///home/mingliangc/wordpress-example/eslint.config.mjs)
- Add `"public/sw.js"` to the global `ignores` array so `npm run lint` passes with 0 errors.

---

## Verification Plan

### Automated Verification
- Run `npm run lint` to verify 0 ESLint errors.
- Run `npm run build` to verify Vite builds `./dist` cleanly.

### Manual Verification
1. **Custom Code Injection Sequencing**: Test with [`src/_test/custom code injector test.html`](file:///home/mingliangc/wordpress-example/src/_test/custom%20code%20injector%20test.html) snippets in `/my-account` to verify `0 inline` $\rightarrow$ `1 inline` $\rightarrow$ `2 : setTimeout 0s` $\rightarrow$ `3 : setTimeout 0s` $\rightarrow$ `4 : readystatechange` $\rightarrow$ `5 : DOMContentLoaded` $\rightarrow$ `6 : load` $\rightarrow$ `last : pageshow` order is completely unchanged.
2. **Cart & Checkout Flow**: Add products from `/shop` and `/product/<slug>`, open `/cart`, verify product links navigate to `/product/<slug>`, test quantity input focus/blur and `＋`/`－` buttons, proceed to `/checkout`, test "Return to Cart", and place an order to verify `/order-received`.
3. **Contact Us Inquiry Form**: Submit `#inquiry-form` on `/contact-us`, verify navigation to `/contact-us/inquiry-submitted` and automatic redirect back to `/contact-us` after 5 seconds.
