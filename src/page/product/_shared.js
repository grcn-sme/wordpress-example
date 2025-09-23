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

{  // reset img size
    const pic = document.body.getElementsByTagName('img'),
        len = pic.length;
    for (let i = 0; i < len; ++i) {
        pic[i].setAttribute('width', pic[i].naturalWidth);
        pic[i].setAttribute('height', pic[i].naturalHeight);
    }
}
