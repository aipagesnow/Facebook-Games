/**
 * Word Streak Duels — play-only music + SFX (Web Audio)
 * Music runs only during active gameplay; menu / end / boards are silent.
 * Play: brighter, faster melodic loop
 */
(function (global) {
  'use strict';

  const STORAGE = 'wsd_audio_v3';
  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let compressor = null;
  let musicTimer = null;
  let musicStep = 0;
  /** @type {'menu' | 'play' | null} */
  let musicMode = null;
  let unlocked = false;
  let muted = false;

  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) muted = Boolean(JSON.parse(raw).muted);
  } catch {
    /* ignore */
  }

  function ensure() {
    if (ctx) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;
    compressor.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1.15;
    master.connect(compressor);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.4;
    musicGain.connect(master);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.55;
    sfxGain.connect(master);
    return ctx;
  }

  async function unlock() {
    const c = ensure();
    if (!c) return false;
    if (c.state === 'suspended') {
      try {
        await c.resume();
      } catch {
        /* ignore */
      }
    }
    unlocked = c.state === 'running';
    return unlocked;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ muted }));
    } catch {
      /* ignore */
    }
  }

  function setMuted(next) {
    muted = Boolean(next);
    if (master && ctx) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(muted ? 0 : 1.15, t, 0.03);
    }
    persist();
    if (muted) stopMusic();
    else if (unlocked && musicMode === 'play') startMusic('play');
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    const c = ensure();
    if (!c || !sfxGain || muted) return;
    const t0 = when != null ? when : c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol || 0.2), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  const sfx = {
    tap() {
      tone(620, 0.045, 'triangle', 0.14);
    },
    key() {
      tone(880, 0.03, 'square', 0.06);
    },
    ok() {
      const c = ensure();
      if (!c || muted) return;
      const t = c.currentTime;
      tone(523.25, 0.08, 'triangle', 0.22, t);
      tone(659.25, 0.1, 'triangle', 0.2, t + 0.05);
      tone(783.99, 0.14, 'sine', 0.18, t + 0.1);
    },
    /** Long-word boost — brighter cascade than ok, short & celebratory */
    bonus() {
      const c = ensure();
      if (!c || muted) return;
      const t = c.currentTime;
      // soft low punch
      tone(196.0, 0.14, 'triangle', 0.14, t);
      // rising sparkle arpeggio (C–E–G–C–E)
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
        tone(f, 0.11 + i * 0.012, i % 2 ? 'triangle' : 'sine', 0.2 - i * 0.015, t + 0.04 + i * 0.055);
      });
      // bright shimmer tail
      tone(1568.0, 0.2, 'sine', 0.11, t + 0.32);
      tone(2093.0, 0.16, 'triangle', 0.07, t + 0.38);
    },
    /** Extra-juicy for 9+ letter bonuses */
    bonusBig() {
      const c = ensure();
      if (!c || muted) return;
      const t = c.currentTime;
      tone(146.83, 0.16, 'triangle', 0.16, t);
      [392.0, 523.25, 659.25, 783.99, 987.77, 1174.7, 1396.9].forEach((f, i) => {
        tone(f, 0.12, i < 3 ? 'triangle' : 'sine', 0.18 - i * 0.01, t + i * 0.048);
      });
      tone(1760.0, 0.22, 'sine', 0.12, t + 0.36);
      tone(2093.0, 0.2, 'triangle', 0.09, t + 0.44);
    },
    bad() {
      const c = ensure();
      if (!c || muted) return;
      const t = c.currentTime;
      tone(240, 0.1, 'sawtooth', 0.12, t, 160);
      tone(180, 0.12, 'sawtooth', 0.1, t + 0.07);
    },
    hint() {
      tone(740, 0.08, 'sine', 0.16);
      tone(988, 0.12, 'sine', 0.14);
    },
    start() {
      const c = ensure();
      if (!c || muted) return;
      const t = c.currentTime;
      [392, 494, 587, 784].forEach((f, i) => tone(f, 0.11, 'triangle', 0.16, t + i * 0.07));
    },
    end() {
      const c = ensure();
      if (!c || muted) return;
      const t = c.currentTime;
      [659, 523, 392, 330].forEach((f, i) => tone(f, 0.13, 'triangle', 0.15, t + i * 0.09));
    },
    win() {
      const c = ensure();
      if (!c || muted) return;
      const t = c.currentTime;
      [523, 659, 784, 1046, 1175].forEach((f, i) => tone(f, 0.11, 'sine', 0.16, t + i * 0.07));
    },
    tick() {
      tone(980, 0.04, 'square', 0.08);
    },
    urgent() {
      tone(1200, 0.05, 'square', 0.1);
      tone(900, 0.06, 'square', 0.09);
    },
    share() {
      tone(640, 0.1, 'triangle', 0.16);
      tone(860, 0.12, 'triangle', 0.12);
    },
  };

  // Very chilled ambient menu — slow, smooth, low energy
  const MENU_CHORDS = [
    [98.0, 123.47, 146.83, 196.0], // G soft
    [87.31, 110.0, 130.81, 174.61], // F
    [82.41, 103.83, 123.47, 164.81], // E
    [92.5, 116.54, 146.83, 185.0], // Bb-ish calm
  ];

  // Punchier play loop — brighter, quicker
  const PLAY_PROGRESSION = [
    [196.0, 246.94, 293.66, 392.0],
    [174.61, 220.0, 261.63, 349.23],
    [146.83, 220.0, 293.66, 349.23],
    [155.56, 196.0, 233.08, 311.13],
  ];
  const PLAY_MELODY = [
    392.0, 466.16, 523.25, 587.33, 523.25, 466.16, 392.0, 349.23,
    329.63, 392.0, 466.16, 523.25, 587.33, 698.46, 659.25, 523.25,
  ];

  function playMenuStep() {
    const c = ensure();
    if (!c || !musicGain || muted || !unlocked) return;
    const t = c.currentTime;
    const chord = MENU_CHORDS[musicStep % MENU_CHORDS.length];

    // Warm low pad — long attack / release, no sparkle
    chord.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      o.type = 'sine';
      o.frequency.value = f;
      const peak = i === 0 ? 0.11 : 0.045;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.55);
      g.gain.setValueAtTime(peak * 0.85, t + 1.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      o.connect(filter);
      filter.connect(g);
      g.connect(musicGain);
      o.start(t);
      o.stop(t + 2.9);
    });

    // gentle detuned twin on root for smoothness
    const twin = c.createOscillator();
    const tg = c.createGain();
    twin.type = 'triangle';
    twin.frequency.value = chord[0] * 1.003;
    tg.gain.setValueAtTime(0.0001, t);
    tg.gain.exponentialRampToValueAtTime(0.04, t + 0.7);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    twin.connect(tg);
    tg.connect(musicGain);
    twin.start(t);
    twin.stop(t + 2.7);

    musicStep += 1;
  }

  function playPlayStep() {
    const c = ensure();
    if (!c || !musicGain || muted || !unlocked) return;
    const t = c.currentTime;
    const chord = PLAY_PROGRESSION[Math.floor(musicStep / 4) % PLAY_PROGRESSION.length];
    const mel = PLAY_MELODY[musicStep % PLAY_MELODY.length];

    const bass = c.createOscillator();
    const bg = c.createGain();
    bass.type = 'triangle';
    bass.frequency.value = chord[0];
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(0.24, t + 0.03);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    bass.connect(bg);
    bg.connect(musicGain);
    bass.start(t);
    bass.stop(t + 0.52);

    chord.forEach((f, i) => {
      if (i === 0) return;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g);
      g.connect(musicGain);
      o.start(t);
      o.stop(t + 0.58);
    });

    const lead = c.createOscillator();
    const lg = c.createGain();
    lead.type = 'triangle';
    lead.frequency.value = mel;
    lg.gain.setValueAtTime(0.0001, t);
    lg.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    lg.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    lead.connect(lg);
    lg.connect(musicGain);
    lead.start(t);
    lead.stop(t + 0.34);

    musicStep += 1;
  }

  function stopMusicTimer() {
    if (musicTimer) {
      global.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function startMusic(mode) {
    // Only gameplay has BGM — anything else stops music
    if (mode !== 'play') {
      musicMode = null;
      stopMusicTimer();
      return;
    }
    if (muted) {
      musicMode = 'play';
      return;
    }
    ensure();
    if (musicMode === 'play' && musicTimer) return;

    stopMusicTimer();
    musicMode = 'play';
    musicStep = 0;
    playPlayStep();
    musicTimer = global.setInterval(playPlayStep, 380);
  }

  function stopMusic() {
    musicMode = null;
    stopMusicTimer();
  }

  /**
   * @param {'play' | 'menu' | 'off' | null} mode
   * Only 'play' starts music; menu/off/null silence BGM.
   */
  function setMusicMode(mode) {
    if (mode !== 'play') {
      stopMusic();
      return;
    }
    if (!unlocked && !muted) {
      musicMode = 'play';
      return;
    }
    startMusic('play');
  }

  global.WSDAudio = {
    unlock,
    startMusic,
    stopMusic,
    setMusicMode,
    setMuted,
    isMuted,
    toggleMute,
    sfx,
  };
})(typeof window !== 'undefined' ? window : globalThis);
