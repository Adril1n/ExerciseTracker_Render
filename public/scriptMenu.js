function toggleMenu(container, toggleElement) {
    const menu = container.getElementsByClassName('menu-container')[0];
    const title = container.getElementsByClassName('title')[0];
    title.classList.toggle('hidden');
    menu.classList.toggle('hidden');

    if (menu.classList.contains('hidden')) {
        toggleElement.style.color = 'var(--secondary)'
    }
    else {
        toggleElement.style.color = toggleElement.getAttribute('defaultColor');
    }
}

canToggleModal = true;

function toggleModal(modal) {
    if (!canToggleModal) return;

    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.remove('modal-disappear');
        modal.classList.add('modal-appear');
    }
    else {
        modal.classList.remove('modal-appear');
        modal.classList.add('modal-disappear');
        canToggleModal = false;
        setTimeout(() => {
            modal.classList.add('hidden');
            canToggleModal = true;
        }, 1000);
    }
}