export function alert(message) {
    const messageBody = document.getElementById('_dialog-alert__message-body');
    messageBody.textContent = message;

    const dialog = document.getElementById('_dialog-alert');
    dialog.showModal();
    console.log(message);
}


const dialog = typeof document !== 'undefined' && document.getElementById('_dialog-alert') || null;
if(dialog){
    dialog.setAttribute('closedby', 'closerequest'); // `[closedby="any"]` cannot block click on backdrop when in mobile view
    dialog.addEventListener('click', function (e) {
        if (e.target === dialog)
            dialog.close();
    });
}