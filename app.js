const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', 'views');


// TODO: CSS, and to fit phone screen

// TODO: Quality of Life
    // TODO: Maybe highlight in the select-exercise what muscles are the ones that match the filter
    // TODO: When failing to add exercise, show what is missing by marking it red or something
    // TODO: The tier tracking should have all tiers grayed out and when you fill a tear it becomes coloured

// BUG: When using sortable tables and the filter it kind of messes things up due to it being unsorted, dynamically created becomes weird

const loadExercises = () => {
    try {
        const data = fs.readFileSync('exercises.json')
        const exercises = JSON.parse(data);
        return exercises;
    }
    catch (error) {
        console.error("Error loading exercises:", error)
    }
}


// Load workouts from JSON file
const loadWorkouts = () => {
    if (fs.existsSync('workouts.json')) {
        const data = fs.readFileSync('workouts.json');
        return JSON.parse(data);
    }
    return [];
};

// Load workout presets from JSON file
const loadWorkoutPresets = () => {
    if (fs.existsSync('workoutPresets.json')) {
        const data = fs.readFileSync('workoutPresets.json');
        return JSON.parse(data);
    }
    return [];
};

const loadWeightClasses = () => {
    if (fs.existsSync('weightClasses.json')) {
        const data = fs.readFileSync('weightClasses.json');
        return JSON.parse(data);
    }
    return [];
}

// Get all exercises
app.get('/api/exercises', async (req, res) => {
    const muscles = req.query.muscles;
    const weightTypes = req.query.weightTypes;
    const sortBy = req.query.sortBy || 'name';

    exercises = loadExercises();

    // filters.weightType = { $in: weightTypes.split(',') };
    if (weightTypes) {
        const weightTypeArray = weightTypes.split(',');

        exercises = exercises.filter(exercise => 
            exercise.weightTypes.some(weightT => weightTypeArray.includes(weightT))
        );
    }

    if (muscles) {
        const muscleArray = muscles.split(','); // Convert the comma-separated string into an array

        exercises = exercises.filter(exercise => {
            // Check if any primary or secondary muscle matches
            const hasPrimaryMuscle = exercise.primaryMuscles.some(muscle => muscleArray.includes(muscle));
            // console.log(exercise.name, hasPrimaryMuscle, exercise.primaryMuscles, muscleArray)
            const hasSecondaryMuscle = exercise.secondaryMuscles ? exercise.secondaryMuscles.some(muscle => muscleArray.includes(muscle)) : false;
            return hasPrimaryMuscle || hasSecondaryMuscle;
        });
    }

    res.json(exercises);
});

app.get('/api/exercises/weight-class', async (req, res) => {
    const name = req.query.name;

    const classes = loadWeightClasses();
    var weightClass;

    classes.forEach(cls => {
        if (cls.name === name) weightClass = cls;
    });

    res.json(weightClass);
});

app.get('/api/exercise', async (req, res) => {
    const name = req.query.name;
    var exercise;

    exercises = loadExercises();

    for (var i = 0; i < exercises.length; i++) {
        if (exercises[i].name === name) {
            exercise = exercises[i];
            break;
        }
    }

    res.json(exercise);
});


// Save workouts to JSON file
const saveWorkouts = (workouts) => {
    fs.writeFileSync('workouts.json', JSON.stringify(workouts, null, 2));
};

// Get all workouts
app.get('/api/workouts', (req, res) => {
    const workouts = loadWorkouts();
    res.json(workouts);
});

// Get all workout presets
app.get('/api/workouts/workout-presets', (req, res) => {
    const workoutTypes = loadWorkoutPresets();
    res.json(workoutTypes);
});

// Add a new workout
app.post('/api/workouts', (req, res) => {
    const workouts = loadWorkouts();
    workouts.push(req.body);
    saveWorkouts(workouts);
    res.status(201).json(req.body);
});

// Add a new workout
app.post('/api/workouts/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    const workouts = loadWorkouts();
    if (index >= 0 && index < workouts.length) {
        workouts[index] = req.body;
    }
    saveWorkouts(workouts);
    res.status(201).json(req.body);
});

// Endpoint to get the most recent exercise by type
app.get('/api/exercises/recent/:name/:type', (req, res) => {
    const workouts = loadWorkouts();
    const name = req.params.name;
    const type = req.params.type;

    var recentExercise = "";

    for (var i = 0; i < workouts.length; i++){
        for (var j = 0; j < workouts[i].exercises.length; j++){
            var exercise = workouts[i].exercises[j];
            if (exercise.type === type && exercise.name === name){
                recentExercise = exercise;
                break;
            }
        }
        if (recentExercise != "") break;
    }

    // const recentExercise = exercises
    //     .filter(exercise => exercise.type === type)
    //     .pop(); // Get the most recent exercise with the specified type

    if (recentExercise) {
        res.json(recentExercise);
    } else {
        res.status(404).json({ message: 'No exercise found for this type.' });
    }
});


// Delete a workout by index
app.delete('/api/workouts/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    const workouts = loadWorkouts();

    if (isNaN(index) || index < 0 || index >= workouts.length) {
        return res.status(404).json({ error: 'Workout not found' });
    }

    workouts.splice(index, 1); // Remove the workout at the specified index
    saveWorkouts(workouts);
    res.status(204).send(); // No content to send back
});


app.get('/api/muscle-scores', (req, res) => {
    var muscleScores = {};

    const workouts = loadWorkouts();
    for (var i = 0; i < workouts.length; i++){
        var workout = workouts[i];
        for (const [muscle, info] of Object.entries(workout.muscleScores)) {
            if (!muscleScores.hasOwnProperty(muscle)) muscleScores[muscle] = info.score;
            else muscleScores[muscle] += info.score;
        }
    }

    res.json(muscleScores);
});


app.get('/', (req, res) => {
    res.render('index');
});

app.get('/create-workout', (req, res) => {
    var workout = req.query.workout;
    res.render('indexCreateWorkout', {loadWorkout:encodeURIComponent(workout)});
    // res.render('indexCreateWorkout');
});

app.get('/muscle-status', (req, res) => {
    res.render('indexMuscleStatus');
});

app.get('/previous-workouts', (req, res) => {
    res.render('indexPreviousWorkouts');
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;