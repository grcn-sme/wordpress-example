import { Product } from '../product/product.mjs';
import { OrderSummary } from './order-received.mjs';

export default function () {
    const order = OrderSummary.getLastOrder();
    console.log({ order });

    if (order === null) {
        noOrderYet();
    }
    else {
        displayData(order);
        displayProducts(order);
        displayShippingFee(order);
        displayTotalPrice(order);
    }
}

function noOrderYet() {
    alert('no previous order!');
}


/** @param {OrderSummary} o */
function displayData(o) {
    const currency = o.getPaymentCurrency();
    const html = `
    <h1>Summary</h1>
<ul class="wc-block-order-confirmation-summary-list" id="order-summary" data-payment-currency="${currency}" title="${currency}">
    <li class="wc-block-order-confirmation-summary-list-item"><span
            class="wc-block-order-confirmation-summary-list-item__key">Order number:</span> <span
            class="wc-block-order-confirmation-summary-list-item__value">${o.id}</span></li>
    <li class="wc-block-order-confirmation-summary-list-item"><span
            class="wc-block-order-confirmation-summary-list-item__key">Payment date:</span> <span
            class="wc-block-order-confirmation-summary-list-item__value">${o.getDate().toLocaleDateString()}</span></li>
    <li class="wc-block-order-confirmation-summary-list-item price amount"><span  
            class="wc-block-order-confirmation-summary-list-item__key">Total payment:</span> <span
            class="wc-block-order-confirmation-summary-list-item__value"><span title="${currency}"
        data-currency="${currency}" class="woocommerce-Price-amount amount">${o.totalPriceText()}</span></span></li>
    <li class="wc-block-order-confirmation-summary-list-item purchaser-email-address"><span
            class="wc-block-order-confirmation-summary-list-item__key">Email address:</span> <span
            class="wc-block-order-confirmation-summary-list-item__value"><i>${o.userEmailAddress}</i></span></li>
    <li class="wc-block-order-confirmation-summary-list-item"><span
            class="wc-block-order-confirmation-summary-list-item__key">Payment method:</span> <span
            class="wc-block-order-confirmation-summary-list-item__value">Cash on delivery</span></li>
</ul>
    `;

    document.body.querySelector('div[data-block-name="woocommerce/order-confirmation-summary"]')
        .innerHTML = html;
}

/** @param {OrderSummary} o */
function displayProducts(o) {
    for (const p of o.products) {
        console.log({ p });
        const html = `
<tr class="woocommerce-table__line-item order_item">
    <td class="wc-block-order-confirmation-totals__product">
        <a href="${p.url}">${p.name}</a>&nbsp;
        <strong class="product-quantity">&times;&nbsp;${p.quantity} &nbsp;</strong>
    </td>
    <td class="wc-block-order-confirmation-totals__total" data-currency="${p.currency}" title="${p.currency}">
        <span class="woocommerce-Price-amount amount">${p.subTotalText()}</span>
    </td>
</tr>
`;

        document.body.querySelector("#app > div > main > div.wc-block-order-confirmation-totals-wrapper.alignwide > div > table > tbody")
            .innerHTML += html;
    }

}

/** @param {OrderSummary} o */
function displayShippingFee(o) {
    document.body.querySelector("#app > div > main > div.wc-block-order-confirmation-totals-wrapper.alignwide > div > table > tfoot > tr:nth-child(1) > td > span")
        .textContent = o.shippingFeeText();
}


/** @param {OrderSummary} o */
function displayTotalPrice(o) {
    document.querySelector("#app > div > main > div.wc-block-order-confirmation-totals-wrapper.alignwide > div > table > tfoot > tr:nth-child(2) > td > span")
        .textContent = o.totalPriceText();
}
