document.addEventListener('DOMContentLoaded', () => {
    const fillMuscleStatus = async () => {
        const container = document.getElementById('muscle-status-table').getElementsByTagName('tbody')[0];

        const response = await fetch('/api/muscle-scores');
        const scores = await response.json();

        container.innerHTML = '';

        for (const [muscle, score] of Object.entries(scores)) {
            container.innerHTML += `<td>${muscle}</td><td>${score}</td>`
        }
    };

    fillMuscleStatus();
});