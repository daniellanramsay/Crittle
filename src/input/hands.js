// The MediaPipe Hand Landmarker wrapper (PLAN §6.1). Detection runs in a module
// worker, src/input/hands.worker.js, so it doesn't block the page (Phase 0
// worker decision, DECISIONS §3); if the worker can't start, detection runs on
// the page instead. Either way it detects only on new video frames and keeps
// the detection rate and time for the readouts.

// These resolve against the page's address, like every path the page fetches.
const WORKER = './src/input/hands.worker.js';
const BUNDLE = './vendor/mediapipe/vision_bundle.mjs';
const WASM_FOLDER = './vendor/mediapipe/wasm';
const MODEL = './vendor/mediapipe/hand_landmarker.task';

export async function loadHands(options) {
  try {
    return await loadInWorker(options);
  } catch (error) {
    console.warn('Hand tracking: the worker could not start, so it runs on the page instead.', error);
    return loadOnPage(options);
  }
}

// The page fetches the worker and MediaPipe's files itself, so the service
// worker stores them for offline use, and hands them to the worker.
async function loadInWorker({
  numHands,
  minHandDetectionConfidence,
  minHandPresenceConfidence,
  minTrackingConfidence,
  averageOver,
}) {
  const [code, bundle, loader, wasm, model] = await Promise.all([
    WORKER,
    BUNDLE,
    `${WASM_FOLDER}/vision_wasm_module_internal.js`,
    `${WASM_FOLDER}/vision_wasm_module_internal.wasm`,
    MODEL,
  ].map(fetchBlob));
  // MediaPipe draws through a canvas that belongs to the page. With a canvas of
  // the worker's own, the browser didn't reuse its stored graphics setup, and
  // every first detection took about 14 s instead of under 1 s (DECISIONS §3).
  const canvas = document.createElement('canvas').transferControlToOffscreen();
  const worker = new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })), { type: 'module' });
  const nextFrame = createFrameGate();
  const timing = createTiming(averageOver);
  let status = 'loading'; // then 'GPU', 'CPU', 'switching' or 'failed'
  let busy = false; // a frame is with the worker; the next one waits for its answer
  let found = null; // landmarks that arrived since the last detect() call
  let copyWarned = false;

  return new Promise((resolve, reject) => {
    worker.addEventListener('message', ({ data }) => {
      if (data.type === 'ready') {
        status = data.delegate;
        resolve({
          where: 'worker',
          connections: data.connections,
          get status() {
            return status;
          },
          detect,
          stats: timing.read,
          resetStats,
        });
      } else if (data.type === 'failed') {
        worker.terminate();
        reject(data.error);
      } else if (data.type === 'status') {
        status = data.status;
      } else if (data.type === 'done') {
        busy = false;
        if (data.landmarks) {
          found = data.landmarks;
          timing.record(data.timestamp, data.ms);
        }
      } else if (data.type === 'log') {
        console[data.level](...data.parts);
      }
    });
    // Only a worker file that fails to load or run arrives here; errors inside
    // the worker come as 'log' messages. Cancelling stops the page reporting it twice.
    worker.addEventListener('error', (event) => {
      event.preventDefault();
      const reason = event.message ? `: ${event.message}` : '';
      if (status === 'loading') {
        worker.terminate();
        reject(new Error(`The hand-tracking worker failed to start${reason}`));
      } else {
        status = 'failed';
        console.error(`Hand tracking stopped: the worker failed${reason}`);
      }
    });
    worker.postMessage({
      type: 'start',
      files: { bundle, loader, wasm, model },
      canvas,
      options: { numHands, minHandDetectionConfidence, minHandPresenceConfidence, minTrackingConfidence },
    }, [canvas]);
  });

  // Sends the next new frame when the worker is free, and returns the
  // landmarks that arrived since the last call, or null.
  function detect(video) {
    if (!busy && (status === 'GPU' || status === 'CPU')) {
      const timestamp = nextFrame(video);
      if (timestamp !== null) send(video, timestamp);
    }
    const result = found;
    found = null;
    return result;
  }

  // The frame is copied once into an ImageBitmap, which then moves to the worker.
  function send(video, timestamp) {
    busy = true;
    createImageBitmap(video).then(
      (frame) => worker.postMessage({ type: 'detect', frame, timestamp }, [frame]),
      (error) => {
        busy = false;
        if (copyWarned) return; // once is enough; a failing copy would fill the log
        copyWarned = true;
        console.warn('Hand tracking: a video frame could not be copied for the worker.', error);
      },
    );
  }

  // A stopped camera also drops landmarks still on their way.
  function resetStats() {
    timing.reset();
    found = null;
  }
}

