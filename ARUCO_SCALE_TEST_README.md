# ArUco Marker Scale Test

This Python script helps you test the accuracy of your printed ArUco markers by detecting them through a webcam and verifying their scale.

## Requirements

- Python 3.7 or higher
- Webcam
- Printed ArUco marker (DICT_6X6_250, ID: 0)
  - Default: 45mm size (configurable via command line)
  - Compatible with other sizes: 53mm, 65mm, 148mm, 210mm

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

1. Print an ArUco marker from the `aruco-markers.html` file
   - Supported sizes: 45mm (default), 53mm, 65mm, 148mm, or 210mm
   
2. Run the script (default 45mm marker):

```bash
python3 aruco_scale_test.py
```

Or specify a different marker size:

```bash
# For 53mm marker (credit card size)
python3 aruco_scale_test.py 53

# For 65mm marker (multiple per sheet)
python3 aruco_scale_test.py 65

# For 148mm marker (A5 size)
python3 aruco_scale_test.py 148

# For 210mm marker (A4 size)
python3 aruco_scale_test.py 210
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
- Assumes the physical marker matches the specified size (default 45mm, or custom size via command line)
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
- This script uses a simplified camera model (focal length approximation)
- For better accuracy, perform proper camera calibration using OpenCV's calibration tools
- Ensure your marker size matches what you specified when running the script (default: 45mm)
- The focal length approximation may not match your camera's actual characteristics

**Camera not opening:**
- Check that your webcam is connected and not used by another application
- Try changing the camera index in the code if you have multiple cameras

## Technical Details

- **ArUco Dictionary:** DICT_6X6_250
- **Target Marker ID:** 0
- **Default Marker Size:** 45mm (configurable via command line)
- **Supported Sizes:** 45mm, 53mm, 65mm, 148mm, 210mm (or any custom size)
- **Pose Estimation Method:** SOLVEPNP_IPPE_SQUARE (with fallback to SOLVEPNP_ITERATIVE)
- **Camera Model:** Simplified pinhole camera with focal length approximation

## Note

For production use, perform proper camera calibration using OpenCV's calibration tools for more accurate distance measurements. The current implementation uses a simplified camera model where the focal length is approximated as the frame width, which may lead to distance measurement inaccuracies depending on your camera's actual field of view.
