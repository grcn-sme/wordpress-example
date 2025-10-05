export default function main() {
    initCustomCodeForm();
    initServerForm();

    document.body.querySelectorAll('form').forEach(x => {
        x.addEventListener('keydown', function (e) {
            if (e.isTrusted && e.ctrlKey && e.code === 'KeyS') {
                e.preventDefault();
                document.activeElement.closest('form')?.requestSubmit();
            }
        });
    });
}

function initCustomCodeForm() {
    const txtCodeHead = document.getElementById('txtCodeHead');
    const txtCodeBody = document.getElementById('txtCodeBody');

    txtCodeHead.value = localStorage['txtCodeHead'] || '';
    txtCodeBody.value = localStorage['txtCodeBody'] || '';

    txtCodeHead.focus();
    let submitted = false;
    document.getElementById('form-custom-code').addEventListener('submit', function (e) {
        e.preventDefault();
        if (submitted === true) return;
        submitted = true;
        localStorage['txtCodeHead'] = txtCodeHead.value.trim();
        localStorage['txtCodeBody'] = txtCodeBody.value.trim();
        e.target.style['visibility'] = 'hidden';
        window.location.reload();
    });
}

function initServerForm() {
    const form =
        document.getElementById('form__server-url')
        ;
    form.querySelector('input[name=server-url]').value = localStorage['txtRemoteCodeUrl'] || '';

    form.onsubmit = function (e) {
        if (e.isTrusted === false) return;
        e.preventDefault();
        localStorage['txtRemoteCodeUrl'] = form.querySelector('input[name=server-url]').value.trim();
        alert("server configured to use:\n" + localStorage['txtRemoteCodeUrl']);
        setTimeout(_ => {
            location.reload();
        }, 0);
        return false;
    };

}