import { calibrationState, attachCalibrationControls } from './calibration.js';
import { initFlueOverlay } from './overlayFlue.js';
import { initApplianceOverlay, setSelectedModel } from './overlayAppliance.js';
import { loadBoilerModels, loadRadiatorModels, loadCylinderModels } from './modelStore.js';

document.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('cg-video');
  const canvas = document.getElementById('cg-overlay');
  const selType = document.getElementById('sel-appliance-type');
  const selModel = document.getElementById('sel-appliance-model');

  attachCalibrationControls(video, canvas);
  initApplianceOverlay(canvas, calibrationState);
  initFlueOverlay(video, canvas, calibrationState);

  const [boilerModels, radiatorModels, cylinderModels] = await Promise.all([
    loadBoilerModels(),
    loadRadiatorModels(),
    loadCylinderModels(),
  ]);

  const modelLookup = {
    boiler: boilerModels,
    radiator: radiatorModels,
    cylinder: cylinderModels,
  };

  const typeOptions = ['boiler', 'radiator', 'cylinder'];
  selType.innerHTML = typeOptions
    .map((type) => `<option value="${type}">${type}</option>`)
    .join('');

  const formatModelLabel = (model) => {
    const { brand = '', range = '', dimensions = {} } = model;
    const { width = '?', height = '?', depth = '?' } = dimensions;
    return `${brand} ${range} (${width}×${height}×${depth}mm)`;
  };

  const populateModels = (type) => {
    const models = modelLookup[type] || [];
    selModel.innerHTML = models
      .map((model, idx) => `<option value="${idx}">${formatModelLabel(model)}</option>`)
      .join('');
    if (models.length > 0) {
      selModel.disabled = false;
      setSelectedModel(models[0]);
    } else {
      selModel.disabled = true;
      setSelectedModel(null);
    }
  };

  selType.addEventListener('change', (event) => {
    populateModels(event.target.value);
  });

  selModel.addEventListener('change', (event) => {
    const currentType = selType.value;
    const models = modelLookup[currentType] || [];
    const selected = models[Number(event.target.value)] || null;
    setSelectedModel(selected);
  });

  populateModels(selType.value || typeOptions[0]);
});
