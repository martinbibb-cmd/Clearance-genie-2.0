/**
 * Live 3D Overlay Module
 * Renders 3D boxes representing boilers, radiators and cylinders over the camera feed.
 * Uses Three.js for WebGL rendering.
 */

const Live3D = (function() {
    'use strict';

    // State
    let renderer = null;
    let scene = null;
    let camera = null;
    let hostContainer = null;
    let videoElement = null;
    let animationId = null;
    let isInitialized = false;

    // Model mesh references
    let equipmentMesh = null;
    let clearanceMesh = null;

    // Callbacks
    let getCalibrationState = null;
    let getSelectedModel = null;

    // Drag state
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let boxPosition = { x: 0, y: 0 }; // Position in mm from center

    // Colors
    const EQUIPMENT_COLOR = 0x667eea;
    const CLEARANCE_COLOR = 0x27ae60;
    const CLEARANCE_OPACITY = 0.3;

    /**
     * Initialize the 3D overlay system
     * @param {HTMLVideoElement} video - The video element showing camera stream
     * @param {HTMLElement} container - Container div that wraps the video
     * @param {Function} calibrationFn - Function that returns calibration state
     * @param {Function} modelFn - Function that returns selected model data
     */
    function initLive3DOverlay(video, container, calibrationFn, modelFn) {
        if (typeof THREE === 'undefined') {
            console.error('[Live3D] Three.js is not loaded. Please include three.min.js before this script.');
            return false;
        }

        videoElement = video;
        hostContainer = container;
        getCalibrationState = calibrationFn;
        getSelectedModel = modelFn;

        // Create renderer with transparent background
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.pointerEvents = 'auto';
        renderer.domElement.style.zIndex = '10';

        // Create scene
        scene = new THREE.Scene();

        // Create orthographic camera (will be configured in resize)
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
        camera.position.z = 500;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 0, 1);
        scene.add(directionalLight);

        // Add canvas to container
        hostContainer.appendChild(renderer.domElement);

        // Setup event listeners
        setupEventListeners();

        // Initial resize
        handleResize();

        // Start animation loop
        isInitialized = true;
        animate();

        console.log('[Live3D] Initialized successfully');
        return true;
    }

    /**
     * Handle container resize
     */
    function handleResize() {
        if (!hostContainer || !renderer || !videoElement) return;

        const width = videoElement.clientWidth;
        const height = videoElement.clientHeight;

        if (width === 0 || height === 0) return;

        renderer.setSize(width, height);
        renderer.domElement.style.width = width + 'px';
        renderer.domElement.style.height = height + 'px';

        // Update camera based on calibration
        updateCamera();
    }

    /**
     * Update camera to match mm-based coordinate system
     */
    function updateCamera() {
        const calibration = getCalibrationState ? getCalibrationState() : null;
        
        if (!calibration || !calibration.isValid || !videoElement) {
            // Default camera setup when not calibrated
            const aspect = videoElement.clientWidth / videoElement.clientHeight;
            camera.left = -500 * aspect;
            camera.right = 500 * aspect;
            camera.top = 500;
            camera.bottom = -500;
            camera.updateProjectionMatrix();
            return;
        }

        // Calculate screen size in mm
        const screenWidthMM = videoElement.clientWidth * calibration.mmPerPixel;
        const screenHeightMM = videoElement.clientHeight * calibration.mmPerPixel;

        camera.left = -screenWidthMM / 2;
        camera.right = screenWidthMM / 2;
        camera.top = screenHeightMM / 2;
        camera.bottom = -screenHeightMM / 2;
        camera.updateProjectionMatrix();
    }

    /**
     * Setup pointer event listeners for dragging
     */
    function setupEventListeners() {
        const canvas = renderer.domElement;

        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointerleave', onPointerUp);

        // Handle resize
        window.addEventListener('resize', handleResize);

        // Use ResizeObserver for container size changes
        if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(hostContainer);
        }
    }

    /**
     * Convert screen coordinates to world (mm) coordinates
     */
    function screenToWorld(screenX, screenY) {
        const calibration = getCalibrationState ? getCalibrationState() : null;
        if (!calibration || !calibration.isValid) {
            return { x: 0, y: 0 };
        }

        const rect = renderer.domElement.getBoundingClientRect();
        const x = screenX - rect.left;
        const y = screenY - rect.top;

        // Convert to normalized coordinates (-1 to 1)
        const nx = (x / rect.width) * 2 - 1;
        const ny = -((y / rect.height) * 2 - 1);

        // Convert to world coordinates
        const screenWidthMM = rect.width * calibration.mmPerPixel;
        const screenHeightMM = rect.height * calibration.mmPerPixel;

        return {
            x: nx * screenWidthMM / 2,
            y: ny * screenHeightMM / 2
        };
    }

    /**
     * Pointer down event handler
     */
    function onPointerDown(event) {
        if (!equipmentMesh || !equipmentMesh.visible) return;

        const worldPos = screenToWorld(event.clientX, event.clientY);
        
        // Simple click-to-position for MVP
        isDragging = true;
        dragOffset.x = boxPosition.x - worldPos.x;
        dragOffset.y = boxPosition.y - worldPos.y;

        renderer.domElement.style.cursor = 'grabbing';
    }

    /**
     * Pointer move event handler
     */
    function onPointerMove(event) {
        if (!isDragging) return;

        const worldPos = screenToWorld(event.clientX, event.clientY);
        boxPosition.x = worldPos.x + dragOffset.x;
        boxPosition.y = worldPos.y + dragOffset.y;

        updateMeshPosition();
    }

    /**
     * Pointer up event handler
     */
    function onPointerUp() {
        isDragging = false;
        renderer.domElement.style.cursor = 'grab';
    }

    /**
     * Update mesh position
     */
    function updateMeshPosition() {
        if (equipmentMesh) {
            equipmentMesh.position.x = boxPosition.x;
            equipmentMesh.position.y = boxPosition.y;
        }
        if (clearanceMesh) {
            clearanceMesh.position.x = boxPosition.x;
            clearanceMesh.position.y = boxPosition.y;
        }
    }

    /**
     * Create or update the equipment mesh
     */
    function updateEquipmentMesh(modelData) {
        const dims = modelData.dimensions;
        if (!dims || !dims.width || !dims.height || !dims.depth) {
            console.warn('[Live3D] Invalid model dimensions');
            return;
        }

        // Remove existing meshes
        if (equipmentMesh) {
            scene.remove(equipmentMesh);
            equipmentMesh.geometry.dispose();
            equipmentMesh.material.dispose();
        }
        if (clearanceMesh) {
            scene.remove(clearanceMesh);
            clearanceMesh.geometry.dispose();
            clearanceMesh.material.dispose();
        }

        // Create equipment box - 1 THREE unit = 1 mm
        const equipmentGeometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
        const equipmentMaterial = new THREE.MeshPhongMaterial({
            color: EQUIPMENT_COLOR,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        equipmentMesh = new THREE.Mesh(equipmentGeometry, equipmentMaterial);
        
        // Add wireframe edge
        const edges = new THREE.EdgesGeometry(equipmentGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        equipmentMesh.add(wireframe);

        scene.add(equipmentMesh);

        // Create clearance halo if service clearances are defined
        const clearances = modelData.serviceClearances;
        if (clearances) {
            const haloWidth = dims.width + (clearances.sides || 0) * 2;
            const haloHeight = dims.height + (clearances.above || 0) + (clearances.below || 0);
            const haloDepth = dims.depth + (clearances.front || 0);

            // Offset for asymmetric clearances
            const haloOffsetY = ((clearances.above || 0) - (clearances.below || 0)) / 2;
            const haloOffsetZ = (clearances.front || 0) / 2;

            const haloGeometry = new THREE.BoxGeometry(haloWidth, haloHeight, haloDepth);
            const haloEdges = new THREE.EdgesGeometry(haloGeometry);
            const haloMaterial = new THREE.LineBasicMaterial({
                color: CLEARANCE_COLOR,
                linewidth: 2,
                transparent: true,
                opacity: 0.8
            });
            clearanceMesh = new THREE.LineSegments(haloEdges, haloMaterial);
            clearanceMesh.position.y = haloOffsetY;
            clearanceMesh.position.z = haloOffsetZ;

            scene.add(clearanceMesh);
        }

        // Set initial position
        updateMeshPosition();

        renderer.domElement.style.cursor = 'grab';
    }

    /**
     * Hide the equipment mesh
     */
    function hideMesh() {
        if (equipmentMesh) {
            equipmentMesh.visible = false;
        }
        if (clearanceMesh) {
            clearanceMesh.visible = false;
        }
        renderer.domElement.style.cursor = 'default';
    }

    /**
     * Show the equipment mesh
     */
    function showMesh() {
        if (equipmentMesh) {
            equipmentMesh.visible = true;
        }
        if (clearanceMesh) {
            clearanceMesh.visible = true;
        }
        renderer.domElement.style.cursor = 'grab';
    }

    /**
     * Main animation loop
     */
    function animate() {
        if (!isInitialized) return;

        animationId = requestAnimationFrame(animate);

        // Check if resize needed
        const width = videoElement.clientWidth;
        const height = videoElement.clientHeight;
        if (renderer.domElement.width !== width * window.devicePixelRatio ||
            renderer.domElement.height !== height * window.devicePixelRatio) {
            handleResize();
        }

        // Update camera based on current calibration
        updateCamera();

        // Get current state
        const calibration = getCalibrationState ? getCalibrationState() : null;
        const selectedModel = getSelectedModel ? getSelectedModel() : null;

        if (calibration && calibration.isValid && selectedModel && selectedModel.modelData) {
            // Check if model changed
            const modelData = selectedModel.modelData;
            if (!equipmentMesh || 
                !equipmentMesh.userData.modelId || 
                equipmentMesh.userData.modelId !== modelData.id) {
                updateEquipmentMesh(modelData);
                equipmentMesh.userData.modelId = modelData.id;
            }
            showMesh();
        } else {
            hideMesh();
        }

        // Render
        renderer.render(scene, camera);
    }

    /**
     * Set the selected model externally
     */
    function setSelectedModel(modelInfo) {
        if (modelInfo && modelInfo.modelData) {
            updateEquipmentMesh(modelInfo.modelData);
            if (equipmentMesh) {
                equipmentMesh.userData.modelId = modelInfo.modelData.id;
            }
            showMesh();
        } else {
            hideMesh();
        }
    }

    /**
     * Get current box position in mm
     */
    function getBoxPosition() {
        return { ...boxPosition };
    }

    /**
     * Set box position in mm
     */
    function setBoxPosition(x, y) {
        boxPosition.x = x;
        boxPosition.y = y;
        updateMeshPosition();
    }

    /**
     * Reset box to center
     */
    function resetPosition() {
        boxPosition.x = 0;
        boxPosition.y = 0;
        updateMeshPosition();
    }

    /**
     * Cleanup and dispose resources
     */
    function dispose() {
        isInitialized = false;

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (equipmentMesh) {
            scene.remove(equipmentMesh);
            equipmentMesh.geometry.dispose();
            equipmentMesh.material.dispose();
            equipmentMesh = null;
        }

        if (clearanceMesh) {
            scene.remove(clearanceMesh);
            clearanceMesh.geometry.dispose();
            clearanceMesh.material.dispose();
            clearanceMesh = null;
        }

        if (renderer) {
            renderer.dispose();
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
            renderer = null;
        }

        scene = null;
        camera = null;

        console.log('[Live3D] Disposed');
    }

    /**
     * Check if initialized
     */
    function isReady() {
        return isInitialized;
    }

    // Public API
    return {
        initLive3DOverlay,
        setSelectedModel,
        getBoxPosition,
        setBoxPosition,
        resetPosition,
        dispose,
        isReady
    };
})();

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Live3D;
}
