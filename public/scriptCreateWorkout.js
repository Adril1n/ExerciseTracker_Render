async function initMuscleScores(focusData) {
    const response = await fetch('/api/exercises');
    const exercises = await response.json();

    var muscles = [];
    exercises.forEach(exercise => {
        muscles.push(...exercise.primaryMuscles);
        exerciseMuscleGroups[exercise.name] = {'primaryMuscles': exercise.primaryMuscles, 'secondaryMuscles': []};

        if (exercise.secondaryMuscles) {
            muscles.push(...exercise.secondaryMuscles);
            exerciseMuscleGroups[exercise.name].secondaryMuscles = exercise.secondaryMuscles;
        }
    });

    muscles = [...new Set(muscles)].sort();

    muscles.forEach(muscle => {
        var type = 'standard';
        if (focusData.primary.has(muscle)) type = 'primary';
        else if (focusData.secondary.has(muscle)) type = 'secondary';

        muscleScores[muscle] = {'type': type, 'score': 0};
    });

    updateMuscleScoreHTML();
}

function startWorkout(workoutName, setsInfo, focusInfo) {
    document.getElementById('create-workout-form').classList.toggle('hidden');


    document.getElementById('workout-name').innerHTML = workoutName;

    document.getElementById('workout-sets-info').innerHTML = setsInfo;
    initMuscleScores(focusInfo);

    document.getElementById('workout-container').classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const workoutPresetSelect = document.getElementById('workout-muscle-presets-select');
    const muscleTable = document.getElementById('workout-muscle-focus-table-body');
    var focusedMuscles = {'primary': new Set(), 'secondary': new Set()};

    const loadMusclePresets = async () => {
        const response = await fetch('/api/workouts/workout-presets');
        const workoutPresets = await response.json();

        workoutPresets.forEach(wPreset => {
            const option = document.createElement('option');
            option.value = JSON.stringify(wPreset);
            option.textContent = wPreset.name;
            workoutPresetSelect.appendChild(option);
        });
    };

    const changeWorkoutPreset = () => {
        focusedMuscles['primary'] = new Set();
        focusedMuscles['secondary'] = new Set();

        if (workoutPresetSelect.value == "") {
            updateFocusedMuclesInfoBox(focusedMuscles);
            return;
        }

        const preset = JSON.parse(workoutPresetSelect.value);

        preset.primaryMuscles.forEach(m => {
            document.getElementById(`checkbox-muscle-${m}-primary`).checked = true;
            focusedMuscles['primary'].add(m);
            // document.getElementById(`checkbox-muscle-${m}-secondary`).checked = false;
        });

        preset.secondaryMuscles.forEach(m => {
            // document.getElementById(`checkbox-muscle-${m}-primary`).checked = false;
            document.getElementById(`checkbox-muscle-${m}-secondary`).checked = true;
            focusedMuscles['secondary'].add(m);
        });

        updateFocusedMuclesInfoBox(focusedMuscles);
    };

    const loadWorkoutMuscleFocus = async () => {
        const response = await fetch('/api/exercises');
        const exercises = await response.json();

        const response_MS = await fetch('/api/muscle-scores');
        const muscleScores = await response_MS.json();

        var muscles = [];
        exercises.forEach(exercise => {
            muscles.push(...exercise.primaryMuscles);
            if (exercise.secondaryMuscles) muscles.push(...exercise.secondaryMuscles);
        });

        muscles = [...new Set(muscles)].sort();
        muscles.forEach(muscle => {
            let row = muscleTable.insertRow();

            let name = row.insertCell(0);
            name.innerHTML = muscle;

            let score = row.insertCell(1);
            score.innerHTML = muscleScores[muscle] ?? 0;

            let primary = row.insertCell(2);
            primary.appendChild(createMuscleCheckbox(muscle, true));

            let secondary = row.insertCell(3);
            secondary.appendChild(createMuscleCheckbox(muscle, false));
        });
    };

    const createMuscleCheckbox = (muslceName, isPrimary) => {
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.name = `muscle-${muslceName}-check`;
        input.setAttribute('id', `checkbox-muscle-${muslceName}-` + (isPrimary ? 'primary' : 'secondary'));
        input.addEventListener('click', onlyAllowOne);
        input.addEventListener('click', updateFocusedMucles);

        input.classList.add('checkbox-'  + (isPrimary ? 'primary' : 'secondary'));

        return input
    }

    const onlyAllowOne = (event) => {
        let checkbox = event.target;
        var checkboxes = document.getElementsByName(checkbox.name);
        checkboxes.forEach((item) => {
            if (item !== checkbox) {
                item.checked = false;
                [muscle, checkType] = item.id.split('-').splice(2,2);
                focusedMuscles[checkType].delete(muscle);
            }
        });
    }

    const updateFocusedMucles = (e) => {
        const target = e.target;

        var muscle, isChecked, checkType;
        isChecked = target.checked;

        [muscle, checkType] = target.id.split('-').splice(2,2);

        if (isChecked) {
            focusedMuscles[checkType].add(muscle);
        } else {
            focusedMuscles[checkType].delete(muscle);
        }

        updateFocusedMuclesInfoBox(focusedMuscles);
    };

    const updateFocusedMuclesInfoBox = () => {
        const focusInfo = document.getElementById('form-workout-focus-info');
        
        var primaryStr = "Primary: " + [...focusedMuscles['primary']].sort().join(', ');
        var secondaryStr = "Secondary: " + [...focusedMuscles['secondary']].sort().join(', ');

        focusInfo.innerHTML = `${primaryStr}<br>${secondaryStr}`;

        var parseableFocused = {"primary": [...focusedMuscles['primary']], "secondary": [...focusedMuscles['secondary']]}

        focusInfo.setAttribute('focusedMuscles', JSON.stringify(parseableFocused));
    };

    const createWorkout = async (e) => {
        e.preventDefault();
        startWorkout(document.getElementById('workout-title').value, document.getElementById('form-workout-sets-info').innerHTML, focusedMuscles);
        // document.getElementById('create-workout-form').classList.toggle('hidden');

        // document.getElementById('workout-name').innerHTML = document.getElementById('workout-title').value;

        // document.getElementById('workout-sets-info').innerHTML = document.getElementById('form-workout-sets-info').innerHTML;
        // document.getElementById('workout-focus-info').innerHTML = document.getElementById('form-workout-focus-info').innerHTML;

        // document.getElementById('workout-container').classList.toggle('hidden');

    };

    document.getElementById('create-workout-form').addEventListener('submit', createWorkout);
    workoutPresetSelect.addEventListener('change', changeWorkoutPreset)

    loadMusclePresets();
    loadWorkoutMuscleFocus();

    updateFocusedMuclesInfoBox(focusedMuscles);

    // Load Workoutname
    const rotationNum = Math.floor((new Date() - new Date('2022-07-21')) / (1000 * 60 * 60 * 24 * 7)) + 2;
    document.getElementById('workout-title').value = `Workout Rotation ${rotationNum} - ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]}`;
    document.getElementById('form-workout-sets-info').textContent = "Sets: " + ((rotationNum % 2) != 0 ? "Holds (Tier 1), Strength (Tier 1), Strength (Tier 2)" : "Holds (Tier 1), Strength (Tier 1), Holds (Tier 2)");
});