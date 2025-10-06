import { alert } from '/src/alert.mjs';
import { Product } from '../product/product.mjs';
import { Cart } from '../cart/cart.mjs';

export default function (appBody) {
    let cart = null;
    setTimeout(_ => {
        function addToCart(e) {
            const btn = e.currentTarget;
            try {
                const productId = btn.getAttribute('href').split('=')[1];
                if (cart === null)
                    cart = new Cart();
                const addedCount = cart.add(productId, 1);
                if (addedCount === 1) {
                    alert('Product added!');
                }
                else {
                    alert(`Maximum products exceeded!`);
                }
            }
            catch (err) {
                console.error(err); console.warn('resetting cart');
                Cart.reset();
            }
        }
        document.body.querySelectorAll('button[href^="?add-to-cart="]').forEach(function (x) {
            x.addEventListener('click', addToCart);
        });
    }, 0);

}