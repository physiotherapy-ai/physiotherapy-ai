/**
 * Arm Raises Specific Audio Feedback
 * Extends the core AudioFeedback class with arm-raises specific functionality
 */

class ArmRaisesAudioFeedback {
    constructor(coreAudioFeedback) {
        this.audio = coreAudioFeedback;
        this.lastPhase = '';
        this.currentPhase = '';
        this.holdTimerActive = false;
        this.holdTimerId = null;
    }
    
    /**
     * Provide feedback for arm raises exercise phases with hold timer
     */
    announcePhase(phase, angles = null, holdDuration = 0, holdComplete = false) {
        if (!this.audio.enabled) return;
        
        // Only announce phase changes
        if (phase === this.lastPhase) return;
        
        // Check if enough time has passed since last announcement
        const now = Date.now();
        const timeSinceLastFeedback = now - this.audio.lastFeedbackTime;
        
        switch(phase) {
            case 'resting':
                // Clean up any active hold timer when returning to rest
                if (this.holdTimerId) {
                    clearTimeout(this.holdTimerId);
                    this.holdTimerId = null;
                }
                this.holdTimerActive = false;
                
                if (this.lastPhase === 'lowering') {
                    // After 2 seconds, prompt for next movement
                    setTimeout(() => {
                        if (this.audio.enabled && this.currentPhase === 'resting') {
                            this.audio.speak('Raise your arms again', 'normal');
                            this.audio.playBeep(440, 100); // A4 ready beep
                        }
                    }, 2000);
                } else if (this.lastPhase === '') {
                    // Starting position
                    this.audio.speak('Ready to begin. Raise your arms slowly.', 'normal');
                }
                break;
                
            case 'raising':
                // Only announce if coming from resting, not from other phases
                if (this.lastPhase === 'resting' && timeSinceLastFeedback > 3000) {
                    // Don't speak every time, just beep
                    this.audio.playBeep(523, 150); // C5 note
                }
                break;
                
            case 'holding':
                // Simple hold instruction
                if (this.lastPhase === 'raising') {
                    // Just reached holding position
                    this.audio.speak('Hold for 3 seconds', 'high');
                    this.audio.playBeep(659, 150); // E5 note
                    
                    // Clear any existing timer
                    if (this.holdTimerId) {
                        clearTimeout(this.holdTimerId);
                    }
                    
                    // Set flag that timer is active
                    this.holdTimerActive = true;
                    
                    // After 3 seconds, tell to lower (only if still holding)
                    this.holdTimerId = setTimeout(() => {
                        if (this.audio.enabled && this.holdTimerActive) {
                            this.audio.speak('Down your hands slowly', 'high');
                            this.audio.playBeep(392, 200);
                            this.holdTimerActive = false;
                        }
                    }, 3000);
                }
                break;
                
            case 'lowering':
                // Just beep when lowering starts
                if (this.lastPhase === 'holding') {
                    // Cancel the hold timer if user lowered early
                    if (this.holdTimerId) {
                        clearTimeout(this.holdTimerId);
                        this.holdTimerId = null;
                    }
                    this.holdTimerActive = false;
                    this.audio.playBeep(392, 100);
                }
                break;
        }
        
        this.lastPhase = phase;
        this.currentPhase = phase;
    }
    
    /**
     * Provide error correction feedback for arm raises
     */
    announceError(errors) {
        if (!this.audio.enabled || errors.size === 0) return;
        
        const now = Date.now();
        
        // Check cooldown - don't announce errors too frequently
        if (now - this.audio.lastErrorTime < this.audio.errorCooldown) {
            return;
        }
        
        // Priority order for error feedback (arm raises specific)
        const errorMessages = {
            'arm_too_high_left': 'Lower your left arm slightly',
            'arm_too_high_right': 'Lower your right arm slightly',
            'asymmetric_movement': 'Keep both arms at the same height',
            'elbow_bent_left': 'Straighten your left arm',
            'elbow_bent_right': 'Straighten your right arm',
            'too_fast_raising': 'Slower movement please',
            'insufficient_height': 'Raise arms higher to shoulder level'
        };
        
        // Find the first error that has a message
        for (const [errorKey, message] of Object.entries(errorMessages)) {
            if (errors.has(errorKey)) {
                // Don't repeat the same error message too frequently
                if (this.audio.lastFeedback !== message || now - this.audio.lastFeedbackTime > 8000) {
                    this.audio.speak(message, 'high');
                    // Play warning beep
                    this.audio.playBeep(300, 200, 0.2); // Lower frequency for warning
                    this.audio.lastErrorTime = now;
                }
                break; // Only announce one error at a time
            }
        }
    }
    
    /**
     * Announce exercise start for arm raises
     */
    announceExerciseStart() {
        if (!this.audio.enabled) return;
        
        this.audio.speak('Starting Arm Raises. Stand with arms at your sides.', 'high');
        
        setTimeout(() => {
            this.audio.speak('Raise and lower your arms slowly. Let\'s begin!', 'normal');
        }, 3000);
    }
    
    /**
     * Reset for new session
     */
    reset() {
        this.lastPhase = '';
        this.currentPhase = '';
        this.holdTimerActive = false;
        if (this.holdTimerId) {
            clearTimeout(this.holdTimerId);
            this.holdTimerId = null;
        }
        this.audio.reset();
    }
}

// Export for use in arm-raises module
window.ArmRaisesAudioFeedback = ArmRaisesAudioFeedback;