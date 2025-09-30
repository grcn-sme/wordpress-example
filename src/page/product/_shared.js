import { Product } from './_product.js';
import { Cart } from '../cart.mjs';

let cart = null;
document.body.addEventListener('submit', function (e) {
    if (e.target.classList.contains('cart') === false) return;
    e.preventDefault();

    /** @type {HTMLFormElement} */
    const form = e.target;
    const proId = form.querySelector('button[name="add-to-cart"]').value;

    try {
        const product = new Product(proId);
        console.log({ product });
        if (cart === null)
            cart = new Cart();
        cart.add(product);

        alert('Product added!');
    }
    catch (err) {
        console.error(err); console.warn('resetting cart');
        Cart.reset();
    }
    return false;
});

{  // reset img size
    const pic = document.body.getElementsByTagName('img'),
        len = pic.length;
    for (let i = 0; i < len; ++i) {
        pic[i].setAttribute('width', pic[i].naturalWidth);
        pic[i].setAttribute('height', pic[i].naturalHeight);
    }
}


{
    console.log(0,
        // document.querySelectorAll('.cart .wp-block-post-title').length

    );
}

