
import { Product } from './product/_product.js';

export class Cart {
    items = [];
    constructor() {
        if (!localStorage['product-cart']) return;

        const data = localStorage['product-cart'].split(',');
        const json = JSON.parse((new TextDecoder()).decode(new Uint8Array(data)));

        // transform json objects to custom object
        const products = [], items = json.items, len = json.items.length;
        for (let i = 0; i < len; ++i) {
            products[i] = new Product(items[i].id);
            products[i].name = items[i].name;
            products[i].price = items[i].price;
            products[i].quantity = items[i].quantity;
            products[i].currency = items[i].currency;
        }
        this.items = products;
    }

    /** @param {Product} item */
    add(product) {
        console.log({ product });
        const pid = product.id, items = this.items;
        const item0 = items.find(x => x.id === pid);
        if (item0 === undefined) {
            // if item not exists, push
            items.push(product);
        }
        else {
            // else increment quantity
            item0.quantity += 1;
        }

        console.log({ item0: item0, items: items, cart: this });
        const cartData = JSON.stringify(this);
        localStorage['product-cart'] = (new TextEncoder()).encode(cartData).join(',');
        return item0;
    }

    static reset() {
        localStorage.removeItem('product-cart');
    }
};