/**
 * Physiotherapy AI Motion Tracking - Main JavaScript
 * With Arm Raises Analysis and Audio Feedback Integration
 */

// Global variables
let camera = null;
let pose = null;
let isRunning = false;
let selectedExercise = null;
let exerciseActive = false;
let repCount = 0;
let lastFrameTime = 0;
let fps = 0;
let exerciseAnalyzer = null;
let audioFeedback = null;
let voiceCommands = null;

// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const startExerciseBtn = document.getElementById('startExerciseBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const selectedExerciseText = document.getElementById('selectedExercise');
const landmarkCount = document.getElementById('landmarkCount');
const visibilityScore = document.getElementById('visibilityScore');
const fpsCounter = document.getElementById('fpsCounter');
const loadingIndicator = document.getElementById('loadingIndicator');
const videoElement = document.getElementById('inputVideo');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
const exerciseCardsContainer = document.getElementById('exerciseCards');
const categoryFilter = document.getElementById('categoryFilter');
const exerciseOverlay = document.getElementById('exerciseOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayInstructions = document.getElementById('overlayInstructions');
const exerciseAnimation = document.getElementById('exerciseAnimation');
const animationImage = document.getElementById('animationImage');
const feedbackDisplay = document.getElementById('feedbackDisplay');
const repCountElement = document.getElementById('repCount');
const formScoreElement = document.getElementById('formScore');
const feedbackText = document.getElementById('feedbackText');
const audioToggle = document.getElementById('audioToggle');
const audioIcon = document.getElementById('audioIcon');
const voiceToggle = document.getElementById('voiceToggle');
const voiceIcon = document.getElementById('voiceIcon');
const voiceStatusDot = document.getElementById('voiceStatusDot');
const voiceStatusText = document.getElementById('voiceStatusText');
const voiceHelp = document.getElementById('voiceHelp');

// MediaPipe Pose Configuration
const poseConfig = {
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`;
    }
};

// Initialize MediaPipe Pose
function initializePose() {
    pose = new Pose(poseConfig);
    
    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    pose.onResults(onPoseResults);
}

// Process pose detection results
function onPoseResults(results) {
    // Calculate FPS
    const currentTime = performance.now();
    if (lastFrameTime > 0) {
        fps = Math.round(1000 / (currentTime - lastFrameTime));
        fpsCounter.textContent = fps;
    }
    lastFrameTime = currentTime;
    
    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw the video frame
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    // Draw landmarks and connections if detected
    if (results.poseLandmarks) {
        // Choose color based on exercise state
        const color = exerciseActive ? '#10b981' : '#FF0000';
        
        // Draw connections (skeleton)
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: color,
            lineWidth: 4
        });
        
        // Draw landmarks (joints)
        drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: color,
            lineWidth: 2,
            radius: 6,
            fillColor: '#FFFFFF'
        });
        
        // Update landmark info
        updateLandmarkInfo(results.poseLandmarks);
        
        // Process exercise if active
        if (exerciseActive && selectedExercise) {
            processExercise(results.poseLandmarks);
        }
    } else {
        landmarkCount.textContent = '0';
        visibilityScore.textContent = '0%';
        
        if (exerciseActive) {
            feedbackText.textContent = 'No body detected - please stand in view';
        }
    }
    
    canvasCtx.restore();
}

// Update landmark information display
function updateLandmarkInfo(landmarks) {
    const numLandmarks = landmarks.length;
    const visibility = landmarks.reduce((sum, landmark) => sum + (landmark.visibility || 0), 0) / numLandmarks;
    const visibilityPercent = (visibility * 100).toFixed(1);
    
    landmarkCount.textContent = numLandmarks;
    visibilityScore.textContent = `${visibilityPercent}%`;
}

// Process exercise movements
function processExercise(landmarks) {
    if (selectedExercise.id === 'lateral-arm-raises' && exerciseAnalyzer) {
        // Analyze arm raises movement
        const analysis = exerciseAnalyzer.analyze(landmarks);
        
        if (analysis) {
            // Check for rep completion
            if (analysis.repCount > repCount) {
                // New rep completed
                if (audioFeedback) {
                    audioFeedback.announceRep(analysis.repCount);
                }
            }
            
            // Update rep count
            repCountElement.textContent = analysis.repCount;
            repCount = analysis.repCount;
            
            // Update form score with color coding
            formScoreElement.textContent = `${analysis.formScore}%`;
            formScoreElement.className = 'text-2xl font-bold';
            
            if (analysis.formScore >= 90) {
                formScoreElement.classList.add('form-excellent');
            } else if (analysis.formScore >= 75) {
                formScoreElement.classList.add('form-good');
            } else if (analysis.formScore >= 60) {
                formScoreElement.classList.add('form-fair');
            } else {
                formScoreElement.classList.add('form-poor');
            }
            
            // Update feedback text
            feedbackText.textContent = analysis.feedback;
            
            // Audio feedback for phases and errors
            if (audioFeedback) {
                // Announce phase changes with hold duration
                audioFeedback.announcePhase(
                    analysis.phase, 
                    analysis.angles, 
                    analysis.holdDuration || 0,
                    analysis.holdComplete || false
                );
                
                // Announce errors if any
                if (analysis.errors.length > 0) {
                    audioFeedback.announceError(new Set(analysis.errors));
                } else if (analysis.phase === 'holding') {
                    // Provide encouragement when form is good
                    audioFeedback.provideEncouragement(analysis.formScore);
                }
            }
            
            // Visual feedback overlay based on errors
            if (analysis.errors.length === 0) {
                // Green overlay for good form
                drawFormOverlay('good');
            } else if (analysis.errors.length <= 2) {
                // Yellow overlay for minor issues
                drawFormOverlay('warning');
            } else {
                // Red overlay for major issues
                drawFormOverlay('error');
            }
            
            // Update phase indicator in overlay
            const phaseText = {
                'resting': 'Arms Down - Ready',
                'raising': 'Raising Arms',
                'holding': 'Hold at Shoulder Height',
                'lowering': 'Lowering Arms'
            };
            
            if (analysis.phase !== 'resting') {
                overlayInstructions.textContent = phaseText[analysis.phase] || analysis.phase;
            }
            
            // Show current arm angles for user feedback
            if (analysis.phase === 'raising' || analysis.phase === 'holding') {
                const angleDisplay = `L: ${analysis.angles.leftArm.toFixed(0)}° | R: ${analysis.angles.rightArm.toFixed(0)}°`;
                
                // Show hold timer if in holding phase
                if (analysis.phase === 'holding' && analysis.holdDuration) {
                    const secondsHeld = Math.floor(analysis.holdDuration / 1000);
                    const holdText = analysis.holdComplete ? 'Hold complete - Lower now!' : `Holding: ${secondsHeld}/3 sec`;
                    overlayInstructions.textContent = `${holdText} - ${angleDisplay}`;
                } else {
                    overlayInstructions.textContent = `${phaseText[analysis.phase]} - ${angleDisplay}`;
                }
            }
        }
    }
}

// Draw visual feedback overlay
function drawFormOverlay(quality) {
    canvasCtx.save();
    
    // Set overlay color based on form quality
    let overlayColor;
    switch(quality) {
        case 'good':
            overlayColor = 'rgba(16, 185, 129, 0.2)'; // Green
            break;
        case 'warning':
            overlayColor = 'rgba(251, 191, 36, 0.2)'; // Yellow
            break;
        case 'error':
            overlayColor = 'rgba(239, 68, 68, 0.2)'; // Red
            break;
        default:
            overlayColor = 'rgba(0, 0, 0, 0)';
    }
    
    // Draw semi-transparent overlay
    canvasCtx.fillStyle = overlayColor;
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    
    canvasCtx.restore();
}

// Render exercise cards
function renderExerciseCards(filterCategory = 'all') {
    exerciseCardsContainer.innerHTML = '';
    
    const filteredExercises = filterCategory === 'all' 
        ? window.EXERCISES 
        : window.EXERCISES.filter(ex => ex.category === filterCategory);
    
    filteredExercises.forEach(exercise => {
        const card = document.createElement('div');
        card.className = 'exercise-card bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-transparent';
        card.dataset.exerciseId = exercise.id;
        
        card.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-2xl text-blue-500">
                    <i class="${exercise.icon}"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800">${exercise.name}</h3>
                    <p class="text-xs text-gray-600 mt-1">${exercise.description}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="difficulty-badge difficulty-${exercise.difficulty}">
                            ${exercise.difficulty}
                        </span>
                        <span class="text-xs text-gray-500">
                            ${exercise.duration}
                        </span>
                    </div>
                    <div class="mt-2">
                        <span class="text-xs text-gray-500">Targets: </span>
                        <span class="text-xs text-gray-700">${exercise.targetMuscles.join(', ')}</span>
                    </div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => selectExercise(exercise, card));
        exerciseCardsContainer.appendChild(card);
    });
}

// Select an exercise
function selectExercise(exercise, cardElement) {
    // Remove previous selection
    document.querySelectorAll('.exercise-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Mark new selection
    cardElement.classList.add('selected');
    selectedExercise = exercise;
    
    // Update UI
    selectedExerciseText.textContent = `Selected: ${exercise.name}`;
    
    // Enable start exercise button if camera is running
    if (isRunning) {
        startExerciseBtn.disabled = false;
        startExerciseBtn.classList.remove('hidden');
    }
    
    console.log('Selected exercise:', exercise.name);
}

// Start exercise tracking
function startExerciseTracking() {
    if (!selectedExercise) return;
    
    exerciseActive = true;
    repCount = 0;
    
    // Initialize appropriate analyzer
    if (selectedExercise.id === 'lateral-arm-raises') {
        if (!exerciseAnalyzer) {
            exerciseAnalyzer = new window.ArmRaisesAnalyzer();
        } else {
            exerciseAnalyzer.reset();
        }
    }
    
    // Initialize audio feedback if not already done
    if (!audioFeedback) {
        audioFeedback = new window.AudioFeedback();
    } else {
        audioFeedback.reset();
    }
    
    // Announce exercise start
    audioFeedback.announceExerciseStart(selectedExercise.name);
    
    // Update UI
    startExerciseBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Exercise';
    startExerciseBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
    startExerciseBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
    
    // Show exercise overlay
    overlayTitle.textContent = selectedExercise.name;
    overlayInstructions.textContent = selectedExercise.instructions[0];
    
    // Show exercise demonstration animation if available
    if (selectedExercise.demoAnimation) {
        animationImage.src = selectedExercise.demoAnimation;
        animationImage.alt = `${selectedExercise.name} demonstration`;
        exerciseAnimation.classList.remove('hidden');
    } else {
        exerciseAnimation.classList.add('hidden');
    }
    
    exerciseOverlay.classList.remove('hidden');
    
    // Show feedback display
    feedbackDisplay.classList.remove('hidden');
    repCountElement.textContent = '0';
    formScoreElement.textContent = '100%';
    formScoreElement.className = 'text-2xl font-bold form-excellent';
    feedbackText.textContent = 'Stand upright with arms at your sides';
    
    console.log('Exercise tracking started:', selectedExercise.name);
}

// Stop exercise tracking
function stopExerciseTracking() {
    exerciseActive = false;
    
    const finalFormScore = exerciseAnalyzer ? exerciseAnalyzer.formScore : 0;
    
    // Announce completion with audio
    if (audioFeedback && repCount > 0) {
        audioFeedback.announceExerciseComplete(repCount, finalFormScore);
    }
    
    // Show summary if reps were completed
    if (repCount > 0) {
        setTimeout(() => {
            alert(`Great workout! You completed ${repCount} reps with an average form score of ${finalFormScore}%`);
        }, 2000); // Delay to let audio finish
    }
    
    // Update UI
    startExerciseBtn.innerHTML = '<i class="fas fa-dumbbell"></i> Start Exercise';
    startExerciseBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
    startExerciseBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    
    // Hide overlays
    exerciseOverlay.classList.add('hidden');
    feedbackDisplay.classList.add('hidden');
    
    console.log('Exercise tracking stopped. Total reps:', repCount);
}

// Make function globally accessible for audio feedback
window.stopExerciseTracking = stopExerciseTracking;

// Start camera and pose detection
async function startCamera() {
    try {
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        statusText.textContent = 'Initializing...';
        
        // Disable start button
        startBtn.disabled = true;
        
        // Initialize pose if not already done
        if (!pose) {
            initializePose();
        }
        
        // Set canvas size based on video container
        const container = document.querySelector('.video-container');
        const containerRect = container.getBoundingClientRect();
        canvasElement.width = containerRect.width;
        canvasElement.height = containerRect.height;
        
        // Initialize camera
        camera = new Camera(videoElement, {
            onFrame: async () => {
                if (pose && isRunning) {
                    await pose.send({ image: videoElement });
                }
            },
            width: 1280,
            height: 960,
            facingMode: 'user' // Use front camera by default
        });
        
        await camera.start();
        
        isRunning = true;
        
        // Update UI
        loadingIndicator.classList.add('hidden');
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        
        // Update status indicator
        statusDot.classList.remove('inactive');
        statusDot.classList.add('active');
        statusText.textContent = 'Camera Active';
        
        // Enable exercise button if exercise is selected
        if (selectedExercise) {
            startExerciseBtn.disabled = false;
            startExerciseBtn.classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Error starting camera:', error);
        loadingIndicator.classList.add('hidden');
        startBtn.disabled = false;
        statusText.textContent = 'Camera Error';
        alert(`Error: ${error.message || 'Failed to start camera'}`);
    }
}

// Stop camera and pose detection
function stopCamera() {
    if (camera) {
        camera.stop();
        camera = null;
    }
    
    isRunning = false;
    
    // Stop exercise if active
    if (exerciseActive) {
        stopExerciseTracking();
    }
    
    // Clear canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Update UI
    startBtn.classList.remove('hidden');
    startBtn.disabled = false;
    stopBtn.classList.add('hidden');
    startExerciseBtn.classList.add('hidden');
    
    // Update status indicator
    statusDot.classList.remove('active');
    statusDot.classList.add('inactive');
    statusText.textContent = 'Camera Off';
    
    // Reset info displays
    landmarkCount.textContent = '--';
    visibilityScore.textContent = '--';
    fpsCounter.textContent = '--';
}

// Event Listeners
startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
startExerciseBtn.addEventListener('click', () => {
    if (exerciseActive) {
        stopExerciseTracking();
    } else {
        startExerciseTracking();
    }
});

categoryFilter.addEventListener('change', (e) => {
    renderExerciseCards(e.target.value);
});

// Audio toggle button
audioToggle.addEventListener('click', () => {
    if (!audioFeedback) {
        audioFeedback = new window.AudioFeedback();
    }
    
    const isEnabled = audioFeedback.toggle();
    
    // Update icon
    if (isEnabled) {
        audioIcon.className = 'fas fa-volume-up text-gray-700';
        audioToggle.title = 'Mute Audio';
    } else {
        audioIcon.className = 'fas fa-volume-mute text-gray-400';
        audioToggle.title = 'Unmute Audio';
    }
});

// Voice toggle button
voiceToggle.addEventListener('click', () => {
    if (!voiceCommands) {
        console.log('Voice commands not available');
        return;
    }
    
    if (!voiceCommands.isVoiceSupported()) {
        alert('Voice commands are not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
    }
    
    const wasListening = voiceCommands.getListeningState();
    voiceCommands.toggleListening();
    
    // Update icon - the voice command system will update status via callback
    setTimeout(() => {
        const isListening = voiceCommands.getListeningState();
        if (isListening) {
            voiceIcon.className = 'fas fa-microphone text-green-600';
            voiceToggle.title = 'Turn Off Voice Commands';
            voiceHelp.classList.remove('hidden');
        } else {
            voiceIcon.className = 'fas fa-microphone-slash text-gray-400';
            voiceToggle.title = 'Turn On Voice Commands';
            voiceHelp.classList.add('hidden');
        }
    }, 100);
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (camera) {
        camera.stop();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check for camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusText.textContent = 'No Camera Support';
        startBtn.disabled = true;
        alert('Error: Your browser does not support camera access');
    }
    
    // Load exercise cards
    renderExerciseCards();
    
    // Set initial canvas size
    const resizeCanvas = () => {
        const container = document.querySelector('.video-container');
        if (container) {
            const rect = container.getBoundingClientRect();
            canvasElement.width = rect.width;
            canvasElement.height = rect.height;
        }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize voice commands
    if (window.VoiceCommands) {
        voiceCommands = new window.VoiceCommands();
        voiceCommands.setStatusElements(voiceStatusDot, voiceStatusText);
        
        if (!voiceCommands.isVoiceSupported()) {
            voiceToggle.disabled = true;
            voiceToggle.title = 'Voice commands not supported in this browser';
            voiceIcon.className = 'fas fa-microphone-slash text-gray-400';
            voiceStatusText.textContent = 'Not Supported';
        }
    }
    
    console.log('Physiotherapy AI Motion Tracking initialized');
    console.log('MediaPipe Pose ready for use');
    console.log(`Loaded ${window.EXERCISES ? window.EXERCISES.length : 0} exercises`);
});