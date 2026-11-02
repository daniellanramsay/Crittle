// The heads-up display: five meter bars, the mood (PLAN §5.4), the Settings
// panel with the Live/Relaxed switch (D4) and the version, and on-screen
// messages. The version label in the corner belongs to errorlog.js, so it
// works even if the game fails to load.

const METERS = [
  ['hunger', 'Hunger'],
  ['thirst', 'Thirst'],
  ['fun', 'Fun'],
  ['affection', 'Affection'],
  ['energy', 'Energy'],
];

export function createHud({ version, onModeChange }) {
  const $ = (id) => document.getElementById(id);
  const settings = $('settings');
  const moodText = $('mood');
  const modeInputs = [...document.querySelectorAll('input[name="mode"]')];
  const meters = new Map(METERS.map(([key, label]) => [key, addMeter(key, label)]));
  let shown = { mood: null, mode: null };

  $('settings-version').textContent = `Version ${version}`;
  $('settings-button').addEventListener('click', () => settings.showModal());
  $('settings-close').addEventListener('click', () => settings.close());
  for (const input of modeInputs) {
    input.addEventListener('change', () => {
      if (input.checked) onModeChange(input.value);
    });
  }
  $('message-close').addEventListener('click', () => {
    $('message').hidden = true;
  });

  return {
    // needs, the mood's name and label, the lowest need and the needs mode;
    // the page changes only where a value changed.
    update({ needs, mood, moodLabel, lowest, mode }) {
      const low = mood === 'attention' || mood === 'urgent';
      for (const [key, meter] of meters) {
        const value = needs[key];
        if (meter.value !== value) {
          meter.value = value;
          meter.number.textContent = String(value);
          meter.fill.style.width = `${value}%`;
          meter.bar.setAttribute('aria-valuenow', String(value));
        }
        // The lowest need pulses below 30 (PLAN §5.4); the mood label names it too.
        meter.row.classList.toggle('low', low && key === lowest);
      }
      if (shown.mood !== moodLabel) {
        shown.mood = moodLabel;
        moodText.textContent = `Mood: ${moodLabel}`;
      }
      if (shown.mode !== mode) {
        shown.mode = mode;
        for (const input of modeInputs) input.checked = input.value === mode;
      }
    },
    showMessage(text) {
      $('message-text').textContent = text;
      $('message').hidden = false;
    },
  };

  function addMeter(key, label) {
    const row = document.createElement('div');
    row.className = 'meter';
    const name = document.createElement('span');
    name.className = 'meter-label';
    name.textContent = label;
    const number = document.createElement('span');
    number.className = 'meter-number';
    const bar = document.createElement('span');
    bar.className = 'meter-bar';
    bar.setAttribute('role', 'meter');
    bar.setAttribute('aria-label', label);
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    const fill = document.createElement('span');
    fill.className = 'meter-fill';
    bar.append(fill);
    row.append(name, number, bar);
    $('meters').append(row);
    return { row, number, bar, fill, value: null };
  }
}
