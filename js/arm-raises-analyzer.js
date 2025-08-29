/**
 * Arm Raises Movement Analyzer
 * Simplified and accurate detection for lateral arm raises
 * Commonly used physiotherapy exercise for shoulder rehabilitation
 */

// MediaPipe Pose Landmark Indices
const POSE_LANDMARKS = {
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24
};

class ArmRaisesAnalyzer {
    constructor() {
        // Movement state tracking
        this.currentPhase = 'resting'; // 'resting', 'raising', 'holding', 'lowering'
        this.previousPhase = 'resting';
        this.repCount = 0;
        
        // Rep tracking
        this.currentRep = {
            startTime: 0,
            raiseTime: 0,
            lowerTime: 0,
            peakAngle: 0,
            holdStartTime: 0,
            holdDuration: 0,
            holdComplete: false,
            errors: []
        };
        
        // Position tracking for smooth detection
        this.leftArmHistory = [];
        this.rightArmHistory = [];
        this.historySize = 5;
        
        // Error tracking
        this.currentErrors = new Set();
        this.formScore = 100;
        
        // Calibration
        this.calibrated = false;
        this.restingLeftShoulderY = 0;
        this.restingRightShoulderY = 0;
    }
    
    /**
     * Main analysis function - processes each frame
     */
    analyze(landmarks) {
        if (!landmarks || landmarks.length < 33) return null;
        
        // Calculate arm angles
        const angles = this.calculateArmAngles(landmarks);
        
        // Detect movement phase (pass landmarks for calibration)
        const phase = this.detectMovementPhase(angles, landmarks);
        
        // Check for form errors
        const errors = this.detectErrors(landmarks, angles, phase);
        
        // Update rep count
        this.updateRepCount(phase, angles);
        
        // Calculate form score
        const formScore = this.calculateFormScore(errors);
        
        return {
            phase: phase,
            angles: angles,
            errors: Array.from(errors),
            repCount: this.repCount,
            formScore: formScore,
            feedback: this.generateFeedback(errors, phase, angles),
            holdDuration: this.currentRep.holdDuration,
            holdComplete: this.currentRep.holdComplete
        };
    }
    
    /**
     * Calculate arm angles relative to body
     */
    calculateArmAngles(landmarks) {
        const angles = {};
        
        // Left arm angle (shoulder to elbow/wrist line vs vertical)
        const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
        const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
        const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
        const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
        
        // Calculate angle of arm from body (0° = down, 90° = horizontal)
        angles.leftArm = this.calculateArmAngleFromBody(leftShoulder, leftElbow, leftWrist, leftHip);
        
        // Right arm angle
        const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
        const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
        const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
        const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
        
        angles.rightArm = this.calculateArmAngleFromBody(rightShoulder, rightElbow, rightWrist, rightHip);
        
        // Average angle for phase detection
        angles.averageArm = (angles.leftArm + angles.rightArm) / 2;
        
        // Elbow flexion (to check if arms are straight)
        angles.leftElbow = this.calculateElbowAngle(leftShoulder, leftElbow, leftWrist);
        angles.rightElbow = this.calculateElbowAngle(rightShoulder, rightElbow, rightWrist);
        
        // Symmetry difference
        angles.symmetryDiff = Math.abs(angles.leftArm - angles.rightArm);
        
        return angles;
    }
    
    /**
     * Calculate arm angle from body (fixed calculation)
     */
    calculateArmAngleFromBody(shoulder, elbow, wrist, hip) {
        // Use wrist position for more accurate tracking
        // Calculate angle between vertical line and arm
        
        // Vector from shoulder to wrist
        const deltaX = Math.abs(wrist.x - shoulder.x);
        const deltaY = Math.abs(wrist.y - shoulder.y);
        
        // Calculate angle from vertical
        // When arm is down: wrist.y > shoulder.y, angle should be ~0
        // When arm is horizontal: wrist.y ≈ shoulder.y, angle should be ~90
        // When arm is up: wrist.y < shoulder.y, angle should be ~180
        
        let angle;
        if (wrist.y > shoulder.y) {
            // Arm is below shoulder (down position)
            angle = Math.atan2(deltaX, deltaY) * 180 / Math.PI;
        } else {
            // Arm is at or above shoulder level
            angle = 90 + Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        }
        
        // Ensure angle is in correct range (0-180)
        angle = Math.max(0, Math.min(180, angle));
        
        return angle;
    }
    
