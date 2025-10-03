import { Product } from './product.mjs';
import { Cart } from '../cart/cart.mjs';
import { alert } from '/src/alert.mjs';

export default function () {

    /** @type {Cart} */
    let cart = null;
    document.body.addEventListener('submit', function (e) {
        if (e.target.classList.contains('cart') === false) return;
        e.preventDefault();

        /** @type {HTMLFormElement} */
        const form = e.target;
        const proId = form.querySelector('button[name="add-to-cart"]').value;

        try {
            const product = new Product(proId);
            const quantity = parseInt(form.querySelector('input[name="quantity"]')?.value) || 1;
            console.log({ product });
            if (cart === null)
                cart = new Cart();
            const addedCount = cart.add(product.id, quantity);
            // console.log({addedCount});
            if (addedCount === quantity) {
                alert('Product added!');
            }
            else if (addedCount > 0) {
                alert(`Maximum products exceeded, only ${addedCount} is added`);
            }
            else {
                alert(`Maximum products exceeded!`);
            }
        }
        catch (err) {
            console.error(err); console.warn('resetting cart');
            Cart.reset();
        }
        return false;
    });

    try {  // reset img size
        const pic = document.body.getElementsByTagName('img'),
            len = pic.length;
        for (let i = 0; i < len; ++i) {
            if (pic[i].naturalWidth > 0) {
                pic[i].setAttribute('width', pic[i].naturalWidth);
                pic[i].setAttribute('height', pic[i].naturalHeight);
            } else {
                // for when somehow width = 0 when devtool is open
                pic[i].setAttribute('width', pic[i].clientWidth);
                pic[i].setAttribute('height', pic[i].clientHeight);
            }
            pic[i].removeAttribute('sizes');
        }
    } catch (err) { console.error(err); }


    setTimeout(_ => { // limit quantity
        const txtQty = document.body.querySelector('input[name="quantity"]');
        txtQty.setAttribute('min', 1);
        txtQty.setAttribute('max', 69);
        txtQty.addEventListener('change', function (e) {
            e.target.reportValidity();
        });
    }, 0);

    setTimeout(_ => {
        document.getElementById('commentform').onsubmit = function (e) {
            e.preventDefault();
            if (e.target.reportValidity()) {
                alert('thanks for reviewing!');
                location.reload();
            }
            return false;
        };
    }, 0);


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