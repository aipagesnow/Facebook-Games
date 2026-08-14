/* Bare Android WebView / Capacitor stub. Not a shippable game. */
(function () {
  const btn = document.getElementById('share');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const payload = { title: 'Word Streak Duels', text: 'I just played a 60s word ladder.' };
    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch {
        /* user cancelled */
      }
      return;
    }
    console.log('Share stub', payload);
  });
})();
