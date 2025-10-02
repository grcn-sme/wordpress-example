export function alert(message) {
    const messageBody = document.getElementById('_dialog-alert__message-body');
    messageBody.textContent = message;

    const dialog = document.getElementById('_dialog-alert');
    dialog.showModal();
    console.log(message);
}