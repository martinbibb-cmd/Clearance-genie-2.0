/**
 * Live Clearance View Module
 * Provides real-time camera feed with clearance ring overlay.
 * Allows the user to tap to set the flue centre and see clearance radii drawn on top.
 */

(function(global) {
    'use strict';

    // Module state
    let video = null;
    let canvas = null;
    let ctx = null;
    let flueCentre = null;
    let cameraStream = null;
    let animationId = null;
    let isInitialized = false;

    // Placeholder mm->px scale (will be connected to ArUco calibration later)
    let mmPerPixel = 1;

    /**
     * Initialize the live clearance view
     * Call this after DOMContentLoaded
     */
    function initLiveClearance() {
        video = document.getElementById('cg-video');
        canvas = document.getElementById('cg-overlay');

        if (!video || !canvas) {
            // Elements not present on this page
            return;
        }

        ctx = canvas.getContext('2d');

        // Start the camera
        startCamera();

        // Handle window resize / orientation changes
        window.addEventListener('resize', function() {
            resizeCanvasToVideo();
        });

        // Add tap handler to set flue centre
        const wrapper = canvas.parentElement;
        if (wrapper) {
            wrapper.addEventListener('pointerdown', handleTap);
        }

        // Wire up control buttons
        const recalibrateBtn = document.getElementById('cg-recalibrate');
        if (recalibrateBtn) {
            recalibrateBtn.addEventListener('click', handleRecalibrate);
        }

        const clearFlueBtn = document.getElementById('cg-clear-flue');
        if (clearFlueBtn) {
            clearFlueBtn.addEventListener('click', handleClearFlue);
        }

        isInitialized = true;
        console.log('[LiveClearance] Initialized');
    }

    /**
     * Start the camera stream
     */
    function startCamera() {
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        })
        .then(function(stream) {
            cameraStream = stream;
            video.srcObject = stream;
            video.onloadedmetadata = function() {
                video.play();
                // Match canvas size to the displayed video size
                resizeCanvasToVideo();
                // Start render loop
                startRenderLoop();
            };
        })
        .catch(function(err) {
            console.error('[LiveClearance] Camera error:', err);
        });
    }

    /**
     * Resize the canvas to match the video's displayed size
     */
    function resizeCanvasToVideo() {
        if (!video || !canvas) return;
        const rect = video.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    /**
     * Start the render loop (draws video frame + clearance rings)
     */
    function startRenderLoop() {
        function frame() {
            if (!canvas || !ctx) return;

            const w = canvas.width;
            const h = canvas.height;

            // Clear canvas and draw current video frame
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(video, 0, 0, w, h);

            // Draw flue + clearance rings if a centre has been set
            if (flueCentre) {
                drawClearanceRings(ctx, flueCentre.x, flueCentre.y);
            }

            animationId = requestAnimationFrame(frame);
        }
        animationId = requestAnimationFrame(frame);
    }

    /**
     * Draw clearance rings centred at (cx, cy)
     * Radii are in mm; we convert using mmPerPixel (placeholder = 1 for now).
     */
    function drawClearanceRings(context, cx, cy) {
        // Radii in mm (example: 100mm (flue terminal), 300mm, 600mm)
        var radiiMm = [100, 300, 600];
        var colours = [
            'rgba(80,80,80,0.9)',      // Flue terminal area (dark)
            'rgba(255,215,0,0.3)',     // 300mm zone (gold)
            'rgba(0,200,0,0.25)'       // 600mm zone (green)
        ];

        // Draw rings from largest to smallest so smaller ones are on top
        for (var idx = radiiMm.length - 1; idx >= 0; idx--) {
            var mm = radiiMm[idx];
            var rPx = mm / mmPerPixel;
            context.beginPath();
            context.arc(cx, cy, rPx, 0, Math.PI * 2);
            context.fillStyle = colours[idx] || 'rgba(0,200,0,0.2)';
            context.fill();
        }

        // Small solid dot in the middle to show flue centre
        context.beginPath();
        context.arc(cx, cy, 6, 0, Math.PI * 2);
        context.fillStyle = '#ff7a17';
        context.fill();
    }

    /**
     * Handle tap on the video wrapper to set flue centre
     */
    function handleTap(evt) {
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;
        flueCentre = { x: x, y: y };
    }

    /**
     * Clear the flue point
     */
    function handleClearFlue() {
        flueCentre = null;
    }

    /**
     * Recalibrate marker (stub for now)
     */
    function handleRecalibrate() {
        // TODO: Hook into ArUco detection / calibration logic
        console.log('[LiveClearance] Recalibrate marker triggered (stub)');
        alert('Recalibrate marker: This will be connected to ArUco detection soon.');
    }

    /**
     * Set the mm per pixel scale (for use after calibration)
     */
    function setScale(newMmPerPixel) {
        if (newMmPerPixel > 0) {
            mmPerPixel = newMmPerPixel;
        }
    }

    /**
     * Get current flue centre position
     */
    function getFlueCentre() {
        return flueCentre ? { x: flueCentre.x, y: flueCentre.y } : null;
    }

    /**
     * Dispose and clean up resources
     */
    function dispose() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (cameraStream) {
            cameraStream.getTracks().forEach(function(track) {
                track.stop();
            });
            cameraStream = null;
        }

        flueCentre = null;
        isInitialized = false;
        console.log('[LiveClearance] Disposed');
    }

    /**
     * Check if initialized
     */
    function isReady() {
        return isInitialized;
    }

    // Expose API
    global.LiveClearance = {
        initLiveClearance: initLiveClearance,
        setScale: setScale,
        getFlueCentre: getFlueCentre,
        dispose: dispose,
        isReady: isReady
    };

    // Also expose initLiveClearance directly for simpler usage
    global.initLiveClearance = initLiveClearance;

})(typeof window !== 'undefined' ? window : this);
