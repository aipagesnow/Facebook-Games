/**
 * Bare Instant Games skeleton
 * - FBInstant lifecycle (initialize → loading progress → startGame)
 * - One social feature stub: share / challenge
 * Replace mock FBInstant when running inside Facebook's environment.
 */

(function () {
  const SEED = 'CRANE';
  const ROUND_SECONDS = 60;

  const el = {
    status: document.getElementById('status'),
    seed: document.getElementById('seed'),
    timer: document.getElementById('timer'),
    score: document.getElementById('score'),
    input: document.getElementById('wordInput'),
    submit: document.getElementById('submitBtn'),
    chain: document.getElementById('chain'),
    end: document.getElementById('end'),
    finalScore: document.getElementById('finalScore'),
    share: document.getElementById('shareBtn'),
    replay: document.getElementById('replayBtn'),
  };

  let score = 0;
  let remaining = ROUND_SECONDS;
  let timerId = null;
  let lastWord = SEED;
  const played = new Set([SEED.toLowerCase()]);

  /** Minimal mock so local browser preview works without the real SDK. */
  function ensureFBInstant() {
    if (typeof window.FBInstant !== 'undefined') return;
    window.FBInstant = {
      initializeAsync: () => Promise.resolve(),
      setLoadingProgress: (p) => console.log('[mock] loading', p),
      startGameAsync: () => Promise.resolve(),
      getEntryPointData: () => ({}),
      shareAsync: (payload) => {
        console.log('[mock] shareAsync', payload);
        return Promise.resolve();
      },
      player: {
        getName: () => Promise.resolve('Player'),
        getID: () => Promise.resolve('local-player'),
      },
    };
  }

  function setStatus(text) {
    el.status.textContent = text;
  }

  function renderChainWord(word) {
    const li = document.createElement('li');
    li.textContent = word.toUpperCase();
    el.chain.appendChild(li);
  }

  function endRound() {
    clearInterval(timerId);
    el.input.disabled = true;
    el.submit.disabled = true;
    el.end.hidden = false;
    el.finalScore.textContent = String(score);
    setStatus('Round complete — try the social challenge stub.');
  }

  function tick() {
    remaining -= 1;
    el.timer.textContent = String(remaining);
    if (remaining <= 0) endRound();
  }

  function validNext(word) {
    const w = word.trim().toLowerCase();
    if (w.length < 3) return { ok: false, reason: 'Min 3 letters' };
    if (played.has(w)) return { ok: false, reason: 'Already used' };
    // Simple ladder rule: must start with last letter of previous word
    const need = lastWord.slice(-1).toLowerCase();
    if (w[0] !== need) return { ok: false, reason: `Must start with “${need.toUpperCase()}”` };
    return { ok: true, word: w };
  }

  function submitWord() {
    const check = validNext(el.input.value);
    if (!check.ok) {
      setStatus(check.reason);
      return;
    }
    played.add(check.word);
    lastWord = check.word;
    score += check.word.length;
    el.score.textContent = String(score);
    renderChainWord(check.word);
    el.input.value = '';
    setStatus('Nice — keep the chain going!');
  }

  async function shareChallenge() {
    try {
      await FBInstant.shareAsync({
        intent: 'CHALLENGE',
        text: `I scored ${score} on seed ${SEED}. Beat my word chain!`,
        data: { seed: SEED, targetScore: score },
      });
      setStatus('Challenge share completed (or mocked).');
    } catch (err) {
      setStatus('Share cancelled or failed.');
      console.warn(err);
    }
  }

  function startRound() {
    score = 0;
    remaining = ROUND_SECONDS;
    lastWord = SEED;
    played.clear();
    played.add(SEED.toLowerCase());
    el.chain.innerHTML = '';
    el.score.textContent = '0';
    el.timer.textContent = String(ROUND_SECONDS);
    el.end.hidden = true;
    el.input.disabled = false;
    el.submit.disabled = false;
    renderChainWord(SEED);
    setStatus('Build a chain. Each word starts with the last letter.');
    clearInterval(timerId);
    timerId = setInterval(tick, 1000);
    el.input.focus();
  }

  async function boot() {
    ensureFBInstant();
    setStatus('Initializing FBInstant…');
    await FBInstant.initializeAsync();
    FBInstant.setLoadingProgress(50);
    // Pretend we loaded a tiny dictionary shard
    await new Promise((r) => setTimeout(r, 120));
    FBInstant.setLoadingProgress(100);
    await FBInstant.startGameAsync();

    el.seed.textContent = SEED;
    const entry = FBInstant.getEntryPointData?.() || {};
    if (entry.seed) {
      // Context-aware hook: challenge entry could override seed
      console.log('Entry point data', entry);
    }

    el.submit.addEventListener('click', submitWord);
    el.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitWord();
    });
    el.share.addEventListener('click', shareChallenge);
    el.replay.addEventListener('click', startRound);

    startRound();
  }

  boot().catch((err) => {
    console.error(err);
    setStatus('Failed to start: ' + err.message);
  });
})();