// Detection on the page, as Phase 0 first built it: the fallback for browsers
// whose workers can't run MediaPipe.
async function loadOnPage({
  numHands,
  minHandDetectionConfidence,
  minHandPresenceConfidence,
  minTrackingConfidence,
  averageOver,
}) {
  // Loaded when the camera first starts, so a failed load can't stop the page,
  // and the service worker stores the bundle then (DECISIONS §3). This import
  // resolves against this file's address.
  const { FilesetResolver, HandLandmarker } = await import('../../vendor/mediapipe/vision_bundle.mjs');
  const fileset = await FilesetResolver.forVisionTasks(WASM_FOLDER);
  const create = (delegate) => HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate },
    runningMode: 'VIDEO',
    numHands,
    minHandDetectionConfidence,
    minHandPresenceConfidence,
    minTrackingConfidence,
  });

  let delegate = 'GPU';
  let landmarker;
  try {
    landmarker = await create('GPU');
  } catch (error) {
    console.warn('Hand tracking: the GPU delegate failed to start, so it uses the CPU.', error);
    delegate = 'CPU';
    landmarker = await create('CPU');
  }

  let status = delegate; // 'GPU', 'CPU', 'switching' or 'failed'
  let detected = false; // whether any detection has succeeded yet
  const nextFrame = createFrameGate();
  const timing = createTiming(averageOver);

  return {
    where: 'page',
    connections: HandLandmarker.HAND_CONNECTIONS,
    get status() {
      return status;
    },
    detect,
    stats: timing.read,
    resetStats: timing.reset,
  };

  // Returns the landmarks of each hand found in a new video frame (an empty
  // list when there is none), or null when there is no new frame to look at.
  function detect(video) {
    if (status !== 'GPU' && status !== 'CPU') return null;
    const timestamp = nextFrame(video);
    if (timestamp === null) return null;
    let result;
    try {
      result = landmarker.detectForVideo(video, timestamp);
    } catch (error) {
      onDetectionError(error);
      return null;
    }
    detected = true;
    timing.record(timestamp, performance.now() - timestamp);
    return result.landmarks;
  }

  // GPU creation can succeed while detection still fails: if the very first
  // detection fails on the GPU, switch to the CPU once (PLAN §6.1 step 2).
  function onDetectionError(error) {
    if (detected || delegate !== 'GPU') {
      status = 'failed';
      console.error('Hand tracking stopped: a detection failed.', error);
      return;
    }
    console.warn('Hand tracking: the first detection on the GPU failed, so it switches to the CPU.', error);
    status = 'switching';
    try {
      landmarker.close();
    } catch {
      // It has already failed; the CPU detector replaces it either way.
    }
    create('CPU').then(
      (cpu) => {
        landmarker = cpu;
        delegate = 'CPU';
        status = 'CPU';
      },
      (cpuError) => {
        status = 'failed';
        console.error('Hand tracking could not start on the CPU either.', cpuError);
      },
    );
  }
}

async function fetchBlob(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} could not be loaded (HTTP ${response.status})`);
  return response.blob();
}

// Lets each new video frame through once, with a strictly increasing
// timestamp, as detectForVideo needs (PLAN §6.1 step 3).
function createFrameGate() {
  let lastVideoTime = -1;
  let lastTimestamp = -Infinity;
  return (video) => {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) return null;
    if (video.currentTime === lastVideoTime) return null;
    const timestamp = performance.now();
    if (timestamp <= lastTimestamp) return null;
    lastVideoTime = video.currentTime;
    lastTimestamp = timestamp;
    return timestamp;
  };
}

// The detection rate and the average detection time over the last averageOver
// detections, and how many detections that covers so far.
function createTiming(averageOver) {
  const times = []; // when each of the last averageOver detections started
  const durations = []; // how long each one took, in ms
  return {
    record(timestamp, ms) {
      times.push(timestamp);
      durations.push(ms);
      if (times.length > averageOver) {
        times.shift();
        durations.shift();
      }
    },
    read() {
      const count = times.length;
      return {
        count,
        rate: count > 1 ? ((count - 1) * 1000) / (times[count - 1] - times[0]) : 0,
        time: count > 0 ? durations.reduce((sum, ms) => sum + ms, 0) / count : 0,
      };
    },
    reset() {
      times.length = 0;
      durations.length = 0;
    },
  };
}
