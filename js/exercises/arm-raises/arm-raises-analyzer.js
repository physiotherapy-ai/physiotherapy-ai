/**
 * Arm Raises Exercise Analyzer
 * Analyzes pose landmarks for arm raise exercise form and progress
 */

class ArmRaisesAnalyzer {
    constructor() {
        // Exercise states
        this.states = {
            RESTING: 'resting',
            RAISING: 'raising',
            HOLDING: 'holding',
            LOWERING: 'lowering'
        };
        
        // Current state tracking
        this.currentState = this.states.RESTING;
        this.previousState = this.states.RESTING;
        this.repCount = 0;
        this.holdStartTime = null;
        this.holdDuration = 3000; // 3 seconds hold
        this.lastTransitionTime = Date.now();
        
        // Angle thresholds (in degrees)
        this.thresholds = {
            restingMax: 30,      // Arms should be below 30° when resting
            raisedMin: 75,       // Arms should be above 75° when raised (closer to 90°)
            raisedMax: 105,      // Arms shouldn't go above 105°
            elbowMin: 150,       // Elbow should be relatively straight (>150°)
            symmetryTolerance: 15 // Arms should be within 15° of each other
        };
        
        // Velocity tracking for smooth movement detection
        this.angleHistory = [];
        this.maxHistorySize = 10;
        
        // Form scoring
        this.formErrors = new Set();
        this.formScore = 100;
        
        // Rep validation
        this.validRep = false;
        this.repStartTime = null;
        
        // Pose confidence tracking
        this.confidenceHistory = [];
        this.maxConfidenceHistory = 30;
    }
    
    /**
     * Analyze current pose and update exercise state
     */
    analyze(landmarks) {
        if (!landmarks || landmarks.length < 33) return null;
        
        // Calculate current angles
        const angles = this.calculateAngles(landmarks);
        
        // Check pose confidence
        const avgConfidence = this.calculateAverageConfidence(landmarks);
        this.updateConfidenceHistory(avgConfidence);
        
        // Track angle history for velocity calculation
        this.updateAngleHistory(angles);
        
        // Analyze form and detect errors
        this.analyzeForm(angles, landmarks);
        
        // Update exercise state
        this.updateState(angles);
        
        // Return analysis results
        return {
            state: this.currentState,
            angles: angles,
            formScore: this.formScore,
            formErrors: Array.from(this.formErrors),
            repCount: this.repCount,
            isHolding: this.currentState === this.states.HOLDING,
            holdProgress: this.getHoldProgress(),
            confidence: avgConfidence,
            isStable: this.isPoseStable()
        };
    }
    
    /**
     * Calculate relevant angles from landmarks
     */
    calculateAngles(landmarks) {
        // Get key points
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        
        // Calculate shoulder angles (angle between arm and torso)
        const leftShoulderAngle = this.calculateAngleBetweenPoints(
            leftHip, leftShoulder, leftElbow
        );
        
        const rightShoulderAngle = this.calculateAngleBetweenPoints(
            rightHip, rightShoulder, rightElbow
        );
        
        // Calculate elbow angles (straightness of arms)
        const leftElbowAngle = this.calculateAngleBetweenPoints(
            leftShoulder, leftElbow, leftWrist
        );
        
        const rightElbowAngle = this.calculateAngleBetweenPoints(
            rightShoulder, rightElbow, rightWrist
        );
        
        // Calculate average angles
        const avgShoulderAngle = (leftShoulderAngle + rightShoulderAngle) / 2;
        
        return {
            leftShoulder: leftShoulderAngle,
            rightShoulder: rightShoulderAngle,
            leftElbow: leftElbowAngle,
            rightElbow: rightElbowAngle,
            avgShoulder: avgShoulderAngle,
            asymmetry: Math.abs(leftShoulderAngle - rightShoulderAngle)
        };
    }
    
    /**
     * Calculate angle between three points (in degrees)
     */
    calculateAngleBetweenPoints(p1, p2, p3) {
        const vector1 = {
            x: p1.x - p2.x,
            y: p1.y - p2.y
        };
        
        const vector2 = {
            x: p3.x - p2.x,
            y: p3.y - p2.y
        };
        
        const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
        const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
        const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);
        
        const cosAngle = dotProduct / (magnitude1 * magnitude2);
        const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        const angleDegrees = (angleRadians * 180) / Math.PI;
        
