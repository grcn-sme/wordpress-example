import { Product } from '../product/product.mjs';
import { IdbWrapper } from '../../IdbWrapper.mjs';

export class OrderSummary {

    /** @type number */
    shippingFee = 0.00;

    /** @type Product[] - must a list to allow JSON.stringify for storing properly */
    products = null;

    /** @type Date */
    date = null;

    /** @type string */
    id = null;

    userEmailAddress = '';

    static get DB_NAME() { return 'woocommerce-order-history'; }
    static get DB_VERSION() { return 1; }
    static get STORE_NAME() { return 'orders'; }

    constructor() { }

    shippingFeeText() {
        return Product.formatPrice(this.products[0].currency, this.shippingFee);
    }

    totalPriceText() {
        const products = this.products, len = products.length;
        let subtotal = 0.0;
        for (let i = 0; i < len; i++) {
            subtotal += products[i].price * products[i].quantity;
        }

        const totalPrice = subtotal + this.shippingFee;
        const currency = this.getPaymentCurrency();
        return Product.formatPrice(currency, totalPrice);
    }

    getPaymentCurrency() {
        const currency = this.products[0]?.currency;
        if (!currency) {
            throw new Error('invalid order summary data');
        }
        return currency;
    }

    getDate() {
        return new Date(this.date);
    }

    /** @param {object} _orderSummary */
    static from(_orderSummary) {
        // map all json attribute to this
        const summary = new OrderSummary();
        for (const key in summary) {
            console.log('data[key]', _orderSummary[key], 'key', key);
            if (Object.hasOwn(_orderSummary, key) === false) throw new Error(`provided data has no field '${key}' defined`);
            summary[key] = _orderSummary[key];
        }

        // map to custom object
        const products = [...summary.products], len = products.length;
        for (let i = 0; i < len; ++i) {
            products[i] = Product.from(products[i]);
        }
        summary.products = products;
        console.log({ products: summary.products });
        return summary;
    }

    static getLastOrder() {
        if (!localStorage['last order']) return null;
        /** @type {OrderSummary} */
        let _orderSummary;
        _orderSummary = localStorage['last order'].match(/.{1,2}/g).map(hex => parseInt(hex, 16));
        _orderSummary = (new TextDecoder()).decode(new Uint8Array(_orderSummary));
        _orderSummary = JSON.parse(_orderSummary);

        return OrderSummary.from(_orderSummary);
    }

    save_checkout() {
        const data = JSON.stringify(this);
        localStorage['last order'] = [...(new TextEncoder()).encode(data)].map(x => x.toString(16).padStart(2, '0')).join('');
        if ((typeof window !== 'undefined' && window.indexedDB) || typeof globalThis.indexedDB !== 'undefined') {
            this.saveToHistory().catch(err => console.warn(err));
        }
    }

    /** @returns {Promise<IdbWrapper>} */
    static openOrderDb() {
        return IdbWrapper.open(OrderSummary.DB_NAME, OrderSummary.DB_VERSION, (db) => {
            const ost = IdbWrapper.createObjectStore(db, OrderSummary.STORE_NAME, { keyPath: 'id' });
            ost?.createIndex('userEmailAddress', 'userEmailAddress', { unique: false });
        });
    }

    async saveToHistory() {
        const db = await OrderSummary.openOrderDb();
        try {
            const plain = JSON.parse(JSON.stringify(this));
            await db.set(OrderSummary.STORE_NAME, [plain]);
        } finally {
            db.close();
        }
    }

    /**
     * @param {string} orderId
     * @returns {Promise<OrderSummary | null>}
     */
    static async getOrderById(orderId) {
        if (!orderId) return null;
        const db = await OrderSummary.openOrderDb();
        try {
            let record = await db.read(OrderSummary.STORE_NAME, orderId);
            if (!record && !orderId.startsWith('#')) {
                record = await db.read(OrderSummary.STORE_NAME, '#' + orderId);
            }
            return record ? OrderSummary.from(record) : null;
        } finally {
            db.close();
        }
    }

    /**
     * @returns {Promise<OrderSummary[]>}
     */
    static async getOrderHistory() {
        const db = await OrderSummary.openOrderDb();
        try {
            const orders = [];
            await db.readAll(OrderSummary.STORE_NAME, (_key, value) => {
                try {
                    orders.push(OrderSummary.from(value));
                } catch (err) {
                    console.warn(err);
                }
                return true;
            });
            orders.sort((a, b) => b.getDate().getTime() - a.getDate().getTime());
            return orders;
        } finally {
            db.close();
        }
    }

    /**
     * @param {string} orderId
     */
    static async deleteOrderFromHistory(orderId) {
        const db = await OrderSummary.openOrderDb();
        try {
            await db.delete(OrderSummary.STORE_NAME, [orderId]);
        } finally {
            db.close();
        }
    }

    // #toHex(text) {
    //     return text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    // }

    // #unHex(hex) {
    //     return hex.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
    // }
}