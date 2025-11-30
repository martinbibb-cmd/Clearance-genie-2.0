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

    /**
     * Load all model data from JSON files
     */
    async function loadAllModels() {
        if (loadPromise) {
            return loadPromise;
        }

        loadPromise = Promise.all([
            fetch('data/rules/boiler_clearances.models.json').then(r => r.json()).catch(err => {
                console.warn('[ModelStore] Failed to load boiler_clearances.models.json:', err.message);
                return { models: [] };
            }),
            fetch('data/rules/radiator_clearances.models.json').then(r => r.json()).catch(err => {
                console.warn('[ModelStore] Failed to load radiator_clearances.models.json:', err.message);
                return { models: [] };
            }),
            fetch('data/rules/cylinder_clearances.models.json').then(r => r.json()).catch(err => {
                console.warn('[ModelStore] Failed to load cylinder_clearances.models.json:', err.message);
                return { models: [] };
            })
        ]).then(([boilerData, radiatorData, cylinderData]) => {
            boilerModels = normalizeModels(boilerData.models || []);
            radiatorModels = normalizeModels(radiatorData.models || []);
            cylinderModels = normalizeModels(cylinderData.models || []);

            isLoaded = true;
            console.log(`[ModelStore] Loaded ${boilerModels.length} boilers, ${radiatorModels.length} radiators, ${cylinderModels.length} cylinders from rules data`);
        });

        return loadPromise;
    }

    /**
     * Ensure all model entries include required properties
     */
    function normalizeModels(models) {
        return models
            .filter(model => model.dimensions && model.dimensions.width && model.dimensions.height)
            .map(model => ({
                ...model,
                serviceClearances: model.serviceClearances || { front: 0, sides: 0, above: 0, below: 0 }
            }));
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
