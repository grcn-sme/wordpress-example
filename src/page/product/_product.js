
export class Product {
    id;
    name = null;
    price = 0.00;
    currency = 'USD';
    quantity = 1;

    constructor(id) {
        this.id = id;
        if (id) {
            const product = this.getProduct(id);
            this.name = product.name;
            this.price = product.price;
            this.currency = product.currency;
            this.quantity = product.quantity;
        }
    }
    getProduct(id) {
        if (id === '83') {
            return {
                id: id,
                name: '3-Speed Bike',
                price: 115.0,
                currency: 'USD',
                quantity: 1
            };
        }
        else if (id === '85') {
            return {
                id: id,
                name: 'Black and White Summer Portrait',
                price: 115.0,
                currency: 'USD',
                quantity: 1
            };
        }
        else if (id === '75') {
            return {
                id: id,
                name: 'Crayfish',
                price: 59.0,
                currency: 'USD',
                quantity: 1
            };
        }
        else if (id === '87') {
            return {
                id: id,
                name: 'Leather-Clad Leisure Chair',
                price: 249.0,
                currency: 'USD',
                quantity: 1
            };
        }
        else if (id === '59') {
            return {
                id: id,
                name: 'Teddy Bear',
                price: 13.99,
                currency: 'USD',
                quantity: 1
            };
        }
        else if (id === '89') {
            return {
                id: id,
                name: 'Vintage Typewriter',
                price: 90.00,
                currency: 'USD',
                quantity: 1
            };
        }
        throw new Error('undefined product id: ' + id);
    }
}