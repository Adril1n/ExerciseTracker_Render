document.addEventListener('DOMContentLoaded', () => {
    const workoutList = document.getElementById('workout-list');

    const updateWorkoutList = async () => {
        const response = await fetch('/api/workouts');
        const workouts = await response.json();
        workoutList.innerHTML = ''; // Clear the list before updating
        workouts.forEach((workout, index) => {
            const li = document.createElement('li');
            li.textContent = `${workout.name}`;
            li.setAttribute('workout', JSON.stringify(workout));
            
            // Create a delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', async () => {
                const confirmDelete = confirm('Are you sure you want to delete this workout?');
                if (confirmDelete) {
                    await deleteWorkout(index);
                    updateWorkoutList(); // Refresh the workout list
                }
            });

            // Create a details button
            const detailsButton = document.createElement('button');
            detailsButton.textContent = 'View Details';
            detailsButton.addEventListener('click', () => {
                showDetails(workout, index);
            });

            li.appendChild(deleteButton);
            li.appendChild(detailsButton);
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
    };

    const showDetails = (workout, index) => {
        const detailsElement = document.getElementById('details-exercises');

        detailsElement.innerHTML = '';

        workout.exercises.forEach(exercise => {
            console.log(exercise);
            detailsElement.innerHTML += `<div>${JSON.stringify(exercise)}</div>`;
        });

        document.getElementById('details-container').classList.toggle('hidden');
        workout['index'] = index;
        document.getElementById('details-container').setAttribute('workout', JSON.stringify(workout));
    };

    const editWorkout = () => {

        // redirect to createWorkout but with a workout variable, check in indexCreateWorkout if there is a workout variable and fill the index accordingly
        window.location.replace(`/create-workout?workout=${encodeURIComponent(document.getElementById('details-container').getAttribute('workout'))}`);
    };

    document.getElementById('details-edit-exercise').addEventListener('click', editWorkout)

    updateWorkoutList();
});