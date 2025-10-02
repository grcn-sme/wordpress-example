import { Cart } from './cart.mjs';

const cart = new Cart();
console.log({ cart });
const shippingFee = 6.80;

listAllProducts();
displaySubTotalPrice();
displayShippingFee();
displayTotalPrice();





function listAllProducts() {
    const divProducts =
        document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div:nth-child(4) > div > div > div.wc-block-components-main.wc-block-cart__main.wp-block-woocommerce-cart-items-block > table > tbody")
        ;
    for (const p of cart.allProducts()) {
        console.log({ p });
        const html = `
        <tr class="wc-block-cart-items__row" tabindex="-1">
            <td class="wc-block-cart-item__image" aria-hidden="true"><a href="#${p.url}" tabindex="-1"><img src="${p.img_src}"
                        alt="${p.name}"></a></td>
            <td class="wc-block-cart-item__product">
                <div class="wc-block-cart-item__wrap"><a class="wc-block-components-product-name" href="#${p.url}">${p.name}</a>
                    <div class="wc-block-cart-item__prices"><span class="price wc-block-components-product-price"><span
                                class="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-product-price__value">${p.priceText()}</span></span>
                    </div>
                    <div class="wc-block-components-product-metadata">
                        <div class="wc-block-components-product-metadata__description">
                            <p>${p.description}</p>
                        </div>
                    </div>
                    <div class="wc-block-cart-item__quantity">
                        <div class="wc-block-components-quantity-selector"><input
                                data-product-id="${p.id}"
                                class="wc-block-components-quantity-selector__input" type="number" step="1" min="1" max="69"
                                aria-label="Quantity of ${p.name} in your cart." value="${p.quantity}"><button
                                aria-label="Reduce quantity of ${p.name}"
                                class="wc-block-components-quantity-selector__button wc-block-components-quantity-selector__button--minus"
                                >－</button><button aria-label="Increase quantity of ${p.name}"
                                class="wc-block-components-quantity-selector__button wc-block-components-quantity-selector__button--plus">＋</button>
                        </div><button data-product-id="${p.id}" class="wc-block-cart-item__remove-link" aria-label="Remove ${p.name} from cart">Remove
                            item</button>
                    </div>
                </div>
            </td>
            <td class="wc-block-cart-item__total">
                <div class="wc-block-cart-item__total-price-and-sale-badge-wrapper">
                    <span class="price wc-block-components-product-price"><span
                            class="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-product-price__value">${p.subTotalText()}</span></span>
                </div>
            </td>
        </tr>
        `;
        divProducts.innerHTML += html;
    }

    { // remove from cart logic
        const btnRemoveS =
            divProducts.getElementsByClassName('wc-block-cart-item__remove-link')
            ;
        const len = btnRemoveS.length;
        for (let i = 0; i < len; ++i) {
            btnRemoveS[i].addEventListener('click', (e) => {
                try {
                    const productId = e.target.dataset['productId'];
                    cart.remove(productId);
                    location.reload();
                } catch (err) {
                    console.error(err);
                    cart.reset();
                }
            });
        }
    }

    { // change quantity logic
        const txtQuantityS =
            divProducts.getElementsByClassName('wc-block-components-quantity-selector__input')
            ;
        const len = txtQuantityS.length;
        let qid = 0;
        for (let i = 0; i < len; ++i) {
            txtQuantityS[i].addEventListener('change', (e) => {
                if (e.target.reportValidity() === false) return;
                clearTimeout(qid);
                try {
                    const productId = e.target.dataset['productId'];
                    const quantity = parseInt(e.target.value);
                    cart.changeQuantity(productId, quantity);
                    qid = setTimeout(_ => { location.reload(); }, 1000);
                }
                catch (err) {
                    console.error(err);
                    cart.reset();
                }
            });
            txtQuantityS[i].addEventListener('blur', function (e) {
                const qty = parseInt(e.target.value);
                if (qty > Cart.maxQuantityPerItem) {
                    e.target.value = Cart.maxQuantityPerItem;
                } else {
                    e.target.value = 1;
                }
            });
        }
    }
    {
        const btnDecreaseQtyS =
            divProducts.getElementsByClassName('wc-block-components-quantity-selector__button--minus')
            ;
        const len = btnDecreaseQtyS.length;
        for (let i = 0; i < len; ++i) {
            btnDecreaseQtyS[i].addEventListener('click', (e) => {
                const txtQuantity =
                    e.target.parentElement.querySelector('.wc-block-components-quantity-selector__input')
                    ;
                txtQuantity.value = parseInt(txtQuantity.value) - 1;
                txtQuantity.dispatchEvent(new Event('change', { bubbles: true }));
            });
        }
    }
    {
        const btnIncreaseQtyS =
            divProducts.getElementsByClassName('wc-block-components-quantity-selector__button--plus')
            ;
        const len = btnIncreaseQtyS.length;
        for (let i = 0; i < len; ++i) {
            btnIncreaseQtyS[i].addEventListener('click', (e) => {
                const txtQuantity =
                    e.target.parentElement.querySelector('.wc-block-components-quantity-selector__input')
                    ;
                txtQuantity.value = parseInt(txtQuantity.value) + 1;
                txtQuantity.dispatchEvent(new Event('change'));
            });
        }
    }
}

function displaySubTotalPrice() {
    document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div:nth-child(4) > div > div > div.wc-block-components-sidebar.wc-block-cart__sidebar.wp-block-woocommerce-cart-totals-block > div.wp-block-woocommerce-cart-order-summary-block > div.wp-block-woocommerce-cart-order-summary-totals-block > div.wp-block-woocommerce-cart-order-summary-subtotal-block.wc-block-components-totals-wrapper > div > span.wc-block-formatted-money-amount.wc-block-components-formatted-money-amount.wc-block-components-totals-item__value")
        .textContent = cart.totalPriceText();
}

function displayShippingFee() {
    document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div:nth-child(4) > div > div > div.wc-block-components-sidebar.wc-block-cart__sidebar.wp-block-woocommerce-cart-totals-block > div.wp-block-woocommerce-cart-order-summary-block > div.wp-block-woocommerce-cart-order-summary-totals-block > div.wp-block-woocommerce-cart-order-summary-shipping-block.wc-block-components-totals-wrapper > div > div > span.wc-block-formatted-money-amount.wc-block-components-formatted-money-amount.wc-block-components-totals-item__value")
        .textContent = shippingFee;

    // shipping fee option
    document.body.querySelector("#radio-control-0-flat_rate\\:3__description > span")
        .textContent = shippingFee;
}

function displayTotalPrice() {
    document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div:nth-child(4) > div > div > div.wc-block-components-sidebar.wc-block-cart__sidebar.wp-block-woocommerce-cart-totals-block > div.wp-block-woocommerce-cart-order-summary-block > div:nth-child(4) > div > div.wc-block-components-totals-item__value > span")
        .textContent = cart.totalPriceText(shippingFee);

}