document.body.addEventListener('submit', function (e) {
    if (e.target.classList.contains('cart') === false) return;
    e.preventDefault();
    e.target.style['visibility'] = 'hidden';
    alert('Product added!');
    setTimeout(l => {
        l.reload();
    }, 200, window.location);
    return false;
});
