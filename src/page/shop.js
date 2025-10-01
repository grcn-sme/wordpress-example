
let cart = null;

document.body.addEventListener('click', e => {
    // const all = document.elementsFromPoint(e.clientX, e.clientY);
    // console.log(all);
    // console.log('=====================');

    const btn = e.target.closest('button[href^="?add-to-cart="]');
    if (btn === null) return;

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
});

import { Product } from './product/_product.js';


import { Cart } from './cart.mjs';
