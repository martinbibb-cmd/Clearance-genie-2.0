export const calibrationState = {
  isValid: false,
  mmPerPixel: 1,
};

export async function startCamera(videoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false,
  });

  return new Promise((resolve) => {
    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = () => {
      videoElement.play();
      resolve();
    };
  });
}

export function attachCalibrationControls(videoElement, canvasElement) {
  const btnStart = document.getElementById('btn-start-camera');
  const btnRecalibrate = document.getElementById('btn-recalibrate');
  const rangeMmPerPx = document.getElementById('input-mm-per-px');
  const mmPerPxValue = document.getElementById('mm-per-px-value');

  const syncCanvasSize = () => {
    if (!canvasElement || !videoElement) return;
    const { clientWidth, clientHeight } = videoElement;
    canvasElement.width = clientWidth;
    canvasElement.height = clientHeight;
  };

  const updateMmPerPixel = (value) => {
    calibrationState.mmPerPixel = Number(value);
    mmPerPxValue.textContent = calibrationState.mmPerPixel.toFixed(1);
  };

  updateMmPerPixel(rangeMmPerPx.value);

  rangeMmPerPx.addEventListener('input', (event) => {
    updateMmPerPixel(event.target.value);
  });

  btnStart.addEventListener('click', async () => {
    btnStart.disabled = true;
    try {
      await startCamera(videoElement);
      syncCanvasSize();
      calibrationState.isValid = true;
      btnRecalibrate.disabled = false;
    } catch (err) {
      console.error(err);
      btnStart.disabled = false;
    }
  });

  btnRecalibrate.addEventListener('click', () => {
    syncCanvasSize();
    calibrationState.isValid = true;
  });

  window.addEventListener('resize', syncCanvasSize);
}
