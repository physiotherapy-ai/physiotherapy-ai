/**
 * Audio Feedback System for Physiotherapy Exercises
 * Uses Web Speech API for text-to-speech feedback
 */

class AudioFeedback {
    constructor() {
        // Check if speech synthesis is available
        this.speechAvailable = 'speechSynthesis' in window;
        
        // Settings
        this.enabled = true;
        this.volume = 0.8;
        this.rate = 1.0;
        this.pitch = 1.0;
        
        // Voice selection (will be set after voices load)
        this.selectedVoice = null;
        
        // Track last feedback to avoid repetition
        this.lastFeedback = '';
        this.lastFeedbackTime = 0;
        this.minFeedbackInterval = 3000; // Minimum 3 seconds between same feedback
        this.lastErrorTime = 0;
        this.errorCooldown = 5000; // 5 seconds between error announcements
        
        // Track phase announcements
        this.lastPhase = '';
        this.currentPhase = '';
        this.repAnnounced = false;
        this.holdCountdownStarted = false;
        this.holdCountdown = -1;
        this.lowerInstructionGiven = false;
        
        // Initialize voices
        if (this.speechAvailable) {
            this.initializeVoices();
        }
        
        // Audio cues using Web Audio API for beeps
        this.audioContext = null;
        this.initializeAudioContext();
    }
    
    /**
     * Initialize Web Audio API for beep sounds
     */
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    /**
     * Initialize speech synthesis voices
     */
    initializeVoices() {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            
            // Prefer English voices
            const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
            
            // Try to find a female voice (often clearer for exercise instructions)
            const femaleVoice = englishVoices.find(voice => 
                voice.name.toLowerCase().includes('female') || 
                voice.name.toLowerCase().includes('samantha') ||
                voice.name.toLowerCase().includes('victoria') ||
                voice.name.toLowerCase().includes('karen')
            );
            
            this.selectedVoice = femaleVoice || englishVoices[0] || voices[0];
            console.log('Selected voice:', this.selectedVoice?.name);
        };
        
        // Load voices
        loadVoices();
        
