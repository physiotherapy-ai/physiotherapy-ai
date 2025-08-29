/**
 * Arm Raises Exercise Module
 * Exports all components for the arm raises exercise
 */

class ArmRaisesExercise {
    constructor() {
        this.name = 'Arm Raises';
        this.id = 'arm-raises';
        this.category = 'shoulder';
        this.difficulty = 'beginner';
        this.targetMuscles = ['Shoulders', 'Upper Back'];
        this.equipment = 'None';
        this.description = 'Lateral arm raises to strengthen shoulder muscles';
        this.demoAnimation = 'https://wellnessed.com/wp-content/uploads/2023/03/how-to-do-dumbbell-lateral-raise.gif';
        
        // Instructions for the exercise
        this.instructions = [
            'Stand with feet shoulder-width apart',
            'Keep arms straight at your sides',
            'Slowly raise both arms to shoulder height',
            'Hold for 3 seconds',
            'Lower arms back down slowly',
            'Repeat for 10 repetitions'
        ];
        
        // Initialize exercise components
        this.analyzer = null;
        this.audioFeedback = null;
        this.coreAudio = null;
    }
    
    /**
     * Initialize the exercise with core audio feedback
     */
    initialize(coreAudioFeedback) {
        this.coreAudio = coreAudioFeedback;
        this.analyzer = new ArmRaisesAnalyzer();
        this.audioFeedback = new ArmRaisesAudioFeedback(coreAudioFeedback);
    }
    
    /**
     * Analyze pose for this exercise
     */
    analyzePose(landmarks) {
        if (!this.analyzer) return null;
        return this.analyzer.analyze(landmarks);
    }
    
    /**
     * Handle audio feedback based on analysis
     */
    handleAudioFeedback(analysis) {
        if (!this.audioFeedback || !analysis) return;
        
        // Announce phase changes
        this.audioFeedback.announcePhase(analysis.state, analysis.angles);
        
        // Announce errors
        if (analysis.formErrors && analysis.formErrors.length > 0) {
            this.audioFeedback.announceError(new Set(analysis.formErrors));
        }
        
        // Provide encouragement
        this.coreAudio.provideEncouragement(analysis.formScore);
    }
    
    /**
     * Handle rep completion
     */
    handleRepComplete(repCount) {
        if (this.coreAudio) {
            this.coreAudio.announceRep(repCount, this.name);
        }
    }
    
    /**
     * Start exercise
     */
    start() {
        if (this.analyzer) {
            this.analyzer.reset();
        }
        if (this.audioFeedback) {
            this.audioFeedback.reset();
            this.audioFeedback.announceExerciseStart();
        }
    }
    
    /**
     * Stop exercise
     */
    stop() {
        const progress = this.analyzer ? this.analyzer.getProgress() : null;
        
        if (progress && this.coreAudio) {
            this.coreAudio.announceExerciseComplete(progress.reps, progress.formScore);
        }
        
        return progress;
    }
    
    /**
     * Reset exercise
     */
    reset() {
        if (this.analyzer) {
            this.analyzer.reset();
        }
        if (this.audioFeedback) {
            this.audioFeedback.reset();
        }
    }
    
    /**
     * Get exercise information
     */
    getInfo() {
        return {
            name: this.name,
            id: this.id,
            category: this.category,
            difficulty: this.difficulty,
            targetMuscles: this.targetMuscles,
            equipment: this.equipment,
            description: this.description,
            instructions: this.instructions,
            demoAnimation: this.demoAnimation
        };
    }
    
    /**
     * Get current progress
     */
    getProgress() {
        return this.analyzer ? this.analyzer.getProgress() : null;
    }
}

// Export the exercise class
window.ArmRaisesExercise = ArmRaisesExercise;