/**
 * Physiotherapy AI Motion Tracking - Main JavaScript (Modular Architecture)
 * Uses modular exercise system for better organization and scalability
 */

// Global variables
let camera = null;
let pose = null;
let isRunning = false;
let selectedExercise = null;
let currentExerciseModule = null;
let exerciseActive = false;
let repCount = 0;
let lastFrameTime = 0;
let fps = 0;
let coreAudioFeedback = null;
let voiceCommands = null;
let frameSkipCounter = 0;
const FRAME_SKIP_RATE = 2; // Process every 2nd frame for better performance

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

// Initialize modular exercise system
function initializeExerciseSystem() {
    // Initialize core audio feedback
    coreAudioFeedback = new window.CoreAudioFeedback();
    
    // Register arm raises exercise
    const armRaisesExercise = new window.ArmRaisesExercise();
    window.exerciseRegistry.register(armRaisesExercise);
    
    // Initialize all exercises with core audio
    window.exerciseRegistry.initializeAll(coreAudioFeedback);
    
    // Initialize voice commands
    voiceCommands = new window.VoiceCommands((command, params) => {
        handleVoiceCommand(command, params);
    }, (status) => {
        // Update voice status display
        if (status === 'listening') {
            voiceStatusDot.className = 'voice-status-dot voice-listening';
            voiceStatusText.textContent = 'Listening...';
        } else if (status === 'processing') {
            voiceStatusDot.className = 'voice-status-dot voice-processing';
            voiceStatusText.textContent = 'Processing...';
        } else {
            voiceStatusDot.className = 'voice-status-dot';
            voiceStatusText.textContent = 'Voice Off';
        }
    });
}

// Handle voice commands
function handleVoiceCommand(command, params) {
    console.log('Voice command received:', command, params);
    
    switch(command) {
        case 'start_camera':
            if (!isRunning) {
                startCamera();
            }
            break;
        case 'stop_camera':
            if (isRunning) {
                stopCamera();
            }
            break;
        case 'start_exercise':
            if (isRunning && selectedExercise && !exerciseActive) {
                startExerciseTracking();
            }
            break;
        case 'stop_exercise':
            if (exerciseActive) {
                stopExerciseTracking();
            }
            break;
        case 'select_exercise':
            if (params.exerciseName) {
                const exerciseMap = {
                    'arm raises': 'arm-raises',
                    'lateral arm raises': 'arm-raises',
                    'arm raise': 'arm-raises'
                };
                const exerciseId = exerciseMap[params.exerciseName.toLowerCase()];
                if (exerciseId) {
                    selectExerciseById(exerciseId);
                }
            }
            break;
        case 'mute_audio':
            if (coreAudioFeedback) {
                coreAudioFeedback.enabled = false;
                updateAudioToggleUI(false);
            }
            break;
        case 'unmute_audio':
            if (coreAudioFeedback) {
                coreAudioFeedback.enabled = true;
                updateAudioToggleUI(true);
            }
            break;
    }
}

