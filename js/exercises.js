/**
 * Exercise Database and Configuration
 * Currently focused on Lateral Arm Raises for Physiotherapy
 */

const EXERCISES = [
    {
        id: 'lateral-arm-raises',
        name: 'Lateral Arm Raises',
        category: 'upper-body',
        difficulty: 'beginner',
        targetMuscles: ['Deltoids', 'Rotator Cuff', 'Upper Trapezius'],
        duration: '30-45 seconds',
        reps: '10-15',
        icon: 'fa-solid fa-hands',
        description: 'Shoulder strengthening and mobility exercise commonly used in physiotherapy',
        demoAnimation: 'https://wellnessed.com/wp-content/uploads/2023/03/how-to-do-dumbbell-lateral-raise.gif',
        instructions: [
            'Stand with arms at your sides',
            'Keep arms straight but not locked',
            'Slowly raise both arms to the sides',
            'Stop at shoulder height (90 degrees)',
            'Lower back down with control'
        ],
        keyPoints: {
            startPosition: 'Standing upright, arms relaxed at sides',
            movement: 'Smooth, controlled arm elevation',
            breathing: 'Exhale while raising, inhale while lowering',
            commonErrors: ['Shrugging shoulders', 'Arms going too high', 'Too fast movement', 'Bending elbows']
        },
        // Angles and thresholds for error detection
        targetAngles: {
            leftArmAngle: { min: 0, max: 95, optimal: 90 },    // Arm relative to body
            rightArmAngle: { min: 0, max: 95, optimal: 90 },
            shoulderSymmetry: { maxDifference: 15 },           // Max difference between arms
            elbowFlexion: { maxBend: 20 }                      // Arms should stay mostly straight
        },
        // Movement speed thresholds (in seconds)
        speedThresholds: {
            raiseTime: { min: 2, max: 4 },   // 2-4 seconds to raise
            lowerTime: { min: 2, max: 4 },   // 2-4 seconds to lower
            holdTime: { min: 0.5, max: 2 }   // Optional hold at top
        },
        // Therapeutic benefits
        therapeuticGoals: [
            'Increase shoulder range of motion',
            'Strengthen rotator cuff muscles',
            'Improve shoulder stability',
            'Reduce shoulder pain and stiffness',
            'Restore functional movement patterns'
        ]
    }
];

// Export for use in main.js
window.EXERCISES = EXERCISES;