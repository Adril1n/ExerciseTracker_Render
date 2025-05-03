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