// The on-screen error log (A6). The iPad has no developer console, so errors,
// warnings and files that fail to load are also kept here, with a Copy button.
// index.html loads this file on its own, before main.js, and it has no static
// imports, so a file that fails elsewhere can't stop it (DECISIONS §3).
//
// Since Phase 1 the log is the developer panel's Errors tab. This file still
// owns the version label (its text, error badge and 5 taps) and opens and
// closes the panel, so the Errors tab works even if the game fails to load.

const entries = []; // { time, level, message, stack }, oldest first
let version = '?';
let settings = null; // numbers from config.js, once it has loaded
let taps = []; // times of recent taps on the version label
let adding = false;

capture();

const $ = (id) => document.getElementById(id);
const label = $('version-label');
const badge = $('error-badge');
const panel = $('devpanel');
const summary = $('errorlog-summary');
const list = $('errorlog-entries');
const note = $('errorlog-note');

wireUp();
loadSettings();

function capture() {
  // The capture phase also sees elements such as <script> that fail to load;
  // their error events never reach window.onerror.
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', (event) => {
    add('error', ['Unhandled promise rejection:', event.reason]);
  });
  for (const level of ['error', 'warn']) {
    const original = console[level];
    console[level] = function (...args) {
      add(level, args);
      return original.apply(this, args);
    };
  }
}

function onError(event) {
  if (event instanceof ErrorEvent) {
    const place = event.filename ? ` (${event.filename}:${event.lineno}:${event.colno})` : '';
    add('error', [event.error ?? `${event.message}${place}`]);
    return;
  }
  const element = event.target;
  if (!(element instanceof Element)) return;
  const what = element.src || element.href || `a <${element.localName}> element`;
  // A module script's error event also covers the files it imports.
  const imports = element.localName === 'script' ? ', or a file it imports' : '';
  add('error', [`Failed to load ${what}${imports}`]);
}

function add(level, args) {
  if (adding) return; // never loops if showing an entry logs another one
  adding = true;
  try {
    const message = args.map(describe).join(' ');
    entries.push({
      // Real wall-clock time on purpose: log times must not follow the
      // developer clock that Phase 1 adds.
      time: new Date().toISOString(),
      level: levelOf(message, level),
      message,
      stack: stackOf(args.find(isErrorLike)),
    });
    trim();
    render();
  } catch {
    // The log itself failed; there is nowhere left to report it.
  } finally {
    adding = false;
  }
}

// MediaPipe prints its own log lines through console.error, each marked with
// its level: "I0000 …" or "INFO: …" for notes, "W0000 …" for warnings. Those
// keep their own level, so the badge counts only real errors.
function levelOf(message, level) {
  const mark = /^(?:([IWEF])\d{4} |(INFO|WARNING|ERROR): )/.exec(message);
  if (!mark) return level;
  const letter = mark[1] ?? mark[2][0];
  if (letter === 'I') return 'info';
  return letter === 'W' ? 'warn' : 'error';
}

function isErrorLike(value) {
  return value instanceof Error
    || (typeof value?.name === 'string' && typeof value?.message === 'string');
}

function describe(value) {
  if (typeof value === 'string') return value;
  if (isErrorLike(value)) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

// Chrome's stack repeats the message on its first line; Safari's doesn't.
function stackOf(error) {
  const stack = typeof error?.stack === 'string' ? error.stack : '';
  const first = `${error?.name}: ${error?.message}`;
  return stack.startsWith(first) ? stack.slice(first.length).replace(/^\n/, '') : stack;
}

function trim() {
  if (settings && entries.length > settings.maxEntries) {
    entries.splice(0, entries.length - settings.maxEntries);
  }
}

function format({ time, level, message, stack }) {
  const line = `[${time}] v${version} ${level}: ${message}`;
  return stack ? `${line}\n${stack.replace(/^/gm, '  ')}` : line;
}

function render() {
  const errors = entries.filter((entry) => entry.level === 'error').length;
  if (badge) {
    badge.hidden = errors === 0;
    badge.textContent = String(errors);
  }
  if (panel?.open) {
    const count = entries.length === 1 ? '1 entry' : `${entries.length} entries`;
    summary.textContent = `Version ${version}. ${count}, newest last.`;
    list.textContent = entries.length > 0 ? entries.map(format).join('\n') : 'No entries.';
    list.scrollTop = list.scrollHeight;
  }
}

function wireUp() {
  label?.addEventListener('click', onLabelTap);
  $('errorlog-copy')?.addEventListener('click', copy);
  $('errorlog-clear')?.addEventListener('click', () => {
    entries.length = 0;
    note.textContent = '';
    render();
  });
  $('errorlog-test')?.addEventListener('click', () => {
    // A real uncaught error, so the whole capture path is tested.
    setTimeout(() => {
      throw new Error('Test error from the Test error button');
    });
  });
  $('devpanel-close')?.addEventListener('click', () => panel.close());
}

// 5 taps within 3 s open the developer panel (PLAN §4.8; the numbers live in
// config.js).
function onLabelTap() {
  if (!settings) return;
  const now = performance.now();
  taps = taps.filter((time) => now - time <= settings.withinMs);
  taps.push(now);
  if (taps.length >= settings.taps) {
    taps = [];
    open();
  }
}

// The panel is non-modal, so the game stays usable beside it. showErrors
// turns to the Errors tab, for when the log opens by itself.
function open(showErrors = false) {
  if (!panel) return;
  if (showErrors) showErrorsTab();
  if (panel.open) return;
  note.textContent = '';
  if (typeof panel.show === 'function') panel.show();
  else panel.setAttribute('open', '');
  render();
}

// devpanel.js switches tabs the same way: aria-selected on the tab, hidden on
// its section.
function showErrorsTab() {
  for (const tab of panel.querySelectorAll('[role="tab"]')) {
    const errors = tab.dataset.tab === 'errors';
    tab.setAttribute('aria-selected', String(errors));
    const section = document.getElementById(tab.getAttribute('aria-controls'));
    if (section) section.hidden = !errors;
  }
}

async function copy() {
  const text = [`My Virtual Pet error log, version ${version}`, ...entries.map(format)].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    note.textContent = 'Copied.';
  } catch {
    // The Clipboard API is missing or was refused: select the text instead.
    const range = document.createRange();
    range.selectNodeContents(list);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    note.textContent = "Couldn't copy automatically. The log is selected: press Ctrl+C, or tap Copy in the iPad's menu.";
  }
}

// The version and numbers arrive through import() rather than static imports,
// so a broken version.js or config.js shows up here instead of stopping the log.
function loadSettings() {
  import('../version.js')
    .then((module) => {
      version = module.APP_VERSION;
      const text = $('version-text');
      if (text) text.textContent = `v${version}`;
      render();
    })
    .catch((error) => add('error', ['The error log could not load version.js:', error]));
  import('../config.js')
    .then(({ config }) => {
      settings = {
        maxEntries: config.errorLog.maxEntries,
        taps: config.devAccess.taps,
        withinMs: config.devAccess.withinMs,
      };
      trim();
      render();
    })
    .catch((error) => {
      add('error', ['The error log could not load config.js:', error]);
      open(true); // without its numbers it can't count taps, so it opens by itself
    });
}
