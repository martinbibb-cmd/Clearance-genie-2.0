# 🚀 Clearance Genie 2.0 - Complete Rebuild

## ArUco Marker Calibration System

This repository contains the Clearance Genie app with professional ArUco marker-based calibration for accurate heating installation clearance checking.

-----

## 📦 What's Included

### ⭐⭐⭐ **genie-v2.html** - CLEAN SLATE V2 (NEW - RECOMMENDED)

**The latest clean slate rebuild with improved AR tracking and perspective-correct rendering!**

- **Three-Phase Workflow**: Setup → Live AR → Results for clear user experience
- **Perspective-Correct Camera**: Uses THREE.js PerspectiveCamera for natural depth scaling
- **Simplified Marker Detection**: Fast contour-based square detection for any marker
- **Touch/Drag Positioning**: Intuitive drag controls to position equipment on wall
- **Live AR Preview**: Semi-transparent 3D object that scales naturally as you move
- **Lock & Check Mode**: Freeze camera and reveal clearance zones for final analysis
- **Equipment Types**: Boiler (400x700mm), Flue Terminal (150x150mm), Radiator (600x600mm)
- **Clearance Zones**: Red (<75mm), Green (>300mm) zones displayed after lock
- **Memory Optimized**: Efficient OpenCV memory management with proper cleanup
- **Mobile Optimized**: Uses video dimensions for accurate AR calculations

### ⭐⭐ **clearance-genie-aruco.html** - ARUCO MARKER CALIBRATION

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
- **Multiple per Sheet**: Print 6 markers (65mm each) on one A4 sheet - ideal for teams

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
| Multiple per Sheet | 6 × 65mm on A4 | Teams, multiple locations, cost-effective |

### ArUco Marker Specification

| Property | Value |
|----------|-------|
| Dictionary | DICT_6X6_50 |
| Border | White margin (keep visible) |
| Finish | Matte (avoid reflections) |
| Material | Laminated card or waterproof plastic |

### Calibration Workflow

#### For genie-v2.html (Clean Slate V2):
1. **Select Equipment**: Choose equipment type (Boiler/Flue/Radiator) and marker size
2. **Point at Marker**: Aim camera at any square marker on the wall
3. **Live AR Tracking**: Watch 3D object track and scale with marker in real-time
4. **Drag to Position**: Touch and drag the semi-transparent object to correct position
5. **Walk Back**: Step back to frame the wall - object scales naturally with perspective
6. **Lock & Check**: Tap "Lock & Check" to freeze and reveal clearance zones
7. **View Results**: See Red/Green zones and verify compliance

#### For clearance-genie-aruco.html (Classic):
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
3. Print an ArUco marker from `aruco-markers.html` (or use any square paper/card)
4. Start using `genie-v2.html` (recommended) or `clearance-genie-aruco.html`
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

### For genie-v2.html (Clean Slate V2)

**"Marker not detected"**
→ Ensure good lighting, use any square object (paper, card, sticky note)

**"Object doesn't track smoothly"**
→ Hold marker steady, ensure good contrast between marker and background

**"Can't drag the object"**
→ Make sure the marker is being tracked (green badge at top)

**"Clearance zones don't appear"**
→ Click "Lock & Check" button to freeze and show zones

### For clearance-genie-aruco.html (Classic)

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

Clearance Genie offers two powerful options for heating installation clearance checking:

**genie-v2.html (Clean Slate V2)** - Best for quick checks:
- Simple 3-phase workflow: Setup → Live AR → Results
- Works with any square marker (no special printing needed)
- Perspective-correct AR with natural depth scaling
- Touch/drag positioning for precise placement
- Instant clearance zone visualization

**clearance-genie-aruco.html (Classic)** - Best for detailed analysis:
- Professional ArUco marker calibration
- Curved clearance arcs with detailed measurements
- GPS and metadata capture
- Print markers in multiple sizes

**Key Features:**
- Print markers in 3 sizes (53mm, 148mm, 210mm) or use any square
- Automatic calibration with camera detection
- Color-coded clearance zones
- Works on mobile and desktop
- No backend required - works offline

**Get Started:**
1. Open `welcome.html` for instructions
2. Print a marker from `aruco-markers.html` (or use any square paper)
3. Start checking with `genie-v2.html` (recommended) or `clearance-genie-aruco.html`

**You've got this.** 💪
