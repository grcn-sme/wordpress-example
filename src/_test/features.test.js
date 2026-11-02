import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { Product } from '../page/product/product.mjs';
import { OrderSummary } from '../page/order-received/order-received.mjs';
import orderReceivedController from '../page/order-received/_.js';
import { IdbWrapper } from '../IdbWrapper.mjs';
import { getTheme, setTheme, toggleTheme, initTheme } from '../theme.mjs';

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

function createIndexedDBMock() {
    const databases = new Map();

    return {
        open(dbName, version = 1) {
            const req = {
                result: null,
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null,
                onblocked: null,
            };

            queueMicrotask(() => {
                let dbEntry = databases.get(dbName);
                const isUpgrade = !dbEntry || dbEntry.version < version;
                if (!dbEntry) {
                    dbEntry = { version, stores: new Map() };
                    databases.set(dbName, dbEntry);
                } else {
                    dbEntry.version = version;
                }

                const db = {
                    objectStoreNames: {
                        contains: (name) => dbEntry.stores.has(name),
                    },
                    createObjectStore(name, options = {}) {
                        const storeData = {
                            keyPath: options.keyPath || null,
                            records: new Map(),
                            indexes: new Map(),
                        };
                        dbEntry.stores.set(name, storeData);
                        return {
                            createIndex(indexName, keyPath, idxOptions = {}) {
                                storeData.indexes.set(indexName, { keyPath, idxOptions });
                            },
                        };
                    },
                    transaction(storeNames) {
                        const names = Array.isArray(storeNames) ? storeNames : [storeNames];
                        const tx = {
                            oncomplete: null,
                            onerror: null,
                            onsuccess: null,
                            result: undefined,
                            objectStore(name) {
                                if (!names.includes(name) || !dbEntry.stores.has(name)) {
                                    throw new Error(`Store ${name} not found in transaction`);
                                }
                                const store = dbEntry.stores.get(name);
                                return {
                                    indexNames: [...store.indexes.keys()],
                                    add(item, explicitKey) {
                                        const key = explicitKey ?? (store.keyPath ? item[store.keyPath] : undefined);
                                        store.records.set(key, structuredClone(item));
                                    },
                                    put(item, explicitKey) {
                                        const key = explicitKey ?? (store.keyPath ? item[store.keyPath] : undefined);
                                        store.records.set(key, structuredClone(item));
                                    },
                                    delete(key) {
                                        store.records.delete(key);
                                    },
                                    get(key) {
                                        const getReq = { result: undefined, onsuccess: null, onerror: null };
                                        queueMicrotask(() => {
                                            const val = store.records.get(key);
                                            getReq.result = val !== undefined ? structuredClone(val) : undefined;
                                            getReq.onsuccess?.({ target: getReq });
                                        });
                                        return getReq;
                                    },
                                    openCursor() {
                                        const cursorReq = { result: null, onsuccess: null, onerror: null };
                                        const entries = [...store.records.entries()];
                                        let idx = 0;
                                        const advance = () => {
                                            queueMicrotask(() => {
                                                if (idx >= entries.length) {
                                                    cursorReq.result = null;
                                                    cursorReq.onsuccess?.({ target: cursorReq });
                                                    return;
                                                }
                                                const [k, v] = entries[idx++];
                                                cursorReq.result = {
                                                    key: k,
                                                    value: structuredClone(v),
                                                    continue: advance,
                                                };
                                                cursorReq.onsuccess?.({ target: cursorReq });
                                            });
                                        };
                                        advance();
                                        return cursorReq;
                                    },
                                    index(indexName) {
                                        const idxMeta = store.indexes.get(indexName);
                                        return {
                                            get(searchValue) {
                                                const idxReq = { result: undefined, onsuccess: null, onerror: null };
                                                queueMicrotask(() => {
                                                    for (const val of store.records.values()) {
                                                        if (val[idxMeta.keyPath] === searchValue) {
                                                            idxReq.result = structuredClone(val);
                                                            break;
                                                        }
                                                    }
                                                    idxReq.onsuccess?.({ target: idxReq });
                                                });
                                                return idxReq;
                                            },
                                        };
                                    },
                                };
                            },
                        };
                        queueMicrotask(() => {
                            tx.oncomplete?.({ target: tx });
                        });
                        return tx;
                    },
                    close() {},
                };

                req.result = db;
                if (isUpgrade && typeof req.onupgradeneeded === 'function') {
                    req.onupgradeneeded({ target: req });
                }
                req.onsuccess?.({ target: req });
            });

            return req;
        },
    };
}

