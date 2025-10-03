export default function main(){
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

    window.addEventListener('keydown', function (e) {
        if (e.isTrusted && e.ctrlKey && e.code === 'KeyS') {
            e.preventDefault();
            document.getElementById('form-custom-code').requestSubmit();
        }
    });
}