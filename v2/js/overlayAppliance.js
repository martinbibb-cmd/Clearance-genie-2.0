let canvasRef = null;
let calibration = null;
let selectedModel = null;
let boxPos = null;
let boxDimsPx = { w: 0, h: 0 };
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

const isPointInsideBox = (point) => {
  if (!boxPos) return false;
  const halfW = boxDimsPx.w / 2;
  const halfH = boxDimsPx.h / 2;
  return (
    point.x >= boxPos.x - halfW &&
    point.x <= boxPos.x + halfW &&
    point.y >= boxPos.y - halfH &&
    point.y <= boxPos.y + halfH
  );
};

const updateBoxDims = () => {
  if (!selectedModel || !calibration || !calibration.isValid) {
    boxDimsPx = { w: 0, h: 0 };
    return;
  }

  const pxPerMm = 1 / calibration.mmPerPixel;
  const { width, height } = selectedModel.dimensions || {};
  boxDimsPx = {
    w: (width || 0) * pxPerMm,
    h: (height || 0) * pxPerMm,
  };

  if (!boxPos && canvasRef) {
    boxPos = { x: canvasRef.width / 2, y: canvasRef.height / 2 };
  }
};

export function initApplianceOverlay(canvas, calibrationState) {
  canvasRef = canvas;
  calibration = calibrationState;
  canvasRef.style.pointerEvents = 'auto';

  const pointerPos = (event) => {
    const rect = canvasRef.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  canvasRef.addEventListener('pointerdown', (event) => {
    const pos = pointerPos(event);
    if (isPointInsideBox(pos)) {
      isDragging = true;
      dragOffset = { x: pos.x - boxPos.x, y: pos.y - boxPos.y };
    }
  });

  canvasRef.addEventListener('pointermove', (event) => {
    if (!isDragging || !boxPos) return;
    const pos = pointerPos(event);
    boxPos = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
  });

  const endDrag = () => {
    isDragging = false;
  };

  canvasRef.addEventListener('pointerup', endDrag);
  canvasRef.addEventListener('pointercancel', endDrag);
}

export function setSelectedModel(model) {
  selectedModel = model;
  updateBoxDims();
}

export function drawAppliance(ctx) {
  if (!selectedModel || !calibration || !calibration.isValid) return;
  updateBoxDims();

  if (!boxDimsPx.w || !boxDimsPx.h) {
    return;
  }

  if (!boxPos && canvasRef) {
    boxPos = { x: canvasRef.width / 2, y: canvasRef.height / 2 };
  }

  if (!boxPos) return;

  const halfW = boxDimsPx.w / 2;
  const halfH = boxDimsPx.h / 2;

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 188, 212, 0.9)';
  ctx.fillStyle = 'rgba(0, 188, 212, 0.15)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(boxPos.x - halfW, boxPos.y - halfH, boxDimsPx.w, boxDimsPx.h);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
