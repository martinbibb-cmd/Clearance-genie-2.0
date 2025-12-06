# ArUco Marker Scale Test

This Python script helps you test the accuracy of your printed ArUco markers by detecting them through a webcam and verifying their scale.

## Requirements

- Python 3.7 or higher
- Webcam
- Printed ArUco marker (DICT_6X6_250, ID: 0, 45mm size)

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install opencv-python opencv-contrib-python numpy
```

## Usage

1. Print an ArUco marker from the `aruco-markers.html` file, ensuring it's exactly 45mm in size
2. Run the script:

```bash
python3 aruco_scale_test.py
```

3. Hold the printed marker in front of your webcam
4. The script will:
   - Draw a green bounding box around the detected marker
   - Display the distance from the camera to the marker
   - Show a measurement line across the center of the screen with the real-world width at the marker's depth
   - Display the text: "If this box fits the marker perfectly, scale is correct."

5. Press 'q' or ESC to quit

## What the Script Does

### Marker Detection
- Opens your webcam
- Detects ArUco markers from the DICT_6X6_250 dictionary
- Specifically looks for marker ID 0

### Bounding Box
- Draws a green box around the detected marker
- If the box fits perfectly around your printed marker, the scale is correct

### Distance Calculation
- Assumes the physical marker is exactly 45mm
- Uses pose estimation to calculate the distance from camera to marker
- Displays distance in both millimeters and centimeters

### Measurement Line
- Shows a yellow horizontal line across the center of the screen
- Displays how many millimeters wide the screen view is at the depth of the marker
- This helps you understand the field of view at different distances

## Troubleshooting

**Marker not detected:**
- Ensure good lighting
- Make sure the marker is printed clearly
- Hold the marker steady and flat
- Ensure the white border around the marker is visible

**Distance seems inaccurate:**
- This script uses a simplified camera model
- For better accuracy, perform proper camera calibration
- Make sure your marker is exactly 45mm in size

**Camera not opening:**
- Check that your webcam is connected and not used by another application
- Try changing the camera index in the code if you have multiple cameras

## Technical Details

- **ArUco Dictionary:** DICT_6X6_250
- **Target Marker ID:** 0
- **Expected Marker Size:** 45mm
- **Pose Estimation Method:** SOLVEPNP_IPPE_SQUARE
- **Camera Model:** Simplified pinhole camera (for demo purposes)

## Note

For production use, perform proper camera calibration using OpenCV's calibration tools for more accurate distance measurements.