// Update audio toggle UI
function updateAudioToggleUI(isEnabled) {
    if (isEnabled) {
        audioIcon.className = 'fas fa-volume-up text-gray-700';
        audioToggle.title = 'Mute Audio';
    } else {
        audioIcon.className = 'fas fa-volume-mute text-gray-400';
        audioToggle.title = 'Unmute Audio';
    }
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
        if (exerciseActive && currentExerciseModule) {
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

// Process exercise movements using modular system
function processExercise(landmarks) {
    if (!currentExerciseModule) return;
    
    try {
        // Analyze pose using the exercise module
        const analysis = currentExerciseModule.analyzePose(landmarks);
        
        if (analysis) {
        // Check for rep completion
        if (analysis.repCount > repCount) {
            // New rep completed
            currentExerciseModule.handleRepComplete(analysis.repCount);
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
        
        // Update feedback text based on state
        // Use generic state messages or exercise-specific feedback
        const genericStateMessages = {
            'idle': 'Ready to begin',
            'resting': 'Ready to begin',
            'raising': 'Moving up',
            'raised': 'Hold position',
            'holding': 'Hold position',
            'bridge_hold': 'Hold position',
            'lowering': 'Lowering down',
            'not_visible': 'Adjust position'
        };
        
        // Check if exercise provides real-time feedback
        if (currentExerciseModule.getRealtimeFeedback) {
            const realtimeFeedback = currentExerciseModule.getRealtimeFeedback(analysis);
            if (realtimeFeedback && realtimeFeedback.primary) {
                feedbackText.textContent = realtimeFeedback.primary;
            } else {
                feedbackText.textContent = genericStateMessages[analysis.state] || analysis.state;
            }
        } else {
            feedbackText.textContent = genericStateMessages[analysis.state] || analysis.state;
        }
        
        // Handle audio feedback through the module
        currentExerciseModule.handleAudioFeedback(analysis);
        
        // Visual feedback overlay based on errors
        if (analysis.formErrors.length === 0) {
            drawFormOverlay('good');
        } else if (analysis.formErrors.length <= 2) {
            drawFormOverlay('warning');
        } else {
            drawFormOverlay('error');
        }
        
        // Update phase indicator in overlay
        updateOverlayInstructions(analysis);
        }
    } catch (error) {
        console.error('Error processing exercise:', error);
        feedbackText.textContent = 'Error processing movement';
    }
}

// Update overlay instructions based on analysis
function updateOverlayInstructions(analysis) {
    // Check if exercise provides real-time feedback
    if (currentExerciseModule && currentExerciseModule.getRealtimeFeedback) {
        const feedback = currentExerciseModule.getRealtimeFeedback(analysis);
        if (feedback) {
            overlayInstructions.textContent = feedback.secondary || feedback.primary || analysis.state;
            return;
        }
    }
    
    // Generic phase messages
    const genericPhaseText = {
        'idle': 'Ready Position',
        'resting': 'Ready to Begin',
        'raising': 'Moving Up',
        'raised': 'Hold Position', 
        'holding': 'Hold Position',
        'bridge_hold': 'Hold Bridge',
        'lowering': 'Lowering Down',
        'not_visible': 'Adjust Position'
    };
    
    // For arm raises specific (backward compatibility)
    if (selectedExercise && (selectedExercise.id === 'lateral-arm-raises' || selectedExercise.id === 'arm-raises')) {
        const armRaisesPhaseText = {
            'resting': 'Arms Down - Ready',
            'raising': 'Raising Arms',
            'holding': 'Hold at Shoulder Height',
            'lowering': 'Lowering Arms'
        };
        
        if (analysis.state !== 'resting') {
            overlayInstructions.textContent = armRaisesPhaseText[analysis.state] || analysis.state;
        }
        
        // Show current arm angles for user feedback
        if ((analysis.state === 'raising' || analysis.state === 'holding') && analysis.angles && analysis.angles.leftShoulder) {
            const angleDisplay = `L: ${analysis.angles.leftShoulder.toFixed(0)}° | R: ${analysis.angles.rightShoulder.toFixed(0)}°`;
            
            // Show hold timer if in holding phase
            if (analysis.state === 'holding' && analysis.holdProgress) {
                const progress = Math.floor(analysis.holdProgress);
                const holdText = progress >= 100 ? 'Hold complete - Lower now!' : `Holding: ${Math.floor(progress / 33)}/3 sec`;
                overlayInstructions.textContent = `${holdText} - ${angleDisplay}`;
            } else {
                overlayInstructions.textContent = `${armRaisesPhaseText[analysis.state]} - ${angleDisplay}`;
            }
        }
    } else {
        // Generic handling for other exercises
        overlayInstructions.textContent = genericPhaseText[analysis.state] || analysis.state;
        
        // Add angle display if available
        if (analysis.angles) {
            const angleKeys = Object.keys(analysis.angles);
            if (angleKeys.length > 0) {
                const angleDisplay = angleKeys.slice(0, 2).map(key => 
                    `${key}: ${analysis.angles[key]}°`
                ).join(' | ');
                overlayInstructions.textContent += ` - ${angleDisplay}`;
            }
        }
        
        // Add hold time if available
        if (analysis.holdTime && analysis.holdTime > 0) {
            const seconds = Math.round(analysis.holdTime / 1000);
            overlayInstructions.textContent += ` (${seconds}s)`;
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
        
        // Check if this exercise has a module registered
        const hasModule = window.exerciseRegistry.getExercise(exercise.id) !== undefined;
        
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
                        ${hasModule ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Available</span>' : ''}
                    </div>
                    <div class="mt-2">
                        <span class="text-xs text-gray-500">Targets: </span>
                        <span class="text-xs text-gray-700">${exercise.targetMuscles.join(', ')}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add click event
        card.addEventListener('click', () => selectExercise(exercise));
        
        exerciseCardsContainer.appendChild(card);
    });
}

// Select exercise
function selectExercise(exercise) {
    // Stop current exercise if active
    if (exerciseActive) {
        stopExerciseTracking();
    }
    
    selectedExercise = exercise;
    
    // Check if exercise module exists
    currentExerciseModule = window.exerciseRegistry.getExercise(exercise.id);
    
    if (!currentExerciseModule) {
        // For now, check for arm-raises mapping
        if (exercise.id === 'lateral-arm-raises' || exercise.id === 'arm-raises') {
            // Map lateral-arm-raises to arm-raises module
            currentExerciseModule = window.exerciseRegistry.getExercise('arm-raises');
        } else {
            console.log(`No module found for exercise: ${exercise.id}`);
            alert('This exercise is not yet implemented in the modular system.');
            return;
        }
    }
    
    // Reset the module for the new exercise
    if (currentExerciseModule && currentExerciseModule.reset) {
        currentExerciseModule.reset();
    }
    
    // Update UI
    selectedExerciseText.textContent = exercise.name;
    
    // Highlight selected card
    document.querySelectorAll('.exercise-card').forEach(card => {
        if (card.dataset.exerciseId === exercise.id) {
            card.classList.add('border-blue-500', 'bg-blue-50');
        } else {
            card.classList.remove('border-blue-500', 'bg-blue-50');
        }
    });
    
    // Enable start button if camera is running
    if (isRunning) {
        startExerciseBtn.disabled = false;
        startExerciseBtn.classList.remove('hidden');
    }
}

// Select exercise by ID (for voice commands)
function selectExerciseById(exerciseId) {
    const exercise = window.EXERCISES.find(ex => ex.id === exerciseId);
    if (exercise) {
        selectExercise(exercise);
    }
}

// Start exercise tracking
function startExerciseTracking() {
    if (!selectedExercise || !currentExerciseModule) return;
    
    exerciseActive = true;
    repCount = 0;
    
    // Start the exercise module
    currentExerciseModule.start();
    
    // Show exercise overlay
    exerciseOverlay.classList.remove('hidden');
    overlayTitle.textContent = selectedExercise.name;
    overlayInstructions.textContent = 'Get ready to begin...';
    
    // Show animation if available
    if (selectedExercise.demoAnimation) {
        animationImage.src = selectedExercise.demoAnimation;
        exerciseAnimation.classList.remove('hidden');
    } else {
        exerciseAnimation.classList.add('hidden');
    }
    
    // Show feedback display
    feedbackDisplay.classList.remove('hidden');
    repCountElement.textContent = '0';
    formScoreElement.textContent = '100%';
    feedbackText.textContent = 'Starting exercise...';
    
    // Update UI
    startExerciseBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Exercise';
    startExerciseBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
    startExerciseBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
    
    console.log('Exercise tracking started:', selectedExercise.name);
}

// Stop exercise tracking
function stopExerciseTracking() {
    exerciseActive = false;
    
    // Stop the exercise module and get final progress
    let finalProgress = null;
    if (currentExerciseModule) {
        finalProgress = currentExerciseModule.stop();
    }
    
    // Update UI
    startExerciseBtn.innerHTML = '<i class="fas fa-dumbbell"></i> Start Exercise';
    startExerciseBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
    startExerciseBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    
    // Hide overlays
    exerciseOverlay.classList.add('hidden');
    feedbackDisplay.classList.add('hidden');
    
    console.log('Exercise tracking stopped. Final progress:', finalProgress);
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
        
        // Initialize camera with optimized settings
        camera = new Camera(videoElement, {
            onFrame: async () => {
                if (pose && isRunning) {
                    // Skip frames for better performance
                    frameSkipCounter++;
                    if (frameSkipCounter % FRAME_SKIP_RATE === 0) {
                        await pose.send({ image: videoElement });
                    }
                }
            },
            width: 1280,
            height: 720,  // Reduced height for better performance
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
    if (!coreAudioFeedback) {
        coreAudioFeedback = new window.CoreAudioFeedback();
    }
    
    const isEnabled = coreAudioFeedback.toggle();
    updateAudioToggleUI(isEnabled);
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
    
    // Initialize exercise system
    initializeExerciseSystem();
    
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
    
    // Initial resize
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    console.log('Physiotherapy AI Motion Tracking initialized - Modular Architecture');
});