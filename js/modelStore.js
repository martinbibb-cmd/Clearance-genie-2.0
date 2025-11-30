/**
 * Model Store Module
 * Loads and provides access to model data for boilers, radiators, and cylinders.
 */

const ModelStore = (function() {
    'use strict';

    // Cached model data
    let boilerModels = null;
    let radiatorModels = null;
    let cylinderModels = null;
    let isLoaded = false;
    let loadPromise = null;

    // Default service clearances for radiators (from radiators.json)
    const DEFAULT_RADIATOR_CLEARANCES = {
        sideLeft: 150,
        sideRight: 150,
        below: 150,
        above: 0,
        front: 0
    };

    // Default depth for radiators (typical panel radiator)
    const DEFAULT_RADIATOR_DEPTH = 60;

    /**
     * Load all model data from JSON files
     */
    async function loadAllModels() {
        if (loadPromise) {
            return loadPromise;
        }

        loadPromise = Promise.all([
            fetch('data/boiler_clearances.json').then(r => r.json()).catch(() => ({ models: [] })),
            fetch('data/radiators.json').then(r => r.json()).catch(() => ({ radiators: {} })),
            fetch('data/cylinders.json').then(r => r.json()).catch(() => ({ cylinders: [] }))
        ]).then(([boilerData, radiatorData, cylinderData]) => {
            boilerModels = boilerData.models || [];
            
            // Convert radiator config to model format
            radiatorModels = generateRadiatorModels(radiatorData);
            
            // Convert cylinder data to model format with proper dimensions
            cylinderModels = (cylinderData.cylinders || [])
                .filter(c => c.dimensions && c.dimensions.height && c.dimensions.diameter)
                .map(c => ({
                    id: c.code || `cylinder_${c.volume}L`,
                    brand: c.brand,
                    model: c.model,
                    type: c.type,
                    volume: c.volume,
                    dimensions: {
                        width: c.dimensions.diameter,
                        height: c.dimensions.height,
                        depth: c.dimensions.diameter
                    },
                    serviceClearances: {
                        front: 450,
                        sides: 150,
                        above: 100,
                        below: 100
                    }
                }));

            isLoaded = true;
            console.log(`[ModelStore] Loaded ${boilerModels.length} boilers, ${radiatorModels.length} radiators, ${cylinderModels.length} cylinders`);
        });

        return loadPromise;
    }

    /**
     * Generate radiator models from the radiator configuration
     */
    function generateRadiatorModels(radiatorData) {
        const models = [];
        const config = radiatorData.radiators || {};
        const heights = config.heights || [300, 450, 600];
        const widths = radiatorData.availableWidths || [400, 600, 800, 1000, 1200, 1400, 1600];
        const clearances = config.clearances || DEFAULT_RADIATOR_CLEARANCES;

        // Generate a subset of common sizes
        const commonWidths = [400, 600, 800, 1000, 1200, 1600, 2000];
        
        heights.forEach(height => {
            commonWidths.forEach(width => {
                if (widths.includes(width)) {
                    models.push({
                        id: `radiator_${height}x${width}`,
                        brand: 'Standard',
                        model: `${height}mm x ${width}mm`,
                        dimensions: {
                            width: width,
                            height: height,
                            depth: DEFAULT_RADIATOR_DEPTH
                        },
                        serviceClearances: {
                            front: 0,
                            sides: clearances.sideLeft || 150,
                            above: clearances.above || 0,
                            below: clearances.below || 150
                        }
                    });
                }
            });
        });

        return models;
    }

    /**
     * Get all boiler models
     */
    function getBoilerModels() {
        if (!isLoaded) {
            console.warn('[ModelStore] Models not loaded yet. Call loadAllModels() first.');
            return [];
        }
        return boilerModels;
    }

    /**
     * Get all radiator models
     */
    function getRadiatorModels() {
        if (!isLoaded) {
            console.warn('[ModelStore] Models not loaded yet. Call loadAllModels() first.');
            return [];
        }
        return radiatorModels;
    }

    /**
     * Get all cylinder models
     */
    function getCylinderModels() {
        if (!isLoaded) {
            console.warn('[ModelStore] Models not loaded yet. Call loadAllModels() first.');
            return [];
        }
        return cylinderModels;
    }

    /**
     * Get a model by ID from any category
     */
    function getModelById(id) {
        if (!isLoaded) {
            console.warn('[ModelStore] Models not loaded yet. Call loadAllModels() first.');
            return null;
        }

        // Search in boilers
        let model = boilerModels.find(m => m.id === id);
        if (model) return { type: 'boiler', model };

        // Search in radiators
        model = radiatorModels.find(m => m.id === id);
        if (model) return { type: 'radiator', model };

        // Search in cylinders
        model = cylinderModels.find(m => m.id === id);
        if (model) return { type: 'cylinder', model };

        return null;
    }

    /**
     * Get models by type
     */
    function getModelsByType(type) {
        switch (type) {
            case 'boiler':
                return getBoilerModels();
            case 'radiator':
                return getRadiatorModels();
            case 'cylinder':
                return getCylinderModels();
            default:
                return [];
        }
    }

    /**
     * Format model name for display
     */
    function formatModelName(model, type) {
        if (type === 'boiler') {
            return `${model.brand} ${model.range || ''} ${model.id.split('_').pop() || ''}`.trim();
        } else if (type === 'radiator') {
            return model.model;
        } else if (type === 'cylinder') {
            return `${model.brand} ${model.model} ${model.volume}L`;
        }
        return model.id;
    }

    /**
     * Check if models are loaded
     */
    function isReady() {
        return isLoaded;
    }

    // Public API
    return {
        loadAllModels,
        getBoilerModels,
        getRadiatorModels,
        getCylinderModels,
        getModelById,
        getModelsByType,
        formatModelName,
        isReady
    };
})();

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelStore;
}
