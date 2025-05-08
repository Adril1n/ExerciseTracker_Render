const fillBars = () => {
    document.querySelectorAll('.bar-fill').forEach(function(element) {
        element.style.width = element.getAttribute('fillPercentage');
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const fillMuscleStatus = async () => {
        const tableBody = document.getElementById('muscle-status-table').getElementsByTagName('tbody')[0];

        const response = await fetch('/api/muscle-scores');
        const scores = await response.json();


        if (Object.values(scores).length == 0) {
            tableBody.innerHTML = 'No workouts yet...';
            return;
        }

        tableBody.innerHTML = '';
        var sum = Object.values(scores).reduce((parital, a) => parital + a, 0);

        for (const [muscle, score] of Object.entries(scores)) {
            const tableRow = document.createElement('tr')

            // NAME & SCORE
            const name = document.createElement('td');
            name.innerHTML = muscle;

            const scoreElement = document.createElement('td');
            scoreElement.innerHTML = score;

            // tableBody.innerHTML += `<td>${muscle}</td><td>${score}</td>`
            // BAR
            const barTableData = document.createElement('td');
            const barContainer = document.createElement('div');
            barContainer.classList.add('bar');

            const barFill = document.createElement('div');
            barFill.classList.add('bar-fill');
            
            barFill.setAttribute("fillPercentage", (score / sum)*100 + "%");

            barContainer.appendChild(barFill);

            barTableData.appendChild(barContainer)
            // ADD
            tableRow.appendChild(name);
            tableRow.appendChild(scoreElement);
            tableRow.appendChild(barTableData);

            tableBody.appendChild(tableRow);
        }

        setTimeout(fillBars, 10);
    };

    fillMuscleStatus();
    // fillBars();
});