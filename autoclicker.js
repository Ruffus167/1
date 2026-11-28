(() => {
  const STORAGE_KEY = 'hoilday-auto-clicker-settings';
  const DEFAULTS = { interval: 500, clickCount: 25, hotkey: 'Space' };
  const MIN_INTERVAL = 50;
  const MAX_INTERVAL = 60_000;
  const MAX_CLICKS = 100_000;
  let settings = { ...DEFAULTS };
  let statusMessage = '';
  let pointerPosition = null;
  let running = false;
  let intervalId = null;
  let clicksRemaining = 0;
  let clicksCompleted = 0;

  function isValidHotkey(value) {
    return value === 'Space' || /^[a-z0-9]$/i.test(value);
  }

  function setStatus(message) {
    statusMessage = message;
    const status = document.querySelector('#hoildayAutoClickerStatus');
    if (status) status.textContent = message;
    document.dispatchEvent(new CustomEvent('hoilday-autoclicker-status', { detail: message }));
  }

  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.hotkey === 'F6') parsed.hotkey = DEFAULTS.hotkey;
      if (
        Number.isInteger(parsed.interval) && parsed.interval >= MIN_INTERVAL && parsed.interval <= MAX_INTERVAL &&
        Number.isInteger(parsed.clickCount) && parsed.clickCount >= 1 && parsed.clickCount <= MAX_CLICKS &&
        typeof parsed.hotkey === 'string' && isValidHotkey(parsed.hotkey)
      ) {
        settings = { ...DEFAULTS, ...parsed };
      } else {
        throw new Error('Saved Auto Clicker settings are invalid.');
      }
    }
  } catch (error) {
    statusMessage = `Settings could not be loaded: ${error.message}`;
  }

  const host = document.createElement('div');
  host.id = 'hoildayAutoClicker';
  host.className = 'hoilday-autoclicker';
  const launcher = document.createElement('button');
  launcher.className = 'hoilday-autoclicker-launcher';
  launcher.type = 'button';
  launcher.textContent = '🖱️';
  launcher.setAttribute('aria-label', 'Open Hoilday Auto Clicker');
  launcher.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('section');
  panel.className = 'hoilday-autoclicker-panel';
  panel.setAttribute('aria-label', 'Hoilday Auto Clicker controls');
  panel.hidden = true;

  const header = document.createElement('header');
  header.className = 'hoilday-autoclicker-header';
  const heading = document.createElement('strong');
  heading.textContent = 'Auto Clicker';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'hoilday-autoclicker-close';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close Auto Clicker controls');
  header.append(heading, closeButton);

  const description = document.createElement('p');
  description.className = 'hoilday-autoclicker-description';
  description.textContent = 'Move your pointer over a Hoilday target. Press the hotkey or Start to click it.';

  const form = document.createElement('div');
  form.className = 'hoilday-autoclicker-form';
  const intervalLabel = document.createElement('label');
  intervalLabel.textContent = 'Interval (ms)';
  const intervalInput = document.createElement('input');
  intervalInput.type = 'number';
  intervalInput.min = String(MIN_INTERVAL);
  intervalInput.max = String(MAX_INTERVAL);
  intervalInput.step = '10';
  intervalInput.inputMode = 'numeric';
  intervalLabel.append(intervalInput);

  const countLabel = document.createElement('label');
  countLabel.textContent = 'Click count';
  const countInput = document.createElement('input');
  countInput.type = 'number';
  countInput.min = '1';
  countInput.max = String(MAX_CLICKS);
  countInput.step = '1';
  countInput.inputMode = 'numeric';
  countLabel.append(countInput);

  const hotkeyLabel = document.createElement('label');
  hotkeyLabel.textContent = 'Start / stop hotkey';
  const hotkeyInput = document.createElement('input');
  hotkeyInput.type = 'text';
  hotkeyInput.maxLength = '5';
  hotkeyInput.placeholder = 'Space or letter';
  hotkeyInput.autocomplete = 'off';
  hotkeyInput.spellcheck = false;
  hotkeyInput.setAttribute('aria-label', 'Start and stop hotkey');
  hotkeyLabel.append(hotkeyInput);
  form.append(intervalLabel, countLabel, hotkeyLabel);

  const armButton = document.createElement('button');
  armButton.type = 'button';
  armButton.className = 'hoilday-autoclicker-arm';
  const status = document.createElement('p');
  status.id = 'hoildayAutoClickerStatus';
  status.className = 'hoilday-autoclicker-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  panel.append(header, description, form, armButton, status);
  host.append(launcher, panel);
  document.body.append(host);

  function announce(message) {
    setStatus(message);
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      announce(`Settings could not be saved: ${error.message}`);
      return false;
    }
    document.dispatchEvent(new CustomEvent('hoilday-autoclicker-settings', { detail: { ...settings } }));
    return true;
  }

  function renderControls() {
    intervalInput.value = String(settings.interval);
    countInput.value = String(settings.clickCount);
    hotkeyInput.value = settings.hotkey;
    armButton.textContent = running ? 'Stop clicking' : 'Start clicking';
    armButton.disabled = false;
    intervalInput.disabled = running;
    countInput.disabled = running;
    hotkeyInput.disabled = running;
    status.textContent = statusMessage;
    launcher.classList.toggle('is-running', running);
    launcher.setAttribute('aria-label', running ? 'Stop Hoilday Auto Clicker' : 'Open Hoilday Auto Clicker');
  }

  function setSetting(key, value, input) {
    const previous = settings[key];
    settings[key] = value;
    if (!saveSettings()) {
      settings[key] = previous;
      input.value = String(previous);
    }
    renderControls();
  }

  intervalInput.addEventListener('change', () => {
    const interval = Number(intervalInput.value);
    if (!Number.isInteger(interval) || interval < MIN_INTERVAL || interval > MAX_INTERVAL) {
      intervalInput.value = String(settings.interval);
      announce(`Choose an interval from ${MIN_INTERVAL} to ${MAX_INTERVAL} milliseconds.`);
      return;
    }
    setSetting('interval', interval, intervalInput);
  });

  countInput.addEventListener('change', () => {
    const clickCount = Number(countInput.value);
    if (!Number.isInteger(clickCount) || clickCount < 1 || clickCount > MAX_CLICKS) {
      countInput.value = String(settings.clickCount);
      announce(`Choose between 1 and ${MAX_CLICKS} clicks per run.`);
      return;
    }
    setSetting('clickCount', clickCount, countInput);
  });

  hotkeyInput.addEventListener('change', () => {
    const input = hotkeyInput.value.trim();
    const hotkey = input.toLowerCase() === 'space'
      ? 'Space'
      : /^[a-z0-9]$/i.test(input) ? input.toLowerCase() : '';
    if (!hotkey) {
      hotkeyInput.value = settings.hotkey;
      announce('Use Space or a single letter or number.');
      return;
    }
    setSetting('hotkey', hotkey, hotkeyInput);
  });

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
  }

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    intervalInput.focus();
  }

  launcher.addEventListener('click', () => panel.hidden ? openPanel() : closePanel());
  closeButton.addEventListener('click', closePanel);

  function stop(message) {
    window.clearInterval(intervalId);
    intervalId = null;
    running = false;
    renderControls();
    if (message) announce(message);
  }

  function fireClick() {
    if (!pointerPosition) {
      stop('Move the pointer over a Hoilday target before starting.');
      return;
    }
    const { x, y } = pointerPosition;
    const target = document.elementFromPoint(x, y);
    if (!target || host.contains(target) || !target.isConnected) {
      stop('The pointer is over the Auto Clicker controls or outside the page. Clicker stopped.');
      return;
    }

    const pointerOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 1,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true
    };
    target.dispatchEvent(new PointerEvent('pointerdown', pointerOptions));
    target.dispatchEvent(new MouseEvent('mousedown', pointerOptions));
    target.dispatchEvent(new PointerEvent('pointerup', { ...pointerOptions, buttons: 0 }));
    target.dispatchEvent(new MouseEvent('mouseup', { ...pointerOptions, buttons: 0 }));
    target.dispatchEvent(new MouseEvent('click', { ...pointerOptions, buttons: 0, detail: 1 }));

    clicksRemaining -= 1;
    clicksCompleted += 1;
    if (clicksRemaining <= 0) {
      stop(`Finished ${clicksCompleted} clicks.`);
    } else {
      announce(`${clicksCompleted} of ${settings.clickCount} clicks · press ${settings.hotkey} to stop.`);
    }
  }

  function start() {
    if (!pointerPosition) {
      announce('Move the pointer over a Hoilday target before starting.');
      return;
    }
    const target = document.elementFromPoint(pointerPosition.x, pointerPosition.y);
    if (!target || host.contains(target)) {
      announce('Move the pointer over a Hoilday target, not the Auto Clicker controls.');
      return;
    }
    running = true;
    clicksRemaining = settings.clickCount;
    clicksCompleted = 0;
    renderControls();
    announce(`Clicking every ${settings.interval} ms · ${settings.clickCount} clicks · press ${settings.hotkey} to stop.`);
    fireClick();
    if (running) intervalId = window.setInterval(fireClick, settings.interval);
  }

  armButton.addEventListener('click', () => {
    if (running) {
      stop('Clicker stopped.');
    } else {
      start();
    }
  });

  document.addEventListener('pointermove', (event) => {
    if (!host.contains(event.target)) pointerPosition = { x: event.clientX, y: event.clientY };
  }, true);

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const hotkeyPressed = settings.hotkey === 'Space'
      ? event.code === 'Space'
      : event.key.toLowerCase() === settings.hotkey.toLowerCase();
    if (
      event.repeat ||
      (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) ||
      !hotkeyPressed
    ) return;
    event.preventDefault();
    if (running) stop('Clicker stopped.');
    else start();
  });

  window.addEventListener('beforeunload', () => stop('Clicker stopped because the page changed.'));
  window.HoildayAutoClicker = Object.freeze({ open: openPanel, close: closePanel });

  renderControls();
  if (!statusMessage) announce(`Ready · ${settings.interval} ms · ${settings.clickCount} clicks · ${settings.hotkey} toggle.`);
})();
