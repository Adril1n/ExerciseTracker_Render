function getWeightIntervalsAsArray(intervals) {
    var options = [];

    if (intervals.length === 1 && intervals[0].min === intervals[0].max) return [0];

    for (const interval of intervals) {
        var i = parseFloat(interval.min);
        while (i <= parseFloat(interval.max)) {
            if (!options.includes(i)) {
                options.push(i);
            }
            i += parseFloat(interval.step);
        }
    }

    return options;
};

function toggleFilterForm() {
    document.getElementById('filterForm').classList.toggle('hidden');
    document.getElementById('select-exercise-main').classList.toggle('hidden');
    // toggleModal(document.getElementById('options-modal'));
}

document.addEventListener('DOMContentLoaded', () => {
    const submitFilterForm = async (e) => {
        if (e) {
            e.preventDefault();
            toggleFilterForm();
        }

        let weightTypes = Array.from(document.getElementById('weightTypes').selectedOptions).map(option => option.value);
        let muscles = Array.from(document.getElementById('muscles').selectedOptions).map(option => option.value);

        const response = await fetch(`/api/exercises?weightTypes=${weightTypes.join(',')}&muscles=${muscles.join(',')}`);
        const exercises = await response.json();


        fillExerciseTable(exercises);
    };

    const fillExerciseTable = (exercises) => {
        const oldExerciseTableBody = document.getElementById('exerciseTableBody');
        const newExerciseTableBody = document.createElement('tbody');
        newExerciseTableBody.setAttribute('id', 'exerciseTableBody');

        exercises.forEach(exercise => {
            let row = newExerciseTableBody.insertRow();

            let name = row.insertCell(0);
            name.innerHTML = exercise.name;
            name.addEventListener('click', () => selectExercise(exercise));

            let primary = row.insertCell(1);
            primary.innerHTML = exercise.primaryMuscles.sort().join(', ');

            let secondary = row.insertCell(2);
            if (exercise.secondaryMuscles) {
                secondary.innerHTML = exercise.secondaryMuscles.sort().join(', ');
            }

            let weightTypes = row.insertCell(3);
            weightTypes.innerHTML = exercise.weightTypes.sort().join(', ');

            let link = row.insertCell(4);
            link.setAttribute('onclick', `window.open("${exercise.link}", "_blank")`);
            link.innerHTML = "#";
        });

        oldExerciseTableBody.parentNode.replaceChild(newExerciseTableBody, oldExerciseTableBody);
        sorttable.makeSortable(newExerciseTableBody.parentNode);
    };

    const filterWithSearch = () => {
        const searchInput = document.getElementById('select-exercise-search').value.toLowerCase();
        const exerciseList = document.getElementById('exerciseTableBody').getElementsByTagName('tr');

        for (var i = 0, row; row = exerciseList[i]; i++) {
            let exerciseName = row.cells[0].textContent.toLowerCase();
            row.style.display = exerciseName.includes(searchInput) ? '' : 'none';
        }
    };

    const loadFilters = async () => {
        const response = await fetch('/api/exercises');
        const exercises = await response.json();
        
        document.getElementById('weightTypes').innerHTML = '';
        document.getElementById('muscles').innerHTML = '';

        var muscles = [];
        var weightTypes = [];
        exercises.forEach(exercise => {
            muscles.push(...exercise.primaryMuscles);
            if (exercise.secondaryMuscles) muscles.push(...exercise.secondaryMuscles);

            weightTypes.push(...exercise.weightTypes);
        });

        var focusedMuscles = JSON.parse(document.getElementById('form-workout-focus-info').getAttribute('focusedMuscles'));
        focusedMuscles = [...new Set([...focusedMuscles["primary"], ...focusedMuscles["secondary"]])];

        muscles = [...new Set(muscles)].sort();
        muscles.forEach(muscle => {
            let optionElement = document.createElement('option');
            optionElement.value = muscle;
            optionElement.selected = focusedMuscles.includes(muscle);
            optionElement.innerHTML = muscle;

            document.getElementById('muscles').appendChild(optionElement);
            // document.getElementById('muscles').innerHTML += `<option value="${muscle}">${muscle}</option>`;
        });

        weightTypes = [...new Set(weightTypes)].sort();
        weightTypes.forEach(weightT => {
            document.getElementById('weightTypes').innerHTML += `<option value="${weightT}">${weightT}</option>`;
        });

        // document.getElementById('muscles').selectedOptions = focusedMuscles;
    };

    const showSelectExercise = async () => {
        document.getElementById('section-select-exercise').classList.toggle('hidden'); 
        document.getElementById('section-add-exercise').classList.toggle('hidden');

        await loadFilters();
        // document.getElementById('filterForm').submit();
        submitFilterForm();
    };


    const selectExercise = async (exercise) => {
        document.getElementById('selectedExercise').innerHTML = exercise.name;
        document.getElementById('section-select-exercise').classList.toggle('hidden');
        document.getElementById('section-add-exercise').classList.toggle('hidden');

        const response = await fetch(`/api/exercises/weight-class?name=${exercise.weightClass}`);
        const weightClass = await response.json();

        const weightElement = document.getElementById('weight');
        weightElement.setAttribute('unit', weightClass.unit);

        weightElement.innerHTML = '';

        getWeightIntervalsAsArray(weightClass.intervals).forEach(weight => {
            weightElement.innerHTML += `<option value="${weight}">${weight}</option>`;
        });

        updatePreviousExerciseValues();
    };

    // loadFilters();

    document.getElementById('select-new-exercise').addEventListener('click', showSelectExercise);
    document.getElementById('select-exercise-close').addEventListener('click', showSelectExercise);

    document.getElementById('filterForm').addEventListener('submit', submitFilterForm);
    document.getElementById('select-exercise-search').onkeyup = filterWithSearch;
});