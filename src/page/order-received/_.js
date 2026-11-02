import { Product } from '../product/product.mjs';
import { OrderSummary } from './order-received.mjs';
import { alert } from '/src/alert.mjs';

export default async function () {
    const lastOrder = OrderSummary.getLastOrder();
    const searchParams = new URLSearchParams(globalThis.location?.search || '');
    const requestedOrderId = searchParams.get('order_id');

    let order = lastOrder;
    console.log({ order, requestedOrderId });

    // Render initial order synchronously if available and matches (or no specific order_id requested)
    if (order !== null && (!requestedOrderId || requestedOrderId === order.id)) {
        renderOrder(order);
    }

    const hasIdb = (typeof window !== 'undefined' && window.indexedDB) || typeof globalThis.indexedDB !== 'undefined';
    if (hasIdb) {
        if (lastOrder !== null) {
            await lastOrder.saveToHistory().catch(err => console.warn(err));
        }
        if (requestedOrderId) {
            const matchedOrder = await OrderSummary.getOrderById(requestedOrderId).catch(() => null);
            if (matchedOrder !== null) {
                order = matchedOrder;
            }
        }
        if (order === null) {
            const history = await OrderSummary.getOrderHistory().catch(() => []);
            if (history.length > 0) {
                order = history[0];
            }
        }
    }

    if (order === null) {
        noOrderYet();
    }
    else {
        renderOrder(order);
    }

    if (hasIdb) {
        const history = await OrderSummary.getOrderHistory().catch(() => []);
        displayOrderHistory(history, order?.id);
    }
}

/** @param {OrderSummary} order */
function renderOrder(order) {
    displayData(order);
    displayProducts(order);
    displayShippingFee(order);
    displayTotalPrice(order);
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

    const summaryContainer = document.body.querySelector('div[data-block-name="woocommerce/order-confirmation-summary"]');
    if (summaryContainer) {
        summaryContainer.innerHTML = html;
    }
}

/** @param {OrderSummary} o */
function displayProducts(o) {
    const tbody = document.body.querySelector("#app > div > main > div.wc-block-order-confirmation-totals-wrapper.alignwide > div > table > tbody");
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const p of o.products) {
        console.log({ p });
        const imgHtml = p.img_src ? `<img class="wc-order-item-thumbnail" src="${p.img_src}" alt="${p.name}" width="48" height="48">` : '';
        const html = `
<tr class="woocommerce-table__line-item order_item">
    <td class="wc-block-order-confirmation-totals__product">
        <div class="wc-order-item-product-info">
            ${imgHtml}
            <div class="wc-order-item-product-text">
                <a href="${p.url}">${p.name}</a>&nbsp;
                <strong class="product-quantity">&times;&nbsp;${p.quantity} &nbsp;</strong>
            </div>
        </div>
    </td>
    <td class="wc-block-order-confirmation-totals__total" data-currency="${p.currency}" title="${p.currency}">
        <span class="woocommerce-Price-amount amount">${p.subTotalText()}</span>
    </td>
</tr>
`;

        tbody.innerHTML += html;
    }

}

/** @param {OrderSummary} o */
function displayShippingFee(o) {
    const el = document.body.querySelector("#app > div > main > div.wc-block-order-confirmation-totals-wrapper.alignwide > div > table > tfoot > tr:nth-child(1) > td > span");
    if (el) el.textContent = o.shippingFeeText();
}


/** @param {OrderSummary} o */
function displayTotalPrice(o) {
    const el = document.querySelector("#app > div > main > div.wc-block-order-confirmation-totals-wrapper.alignwide > div > table > tfoot > tr:nth-child(2) > td > span");
    if (el) el.textContent = o.totalPriceText();
}

/**
 * @param {OrderSummary[]} orders
 * @param {string | undefined} currentOrderId
 */
function displayOrderHistory(orders, currentOrderId) {
    const container = document.getElementById('order-history-list');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="wc-order-history-empty">No previous orders saved in history.</p>';
        return;
    }

    const rows = orders.map((o) => {
        const isCurrent = o.id === currentOrderId;
        const itemCount = o.products.reduce((sum, p) => sum + (p.quantity || 1), 0);
        const orderHref = `/order-received?order_id=${encodeURIComponent(o.id)}`;
        const badge = isCurrent ? '<span class="wc-order-history-badge">Viewing</span>' : '';
        return `
<tr class="wc-order-history-row ${isCurrent ? 'is-current-order' : ''}" data-order-id="${o.id}">
    <td><a class="wc-order-history-link" href="${orderHref}">${o.id}</a>${badge}</td>
    <td>${o.getDate().toLocaleDateString()}</td>
    <td>${o.userEmailAddress || '-'}</td>
    <td>${itemCount}</td>
    <td>${o.shippingFeeText()}</td>
    <td class="wc-block-order-confirmation-totals__total"><strong>${o.totalPriceText()}</strong></td>
    <td class="wc-block-order-confirmation-totals__total">
        <button type="button" class="wc-order-history-delete-btn" data-order-id="${o.id}" aria-label="Delete order ${o.id}">Delete</button>
    </td>
</tr>`;
    }).join('');

    container.innerHTML = `
<table cellspacing="0" class="wc-block-order-confirmation-totals__table wc-order-history-table">
    <thead>
        <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Email</th>
            <th>Items</th>
            <th>Shipping</th>
            <th class="wc-block-order-confirmation-totals__total">Total</th>
            <th class="wc-block-order-confirmation-totals__total">Actions</th>
        </tr>
    </thead>
    <tbody>${rows}</tbody>
</table>`;

    container.querySelectorAll('.wc-order-history-delete-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            const idToDelete = e.currentTarget.dataset.orderId;
            if (!idToDelete) return;
            await OrderSummary.deleteOrderFromHistory(idToDelete).catch(console.warn);
            const updated = await OrderSummary.getOrderHistory().catch(() => []);
            displayOrderHistory(updated, currentOrderId);
        });
    });
}
