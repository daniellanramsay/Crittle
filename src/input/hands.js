// The MediaPipe Hand Landmarker wrapper, Phase 0 version (PLAN §6.1). It loads
// the vendored bundle on first use, detects only on new video frames, and keeps
// the detection rate and time for the readouts.

// These two resolve against the page's address; the import below resolves
// against this file's.
const WASM_FOLDER = './vendor/mediapipe/wasm';
const MODEL = './vendor/mediapipe/hand_landmarker.task';

export async function loadHands({
  numHands,
  minHandDetectionConfidence,
  minHandPresenceConfidence,
  minTrackingConfidence,
  averageOver,
}) {
  // Loaded when the camera first starts, so a failed load can't stop the page,
  // and the service worker stores the bundle then (DECISIONS §3).
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
  let lastVideoTime = -1;
  let lastTimestamp = -Infinity;
  const times = []; // when each of the last averageOver detections started
  const durations = []; // how long each one took, in ms

  return {
    connections: HandLandmarker.HAND_CONNECTIONS,
    get status() {
      return status;
    },
    detect,
    stats,
    resetStats,
  };

  // Returns the landmarks of each hand found in a new video frame (an empty
  // list when there is none), or null when there is no new frame to look at.
  function detect(video) {
    if (status !== 'GPU' && status !== 'CPU') return null;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) return null;
    if (video.currentTime === lastVideoTime) return null;
    // detectForVideo needs a strictly increasing timestamp (PLAN §6.1 step 3).
    const timestamp = performance.now();
    if (timestamp <= lastTimestamp) return null;
    lastVideoTime = video.currentTime;
    lastTimestamp = timestamp;
    let result;
    try {
      result = landmarker.detectForVideo(video, timestamp);
    } catch (error) {
      onDetectionError(error);
      return null;
    }
    detected = true;
    record(timestamp, performance.now() - timestamp);
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

  function record(timestamp, ms) {
    times.push(timestamp);
    durations.push(ms);
    if (times.length > averageOver) {
      times.shift();
      durations.shift();
    }
  }

  // The detection rate and the average detection time over the last
  // averageOver detections, and how many detections that covers so far.
  function stats() {
    const count = times.length;
    return {
      count,
      rate: count > 1 ? ((count - 1) * 1000) / (times[count - 1] - times[0]) : 0,
      time: count > 0 ? durations.reduce((sum, ms) => sum + ms, 0) / count : 0,
    };
  }

  function resetStats() {
    times.length = 0;
    durations.length = 0;
  }
}
