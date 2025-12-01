const fetchModels = async (path) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load models from ${path}`);
  }
  const data = await response.json();
  return Array.isArray(data.models) ? data.models : [];
};

export async function loadBoilerModels() {
  return fetchModels('/data/rules/boiler_clearances.models.json');
}

export async function loadRadiatorModels() {
  return fetchModels('/data/rules/radiator_clearances.models.json');
}

export async function loadCylinderModels() {
  return fetchModels('/data/rules/cylinder_clearances.models.json');
}