        return angleDegrees;
    }
    
    /**
     * Update angle history for velocity tracking
     */
    updateAngleHistory(angles) {
        this.angleHistory.push({
            angle: angles.avgShoulder,
            timestamp: Date.now()
        });
        
        if (this.angleHistory.length > this.maxHistorySize) {
            this.angleHistory.shift();
        }
    }
    
    /**
     * Calculate angular velocity
     */
    calculateVelocity() {
        if (this.angleHistory.length < 2) return 0;
        
        const recent = this.angleHistory.slice(-5);
        if (recent.length < 2) return 0;
        
        const first = recent[0];
        const last = recent[recent.length - 1];
        const timeDiff = (last.timestamp - first.timestamp) / 1000; // Convert to seconds
        const angleDiff = last.angle - first.angle;
        
        return angleDiff / timeDiff; // degrees per second
    }
    
    /**
     * Analyze form and detect errors
     */
    analyzeForm(angles, landmarks) {
        this.formErrors.clear();
        this.formScore = 100;
        
        // Check if arms are too high
        if (angles.leftShoulder > this.thresholds.raisedMax) {
            this.formErrors.add('arm_too_high_left');
            this.formScore -= 10;
        }
        
        if (angles.rightShoulder > this.thresholds.raisedMax) {
            this.formErrors.add('arm_too_high_right');
            this.formScore -= 10;
        }
        
        // Check arm symmetry
        if (angles.asymmetry > this.thresholds.symmetryTolerance) {
            this.formErrors.add('asymmetric_movement');
            this.formScore -= 15;
        }
        
        // Check elbow straightness
        if (angles.leftElbow < this.thresholds.elbowMin) {
            this.formErrors.add('elbow_bent_left');
            this.formScore -= 10;
        }
        
        if (angles.rightElbow < this.thresholds.elbowMin) {
            this.formErrors.add('elbow_bent_right');
            this.formScore -= 10;
        }
        
        // Check velocity for controlled movement
        const velocity = this.calculateVelocity();
        if (Math.abs(velocity) > 120 && this.currentState === this.states.RAISING) {
            this.formErrors.add('too_fast_raising');
            this.formScore -= 10;
        }
        
        // Check if raised high enough when in holding position
        if (this.currentState === this.states.HOLDING) {
            if (angles.avgShoulder < this.thresholds.raisedMin) {
                this.formErrors.add('insufficient_height');
                this.formScore -= 20;
            }
        }
        
        // Ensure score doesn't go below 0
        this.formScore = Math.max(0, this.formScore);
    }
    
    /**
     * Update exercise state based on angles
     */
    updateState(angles) {
        const now = Date.now();
        const timeSinceTransition = now - this.lastTransitionTime;
        
        // Prevent rapid state changes
        if (timeSinceTransition < 300) return;
        
        this.previousState = this.currentState;
        
        switch (this.currentState) {
            case this.states.RESTING:
                // Transition to RAISING when arms start going up
                if (angles.avgShoulder > this.thresholds.restingMax + 10) {
                    this.currentState = this.states.RAISING;
                    this.lastTransitionTime = now;
                    this.repStartTime = now;
                    this.validRep = true;
                }
                break;
                
            case this.states.RAISING:
                // Transition to HOLDING when arms reach target height
                if (angles.avgShoulder >= this.thresholds.raisedMin) {
                    this.currentState = this.states.HOLDING;
                    this.holdStartTime = now;
                    this.lastTransitionTime = now;
                } 
                // Return to RESTING if arms go back down without reaching target
                else if (angles.avgShoulder < this.thresholds.restingMax) {
                    this.currentState = this.states.RESTING;
                    this.lastTransitionTime = now;
                    this.validRep = false;
                }
                break;
                
            case this.states.HOLDING:
                // Check if hold is complete
                const holdTime = now - this.holdStartTime;
                
                // Transition to LOWERING after hold duration or if arms drop significantly
                // Allow more tolerance during hold (20 degrees instead of 10)
                if (holdTime >= this.holdDuration || angles.avgShoulder < this.thresholds.raisedMin - 20) {
                    this.currentState = this.states.LOWERING;
                    this.lastTransitionTime = now;
                }
                break;
                
            case this.states.LOWERING:
                // Transition back to RESTING when arms are down
                if (angles.avgShoulder <= this.thresholds.restingMax) {
                    this.currentState = this.states.RESTING;
                    this.lastTransitionTime = now;
                    
                    // Count rep if it was valid
                    if (this.validRep) {
                        this.repCount++;
                    }
                    
                    this.validRep = false;
                }
                break;
        }
    }
    
    /**
     * Get hold progress as percentage
     */
    getHoldProgress() {
        if (this.currentState !== this.states.HOLDING || !this.holdStartTime) {
            return 0;
        }
        
        const elapsed = Date.now() - this.holdStartTime;
        return Math.min(100, (elapsed / this.holdDuration) * 100);
    }
    
    /**
     * Calculate average confidence of key landmarks
     */
    calculateAverageConfidence(landmarks) {
        const keyPoints = [11, 12, 13, 14, 15, 16, 23, 24]; // Shoulders, elbows, wrists, hips
        let totalConfidence = 0;
        
        keyPoints.forEach(index => {
            if (landmarks[index]) {
                totalConfidence += landmarks[index].visibility || 0;
            }
        });
        
        return (totalConfidence / keyPoints.length) * 100;
    }
    
    /**
     * Update confidence history
     */
    updateConfidenceHistory(confidence) {
        this.confidenceHistory.push(confidence);
        
        if (this.confidenceHistory.length > this.maxConfidenceHistory) {
            this.confidenceHistory.shift();
        }
    }
    
    /**
     * Check if pose is stable based on confidence history
     */
    isPoseStable() {
        if (this.confidenceHistory.length < 5) return false;
        
        const recentConfidence = this.confidenceHistory.slice(-5);
        const avgConfidence = recentConfidence.reduce((a, b) => a + b, 0) / recentConfidence.length;
        
        return avgConfidence > 70;
    }
    
    /**
     * Reset analyzer for new session
     */
    reset() {
        this.currentState = this.states.RESTING;
        this.previousState = this.states.RESTING;
        this.repCount = 0;
        this.holdStartTime = null;
        this.lastTransitionTime = Date.now();
        this.angleHistory = [];
        this.formErrors.clear();
        this.formScore = 100;
        this.validRep = false;
        this.repStartTime = null;
        this.confidenceHistory = [];
    }
    
    /**
     * Get current state name
     */
    getStateName() {
        return this.currentState;
    }
    
    /**
     * Get exercise progress
     */
    getProgress() {
        return {
            reps: this.repCount,
            currentPhase: this.currentState,
            formScore: this.formScore,
            isExercising: this.currentState !== this.states.RESTING
        };
    }
}

// Export for use
window.ArmRaisesAnalyzer = ArmRaisesAnalyzer;