describe('Image displaying issue fix (src/main.mpa.js, src/main.js, src/page/product/product.mjs)', () => {
    it('routes image paths like /product/img/*.jpg to loadImageFile instead of 404 in MPA router', () => {
        const mpaSource = fs.readFileSync(path.resolve('src/main.mpa.js'), 'utf8');
        const spaSource = fs.readFileSync(path.resolve('src/main.js'), 'utf8');

        expect(mpaSource).toContain("pathname.endsWith('.jpg')");
        expect(mpaSource).toContain("pathname.endsWith('.webp')");
        expect(mpaSource).toContain('return loadImageFile(new URL(location.href));');

        // Verify loadImageFile resolves /product/img/... to root-relative /page/product/img/...
        expect(mpaSource).toContain("const imgPath = url.pathname.startsWith('/page/') ? url.pathname : `/page${url.pathname}`;");
        expect(spaSource).toContain("const imgPath = url.pathname.startsWith('/page/') ? url.pathname : `/page${url.pathname}`;");

        const url = new URL('https://example.com/product/img/white-black-black-and-white-photograph-monochrome-photography.jpg');
        const imgPath = url.pathname.startsWith('/page/') ? url.pathname : `/page${url.pathname}`;
        expect(imgPath).toBe('/page/product/img/white-black-black-and-white-photograph-monochrome-photography.jpg');
    });

    it('uses root-relative /page/product/img/... paths in Product catalog model', () => {
        for (const id of ['83', '85', '75', '87', '59', '89']) {
            const p = new Product(id);
            expect(p.img_src.startsWith('/page/product/img/')).toBe(true);
        }
    });
});

describe('Shipping options in Cart and Checkout templates & controllers', () => {
    it('includes all 3 shipping options (Free $0.00, Flat rate $6.80, Express $20.00) in cart and checkout HTML', () => {
        const cartHtml = fs.readFileSync(path.resolve('src/page/cart/_.html'), 'utf8');
        const checkoutHtml = fs.readFileSync(path.resolve('src/page/checkout/_.html'), 'utf8');

        for (const html of [cartHtml, checkoutHtml]) {
            expect(html).toContain('value="free_shipping:1"');
            expect(html).toContain('value="flat_rate:3"');
            expect(html).toContain('value="express_shipping:2"');
            expect(html).toContain('$0.00');
            expect(html).toContain('$20.00');
        }
    });
});

