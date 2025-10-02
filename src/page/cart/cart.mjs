
import { Product } from '../product/product.mjs';

export class Cart {
    /** @type {string[]} - list of product ids */
    #items = [];
    constructor() {
        if (!localStorage['product-cart']) return;

        const data = this.#unHex(localStorage['product-cart']).split(',');
        const productIds = JSON.parse((new TextDecoder()).decode(new Uint8Array(data)));

        this.#items = productIds;
        console.log('init cart: ', this);
    }

    allProducts() {
        // count quantity, group by id

        /** @type {Map<number, Product>} - { id: product } */
        const products = new Map();
        try {
            const list = this.#allProducts();
            for (const x of list) {
                if (x.id === undefined) continue; // filter out faulty data
                const ex = products.get(x.id);
                if (ex) {
                    ex.quantity += 1;
                    continue;
                }
                else {
                    products.set(x.id, x);
                }
            }
            return products.values();
        } catch (err) {
            console.error('error, resetting cart...');
            Cart.reset();
            throw err;
        }
    }

    #allProducts() {
        // recreate products from ids
        const products = [], items = this.#items, len = items.length;
        for (let i = 0; i < len; ++i) {
            products[i] = new Product(items[i]);
        }
        return products;
    }

    static get maxQuantityPerItem() { return 69; }
    /** 
     * @param {string} productId 
     * @param {number} quantity
     * @returns {number} - number of products added; low than the specified quantity if cart size exceeded
     * */
    add(productId, quantity = 1) {
        // console.log({ cart: this, items: this.#items, productId });
        (new Product(productId)).id === productId; //verify productId

        let currentQuantity = this.#items.filter(id => id === productId).length;
        const maxQty = Cart.maxQuantityPerItem;
        console.log({ currentQuantity });
        let i = 0;
        const remainingSlot = maxQty - (currentQuantity + quantity);
        for (; i < quantity; ++i, ++currentQuantity) {
            if (currentQuantity >= maxQty) break;
            this.#items.push(productId);
        }
        this.#save();

        return i;
    }

    /** @param {string} productId */
    remove(productId) {
        this.#items = this.#items.filter(x => x !== productId);
        this.#save();
    }

    #save() {
        const cartData = JSON.stringify(this.#items);
        localStorage['product-cart'] = this.#toHex(new TextEncoder().encode(cartData).join(','));
    }

    #toHex(text) {
        return text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    }

    #unHex(hex) {
        return hex.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
    }

    /**
     * @param {string} productId 
     * @param {number} quantity
     * */
    changeQuantity(productId, quantity) {
        const len = this.#items.length, items2 = [];
        let qty = quantity < 0 ? 1 : Math.min(quantity, Cart.maxQuantityPerItem);
        // console.log({ qty });
        // decrease quantity; move limited to new array
        for (let i = 0; i < len; ++i) {
            if (this.#items[i] === productId) {
                if (qty < 1) continue;
                --qty;
            }
            items2.push(this.#items[i]);
        }

        // icrease quantity; add remaining, if any
        for (; qty > 0; --qty) {
            items2.push(productId);
        }

        this.#items = items2;
        this.#save();
    }

    static reset() {
        localStorage.removeItem('product-cart');
    }

    reset() {
        Cart.reset();
    }

    totalPriceText(addon_price = 0.00) {
        const products = this.allProducts();
        let subtotal = 0.0, h = products.next();
        const currency = h.value?.currency;
        for (; h.done !== true; h = products.next()) {
            const x = h.value;
            subtotal += x.price * x.quantity;
        }
        const totalPrice = subtotal + addon_price;
        return Product.formatPrice(currency, totalPrice);
    }
};