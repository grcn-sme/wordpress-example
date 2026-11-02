import { Product } from './product.mjs';
import { Cart } from '../cart/cart.mjs';
import { alert } from '/src/alert.mjs';

export default function (appBody) {

    /** @type {Cart} */
    let cart = null;

    /**
     * Render a WooCommerce store notice banner in `.woocommerce-notices-wrapper`.
     * @param {'success' | 'warning' | 'error'} type
     * @param {Product} product
     * @param {number} addedCount
     */
    function showCartNotice(type, product, addedCount) {
        const qtyLabel = addedCount > 1 ? `${addedCount} &times; ` : '';
        let messageHtml = '';
        if (type === 'success') {
            const verb = addedCount > 1 ? 'have been' : 'has been';
            messageHtml = `${qtyLabel}&ldquo;${product.name}&rdquo; ${verb} added to your cart.`;
        } else if (type === 'warning') {
            messageHtml = `Maximum products (${Cart.maxQuantityPerItem}) reached &mdash; only ${addedCount} &times; &ldquo;${product.name}&rdquo; added to your cart.`;
        } else {
            messageHtml = `You cannot add more &ldquo;${product.name}&rdquo; to the cart &mdash; maximum quantity (${Cart.maxQuantityPerItem}) reached.`;
        }

        const noticeWrapper = document.body.querySelector('.woocommerce-notices-wrapper');
        if (!noticeWrapper) {
            alert(messageHtml.replace(/&times;/g, '×').replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;/g, '—'));
            return;
        }

        const iconPath = type === 'success'
            ? 'M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z'
            : 'M12 3.2c-4.8 0-8.8 3.9-8.8 8.8 0 4.8 3.9 8.8 8.8 8.8 4.8 0 8.8-3.9 8.8-8.8 0-4.8-4-8.8-8.8-8.8zm0 16c-4 0-7.2-3.3-7.2-7.2C4.8 8 8 4.8 12 4.8s7.2 3.3 7.2 7.2c0 4-3.2 7.2-7.2 7.2zM11 17h2v-6h-2v6zm0-8h2V7h-2v2z';

        noticeWrapper.innerHTML = `
            <div class="wc-block-store-notice wc-block-components-notice-banner is-${type} is-dismissible" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                    <path d="${iconPath}"></path>
                </svg>
                <div class="wc-block-components-notice-banner__content">
                    <div>
                        <a href="/cart" class="button wc-forward wp-element-button">View cart</a>
                        ${messageHtml}
                    </div>
                </div>
                <button class="wc-block-components-button wp-element-button wc-block-components-notice-banner__dismiss contained" aria-label="Dismiss this notice" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                        <path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path>
                    </svg>
                </button>
            </div>
        `;

        const dismissBtn = noticeWrapper.querySelector('.wc-block-components-notice-banner__dismiss');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                noticeWrapper.innerHTML = '';
            });
        }

        noticeWrapper.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }

    document.body.querySelector('form.cart').addEventListener('submit', function (e) {
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
                showCartNotice('success', product, addedCount);
            }
            else if (addedCount > 0) {
                showCartNotice('warning', product, addedCount);
            }
            else {
                showCartNotice('error', product, 0);
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
                const product = new Product(productId);
                if (cart === null)
                    cart = new Cart();
                const addedCount = cart.add(product.id, 1);
                if (addedCount === 1) {
                    const viewCartSpan = btn.parentElement?.querySelector('[data-wc-bind--hidden="!state.displayViewCart"]');
                    if (viewCartSpan) {
                        viewCartSpan.hidden = false;
                        const link = viewCartSpan.querySelector('a.added_to_cart');
                        if (link) link.setAttribute('href', '/cart');
                    }
                    showCartNotice('success', product, 1);
                }
                else {
                    showCartNotice('error', product, 0);
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