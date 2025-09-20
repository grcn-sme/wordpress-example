document.getElementById('wpforms-form-66-1').addEventListener('submit', function (e) {
    if (e.target.checkValidity() === false) return;
    e.preventDefault();
    const form = e.target;
    form.classList.add('loading');
    setTimeout(_ => {
        alert('submitted!');
        form.classList.add('submitted');

        setTimeout(l => {
            l.reload();
        }, 1000, window.location);
    }, 500);
});

{
    const st = setTimeout, al = alert, cf = document.getElementById("custom-form");
    cf.querySelector("button[type=submit]").addEventListener("click", (e) => {
        if (cf.querySelectorAll("input,textarea,select").values().find((x) => !x.checkValidity()) === undefined) {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                st(() => {
                    cf.classList.remove('loading');
                    cf.classList.add('submitted');
                    cf.scrollIntoView();
                    ("Submitted successfully!");
                    st(l => l.reload(), 1500, window.location);
                    cf.querySelectorAll("input,textarea,select").forEach(x => x.removeAttribute('readonly'));
                }, 1000);
            };
            xhr.open("POST", window.location.href, true);
            xhr.send("");
            cf.querySelectorAll("input,textarea,select").forEach(x => x.setAttribute('readonly', ''));
            cf.classList.add('loading');
        } else st(al, 50, "please fill the required fields!");
    });
}

document.getElementById('inquiry-form').addEventListener('submit', function (e) {
    console.log('inquiry form: ', Object.fromEntries(new FormData(e.target)));

});