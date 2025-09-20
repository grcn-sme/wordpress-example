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