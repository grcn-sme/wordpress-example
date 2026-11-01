import { describe, it, expect, beforeEach } from 'vitest';
import { Product } from '../page/product/product.mjs';
import { Cart } from '../page/cart/cart.mjs';
import { OrderSummary } from '../page/order-received/order-received.mjs';

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

describe('Product catalog model (src/page/product/product.mjs)', () => {
    it('loads all 6 hardcoded products with expected metadata and formatting', () => {
        const expected = [
            { id: '83', name: '3-Speed Bike', price: 115.0, text: '$115.00', url: '/product/3-speed-bike' },
            { id: '85', name: 'Black and White Summer Portrait', price: 115.0, text: '$115.00', url: '/product/black-and-white-summer-portrait' },
            { id: '75', name: 'Crayfish', price: 59.0, text: '$59.00', url: '/product/crayfish' },
            { id: '87', name: 'Leather-Clad Leisure Chair', price: 249.0, text: '$249.00', url: '/product/leather-clad-leisure-chair' },
            { id: '59', name: 'Teddy Bear', price: 13.99, text: '$13.99', url: '/product/teddy-bear' },
            { id: '89', name: 'Vintage Typewriter', price: 90.0, text: '$90.00', url: '/product/vintage-typewriter' },
        ];

        for (const item of expected) {
            const p = new Product(item.id);
            expect(p.id).toBe(item.id);
            expect(p.name).toBe(item.name);
            expect(p.price).toBe(item.price);
            expect(p.currency).toBe('USD');
            expect(p.quantity).toBe(1);
            expect(p.url).toBe(item.url);
            expect(p.priceText()).toBe(item.text);
        }
    });

    it('calculates subTotalText and formats currency accurately', () => {
        const p = new Product('59');
        p.quantity = 3;
        expect(p.subTotalText()).toBe('$41.97');
        expect(Product.formatPrice('USD', 6.8)).toBe('$6.80');
    });

    it('throws on unknown product id', () => {
        expect(() => new Product('999')).toThrow('undefined product id: 999');
    });

    it('reconstructs Product via Product.from() and validates fields', () => {
        const original = new Product('75');
        original.quantity = 4;
        const plain = JSON.parse(JSON.stringify(original));
        const restored = Product.from(plain);
        expect(restored).toBeInstanceOf(Product);
        expect(restored.id).toBe('75');
        expect(restored.quantity).toBe(4);
        expect(restored.subTotalText()).toBe('$236.00');

        expect(() => Product.from({ id: '75', name: 'Crayfish' })).toThrow(/has no field/);
    });
});

describe('Cart state management (src/page/cart/cart.mjs)', () => {
    beforeEach(() => {
        globalThis.localStorage = createLocalStorageMock();
    });

    it('starts empty when localStorage has no cart data', () => {
        const cart = new Cart();
        expect([...cart.allProducts()]).toEqual([]);
        expect(cart.totalPriceText()).toBe('?.??');
    });

    it('adds products, persists hex-encoded cart in localStorage, and aggregates quantities', () => {
        const cart = new Cart();
        expect(cart.add('83', 2)).toBe(2);
        expect(cart.add('59', 1)).toBe(1);
        expect(localStorage['product-cart']).toMatch(/^[0-9a-f]+$/);

        const reloadedCart = new Cart();
        const items = [...reloadedCart.allProducts()];
        expect(items).toHaveLength(2);
        expect(items[0].id).toBe('83');
        expect(items[0].quantity).toBe(2);
        expect(items[1].id).toBe('59');
        expect(items[1].quantity).toBe(1);

        // 2 * 115 + 13.99 = 243.99
        expect(reloadedCart.totalPriceText()).toBe('$243.99');
        expect(reloadedCart.totalPriceText(6.8)).toBe('$250.79');
    });

    it('enforces maxQuantityPerItem (69) when adding or changing quantity', () => {
        const cart = new Cart();
        const added = cart.add('85', 75);
        expect(added).toBe(Cart.maxQuantityPerItem);
        expect(cart.add('85', 5)).toBe(0);

        const [item] = [...cart.allProducts()];
        expect(item.quantity).toBe(69);

        cart.changeQuantity('85', 100);
        expect([...cart.allProducts()][0].quantity).toBe(69);

        cart.changeQuantity('85', -5);
        expect([...cart.allProducts()][0].quantity).toBe(1);
    });

    it('removes items and resets cart cleanly', () => {
        const cart = new Cart();
        cart.add('83', 2);
        cart.add('75', 1);
        cart.remove('83');

        const remaining = [...cart.allProducts()];
        expect(remaining).toHaveLength(1);
        expect(remaining[0].id).toBe('75');

        cart.reset();
        expect(localStorage['product-cart']).toBeUndefined();
    });

    it('resets corrupted cart data in localStorage when an invalid product ID is encountered', () => {
        const raw = JSON.stringify(['invalid-id']);
        const encoded = new TextEncoder().encode(raw).join(',');
        const hex = encoded.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
        localStorage['product-cart'] = hex;

        const cart = new Cart();
        expect(() => cart.allProducts()).toThrow('undefined product id: invalid-id');
        expect(localStorage['product-cart']).toBeUndefined();
    });
});

describe('OrderSummary persistence (src/page/order-received/order-received.mjs)', () => {
    beforeEach(() => {
        globalThis.localStorage = createLocalStorageMock();
    });

    it('returns null when no previous order exists', () => {
        expect(OrderSummary.getLastOrder()).toBeNull();
    });

    it('saves and restores checkout order summary with hydrated Product instances', () => {
        const order = new OrderSummary();
        order.id = '#test12345';
        order.date = new Date('2026-11-01T12:00:00Z');
        order.shippingFee = 6.8;
        order.userEmailAddress = 'trainee@example.com';

        const p1 = new Product('87');
        p1.quantity = 2;
        order.products = [p1];

        order.save_checkout();
        expect(localStorage['last order']).toMatch(/^[0-9a-f]+$/);

        const restored = OrderSummary.getLastOrder();
        expect(restored).not.toBeNull();
        expect(restored.id).toBe('#test12345');
        expect(restored.userEmailAddress).toBe('trainee@example.com');
        expect(restored.shippingFeeText()).toBe('$6.80');
        expect(restored.getPaymentCurrency()).toBe('USD');
        // 2 * 249 + 6.80 = 504.80
        expect(restored.totalPriceText()).toBe('$504.80');
        expect(restored.products[0]).toBeInstanceOf(Product);
        expect(restored.products[0].subTotalText()).toBe('$498.00');
    });
});
