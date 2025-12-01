import { drawAppliance } from './overlayAppliance.js';

export function initFlueOverlay(video, canvas, calibrationState) {
  const ctx = canvas.getContext('2d');
  let flueCentre = null;

  const syncSize = () => {
    const { clientWidth, clientHeight } = video;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    }
  };

  const getPointerPos = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  canvas.addEventListener('pointerdown', (event) => {
    flueCentre = getPointerPos(event);
  });

  const drawRings = () => {
    if (!flueCentre || !calibrationState.isValid) return;
    const radiiMm = [100, 300, 600];
    const pxPerMm = 1 / calibrationState.mmPerPixel;
    const colors = [
      'rgba(50, 50, 50, 0.6)',
      'rgba(255, 193, 7, 0.35)',
      'rgba(76, 175, 80, 0.25)',
    ];

    radiiMm.forEach((mm, idx) => {
      const r = mm * pxPerMm;
      ctx.beginPath();
      ctx.fillStyle = colors[idx];
      ctx.arc(flueCentre.x, flueCentre.y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.beginPath();
    ctx.fillStyle = '#1d1d1d';
    ctx.arc(flueCentre.x, flueCentre.y, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  const render = () => {
    syncSize();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    drawRings();
    drawAppliance(ctx);
    requestAnimationFrame(render);
  };

  window.addEventListener('resize', syncSize);
  render();
}