describe('Order completed (/order-received?order_id=) UI & Order History with IndexedDB (IdbWrapper)', () => {
    beforeEach(() => {
        globalThis.localStorage = createLocalStorageMock();
        globalThis.indexedDB = createIndexedDBMock();
    });

    it('includes WooCommerce order confirmation stylesheets and order history section in order-received/_.html', () => {
        const orderReceivedHtml = fs.readFileSync(path.resolve('src/page/order-received/_.html'), 'utf8');
        expect(orderReceivedHtml).toContain('/css/order-confirmation-totals.css');
        expect(orderReceivedHtml).toContain('/css/order-confirmation-shipping-address.css');
        expect(orderReceivedHtml).toContain('/css/order-confirmation-billing-address.css');
        expect(orderReceivedHtml).toContain('id="order-history-wrapper"');
        expect(orderReceivedHtml).toContain('id="order-history-list"');
    });

    it('persists, reads by order_id, lists, and deletes orders in IndexedDB via OrderSummary and IdbWrapper', async () => {
        const o1 = new OrderSummary();
        o1.id = '#order_first';
        o1.date = new Date('2026-10-01T10:00:00Z');
        o1.shippingFee = 0.00;
        o1.userEmailAddress = 'first@example.com';
        o1.products = [new Product('59')]; // $13.99

        const o2 = new OrderSummary();
        o2.id = '#order_second';
        o2.date = new Date('2026-11-01T15:30:00Z');
        o2.shippingFee = 20.00;
        o2.userEmailAddress = 'second@example.com';
        const bike = new Product('83');
        bike.quantity = 2;
        o2.products = [bike]; // 2 * $115 + $20 = $250.00

        await o1.saveToHistory();
        await o2.saveToHistory();

        // Read all orders sorted newest first
        const history = await OrderSummary.getOrderHistory();
        expect(history).toHaveLength(2);
        expect(history[0].id).toBe('#order_second');
        expect(history[0].totalPriceText()).toBe('$250.00');
        expect(history[1].id).toBe('#order_first');
        expect(history[1].totalPriceText()).toBe('$13.99');

        // Read specific order by ID (with or without leading '#')
        const found1 = await OrderSummary.getOrderById('#order_first');
        expect(found1).not.toBeNull();
        expect(found1.userEmailAddress).toBe('first@example.com');
        expect(found1.shippingFeeText()).toBe('$0.00');

        const foundWithoutHash = await OrderSummary.getOrderById('order_second');
        expect(foundWithoutHash).not.toBeNull();
        expect(foundWithoutHash.id).toBe('#order_second');
        expect(foundWithoutHash.shippingFeeText()).toBe('$20.00');

        // Delete order from history
        await OrderSummary.deleteOrderFromHistory('#order_first');
        const remaining = await OrderSummary.getOrderHistory();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].id).toBe('#order_second');
    });

    it('renders requested ?order_id= order and populates #order-history-list in order-received controller', async () => {
        const o1 = new OrderSummary();
        o1.id = '#order_older';
        o1.date = new Date('2026-10-01T10:00:00Z');
        o1.shippingFee = 0.00;
        o1.userEmailAddress = 'older@example.com';
        o1.products = [new Product('59')]; // $13.99
        await o1.saveToHistory();

        const o2 = new OrderSummary();
        o2.id = '#order_latest';
        o2.date = new Date('2026-11-01T15:30:00Z');
        o2.shippingFee = 20.00;
        o2.userEmailAddress = 'latest@example.com';
        o2.products = [new Product('83')]; // $115 + $20 = $135.00
        o2.save_checkout(); // saves o2 as localStorage['last order']

        const summaryEl = { innerHTML: '' };
        const tbodyEl = { innerHTML: '' };
        const shippingEl = { textContent: '' };
        const totalEl = { textContent: '' };
        const historyListEl = {
            innerHTML: '',
            querySelectorAll: () => [],
        };

        const queryMap = {
            'div[data-block-name="woocommerce/order-confirmation-summary"]': summaryEl,
            '#app > div > main > div.wc-block-order-confirmation-totals-wrapper.alignwide > div > table > tbody': tbodyEl,
            '#app > div > main > div.wc-block-order-confirmation-totals-wrapper.alignwide > div > table > tfoot > tr:nth-child(1) > td > span': shippingEl,
            '#app > div > main > div.wc-block-order-confirmation-totals-wrapper.alignwide > div > table > tfoot > tr:nth-child(2) > td > span': totalEl,
        };

        globalThis.location = { search: '?order_id=%23order_older' };
        globalThis.document = {
            body: {
                querySelector: (sel) => queryMap[sel] || null,
            },
            querySelector: (sel) => queryMap[sel] || null,
            getElementById: (id) => (id === 'order-history-list' ? historyListEl : null),
        };

        await orderReceivedController();

        expect(summaryEl.innerHTML).toContain('#order_older');
        expect(summaryEl.innerHTML).toContain('older@example.com');
        expect(tbodyEl.innerHTML).toContain('Teddy Bear');
        expect(tbodyEl.innerHTML).toContain('wc-order-item-thumbnail');
        expect(shippingEl.textContent).toBe('$0.00');
        expect(totalEl.textContent).toBe('$13.99');
        expect(historyListEl.innerHTML).toContain('#order_older');
        expect(historyListEl.innerHTML).toContain('#order_latest');
    });

    it('supports direct IdbWrapper CRUD operations (open, set, read, readAll, readByIndex, delete)', async () => {
        const db = await IdbWrapper.open('test-db', 1, (idb) => {
            const store = IdbWrapper.createObjectStore(idb, 'items', { keyPath: 'id' });
            store?.createIndex('byCode', 'code', { unique: true });
        });

        await db.set('items', [
            { id: '1', code: 'A1', name: 'Alpha' },
            { id: '2', code: 'B2', name: 'Beta' },
        ]);

        const item1 = await db.read('items', '1');
        expect(item1).toEqual({ id: '1', code: 'A1', name: 'Alpha' });

        const byCode = await db.readByIndex('items', 'byCode', 'B2');
        expect(byCode).toEqual({ id: '2', code: 'B2', name: 'Beta' });

        const collected = [];
        await db.readAll('items', (k, v) => {
            collected.push(v.name);
            return true;
        });
        expect(collected).toEqual(['Alpha', 'Beta']);

        await db.delete('items', ['1']);
        expect(await db.read('items', '1')).toBeUndefined();
        db.close();
    });
});

describe('Dark mode support (src/style.css, src/theme.mjs, index.html)', () => {
    beforeEach(() => {
        globalThis.localStorage = createLocalStorageMock();
        const btn = {
            dataset: {},
            attributes: {},
            textContent: '',
             listeners: {},
            setAttribute(k, v) { this.attributes[k] = v; },
            getAttribute(k) { return this.attributes[k]; },
            addEventListener(ev, fn) { this.listeners[ev] = fn; },
        };
        globalThis.document = {
            documentElement: { dataset: {} },
            getElementById: (id) => (id === 'btnDarkMode' ? btn : null),
        };
    });

    it('enables dark mode CSS rules in src/style.css and toggle button in index.html', () => {
        const styleCss = fs.readFileSync(path.resolve('src/style.css'), 'utf8');
        const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');

        expect(styleCss).toContain(':root[data-theme="dark"]');
        expect(styleCss).toContain('@media (prefers-color-scheme: dark)');
        expect(indexHtml).toContain('id="btnDarkMode"');
    });

    it('gets, sets, and toggles theme state in localStorage and documentElement.dataset', () => {
        initTheme();
        expect(getTheme()).toBe('light');

        expect(toggleTheme()).toBe('dark');
        expect(localStorage['theme']).toBe('dark');
        expect(document.documentElement.dataset.theme).toBe('dark');

        expect(toggleTheme()).toBe('light');
        expect(localStorage['theme']).toBe('light');
        expect(document.documentElement.dataset.theme).toBe('light');

        setTheme('dark');
        expect(getTheme()).toBe('dark');
    });
});
