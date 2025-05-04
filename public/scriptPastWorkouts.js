function toggleDetails() {
    document.getElementById('workouts').classList.toggle('hidden');   
    document.getElementById('details').classList.toggle('hidden'); 
}

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
            var totalFatigue = Object.values(workout.muscleScores).reduce((partial, a) => partial + a.score, 0);
            
            description.innerHTML = `<span>${new Date(workout.date).toLocaleString("se-SE")}</span><br><span>Total Fatigue: ${totalFatigue}</span>`

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
        const detailsExercises = document.getElementById('details-exercises');

        const header = detailsContainer.getElementsByTagName('header')[0]

        // const header = document.createElement('header');
        document.getElementById('details-name').textContent = workout.name;
        // detailsContainer.appendChild(header);

        // detailsExercises.innerHTML = '';
        // workout.exercises.forEach(exercise => {
        //     detailsExercises.innerHTML += `<div>${JSON.stringify(exercise)}</div>`;
        // });

        // document.getElementById('details-container').classList.toggle('hidden');
        toggleDetails();
        // workout['index'] = index;
        detailsContainer.setAttribute('workout', workout.name);

        document.getElementById('option-edit').addEventListener('click', editWorkout);
        document.getElementById('option-delete').addEventListener('click', () => {deleteWorkout(index)});
    };

    const editWorkout = () => {
        // redirect to createWorkout but with a workout variable, check in indexCreateWorkout if there is a workout variable and fill the index accordingly

        // window.location.replace(`/create-workout?workout=${encodeURIComponent(document.getElementById('details-container').getAttribute('workout'))}`);
        window.location.replace(`/create-workout?workout=${document.getElementById('details').getAttribute('workout')}`);
    };

    // document.getElementById('details-edit-exercise').addEventListener('click', editWorkout)

    updateWorkoutList();
});