# 🚀 Clearance Genie 2.0 - Complete Rebuild

## ArUco Marker Calibration System

This repository contains the Clearance Genie app with professional ArUco marker-based calibration for accurate heating installation clearance checking.

-----

## 📦 What's Included

### ⭐⭐ **clearance-genie-aruco.html** - ARUCO MARKER CALIBRATION (RECOMMENDED)

**The most reliable calibration system using ArUco fiducial markers!**

- **ArUco Marker Detection**: Uses OpenCV.js for robust, sub-pixel accurate marker detection
- **Multiple Marker Sizes**: Choose from credit card (53mm), A5 (148mm), or A4 (210mm)
- **Live Camera Detection**: Real-time marker detection with green outline confirmation
- **Calibration Lock**: Locks calibration after 5 consecutive detections for reliability
- **Curved Clearance Arcs**: Proper 300mm, 200mm, 150mm, 75mm curved zones (not boxes)
- **Pass/Fail Color Coding**: Red (non-compliant), Amber (influenced), Green (compliant)
- **Distance & Orientation**: Displays estimated distance and camera orientation
- **Metadata Capture**: GPS, timestamp, and calibration validity saved with results
- **Equipment Types**: Flue, Boiler, Radiator, Cylinder

### 🖨️ **aruco-markers.html** - PRINT ARUCO MARKERS

**Print calibration markers in your preferred size!**

- **Credit Card Size (53mm)**: Portable, fits in wallet
- **A5 Size (148mm)**: Good for medium distances
- **A4 Size (210mm)**: Best for large rooms

### 📖 **welcome.html** - USER INSTRUCTIONS

Complete user guide with step-by-step instructions for:
- Printing and preparing ArUco markers
- Camera calibration process
- Taking measurements
- Understanding clearance zones

-----

## 📐 ArUco Marker Calibration

### Why ArUco?

ArUco is a mature open-source fiducial marker system used in robotics, drones, SLAM, and AR applications. It provides:

- **Extremely robust detection** at distance and angle
- **Sub-pixel corner accuracy** for precise measurements
- **Stability under poor lighting** conditions
- **Orientation and perspective correction** support

### Available Marker Sizes

| Size | Dimensions | Best For |
|------|------------|----------|
| Credit Card | 53mm × 53mm | Portability, close-up work |
| A5 | 148mm × 148mm | General use, medium distances |
| A4 | 210mm × 210mm | Large rooms, best detection |

### ArUco Marker Specification

| Property | Value |
|----------|-------|
| Dictionary | DICT_6X6_50 |
| Border | White margin (keep visible) |
| Finish | Matte (avoid reflections) |
| Material | Laminated card or waterproof plastic |

### Calibration Workflow

1. **Print Marker**: Use aruco-markers.html to print your preferred size
2. **Place Marker**: Position on the same wall plane as the flue/equipment
3. **Start Calibration**: App begins live camera detection
4. **Lock Calibration**: After 5 consecutive detections, calibration locks with green confirmation
5. **Capture Wall Photo**: Pull back to capture the full wall area
6. **Mark Objects**: Tap to mark flue center and obstacle positions
7. **Analyze Results**: View curved clearance arcs with pass/fail color coding

-----

## ⚡ Quick Start (5 Minutes)

### Option 1: Test Locally (Fastest)

1. Download the repository
2. Open `welcome.html` in Safari or Chrome
3. Print an ArUco marker from `aruco-markers.html`
4. Start using `clearance-genie-aruco.html`
5. Done!

### Option 2: Deploy to Web (Recommended)

1. Create GitHub repo: `clearance-genie-v2`
2. Upload all files
3. Settings → Pages → Enable
4. Live at: `https://yourusername.github.io/clearance-genie-v2`

-----

## 📱 How It Works

### 6-Step Process

1. **Select Equipment** - Flue, Boiler, Radiator, or Cylinder
2. **Print Marker** - Choose credit card (53mm), A5 (148mm), or A4 (210mm)
3. **Calibrate** - Hold marker against wall, wait for green lock
4. **Capture Photo** - Pull back to capture wall area
5. **Mark Objects** - Tap flue center, then obstacle corners
6. **Check Clearance** - Instant color-coded zones + pass/fail

**Total Time:** 2 minutes per check

-----

## 📚 Clearance Zones

### Equipment Types

**Flue Terminals 🌬️**
- Checks Building Regs Part J clearances
- Windows (opening/non-opening)
- Doors, vents, corners, ground
- 300mm/150mm/75mm zones

**Boilers 🔥**
- Service access clearances
- Wall spacing (50mm)
- Above/below access (300mm)
- Cupboard installations

**Radiators ♨️**
- Air circulation (50mm walls)
- Floor clearance (150mm)
- Curtain safety (100mm)
- Furniture spacing (150mm)

**Cylinders 🛢️**
- Discharge pipework (450mm above)
- Service access (150mm sides)
- Safety valve access
- Maintenance clearances

### Color Coding

| Color | Zone | Status |
|-------|------|--------|
| 🔴 Red | <75mm | Non-compliant (Fail) |
| 🟠 Amber | 75-150mm | Influenced (Review) |
| 🟢 Green | >300mm | Compliant (Pass) |

-----

## 🚨 Important Notes

### What This Tool Does

✅ Checks clearances visually  
✅ Documents compliance with annotated photos  
✅ Professional presentation  
✅ Fast on-site verification  

### What This Tool Doesn't Do

❌ Replace Gas Safe engineer judgment  
❌ Override manufacturer instructions  
❌ Guarantee Building Control approval  
❌ Measure depth/3D spacing  

**Always:**
- Follow manufacturer specs
- Check MIs for specific model
- Verify with tape measure where critical
- Document everything

-----

## 📞 Troubleshooting

**"Marker not detected"**
→ Ensure good lighting, avoid reflections on glossy surfaces

**"Calibration not locking"**
→ Hold marker steady, ensure white border is visible

**"Measurements look wrong"**
→ Make sure you selected the correct marker size

**"Camera not working"**
→ Use modern browser (Chrome/Safari), allow camera permission

-----

## 🏆 Summary

Clearance Genie uses ArUco marker calibration for professional, accurate heating installation clearance checking.

**Key Features:**
- Print markers in 3 sizes (53mm, 148mm, 210mm)
- Automatic calibration with camera detection
- Color-coded clearance zones
- Works on mobile and desktop
- No backend required - works offline

**Get Started:**
1. Open `welcome.html` for instructions
2. Print a marker from `aruco-markers.html`
3. Start checking with `clearance-genie-aruco.html`

**You've got this.** 💪
