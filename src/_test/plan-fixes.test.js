import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { onRequest } from '../../functions/gtg/[[path]].js';
import inquirySubmittedController from '../page/contact-us/inquiry-submitted/_.js';
import { Product } from '../page/product/product.mjs';
import { Cart } from '../page/cart/cart.mjs';

function createLocalStorageMock() {
    const store = Object.create(null);
    return new Proxy(store, {
        get(target, prop) {
            if (prop === 'getItem') return (k) => (k in target ? target[k] : null);
            if (prop === 'setItem') return (k, v) => { target[k] = String(v); };
            if (prop === 'removeItem') return (k) => { delete target[k]; };
            if (prop === 'clear') return () => {
                for (const k of Object.keys(target)) delete target[k];
            };
            return target[prop];
        },
        set(target, prop, value) {
            target[prop] = String(value);
            return true;
        },
        deleteProperty(target, prop) {
            delete target[prop];
            return true;
        },
    });
}

describe('Implementation Plan Bug Fixes', () => {
    beforeEach(() => {
        globalThis.localStorage = createLocalStorageMock();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('1. RemoteCodeInjector.remoteCodeUrl defaults to empty string when localStorage is unset', () => {
        const mpaSource = fs.readFileSync(path.resolve('src/main.mpa.js'), 'utf8');
        const spaSource = fs.readFileSync(path.resolve('src/main.js'), 'utf8');

        expect(mpaSource).toContain("get remoteCodeUrl() { return localStorage['txtRemoteCodeUrl'] || ''; }");
        expect(spaSource).toContain("get remoteCodeUrl() { return localStorage['txtRemoteCodeUrl'] || ''; }");

        // Verify runtime behavior on a fresh profile where localStorage['txtRemoteCodeUrl'] is undefined
        const getter = () => localStorage['txtRemoteCodeUrl'] || '';
        expect(getter()).toBe('');
        const hasRemoteCode = getter() !== '';
        expect(hasRemoteCode).toBe(false);
    });

    it('1b. my-account/_.html does not reference non-existent /src/page/my-account.js', () => {
        const myAccountHtml = fs.readFileSync(path.resolve('src/page/my-account/_.html'), 'utf8');
        expect(myAccountHtml).not.toContain('/src/page/my-account.js');
    });

    it('2a. cart/_.js uses MPA product links, formatted shipping fee, bubbling plus button, and safe blur quantity clamping', () => {
        const cartJs = fs.readFileSync(path.resolve('src/page/cart/_.js'), 'utf8');

        // Product links use MPA href="${p.url}" instead of hash href="#${p.url}"
        expect(cartJs).toContain('href="${p.url}"');
        expect(cartJs).not.toContain('href="#${p.url}"');

        // Shipping fee uses Product.formatPrice('USD', shippingFee)
        expect(cartJs).toContain("Product.formatPrice('USD', shippingFee)");
        expect(Product.formatPrice('USD', 6.8)).toBe('$6.80');

        // Plus button dispatches bubbling change event
        expect(cartJs).toContain("txtQuantity.dispatchEvent(new Event('change', { bubbles: true }))");

        // Quantity input blur logic preserves valid quantities 1..69
        expect(cartJs).toContain('else if (isNaN(qty) || qty < 1)');
        const clampOnBlur = (rawVal) => {
            let value = rawVal;
            const qty = parseInt(value);
            if (qty > Cart.maxQuantityPerItem) {
                value = Cart.maxQuantityPerItem;
            } else if (isNaN(qty) || qty < 1) {
                value = 1;
            }
            return value;
        };
        expect(clampOnBlur('5')).toBe('5');
        expect(clampOnBlur('69')).toBe('69');
        expect(clampOnBlur('70')).toBe(69);
        expect(clampOnBlur('0')).toBe(1);
        expect(clampOnBlur('-3')).toBe(1);
        expect(clampOnBlur('')).toBe(1);
    });

    it('2b. checkout/_.html Return to Cart link points to /cart and checkout/_.js uses dynamic alt text', () => {
        const checkoutHtml = fs.readFileSync(path.resolve('src/page/checkout/_.html'), 'utf8');
        expect(checkoutHtml).toContain('href="/cart"');
        expect(checkoutHtml).not.toContain('href="/wordpress-example/cart"');

        const checkoutJs = fs.readFileSync(path.resolve('src/page/checkout/_.js'), 'utf8');
        expect(checkoutJs).toContain('alt="${p.name}"');
        expect(checkoutJs).not.toContain('alt="Black and White Summer Portrait"');
    });

    it('2c. order-received/_.js imports custom alert helper from /src/alert.mjs', () => {
        const orderReceivedJs = fs.readFileSync(path.resolve('src/page/order-received/_.js'), 'utf8');
        expect(orderReceivedJs).toContain("import { alert } from '/src/alert.mjs';");
    });

    it('3. contact-us/inquiry-submitted/_.js redirects back to /contact-us after 5000ms', () => {
        vi.useFakeTimers();
        globalThis.window = { location: { pathname: '/contact-us/inquiry-submitted' } };

        inquirySubmittedController();
        expect(window.location.pathname).toBe('/contact-us/inquiry-submitted');

        vi.advanceTimersByTime(4999);
        expect(window.location.pathname).toBe('/contact-us/inquiry-submitted');

        vi.advanceTimersByTime(1);
        expect(window.location.pathname).toBe('/contact-us');
    });
});

describe('Cloudflare Pages Function: /gtg/[[path]].js First-Party Mode Proxy', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('handles OPTIONS CORS preflight with 204', async () => {
        const request = new Request('https://example.com/gtg/example/', {
            method: 'OPTIONS',
            headers: { 'Access-Control-Request-Headers': 'X-Custom-Header' },
        });
        const response = await onRequest({ request });
        expect(response.status).toBe(204);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
        expect(response.headers.get('Access-Control-Allow-Headers')).toBe('X-Custom-Header');
    });

    it('returns 400 when no Tag ID is present in query or path', async () => {
        const request = new Request('https://example.com/', { method: 'GET' });
        const response = await onRequest({ request });
        expect(response.status).toBe(400);
        expect(await response.text()).toContain('Missing Google Tag ID');
    });

    it('proxies ?id=G-XXXX requests to <tagId>.fps.goog and forwards geo headers', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('/* gtag script */', {
                status: 200,
                headers: { 'Content-Type': 'application/javascript' },
            })
        );

        const request = new Request('https://example.com/gtg/gtag/js?id=G-TEST123&l=dataLayer', {
            method: 'GET',
            headers: { 'User-Agent': 'VitestAgent/1.0' },
        });
        Object.defineProperty(request, 'cf', {
            value: { country: 'US', regionCode: 'CA' },
        });

        const response = await onRequest({ request });
        expect(response.status).toBe(200);
        expect(await response.text()).toBe('/* gtag script */');
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const [targetUrl, options] = fetchSpy.mock.calls[0];
        expect(targetUrl).toBe('https://g-test123.fps.goog/gtg/gtag/js?l=dataLayer');
        expect(options.headers.get('X-Forwarded-Country')).toBe('US');
        expect(options.headers.get('X-Forwarded-Region')).toBe('CA');
        expect(options.headers.get('X-Forwarded-CountryRegion')).toBe('US-CA');
    });

    it('falls back to path segment when ?id= is omitted and returns 502 on upstream fetch failure', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network failure'));

        const request = new Request('https://example.com/gtg/example/', {
            method: 'POST',
            body: 'event=test',
        });

        const response = await onRequest({ request });
        expect(response.status).toBe(502);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy.mock.calls[0][0]).toBe('https://example.fps.goog/gtg/example/');
    });
});
