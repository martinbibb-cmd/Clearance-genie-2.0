#!/usr/bin/env python3
"""
ArUco Marker Scale Test Script
This script detects ArUco markers and helps verify the scale of printed markers.
"""

import cv2
import cv2.aruco as aruco
import numpy as np
import sys

# Configuration
MARKER_SIZE_MM = 45  # Physical marker size in millimeters
MARKER_ID = 0  # The ID of the marker to detect
ARUCO_DICT = aruco.DICT_6X6_250


def estimate_pose_and_distance(corners, marker_size_mm, camera_matrix, dist_coeffs):
    """
    Estimate the pose of the marker and calculate distance from camera.
    
    Args:
        corners: Detected marker corners
        marker_size_mm: Physical size of the marker in millimeters
        camera_matrix: Camera intrinsic matrix
        dist_coeffs: Camera distortion coefficients
    
    Returns:
        distance: Distance from camera to marker in millimeters
        rvec: Rotation vector
        tvec: Translation vector
    """
    # Define 3D points of the marker in object coordinate system
    # The marker is centered at origin
    half_size = marker_size_mm / 2
    obj_points = np.array([
        [-half_size, half_size, 0],
        [half_size, half_size, 0],
        [half_size, -half_size, 0],
        [-half_size, -half_size, 0]
    ], dtype=np.float32)
    
    # Solve PnP to get pose
    success, rvec, tvec = cv2.solvePnP(
        obj_points,
        corners,
        camera_matrix,
        dist_coeffs,
        flags=cv2.SOLVEPNP_IPPE_SQUARE
    )
    
    if success:
        # Distance is the Z component of translation vector
        distance = tvec[2][0]
        return distance, rvec, tvec
    
    return None, None, None


def calculate_screen_width_at_depth(distance_mm, camera_matrix, frame_width):
    """
    Calculate the real-world width that the screen represents at a given depth.
    
    Args:
        distance_mm: Distance to the marker in millimeters
        camera_matrix: Camera intrinsic matrix
        frame_width: Width of the video frame in pixels
    
    Returns:
        screen_width_mm: The real-world width in millimeters
    """
    # Focal length in pixels
    fx = camera_matrix[0, 0]
    
    # Calculate the real-world width using similar triangles
    # width_mm = (distance_mm * frame_width_pixels) / focal_length_pixels
    screen_width_mm = (distance_mm * frame_width) / fx
    
    return screen_width_mm


def main():
    """Main function to run the ArUco marker scale test."""
    
    # Initialize video capture
    print("Opening webcam...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam")
        sys.exit(1)
    
    # Get frame dimensions
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"Webcam opened: {frame_width}x{frame_height}")
    print(f"Looking for ArUco marker ID {MARKER_ID} from dictionary DICT_6X6_250")
    print(f"Assuming physical marker size: {MARKER_SIZE_MM}mm")
    print("\nPress 'q' to quit\n")
    
    # Initialize ArUco dictionary and detector parameters
    aruco_dict = aruco.getPredefinedDictionary(ARUCO_DICT)
    aruco_params = aruco.DetectorParameters()
    detector = aruco.ArucoDetector(aruco_dict, aruco_params)
    
    # Estimate camera matrix (simplified for typical webcam)
    # For better accuracy, camera calibration should be performed
    focal_length = frame_width  # Rough approximation
    center = (frame_width / 2, frame_height / 2)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float32)
    
    # Assume no lens distortion (simplified)
    dist_coeffs = np.zeros((4, 1), dtype=np.float32)
    
    while True:
        # Capture frame
        ret, frame = cap.read()
        
        if not ret:
            print("Error: Failed to capture frame")
            break
        
        # Convert to grayscale for detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect markers
        corners, ids, rejected = detector.detectMarkers(gray)
        
        # Process detected markers
        if ids is not None and len(ids) > 0:
            # Draw detected markers
            frame = aruco.drawDetectedMarkers(frame, corners, ids)
            
            # Find our target marker (ID 0)
            target_idx = None
            for idx, marker_id in enumerate(ids):
                if marker_id[0] == MARKER_ID:
                    target_idx = idx
                    break
            
            if target_idx is not None:
                # Get corners for target marker
                marker_corners = corners[target_idx][0]
                
                # Draw bounding box around the marker
                pts = marker_corners.reshape((-1, 1, 2)).astype(np.int32)
                cv2.polylines(frame, [pts], True, (0, 255, 0), 3)
                
                # Estimate pose and distance
                distance, rvec, tvec = estimate_pose_and_distance(
                    marker_corners,
                    MARKER_SIZE_MM,
                    camera_matrix,
                    dist_coeffs
                )
                
                if distance is not None:
                    # Display distance
                    distance_text = f"Distance: {distance:.1f}mm ({distance/10:.1f}cm)"
                    cv2.putText(
                        frame,
                        distance_text,
                        (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0, 255, 0),
                        2
                    )
                    
                    # Calculate screen width at marker depth
                    screen_width_mm = calculate_screen_width_at_depth(
                        distance,
                        camera_matrix,
                        frame_width
                    )
                    
                    # Draw measurement line across center of screen
                    center_y = frame_height // 2
                    cv2.line(
                        frame,
                        (0, center_y),
                        (frame_width, center_y),
                        (255, 255, 0),
                        2
                    )
                    
                    # Add text showing screen width
                    width_text = f"Screen width at marker depth: {screen_width_mm:.1f}mm"
                    cv2.putText(
                        frame,
                        width_text,
                        (10, center_y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 255, 0),
                        2
                    )
                    
                    # Add scale verification text
                    scale_text = "If this box fits the marker perfectly, scale is correct."
                    cv2.putText(
                        frame,
                        scale_text,
                        (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 255, 255),
                        2
                    )
        else:
            # No markers detected
            no_marker_text = "No ArUco marker detected. Show marker ID 0 to camera."
            cv2.putText(
                frame,
                no_marker_text,
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2
            )
        
        # Display the frame
        cv2.imshow('ArUco Scale Test', frame)
        
        # Check for quit command
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:  # 'q' or ESC
            break
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("\nScale test ended.")


if __name__ == "__main__":
    main()
