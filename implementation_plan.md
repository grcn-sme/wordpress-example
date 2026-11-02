# todo and identified issues


## image displaying issue

currently the page will not show image resource, it incorrectly show a custom 404 page instead. e.g.
/product/img/white-black-black-and-white-photograph-monochrome-photography.jpg


## shipping options
currently there is only 1 static shipping cost 6.80
- we need at least 3 options, free, cost 6.8 , cost 20.00 express

## order completed

the final page `/order-received?order_id=` need some UI improvement


# features to add

features to add:
- darkmode
- order history, we may use indexedDB for this purpose, using @src/IdbWrapper.mjs
- unit tests
