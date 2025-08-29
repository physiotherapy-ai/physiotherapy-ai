/**
 * Core Audio Feedback System for Physiotherapy Exercises
 * Provides generic audio functionality that can be extended by specific exercises
 * Uses Web Speech API for text-to-speech feedback
 */

class CoreAudioFeedback {
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
     * Announce rep completion (generic for all exercises)
     */
    announceRep(repCount, exerciseName = 'exercise') {
        if (!this.enabled) return;
        
        // Beep for rep completion (quiet)
        this.playBeep(880, 100, 0.2); // A5 note, short beep, quieter
        setTimeout(() => this.playBeep(880, 100, 0.2), 150); // Double beep
        
        // Announce rep number - only at 2, 5, and 10
        if (repCount === 2 || repCount === 5 || repCount === 10) {
            setTimeout(() => {
                this.speak(`${repCount}`, 'high');
            }, 300);
        }
        
        // Encouragement only at milestones (with longer delays)
        if (repCount === 5) {
            setTimeout(() => {
                this.speak('Great job!', 'normal');
            }, 2000);
        } else if (repCount === 10) {
            setTimeout(() => {
                this.speak('Exercise finished! Well done!', 'high');
                // Auto-stop exercise after 10 reps
                setTimeout(() => {
                    if (window.stopExerciseTracking) {
                        window.stopExerciseTracking();
                    }
                }, 2000);
            }, 2000);
        }
    }
    
    /**
     * Provide positive reinforcement (generic)
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
     * Announce exercise completion (generic)
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
        this.lastFeedback = '';
        this.lastFeedbackTime = 0;
        this.lastErrorTime = 0;
    }
}

// Export for use in main app
window.CoreAudioFeedback = CoreAudioFeedback;