var loadWorkout = null;

var muscleScores = {}; // {muscleGroup: {'type': 'primary' / 'secondary' / 'standard', 'score': typeof(int)}}
var exerciseMuscleGroups = {} // {exerciseName: {'primaryMuscles': [], 'secondaryMuscles': []}}

const primaryScoreGoal = 50;
const secondaryScoreGoal = 30;

async function updatePreviousExerciseValues() {
    const selectedType = document.getElementById('exercise-type-select').value;
    const exerciseName = document.getElementById('selectedExercise').innerHTML;
    const recentValuesDisplay = document.getElementById('recent-values');
    if (!(selectedType && exerciseName)) return;

    const response = await fetch(`/api/exercises/recent/${exerciseName}/${selectedType}`);

    if (response.ok) {
      const recentExercise = await response.json();
      recentValuesDisplay.innerHTML = `
        <p value="${recentExercise.reps}">Reps: ${recentExercise.reps}</p>
        <p value="${recentExercise.weight}">Weight: ${recentExercise.weight}</p>
        <p value="${recentExercise.fatigue}">Fatigue: ${recentExercise.fatigue}</p>
      `;
    } else {
      recentValuesDisplay.innerHTML = '<p>No previous exercise found for this type.</p>';
    }
}

function updateMuscleScoreHTML() {
    const primaryContainer = document.getElementById('workout-muscle-score-info-primary');
    const secondaryContainer = document.getElementById('workout-muscle-score-info-secondary');
    const standardContainer = document.getElementById('workout-muscle-score-info-standard');

    primaryContainer.innerHTML = '';
    secondaryContainer.innerHTML = '';
    standardContainer.innerHTML = '';

    var container;

    for (const [muscle, info] of Object.entries(muscleScores)) {
        const muscleElement = document.createElement('div');
        muscleElement.style.display = 'flex';

        const namePart = document.createElement('div');
        namePart.innerHTML = muscle;
        muscleElement.appendChild(namePart);
        
        const scorePart = document.createElement('div');
        scorePart.textContent = `${info.score}`
        switch (info.type) {
            case 'primary':
                container = primaryContainer;
                scorePart.textContent += '/' + primaryScoreGoal;
                break;
            case 'secondary':
                container = secondaryContainer;
                scorePart.textContent += '/' + secondaryScoreGoal;
                break;
            default:
                container = standardContainer;
        }
        muscleElement.appendChild(scorePart);

        if (info.type != 'standard') {
            const barPart = document.createElement('div');
            barPart.innerHTML = '...I AM THE BAR...';
            barPart.innerHTML += info.type === 'primary' ? 'Primary' : 'Secondary';
            muscleElement.appendChild(barPart);
        } 
        else if (info.score == 0 ) muscleElement.style.display = 'none';

        container.appendChild(muscleElement);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const recentValuesDisplay = document.getElementById('recent-values');
    const exerciseSelect = document.getElementById('selectedExercise');
    const exerciseTypeSelect = document.getElementById('exercise-type-select');
    const exerciseList = document.getElementById('exerciseList');

    var currentExercises = [];
    var exerciseTierTracker = {};

    // muscleScores = {};
    // exerciseMuscleGroups = {};

    const addExercise = () => {
        const exerciseName = exerciseSelect.innerHTML;
        var fatigue = document.getElementById('fatigue').value;
        var reps = document.getElementById('reps').value;
        var weight = document.getElementById('weight').value;
        const exerciseType = document.getElementById('exercise-type-select').value;

        fatigue = Math.min(Math.max(parseInt(fatigue), 1), 10),
        reps = Math.max(parseInt(reps), 1),
        weight = Math.max(parseFloat(weight), 0)

        if (exerciseName && fatigue && reps && (weight >= 0) && exerciseType) {
            createExercise({name: exerciseName, fatigue: fatigue, reps: reps, weight: weight, type: exerciseType, unit: document.getElementById('weight').getAttribute('unit')});
        } 
        else {
            alert('Please fill in all fields.');
        }
    };

    const createExercise = (exercise) => {
        const exerciseName = exercise.name;
        const fatigue = exercise.fatigue;
        const reps = exercise.reps; 
        const weight = exercise.weight;
        const exerciseType = exercise.type;
        currentExercises.push(exercise);

        const li = document.createElement('li');
        li.textContent = formatExerciseDescription(currentExercises[currentExercises.length-1]);
        li.addEventListener('click', () => {
            fillExerciseFields(exerciseName, fatigue, reps, weight, exerciseType);
        })

        // Create remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            currentExercises.splice(currentExercises.indexOf(exerciseName), 1);
            exerciseList.removeChild(li);

            exerciseTierTracker[exerciseName].splice(exerciseTierTracker[exerciseName].indexOf(exerciseType), 1);
            updateExerciseTracker();

            updateMuscleScores(exercise);
        });

        li.appendChild(removeButton);
        // li.appendChild(duplicateButton);
        exerciseList.appendChild(li);

        clearExerciseFields();

        if (exerciseName in exerciseTierTracker){
            exerciseTierTracker[exerciseName].push(exerciseType);
        }
        else {
            exerciseTierTracker[exerciseName] = [exerciseType];
        }

        updateExerciseTracker();
        updateMuscleScores(exercise);
    };

    const updateMuscleScores = (exercise) => {
        for (const [type, muscles] of Object.entries(exerciseMuscleGroups[exercise.name])) {
            muscles.forEach(m => {
                muscleScores[m].score += type === 'primaryMuscles' ? exercise.fatigue*2 : exercise.fatigue;
            });
        }

        updateMuscleScoreHTML();
    };

    const updateExerciseTracker = () => {
        const tierTrackerElement = document.getElementById(`exerciseTierTracker`);
        tierTrackerElement.innerHTML = '';
        
        for (const [name, trackerTypes] of Object.entries(exerciseTierTracker)){
            const element = document.createElement('div');
            if (trackerTypes.length === 0) continue;
            
            element.innerHTML = `${name}: ${trackerTypes[0]}`;
            trackerTypes.slice(1).forEach((t) => element.innerHTML += `, ${t}`);
            
            tierTrackerElement.appendChild(element);
        }
    };

    const fillExerciseFields = async (exerciseName, fatigue, reps, weight, exerciseType) => {
        const exerciseResponse = await fetch(`/api/exercise?name=${exerciseName}`);
        const exercise = await exerciseResponse.json();

        const weightClassResponse = await fetch(`/api/exercises/weight-class?name=${exercise.weightClass}`);
        const weightClass = await weightClassResponse.json();

        const weightElement = document.getElementById('weight');
        weightElement.setAttribute('unit', weightClass.unit);

        weightElement.innerHTML = '';

        getWeightIntervalsAsArray(weightClass.intervals).forEach(w => {
            weightElement.innerHTML += `<option value="${w}">${w}</option>`;
        });

        exerciseSelect.innerHTML = exerciseName;
        document.getElementById('fatigue').value = fatigue;
        document.getElementById('reps').value = reps;
        weightElement.value = weight;
        document.getElementById('exercise-type-select').value = exerciseType;
    };

    const clearExerciseFields = () => {
        exerciseSelect.innerHTML = '';
        document.getElementById('fatigue').value = '';
        document.getElementById('reps').value = '';
        document.getElementById('weight').value = '';
        document.getElementById('exercise-type-select').value = '';
    };

    const formatExerciseDescription = (e) => {
        return `${e.name} (Reps: ${e.reps}, Weight: ${e.weight} ${document.getElementById('weight').getAttribute('unit')}), Fatigue: ${e.fatigue}/10, Type: ${e.type}`;
    };

    const fillWithRecentValues = () => {
        if (recentValuesDisplay.children.length <= 1) return;

        document.getElementById('reps').value = recentValuesDisplay.children[0].getAttribute('value');
        document.getElementById('weight').value = recentValuesDisplay.children[1].getAttribute('value');
        document.getElementById('fatigue').value = recentValuesDisplay.children[2].getAttribute('value');
    };

    const saveWorkout = async () => {
        if (currentExercises.length === 0) {
            alert('No exercises to save.');
            return;
        }

        const workout = getCurrentWorkout();
        workout.date = new Date();

        const response = await fetch('/api/workouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workout)
        });

        if (response.ok) {
            alert('Workout saved successfully!');
            // currentExercises.length = 0; // Clear the exercises array
            // exerciseList.innerHTML = ''; // Clear the exercise list

            // reload();

            // updateWorkoutList(); // Refresh the workout list
        } else {
            alert('Failed to save workout.');
        }
    };

    const saveEditedWorkout = async () => {
        const response = await fetch(`/api/workouts/${loadWorkout.index}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(getCurrentWorkout())
        });

        if (response.ok) {
            alert('Workout saved successfully!');
        } else {
            alert('Failed to save workout.');
        }
    }

    const getCurrentWorkout = () => {
        return { 
            name: document.getElementById('workout-name').innerHTML,
            exercises: currentExercises,
            muscleScores: Object.fromEntries(Object.entries(muscleScores).filter(([k,v]) => v.score != 0)), // filtering works to not fill up json, but the muscle status doesn't show zeros of the muscle has never been worked on
            tiersCompleted: exerciseTierTracker,
            focusedMuscles: JSON.parse(document.getElementById('form-workout-focus-info').getAttribute('focusedMuscles')),
            setsInfo: document.getElementById('form-workout-sets-info').textContent
        };
    };

    const loadWorkoutToEdit = async () => {
        await startWorkout(loadWorkout.name, loadWorkout.setsInfo, loadWorkout.focusedMuscles);

        loadWorkout.exercises.forEach((exercise) => {
            createExercise(exercise);
        });

        document.getElementById('saveWorkout').removeEventListener('click', saveWorkout);
        document.getElementById('saveWorkout').addEventListener('click', saveEditedWorkout);
    };

    document.getElementById('addExercise').addEventListener('click', addExercise);
    document.getElementById('saveWorkout').addEventListener('click', saveWorkout);
    document.getElementById('clearExerciseFields').addEventListener('click', clearExerciseFields);
    exerciseTypeSelect.addEventListener('change', updatePreviousExerciseValues);

    document.getElementById('recent-values-fill').addEventListener('click', fillWithRecentValues);

    // window.onbeforeunload = function () {
    //     return "are you sure you want to leave? workout will be deleted";
    // };

    if (loadWorkout) loadWorkoutToEdit();
});