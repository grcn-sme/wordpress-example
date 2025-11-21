import { Product } from '../product/product.mjs';

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
        const currency = products[0]?.currency;
        if (!currency) {
            throw new Error('invalid order summary data');
        }
        const totalPrice = subtotal + this.shippingFee;
        return Product.formatPrice(currency, totalPrice);
    }

    getDate() {
        return new Date(this.date);
    }

    static getLastOrder() {
        if (!localStorage['last order']) return null;
        /** @type {OrderSummary} */
        let _orderSummary;
        _orderSummary = localStorage['last order'].match(/.{1,2}/g).map(hex => parseInt(hex, 16));
        _orderSummary = (new TextDecoder()).decode(new Uint8Array(_orderSummary));
        _orderSummary = JSON.parse(_orderSummary);

        // map all json attribute to this
        const summary = new OrderSummary();
        for (const key in summary) {
            console.log('data[key]', _orderSummary[key], 'key', key);
            if (Object.hasOwn(_orderSummary, key) === false) throw new Error(`provided data has no field '${key}' defined`);
            summary[key] = _orderSummary[key];
        }

        // map to custom object
        const products = summary.products, len = summary.products.length;
        for (let i = 0; i < len; ++i) {
            products[i] = Product.from(products[i]);
        }
        console.log({ products: summary.products });
        return summary;
    }

    save_checkout() {
        const data = JSON.stringify(this);
        localStorage['last order'] = [...(new TextEncoder()).encode(data)].map(x => x.toString(16)).join('');
    }

    // #toHex(text) {
    //     return text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    // }

    // #unHex(hex) {
    //     return hex.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
    // }
}