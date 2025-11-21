
export class Product {
    id = null;
    name = null;
    price = 0.00;

    /** @type {string} - ISO currency code */
    currency = 'USD';

    quantity = 1;
    img_src = '';
    url = '';
    description = '';

    constructor(id) {
        this.id = id;
        if (id) {
            const product = this.getProduct(id);
            this.name = product.name;
            this.price = product.price;
            this.currency = product.currency;
            this.quantity = product.quantity;
            this.img_src = product.img_src;
            this.url = product.url;
            // this.description = product.description;
        }
    }
    getProduct(id) {
        if (id === '83') {
            return {
                id: id,
                name: '3-Speed Bike',
                price: 115.0,
                currency: 'USD',
                quantity: 1,
                img_src: './page/product/img/road-sport-vintage-wheel-retro-old.jpg',
                url: '/product/3-speed-bike',
            };
        }
        else if (id === '85') {
            return {
                id: id,
                name: 'Black and White Summer Portrait',
                price: 115.0,
                currency: 'USD',
                quantity: 1,
                img_src: './page/product/img/white-black-black-and-white-photograph-monochrome-photography.jpg',
                url: '/product/black-and-white-summer-portrait',

            };
        }
        else if (id === '75') {
            return {
                id: id,
                name: 'Crayfish',
                price: 59.0,
                currency: 'USD',
                quantity: 1,
                img_src: './page/product/img/Procambarus-alleni-Blue-crayfish-1.jpg',
                url: '/product/crayfish',
            };
        }
        else if (id === '87') {
            return {
                id: id,
                name: 'Leather-Clad Leisure Chair',
                price: 249.0,
                currency: 'USD',
                quantity: 1,
                img_src: './page/product/img/table-wood-house-chair-floor-window.jpg',
                url: '/product/leather-clad-leisure-chair',
            };
        }
        else if (id === '59') {
            return {
                id: id,
                name: 'Teddy Bear',
                price: 13.99,
                currency: 'USD',
                quantity: 1,
                img_src: './page/product/img/XL_bear_1946x.webp',
                url: '/product/teddy-bear',
            };
        }
        else if (id === '89') {
            return {
                id: id,
                name: 'Vintage Typewriter',
                price: 90.00,
                currency: 'USD',
                quantity: 1,
                img_src: './page/product/img/writing-typing-keyboard-technology-white-vintage.jpg',
                url: '/product/vintage-typewriter',
            };
        }
        throw new Error('undefined product id: ' + id);
    }

    // ui logic
    priceText() {
        return Product.formatPrice(this.currency, this.price);
    }

    subTotalText() {
        return Product.formatPrice(this.currency, this.price * this.quantity);
    }

    /** 
     * @param {string} currency 
     * @param {number} value 
     */
    static formatPrice(currency, value) {
        return value.toLocaleString("en-US", { style: "currency", currency: currency });
    }

    /** @param {Object} json */
    static from(json) {
        // for each own fields, map from json
        const product = new Product(json.id);
        for (const key in product) {
            if (Object.hasOwn(json, key) === false) throw new Error(`provided data has no field '${key}' defined`);
            product[key] = json[key];
        }
        return product;
    }
}