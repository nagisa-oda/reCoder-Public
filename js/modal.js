const modalOverlay = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCancelBtn = document.getElementById('modal-cancel');
const modalExecuteBtn = document.getElementById('modal-execute');
let currentConfirmAction = null;

function openModal(titleText, messageText, onConfirm) { // onConFirmはコールバック関数
    modalTitle.textContent = titleText;
    modalMessage.textContent = messageText;
    currentConfirmAction = onConfirm;
    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    currentConfirmAction = null;
}

modalExecuteBtn.addEventListener('click', function() {
    if(currentConfirmAction){
        currentConfirmAction(); // 保存していたコールバックを実行
        closeModal();
    }
})

modalCancelBtn.addEventListener('click', function() {
    closeModal();
})

