// The Phase 0 test page (docs/phases/phase-0.md): the camera, the hand
// landmarks drawn over the mirrored video, and readouts for the device checks.
import './ui/errorlog.js';
import { APP_VERSION } from './version.js';
import { config } from './config.js';
import { createCamera } from './input/camera.js';
import { loadHands } from './input/hands.js';

const STATUS_TEXT = {
  off: 'Camera off',
  starting: 'Camera starting…',
  on: 'Camera on',
  failed: "Camera didn't start",
};

const DELEGATE_TEXT = {
  GPU: 'GPU',
  CPU: 'CPU',
  switching: 'switching to CPU…',
  failed: 'failed',
};

const $ = (id) => document.getElementById(id);
const video = $('video');
const overlay = $('overlay');
const stage = $('stage');
const context = overlay.getContext('2d');

let hands = null; // the detector, once loaded
let handsLoading = null; // the load in progress, if any
let handsFailed = false;
let lastReadout = -Infinity;

applyColours(config.colours);
$('version-text').textContent = `v${APP_VERSION}`;
registerServiceWorker();

const camera = createCamera({ video, ...config.camera, onChange: showCameraState });
$('camera-button').addEventListener('click', turnOn);
$('retry-button').addEventListener('click', turnOn);
requestAnimationFrame(frame);

// Both buttons are taps, which the first camera start after each launch
// needs (PLAN §6.6). The detector loads on the first start.
function turnOn() {
  camera.start();
  loadHandsOnce();
}

function loadHandsOnce() {
  if (hands || handsLoading) return;
  handsFailed = false;
  handsLoading = loadHands(config.hands)
    .then((loaded) => {
      hands = loaded;
    })
    .catch((error) => {
      handsFailed = true;
      console.error('Hand tracking failed to load.', error);
    })
    .finally(() => {
      handsLoading = null;
    });
  showReadouts();
}

function showCameraState(state) {
  $('status').textContent = STATUS_TEXT[state];
  $('camera-button').hidden = state !== 'off';
  $('retry-button').hidden = state !== 'failed';
  if (state !== 'on') {
    context.clearRect(0, 0, overlay.width, overlay.height);
    hands?.resetStats();
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  if (camera.state === 'on') {
    fitStage();
    const found = hands?.detect(video);
    if (found) draw(found);
  }
  if (now - lastReadout >= config.readoutsEveryMs) {
    lastReadout = now;
    showReadouts();
  }
}

// Matches the overlay to the video's pixels and the stage to its shape. The
// iPad's camera can turn to portrait when the iPad rotates.
function fitStage() {
  const { videoWidth: width, videoHeight: height } = video;
  if (width === 0 || (overlay.width === width && overlay.height === height)) return;
  overlay.width = width;
  overlay.height = height;
  stage.style.setProperty('--ratio', String(width / height));
}

// Draws each hand's connections and 21 points in video pixels. The stage's
// CSS mirrors them together with the video (PLAN §6.1 step 4).
function draw(found) {
  const { width, height } = overlay;
  const { dotRadiusPx, dotColour, lineWidthPx, lineColour } = config.landmarks;
  context.clearRect(0, 0, width, height);
  for (const points of found) {
    context.beginPath();
    for (const { start, end } of hands.connections) {
      context.moveTo(points[start].x * width, points[start].y * height);
      context.lineTo(points[end].x * width, points[end].y * height);
    }
    context.lineWidth = lineWidthPx;
    context.strokeStyle = lineColour;
    context.stroke();
    context.fillStyle = dotColour;
    for (const { x, y } of points) {
      context.beginPath();
      context.arc(x * width, y * height, dotRadiusPx, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function showReadouts() {
  const stats = hands?.stats();
  const measured = stats && stats.count > 1;
  $('readout-rate').textContent = measured ? `${stats.rate.toFixed(1)} fps` : '–';
  $('readout-time').textContent = measured ? `${stats.time.toFixed(1)} ms (last ${stats.count})` : '–';
  $('readout-delegate').textContent = hands
    ? DELEGATE_TEXT[hands.status]
    : handsLoading ? 'loading…' : handsFailed ? 'failed' : '–';
  $('readout-video').textContent = video.videoWidth ? `${video.videoWidth} × ${video.videoHeight}` : '–';
}

// config.js holds the colours (DECISIONS §6); index.html repeats them for the
// first paint.
function applyColours({ background, text, accent, accentText }) {
  const root = document.documentElement.style;
  root.setProperty('--background', background);
  root.setProperty('--text', text);
  root.setProperty('--accent', accent);
  root.setProperty('--accent-text', accentText);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('This browser has no service workers, so the app will not open offline.');
    return;
  }
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('The service worker failed to register.', error);
  });
}
