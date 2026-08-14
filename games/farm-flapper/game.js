(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const liveTimeEl = document.getElementById("live-time");
  const liveCoinsEl = document.getElementById("live-coins");
  const livePestsEl = document.getElementById("live-pests");
  const liveEggsEl = document.getElementById("live-eggs");
  const bestEl = document.getElementById("best");
  const comboEl = document.getElementById("combo");
  const multLabel = document.getElementById("mult-label");
  const multBar = document.getElementById("mult-bar");
  const hudEl = document.getElementById("hud");
  const startScreen = document.getElementById("start-screen");
  const gameOverScreen = document.getElementById("game-over");
  const finalScoreEl = document.getElementById("final-score");
  const finalBestEl = document.getElementById("final-best");
  const startBtn = document.getElementById("start-btn");
  const retryBtn = document.getElementById("retry-btn");
  const menuBtn = document.getElementById("menu-btn");
  const shootBtn = document.getElementById("shoot-btn");
  const flapBtn = document.getElementById("flap-btn");
  const touchControls = document.getElementById("touch-controls");
  const muteBtn = document.getElementById("mute-btn");
  const nameInput = document.getElementById("player-name");
  const boardList = document.getElementById("leaderboard-list");
  const boardListGo = document.getElementById("leaderboard-list-go");
  const boardStatus = document.getElementById("board-status");
  const submitStatus = document.getElementById("submit-status");
  const refreshBoardBtn = document.getElementById("refresh-board");
  const playerChip = document.getElementById("player-chip");
  const deliveredChip = document.getElementById("delivered-chip");
  const deliveredCountEl = document.getElementById("delivered-count");

  // Stat Breakdown Elements
  const statFoesEl = document.getElementById("stat-foes");
  const statShotsEl = document.getElementById("stat-shots");
  const statComboEl = document.getElementById("stat-combo");
  const statCoinsEl = document.getElementById("stat-coins");

  // Tally breakdown elements
  const tallyScreen = document.getElementById("tally-screen");
  const tallyFinalScore = document.getElementById("tally-final-score");
  const tallyContinueBtn = document.getElementById("tally-continue-btn");
  const tallyPestsPts = document.getElementById("stat-pests-pts");
  const tallyCoinsPts = document.getElementById("stat-coins-pts");
  const tallyTimePts = document.getElementById("stat-time-pts");
  const tallySubtotal = document.getElementById("stat-subtotal");
  const tallyDeliveredMult = document.getElementById("stat-delivered-mult");

  const BASE_W = 400;
  const BASE_H = 600;
  let W = BASE_W;
  let H = BASE_H;
  let GROUND_H = 80;
  let dpr = Math.min(window.devicePixelRatio || 1, 3);

  let dustPuffs = [];
  let eggSplats = [];
  let sparkles = [];

  const BEST_KEY = "farmFlapperBest";
  const MUTE_KEY = "farmFlapperMuted";
  const NAME_KEY = "farmFlapperName";
  const PLAYER_ID_KEY = "farmFlapperPlayerId";
  const LOCAL_BOARD_KEY = "farmFlapperLocalBoard";

  const STATE = { READY: "ready", PLAYING: "playing", DEAD: "dead" };

  let state = STATE.READY;
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let frames = 0;
  let pipeTimer = 0;
  let shootCooldown = 0;
  let combo = 0;
  let comboTimer = 0;
  let shakeTime = 0;
  let starTimer = 0; // Four-Leaf Clover Invincibility Timer
  let currentMount = null; // Rideable farm mount: null, "oinky", "billy", "wooly"
  let isRidingYoshi = false; // Compatibility flag for mount state
  let dismountInvincibleTimer = 0; // Invulnerability grace period after dismounting
  let extraLives = 0; // Red Apple Extra Lives (Max 3)
  const MAX_EXTRA_LIVES = 3;
  const extraLivesEl = document.getElementById("extra-lives");
  let mushrooms = []; // Red Apples emerging from obstacles
  let muted = localStorage.getItem(MUTE_KEY) === "1";
  let playerId = localStorage.getItem(PLAYER_ID_KEY) || "";
  let windmillAngle = 0;

  // Vertical Moving Farmer popping onto the screen from the right side!
  const farmer = {
    x: BASE_W - 18,
    y: BASE_H / 2,
    w: 34,
    h: 46,
    vy: 1.85,
    direction: 1,
    catchAnim: 0,
  };

  if (!playerId) {
    playerId =
      "p_" +
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36).slice(-4);
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }

  // Session Statistics & Multi-Factor Score Data
  let gameStats = {
    pestsScared: 0,
    foesBlasted: 0,
    eggsFired: 0,
    eggsDelivered: 0,
    maxCombo: 1,
    coinsCollected: 0,
    coinsPts: 0,
    timeAliveFrames: 0,
  };

  function formatLiveTime(frames) {
    const totalSec = Math.floor(frames / 60);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateLiveStatsUI() {
    if (liveTimeEl) liveTimeEl.textContent = formatLiveTime(gameStats.timeAliveFrames);
    if (liveCoinsEl) liveCoinsEl.textContent = String(gameStats.coinsCollected);
    if (livePestsEl) livePestsEl.textContent = String(gameStats.foesBlasted);
    if (liveEggsEl) liveEggsEl.textContent = String(gameStats.eggsDelivered);
  }

  // Tuned for fun shooting + point farming
  const gravity = 0.36;
  const flapPower = -7.0;
  const pipeGap = 158;
  const pipeWidth = 64;
  let pipeSpeed = 2.35;
  const pipeSpawnEvery = 110;
  const eggSpeed = 9.5;
  const shootDelay = 8;
  const eggRadius = 7.5;
  const trackStrength = 0.22;
  const hitPad = 10;

  const ENEMIES = {
    mouse: {
      name: "Sneaky Mouse",
      type: "mouse",
      points: 5,
      w: 30,
      h: 26,
      speed: 1.05,
      hop: 3.8,
      weight: 34,
      explodeColor: "#9e9e9e",
      hover: 0.4,
    },
    crow: {
      name: "Crow",
      type: "crow",
      points: 12,
      w: 32,
      h: 30,
      speed: 1.35,
      hop: 4.5,
      weight: 26,
      explodeColor: "#3f51b5",
      hover: 0.7,
    },
    cat: {
      name: "Sneaky Cat",
      type: "cat",
      points: 25,
      w: 34,
      h: 32,
      speed: 1.55,
      hop: 4.8,
      weight: 22,
      explodeColor: "#ff9800",
      hover: 0.55,
    },
    fox: {
      name: "Sly Fox",
      type: "fox",
      points: 40,
      w: 36,
      h: 34,
      speed: 1.8,
      hop: 5.4,
      weight: 14,
      explodeColor: "#ff3d00",
      hover: 0.6,
    },
    mount: {
      name: "Wooly the Sheep",
      type: "mount",
      points: 60,
      w: 38,
      h: 38,
      speed: 1.85,
      hop: 5.0,
      weight: 3.5, // Rare rideable Wooly the Sheep!
      explodeColor: "#ffffff",
      friendly: true,
      hover: 0.65,
    },
    bull: {
      name: "Angry Bull",
      type: "bull",
      points: 120,
      w: 48,
      h: 48,
      speed: 1.05,
      hop: 3.6,
      weight: 5,
      explodeColor: "#b71c1c",
      hover: 0.35,
      hp: 3,
      maxHp: 3,
    },
    clover: {
      name: "Four-Leaf Clover",
      type: "clover",
      points: 150,
      w: 30,
      h: 30,
      speed: 2.2,
      hop: 6.2,
      weight: 1.8, // Rare power-up spawn!
      explodeColor: "#00e676",
      friendly: true,
      hover: 0.9,
    },
  };

  const duck = {
    x: 86,
    y: H / 2,
    w: 40,
    h: 32,
    vy: 0,
    rotation: 0,
    wing: 0,
  };

  let pipes = [];
  let foes = [];
  let eggs = [];
  let coins = [];
  let popups = [];
  let explosions = [];
  let feathers = [];
  let sectionCounter = 0;
  let groundOffset = 0;
  let skyOffset = 0;
  let shootHold = false;
  let powerRapid = 0;
  let lastBoard = [];

  // ============================================================
  //  PERSISTENT LEADERBOARD & LOCAL STORAGE SYNC
  // ============================================================
  function getPlayerName() {
    const n = (nameInput?.value || localStorage.getItem(NAME_KEY) || "")
      .replace(/[^\w\s\-_.!]/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 16);
    return n;
  }

  function savePlayerName() {
    const n = getPlayerName();
    if (n.length >= 2) {
      localStorage.setItem(NAME_KEY, n);
      playerChip.textContent = `👤 ${n}`;
      playerChip.classList.remove("hidden");
    } else {
      playerChip.classList.add("hidden");
    }
    return n;
  }

  function loadLocalBoard() {
    try {
      const raw = localStorage.getItem(LOCAL_BOARD_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveLocalBoard(entries) {
    localStorage.setItem(LOCAL_BOARD_KEY, JSON.stringify(entries.slice(0, 100)));
  }

  function upsertLocal(name, scoreVal) {
    const board = loadLocalBoard();
    const i = board.findIndex(
      (e) => e.name.toLowerCase() === name.toLowerCase() || (playerId && e.playerId === playerId)
    );
    if (i >= 0) {
      if (scoreVal > board[i].score) {
        board[i].score = scoreVal;
        board[i].at = Date.now();
        board[i].name = name;
      }
    } else {
      board.push({ name, score: scoreVal, at: Date.now(), playerId });
    }
    board.sort((a, b) => b.score - a.score || a.at - b.at);
    saveLocalBoard(board);
    return board;
  }

  function mergeLeaderboards(localList, remoteList) {
    const map = new Map();
    for (const item of [...remoteList, ...localList]) {
      if (!item || !item.name) continue;
      const key = item.playerId || item.name.toLowerCase();
      if (!map.has(key) || item.score > map.get(key).score) {
        map.set(key, item);
      }
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => b.score - a.score || a.at - b.at
    );
    saveLocalBoard(merged);
    return merged;
  }

  function renderBoard(listEl, entries, youName) {
    if (!listEl) return;
    if (!entries || !entries.length) {
      listEl.innerHTML = `<li class="board-empty">No scores saved yet — play a round!</li>`;
      return;
    }
    const you = (youName || "").toLowerCase();
    listEl.innerHTML = entries
      .slice(0, 15)
      .map((e, i) => {
        const isYou = you && e.name.toLowerCase() === you;
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        return `<li class="${isYou ? "you" : ""}">
          <span class="rank">${medal}</span>
          <span class="name">${escapeHtml(e.name)}${isYou ? " (you)" : ""}</span>
          <span class="pts">${e.score}</span>
        </li>`;
      })
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function fetchLeaderboard() {
    const local = loadLocalBoard().sort((a, b) => b.score - a.score);
    try {
      const res = await fetch("/api/leaderboard?limit=30", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (data.ok && Array.isArray(data.entries)) {
        const merged = mergeLeaderboards(local, data.entries);
        lastBoard = merged;
        const you = getPlayerName();
        renderBoard(boardList, lastBoard, you);
        renderBoard(boardListGo, lastBoard, you);
        if (boardStatus) {
          boardStatus.textContent =
            "🏆 Persistent Leaderboard (Server & Device Sync)";
        }
        return lastBoard;
      }
      throw new Error("bad payload");
    } catch {
      lastBoard = local;
      const you = getPlayerName();
      renderBoard(boardList, local, you);
      renderBoard(boardListGo, local, you);
      if (boardStatus) {
        boardStatus.textContent =
          "📱 Scores saved permanently on this device";
      }
      return local;
    }
  }

  const isFBInstant = typeof FBInstant !== "undefined";

  async function initFBInstant() {
    if (!isFBInstant) return;
    try {
      await FBInstant.initializeAsync();
      FBInstant.setLoadingProgress(100);
      await FBInstant.startGameAsync();

      const fbName = FBInstant.player.getName();
      if (fbName) {
        localStorage.setItem(NAME_KEY, fbName);
        if (nameInput) nameInput.value = fbName;
        if (playerChip) {
          playerChip.textContent = `👤 ${fbName}`;
          playerChip.classList.remove("hidden");
        }
      }
    } catch (err) {
      console.warn("FBInstant init warning:", err);
    }
  }

  async function submitFBScore(s) {
    if (!isFBInstant) return false;
    try {
      const board = await FBInstant.getLeaderboardAsync("global_leaderboard");
      await board.setScoreAsync(s);
      return true;
    } catch (err) {
      console.warn("FBInstant setScore warning:", err);
      return false;
    }
  }

  async function shareScoreFB() {
    if (!isFBInstant) {
      if (submitStatus) {
        submitStatus.textContent = `🦆 High Score: ${score}! Share with your friends!`;
        submitStatus.className = "submit-status ok";
      }
      return;
    }
    try {
      let dataUrl = "";
      try {
        dataUrl = canvas.toDataURL("image/png");
      } catch {}
      await FBInstant.shareAsync({
        intent: "REQUEST",
        image: dataUrl || undefined,
        text: `I scored ${score} points in Farm Flapper! Can you beat my high score?`,
        data: { score },
      });
      if (submitStatus) {
        submitStatus.textContent = "🚀 Shared challenge with your friends!";
        submitStatus.className = "submit-status ok";
      }
    } catch (err) {
      console.warn("FBInstant share error:", err);
    }
  }

  async function submitScore(scoreVal) {
    const name = savePlayerName();
    if (name.length < 2) {
      if (submitStatus) {
        submitStatus.textContent = "Enter your name (2+ chars) to join the board";
        submitStatus.className = "submit-status err";
      }
      return;
    }

    const local = upsertLocal(name, scoreVal);
    renderBoard(boardListGo, local, name);
    submitFBScore(scoreVal);

    if (submitStatus) {
      submitStatus.textContent = "Saving score to leaderboard…";
      submitStatus.className = "submit-status";
    }

    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, score: scoreVal, playerId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Submit failed");
      }
      const merged = mergeLeaderboards(local, data.entries || []);
      lastBoard = merged;
      renderBoard(boardList, lastBoard, name);
      renderBoard(boardListGo, lastBoard, name);
      if (submitStatus) {
        if (data.updated) {
          submitStatus.textContent = data.rank
            ? `🏆 Saved! Rank #${data.rank} on the leaderboard!`
            : "🏆 New personal best saved permanently!";
        } else {
          submitStatus.textContent = `Best on record: ${data.best || scoreVal}`;
        }
        submitStatus.className = "submit-status ok";
      }
    } catch {
      renderBoard(boardListGo, local, name);
      if (submitStatus) {
        submitStatus.textContent =
          "🏆 Score saved permanently on this device!";
        submitStatus.className = "submit-status ok";
      }
    }
  }

  // ============================================================
  //  FARM AUDIO SYNTHESIZER
  // ============================================================
  const AudioFX = (() => {
    let actx = null;
    let master = null;
    let musicGain = null;
    let sfxGain = null;
    let musicTimer = null;
    let musicStep = 0;
    let isCloverMusic = false;

    // Cheerful Barnyard Country Folk Melody
    const melody = [
      523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.0, 698.46,
      523.25, 659.25, 783.99, 1046.5, 987.77, 880.0, 783.99, 659.25,
      392.0, 523.25, 659.25, 523.25, 440.0, 554.37, 659.25, 554.37,
      523.25, 587.33, 659.25, 783.99, 698.46, 659.25, 587.33, 523.25,
    ];
    const bass = [
      130.81, 130.81, 196.0, 196.0, 174.61, 174.61, 196.0, 196.0,
      130.81, 130.81, 196.0, 196.0, 146.83, 146.83, 174.61, 174.61,
    ];

    // Four-Leaf Clover Power Melody
    const cloverMelody = [
      659.25, 659.25, 659.25, 523.25, 659.25, 783.99, 392.0,
      523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 523.25,
      783.99, 880.0, 987.77, 1046.5, 880.0, 783.99, 659.25,
    ];

    function ensure() {
      if (actx) return true;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        actx = new AC();
        master = actx.createGain();
        master.gain.value = muted ? 0 : 0.9;
        master.connect(actx.destination);
        musicGain = actx.createGain();
        musicGain.gain.value = 0.16;
        musicGain.connect(master);
        sfxGain = actx.createGain();
        sfxGain.gain.value = 0.45;
        sfxGain.connect(master);
        return true;
      } catch {
        return false;
      }
    }

    async function unlock() {
      if (!ensure()) return;
      if (actx.state === "suspended") {
        try {
          await actx.resume();
        } catch {}
      }
    }

    function setMuted(m) {
      muted = m;
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      if (master) master.gain.value = m ? 0 : 0.9;
      muteBtn.textContent = m ? "🔇" : "🔊";
      if (m) stopMusic();
      else if (state === STATE.PLAYING) {
        if (starTimer > 0) startCloverMusic();
        else startMusic();
      }
    }

    function tone(freq, dur, type, gain, when, slideTo) {
      if (!actx || muted) return;
      const t0 = when ?? actx.currentTime;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo)
        o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain ?? 0.2, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(sfxGain);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    }

    function noiseBurst(dur, gain) {
      if (!actx || muted) return;
      const t0 = actx.currentTime;
      const len = Math.floor(actx.sampleRate * dur);
      const buf = actx.createBuffer(1, len, actx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = actx.createBufferSource();
      src.buffer = buf;
      const g = actx.createGain();
      const f = actx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 1800;
      g.gain.setValueAtTime(gain ?? 0.3, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f);
      f.connect(g);
      g.connect(sfxGain);
      src.start(t0);
      src.stop(t0 + dur);
    }

    function flap() {
      tone(440, 0.08, "square", 0.12, undefined, 720);
    }
    function shoot() {
      tone(880, 0.05, "square", 0.09);
      tone(1200, 0.04, "square", 0.07, actx ? actx.currentTime + 0.03 : 0);
    }
    function shellShoot() {
      tone(740, 0.05, "triangle", 0.14, undefined, 980);
      tone(1180, 0.06, "square", 0.12, actx ? actx.currentTime + 0.04 : 0);
    }
    function mouseSqueak() {
      tone(1450, 0.05, "sine", 0.18, undefined, 2100);
      tone(1800, 0.06, "sine", 0.15, actx ? actx.currentTime + 0.04 : 0, 2400);
    }
    function crowCaw() {
      tone(580, 0.12, "sawtooth", 0.22, undefined, 340);
      tone(520, 0.14, "sawtooth", 0.18, actx ? actx.currentTime + 0.08 : 0, 280);
    }
    function catMeow() {
      tone(650, 0.12, "triangle", 0.2, undefined, 950);
      tone(950, 0.14, "triangle", 0.18, actx ? actx.currentTime + 0.10 : 0, 550);
    }
    function foxYip() {
      tone(780, 0.06, "square", 0.18, undefined, 1150);
      tone(920, 0.08, "square", 0.16, actx ? actx.currentTime + 0.05 : 0, 680);
    }
    function bullBellow() {
      tone(160, 0.22, "sawtooth", 0.28, undefined, 90);
      tone(190, 0.20, "square", 0.22, actx ? actx.currentTime + 0.08 : 0, 110);
    }
    function appleCrunch() {
      noiseBurst(0.08, 0.35);
      tone(880, 0.04, "triangle", 0.16, actx ? actx.currentTime + 0.02 : 0, 1400);
      noiseBurst(0.10, 0.28);
    }
    function farmerCheer() {
      tone(440, 0.08, "triangle", 0.2, undefined, 580);
      tone(580, 0.10, "square", 0.22, actx ? actx.currentTime + 0.06 : 0, 880);
      tone(880, 0.14, "sine", 0.25, actx ? actx.currentTime + 0.14 : 0, 1160);
    }

    function pigOink() {
      tone(280, 0.12, "sawtooth", 0.18, undefined, 200);
      tone(320, 0.08, "sawtooth", 0.15, actx ? actx.currentTime + 0.06 : 0, 240);
    }
    function goatBleat() {
      tone(440, 0.09, "sawtooth", 0.16, undefined, 520);
      tone(480, 0.1, "sawtooth", 0.14, actx ? actx.currentTime + 0.05 : 0, 420);
    }
    function sheepBaa() {
      tone(349, 0.14, "triangle", 0.16, undefined, 310);
      tone(330, 0.12, "triangle", 0.14, actx ? actx.currentTime + 0.08 : 0, 290);
    }
    function mountDismount() {
      tone(520, 0.12, "sawtooth", 0.18, undefined, 220);
      noiseBurst(0.2, 0.28);
    }
    function explode(big) {
      noiseBurst(big ? 0.35 : 0.2, big ? 0.45 : 0.28);
      tone(180, 0.18, "sawtooth", 0.14, undefined, 40);
    }
    function scorePing(points) {
      const base = 520 + Math.min(points, 120) * 3;
      tone(base, 0.07, "square", 0.11);
      tone(base * 1.5, 0.09, "square", 0.09, actx ? actx.currentTime + 0.05 : 0);
    }
    function coin() {
      tone(988, 0.06, "square", 0.12);
      tone(1319, 0.14, "square", 0.1, actx ? actx.currentTime + 0.06 : 0);
    }
    function farmerCatch() {
      tone(880, 0.07, "triangle", 0.15);
      tone(1320, 0.11, "square", 0.14, actx ? actx.currentTime + 0.04 : 0);
    }
    function hit() {
      tone(160, 0.25, "sawtooth", 0.2, undefined, 50);
      noiseBurst(0.28, 0.32);
    }
    function pipePass() {
      tone(660, 0.05, "triangle", 0.07);
      tone(880, 0.07, "triangle", 0.07, actx ? actx.currentTime + 0.04 : 0);
    }

    function playMusicNote() {
      if (!actx || muted || state !== STATE.PLAYING || isCloverMusic) return;
      const t = actx.currentTime;
      const note = melody[musicStep % melody.length];
      const b = bass[musicStep % bass.length];
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = "triangle";
      o.frequency.value = note;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g);
      g.connect(musicGain);
      o.start(t);
      o.stop(t + 0.2);
      if (musicStep % 2 === 0) {
        const o2 = actx.createOscillator();
        const g2 = actx.createGain();
        o2.type = "triangle";
        o2.frequency.value = b;
        g2.gain.setValueAtTime(0.0001, t);
        g2.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o2.connect(g2);
        g2.connect(musicGain);
        o2.start(t);
        o2.stop(t + 0.3);
      }
      musicStep++;
    }

    function playCloverMusicNote() {
      if (!actx || muted || state !== STATE.PLAYING || !isCloverMusic) return;
      const t = actx.currentTime;
      const note = cloverMelody[musicStep % cloverMelody.length];
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = "square";
      o.frequency.value = note;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g);
      g.connect(musicGain);
      o.start(t);
      o.stop(t + 0.09);
      musicStep++;
    }

    function startMusic() {
      if (!actx || muted) return;
      stopMusic();
      isCloverMusic = false;
      musicStep = 0;
      musicTimer = setInterval(playMusicNote, 160);
    }

    function startCloverMusic() {
      if (!actx || muted) return;
      stopMusic();
      isCloverMusic = true;
      musicStep = 0;
      musicTimer = setInterval(playCloverMusicNote, 95);
    }

    function stopMusic() {
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
      isCloverMusic = false;
    }

    function oneUp() {
      tone(330, 0.07, "square", 0.15, undefined, 392);
      tone(659, 0.07, "square", 0.15, actx ? actx.currentTime + 0.06 : 0, 784);
      tone(1046, 0.12, "square", 0.18, actx ? actx.currentTime + 0.12 : 0);
    }
    function oneUpUse() {
      tone(523, 0.09, "triangle", 0.2, undefined, 784);
      noiseBurst(0.18, 0.25);
    }

    muteBtn.textContent = muted ? "🔇" : "🔊";
    return {
      unlock,
      setMuted,
      flap,
      shoot,
      shellShoot,
      pigOink,
      goatBleat,
      sheepBaa,
      mountDismount,
      mouseSqueak,
      crowCaw,
      catMeow,
      foxYip,
      bullBellow,
      appleCrunch,
      farmerCheer,
      oneUp,
      oneUpUse,
      explode,
      scorePing,
      coin,
      farmerCatch,
      hit,
      pipePass,
      startMusic,
      startCloverMusic,
      stopMusic,
      get muted() {
        return muted;
      },
    };
  })();

  // ============================================================
  //  CANVAS RESIZING & HIGH-DPI SCALING
  // ============================================================
  function resize() {
    const wrap = document.getElementById("game-wrap");
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    W = BASE_W;
    H = Math.round(BASE_W * (cssH / cssW));
    H = Math.max(520, Math.min(H, 880));
    GROUND_H = Math.round(80 * (H / BASE_H));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    farmer.x = W - 18;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 120));
  resize();

  // ============================================================
  //  RENDERING & BARNYARD VISUAL FX
  // ============================================================
  function drawSky() {
    const grad = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
    if (starTimer > 0) {
      const hue = (frames * 6) % 360;
      grad.addColorStop(0, `hsl(${hue}, 85%, 16%)`);
      grad.addColorStop(0.5, `hsl(${(hue + 40) % 360}, 85%, 26%)`);
      grad.addColorStop(1, `hsl(${(hue + 80) % 360}, 85%, 40%)`);
    } else {
      grad.addColorStop(0, "#4a90e2");
      grad.addColorStop(0.4, "#63a4ff");
      grad.addColorStop(0.75, "#90caf9");
      grad.addColorStop(1, "#e3f2fd");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H - GROUND_H);

    // Clover Sparkle Field during Clover Power
    if (starTimer > 0) {
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 37 + frames * 2) % (W + 20)) - 10;
        const sy = (i * 23) % (H - GROUND_H - 40);
        const sz = 1 + (i % 3);
        const hue = (i * 40 + frames * 10) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 75%)`;
        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Warm Sunbeams
      ctx.fillStyle = "rgba(255, 255, 220, 0.06)";
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(140, H - GROUND_H);
      ctx.lineTo(210, H - GROUND_H);
      ctx.lineTo(70, 0);
      ctx.fill();
    }

    // Parallax Barnyard Scenery: Rolling Pasture Hills, Red Barn & Windmill
    drawBarnScenery();

    // Floating Ambient Pollen Dust & Leaves
    for (let i = 0; i < 18; i++) {
      const px = ((i * 47 + frames * 0.8) % (W + 40)) - 20;
      const py = (i * 29 + Math.sin(frames * 0.03 + i) * 12) % (H - GROUND_H - 30);
      const isLeaf = i % 4 === 0;
      if (isLeaf) {
        ctx.fillStyle = "rgba(139, 195, 74, 0.45)";
        ctx.beginPath();
        ctx.ellipse(px, py, 3, 1.5, Math.sin(frames * 0.05 + i), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(255, 235, 118, 0.35)";
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    skyOffset = (skyOffset + 0.2) % (W + 140);
    drawCloud(80 - skyOffset * 0.4, 65, 1);
    drawCloud(260 - skyOffset * 0.3, 115, 0.85);
    drawCloud(390 - skyOffset * 0.35, 50, 0.95);
  }

  function drawBarnScenery() {
    const yBase = H - GROUND_H;

    // Distant Rolling Green Pasture Hills
    ctx.fillStyle = "rgba(100, 180, 75, 0.45)";
    ctx.beginPath();
    ctx.moveTo(-20, yBase);
    ctx.quadraticCurveTo(80, yBase - 60, 180, yBase);
    ctx.quadraticCurveTo(280, yBase - 80, 420, yBase);
    ctx.lineTo(420, yBase);
    ctx.fill();

    ctx.fillStyle = "rgba(75, 150, 50, 0.65)";
    ctx.beginPath();
    ctx.moveTo(-10, yBase);
    ctx.quadraticCurveTo(120, yBase - 45, 250, yBase);
    ctx.quadraticCurveTo(340, yBase - 35, 430, yBase);
    ctx.fill();

    // Red Barn with Silver Silo in background
    const barnX = 35;
    const barnY = yBase - 70;

    // Silo Body
    ctx.fillStyle = "#b0bec5";
    ctx.fillRect(barnX - 22, barnY + 12, 18, 58);
    // Silo Dome Top
    ctx.fillStyle = "#d32f2f";
    ctx.beginPath();
    ctx.arc(barnX - 13, barnY + 12, 9, Math.PI, 0);
    ctx.fill();

    // Red Barn Main Body
    ctx.fillStyle = "#c62828";
    ctx.fillRect(barnX, barnY + 18, 64, 52);
    // Barn Roof
    ctx.fillStyle = "#b71c1c";
    ctx.beginPath();
    ctx.moveTo(barnX - 4, barnY + 18);
    ctx.lineTo(barnX + 32, barnY - 6);
    ctx.lineTo(barnX + 68, barnY + 18);
    ctx.closePath();
    ctx.fill();

    // White Trim & X Doors
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barnX + 18, barnY + 36, 28, 34);
    ctx.beginPath();
    ctx.moveTo(barnX + 18, barnY + 36);
    ctx.lineTo(barnX + 46, barnY + 70);
    ctx.moveTo(barnX + 46, barnY + 36);
    ctx.lineTo(barnX + 18, barnY + 70);
    ctx.stroke();

    // Background Animated Windmill
    const wmX = 320;
    const wmY = yBase - 90;

    // Windmill Tower Base
    ctx.fillStyle = "#8d6e63";
    ctx.beginPath();
    ctx.moveTo(wmX - 10, yBase);
    ctx.lineTo(wmX - 4, wmY);
    ctx.lineTo(wmX + 4, wmY);
    ctx.lineTo(wmX + 10, yBase);
    ctx.fill();

    // Windmill Roof Cap
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.arc(wmX, wmY, 6, Math.PI, 0);
    ctx.fill();

    // Rotating Windmill Blades
    windmillAngle += 0.02;
    ctx.save();
    ctx.translate(wmX, wmY);
    ctx.rotate(windmillAngle);
    ctx.fillStyle = "#f5f5f5";
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-2, -32, 4, 30);
      ctx.fillRect(0, -30, 8, 12);
    }
    ctx.restore();
  }

  function drawCloud(x, y, s) {
    const wrapX = ((x % (W + 140)) + (W + 140)) % (W + 140) - 70;
    ctx.fillStyle = starTimer > 0 ? "rgba(255, 235, 150, 0.9)" : "rgba(255, 255, 255, 0.88)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(wrapX, y, 32 * s, 18 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(wrapX + 25 * s, y + 4 * s, 23 * s, 15 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(wrapX - 23 * s, y + 6 * s, 21 * s, 13 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawGround() {
    const y = H - GROUND_H;
    const g = ctx.createLinearGradient(0, y, 0, H);
    if (starTimer > 0) {
      const hue = (frames * 12) % 360;
      g.addColorStop(0, `hsl(${hue}, 90%, 45%)`);
      g.addColorStop(1, `hsl(${(hue + 40) % 360}, 90%, 25%)`);
    } else {
      g.addColorStop(0, "#7cb342");
      g.addColorStop(0.2, "#558b2f");
      g.addColorStop(1, "#2e7d32");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, GROUND_H);

    groundOffset = (groundOffset + pipeSpeed) % 40;
    ctx.fillStyle = starTimer > 0 ? "#ffd700" : "#aed581";
    for (let x = -groundOffset; x < W + 20; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8, y - 10);
      ctx.lineTo(x + 16, y);
      ctx.fill();
    }
    // Soil layer
    ctx.fillStyle = "#795548";
    ctx.fillRect(0, y + 18, W, 8);
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(0, y + 26, W, GROUND_H - 26);

    // Draw Moving Farmer with Basket on the far right!
    drawFarmer();
  }

  function drawFarmer() {
    const fx = farmer.x;
    const fy = farmer.y;
    const bounce = Math.sin(frames * 0.1) * 1.8 + (farmer.catchAnim > 0 ? -6 : 0);
    if (farmer.catchAnim > 0) farmer.catchAnim--;

    ctx.save();
    ctx.translate(fx, fy + bounce);

    // Denim Overalls Body
    const gDenim = ctx.createLinearGradient(-10, 16, 10, 42);
    gDenim.addColorStop(0, "#1976d2");
    gDenim.addColorStop(1, "#0d47a1");
    ctx.fillStyle = gDenim;
    ctx.fillRect(-10, 16, 20, 26);

    // Brass Buttons on Overall Straps
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(-6, 18, 2, 0, Math.PI * 2);
    ctx.arc(6, 18, 2, 0, Math.PI * 2);
    ctx.fill();

    // Red Plaid Flannel Shirt
    ctx.fillStyle = "#d32f2f";
    ctx.fillRect(-9, 8, 18, 10);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(-9, 12, 18, 2);

    // Head
    const gSkin = ctx.createRadialGradient(-2, 0, 2, 0, 2, 10);
    gSkin.addColorStop(0, "#ffe0b2");
    gSkin.addColorStop(1, "#ffcc80");
    ctx.fillStyle = gSkin;
    ctx.beginPath();
    ctx.arc(0, 2, 9.5, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Cheeks
    ctx.fillStyle = "rgba(255, 128, 171, 0.4)";
    ctx.beginPath();
    ctx.arc(-5, 4, 3, 0, Math.PI * 2);
    ctx.arc(5, 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes with Specular Glint
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(-3, 0, 1.6, 0, Math.PI * 2);
    ctx.arc(3, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-2.5, -0.5, 0.6, 0, Math.PI * 2);
    ctx.arc(3.5, -0.5, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Friendly Mustache & Smile
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.ellipse(-3, 4, 4, 2, 0.2, 0, Math.PI * 2);
    ctx.ellipse(3, 4, 4, 2, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Straw Hat with Red Band
    ctx.fillStyle = "#fbc02d";
    ctx.beginPath();
    ctx.ellipse(0, -6, 16, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -7, 9.5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#c62828";
    ctx.fillRect(-9, -8, 18, 2.5);

    // Woven Wicker Basket held out in front
    ctx.fillStyle = "#8d6e63";
    ctx.strokeStyle = "#4e342e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-14, 18, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wicker Weave Texture Lines
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-24, 18);
    ctx.lineTo(-4, 18);
    ctx.moveTo(-14, 10);
    ctx.lineTo(-14, 26);
    ctx.stroke();

    // Golden Eggs inside basket
    ctx.fillStyle = "#fff8e0";
    ctx.beginPath();
    ctx.ellipse(-18, 15, 4.5, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(-12, 14, 4.5, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(-14, 17, 4.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function roundRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Farm Obstacles with Section Dividers & High-Detail Graphics
  function drawPipe(pipe) {
    const gapTop = pipe.top;
    const gapBot = pipe.top + pipe.gap;
    const style = pipe.style || "hay";

    if (style === "silo") {
      drawSiloObstacle(pipe, gapTop, gapBot);
    } else if (style === "corn") {
      drawCornObstacle(pipe, gapTop, gapBot);
    } else if (style === "barn") {
      drawBarnFenceObstacle(pipe, gapTop, gapBot);
    } else {
      drawHayBaleObstacle(pipe, gapTop, gapBot);
    }

    drawSectionMarker(pipe, gapTop, gapBot);
  }

  function drawSectionMarker(pipe, gapTop, gapBot) {
    const px = pipe.x;
    const pw = pipeWidth;
    const isPest = pipe.sectionType === "pest";

    ctx.save();
    if (isPest) {
      // PEST SECTION: Red Danger Warning Lantern & Skull Emblem
      const pulse = Math.sin(frames * 0.15) * 3;
      ctx.fillStyle = "rgba(255, 23, 68, 0.4)";
      ctx.shadowColor = "#ff1744";
      ctx.shadowBlur = 14 + pulse;

      // Red Danger Cap Line
      ctx.fillStyle = "#d50000";
      ctx.fillRect(px - 6, gapTop - 6, pw + 12, 6);
      ctx.fillRect(px - 6, gapBot, pw + 12, 6);

      // Warning Lantern Emblem on Top Gap Rim
      ctx.fillStyle = "#212121";
      ctx.fillRect(px + pw / 2 - 10, gapTop - 22, 20, 16);
      ctx.fillStyle = "#ff1744";
      ctx.beginPath();
      ctx.arc(px + pw / 2, gapTop - 14, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Warning Skull / Exclamation Mark
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 11px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚠️", px + pw / 2, gapTop - 10);
    } else {
      // COIN SECTION: Golden Coin Wreath & Sparkle Banner
      const pulse = Math.sin(frames * 0.12) * 2;
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 12 + pulse;

      // Golden Cap Line
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(px - 6, gapTop - 6, pw + 12, 6);
      ctx.fillRect(px - 6, gapBot, pw + 12, 6);

      // Golden Laurel Wreath Emblem
      ctx.fillStyle = "#ffa000";
      ctx.beginPath();
      ctx.arc(px + pw / 2, gapTop - 14, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 11px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🪙", px + pw / 2, gapTop - 10);
    }
    ctx.restore();
  }

  function drawHayBaleObstacle(pipe, gapTop, gapBot) {
    const px = pipe.x;
    const pw = pipeWidth;

    // Rich 3D Straw Texture Gradient
    const gStraw = ctx.createLinearGradient(px, 0, px + pw, 0);
    gStraw.addColorStop(0, "#d7ccc8");
    gStraw.addColorStop(0.25, "#fbc02d");
    gStraw.addColorStop(0.65, "#f57f17");
    gStraw.addColorStop(1, "#9e9d24");

    // Top Pipe Body
    ctx.fillStyle = gStraw;
    ctx.fillRect(px, 0, pw, gapTop);

    // Individual Straw Fibers
    ctx.fillStyle = "rgba(255, 245, 157, 0.4)";
    for (let y = 10; y < gapTop - 10; y += 12) {
      ctx.fillRect(px + 4, y, pw - 8, 1.5);
    }

    // Wooden Twine Ropes
    ctx.fillStyle = "#4e342e";
    for (let y = 20; y < gapTop - 25; y += 36) {
      ctx.fillRect(px - 2, y, pw + 4, 4);
      ctx.fillStyle = "#8d6e63";
      ctx.fillRect(px + pw / 2 - 4, y - 1, 8, 6); // Knot detail
      ctx.fillStyle = "#4e342e";
    }

    // Top Rim Cap
    roundRect(px - 5, gapTop - 24, pw + 10, 24, 7, "#fbc02d");
    ctx.fillStyle = "#f57f17";
    ctx.fillRect(px - 5, gapTop - 6, pw + 10, 6);

    // Bottom Pipe Body
    const botY = gapBot;
    const botH = H - GROUND_H - botY;
    ctx.fillStyle = gStraw;
    ctx.fillRect(px, botY, pw, botH);

    ctx.fillStyle = "rgba(255, 245, 157, 0.4)";
    for (let y = botY + 10; y < H - GROUND_H - 10; y += 12) {
      ctx.fillRect(px + 4, y, pw - 8, 1.5);
    }

    ctx.fillStyle = "#4e342e";
    for (let y = botY + 25; y < H - GROUND_H - 25; y += 36) {
      ctx.fillRect(px - 2, y, pw + 4, 4);
      ctx.fillStyle = "#8d6e63";
      ctx.fillRect(px + pw / 2 - 4, y - 1, 8, 6);
      ctx.fillStyle = "#4e342e";
    }

    // Bottom Rim Cap
    roundRect(px - 5, botY, pw + 10, 24, 7, "#fbc02d");
    ctx.fillStyle = "#f57f17";
    ctx.fillRect(px - 5, botY, pw + 10, 6);
  }

  function drawSiloObstacle(pipe, gapTop, gapBot) {
    const px = pipe.x;
    const pw = pipeWidth;

    // Metallic Stainless Steel Gradient
    const gSilo = ctx.createLinearGradient(px, 0, px + pw, 0);
    gSilo.addColorStop(0, "#455a64");
    gSilo.addColorStop(0.2, "#b0bec5");
    gSilo.addColorStop(0.5, "#eceff1");
    gSilo.addColorStop(0.8, "#90a4ae");
    gSilo.addColorStop(1, "#37474f");

    // Top Silo Body
    ctx.fillStyle = gSilo;
    ctx.fillRect(px, 0, pw, gapTop - 18);

    // Horizontal Steel Ribs & Metallic Rivets
    ctx.fillStyle = "#37474f";
    for (let y = 16; y < gapTop - 25; y += 28) {
      ctx.fillRect(px, y, pw, 3);
      // Rivets
      ctx.fillStyle = "#eceff1";
      ctx.fillRect(px + 6, y - 1, 3, 5);
      ctx.fillRect(px + pw - 9, y - 1, 3, 5);
      ctx.fillStyle = "#37474f";
    }

    // Top Dome & Cap
    roundRect(px - 6, gapTop - 24, pw + 12, 24, 8, "#c62828");
    ctx.fillStyle = "#fbc02d";
    // Industrial Hazard Stripes on Rim Cap
    for (let sx = px - 6; sx < px + pw + 6; sx += 14) {
      ctx.beginPath();
      ctx.moveTo(sx, gapTop - 24);
      ctx.lineTo(sx + 7, gapTop - 24);
      ctx.lineTo(sx - 1, gapTop);
      ctx.lineTo(sx - 8, gapTop);
      ctx.fill();
    }

    // Bottom Silo Body
    ctx.fillStyle = gSilo;
    ctx.fillRect(px, gapBot + 18, pw, H - GROUND_H - (gapBot + 18));

    ctx.fillStyle = "#37474f";
    for (let y = gapBot + 32; y < H - GROUND_H - 10; y += 28) {
      ctx.fillRect(px, y, pw, 3);
      ctx.fillStyle = "#eceff1";
      ctx.fillRect(px + 6, y - 1, 3, 5);
      ctx.fillRect(px + pw - 9, y - 1, 3, 5);
      ctx.fillStyle = "#37474f";
    }

    // Bottom Rim Cap
    roundRect(px - 6, gapBot, pw + 12, 24, 8, "#c62828");
    ctx.fillStyle = "#fbc02d";
    for (let sx = px - 6; sx < px + pw + 6; sx += 14) {
      ctx.beginPath();
      ctx.moveTo(sx, gapBot);
      ctx.lineTo(sx + 7, gapBot);
      ctx.lineTo(sx - 1, gapBot + 24);
      ctx.lineTo(sx - 8, gapBot + 24);
      ctx.fill();
    }
  }

  function drawCornObstacle(pipe, gapTop, gapBot) {
    const px = pipe.x;
    const pw = pipeWidth;
    const botY = gapBot;
    const botH = H - GROUND_H - botY;

    const gCorn = ctx.createLinearGradient(px, 0, px + pw, 0);
    gCorn.addColorStop(0, "#1b5e20");
    gCorn.addColorStop(0.3, "#558b2f");
    gCorn.addColorStop(0.7, "#689f38");
    gCorn.addColorStop(1, "#2e7d32");

    // Top Stalk Body
    ctx.fillStyle = gCorn;
    ctx.fillRect(px, 0, pw, gapTop);

    // Bottom Stalk Body
    ctx.fillRect(px, botY, pw, botH);

    // Layered Husks Leaves wrapping around (Top Stalk)
    ctx.fillStyle = "rgba(139, 195, 74, 0.4)";
    for (let y = 15; y < gapTop - 15; y += 32) {
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, y, pw * 0.45, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layered Husks Leaves wrapping around (Bottom Stalk)
    for (let y = botY + 15; y < H - GROUND_H - 15; y += 32) {
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, y, pw * 0.45, 8, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Corn Cobs with Husks
    ctx.fillStyle = "#fbc02d";
    ctx.beginPath();
    ctx.ellipse(px + pw - 4, gapTop - 32, 9, 18, 0.3, 0, Math.PI * 2);
    ctx.ellipse(px + 4, gapBot + 32, 9, 18, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Corn Tassels
    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + pw - 2, gapTop - 48);
    ctx.lineTo(px + pw + 4, gapTop - 54);
    ctx.moveTo(px + 2, gapBot + 48);
    ctx.lineTo(px - 4, gapBot + 54);
    ctx.stroke();

    // Leaf Cap Top & Bottom
    roundRect(px - 5, gapTop - 22, pw + 10, 22, 6, "#33691e");
    roundRect(px - 5, gapBot, pw + 10, 22, 6, "#33691e");
  }

  function drawBarnFenceObstacle(pipe, gapTop, gapBot) {
    const px = pipe.x;
    const pw = pipeWidth;

    // Wood Grain Texture Gradient
    const gWood = ctx.createLinearGradient(px, 0, px + pw, 0);
    gWood.addColorStop(0, "#3e2723");
    gWood.addColorStop(0.2, "#6d4c41");
    gWood.addColorStop(0.6, "#8d6e63");
    gWood.addColorStop(1, "#4e342e");

    ctx.fillStyle = gWood;
    ctx.fillRect(px, 0, pw, gapTop);
    ctx.fillRect(px, gapBot, pw, H - GROUND_H - gapBot);

    // White Crossbars with Bevel Shadows
    for (let y = 14; y < gapTop - 18; y += 38) {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(px - 5, y + 3, pw + 10, 10);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(px - 5, y, pw + 10, 10);
      // Iron Bolts
      ctx.fillStyle = "#212121";
      ctx.beginPath();
      ctx.arc(px + 4, y + 5, 2, 0, Math.PI * 2);
      ctx.arc(px + pw - 4, y + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let y = gapBot + 14; y < H - GROUND_H - 18; y += 38) {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(px - 5, y + 3, pw + 10, 10);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(px - 5, y, pw + 10, 10);
      ctx.fillStyle = "#212121";
      ctx.beginPath();
      ctx.arc(px + 4, y + 5, 2, 0, Math.PI * 2);
      ctx.arc(px + pw - 4, y + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fence Cap Top & Bottom
    roundRect(px - 5, gapTop - 22, pw + 10, 22, 6, "#5d4037");
    roundRect(px - 5, gapBot, pw + 10, 22, 6, "#5d4037");
  }

  function drawBrother(f) {
    if (f.exploding) return;
    ctx.save();
    const cx = f.x + f.w / 2;
    const cy = f.y + f.h / 2;
    ctx.translate(cx, cy);
    const flip = f.faceLeft ? -1 : 1;
    const sc = Math.min(f.w / 32, f.h / 36);
    ctx.scale(flip * sc, sc);
    const bob = f.phase === "active" ? Math.sin(f.anim * 0.35) * 1.5 : 0;

    // Dynamic Creature Drop Shadow
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 19 + bob, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (f.type === "mouse") drawMouse(bob);
    else if (f.type === "crow") drawCrow(bob);
    else if (f.type === "cat") drawCat(bob);
    else if (f.type === "fox") drawFox(bob);
    else if (f.type === "bull") drawBull(bob, f);
    else if (f.type === "clover") drawClover(f.anim);
    else drawMount(bob);
    ctx.restore();
  }

  function drawMouse(bob) {
    const waddle = Math.sin(frames * 0.25) * 4;
    const tailWiggle = Math.sin(frames * 0.3) * 6;

    // Tail
    ctx.strokeStyle = "#ff80ab";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, 8 + bob);
    ctx.quadraticCurveTo(-18, 2 + bob + tailWiggle, -22, 12 + bob);
    ctx.stroke();

    // Paws
    ctx.fillStyle = "#ff80ab";
    ctx.beginPath();
    ctx.ellipse(-6 + waddle, 13 + bob, 4, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(6 - waddle, 13 + bob, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = "#757575";
    ctx.beginPath();
    ctx.ellipse(0, 3 + bob, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(8, -2 + bob, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.ellipse(13, -1 + bob, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff80ab";
    ctx.beginPath();
    ctx.arc(17, -1 + bob, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Ears with Inner Pink Lining
    ctx.fillStyle = "#757575";
    ctx.beginPath();
    ctx.arc(4, -10 + bob, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff80ab";
    ctx.beginPath();
    ctx.arc(4, -10 + bob, 4, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(14, -1 + bob);
    ctx.lineTo(21, -4 + bob);
    ctx.moveTo(14, 1 + bob);
    ctx.lineTo(21, 4 + bob);
    ctx.stroke();

    // Eye with Specular Glint
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(9, -4 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(10, -4.5 + bob, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCrow(bob) {
    const wingFlap = Math.sin(frames * 0.35) * 6;

    // Body
    ctx.fillStyle = "#1a237e";
    ctx.beginPath();
    ctx.ellipse(0, 3 + bob, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flapping Iridescent Wing
    ctx.fillStyle = "#303f9f";
    ctx.beginPath();
    ctx.ellipse(-2, -2 + bob + wingFlap, 11, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Tail Feathers
    ctx.fillStyle = "#0d47a1";
    ctx.beginPath();
    ctx.moveTo(-12, 4 + bob);
    ctx.lineTo(-20, 2 + bob);
    ctx.lineTo(-18, 10 + bob);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = "#1a237e";
    ctx.beginPath();
    ctx.arc(10, -4 + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Golden Curved Beak with Sheen
    ctx.fillStyle = "#fbc02d";
    ctx.beginPath();
    ctx.moveTo(15, -6 + bob);
    ctx.lineTo(26, -2 + bob);
    ctx.lineTo(15, 2 + bob);
    ctx.closePath();
    ctx.fill();

    // Eye with Glint
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(12, -6 + bob, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(13, -6 + bob, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(13.5, -6.5 + bob, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCat(bob) {
    const tailWag = Math.sin(frames * 0.2) * 5;

    // Striped Tail
    ctx.strokeStyle = "#e65100";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-12, 4 + bob);
    ctx.quadraticCurveTo(-20, -6 + bob + tailWag, -18, -14 + bob);
    ctx.stroke();

    // Body
    ctx.fillStyle = "#fb8c00";
    ctx.beginPath();
    ctx.ellipse(0, 4 + bob, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Chest Patch
    ctx.fillStyle = "#fff8e0";
    ctx.beginPath();
    ctx.ellipse(4, 7 + bob, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#fb8c00";
    ctx.beginPath();
    ctx.arc(10, -4 + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    // Ears with Inner Pink Lining
    ctx.beginPath();
    ctx.moveTo(4, -10 + bob);
    ctx.lineTo(8, -18 + bob);
    ctx.lineTo(11, -11 + bob);
    ctx.moveTo(11, -11 + bob);
    ctx.lineTo(16, -17 + bob);
    ctx.lineTo(18, -9 + bob);
    ctx.fill();
    ctx.fillStyle = "#ff80ab";
    ctx.beginPath();
    ctx.moveTo(6, -11 + bob);
    ctx.lineTo(8, -16 + bob);
    ctx.lineTo(10, -11 + bob);
    ctx.fill();

    // Emerald Cat Eyes with Slit Pupil
    ctx.fillStyle = "#76ff03";
    ctx.beginPath();
    ctx.arc(13, -5 + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.fillRect(13, -7 + bob, 1, 4);

    // Whiskers
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(15, -3 + bob);
    ctx.lineTo(23, -5 + bob);
    ctx.moveTo(15, -1 + bob);
    ctx.lineTo(23, 2 + bob);
    ctx.stroke();
  }

  function drawFox(bob) {
    const tailWag = Math.sin(frames * 0.18) * 4;

    // Body
    ctx.fillStyle = "#e65100";
    ctx.beginPath();
    ctx.ellipse(0, 4 + bob, 15, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bushy Fluffy Tail with White Tip
    ctx.fillStyle = "#e65100";
    ctx.beginPath();
    ctx.ellipse(-16, 2 + bob + tailWag, 11, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-24, 0 + bob + tailWag, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Chest Fur
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(5, 7 + bob, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#e65100";
    ctx.beginPath();
    ctx.arc(11, -4 + bob, 9.5, 0, Math.PI * 2);
    ctx.fill();

    // White Muzzle & Nose Button
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(17, -2 + bob, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.arc(22, -2 + bob, 2, 0, Math.PI * 2);
    ctx.fill();

    // Ears with Dark Tips
    ctx.fillStyle = "#e65100";
    ctx.beginPath();
    ctx.moveTo(5, -11 + bob);
    ctx.lineTo(8, -20 + bob);
    ctx.lineTo(13, -11 + bob);
    ctx.fill();
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.moveTo(6, -12 + bob);
    ctx.lineTo(8, -19 + bob);
    ctx.lineTo(10, -12 + bob);
    ctx.fill();
  }

  function drawBull(bob, f) {
    // Steaming Nostril Smoke Particles
    if (f && frames % 12 === 0) {
      feathers.push({
        x: f.x + f.w / 2 + 18,
        y: f.y + f.h / 2 + bob,
        vx: 1 + Math.random(),
        vy: -0.5,
        rot: 0,
        vRot: 0.05,
        size: 3,
        color: "rgba(255,255,255,0.4)",
        life: 16,
        maxLife: 16,
      });
    }

    // Muscular Body
    ctx.fillStyle = "#4e342e";
    ctx.beginPath();
    ctx.ellipse(0, 4 + bob, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = "#3e2723";
    ctx.beginPath();
    ctx.ellipse(14, -6 + bob, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Horns with Ivory Highlight
    const gHorn = ctx.createLinearGradient(10, -14, -4, -28);
    gHorn.addColorStop(0, "#d7ccc8");
    gHorn.addColorStop(1, "#fff8e0");
    ctx.fillStyle = gHorn;
    ctx.beginPath();
    ctx.moveTo(10, -14 + bob);
    ctx.quadraticCurveTo(4, -28 + bob, -4, -24 + bob);
    ctx.quadraticCurveTo(6, -20 + bob, 12, -12 + bob);
    ctx.fill();

    // Furious Glowing Crimson Eye
    ctx.fillStyle = "#ff1744";
    ctx.shadowColor = "#ff1744";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(18, -8 + bob, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Polished Golden Nose Ring
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(26, -2 + bob, 4.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawClover(anim) {
    const spin = anim * 0.08;
    const pulse = 1 + 0.1 * Math.sin(anim * 0.3);
    ctx.rotate(spin);
    ctx.scale(pulse, pulse);

    ctx.shadowColor = "#00e676";
    ctx.shadowBlur = 18;

    // 4 Petals with Radial Gradient
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      const gClover = ctx.createRadialGradient(0, -9, 1, 0, -9, 9);
      gClover.addColorStop(0, "#b9f6ca");
      gClover.addColorStop(0.5, "#00e676");
      gClover.addColorStop(1, "#1b5e20");
      ctx.fillStyle = gClover;
      ctx.beginPath();
      ctx.ellipse(0, -9, 7.5, 9.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Golden Stem
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(4, 15);
    ctx.stroke();
  }

  function drawMount(bob) {
    const earWiggle = Math.sin(frames * 0.25) * 2;

    // Layered Fluffy White Fleece Clouds
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 6;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 11, 4 + bob + Math.sin(a) * 8, 8.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 4 + bob, 12.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dark Sheep Face
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.ellipse(14, -2 + bob, 8.5, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Wiggling Ears
    ctx.beginPath();
    ctx.ellipse(10, -8 + bob + earWiggle, 5.5, 2.8, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eye with Glint
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(16, -3 + bob, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.arc(16.5, -3 + bob, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Black Hooves
    ctx.fillStyle = "#212121";
    ctx.fillRect(-8, 12 + bob, 4, 8);
    ctx.fillRect(4, 12 + bob, 4, 8);
  }

  function drawCoin(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    const squash = 0.55 + 0.45 * Math.abs(Math.sin(c.spin));
    ctx.scale(squash, 1);

    if (starTimer > 0) {
      ctx.shadowColor = "#76ff03";
      ctx.shadowBlur = 14;
    } else if (currentMount) {
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 10;
    }

    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, c.r);
    g.addColorStop(0, "#ffe566");
    g.addColorStop(1, "#d4a017");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#a87810";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#a87810";
    ctx.font = "900 10px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 1);
    ctx.restore();
  }

  function drawRedApple(m) {
    if (m._got || !m.pipeRef) return;
    ctx.save();

    if (m.emerge < m.emergeMax) {
      ctx.beginPath();
      const mouthY = m.onTop ? m.pipeRef.top : m.pipeRef.top + pipeGap;
      ctx.rect(m.pipeRef.x - 10, mouthY - (m.onTop ? 0 : m.h + 14), pipeWidth + 20, m.h + 14);
      ctx.clip();
    }

    const growPulse = m.emerge >= m.emergeMax ? Math.sin(frames * 0.1) * 1.5 : 0;
    ctx.translate(m.x + m.w / 2, m.y + m.h / 2 + growPulse);

    const capGrad = ctx.createRadialGradient(-4, -5, 3, 0, -3, 18);
    capGrad.addColorStop(0, "#ff7043");
    capGrad.addColorStop(0.4, "#d32f2f");
    capGrad.addColorStop(1, "#b71c1c");
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4caf50";
    ctx.beginPath();
    ctx.ellipse(5, -16, 6, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(2, -20);
    ctx.stroke();

    ctx.restore();
  }

  function drawExplosion(ex) {
    const t = ex.life / ex.maxLife;
    for (const p of ex.parts) {
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = t * 0.85;
    const g = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, ex.r * (1.3 - t * 0.3));
    g.addColorStop(0, "#fff");
    g.addColorStop(0.35, ex.color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.r * (1.3 - t * 0.3), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawFeathers() {
    for (const f of feathers) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.life / f.maxLife);
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.fillStyle = f.color || "#fff3c4";
      ctx.beginPath();
      ctx.ellipse(0, 0, f.size, f.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEgg(egg) {
    ctx.save();
    ctx.translate(egg.x, egg.y);

    if (egg.isSpecial) {
      ctx.rotate(egg.rot || egg.x * 0.18);
      const r = egg.r || 10;
      ctx.shadowColor = egg.shellColor || "#ffd700";
      ctx.shadowBlur = 12;

      const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, egg.shellColor || "#ffd700");
      g.addColorStop(1, "#ff6f00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.rotate(egg.rot || egg.x * 0.05);

      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#fff3c4";
      ctx.beginPath();
      ctx.ellipse(-8, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, egg.r);
      g.addColorStop(0, "#fffef5");
      g.addColorStop(1, "#f0c860");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, egg.r * 0.85, egg.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d4a84b";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawDuck() {
    ctx.save();
    ctx.translate(duck.x + duck.w / 2, duck.y + duck.h / 2);

    if (dismountInvincibleTimer > 0 && Math.floor(frames / 4) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (currentMount) {
      ctx.save();
      ctx.translate(-4, 14);
      const mountBob = Math.sin(duck.wing) * 2;
      drawMount(mountBob);
      ctx.restore();
      ctx.translate(0, -12);
    }

    ctx.rotate(duck.rotation);

    const wingFlap = Math.sin(duck.wing);
    const squishX = 1 + wingFlap * 0.08;
    const squishY = 1 - wingFlap * 0.08;
    ctx.scale(squishX, squishY);

    let primaryColor = "#ffd700";
    let bellyColor = "#fff8d6";
    let wingColor = "#f5af19";
    let beakColor = "#ff5722";

    if (starTimer > 0) {
      const hue = (frames * 22) % 360;
      primaryColor = `hsl(${hue}, 100%, 60%)`;
      bellyColor = `hsl(${(hue + 60) % 360}, 100%, 78%)`;
      wingColor = `hsl(${(hue + 120) % 360}, 100%, 60%)`;
      beakColor = `hsl(${(hue + 200) % 360}, 100%, 60%)`;

      ctx.shadowColor = `hsl(${hue}, 100%, 65%)`;
      ctx.shadowBlur = 24;

      ctx.strokeStyle = `hsl(${(hue + 180) % 360}, 100%, 75%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + Math.sin(frames * 0.3) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Fluffy Tail Feathers at Back
    ctx.fillStyle = "#ff8f00";
    ctx.beginPath();
    ctx.ellipse(-18, -2, 6, 4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(-17, 2, 6, 4, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Body Gradient
    const gDuck = ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
    gDuck.addColorStop(0, "#ffea00");
    gDuck.addColorStop(0.7, primaryColor);
    gDuck.addColorStop(1, "#ff8f00");
    ctx.fillStyle = gDuck;
    ctx.beginPath();
    ctx.ellipse(0, 2, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Belly Shading
    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(3, 6, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Layered Wing Feathers
    const wingPhase = wingFlap * 0.85;
    ctx.fillStyle = wingColor;
    ctx.save();
    ctx.translate(-2, 0);
    ctx.rotate(wingPhase - 0.15);
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 8.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff8f00";
    ctx.beginPath();
    ctx.ellipse(-2, 2, 10, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head
    ctx.fillStyle = gDuck;
    ctx.beginPath();
    ctx.arc(13, -6, 11, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Pink Cheek
    ctx.fillStyle = "rgba(255, 128, 171, 0.5)";
    ctx.beginPath();
    ctx.arc(12, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Eye with Glint
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(16, -8, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(17, -8, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(18, -9, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Curved Orange Bill with Nostril & Smile
    ctx.fillStyle = beakColor;
    ctx.beginPath();
    ctx.moveTo(22, -6);
    ctx.quadraticCurveTo(34, -7, 36, -3);
    ctx.quadraticCurveTo(30, 2, 22, 1);
    ctx.closePath();
    ctx.fill();

    // Nostril Dot
    ctx.fillStyle = "#d84315";
    ctx.beginPath();
    ctx.arc(27, -4.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    if (starTimer > 0) {
      ctx.font = "900 11px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#00e676";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2.5;
      ctx.strokeText("🍀 CLOVER SHIELD 🍀", 0, -28);
      ctx.fillText("🍀 CLOVER SHIELD 🍀", 0, -28);
    } else if (currentMount) {
      const mountName = currentMount === "oinky" ? "🐷 OINKY" : currentMount === "billy" ? "🐐 BILLY" : "🐑 WOOLY";
      ctx.font = "900 11px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd700";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2.5;
      ctx.strokeText(`${mountName} ARMOR`, 0, -28);
      ctx.fillText(`${mountName} ARMOR`, 0, -28);
    }

    ctx.restore();
  }

  function drawPopups() {
    const minX = 45;
    const maxX = W - 45;
    for (const p of popups) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life / 12);
      ctx.font = `900 ${p.big ? 18 : 14}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "#081926";
      ctx.lineWidth = 3.5;
      ctx.fillStyle = p.color || "#ffd700";
      const px = Math.max(minX, Math.min(maxX, p.x));
      ctx.strokeText(p.text, px, p.y);
      ctx.fillText(p.text, px, p.y);
      ctx.restore();
    }
  }

  function drawAimAssist() {
    // Dotted aim line disabled so lock-on operates invisibly
    return;
  }

  // ============================================================
  //  GAME LOGIC & FARM MOUNT MECHANICS
  // ============================================================
  function mountFarmAnimal(f) {
    if (f) f.exploding = true;
    currentMount = "wooly";
    isRidingYoshi = true;

    makeExplosion(duck.x + 20, duck.y + 20, "#ffffff", true);
    AudioFX.sheepBaa();
    popups.push({
      x: duck.x + duck.w / 2,
      y: duck.y - 25,
      life: 60,
      text: "🐑 MOUNTED WOOLY THE SHEEP!",
      color: "#ffffff",
      big: true,
    });
  }

  const RED_APPLE_SVG = `<svg class="mush-icon-svg active" viewBox="0 0 24 24"><path d="M12 5 C8 2 4 6 4 11 C4 17 8 21 12 21 C16 21 20 17 20 11 C20 6 16 2 12 5 Z" fill="#ff3d00"/><path d="M12 5 Q14 2 15 1" stroke="#5d4037" stroke-width="2" fill="none"/><path d="M14 3 Q17 1 18 4 Z" fill="#4caf50"/></svg>`;
  const EMPTY_APPLE_SVG = `<svg class="mush-icon-svg" viewBox="0 0 24 24"><path d="M12 5 C8 2 4 6 4 11 C4 17 8 21 12 21 C16 21 20 17 20 11 C20 6 16 2 12 5 Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.3)" stroke-width="1.2"/></svg>`;

  function updateExtraLivesUI() {
    const iconsEl = document.getElementById("lives-icons");
    if (!extraLivesEl) return;
    if (iconsEl) {
      let html = "";
      for (let i = 0; i < MAX_EXTRA_LIVES; i++) {
        if (i < extraLives) html += RED_APPLE_SVG;
        else html += EMPTY_APPLE_SVG;
      }
      iconsEl.innerHTML = html;
    }
    if (state === STATE.PLAYING) {
      extraLivesEl.classList.remove("hidden");
    } else {
      extraLivesEl.classList.add("hidden");
    }
  }

  function useExtraLife() {
    extraLives--;
    updateExtraLivesUI();
    dismountInvincibleTimer = 150;
    duck.vy = -5.5;
    makeExplosion(duck.x + 20, duck.y + 20, "#ff3d00", true);
    AudioFX.oneUpUse();
    popups.push({
      x: duck.x + duck.w / 2,
      y: duck.y - 20,
      life: 60,
      text: `🍎 RED APPLE USED! (${extraLives}/3 LIVES)`,
      color: "#ff3d00",
      big: true,
    });
  }

  function dismountAnimal() {
    currentMount = null;
    isRidingYoshi = false;
    dismountInvincibleTimer = 150;
    duck.vy = -5.5;
    makeExplosion(duck.x + 20, duck.y + 30, "#ffd700", true);
    AudioFX.mountDismount();
    popups.push({
      x: duck.x + 20,
      y: duck.y - 20,
      life: 60,
      text: "💔 MOUNT SAVED YOU! (RECOVERY SHIELD)",
      color: "#ff5252",
      big: true,
    });
  }

  function pickEnemyType(allowedKeys) {
    const pool = [];
    const keys = allowedKeys || Object.keys(ENEMIES);
    for (const key of keys) {
      if (!ENEMIES[key]) continue;
      const w = ENEMIES[key].weight;
      const count = Math.max(1, Math.round(w * 10));
      for (let i = 0; i < count; i++) pool.push(key);
    }
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : "mouse";
  }

  function resetGame() {
    duck.x = 86;
    duck.y = H / 2 - 20;
    duck.vy = 0;
    duck.rotation = 0;
    duck.wing = 0;
    farmer.x = W - 18;
    farmer.y = H / 2;
    farmer.direction = 1;
    pipes = [];
    foes = [];
    eggs = [];
    coins = [];
    mushrooms = [];
    popups = [];
    explosions = [];
    feathers = [];
    sectionCounter = 0;
    score = 0;
    frames = 0;
    pipeTimer = 0;
    shootCooldown = 0;
    combo = 0;
    comboTimer = 0;
    powerRapid = 0;
    shakeTime = 0;
    starTimer = 0;
    currentMount = null;
    isRidingYoshi = false;
    dismountInvincibleTimer = 0;
    extraLives = 0;
    updateExtraLivesUI();
    pipeSpeed = 2.35;
    groundOffset = 0;
    gameStats = {
      pestsScared: 0,
      foesBlasted: 0,
      eggsFired: 0,
      eggsDelivered: 0,
      maxCombo: 1,
      coinsCollected: 0,
      coinsPts: 0,
      timeAliveFrames: 0,
    };
    updateLiveStatsUI();
    if (deliveredCountEl) deliveredCountEl.textContent = "0";
    if (scoreEl) scoreEl.textContent = "0";
    comboEl.classList.add("hidden");
    multBar.classList.add("hidden");
    AudioFX.stopMusic();
  }

  function spawnPipe() {
    sectionCounter++;
    const sectionType = sectionCounter % 2 === 1 ? "pest" : "coin";
    const minTop = 60;
    const maxTop = H - GROUND_H - pipeGap - 105;
    const top = minTop + Math.random() * Math.max(20, maxTop - minTop);
    const styles = ["hay", "silo", "corn", "barn"];
    const style = styles[Math.floor(Math.random() * styles.length)];

    const p = {
      x: W + 10,
      top,
      gap: pipeGap,
      style,
      sectionType,
      sectionIndex: sectionCounter,
      passed: false,
      spawnedFoe: false,
      spawnedCoins: false,
    };
    pipes.push(p);

    // Red Apples spawn exclusively in Coin sections and are rare (~14% chance)
    if (sectionType === "coin" && Math.random() < 0.14) {
      const onTop = Math.random() < 0.5;
      mushrooms.push({
        w: 36,
        h: 36,
        pipeRef: p,
        onTop,
        emerge: 0,
        emergeMax: 36,
        _got: false,
      });
    }
  }

  function spawnFoe(pipe, allowedTypes) {
    const type = pickEnemyType(allowedTypes);
    const def = ENEMIES[type];
    const fromBottom = Math.random() < 0.7;
    const emergeMax = def.h + 12;
    const baseX = pipe.x + pipeWidth / 2 - def.w / 2;
    const y = fromBottom ? pipe.top + pipe.gap + 4 : pipe.top - def.h - 4;

    foes.push({
      type,
      x: baseX,
      y,
      w: def.w,
      h: def.h,
      vy: 0,
      vx: 0,
      phase: "emerging",
      emerge: 0,
      emergeMax,
      from: fromBottom ? "bottom" : "top",
      anim: 0,
      exploding: false,
      faceLeft: true,
      pipeRef: pipe,
      homeX: baseX - pipe.x,
      points: def.points,
      name: def.name,
      speed: def.speed,
      hop: def.hop,
      hover: def.hover || 0.5,
      friendly: !!def.friendly,
      explodeColor: def.explodeColor,
      laneBias: pipe.top + pipe.gap * 0.35 + Math.random() * pipe.gap * 0.3,
      hp: type === "bull" ? 3 : 1,
      maxHp: type === "bull" ? 3 : 1,
    });
  }

  function spawnCoins(pipe) {
    const gapCenter = pipe.top + pipe.gap / 2;
    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const offsetX = (i - (count - 1) / 2) * 22;
      const offsetY = Math.sin((i / (count - 1)) * Math.PI) * -16;
      coins.push({
        x: pipe.x + pipeWidth / 2 + offsetX,
        y: gapCenter + offsetY,
        r: 9.5,
        vx: 0,
        vy: 0,
        spin: Math.random() * Math.PI,
        life: 500,
      });
    }
  }

  function spawnDust(x, y, color = "rgba(220, 220, 220, 0.65)") {
    dustPuffs.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 4,
      vx: -1.2 - Math.random() * 1.5,
      vy: -0.4 - Math.random() * 0.8,
      r: 2.5 + Math.random() * 3.5,
      color,
      life: 18,
      maxLife: 18,
    });
  }

  function spawnEggSplat(x, y) {
    for (let i = 0; i < 9; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 3.5;
      eggSplats.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 1.0,
        r: 1.8 + Math.random() * 2.8,
        color: i % 2 === 0 ? "#fff59d" : "#ffffff",
        life: 16,
        maxLife: 16,
      });
    }
  }

  function spawnSparkles(x, y, color = "#ffd700") {
    sparkles.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 14,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -1.2 - Math.random() * 1.5,
      rot: Math.random() * Math.PI,
      vRot: 0.15,
      size: 3.5 + Math.random() * 3.5,
      color,
      life: 22,
      maxLife: 22,
    });
  }

  function spawnFeathers(x, y, colorOverride) {
    for (let i = 0; i < 5; i++) {
      feathers.push({
        x,
        y,
        vx: -1 - Math.random() * 2.5,
        vy: Math.random() * 2.5 - 1.2,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.12,
        size: 4 + Math.random() * 4.5,
        color: colorOverride || (starTimer > 0 ? "#00e676" : (i % 2 === 0 ? "#ffd700" : "#fff8d6")),
        life: 28,
        maxLife: 28,
      });
    }
  }

  function makeExplosion(x, y, color, big) {
    const parts = [];
    const n = big ? 22 : 14;
    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const sp = 2.2 + Math.random() * (big ? 5.5 : 3.8);
      parts.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 1.2,
        size: 3 + Math.random() * (big ? 6 : 4),
        color: i % 3 === 0 ? "#fff" : i % 3 === 1 ? color : "#ff9a3c",
      });
    }
    explosions.push({
      x,
      y,
      color,
      r: big ? 44 : 30,
      life: big ? 30 : 22,
      maxLife: big ? 30 : 22,
      parts,
    });
    if (big) shakeTime = 12;
  }

  const MAX_LOCKON_DIST = 100; // Auto-aim lock-on only kicks in when target is very close!

  function nearestFoe() {
    let bestF = null;
    let bestD = MAX_LOCKON_DIST;
    const ox = duck.x + duck.w;
    const oy = duck.y + duck.h / 2;
    for (const f of foes) {
      if (f.exploding || f.phase === "emerging") continue;
      const cx = f.x + f.w / 2;
      const cy = f.y + f.h / 2;
      // Enemy MUST be in front of the duck! Once passed behind, do not lock on.
      if (cx <= duck.x + 5) continue;

      const dx = cx - ox;
      const dy = cy - oy;
      const d = Math.hypot(dx, dy);
      if (d < bestD) {
        bestD = d;
        bestF = f;
      }
    }
    return bestF;
  }

  function flap() {
    if (state === STATE.READY) {
      startPlaying();
      return;
    }
    if (state === STATE.PLAYING) {
      duck.vy = flapPower;
      duck.wing = 0;
      spawnFeathers(duck.x + 10, duck.y + duck.h / 2);
      AudioFX.flap();
    }
  }

  function currentShootDelay() {
    if (powerRapid > 0) return 4;
    if (combo >= 4) return 5;
    if (combo >= 2) return 6;
    return shootDelay;
  }

  function shoot() {
    if (state !== STATE.PLAYING) return;
    if (shootCooldown > 0) return;

    const angle = duck.rotation * 0.5;
    const noseX = duck.x + duck.w / 2 + Math.cos(angle) * 30;
    const noseY = duck.y + duck.h / 2 + Math.sin(angle) * 8 - 4;
    const target = nearestFoe();

    const shots = combo >= 5 ? 3 : combo >= 3 ? 2 : 1;
    for (let i = 0; i < shots; i++) {
      let vx = eggSpeed;
      let vy = Math.sin(angle) * eggSpeed * 0.35;
      if (shots === 2) vy += i === 0 ? -1.6 : 1.6;
      if (shots === 3) vy += (i - 1) * 2.0;
      if (target) {
        const tx = target.x + target.w / 2;
        const ty = target.y + target.h / 2;
        const dx = tx - noseX;
        const dy = ty - noseY;
        const len = Math.hypot(dx, dy) || 1;
        vx = (dx / len) * eggSpeed;
        vy = (dy / len) * eggSpeed * 0.85 + vy * 0.15;
      }

      if (currentMount) {
        eggs.push({
          x: noseX,
          y: noseY + (shots > 1 ? (i - (shots - 1) / 2) * 6 : 0),
          vx: vx * 1.25,
          vy,
          r: 10,
          rot: 0,
          life: 110,
          isSpecial: true,
          shellColor: currentMount === "billy" ? "#ffd54f" : currentMount === "wooly" ? "#e0e0e0" : "#ff80ab",
          targetId: target ? target._id : null,
        });
      } else {
        eggs.push({
          x: noseX,
          y: noseY + (shots > 1 ? (i - (shots - 1) / 2) * 5 : 0),
          vx,
          vy,
          r: eggRadius,
          rot: 0,
          life: 90,
          targetId: target ? target._id : null,
        });
      }
      gameStats.eggsFired++;
    }
    shootCooldown = currentShootDelay();
    if (currentMount) AudioFX.shellShoot();
    else AudioFX.shoot();
  }

  async function startPlaying() {
    await AudioFX.unlock();
    savePlayerName();
    resetGame();
    state = STATE.PLAYING;
    updateExtraLivesUI();
    startScreen.classList.add("hidden");
    if (tallyScreen) tallyScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    hudEl.classList.remove("hidden");
    bestEl.classList.add("hidden");
    touchControls.classList.remove("hidden");
    if (deliveredChip) deliveredChip.classList.add("hidden");
    duck.vy = flapPower;
    AudioFX.flap();
    AudioFX.startMusic();
  }

  function showMenu() {
    state = STATE.READY;
    starTimer = 0;
    currentMount = null;
    isRidingYoshi = false;
    AudioFX.stopMusic();
    if (extraLivesEl) extraLivesEl.classList.add("hidden");
    if (deliveredChip) deliveredChip.classList.add("hidden");
    if (tallyScreen) tallyScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    hudEl.classList.add("hidden");
    touchControls.classList.add("hidden");
    if (best > 0) {
      bestEl.textContent = `Best: ${best}`;
      bestEl.classList.remove("hidden");
    }
    fetchLeaderboard();
  }

  function animateScoreTally(pestsPts, coinsCount, coinsPts, timeSec, timePts, subtotal, eggs, mult, finalScore) {
    if (!tallyPestsPts || !tallyCoinsPts || !tallyTimePts || !tallySubtotal || !tallyDeliveredMult || !tallyFinalScore || !tallyContinueBtn) return;

    tallyPestsPts.textContent = "0 pts";
    tallyCoinsPts.textContent = "0 (+0 pts)";
    tallyTimePts.textContent = "0s (+0 pts)";
    tallySubtotal.textContent = "0";
    tallyDeliveredMult.textContent = "0 Eggs (x1.00)";
    tallyFinalScore.textContent = "0";

    tallyContinueBtn.disabled = true;
    tallyContinueBtn.textContent = "TALLYING SCORE...";
    tallyContinueBtn.classList.remove("active-ready");

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        tallyPestsPts.textContent = `${pestsPts} pts`;
        AudioFX.scorePing(50);
      } else if (step === 2) {
        tallyCoinsPts.textContent = `${coinsCount} (+${coinsPts} pts)`;
        AudioFX.coin();
      } else if (step === 3) {
        tallyTimePts.textContent = `${timeSec}s (+${timePts} pts)`;
        AudioFX.scorePing(85);
      } else if (step === 4) {
        tallySubtotal.textContent = String(subtotal);
        AudioFX.scorePing(130);
      } else if (step === 5) {
        tallyDeliveredMult.textContent = `${eggs} Eggs (x${mult})`;
        AudioFX.farmerCatch();
      } else if (step === 6) {
        tallyFinalScore.textContent = String(finalScore);
        AudioFX.oneUp();
      } else if (step === 7) {
        tallyContinueBtn.disabled = false;
        tallyContinueBtn.textContent = "▶ CONTINUE TO RESULTS";
        tallyContinueBtn.classList.add("active-ready");
        clearInterval(interval);
      }
    }, 420);
  }

  function die() {
    if (state !== STATE.PLAYING) return;
    state = STATE.DEAD;
    shakeTime = 16;
    starTimer = 0;
    currentMount = null;
    isRidingYoshi = false;
    AudioFX.stopMusic();
    AudioFX.hit();
    if (hudEl) hudEl.classList.add("hidden");
    if (playerChip) playerChip.classList.add("hidden");
    if (extraLivesEl) extraLivesEl.classList.add("hidden");
    if (deliveredChip) deliveredChip.classList.add("hidden");

    // Multi-Factor Score Calculation: Pests + Coins + Time multiplied by Farmer Eggs
    const pestsPts = gameStats.pestsScared;
    const coinsPts = gameStats.coinsPts || 0;
    const coinsCount = gameStats.coinsCollected;
    const timeAliveSec = Math.floor(gameStats.timeAliveFrames / 60);
    const timePts = timeAliveSec * 10;
    const subtotal = pestsPts + coinsPts + timePts;
    const eggsDelivered = gameStats.eggsDelivered;
    const multFactor = Math.max(1, eggsDelivered);
    const finalScore = Math.max(score, Math.round(subtotal * multFactor));

    score = finalScore;

    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
    }

    if (statFoesEl) statFoesEl.textContent = String(gameStats.foesBlasted);
    if (statShotsEl) statShotsEl.textContent = String(gameStats.eggsFired);
    if (statComboEl) statComboEl.textContent = `${gameStats.maxCombo}x`;
    if (statCoinsEl) statCoinsEl.textContent = String(gameStats.coinsCollected);

    finalBestEl.textContent = String(best);
    if (tallyScreen) tallyScreen.classList.remove("hidden");
    gameOverScreen.classList.add("hidden");
    touchControls.classList.add("hidden");

    animateScoreTally(pestsPts, coinsCount, coinsPts, timeAliveSec, timePts, subtotal, eggsDelivered, multFactor, finalScore);
  }

  function addScore(n, x, y, label, color, big) {
    score += n;
    gameStats.pestsScared += n;
    if (scoreEl) scoreEl.textContent = String(score);
    if (label) {
      popups.push({
        x,
        y,
        life: 40,
        text: label,
        color: color || "#ffd700",
        big: !!big,
      });
    }
  }

  function duckHitbox() {
    return { x: duck.x + 6, y: duck.y + (currentMount ? -4 : 5), w: duck.w - 12, h: duck.h + (currentMount ? 14 : -10) };
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function collidesPipes() {
    const box = duckHitbox();
    const groundY = H - GROUND_H;
    if (box.y + box.h >= groundY) return true;
    if (box.y <= 0) return true;

    if (starTimer > 0 || dismountInvincibleTimer > 0) return false;

    for (const p of pipes) {
      const inX = box.x + box.w > p.x && box.x < p.x + pipeWidth;
      if (!inX) continue;
      const gapTop = p.top;
      const gapBot = p.top + p.gap;
      if (box.y < gapTop || box.y + box.h > gapBot) {
        if (currentMount) {
          dismountAnimal();
          return false;
        }
        if (extraLives > 0) {
          useExtraLife();
          return false;
        }
        return true;
      }
    }
    return false;
  }

  let foeIdSeq = 1;

  function killFoe(f) {
    f.exploding = true;
    gameStats.foesBlasted++;
    if (livePestsEl) livePestsEl.textContent = String(gameStats.foesBlasted);

    if (f.type === "mouse") AudioFX.mouseSqueak();
    else if (f.type === "crow") AudioFX.crowCaw();
    else if (f.type === "cat") AudioFX.catMeow();
    else if (f.type === "fox") AudioFX.foxYip();
    else if (f.type === "bull") AudioFX.bullBellow();
    const big = f.type === "bull" || f.type === "clover" || f.type === "mount";
    makeExplosion(f.x + f.w / 2, f.y + f.h / 2, f.explodeColor, big);
    AudioFX.explode(big);

    if (f.type === "clover") {
      AudioFX.coin();
      addScore(150, f.x + f.w / 2, f.y, "🍀 CLOVER BLAST! +150", "#00e676", true);
    } else {
      AudioFX.scorePing(f.points);
    }

    combo++;
    if (combo > gameStats.maxCombo) gameStats.maxCombo = combo;
    comboTimer = 110;
    const mult = Math.min(combo, 6);
    const finalPts = f.points * mult;
    addScore(finalPts, f.x + f.w / 2, f.y, mult > 1 ? `+${finalPts} ${f.name} x${mult}` : `+${finalPts} ${f.name}`, f.explodeColor, big || mult > 2);

    if (combo > 1) {
      comboEl.textContent = `COMBO x${combo}`;
      comboEl.classList.remove("hidden");
    }
    multLabel.textContent = `MULT x${mult}`;
    multBar.classList.remove("hidden");

    for (let i = 0; i < (big ? 3 : 1); i++) {
      coins.push({
        x: f.x + f.w / 2 + (Math.random() - 0.5) * 20,
        y: f.y + f.h / 2,
        r: 8,
        vy: -2 - Math.random() * 2,
        vx: (Math.random() - 0.5) * 3,
        spin: 0,
        life: 200,
      });
    }
  }

  function updateFoes() {
    for (const f of foes) {
      f.anim++;
      if (f.exploding) continue;
      if (!f._id) f._id = foeIdSeq++;

      if (f.phase === "emerging") {
        if (f.pipeRef) f.x = f.pipeRef.x + f.homeX;
        f.emerge += 1.65;
        if (f.from === "bottom") {
          const mouthY = f.pipeRef.top + f.pipeRef.gap + 4;
          f.y = mouthY - Math.min(f.emerge, f.emergeMax);
        } else {
          const mouthY = f.pipeRef.top - 4;
          f.y = mouthY - f.h + Math.min(f.emerge, f.emergeMax);
        }
        if (f.emerge >= f.emergeMax) {
          f.phase = "active";
          f.vx = -f.speed * 0.9 - Math.random() * 0.3;
          f.vy = f.from === "bottom" ? -2.2 : 1.2;
          f.faceLeft = true;
          f.pipeRef = null;
          f.y = f.laneBias - f.h / 2;
          f.aiTimer = 0;
          f.aiState = "normal";
        }
        continue;
      }

      f.aiTimer = (f.aiTimer || 0) + 1;
      const targetY = f.laneBias - f.h / 2;

      // ------------------------------------------------------------
      //  UNIQUE PEST MOVEMENT STATE MACHINES
      // ------------------------------------------------------------
      if (f.type === "mouse") {
        // 🐭 Sneaky Mouse: Scurry-dash bursts & hopping gaps
        if (f.aiTimer % 35 < 18) {
          f.vx = -f.speed * 1.8;
          if (frames % 4 === 0) spawnDust(f.x + f.w / 2, f.y + f.h, "#9e9e9e");
        } else if (f.aiTimer % 35 < 28) {
          f.vx = -f.speed * 0.4;
        } else {
          f.vx = -f.speed * 1.2;
          if (f.aiTimer % 35 === 28) f.vy = -3.4;
        }
        f.vy += (targetY - f.y) * 0.03;
        f.vy *= 0.94;

      } else if (f.type === "crow") {
        // 🐦 Crow: Sinusoidal swooping + Dive-bomb arc toward duck
        const baseSine = Math.sin(f.anim * 0.12) * 2.2;
        if (f.aiState === "diving") {
          f.vy += 0.35;
          if (f.y >= duck.y - 10 || f.aiTimer > 45) {
            f.aiState = "swooping_up";
          }
          if (frames % 3 === 0) {
            feathers.push({
              x: f.x + f.w / 2,
              y: f.y + f.h / 2,
              vx: 0.8,
              vy: -1,
              rot: Math.random() * Math.PI,
              vRot: 0.1,
              size: 3,
              color: "#1a237e",
              life: 18,
              maxLife: 18,
            });
          }
        } else if (f.aiState === "swooping_up") {
          f.vy -= 0.45;
          if (f.y <= targetY - 20) {
            f.aiState = "normal";
          }
        } else {
          f.vy = baseSine;
          if (f.x > duck.x + 40 && f.x < duck.x + 190 && Math.random() < 0.015) {
            f.aiState = "diving";
            f.aiTimer = 0;
          }
        }
        f.vx = -f.speed * (f.aiState === "diving" ? 1.4 : 1.0);

      } else if (f.type === "cat") {
        // 🐱 Sneaky Cat: Stealth creep + Pounce leap when eggs approach
        const nearbyEgg = eggs.find(
          (e) => !e._hit && Math.hypot(e.x - f.x, e.y - f.y) < 115
        );
        if (nearbyEgg && f.aiState !== "pouncing" && f.y > 60) {
          f.aiState = "pouncing";
          f.vy = -6.4;
          f.vx = -f.speed * 1.5;
          spawnDust(f.x + f.w / 2, f.y + f.h, "#ff9800");
        } else if (f.aiState === "pouncing") {
          f.vy += 0.32;
          if (f.y >= targetY) {
            f.y = targetY;
            f.aiState = "normal";
          }
        } else {
          f.vx = -f.speed * 1.05;
          f.vy += (targetY - f.y) * 0.02;
          f.vy *= 0.94;
        }

      } else if (f.type === "fox") {
        // 🦊 Sly Fox: Serpentine weave + Evasive side-step dodge
        const waveY = Math.sin(f.anim * 0.1) * 2.8;
        const incomingEgg = eggs.find(
          (e) => !e._hit && e.vx > 0 && e.x < f.x && f.x - e.x < 130 && Math.abs(e.y - f.y) < 45
        );
        if (incomingEgg && f.aiState !== "evading") {
          f.aiState = "evading";
          f.aiTimer = 0;
          f.evadeDir = incomingEgg.y < f.y ? 1 : -1;
          spawnDust(f.x + f.w / 2, f.y + f.h, "#ff3d00");
        }
        if (f.aiState === "evading") {
          f.vy = f.evadeDir * 4.5;
          f.vx = -f.speed * 2.1;
          if (f.aiTimer > 14) f.aiState = "normal";
        } else {
          f.vx = -f.speed * 1.15;
          f.vy = waveY + (targetY - f.y) * 0.015;
        }

      } else if (f.type === "bull") {
        // 🐂 Angry Bull: Heavy 3 HP charge bursts & stomping screen shake
        if (f.aiTimer % 90 < 25) {
          f.vx = -f.speed * 0.4;
          f.vy = Math.sin(f.anim * 0.2) * 0.8;
        } else if (f.aiTimer % 90 < 55) {
          f.vx = -f.speed * 2.3;
          f.vy = (targetY - f.y) * 0.02;
          if (frames % 6 === 0) {
            spawnDust(f.x + f.w / 2, f.y + f.h, "#795548");
            shakeTime = Math.max(shakeTime, 2);
          }
        } else {
          f.vx = -f.speed * 0.9;
          f.vy = (targetY - f.y) * 0.02;
        }

      } else if (f.type === "clover") {
        // 🍀 Clover: Swirling corkscrew spiral path
        f.vx = -f.speed * 0.85;
        f.y = targetY + Math.sin(f.anim * 0.14) * 26 + Math.cos(f.anim * 0.08) * 10;
        f.vy = 0;
        if (frames % 5 === 0) spawnSparkles(f.x + f.w / 2, f.y + f.h / 2, "#00e676");

      } else if (f.type === "mount") {
        // 🐑 Wooly Sheep: Cloud-like buoyant bounce
        f.vx = -f.speed * 0.95;
        f.vy = Math.sin(f.anim * 0.08) * 1.6;

      } else {
        f.vy += (targetY - f.y) * 0.015 * f.hover;
        f.vy *= 0.95;
        f.vx = -f.speed;
      }

      f.x += f.vx;
      f.y += f.vy;

      const groundY = H - GROUND_H - f.h;
      if (f.y >= groundY) {
        f.y = groundY;
        f.vy = -f.hop * 0.65;
      }
      if (f.y < 8) {
        f.y = 8;
        f.vy = Math.abs(f.vy) * 0.4;
      }
      f.faceLeft = f.x > duck.x - 20;
    }
    foes = foes.filter((f) => {
      if (f.exploding) return false;
      if (f.x + f.w < -50) return false;
      if (f.y > H + 50) return false;
      return true;
    });
  }

  function updateEggs() {
    // Farmer Hitbox for Catching Eggs
    const farmerBox = {
      x: farmer.x - 16,
      y: farmer.y - 8,
      w: farmer.w + 24,
      h: farmer.h + 16,
    };

    for (const e of eggs) {
      e.life--;
      e.rot = (e.rot || 0) + (e.isSpecial ? 0.35 : 0.2);
      let target = null;
      if (e.targetId) {
        target = foes.find((f) => f._id === e.targetId && !f.exploding);
      }
      if (!target) target = nearestFoe();
      // If target passed behind the player, drop lock-on!
      if (target && target.x + target.w / 2 <= duck.x + 5) {
        target = null;
      }
      if (target) {
        const tx = target.x + target.w / 2;
        const ty = target.y + target.h / 2;
        const dx = tx - e.x;
        const dy = ty - e.y;
        const len = Math.hypot(dx, dy) || 1;
        e.vx += (dx / len) * eggSpeed * trackStrength * 0.15;
        e.vy += (dy / len) * eggSpeed * trackStrength * 0.15;
        const sp = Math.hypot(e.vx, e.vy) || 1;
        if (sp > eggSpeed * 1.2) {
          e.vx = (e.vx / sp) * eggSpeed * 1.2;
          e.vy = (e.vy / sp) * eggSpeed * 1.2;
        }
      }
      e.x += e.vx;
      e.y += e.vy;

      // Check collision between Egg & Moving Farmer / Basket!
      if (
        !e._caught &&
        e.x + e.r >= farmerBox.x &&
        e.x - e.r <= farmerBox.x + farmerBox.w &&
        e.y + e.r >= farmerBox.y &&
        e.y - e.r <= farmerBox.y + farmerBox.h
      ) {
        e._caught = true;
        gameStats.eggsDelivered++;
        farmer.catchAnim = 14;
        if (liveEggsEl) liveEggsEl.textContent = String(gameStats.eggsDelivered);
        if (deliveredCountEl) deliveredCountEl.textContent = String(gameStats.eggsDelivered);
        AudioFX.farmerCheer();
        const curMult = Math.max(1, gameStats.eggsDelivered);
        popups.push({
          x: farmer.x - 15,
          y: farmer.y - 12,
          life: 45,
          text: `🧺 EGG CAUGHT! (x${curMult})`,
          color: "#76ff03",
          big: true,
        });
      }
    }
    eggs = eggs.filter((e) => e.x < W + 30 && e.x > -20 && e.life > 0 && !e._caught);

    for (const e of eggs) {
      if (e._hit) continue;
      if (!e._hitFoes) e._hitFoes = new Set();

      for (const f of foes) {
        if (f.exploding || f.phase === "emerging" || e._hitFoes.has(f._id)) continue;
        const box = {
          x: f.x - hitPad / 2,
          y: f.y - hitPad / 2,
          w: f.w + hitPad,
          h: f.h + hitPad,
        };
        if (
          e.x + e.r > box.x &&
          e.x - e.r < box.x + box.w &&
          e.y + e.r > box.y &&
          e.y - e.r < box.y + box.h
        ) {
          e._hitFoes.add(f._id);
          spawnEggSplat(e.x, e.y);

          let dmg = starTimer > 0 ? 3 : e.isSpecial ? 1.5 : 1.0;

          if (f.type === "bull") {
            f.hp = (f.hp ?? 3) - dmg;
            makeExplosion(e.x, e.y, "#ff9100", false);
            AudioFX.hit();
            if (f.hp > 0) {
              const hitsLeft = Math.ceil(f.hp);
              popups.push({
                x: f.x + f.w / 2,
                y: f.y - 15,
                life: 40,
                text: `💥 BULL HIT! (${hitsLeft}/3)`,
                color: "#ff9100",
                big: false,
              });
            } else {
              killFoe(f);
            }
          } else {
            killFoe(f);
          }

          if (starTimer > 0 || e.isSpecial) {
            // Piercing ammo
          } else {
            e._hit = true;
            break;
          }
        }
      }
    }
    eggs = eggs.filter((e) => !e._hit);
  }

  function updateCoins() {
    const box = duckHitbox();
    for (const c of coins) {
      c.life--;
      c.spin += 0.12;
      c.x -= pipeSpeed;
      if (c.vx) c.x += c.vx;
      if (c.vy) {
        c.y += c.vy;
        c.vy += 0.04;
      }

      const dx = duck.x + duck.w / 2 - c.x;
      const dy = duck.y + duck.h / 2 - c.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (starTimer > 0 || currentMount) {
        const pull = 0.08 + Math.min(0.06, 40 / dist);
        c.x += dx * pull;
        c.y += dy * pull;
      } else if (dist < 90) {
        c.x += dx * 0.08;
        c.y += dy * 0.08;
      }

      if (dist < 26 || rectsOverlap(box, { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 })) {
        c._got = true;
        gameStats.coinsCollected++;
        if (liveCoinsEl) liveCoinsEl.textContent = String(gameStats.coinsCollected);
        const pts = 3 * Math.max(1, Math.min(combo, 3));
        gameStats.coinsPts = (gameStats.coinsPts || 0) + pts;
        score += pts;
        if (scoreEl) scoreEl.textContent = String(score);
        spawnSparkles(c.x, c.y, starTimer > 0 ? "#76ff03" : "#ffd700");
        popups.push({
          x: c.x,
          y: c.y,
          life: 40,
          text: `+${pts}`,
          color: starTimer > 0 ? "#76ff03" : "#ffd700",
          big: false,
        });
        AudioFX.coin();
      }
    }
    coins = coins.filter((c) => !c._got && c.life > 0 && c.x > -20);
  }

  function updateMushrooms() {
    const box = duckHitbox();
    for (const m of mushrooms) {
      if (m._got || !m.pipeRef) continue;
      m.x = m.pipeRef.x + pipeWidth / 2 - m.w / 2;

      if (m.emerge < m.emergeMax) {
        m.emerge += 1.4;
      }

      const mouthY = m.onTop ? m.pipeRef.top : m.pipeRef.top + pipeGap;
      m.y = mouthY - (m.onTop ? m.h : 0) + (m.onTop ? 1 : -1) * Math.min(m.emerge, m.emergeMax);

      const mbox = { x: m.x - 10, y: m.y - 8, w: m.w + 20, h: m.h + 16 };

      if (rectsOverlap(box, mbox)) {
        m._got = true;
        makeExplosion(m.x + m.w / 2, m.y + m.h / 2, "#ff3d00", true);
        AudioFX.appleCrunch();
        if (extraLives < MAX_EXTRA_LIVES) {
          extraLives++;
          updateExtraLivesUI();
          AudioFX.oneUp();
          popups.push({
            x: duck.x + duck.w / 2,
            y: duck.y - 25,
            life: 60,
            text: `🍎 RED APPLE +1 LIFE! (${extraLives}/${MAX_EXTRA_LIVES})`,
            color: "#ff3d00",
            big: true,
          });
        } else {
          addScore(100, duck.x + duck.w / 2, duck.y - 25, "🍎 APPLE MAX BONUS +100!", "#ffd700", true);
          AudioFX.coin();
        }
      }
    }
    mushrooms = mushrooms.filter((m) => !m._got && m.pipeRef && m.pipeRef.x + pipeWidth + 20 > 0);
  }

  function updateExplosions() {
    for (const ex of explosions) {
      ex.life--;
      for (const p of ex.parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16;
      }
    }
    explosions = explosions.filter((ex) => ex.life > 0);
  }

  function updateFeathers() {
    for (const f of feathers) {
      f.life--;
      f.x += f.vx;
      f.y += f.vy;
      f.rot += f.vRot;
    }
    feathers = feathers.filter((f) => f.life > 0);
  }

  function updateParticles() {
    for (const d of dustPuffs) {
      d.life--;
      d.x += d.vx;
      d.y += d.vy;
      d.r *= 1.03;
    }
    dustPuffs = dustPuffs.filter((d) => d.life > 0);

    for (const s of eggSplats) {
      s.life--;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.16;
    }
    eggSplats = eggSplats.filter((s) => s.life > 0);

    for (const sp of sparkles) {
      sp.life--;
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.rot += sp.vRot;
    }
    sparkles = sparkles.filter((sp) => sp.life > 0);
  }

  function drawDustPuffs() {
    for (const d of dustPuffs) {
      const alpha = d.life / d.maxLife;
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  function drawEggSplats() {
    for (const s of eggSplats) {
      const alpha = s.life / s.maxLife;
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  function drawSparkles() {
    for (const sp of sparkles) {
      const alpha = sp.life / sp.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(sp.x, sp.y);
      ctx.rotate(sp.rot);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.moveTo(0, -sp.size);
      ctx.lineTo(sp.size * 0.3, -sp.size * 0.3);
      ctx.lineTo(sp.size, 0);
      ctx.lineTo(sp.size * 0.3, sp.size * 0.3);
      ctx.lineTo(0, sp.size);
      ctx.lineTo(-sp.size * 0.3, sp.size * 0.3);
      ctx.lineTo(-sp.size, 0);
      ctx.lineTo(-sp.size * 0.3, -sp.size * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  function updatePopups() {
    for (const p of popups) {
      p.y -= 1.25;
      p.life--;
    }
    popups = popups.filter((p) => p.life > 0);
  }

  function checkFoeHitDuck() {
    const box = duckHitbox();
    for (const f of foes) {
      if (f.exploding || f.phase === "emerging") continue;

      if (f.type === "mount" && !currentMount) {
        if (rectsOverlap(box, { x: f.x, y: f.y, w: f.w, h: f.h })) {
          mountFarmAnimal(f);
          return false;
        }
        continue;
      }

      if (f.type === "clover") {
        if (rectsOverlap(box, { x: f.x, y: f.y, w: f.w, h: f.h })) {
          f.exploding = true;
          starTimer = 420;
          powerRapid = 420;
          AudioFX.startCloverMusic();
          popups.push({
            x: duck.x + duck.w / 2,
            y: duck.y - 20,
            life: 60,
            text: "🍀 FOUR-LEAF CLOVER POWER! 🍀",
            color: "#00e676",
            big: true,
          });
          return false;
        }
        continue;
      }

      if (f.friendly) continue;

      const mbox = { x: f.x + 6, y: f.y + 6, w: f.w - 12, h: f.h - 10 };
      if (rectsOverlap(box, mbox)) {
        if (starTimer > 0) {
          killFoe(f);
          makeExplosion(f.x + f.w / 2, f.y + f.h / 2, "#00e676", true);
          addScore(100, f.x + f.w / 2, f.y - 10, "🍀 CLOVER CRUSH! +100", "#00e676", true);
        } else if (dismountInvincibleTimer > 0) {
          continue;
        } else if (currentMount) {
          dismountAnimal();
          killFoe(f);
          return false;
        } else if (extraLives > 0) {
          useExtraLife();
          killFoe(f);
          return false;
        } else {
          return true;
        }
      }
    }
    return false;
  }

  function update() {
    frames++;

    if (state === STATE.READY) {
      duck.y = H / 2 - 20 + Math.sin(frames * 0.08) * 10;
      duck.wing += 0.25;
      duck.rotation = 0;
      groundOffset = (groundOffset + 1.1) % 40;
      skyOffset = (skyOffset + 0.15) % (W + 140);
      updateFeathers();
      return;
    }

    if (state === STATE.DEAD) {
      duck.vy += gravity * 1.2;
      duck.y += duck.vy;
      duck.rotation = Math.min(1.4, duck.rotation + 0.08);
      if (duck.y + duck.h > H - GROUND_H) {
        duck.y = H - GROUND_H - duck.h;
        duck.vy = 0;
      }
      updateExplosions();
      updatePopups();
      updateFeathers();
      if (shakeTime > 0) shakeTime--;
      return;
    }

    gameStats.timeAliveFrames++;
    if (liveTimeEl && gameStats.timeAliveFrames % 15 === 0) {
      liveTimeEl.textContent = formatLiveTime(gameStats.timeAliveFrames);
    }

    // Update Farmer vertical patrol up and down the far right!
    farmer.y += farmer.vy * farmer.direction;
    const farmerMinY = 40;
    const farmerMaxY = H - GROUND_H - farmer.h - 10;
    if (farmer.y <= farmerMinY) {
      farmer.y = farmerMinY;
      farmer.direction = 1;
    } else if (farmer.y >= farmerMaxY) {
      farmer.y = farmerMaxY;
      farmer.direction = -1;
    }

    if (shootCooldown > 0) shootCooldown--;
    if (powerRapid > 0) powerRapid--;
    if (shakeTime > 0) shakeTime--;
    if (dismountInvincibleTimer > 0) dismountInvincibleTimer--;

    if (starTimer > 0) {
      starTimer--;
      if (starTimer === 0) {
        AudioFX.stopMusic();
        AudioFX.startMusic();
        dismountInvincibleTimer = 150;
        popups.push({
          x: duck.x + duck.w / 2,
          y: duck.y - 15,
          life: 60,
          text: "🛡️ CLOVER SHIELD ENDED",
          color: "#00e676",
          big: true,
        });
      }
    }

    if (comboTimer > 0) {
      comboTimer--;
      if (comboTimer <= 0) {
        combo = 0;
        comboEl.classList.add("hidden");
        multBar.classList.add("hidden");
      }
    }

    pipeSpeed = 2.35 + Math.min(1.5, score / 500);

    duck.vy += gravity;
    duck.y += duck.vy;
    duck.wing += 0.45;
    const targetRot = Math.max(-0.4, Math.min(1.1, duck.vy * 0.075));
    duck.rotation += (targetRot - duck.rotation) * 0.2;

    pipeTimer++;
    if (pipeTimer >= pipeSpawnEvery) {
      pipeTimer = 0;
      spawnPipe();
    }

    for (const p of pipes) {
      p.x -= pipeSpeed;
      if (!p.spawnedFoe && p.x < W - 20) {
        p.spawnedFoe = true;
        if (p.sectionType === "pest") {
          const pestTypes = ["mouse", "crow", "cat", "fox", "bull", "clover"];
          const extraPestChance = Math.min(0.75, 0.18 + sectionCounter * 0.035);
          const thirdPestChance = Math.max(0, Math.min(0.45, (sectionCounter - 7) * 0.05));

          spawnFoe(p, pestTypes);

          if (Math.random() < extraPestChance) {
            setTimeout(() => {
              if (state === STATE.PLAYING && pipes.includes(p)) spawnFoe(p, pestTypes);
            }, 220 + Math.random() * 120);
          }
          if (Math.random() < thirdPestChance) {
            setTimeout(() => {
              if (state === STATE.PLAYING && pipes.includes(p)) spawnFoe(p, pestTypes);
            }, 480 + Math.random() * 150);
          }
        } else if (p.sectionType === "coin") {
          if (Math.random() < 0.18) {
            spawnFoe(p, ["mount"]);
          }
        }
      }
      if (!p.spawnedCoins && p.x < W - 30) {
        p.spawnedCoins = true;
        if (p.sectionType === "coin") {
          spawnCoins(p);
        }
      }
      if (!p.passed && p.x + pipeWidth < duck.x) {
        p.passed = true;
        addScore(1, p.x, p.top + p.gap / 2, "+1", "#fff", false);
        AudioFX.pipePass();
      }
    }
    pipes = pipes.filter((p) => p.x + pipeWidth + 10 > 0);

    updateFoes();
    updateEggs();
    updateCoins();
    updateMushrooms();
    updateExplosions();
    updateFeathers();
    updateParticles();
    updatePopups();

    if (collidesPipes() || checkFoeHitDuck()) die();
  }

  function render() {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (shakeTime > 0) {
      const sx = (Math.random() - 0.5) * shakeTime * 0.8;
      const sy = (Math.random() - 0.5) * shakeTime * 0.8;
      ctx.translate(sx, sy);
    }

    drawSky();
    drawDustPuffs();

    const emerging = foes.filter((f) => f.phase === "emerging" && !f.exploding);
    const active = foes.filter((f) => f.phase !== "emerging" && !f.exploding);

    for (const f of emerging) {
      ctx.save();
      if (f.pipeRef) {
        const mouth = f.from === "bottom" ? f.pipeRef.top + f.pipeRef.gap : f.pipeRef.top;
        ctx.beginPath();
        ctx.rect(f.pipeRef.x - 8, mouth - (f.from === "bottom" ? f.h + 14 : 4), pipeWidth + 16, f.h + 18);
        ctx.clip();
      }
      drawBrother(f);
      ctx.restore();
    }

    for (const p of pipes) drawPipe(p);
    for (const m of mushrooms) drawRedApple(m);
    for (const c of coins) drawCoin(c);
    for (const f of active) drawBrother(f);
    for (const e of eggs) drawEgg(e);
    for (const ex of explosions) drawExplosion(ex);
    drawGround();
    drawFeathers();
    drawSparkles();
    drawEggSplats();
    drawAimAssist();
    drawDuck();
    drawPopups();

    ctx.restore();
  }

  let lastTime = 0;
  let accumulator = 0;
  const FIXED_STEP = 1000 / 60;

  function loop(now) {
    if (!lastTime) lastTime = now || performance.now();
    const currentTime = now || performance.now();
    let frameTime = currentTime - lastTime;
    lastTime = currentTime;

    if (frameTime > 250) frameTime = 250;
    accumulator += frameTime;

    while (accumulator >= FIXED_STEP) {
      update();
      accumulator -= FIXED_STEP;
    }

    render();
    requestAnimationFrame(loop);
  }

  // ============================================================
  //  USER INPUT HANDLERS
  // ============================================================
  function isFlapKey(code) {
    return code === "Space" || code === "ArrowUp" || code === "KeyW";
  }
  function isShootKey(code) {
    return (
      code === "KeyX" ||
      code === "KeyF" ||
      code === "ShiftLeft" ||
      code === "ShiftRight" ||
      code === "Enter" ||
      code === "KeyE"
    );
  }

  window.addEventListener("keydown", (e) => {
    if (e.target === nameInput) return;
    if (isShootKey(e.code)) {
      e.preventDefault();
      shootHold = true;
      shoot();
      return;
    }
    if (!isFlapKey(e.code)) return;
    e.preventDefault();
    if (state === STATE.DEAD) return;
    flap();
  });
  window.addEventListener("keyup", (e) => {
    if (isShootKey(e.code)) shootHold = false;
  });

  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button === 2) return;
      if (!touchControls.classList.contains("hidden") && e.pointerType === "touch")
        return;
      e.preventDefault();
      if (state === STATE.DEAD) return;
      flap();
    },
    { passive: false }
  );
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    shoot();
  });

  function bindHoldButton(btn, onDown, onUp) {
    if (!btn) return;
    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add("pressed");
      onDown();
    };
    const up = () => {
      btn.classList.remove("pressed");
      if (onUp) onUp();
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("pointercancel", up);
  }

  bindHoldButton(
    flapBtn,
    () => {
      if (state !== STATE.DEAD) flap();
    },
    null
  );
  bindHoldButton(
    shootBtn,
    () => {
      shootHold = true;
      shoot();
    },
    () => {
      shootHold = false;
    }
  );

  setInterval(() => {
    if (shootHold && state === STATE.PLAYING && (starTimer > 0 || powerRapid > 0)) {
      shoot();
    }
  }, 50);

  if (tallyContinueBtn) {
    tallyContinueBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (tallyScreen) tallyScreen.classList.add("hidden");
      finalScoreEl.textContent = String(score);
      finalBestEl.textContent = String(best);
      gameOverScreen.classList.remove("hidden");
      submitScore(score);
    });
  }

  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startPlaying();
  });
  retryBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startPlaying();
  });
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showMenu();
  });
  refreshBoardBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fetchLeaderboard();
  });
  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    AudioFX.unlock();
    AudioFX.setMuted(!AudioFX.muted);
  });

  nameInput.addEventListener("change", savePlayerName);
  nameInput.addEventListener("blur", savePlayerName);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nameInput.blur();
      savePlayerName();
    }
  });

  document.body.addEventListener(
    "touchmove",
    (e) => {
      if (e.target.closest(".panel")) return;
      if (e.target.closest("#game-wrap")) e.preventDefault();
    },
    { passive: false }
  );

  // Initialize
  const savedName = localStorage.getItem(NAME_KEY) || "";
  if (savedName) {
    nameInput.value = savedName;
    playerChip.textContent = `👤 ${savedName}`;
    playerChip.classList.remove("hidden");
  }
  if (best > 0) {
    bestEl.textContent = `Best: ${best}`;
    bestEl.classList.remove("hidden");
  }
  hudEl.classList.add("hidden");
  touchControls.classList.add("hidden");

  const fbShareBtn = document.getElementById("fb-share-btn");
  if (fbShareBtn) {
    fbShareBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      shareScoreFB();
    });
  }

  fetchLeaderboard();
  resetGame();
  initFBInstant();
  loop();
})();
