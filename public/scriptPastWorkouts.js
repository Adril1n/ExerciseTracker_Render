function toggleDetails() {
    document.getElementById('workouts').classList.toggle('hidden');   
    document.getElementById('details').classList.toggle('hidden'); 
}

function changeDetailsTab(tabName) {
    // tabName = tab.textContent.toLowerCase();
    const detailsContent = document.getElementById('details-content');
    const previousTab = detailsContent.getAttribute('activeTab');
    if (previousTab != "none") {
        document.getElementById('tab-' + previousTab).setAttribute('active', "false");
    }

    detailsContent.innerHTML = document.getElementById('details-' + tabName).innerHTML;
    detailsContent.setAttribute('activeTab', tabName);

    document.getElementById('tab-' + tabName).setAttribute('active', 'true');
}

// async function sumWeights(exercises) {
//     var sum = 0;
//     for (const exercise of exercises) {
//         const exerciseResponse = await fetch(`/api/exercise?name=${exercise.name}`);
//         const exerciseXMLElement = await exerciseResponse.json();

//         const weightClassResponse = await fetch(`/api/exercises/weight-class?name=${exerciseXMLElement.weightClass}`);
//         const weightClass = await weightClassResponse.json();

//         if (weightClass.unit == 'kg') sum += exercise.weight * 2.2;
//         else sum += exercise.weight;
//     }

//     return sum;
// }

document.addEventListener('DOMContentLoaded', () => {
    const workoutList = document.getElementById('workout-list');

    const updateWorkoutList = async () => {
        const response = await fetch('/api/workouts');
        const workouts = await response.json();
        workoutList.innerHTML = ''; // Clear the list before updating

        if (workouts.length === 0) {
            workoutList.innerHTML = `<span style="color: var(--secondary);">No Workout found...</span>`;
            return;
        }

        workouts.forEach((workout, index) => {
            const li = document.createElement('li');
            li.classList.add('workout-item')
            // li.textContent = `${workout.name}`;
            li.setAttribute('workout', workout.name);

            const workoutBody = document.createElement('div');
            const workoutButtons = document.createElement('div');
            workoutButtons.classList.add('workout-item-buttons');


            // BODY
            const title = document.createElement('div');
            title.classList.add('workout-item-title');
            title.textContent = workout.name;

            workoutBody.appendChild(title);

            const description = document.createElement('div');
            description.classList.add('workout-item-description');
            var totalMuscleScore = Object.values(workout.muscleScores).reduce((partial, a) => partial + a.score, 0);
            
            description.innerHTML = `<span>${new Date(workout.date).toLocaleString("se-SE")}</span><br><span>Total Score: ${totalMuscleScore}</span>`

            workoutBody.appendChild(description);

            // BUTTONS
            workoutButtons.innerHTML = `<div class="arrow">&#x25b6</div>`

            li.addEventListener('click', () => {showDetails(workout, index)});

            li.appendChild(workoutBody);
            li.appendChild(workoutButtons);
            workoutList.appendChild(li);
        });
    };

    const deleteWorkout = async (index) => {
        const response = await fetch(`/api/workouts/${index}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            alert('Failed to delete workout.');
        }
        else {
            alert('Workout deleted!');
            window.location.replace(`/previous-workouts`);
        }
    };

    const showDetails = (workout, index) => {
        const detailsContainer = document.getElementById('details');

        const header = detailsContainer.getElementsByTagName('header')[0]

        document.getElementById('details-name').textContent = workout.name;

        detailsContainer.setAttribute('workout', workout.name);

        document.getElementById('option-edit').addEventListener('click', editWorkout);
        document.getElementById('option-delete').addEventListener('click', () => {deleteWorkout(index)});

        //DETAIL TABS
        const dateString = new Date(workout.date).toLocaleString("se-SE")

        //  OVERVIEW
        const overviewContainer = document.getElementById('details-overview');

        var totalMuscleScore = Object.values(workout.muscleScores).reduce((partial, a) => partial + a.score, 0);
        document.getElementById('details-overview-summary').innerHTML = `Date: ${dateString}<br>Total Fatigue: ${totalMuscleScore}<br>${workout.setsInfo}`


        const exercisesTable = document.getElementById('details-overview-exercises').getElementsByTagName('tbody')[0];
        
        workout.exercises.forEach((exercise) => {
            exercisesTable.innerHTML += `<tr><td>${exercise.name}</td><td>${exercise.reps}</td><td>${exercise.weight} ${exercise.unit}</td><td>${exercise.fatigue}</td></tr>`;
        });


        const musclesTable = document.getElementById('details-overview-muscles').getElementsByTagName('tbody')[0];
        var focusedScore = 0;

        Object.entries(workout.focusedMuscles).forEach((mLevel) => {
            mLevel[1].forEach((muscle) => {
                const muscleScoreItem = workout.muscleScores[muscle]
                var muscleScore = 0;
                if (muscleScoreItem != undefined) muscleScore = muscleScoreItem.score
                focusedScore += muscleScore;
                musclesTable.innerHTML += `<tr><td>${muscle}</td><td>${muscleScore}</td><td>${mLevel[0].charAt(0).toUpperCase() + mLevel[0].slice(1)}</td></tr>`;
            });
        });


        musclesTable.innerHTML += `<tr><td>Other</td><td>${totalMuscleScore - focusedScore}</td><td>Other</td></tr>`;

        //  EXERCISES

        const exercisesTable_Exercises = document.getElementById('details-exercises').getElementsByTagName('tbody')[0];
        
        workout.exercises.forEach((exercise) => {
            exercisesTable_Exercises.innerHTML += `<tr><td>${exercise.name}</td><td>${exercise.reps}</td><td>${exercise.weight} ${exercise.unit}</td><td>${exercise.fatigue}</td><td>${exercise.type}</td></tr>`;
        });

        //  STATS

        const statsTable = document.getElementById('details-stats').getElementsByTagName('tbody')[0];
        
        var totalReps = 0;
        var totalVolume = 0;

        for (const exercise of workout.exercises) {
            totalReps += exercise.reps;
            if (exercise.unit == 'kg') totalVolume += exercise.weight * 2.2;
            else totalVolume += exercise.weight;
        }


        // totalVolume = await sumWeights(workout.exercises);

        statsTable.innerHTML += `<tr><td>Total Reps</td><td>${totalReps}</td></tr>`
        statsTable.innerHTML += `<tr><td>Total Volume</td><td>${totalVolume} lbs</td></tr>`
        statsTable.innerHTML += `<tr><td>Total Fatigue</td><td>${totalMuscleScore}</td></tr>`



        //FINAL
        document.getElementById('details').setAttribute('workoutIndex', index);
        toggleDetails();
        changeDetailsTab('overview');
    };

    const editWorkout = () => {
        // redirect to createWorkout but with a workout variable, check in indexCreateWorkout if there is a workout variable and fill the index accordingly

        // window.location.replace(`/create-workout?workout=${encodeURIComponent(document.getElementById('details-container').getAttribute('workout'))}`);
        window.location.replace(`/create-workout?workout=${document.getElementById('details').getAttribute('workout')}&index=${document.getElementById('details').getAttribute('workoutIndex')}`);
    };

    // document.getElementById('details-edit-exercise').addEventListener('click', editWorkout)

    updateWorkoutList();
});