import { Cart } from "./cart.js";
import { Product } from "./product/_product.js";

const orderSummary = document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-sidebar.wc-block-checkout__sidebar.wp-block-woocommerce-checkout-totals-block > div.wp-block-woocommerce-checkout-order-summary-block > div.wp-block-woocommerce-checkout-order-summary-cart-items-block.wc-block-components-totals-wrapper > div > div.wc-block-components-panel__content > div");
console.log({ summary: orderSummary });

const cart = new Cart();
console.log({ cart });

// list all products
for (const x of cart.allProducts()) {
    if (!x.id) continue; // filter faulty data
    const html = generateHTML_item(x);
    // const f = dom from text
    const f = document.createElement("div");
    f.innerHTML = html;
    orderSummary.appendChild(f);
}

// display subtotal
document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-sidebar.wc-block-checkout__sidebar.wp-block-woocommerce-checkout-totals-block > div.wp-block-woocommerce-checkout-order-summary-block > div.wp-block-woocommerce-checkout-order-summary-totals-block > div.wp-block-woocommerce-checkout-order-summary-subtotal-block.wc-block-components-totals-wrapper > div > span.wc-block-formatted-money-amount.wc-block-components-formatted-money-amount.wc-block-components-totals-item__value")
.textContent = cart.totalPriceText();

// display total Price
let shippingFee = document.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-sidebar.wc-block-checkout__sidebar.wp-block-woocommerce-checkout-totals-block > div.wp-block-woocommerce-checkout-order-summary-block > div.wp-block-woocommerce-checkout-order-summary-totals-block > div.wp-block-woocommerce-checkout-order-summary-shipping-block.wc-block-components-totals-wrapper > div > div > span.wc-block-formatted-money-amount.wc-block-components-formatted-money-amount.wc-block-components-totals-item__value")
    ;
shippingFee = shippingFee.textContent.replaceAll(/[^0-9.]+/g, '');
shippingFee = parseFloat(shippingFee);


document.body.querySelector('#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-sidebar.wc-block-checkout__sidebar.wp-block-woocommerce-checkout-totals-block > div.wp-block-woocommerce-checkout-order-summary-block > div:nth-child(4) > div > div.wc-block-components-totals-item__value > span')
    .textContent = cart.totalPriceText(shippingFee);
/** 
 * @param {Product} p
 */
function generateHTML_item(p) {
    return `
<div class="wc-block-components-order-summary-item">
    <div class="wc-block-components-order-summary-item__image">
        <div class="wc-block-components-order-summary-item__quantity">
            <span aria-hidden="true">${p.quantity}</span><span class="screen-reader-text">${p.quantity} item</span>
        </div><img src="${p.img_src}" alt="Black and White Summer Portrait">
    </div>
    <div class="wc-block-components-order-summary-item__description">
        <span class="wc-block-components-product-name">${p.name}</span><span
            class="wc-block-components-order-summary-item__individual-prices price wc-block-components-product-price"><span
                class="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-product-price__value wc-block-components-order-summary-item__individual-price">${p.priceText()}</span></span>
        <div class="wc-block-components-product-metadata">
            <div class="wc-block-components-product-metadata__description">
                <p>This 24″ x 30″ high-quality print just exudes summer.
                    Hang it on the wall and…</p>
            </div>
        </div>
    </div><span class="screen-reader-text">Total price for ${p.quantity} ${p.name} item:
        ${p.priceText()}</span>
    <div class="wc-block-components-order-summary-item__total-price" aria-hidden="true"><span
            class="price wc-block-components-product-price"><span
                class="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-product-price__value">${p.subTotalText()}</span></span>
    </div>
</div>
`;
}


document.body
    .querySelector(
        "#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-main.wc-block-checkout__main.wp-block-woocommerce-checkout-fields-block > form"
    )
    .addEventListener("submit", function (e) {
        e.preventDefault();
        e.target.style["opacity"] = "0.25";
        e.target.inert = true;
        document.body.style["cursor"] = "wait";
        setTimeout((_) => {
            alert("payment success =)");
            location.hash = "#order-received";
        }, 500);
        return false;
    });
document.body
    .querySelector(
        "#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-main.wc-block-checkout__main.wp-block-woocommerce-checkout-fields-block > form > div.wc-block-checkout__actions.wp-block-woocommerce-checkout-actions-block > div.wc-block-checkout__actions_row > button"
    )
    .addEventListener("click", function (e) {
        e.currentTarget.closest("form").requestSubmit();
    });
