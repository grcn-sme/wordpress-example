import { Product } from './product/_product.js';

export class OrderSummary {

    /** @type number */
    shippingFee = 0.00;

    /** @type Product[] - must a list to allow JSON.stringify for storing properly */
    products;

    /** @type Date */
    date;

    /** @type string */
    id;

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
        let data;
        data = localStorage['last order'].split(',');
        data = JSON.parse((new TextDecoder()).decode(new Uint8Array(data)));

        // map all json attribute to this
        const summary = new OrderSummary();
        for (const key in summary) {
            console.log('data[key]', data[key], 'key', key);
            if (!data[key]) throw new Error(`provided data has no field '${key}' defined`);
            summary[key] = data[key];
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
        localStorage['last order'] = (new TextEncoder()).encode(data).join(',');
    }

    // #toHex(text) {
    //     return text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    // }

    // #unHex(hex) {
    //     return hex.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
    // }
}