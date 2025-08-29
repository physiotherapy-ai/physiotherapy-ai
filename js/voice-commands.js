/**
 * Voice Commands System for Physiotherapy AI Motion Tracking
 * Provides voice control for camera and exercise functionality
 */

class VoiceCommands {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.commands = {};
        this.confidenceThreshold = 0.7;
        
        // Voice status indicator elements
        this.voiceStatusDot = null;
        this.voiceStatusText = null;
        
        this.init();
    }
    
    init() {
        // Check if Web Speech API is supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.isSupported = true;
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.setupRecognition();
            this.setupCommands();
            console.log('Voice commands system initialized');
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }
    
    setupRecognition() {
        if (!this.recognition) return;
        
        // Configure recognition settings
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;
        
        // Event listeners
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceStatus('listening', 'Listening...');
            console.log('Voice recognition started');
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceStatus('stopped', 'Voice Off');
            console.log('Voice recognition ended');
        };
        
        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.updateVoiceStatus('error', 'Voice Error');
            
            // Auto-restart on some errors
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                setTimeout(() => {
                    if (this.isListening) {
                        this.startListening();
                    }
                }, 1000);
            }
        };
        
        this.recognition.onresult = (event) => {
            this.processVoiceInput(event);
        };
    }
    
    setupCommands() {
        // Define voice commands and their actions
        this.commands = {
            // Camera commands
            'start camera': () => this.executeCommand('startCamera'),
            'stop camera': () => this.executeCommand('stopCamera'),
            'camera on': () => this.executeCommand('startCamera'),
            'camera off': () => this.executeCommand('stopCamera'),
            'turn on camera': () => this.executeCommand('startCamera'),
            'turn off camera': () => this.executeCommand('stopCamera'),
            
            // Exercise commands
            'start exercise': () => this.executeCommand('startExercise'),
            'stop exercise': () => this.executeCommand('stopExercise'),
            'begin exercise': () => this.executeCommand('startExercise'),
            'end exercise': () => this.executeCommand('stopExercise'),
            'start workout': () => this.executeCommand('startExercise'),
            'stop workout': () => this.executeCommand('stopExercise')
        };
    }
    
    processVoiceInput(event) {
        const results = event.results;
        const lastResult = results[results.length - 1];
        
        if (lastResult.isFinal) {
            // Process all alternatives to find the best match
            for (let i = 0; i < lastResult.length; i++) {
                const alternative = lastResult[i];
                const transcript = alternative.transcript.toLowerCase().trim();
                const confidence = alternative.confidence;
                
                console.log(`Voice input: "${transcript}" (confidence: ${confidence})`);
                
                // Check if confidence is above threshold
                if (confidence >= this.confidenceThreshold) {
                    this.matchCommand(transcript);
                    break;
                } else if (i === lastResult.length - 1) {
                    // If no high-confidence match, try with the most likely transcript
                    this.matchCommand(transcript);
                }
            }
        }
    }
    
    matchCommand(transcript) {
        // Try exact matches first
        if (this.commands[transcript]) {
            console.log(`Executing command: ${transcript}`);
            this.commands[transcript]();
            this.showVoiceCommandFeedback(transcript);
            return;
        }
        
        // Try partial matches for flexibility
        for (const [command, action] of Object.entries(this.commands)) {
            if (transcript.includes(command) || command.includes(transcript)) {
                console.log(`Executing partial match: ${command} for "${transcript}"`);
                action();
                this.showVoiceCommandFeedback(command);
                return;
            }
        }
        
        console.log(`No command match found for: "${transcript}"`);
    }
    
    executeCommand(commandType) {
        switch (commandType) {
            case 'startCamera':
                // Trigger the existing start camera button
                const startBtn = document.getElementById('startBtn');
                if (startBtn && !startBtn.disabled && !startBtn.classList.contains('hidden')) {
                    startBtn.click();
                }
                break;
                
            case 'stopCamera':
                // Trigger the existing stop camera button
                const stopBtn = document.getElementById('stopBtn');
                if (stopBtn && !stopBtn.disabled && !stopBtn.classList.contains('hidden')) {
                    stopBtn.click();
                }
                break;
                
            case 'startExercise':
                // Trigger the existing start exercise button
                const startExerciseBtn = document.getElementById('startExerciseBtn');
                if (startExerciseBtn && !startExerciseBtn.disabled && !startExerciseBtn.classList.contains('hidden')) {
                    startExerciseBtn.click();
                }
                break;
                
            case 'stopExercise':
                // Stop exercise by clicking start exercise button again (toggle behavior)
                const exerciseBtn = document.getElementById('startExerciseBtn');
                if (exerciseBtn && exerciseBtn.textContent.includes('Stop')) {
                    exerciseBtn.click();
                }
                break;
        }
    }
    
    showVoiceCommandFeedback(command) {
        // Create a temporary feedback notification
        const feedback = document.createElement('div');
        feedback.className = 'fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
        feedback.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-microphone"></i>
                <span>Voice: "${command}"</span>
            </div>
        `;
        
        document.body.appendChild(feedback);
        
        // Remove after 3 seconds
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 3000);
    }
    
    startListening() {
        if (!this.isSupported) {
            console.warn('Voice recognition not supported');
            return false;
        }
        
        if (!this.isListening) {
            try {
                this.recognition.start();
                return true;
            } catch (error) {
                console.error('Failed to start voice recognition:', error);
                this.updateVoiceStatus('error', 'Voice Error');
                return false;
            }
        }
        return true;
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    updateVoiceStatus(status, text) {
        if (this.voiceStatusDot && this.voiceStatusText) {
            switch (status) {
                case 'listening':
                    this.voiceStatusDot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
                    break;
                case 'stopped':
                    this.voiceStatusDot.className = 'w-2 h-2 bg-gray-400 rounded-full';
                    break;
                case 'error':
                    this.voiceStatusDot.className = 'w-2 h-2 bg-red-500 rounded-full';
                    break;
            }
            this.voiceStatusText.textContent = text;
        }
    }
    
    setStatusElements(dotElement, textElement) {
        this.voiceStatusDot = dotElement;
        this.voiceStatusText = textElement;
    }
    
    isVoiceSupported() {
        return this.isSupported;
    }
    
    getListeningState() {
        return this.isListening;
    }
}

// Export for use in other scripts
window.VoiceCommands = VoiceCommands;