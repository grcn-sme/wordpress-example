export default function main(appBody) {
    initCustomCodeForm();
    initServerForm();

    appBody.querySelectorAll('form').forEach(x => {
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
        const serverUrl = form.querySelector('input[name=server-url]').value.trim();

        // example: https://docs.google.com/document/d/1pWxxxxxxxxxxxxxxxx/preview
        const gdocId = serverUrl.substring(35).split('/')[0];
        console.log({gdocId});
        if(!gdocId){
            e.target.reportValidity();
            return false;
        }

        localStorage['txtRemoteCodeUrl'] = serverUrl;
        alert("server configured to use:\n" + localStorage['txtRemoteCodeUrl']);
        setTimeout(_ => {
            window.setSearchParams('serverUrlId', gdocId);
        }, 0);
        return false;
    };

}