/**
 * Exercise Registry
 * Central registry for managing all exercise modules
 */

class ExerciseRegistry {
    constructor() {
        this.exercises = new Map();
        this.currentExercise = null;
    }
    
    /**
     * Register a new exercise
     */
    register(exercise) {
        if (!exercise.id || !exercise.name) {
            console.error('Exercise must have id and name properties');
            return false;
        }
        
        this.exercises.set(exercise.id, exercise);
        console.log(`Registered exercise: ${exercise.name} (${exercise.id})`);
        return true;
    }
    
    /**
     * Get exercise by ID
     */
    getExercise(exerciseId) {
        return this.exercises.get(exerciseId);
    }
    
    /**
     * Get all exercises
     */
    getAllExercises() {
        return Array.from(this.exercises.values());
    }
    
    /**
     * Get exercises by category
     */
    getExercisesByCategory(category) {
        return this.getAllExercises().filter(ex => ex.category === category);
    }
    
    /**
     * Get exercise categories
     */
    getCategories() {
        const categories = new Set();
        this.getAllExercises().forEach(ex => {
            if (ex.category) {
                categories.add(ex.category);
            }
        });
        return Array.from(categories);
    }
    
    /**
     * Set current exercise
     */
    setCurrentExercise(exerciseId) {
        const exercise = this.getExercise(exerciseId);
        if (exercise) {
            this.currentExercise = exercise;
            return true;
        }
        return false;
    }
    
    /**
     * Get current exercise
     */
    getCurrentExercise() {
        return this.currentExercise;
    }
    
    /**
     * Clear current exercise
     */
    clearCurrentExercise() {
        this.currentExercise = null;
    }
    
    /**
     * Get exercise info for display
     */
    getExerciseInfo(exerciseId) {
        const exercise = this.getExercise(exerciseId);
        if (!exercise) return null;
        
        return exercise.getInfo ? exercise.getInfo() : {
            id: exercise.id,
            name: exercise.name,
            category: exercise.category || 'general',
            difficulty: exercise.difficulty || 'beginner',
            description: exercise.description || ''
        };
    }
    
    /**
     * Initialize all registered exercises with core audio
     */
    initializeAll(coreAudioFeedback) {
        this.exercises.forEach(exercise => {
            if (exercise.initialize && typeof exercise.initialize === 'function') {
                exercise.initialize(coreAudioFeedback);
            }
        });
    }
}

// Create global registry instance
window.exerciseRegistry = new ExerciseRegistry();