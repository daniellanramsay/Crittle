// Hand tracking in a module worker (Phase 0 worker decision, DECISIONS §3), so
// MediaPipe's start-up and its detections don't block the page. hands.js
// fetches every file this worker needs and hands them over, so the worker
// never fetches anything itself: some browsers send a worker's own requests
// past the service worker, which would break offline use.

let create = null; // makes a landmarker for 'GPU' or 'CPU' once the files have arrived
let landmarker = null;
let delegate = 'GPU';
let detected = false; // whether any detection has succeeded yet
let lastTimestamp = -Infinity;

forwardConsole();

self.addEventListener('message', ({ data }) => {
  if (data.type === 'start') start(data);
  else if (data.type === 'detect') detect(data.frame, data.timestamp);
});

async function start({ files, canvas, options }) {
  try {
    const { HandLandmarker } = await import(addressOf(files.bundle, 'text/javascript'));
    const wasmBinaryPath = addressOf(files.wasm, 'application/wasm');
    const modelAssetBuffer = new Uint8Array(await files.model.arrayBuffer());
    // MediaPipe's loader sets a global each time it runs, and a module runs only
    // once per address, so each landmarker gets the loader at a fresh address.
    // The page's canvas (see hands.js) goes to the GPU detector only; if the GPU
    // fails, the CPU detector starts without it.
    create = (choice) => HandLandmarker.createFromOptions(
      { wasmLoaderPath: addressOf(files.loader, 'text/javascript'), wasmBinaryPath },
      {
        baseOptions: { modelAssetBuffer, delegate: choice },
        runningMode: 'VIDEO',
        ...(choice === 'GPU' ? { canvas } : {}),
        ...options,
      },
    );
    try {
      landmarker = await create('GPU');
    } catch (error) {
      console.warn('Hand tracking: the GPU delegate failed to start, so it uses the CPU.', error);
      delegate = 'CPU';
      landmarker = await create('CPU');
    }
    self.postMessage({ type: 'ready', delegate, connections: HandLandmarker.HAND_CONNECTIONS });
  } catch (error) {
    self.postMessage({ type: 'failed', error: serialise(error) });
  }
}

function addressOf(blob, type) {
  return URL.createObjectURL(new Blob([blob], { type }));
}

// Detects hands in one frame and always answers, with landmarks only when a
// detection ran, so hands.js knows when to send the next frame.
function detect(frame, timestamp) {
  let landmarks = null;
  let ms = 0;
  // detectForVideo needs a strictly increasing timestamp (PLAN §6.1 step 3).
  if (landmarker && timestamp > lastTimestamp) {
    lastTimestamp = timestamp;
    const started = performance.now();
    try {
      landmarks = landmarker.detectForVideo(frame, timestamp).landmarks;
      ms = performance.now() - started;
      detected = true;
    } catch (error) {
      onDetectionError(error);
    }
  }
  frame.close();
  self.postMessage({ type: 'done', landmarks, timestamp, ms });
}

// GPU creation can succeed while detection still fails: if the very first
// detection fails on the GPU, switch to the CPU once (PLAN §6.1 step 2).
function onDetectionError(error) {
  const failed = landmarker;
  landmarker = null;
  if (detected || delegate !== 'GPU') {
    console.error('Hand tracking stopped: a detection failed.', error);
    setStatus('failed');
    return;
  }
  console.warn('Hand tracking: the first detection on the GPU failed, so it switches to the CPU.', error);
  setStatus('switching');
  try {
    failed.close();
  } catch {
    // It has already failed; the CPU detector replaces it either way.
  }
  create('CPU').then(
    (cpu) => {
      landmarker = cpu;
      delegate = 'CPU';
      setStatus('CPU');
    },
    (cpuError) => {
      console.error('Hand tracking could not start on the CPU either.', cpuError);
      setStatus('failed');
    },
  );
}

function setStatus(status) {
  self.postMessage({ type: 'status', status });
}

// A worker's errors and warnings don't reach the page's console, where the
// error log listens (PLAN §4.5 rule 11), so they go to hands.js as messages.
function forwardConsole() {
  for (const level of ['error', 'warn']) {
    const original = console[level];
    console[level] = function (...args) {
      self.postMessage({ type: 'log', level, parts: args.map(serialise) });
      return original.apply(this, args);
    };
  }
  // Cancelling stops each error also reaching the page as a worker error.
  self.addEventListener('error', (event) => {
    event.preventDefault();
    self.postMessage({ type: 'log', level: 'error', parts: ['Hand-tracking worker:', serialise(event.error ?? event.message)] });
  });
  self.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    self.postMessage({ type: 'log', level: 'error', parts: ['Unhandled promise rejection in the hand-tracking worker:', serialise(event.reason)] });
  });
}

// Makes a logged value safe to post: error-like values keep their name,
// message and stack, so the error log shows them in full.
function serialise(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Error || (typeof value?.name === 'string' && typeof value?.message === 'string')) {
    return { name: value.name, message: value.message, stack: typeof value.stack === 'string' ? value.stack : '' };
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
