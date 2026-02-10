<div align="center">

# 🏥 PhysiotherapyAI - Motion Tracking System

### AI-Powered Physiotherapy Assistant with Real-Time Movement Analysis

[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-00ACC1?logo=google)](https://mediapipe.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?logo=webrtc)](https://webrtc.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Leveraging computer vision and AI to provide personalized physiotherapy guidance**

[Features](#-features) • [Demo](#-live-demo) • [Technology](#-technology-stack) • [Getting Started](#-getting-started) • [Architecture](#-architecture)

![PhysiotherapyAI Demo](https://theraphyai.com)

</div>

---

## 🎯 Overview

**PhysiotherapyAI** is an innovative web-based platform that combines **computer vision**, **pose estimation**, and **voice commands** to deliver real-time physiotherapy exercise guidance. Using **MediaPipe Pose** detection, it tracks 33 body landmarks to analyze movement patterns, correct form, and provide personalized feedback.

### 🌟 Why PhysiotherapyAI?

- 🤖 **AI-Powered**: Real-time pose estimation using MediaPipe
- 🎤 **Voice Control**: Hands-free operation with voice commands
- 📊 **Real-Time Feedback**: Instant form correction and guidance
- 📱 **Cross-Platform**: Works on desktop and mobile browsers
- 🏥 **Medical-Grade UI**: Professional healthcare aesthetic
- 🎯 **Exercise Library**: 8+ pre-configured physiotherapy exercises
- 🔊 **Audio Guidance**: Text-to-speech feedback system
- 📈 **Progress Tracking**: Rep counting and session analytics (coming soon)

---

## ✨ Features

### 🎥 Computer Vision & Pose Detection

- **MediaPipe Pose Integration**
  - Real-time detection of 33 body landmarks
  - Visibility percentage calculation for tracking quality
  - 3D coordinate tracking (x, y, z)
  - Confidence scoring for each landmark

- **Visual Feedback**
  - Color-coded landmarks (🔴 Red: idle, 🟢 Green: exercising)
  - Skeleton overlay showing joint connections
  - Real-time FPS counter
  - Canvas aspect ratio optimization (4:3 desktop, 1:1 mobile)

### 🎤 Voice Command System

Control the application hands-free with natural language commands:

| Command | Action |
|---------|--------|
| "Start Camera" | Activates webcam and pose detection |
| "Stop Camera" | Stops tracking and clears display |
| "Start Exercise" | Begins exercise tracking |
| "Stop Exercise" | Ends current exercise session |

**Features:**
- Cross-browser speech recognition
- Real-time voice status indicator
- Visual feedback for recognized commands
- Confidence threshold filtering
- Works in noisy environments

### 🏋️ Exercise Library

#### **Lower Body Exercises**
- 🦵 **Bodyweight Squat** - Full lower body strengthening
- 🚶 **Standing March** - Balance and coordination
- 👟 **Heel Raises** - Calf muscle strengthening
- 🪑 **Seated Knee Extension** - Quadriceps isolation

#### **Upper Body Exercises**
- 🔄 **Arm Circles** - Shoulder mobility
- 🧱 **Wall Push-ups** - Chest and arm strengthening

#### **Mobility Exercises**
- 🔄 **Neck Rotation** - Cervical mobility
- 💪 **Shoulder Rolls** - Upper back flexibility

Each exercise includes:
- Detailed instructions
- Target muscle groups
- Difficulty level
- Duration guidelines
- Visual demonstration animations

### 🔊 Audio Feedback System

- **Text-to-Speech Integration**
  - Real-time guidance during exercises
  - Rep count announcements
  - Form correction alerts
  - Customizable voice settings

- **Audio Controls**
  - Toggle audio on/off
  - Volume control
  - Voice selection

### 📱 User Interface

- **30/70 Split Layout**
  - Left panel (30%): Exercise selection and filtering
  - Right panel (70%): Real-time camera feed and overlay
  
- **Exercise Selection Panel**
  - 8 exercise cards with preview
  - Category filtering (Lower Body, Upper Body, Core, Mobility)
  - Visual selection highlighting
  - Exercise details on hover

- **Real-Time Display**
  - Connection status indicator
  - Exercise instruction overlay
  - Feedback display area
  - Professional medical aesthetic

- **Responsive Design**
  - Desktop optimization
  - Mobile-friendly layout
  - Touch-friendly controls

---
