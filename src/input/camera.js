// Starts, stops and retries the camera (PLAN §6.6). The first start after each
// launch comes from a tap: main.js calls start() only from a button's click.
// After that the camera stops while the page is hidden and restarts by itself
// on return. Frames are only shown and handed to the detector; they are never
// stored or sent.

export function createCamera({ video, constraints, startTimeoutMs, onChange }) {
  let state = 'off'; // off, starting, on or failed
  let stream = null;
  let attempt = 0; // raised by every start and release, so a late result from an older start is ignored
  let resumeOnShow = false;

  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    get state() {
      return state;
    },
    start,
    stop() {
      resumeOnShow = false;
      release();
      setState('off');
    },
  };

  async function start() {
    if (state === 'starting' || state === 'on') return;
    const id = ++attempt;
    setState('starting');
    try {
      if (!navigator.mediaDevices) {
        throw new Error('No camera access here: the page must come from https:// or localhost');
      }
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (id !== attempt) {
        stopTracks(newStream);
        return;
      }
      stream = newStream;
      // A stream that ends by itself, early or late, counts as a failure.
      // (Stopping a track ourselves doesn't fire 'ended'.)
      for (const track of stream.getTracks()) {
        track.addEventListener('ended', () => {
          if (id === attempt) fail(new Error('The camera stream ended'));
        });
      }
      video.muted = true;
      video.srcObject = stream;
      await Promise.all([video.play(), firstFrame()]);
      if (id === attempt) setState('on');
    } catch (error) {
      if (id === attempt) fail(error);
    }
  }

  // Resolves once the video has a frame to show; fails if none arrives within
  // startTimeoutMs of the stream arriving, so time spent on the permission
  // prompt doesn't count.
  function firstFrame() {
    return new Promise((resolve, reject) => {
      const events = ['loadeddata', 'playing', 'resize'];
      const timer = setTimeout(() => {
        done(reject, new Error(`No camera frame within ${startTimeoutMs} ms`));
      }, startTimeoutMs);
      const check = () => {
        if (video.videoWidth > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) done(resolve);
      };
      function done(settle, value) {
        clearTimeout(timer);
        for (const name of events) video.removeEventListener(name, check);
        settle(value);
      }
      for (const name of events) video.addEventListener(name, check);
      check();
    });
  }

  function fail(error) {
    console.error('Camera failed:', error);
    release();
    setState('failed');
  }

  // Stops every track and detaches the stream. Raising attempt makes a start
  // that is still in progress ignore its result.
  function release() {
    attempt += 1;
    if (stream) stopTracks(stream);
    stream = null;
    video.srcObject = null;
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      if (state === 'starting' || state === 'on') {
        release();
        resumeOnShow = true;
        setState('off');
      }
    } else if (resumeOnShow) {
      resumeOnShow = false;
      start();
    }
  }

  function setState(next) {
    state = next;
    onChange?.(next);
  }
}

function stopTracks(mediaStream) {
  for (const track of mediaStream.getTracks()) track.stop();
}