    /**
     * Calculate elbow angle to check if arm is straight
     */
    calculateElbowAngle(shoulder, elbow, wrist) {
        const radians = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) - 
                       Math.atan2(shoulder.y - elbow.y, shoulder.x - elbow.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) {
            angle = 360 - angle;
        }
        return angle;
    }
    
    /**
     * Detect current movement phase based on arm angles
     */
    detectMovementPhase(angles, landmarks = null) {
        // Add current angles to history
        this.leftArmHistory.push(angles.leftArm);
        this.rightArmHistory.push(angles.rightArm);
        
        if (this.leftArmHistory.length > this.historySize) {
            this.leftArmHistory.shift();
            this.rightArmHistory.shift();
        }
        
        // Calculate average angles for smoothing
        const avgLeft = this.leftArmHistory.reduce((a, b) => a + b, 0) / this.leftArmHistory.length;
        const avgRight = this.rightArmHistory.reduce((a, b) => a + b, 0) / this.rightArmHistory.length;
        const avgAngle = (avgLeft + avgRight) / 2;
        
        // Determine phase based on angle thresholds
        let phase = this.currentPhase;
        
        if (avgAngle < 30) {
            // Arms at rest position (arms down by sides)
            phase = 'resting';
            
            // Calibrate resting position
            if (!this.calibrated && landmarks) {
                const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
                const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
                this.restingLeftShoulderY = leftShoulder.y;
                this.restingRightShoulderY = rightShoulder.y;
                this.calibrated = true;
            }
        } else if (avgAngle >= 80 && avgAngle <= 100) {
            // Arms at target position (tighter range for 90 degrees)
            phase = 'holding';
            
            // Track peak angle for this rep
            if (avgAngle > this.currentRep.peakAngle) {
                this.currentRep.peakAngle = avgAngle;
            }
            
            // Track hold duration
            if (this.previousPhase === 'raising' || this.previousPhase === 'holding') {
                if (this.currentRep.holdStartTime === 0) {
                    this.currentRep.holdStartTime = Date.now();
                }
                this.currentRep.holdDuration = Date.now() - this.currentRep.holdStartTime;
                
                // Mark hold as complete after 3 seconds
                if (this.currentRep.holdDuration >= 3000) {
                    this.currentRep.holdComplete = true;
                }
            }
        } else if (avgAngle > 30 && avgAngle < 80) {
            // Determine if raising or lowering based on previous phase
            if (this.currentPhase === 'resting') {
                phase = 'raising';
                // Start new rep timing
                if (this.previousPhase === 'resting') {
                    this.currentRep.startTime = Date.now();
                }
            } else if (this.currentPhase === 'holding') {
                phase = 'lowering';
                // Record raise time
                if (this.previousPhase === 'holding') {
                    this.currentRep.raiseTime = Date.now() - this.currentRep.startTime;
                }
            } else {
                // Keep current phase during transition
                phase = this.currentPhase;
            }
        }
        
        this.previousPhase = this.currentPhase;
        this.currentPhase = phase;
        
        return phase;
    }
    
    /**
     * Detect form errors specific to arm raises
     */
    detectErrors(landmarks, angles, phase) {
        const errors = new Set();
        
        // 1. Shoulder shrugging (DISABLED - too many false positives)
        // When arms raise, shoulders naturally move slightly
        // This check causes more confusion than help
        /*
        const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
        const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
        
        if (phase === 'raising' || phase === 'holding') {
            // Check if shoulders are elevated (comparing Y position to resting)
            if (this.calibrated) {
                // Shoulders shouldn't rise more than 5% of screen height
                const shoulderElevationThreshold = 0.05;
                if (leftShoulder.y < this.restingLeftShoulderY - shoulderElevationThreshold) {
                    errors.add('shoulder_shrug_left');
                }
                if (rightShoulder.y < this.restingRightShoulderY - shoulderElevationThreshold) {
                    errors.add('shoulder_shrug_right');
                }
            }
        }
        */
        
        // 2. Arms going too high (above shoulder level)
        // Only flag as error if significantly above shoulder level
        if (angles.leftArm > 110) {
            errors.add('arm_too_high_left');
        }
        if (angles.rightArm > 110) {
            errors.add('arm_too_high_right');
        }
        
        // 3. Arms not symmetric (one higher than other)
        if (angles.symmetryDiff > 15 && (phase === 'raising' || phase === 'holding')) {
            errors.add('asymmetric_movement');
        }
        
        // 4. Elbows bent too much (arms should be relatively straight)
        // Relaxed threshold - some bend is natural
        if (angles.leftElbow < 140) {
            errors.add('elbow_bent_left');
        }
        if (angles.rightElbow < 140) {
            errors.add('elbow_bent_right');
        }
        
        // 5. Movement too fast (checked during phase transitions)
        if (phase === 'holding' && this.previousPhase === 'raising') {
            if (this.currentRep.raiseTime > 0 && this.currentRep.raiseTime < 1500) {
                errors.add('too_fast_raising');
            }
        }
        
        // 6. Not reaching target height (only check during lowering phase)
        if (phase === 'lowering' && this.currentRep.peakAngle < 70) {
            errors.add('insufficient_height');
        }
        
        this.currentErrors = errors;
        return errors;
    }
    
    /**
     * Update rep count based on completed movement
     */
    updateRepCount(phase, angles) {
        // Count rep when returning to rest position after a complete movement
        if (phase === 'resting' && this.previousPhase === 'lowering') {
            // Validate it was a complete rep (reached at least 70 degrees)
            if (this.currentRep.peakAngle >= 70) {
                this.repCount++;
                console.log(`Rep ${this.repCount} completed! Peak angle: ${this.currentRep.peakAngle.toFixed(1)}°`);
            }
            
            // Reset current rep tracking
            this.currentRep = {
                startTime: 0,
                raiseTime: 0,
                lowerTime: 0,
                peakAngle: 0,
                holdStartTime: 0,
                holdDuration: 0,
                holdComplete: false,
                errors: []
            };
        }
    }
    
    /**
     * Calculate form score based on errors
     */
    calculateFormScore(errors) {
        let score = 100;
        const errorPenalties = {
            'shoulder_shrug_left': 10,
            'shoulder_shrug_right': 10,
            'arm_too_high_left': 15,
            'arm_too_high_right': 15,
            'asymmetric_movement': 20,
            'elbow_bent_left': 10,
            'elbow_bent_right': 10,
            'too_fast_raising': 15,
            'insufficient_height': 25
        };
        
        errors.forEach(error => {
            score -= errorPenalties[error] || 10;
        });
        
        this.formScore = Math.max(0, score);
        return this.formScore;
    }
    
    /**
     * Generate helpful feedback messages
     */
    generateFeedback(errors, phase, angles) {
        // Phase-specific encouragement when form is good
        if (errors.size === 0) {
            const phaseMessages = {
                'resting': 'Ready - Arms at sides',
                'raising': `Good form - Keep going! (${angles.averageArm.toFixed(0)}°)`,
                'holding': `Perfect! Hold briefly (${angles.averageArm.toFixed(0)}°)`,
                'lowering': 'Great control - Lower slowly'
            };
            return phaseMessages[phase] || 'Excellent form!';
        }
        
        // Priority feedback for errors
        if (errors.has('shoulder_shrug_left') || errors.has('shoulder_shrug_right')) {
            return '⚠️ Relax shoulders - don\'t shrug';
        }
        if (errors.has('arm_too_high_left') || errors.has('arm_too_high_right')) {
            return '⚠️ Don\'t raise above shoulders';
        }
        if (errors.has('asymmetric_movement')) {
            return '⚠️ Keep both arms at same height';
        }
        if (errors.has('elbow_bent_left') || errors.has('elbow_bent_right')) {
            return '⚠️ Keep arms straighter';
        }
        if (errors.has('too_fast_raising')) {
            return '⚠️ Slower movement - 2-3 seconds up';
        }
        if (errors.has('insufficient_height')) {
            return '⚠️ Raise arms to shoulder height';
        }
        
        return 'Adjust your form';
    }
    
    /**
     * Reset analyzer for new session
     */
    reset() {
        this.currentPhase = 'resting';
        this.previousPhase = 'resting';
        this.repCount = 0;
        this.currentRep = {
            startTime: 0,
            raiseTime: 0,
            lowerTime: 0,
            peakAngle: 0,
            errors: []
        };
        this.leftArmHistory = [];
        this.rightArmHistory = [];
        this.currentErrors = new Set();
        this.formScore = 100;
        this.calibrated = false;
        this.restingLeftAngle = 0;
        this.restingRightAngle = 0;
    }
}

// Export for use in main.js
window.ArmRaisesAnalyzer = ArmRaisesAnalyzer;