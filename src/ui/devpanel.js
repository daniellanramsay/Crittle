// The developer panel (A4): the Time, Meters and Save tabs. The Errors tab is
// the error log (A6). errorlog.js fills it, opens the panel after 5 taps on
// the version label and closes it, so the panel and its Errors tab still work
// if the game fails to load (DECISIONS §3).
//
// game is main.js's set of developer controls: awayFor, inAppFor, setSpeed,
// speed, clockBack, setMeter, resetMeters, setAsleep, resetSave,
// enableDevMode, and save (the current save).

const METERS = [
  ['hunger', 'Hunger'],
  ['thirst', 'Thirst'],
  ['fun', 'Fun'],
  ['affection', 'Affection'],
  ['energy', 'Energy'],
];

export function createDevPanel({ game, cfg }) {
  const $ = (id) => document.getElementById(id);
  const panel = $('devpanel');
  const tabs = [...panel.querySelectorAll('[role="tab"]')];
  const speedButtons = [];
  const meterInputs = new Map();
  let wasOpen = false;

  buildTime($('devpanel-time'));
  buildMeters($('devpanel-meters'));
  buildSave($('devpanel-save'));
  for (const tab of tabs) tab.addEventListener('click', () => select(tab.dataset.tab));
  select('time');

  return {
    // Called every frame; an open panel follows the save as it changes.
    update() {
      const open = panel.open;
      // Opening the panel turns on developer mode (DECISIONS §3).
      if (open && !wasOpen) game.enableDevMode();
      wasOpen = open;
      if (open) refresh();
    },
  };

  function select(name) {
    for (const tab of tabs) {
      const selected = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', String(selected));
      $(tab.getAttribute('aria-controls')).hidden = !selected;
    }
    refresh();
  }

  function buildTime(section) {
    const { awayFor, inAppFor, speeds, clockBackMs } = cfg.devPanel;
    // The note repeats the meters, which the open panel can cover on a narrow screen.
    const note = status();
    const done = (text) => {
      const { hunger, thirst, fun, affection, energy } = game.save.needs;
      note.textContent = `Done: ${text}. Hunger ${hunger}, thirst ${thirst}, fun ${fun}, `
        + `affection ${affection}, energy ${energy}.`;
      refresh();
    };
    group(section, 'Away for', 'Catch-up at away rates. Relaxed mode freezes the needs.',
      awayFor.map((ms) => button(durationLabel(ms), () => {
        game.awayFor(ms);
        done(`away for ${durationLabel(ms)}`);
      })));
    group(section, 'In app for', 'One in-app tick for the whole time, with the cat as it is now.',
      inAppFor.map((ms) => button(durationLabel(ms), () => {
        game.inAppFor(ms);
        done(`in app for ${durationLabel(ms)}`);
      })));
    group(section, 'Speed', 'Pause stops game time; touch still works.',
      speeds.map((speed) => {
        const element = button(speed === 0 ? 'Pause' : `${speed}×`, () => {
          game.setSpeed(speed);
          done(speed === 0 ? 'paused' : `speed ${speed}×`);
        });
        speedButtons.push([speed, element]);
        return element;
      }));
    group(section, 'Clock', 'Moves the game clock back. Nothing should change.', [
      button(`Clock back ${durationLabel(clockBackMs)}`, () => {
        game.clockBack(clockBackMs);
        done(`clock back ${durationLabel(clockBackMs)}`);
      }),
    ]);
    section.append(note);
  }

  function buildMeters(section) {
    const note = status();
    const list = document.createElement('div');
    list.className = 'devpanel-meters';
    for (const [key, label] of METERS) {
      const row = document.createElement('div');
      row.className = 'devpanel-row';
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '100';
      input.step = '1';
      input.inputMode = 'numeric';
      input.id = `devpanel-meter-${key}`;
      const name = document.createElement('label');
      name.htmlFor = input.id;
      name.textContent = label;
      const set = () => {
        const value = Math.round(Number(input.value));
        if (!Number.isFinite(value) || input.value === '') return;
        const clamped = Math.min(100, Math.max(0, value));
        game.setMeter(key, clamped);
        note.textContent = `Done: ${label.toLowerCase()} set to ${clamped}.`;
        input.blur();
        refresh();
      };
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') set();
      });
      row.append(name, input, button('Set', set));
      list.append(row);
      meterInputs.set(key, input);
    }
    section.append(list);
    const actions = (text, run) => button(text, () => {
      run();
      note.textContent = `Done: ${text.toLowerCase()}.`;
      refresh();
    });
    group(section, 'Start again', 'Start values are 80, 80, 80, 80 and 90, with every progress at 0 and the cat awake.', [
      actions('Reset meters to start values', () => game.resetMeters()),
    ]);
    group(section, 'Sleep', null, [
      actions('Set asleep', () => game.setAsleep(true)),
      actions('Set awake', () => game.setAsleep(false)),
    ]);
    section.append(note);
  }

  function buildSave(section) {
    const json = document.createElement('pre');
    json.className = 'devpanel-json';
    json.id = 'devpanel-save-json';
    const confirm = document.createElement('div');
    confirm.className = 'devpanel-confirm';
    confirm.hidden = true;
    const question = document.createElement('p');
    question.textContent = 'Reset the save? This replaces the cat with a new one, and can’t be undone.';
    const ask = button('Reset save…', () => {
      confirm.hidden = false;
      ask.hidden = true;
    });
    const close = () => {
      confirm.hidden = true;
      ask.hidden = false;
    };
    confirm.append(question, button('Reset', () => {
      game.resetSave();
      close();
      refresh();
    }), button('Cancel', close));
    section.append(json, ask, confirm);
  }

  // Re-reads the save into the panel, changing the page only where a value
  // changed. An input being typed into is left alone.
  function refresh() {
    const { save } = game;
    for (const [key, input] of meterInputs) {
      const value = String(save.needs[key]);
      if (document.activeElement !== input && input.value !== value) input.value = value;
    }
    for (const [speed, element] of speedButtons) {
      const pressed = String(game.speed() === speed);
      if (element.getAttribute('aria-pressed') !== pressed) element.setAttribute('aria-pressed', pressed);
    }
    const json = $('devpanel-save-json');
    if (!$('devpanel-save').hidden) {
      const text = JSON.stringify(save, null, 2);
      if (json.textContent !== text) json.textContent = text;
    }
  }
}

function group(section, title, hint, buttons) {
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.append(heading);
  if (hint) {
    const text = document.createElement('p');
    text.className = 'devpanel-hint';
    text.textContent = hint;
    section.append(text);
  }
  const row = document.createElement('div');
  row.className = 'devpanel-buttons';
  row.append(...buttons);
  section.append(row);
}

function button(text, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = text;
  element.addEventListener('click', onClick);
  return element;
}

function status() {
  const note = document.createElement('p');
  note.className = 'devpanel-note';
  note.setAttribute('role', 'status');
  return note;
}

// 600000 → "10 min", 7200000 → "2 h", 86400000 → "1 day".
function durationLabel(ms) {
  const minutes = ms / 60_000;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours} h`;
  const days = hours / 24;
  return days === 1 ? '1 day' : `${days} days`;
}