        // Chrome loads voices asynchronously
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }
    
    /**
     * Speak text using speech synthesis
     */
    speak(text, priority = 'normal') {
        if (!this.enabled || !this.speechAvailable) return;
        
        // Check if same feedback was recently spoken
        const now = Date.now();
        if (text === this.lastFeedback && (now - this.lastFeedbackTime) < this.minFeedbackInterval) {
            return;
        }
        
        // Cancel current speech for high priority messages
        if (priority === 'high') {
            window.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice properties
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }
        utterance.volume = this.volume;
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;
        
        // Speak
        window.speechSynthesis.speak(utterance);
        
        // Update tracking
        this.lastFeedback = text;
        this.lastFeedbackTime = now;
    }
    
    /**
     * Play a beep sound
     */
    playBeep(frequency = 440, duration = 200, volume = 0.3) {
        if (!this.audioContext || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    /**
     * Provide feedback for exercise phases with hold timer
     */
    announcePhase(phase, angles = null, holdDuration = 0, holdComplete = false) {
        if (!this.enabled) return;
        
        // Only announce phase changes
        if (phase === this.lastPhase) return;
        
        // Check if enough time has passed since last announcement
        const now = Date.now();
        const timeSinceLastFeedback = now - this.lastFeedbackTime;
        
        switch(phase) {
            case 'resting':
                if (this.lastPhase === 'lowering') {
                    // Just completed a rep - wait 2 seconds then say ready for next
                    this.lowerInstructionGiven = false; // Reset for next rep
                    this.holdCountdownStarted = false;
                    this.holdCountdown = -1;
                    
                    // After 2 seconds, prompt for next movement
                    setTimeout(() => {
                        if (this.enabled && this.currentPhase === 'resting') {
                            this.speak('Raise your arms again', 'normal');
                            this.playBeep(440, 100); // A4 ready beep
                        }
                    }, 2000);
                } else if (this.lastPhase === '') {
                    // Starting position
                    this.speak('Ready to begin. Raise your arms slowly.', 'normal');
                }
                break;
                
            case 'raising':
                // Only announce if coming from resting, not from other phases
                if (this.lastPhase === 'resting' && timeSinceLastFeedback > 3000) {
                    // Don't speak every time, just beep
                    // this.speak('Raise arms', 'normal');
                    this.playBeep(523, 150); // C5 note
                }
                break;
                
            case 'holding':
                // Announce hold and countdown
                if (this.lastPhase === 'raising') {
                    // Just reached holding position
                    this.speak('Hold for 3 seconds', 'high');
                    this.playBeep(659, 150); // E5 note
                    this.holdCountdownStarted = true;
                    this.holdCountdown = -1; // Start at -1 so first second will be 0
                } else if (this.holdCountdownStarted && !holdComplete) {
                    // During hold - count down
                    const secondsHeld = Math.floor(holdDuration / 1000);
                    
                    // Speak countdown at 1 second and 2 seconds
                    if (secondsHeld !== this.holdCountdown) {
                        this.holdCountdown = secondsHeld;
                        
                        if (secondsHeld === 1) {
                            this.speak('2', 'high');
                            this.playBeep(523, 100); // Tick sound
                        } else if (secondsHeld === 2) {
                            this.speak('1', 'high');
                            this.playBeep(523, 100); // Tick sound
                        }
                    }
                    
                    // After 3 seconds, tell to lower
                    if (secondsHeld >= 3 && !this.lowerInstructionGiven) {
                        this.speak('Lower your arms slowly', 'high');
                        this.playBeep(392, 200); // G4 note
                        this.lowerInstructionGiven = true;
                    }
                }
                break;
                
            case 'lowering':
                // Reset hold countdown when lowering
                if (this.lastPhase === 'holding') {
                    this.holdCountdownStarted = false;
                    this.holdCountdown = -1;
                    this.lowerInstructionGiven = false;
                }
                break;
        }
        
        this.lastPhase = phase;
        this.currentPhase = phase;
    }
    
    /**
     * Announce rep completion
     */
    announceRep(repCount) {
        if (!this.enabled) return;
        
        // Beep for rep completion
        this.playBeep(880, 100, 0.3); // A5 note, short beep, lower volume
        setTimeout(() => this.playBeep(880, 100, 0.3), 150); // Double beep
        
        // Announce rep number - only specific milestones
        if (repCount === 1 || repCount === 5 || repCount === 10 || repCount === 15 || repCount === 20) {
            // Announce milestone reps only
            setTimeout(() => {
                this.speak(`${repCount}`, 'high');
            }, 300);
        }
        
        // Encouragement at milestones (with longer delays)
        if (repCount === 5) {
            setTimeout(() => {
                this.speak('Great job!', 'normal');
            }, 2000);
        } else if (repCount === 10) {
            setTimeout(() => {
                this.speak('Excellent work!', 'normal');
            }, 2000);
        } else if (repCount === 15) {
            setTimeout(() => {
                this.speak('Amazing! Keep it up!', 'normal');
            }, 2000);
        }
    }
    
    /**
     * Provide error correction feedback
     */
    announceError(errors) {
        if (!this.enabled || errors.size === 0) return;
        
        const now = Date.now();
        
        // Check cooldown - don't announce errors too frequently
        if (now - this.lastErrorTime < this.errorCooldown) {
            return;
        }
        
        // Priority order for error feedback (removed shoulder shrug messages)
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
                if (this.lastFeedback !== message || now - this.lastFeedbackTime > 8000) {
                    this.speak(message, 'high');
                    // Play warning beep
                    this.playBeep(300, 200, 0.2); // Lower frequency for warning
                    this.lastErrorTime = now;
                }
                break; // Only announce one error at a time
            }
        }
    }
    
    /**
     * Provide positive reinforcement
     */
    provideEncouragement(formScore) {
        if (!this.enabled) return;
        
        const now = Date.now();
        
        // Provide encouragement every 20 seconds if form is good (less frequent)
        if (formScore >= 90 && now - this.lastFeedbackTime > 20000) {
            const encouragements = [
                'Perfect form!',
                'Excellent technique!',
                'You\'re doing great!',
                'Keep it up!',
                'Very good!',
                'Great control!'
            ];
            
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            this.speak(randomEncouragement, 'normal');
        }
    }
    
    /**
     * Announce exercise start
     */
    announceExerciseStart(exerciseName) {
        if (!this.enabled) return;
        
        this.speak(`Starting ${exerciseName}. Stand with arms at your sides.`, 'high');
        
        setTimeout(() => {
            this.speak('Raise and lower your arms slowly. Let\'s begin!', 'normal');
        }, 3000);
    }
    
    /**
     * Announce exercise completion
     */
    announceExerciseComplete(repCount, avgFormScore) {
        if (!this.enabled) return;
        
        // Success sound
        this.playBeep(523, 150); // C5
        setTimeout(() => this.playBeep(659, 150), 150); // E5
        setTimeout(() => this.playBeep(784, 200), 300); // G5
        
        setTimeout(() => {
            const scoreComment = avgFormScore >= 90 ? 'Excellent form!' : 
                               avgFormScore >= 75 ? 'Good form!' : 
                               'Keep practicing!';
            
            this.speak(`Exercise complete! You did ${repCount} reps. ${scoreComment}`, 'high');
        }, 500);
    }
    
    /**
     * Toggle audio on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        
        if (this.enabled) {
            this.speak('Audio feedback enabled', 'high');
        }
        
        return this.enabled;
    }
    
    /**
     * Set volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * Reset for new session
     */
    reset() {
        this.lastPhase = '';
        this.lastFeedback = '';
        this.lastFeedbackTime = 0;
        this.lastErrorTime = 0;
        this.repAnnounced = false;
        this.holdCountdownStarted = false;
        this.holdCountdown = -1;
        this.lowerInstructionGiven = false;
        this.currentPhase = '';
    }
}

// Export for use in main app
window.AudioFeedback = AudioFeedback;