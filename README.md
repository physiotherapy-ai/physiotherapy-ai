# Physiotherapy AI Motion Tracking MVP

## 🎯 Project Overview
An AI-powered physiotherapy motion tracking application that uses MediaPipe Pose detection to analyze body movements in real-time through webcam feed.

## 📌 Current Status: Step 2 Complete
**Exercise Selection Panel + 30/70 Split Layout**

### ✅ Currently Implemented Features
1. **Camera Integration**
   - WebRTC camera access with permission handling
   - Start/Stop camera controls
   - Front-facing camera by default
   - Real-time FPS counter

2. **MediaPipe Pose Detection**
   - Real-time detection of 33 body landmarks
   - Visual overlay showing detected pose skeleton
   - Color-coded landmarks (Red: idle, Green: exercising)
   - Visibility percentage calculation for tracking quality

3. **Exercise Selection Panel**
   - Left panel (30% width) with exercise cards
   - 8 pre-configured exercises with details
   - Category filtering (Lower Body, Upper Body, Core, Mobility)
   - Visual selection with highlighting
   - Exercise information display (muscles, duration, difficulty)

4. **Exercise Training Animations (NEW)**
   - Visual demonstration animations for proper form
   - Integrated exercise preview in instruction overlay
   - Clean vector-style animations for professional appearance
   - Helps users learn correct movement patterns before starting

5. **Voice Commands (NEW)**
   - Voice-controlled camera operations: "start camera", "stop camera"
   - Voice-controlled exercise operations: "start exercise", "stop exercise"
   - Session controls: "start session", "end session"
   - Real-time voice status indicator
   - Cross-browser speech recognition support
   - Visual feedback for recognized commands

6. **Audio Feedback System**
   - Text-to-speech integration for real-time guidance
   - Customizable voice settings
   - Audio toggle controls
   - Rep count announcements

7. **User Interface**
   - Professional 30/70 split layout
   - Responsive design with mobile optimization
   - Connection status indicator
   - Exercise overlay instructions
   - Real-time feedback display area (ready for implementation)
   - Clean medical-professional aesthetic

### 🔗 Functional Entry Points
- `index.html` - Main application page
  - Start Camera button: Initiates webcam and pose detection
  - Stop Camera button: Stops tracking and clears display
  - Voice Commands button: Toggle voice control on/off
  - Audio toggle: Enable/disable text-to-speech feedback
  - Real-time landmark visualization on canvas

#### Voice Commands Available:
- **Camera Control**: "start camera", "stop camera", "camera on", "camera off"
- **Exercise Control**: "start exercise", "stop exercise", "begin exercise", "end exercise"

### 📋 Features Not Yet Implemented
1. ~~Exercise selection panel (left side)~~ ✅ DONE
2. Specific exercise implementations (Bodyweight Squats) - Basic structure ready
3. Movement analysis and error detection
4. Real-time feedback system (visual/audio)
5. Progress tracking and rep counting
6. Form accuracy scoring
7. Session summaries
8. ~~Exercise state management~~ ✅ Basic state management DONE

### 🚀 Recommended Next Steps
1. ~~**Step 2**: Add exercise selection panel with exercise cards~~ ✅ COMPLETE
2. **Step 3**: Implement bodyweight squat exercise logic with angle calculations
3. **Step 4**: Add movement analysis and phase detection (descent/ascent)
4. **Step 5**: Implement error detection for form issues
5. **Step 6**: Add real-time feedback (visual and audio cues)
6. **Step 7**: Implement progress tracking and rep counting
7. **Step 8**: Add session summaries and form scoring

## 🏗️ Project Structure
```
/
├── index.html                    # Main HTML page with split layout
├── css/
│   └── style.css                # Custom styles and responsive design
├── js/
│   ├── main.js                  # Main JavaScript with MediaPipe integration
│   ├── exercises.js             # Exercise database and configurations
│   ├── arm-raises-analyzer.js   # Exercise-specific analysis logic
│   ├── audio-feedback.js        # Text-to-speech feedback system
│   └── voice-commands.js        # Voice recognition and command processing
└── README.md                    # Project documentation
```

## 🛠️ Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS (via CDN)
- **AI/ML**: MediaPipe Pose (v0.5)
- **Camera**: WebRTC API
- **Dependencies**:
  - @mediapipe/pose
  - @mediapipe/camera_utils
  - @mediapipe/control_utils
  - @mediapipe/drawing_utils

## 📊 Data Models
Currently tracking:
- 33 body landmarks with x, y, z coordinates
- Visibility scores for each landmark
- Real-time pose data structure from MediaPipe

## 🎮 How to Use
1. Open the application in a modern web browser
2. **Select an exercise** from the left panel (8 exercises available)
3. **Enable voice commands** (optional): Click the microphone button to activate voice control
4. Click "**Start Camera**" button (or say "start camera") to activate webcam
5. Allow camera and microphone permissions when prompted
6. Stand back so your full body is visible
7. Click "**Start Exercise**" (or say "start exercise") to begin tracking
8. The system shows:
   - Red landmarks when idle
   - Green landmarks when exercising
   - Real-time FPS and visibility scores
   - Exercise instructions overlay
   - Voice command feedback notifications

### Voice Control Tips:
- Speak clearly and wait for the green microphone indicator
- Commands work in noisy environments with confidence thresholds
- Use individual commands for precise control of camera and exercise functions

### Available Exercises:
- **Lower Body**: Bodyweight Squat, Standing March, Heel Raises, Seated Knee Extension
- **Upper Body**: Arm Circles, Wall Push-ups
- **Mobility**: Neck Rotation, Shoulder Rolls

## 🔒 Browser Requirements
- Modern browser with WebRTC support
- Camera/webcam access
- Microphone access (for voice commands)
- JavaScript enabled
- **Voice Commands**: Chrome, Edge, Safari (latest versions)
- **Camera**: Chrome, Firefox, Edge, Safari (latest versions)

## 📝 Development Notes
- MediaPipe Pose model complexity set to 1 (balanced)
- Detection confidence threshold: 0.5
- Tracking confidence threshold: 0.5
- Canvas aspect ratio: 4:3 (desktop), 1:1 (mobile)
- Front-facing camera used by default

## 🎯 Final Goal
Build a complete physiotherapy AI assistant capable of:
- Multiple exercise tracking
- Real-time form correction
- Progress monitoring
- Personalized feedback
- Session analytics

---

**Current Development Stage**: MVP Step 2 - Exercise Selection & Split Layout ✅

### What's New in Step 2:
- ✅ 30/70 split layout implemented
- ✅ Exercise selection panel with 8 exercises
- ✅ Category filtering
- ✅ Exercise state management
- ✅ Visual feedback indicators
- ✅ Professional UI improvements

Ready for Step 3: Implementing specific exercise logic and angle calculations!