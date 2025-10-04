import { Cart } from "/src/page/cart/cart.mjs";
import { Product } from "/src/page/product/product.mjs";
import { OrderSummary } from '/src/page/order-received/order-received.mjs';
import { alert } from '/src/alert.mjs';


class CheckoutSummary {

    cart;
    orderSummary;
    /** @param {Cart} cart */
    constructor(cart, shippingFee) {
        this.cart = cart;

        const x = new OrderSummary();
        x.shippingFee = shippingFee;
        x.products = [...cart.allProducts()]; // must be arrylist to be stringify later
        this.orderSummary = x;
    }

    addUserEmailAddress(email) {
        this.orderSummary.userEmailAddress = email;
    }

    confirmCheckout() {
        // finalize order info
        this.orderSummary.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        this.orderSummary.date = new Date();


        this.orderSummary.save_checkout();
        this.cart.reset();
    }

    listAllProducts() {
        const orderSummary = document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-sidebar.wc-block-checkout__sidebar.wp-block-woocommerce-checkout-totals-block > div.wp-block-woocommerce-checkout-order-summary-block > div.wp-block-woocommerce-checkout-order-summary-cart-items-block.wc-block-components-totals-wrapper > div > div.wc-block-components-panel__content > div");
        console.log({ summary: orderSummary });
        for (const x of this.orderSummary.products) {
            if (!x.id) continue; // filter faulty data
            const html = generateHTML_item(x);
            // const f = dom from text
            const f = document.createElement("div");
            f.innerHTML = html;
            orderSummary.appendChild(f);
        }
    }

    displaySubTotalPrice() {
        document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-sidebar.wc-block-checkout__sidebar.wp-block-woocommerce-checkout-totals-block > div.wp-block-woocommerce-checkout-order-summary-block > div.wp-block-woocommerce-checkout-order-summary-totals-block > div.wp-block-woocommerce-checkout-order-summary-subtotal-block.wc-block-components-totals-wrapper > div > span.wc-block-formatted-money-amount.wc-block-components-formatted-money-amount.wc-block-components-totals-item__value")
            .textContent = this.cart.totalPriceText();
    }

    displayShippingFeed() {
        document.body.querySelector("#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-sidebar.wc-block-checkout__sidebar.wp-block-woocommerce-checkout-totals-block > div.wp-block-woocommerce-checkout-order-summary-block > div.wp-block-woocommerce-checkout-order-summary-totals-block > div.wp-block-woocommerce-checkout-order-summary-shipping-block.wc-block-components-totals-wrapper > div > div > span.wc-block-formatted-money-amount.wc-block-components-formatted-money-amount.wc-block-components-totals-item__value")
            .textContent = Product.formatPrice('USD', this.orderSummary.shippingFee);
    }

    displayTotalPrice() {
        document.body.querySelector('#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-sidebar.wc-block-checkout__sidebar.wp-block-woocommerce-checkout-totals-block > div.wp-block-woocommerce-checkout-order-summary-block > div:nth-child(4) > div > div.wc-block-components-totals-item__value > span')
            .textContent = this.cart.totalPriceText(this.orderSummary.shippingFee);
    }
}


export default function () {
    const cart = new Cart();
    console.log({ cart });


    const shippingFee = 6.80;
    const summary = new CheckoutSummary(cart, shippingFee);

    summary.listAllProducts();
    summary.displaySubTotalPrice();
    summary.displayShippingFeed();
    summary.displayTotalPrice();


    document.body
        .querySelector(
            "#wp--skip-link--target > div.entry-content.alignwide.wp-block-post-content.is-layout-flow.wp-block-post-content-is-layout-flow > div > div.wc-block-components-sidebar-layout.wc-block-checkout.is-large > div.wc-block-components-main.wc-block-checkout__main.wp-block-woocommerce-checkout-fields-block > form"
        )
        .addEventListener("submit", function (e) {
            e.preventDefault();
            e.target.style["opacity"] = "0.25";
            e.target.inert = true;

            // console.log('ee', e.target);
            summary.addUserEmailAddress(e.target.querySelector('input#email').value);
            summary.confirmCheckout();

            setTimeout((_) => {
                alert("payment success =)");
                location.hash = "#/order-received";
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
}



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


