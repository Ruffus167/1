(() => {
  let closeTimer;

  window.showLegendaryCelebration = (name, symbol = '✨') => {
    let dialog = document.querySelector('#legendaryCelebrationDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'legendaryCelebrationDialog';
      dialog.className = 'legendary-celebration';
      dialog.setAttribute('aria-labelledby', 'legendaryCelebrationTitle');

      const sparkles = document.createElement('div');
      sparkles.className = 'legendary-celebration-sparkles';
      sparkles.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < 18; index += 1) {
        const sparkle = document.createElement('span');
        sparkle.textContent = ['✦', '✧', '✴'][index % 3];
        sparkle.style.setProperty('--sparkle-left', `${(index * 37) % 97}%`);
        sparkle.style.setProperty('--sparkle-delay', `${(index % 6) * -0.3}s`);
        sparkles.append(sparkle);
      }

      const icon = document.createElement('span');
      icon.className = 'legendary-celebration-icon';
      icon.setAttribute('aria-hidden', 'true');

      const card = document.createElement('div');
      card.className = 'legendary-celebration-card';
      const eyebrow = document.createElement('p');
      eyebrow.className = 'legendary-celebration-eyebrow';
      eyebrow.textContent = 'LEGENDARY UNLOCKED';
      const title = document.createElement('h2');
      title.id = 'legendaryCelebrationTitle';
      const message = document.createElement('p');
      message.textContent = 'A rare find has joined your collection.';
      const button = document.createElement('button');
      button.className = 'legendary-celebration-continue';
      button.type = 'button';
      button.textContent = 'Continue';
      button.autofocus = true;
      button.addEventListener('click', () => dialog.close());
      card.append(eyebrow, title, message, button);
      dialog.append(sparkles, icon, card);
      dialog.addEventListener('close', () => window.clearTimeout(closeTimer));
      document.body.append(dialog);
    }

    dialog.querySelector('.legendary-celebration-icon').textContent = symbol;
    dialog.querySelector('#legendaryCelebrationTitle').textContent = name;
    if (!dialog.open) dialog.showModal();
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (dialog.open) dialog.close();
    }, 3_600);
  };
})();
