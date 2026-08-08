/**
 * Word Streak Duels — Facebook Instant Game
 * Core: 60s word ladder (last letter → next word)
 * Social: shareAsync challenge with seed + target score
 * Retention: daily seed + streak + freeze
 * Monetization stubs: streak freeze rewarded ad (never mid-typing)
 */
(function () {
  'use strict';

  const ROUND_SECONDS = 60;
  const MIN_LEN = 3;
  const STORAGE_KEY = 'wsd_v1';
  /**
   * Themed seed pools — day picks a theme, then a seed inside that theme.
   * Includes Names week for people-name ladders.
   */
  const THEME_SEEDS = {
    'Classic chain': [
      'CRANE', 'STONE', 'PLANT', 'MUSIC', 'RIVER', 'LIGHT', 'CLOUD', 'SHINE', 'BRAVE', 'GHOST',
      'QUEST', 'MAGIC', 'POWER', 'DREAM', 'STORY', 'WORLD', 'HEART', 'SMILE', 'TRUST', 'PEACE',
      'VALUE', 'TRUTH', 'GRACE', 'PRIDE', 'GLORY', 'HONOR', 'FAITH', 'HOPE', 'LUCKY', 'NOBLE',
    ],
    'Food week': [
      'APPLE', 'BREAD', 'LEMON', 'MANGO', 'SPICE', 'HONEY', 'PASTA', 'BERRY', 'GRAPE', 'PEACH',
      'OLIVE', 'SUGAR', 'CREAM', 'BACON', 'STEAK', 'SALAD', 'PIZZA', 'TACOS', 'SUSHI', 'CANDY',
      'MELON', 'CHILI', 'ONION', 'GARLIC', 'TOAST', 'JUICE', 'WATER', 'COCOA', 'MOCHA', 'MAPLE',
    ],
    'Sports week': [
      'SCORE', 'FIELD', 'COURT', 'TRACK', 'SWING', 'GOAL', 'MATCH', 'RALLY', 'SERVE', 'JUMPS',
      'RACER', 'COACH', 'TEAMS', 'MEDAL', 'ARENA', 'PITCH', 'SKATE', 'SURF', 'CLIMB', 'BOXER',
      'KICKS', 'PASS', 'DRIVE', 'CATCH', 'THROW', 'BLOCK', 'SPRINT', 'CYCLE', 'ROWER', 'DIVER',
    ],
    'Music week': [
      'PIANO', 'DRUMS', 'BEATS', 'SONGS', 'FLUTE', 'TEMPO', 'STAGE', 'CHOIR', 'NOTES', 'VOICE',
      'RADIO', 'ALBUM', 'LYRIC', 'RHYME', 'DANCE', 'DISCO', 'BLUES', 'JAZZY', 'FUNK', 'ROCKS',
      'VIOLA', 'CELLO', 'ORGAN', 'HARP', 'BANJO', 'HORNS', 'CLAPS', 'CHIME', 'TONES', 'MUSIC',
    ],
    'Nature week': [
      'OCEAN', 'TIGER', 'MAPLE', 'FROST', 'FLAME', 'STORM', 'PEARL', 'RIVER', 'FOREST', 'DESERT',
      'ISLAND', 'SUNSET', 'WINTER', 'SUMMER', 'SPRING', 'CLOUD', 'WINDY', 'LEAFY', 'STONE', 'CORAL',
      'EAGLE', 'WOLF', 'BEARS', 'LAKES', 'HILLS', 'VALLEY', 'MEADOW', 'GARDEN', 'ORCHID', 'CEDAR',
    ],
    'City week': [
      'CAMERA', 'BUTTON', 'WINDOW', 'MARKET', 'BRIDGE', 'TOWER', 'STREET', 'METRO', 'PLAZA', 'HOTEL',
      'STORE', 'MALLS', 'PARKS', 'TRAIN', 'BUSES', 'TAXIS', 'NEONS', 'SIGNS', 'CLOCK', 'ALLEY',
      'DOCKS', 'PORTS', 'BANK', 'COURT', 'OFFICE', 'SCHOOL', 'MUSEUM', 'THEATER', 'CAFE', 'DINER',
    ],
    'Adventure week': [
      'CASTLE', 'PLANET', 'ROCKET', 'CIRCUS', 'HAMMER', 'PUZZLE', 'QUEST', 'SWORD', 'SHIELD', 'ARMOR',
      'MAPS', 'COMPASS', 'JUNGLE', 'TEMPLE', 'CRYPT', 'DRAGON', 'PIRATE', 'VOYAGE', 'EXPEDITION', 'TRAIL',
      'CAMP', 'TENTS', 'ROPE', 'CLIMB', 'CAVES', 'RUINS', 'TREASURE', 'LEGEND', 'MYTHS', 'HEROES',
    ],
    'Names week': [
      'EMMA', 'JAMES', 'OLIVIA', 'LIAM', 'SOPHIA', 'NOAH', 'AVA', 'MASON', 'ISABELLA', 'ETHAN',
      'MIA', 'LUCAS', 'AMELIA', 'LOGAN', 'HARPER', 'ALEX', 'CHLOE', 'JACK', 'ELLA', 'HENRY',
      'GRACE', 'OWEN', 'LILY', 'RYAN', 'ZOE', 'NATHAN', 'SOFIA', 'DYLAN', 'LAYLA', 'CALEB',
      'NORA', 'ISAAC', 'HAZEL', 'LEO', 'AURORA', 'JACKSON', 'SCARLETT', 'AVERY', 'ARIA', 'MATEO',
      'LUNA', 'ELIAS', 'VIOLET', 'THEO', 'STELLA', 'EZRA', 'RUBY', 'MILES', 'IVY', 'LEO',
    ],
  };
  const THEME_NAMES = Object.keys(THEME_SEEDS);

  const el = {
    boot: document.getElementById('screen-boot'),
    home: document.getElementById('screen-home'),
    play: document.getElementById('screen-play'),
    end: document.getElementById('screen-end'),
    board: document.getElementById('screen-board'),
    bootStatus: document.getElementById('bootStatus'),
    bootBar: document.getElementById('bootBar'),
    homeStreak: document.getElementById('homeStreak'),
    homeSeed: document.getElementById('homeSeed'),
    homeTheme: document.getElementById('homeTheme'),
    homeBest: document.getElementById('homeBest'),
    homeFreeze: document.getElementById('homeFreeze'),
    challengeBanner: document.getElementById('challengeBanner'),
    challengeText: document.getElementById('challengeText'),
    playBtn: document.getElementById('playBtn'),
    dailyBoardBtn: document.getElementById('dailyBoardBtn'),
    friendsPlayBtn: document.getElementById('friendsPlayBtn'),
    friendsBoardBtn: document.getElementById('friendsBoardBtn'),
    friendsInviteBtn: document.getElementById('friendsInviteBtn'),
    friendsSeed: document.getElementById('friendsSeed'),
    friendsBest: document.getElementById('friendsBest'),
    friendsStreak: document.getElementById('friendsStreak'),
    panelDaily: document.getElementById('panelDaily'),
    panelFriends: document.getElementById('panelFriends'),
    tabDaily: document.getElementById('tabDaily'),
    tabFriends: document.getElementById('tabFriends'),
    muteBtn: document.getElementById('muteBtn'),
    muteBtnPlay: document.getElementById('muteBtnPlay'),
    playModeBadge: document.getElementById('playModeBadge'),
    timer: document.getElementById('timer'),
    needLetter: document.getElementById('needLetter'),
    score: document.getElementById('score'),
    playStatus: document.getElementById('playStatus'),
    targetBar: document.getElementById('targetBar'),
    targetScore: document.getElementById('targetScore'),
    targetDelta: document.getElementById('targetDelta'),
    chain: document.getElementById('chain'),
    input: document.getElementById('wordInput'),
    wordDisplay: document.getElementById('wordDisplay'),
    gameKeyboard: document.getElementById('gameKeyboard'),
    submitBtn: document.getElementById('submitBtn'),
    quitBtn: document.getElementById('quitBtn'),
    endHeadline: document.getElementById('endHeadline'),
    finalScore: document.getElementById('finalScore'),
    finalWords: document.getElementById('finalWords'),
    finalLongest: document.getElementById('finalLongest'),
    finalStreak: document.getElementById('finalStreak'),
    endStatus: document.getElementById('endStatus'),
    boardStatus: document.getElementById('boardStatus'),
    shareBtn: document.getElementById('shareBtn'),
    endBoardBtn: document.getElementById('endBoardBtn'),
    freezeBtn: document.getElementById('freezeBtn'),
    replayBtn: document.getElementById('replayBtn'),
    homeBtn: document.getElementById('homeBtn'),
    boardEyebrow: document.getElementById('boardEyebrow'),
    boardTitle: document.getElementById('boardTitle'),
    boardSubtitle: document.getElementById('boardSubtitle'),
    boardList: document.getElementById('boardList'),
    boardEmpty: document.getElementById('boardEmpty'),
    boardCloseBtn: document.getElementById('boardCloseBtn'),
    boardPlayBtn: document.getElementById('boardPlayBtn'),
  };

  /** @type {{ dayKey: string, streak: number, freezes: number, bestToday: number, lastPlayedDay: string|null, freezeUsedDay: string|null }} */
  let save = loadSave();
  let dictionary = window.WSD_WORDS || new Set();
  let dailySeed = 'CRANE';
  let themeName = 'Classic chain';
  let challengeTarget = 0;
  let challengeSeed = null;
  /** @type {'daily' | 'friends'} */
  let playMode = 'daily';
  let boardKind = 'daily';

  // Round state
  let score = 0;
  let remaining = ROUND_SECONDS;
  let timerId = null;
  let lastWord = '';
  let played = new Set();
  let chainWords = [];
  let tipShown = false;
  let roundActive = false;

  /** Local mock leaderboard store (used outside Facebook). */
  const mockBoards = {};

  function loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultSave(), ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return defaultSave();
  }

  function defaultSave() {
    return {
      dayKey: dayKey(),
      streak: 0,
      freezes: 0,
      bestToday: 0,
      lastPlayedDay: null,
      freezeUsedDay: null,
    };
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      /* ignore */
    }
  }

  function dayKey(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pickDaily() {
    // Deterministic from UTC date — theme + seed both change daily.
    const key = dayKey();
    const hTheme = hashStr('wsd-theme-v2-' + key);
    const hSeed = hashStr('wsd-seed-v2-' + key);
    const theme = THEME_NAMES[hTheme % THEME_NAMES.length];
    const pool = THEME_SEEDS[theme] || THEME_SEEDS['Classic chain'];
    const seed = pool[hSeed % pool.length];
    return { seed, theme };
  }

  function wrapMockEntry(raw) {
    return {
      getRank: () => raw.rank,
      getScore: () => raw.score,
      getPlayer: () => ({
        getName: () => raw.name,
        getID: () => raw.id,
      }),
    };
  }

  function createMockLeaderboard(name) {
    if (!mockBoards[name]) {
      mockBoards[name] = {
        entries: [
          { rank: 1, score: 120, name: 'Alex', id: 'mock-a' },
          { rank: 2, score: 95, name: 'Sam', id: 'mock-b' },
        ],
      };
    }
    const board = mockBoards[name];
    function resort() {
      board.entries.sort((a, b) => b.score - a.score);
      board.entries.forEach((e, i) => {
        e.rank = i + 1;
      });
    }
    return {
      getName: () => name,
      setScoreAsync: (score) => {
        const id = 'local-player';
        const existing = board.entries.find((e) => e.id === id);
        if (existing) {
          if (score > existing.score) existing.score = score;
        } else {
          board.entries.push({ rank: 0, score, name: 'You', id });
        }
        resort();
        return Promise.resolve();
      },
      getEntriesAsync: (count) =>
        Promise.resolve(board.entries.slice(0, count || 10).map(wrapMockEntry)),
      getConnectedPlayerEntriesAsync: (count) =>
        Promise.resolve(
          board.entries
            .filter((e) => e.id === 'local-player' || String(e.id).startsWith('mock'))
            .slice(0, count || 10)
            .map(wrapMockEntry)
        ),
      getPlayerEntryAsync: () => {
        const me = board.entries.find((e) => e.id === 'local-player');
        return Promise.resolve(me ? wrapMockEntry(me) : null);
      },
    };
  }

  function ensureFBInstant() {
    // Always ensure mock helpers if real SDK is partial (local preview)
    if (typeof window.FBInstant === 'undefined') {
      window.FBInstant = {
        initializeAsync: () => Promise.resolve(),
        setLoadingProgress: (p) => {
          if (el.bootBar) el.bootBar.style.width = Math.max(8, Math.min(100, p)) + '%';
        },
        startGameAsync: () => Promise.resolve(),
        getEntryPointData: () => {
          try {
            const q = new URLSearchParams(location.search);
            const seed = q.get('seed');
            const target = Number(q.get('target') || 0);
            if (seed) return { seed: seed.toUpperCase(), targetScore: target };
          } catch {
            /* ignore */
          }
          return {};
        },
        shareAsync: (payload) => {
          console.log('[mock] shareAsync', payload);
          if (navigator.share) {
            return navigator
              .share({ title: 'Word Streak Duels', text: payload.text })
              .catch(() => Promise.resolve());
          }
          return Promise.resolve();
        },
        getLeaderboardAsync: (name) => Promise.resolve(createMockLeaderboard(name)),
        getSupportedAPIs: () => [
          'shareAsync',
          'getEntryPointData',
          'getLeaderboardAsync',
        ],
        player: {
          getName: () => Promise.resolve('You'),
          getID: () => Promise.resolve('local-player'),
        },
        logEvent: (name, value, params) => {
          console.log('[analytics]', name, value, params);
        },
      };
      return;
    }
    // Real SDK present (Facebook) — leave as-is
  }

  function setBoot(text, pct) {
    if (el.bootStatus) el.bootStatus.textContent = text;
    if (typeof pct === 'number' && el.bootBar) {
      el.bootBar.style.width = pct + '%';
    }
  }

  function showScreen(name) {
    const map = {
      boot: el.boot,
      home: el.home,
      play: el.play,
      end: el.end,
      board: el.board,
    };
    Object.entries(map).forEach(([key, node]) => {
      if (!node) return;
      const active = key === name;
      node.hidden = !active;
      node.classList.toggle('screen-active', active);
    });
  }

  function setPlayMode(mode) {
    playMode = mode === 'friends' ? 'friends' : 'daily';
    if (el.tabDaily) el.tabDaily.classList.toggle('active', playMode === 'daily');
    if (el.tabFriends) el.tabFriends.classList.toggle('active', playMode === 'friends');
    if (el.panelDaily) el.panelDaily.hidden = playMode !== 'daily';
    if (el.panelFriends) el.panelFriends.hidden = playMode !== 'friends';
    if (el.playModeBadge) {
      el.playModeBadge.textContent = playMode === 'friends' ? 'Friends' : 'Daily';
    }
  }

  function dailyBoardName() {
    return 'wsd_daily_' + dayKey().replace(/-/g, '');
  }

  function friendsBoardName() {
    // Same ladder day, friends-only ranking via connected entries
    return 'wsd_friends_' + dayKey().replace(/-/g, '');
  }

  function boardNameForMode(mode) {
    return mode === 'friends' ? friendsBoardName() : dailyBoardName();
  }

  async function submitScoreToBoards(finalScore) {
    if (!finalScore || finalScore < 1) return { daily: null, friends: null };
    const extra = JSON.stringify({
      seed: (challengeSeed || dailySeed).toUpperCase(),
      mode: playMode,
      day: dayKey(),
    });
    const results = { daily: null, friends: null };
    try {
      const daily = await FBInstant.getLeaderboardAsync(dailyBoardName());
      await daily.setScoreAsync(finalScore, extra);
      results.daily = true;
    } catch (err) {
      console.warn('daily leaderboard', err);
      results.daily = false;
    }
    try {
      const friends = await FBInstant.getLeaderboardAsync(friendsBoardName());
      await friends.setScoreAsync(finalScore, extra);
      results.friends = true;
    } catch (err) {
      console.warn('friends leaderboard', err);
      results.friends = false;
    }
    return results;
  }

  async function loadBoardEntries(kind) {
    const name = boardNameForMode(kind);
    const board = await FBInstant.getLeaderboardAsync(name);
    let entries = [];
    if (kind === 'friends' && board.getConnectedPlayerEntriesAsync) {
      try {
        entries = await board.getConnectedPlayerEntriesAsync(15, 0);
      } catch {
        entries = await board.getEntriesAsync(15, 0);
      }
    } else {
      entries = await board.getEntriesAsync(15, 0);
    }
    let me = null;
    try {
      me = await board.getPlayerEntryAsync();
    } catch {
      me = null;
    }
    return { entries: entries || [], me, name };
  }

  async function openLeaderboard(kind) {
    boardKind = kind === 'friends' ? 'friends' : 'daily';
    const daily = pickDaily();
    if (el.boardEyebrow) {
      el.boardEyebrow.textContent =
        boardKind === 'friends' ? 'Friends only' : 'Everyone today';
    }
    if (el.boardTitle) {
      el.boardTitle.textContent =
        boardKind === 'friends' ? 'Friends leaderboard' : 'Daily leaderboard';
    }
    if (el.boardSubtitle) {
      el.boardSubtitle.textContent =
        boardKind === 'friends'
          ? `Ranks among your Facebook friends · seed ${daily.seed}`
          : `Global ranks for ${daily.seed} · resets with the daily seed`;
    }
    if (el.boardList) el.boardList.innerHTML = '';
    if (el.boardEmpty) {
      el.boardEmpty.hidden = true;
      el.boardEmpty.textContent = 'Loading ranks…';
      el.boardEmpty.hidden = false;
    }
    showScreen('board');
    setBgm('menu');
    try {
      const { entries, me } = await loadBoardEntries(boardKind);
      if (el.boardList) el.boardList.innerHTML = '';
      const myId = me && me.getPlayer ? me.getPlayer().getID() : null;
      if (!entries.length) {
        if (el.boardEmpty) {
          el.boardEmpty.textContent =
            boardKind === 'friends'
              ? 'No friend scores yet — invite friends and play a round.'
              : 'No scores yet — play a round to claim the top spot.';
          el.boardEmpty.hidden = false;
        }
        return;
      }
      if (el.boardEmpty) el.boardEmpty.hidden = true;
      entries.forEach((entry) => {
        const li = document.createElement('li');
        const player = entry.getPlayer();
        const id = player.getID();
        const displayName = player.getName() || 'Player';
        if (myId && id === myId) li.classList.add('me');
        const rank = entry.getRank();
        const sc = entry.getScore();
        li.innerHTML =
          `<span class="board-rank">#${rank}</span>` +
          `<span class="board-name"></span>` +
          `<span class="board-score">${sc}</span>`;
        li.querySelector('.board-name').textContent = displayName;
        el.boardList.appendChild(li);
      });
    } catch (err) {
      console.warn(err);
      if (el.boardEmpty) {
        el.boardEmpty.textContent =
          'Leaderboard unavailable right now. On Facebook it appears after scores post.';
        el.boardEmpty.hidden = false;
      }
    }
  }

  function setPlayStatus(text, kind) {
    el.playStatus.textContent = text;
    el.playStatus.classList.remove('good', 'bad');
    if (kind) el.playStatus.classList.add(kind);
  }

  function renderTileWord(word, opts = {}) {
    const li = document.createElement('li');
    if (!opts.first) {
      const arrow = document.createElement('span');
      arrow.className = 'chain-arrow';
      arrow.textContent = '→';
      arrow.setAttribute('aria-hidden', 'true');
      li.appendChild(arrow);
    }
    const letters = word.toUpperCase().split('');
    letters.forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'tile' + (opts.seed ? ' seed' : '') + (opts.hintIndex === i ? ' hint' : '');
      span.textContent = ch;
      li.appendChild(span);
    });
    el.chain.appendChild(li);
    el.chain.scrollTop = el.chain.scrollHeight;
  }

  function updateNeed() {
    const need = lastWord.slice(-1).toUpperCase();
    el.needLetter.textContent = need || '—';
  }

  function validNext(raw) {
    const w = String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    if (w.length < MIN_LEN) return { ok: false, reason: `Min ${MIN_LEN} letters` };
    if (played.has(w)) return { ok: false, reason: 'Already used' };
    const need = lastWord.slice(-1).toLowerCase();
    if (w[0] !== need) {
      return {
        ok: false,
        reason: `Must start with “${need.toUpperCase()}”`,
        tip: true,
      };
    }
    if (!dictionary.has(w)) {
      return {
        ok: false,
        reason: 'Not in this game’s word list',
      };
    }
    return { ok: true, word: w };
  }

  function ensureCoreWords() {
    // Everyday ladder words + large first-name list (Names week / people chains)
    const core = [
      'star','stars','start','stay','stop','stone','store','story','storm','stand',
      'yard','year','yes','yet','you','your','young','yarn','yawn',
      'door','down','dark','day','deal','deep','desk','dirt','dish','draw',
      'easy','each','earn','east','edge','else','end','even','ever','exit',
      'rain','race','read','real','rest','rich','ride','ring','road','rock','room','rose','run',
      'open','over','once','only','onto','oral','oval',
      'name','near','need','nest','next','nice','nine','none','nose','note',
      'lane','last','late','lead','leaf','left','less','life','lift','like','line','list','live','long','look','lose','lost','love',
      'make','many','mark','mass','mate','mean','meat','meet','mile','mind','mine','miss','moon','more','most','move','much','must',
      'part','pass','path','peak','pick','pile','pink','plan','play','plot','plus','poem','pool','poor','port','post','pull','push',
      'word','work','walk','want','warm','warn','wash','wave','weak','wear','week','well','went','were','west','what','when','wide','wife','wild','will','wind','wine','wing','wire','wise','wish','with','woke','womb','wood','wool','wore','worn',
    ];
    if (!dictionary || typeof dictionary.add !== 'function') {
      dictionary = new Set(core);
    } else {
      core.forEach((w) => dictionary.add(w));
    }
    // Merge people names (playable as ladder words)
    const names = window.WSD_NAMES;
    if (Array.isArray(names)) {
      names.forEach((n) => {
        const w = String(n || '')
          .toLowerCase()
          .replace(/[^a-z]/g, '');
        if (w.length >= MIN_LEN && w.length <= 12) dictionary.add(w);
      });
    }
    // Also allow every themed seed as a playable word
    Object.values(THEME_SEEDS).forEach((pool) => {
      pool.forEach((s) => {
        const w = String(s).toLowerCase();
        if (w.length >= MIN_LEN) dictionary.add(w);
      });
    });
  }

  function scoreWord(word, timeLeft) {
    // length points + tiny speed bonus so fast play matters without punishing thinkers
    const base = word.length * 10;
    const speed = Math.floor(timeLeft / 12);
    return base + speed;
  }

  function audio() {
    return window.WSDAudio || null;
  }

  function playSfx(name) {
    try {
      const a = audio();
      if (a && a.sfx && typeof a.sfx[name] === 'function') a.sfx[name]();
    } catch {
      /* ignore */
    }
  }

  function syncMuteButtons() {
    const a = audio();
    const muted = a ? a.isMuted() : false;
    const label = muted ? '🔇' : '🔊';
    const title = muted ? 'Unmute sound' : 'Mute sound';
    [el.muteBtn, el.muteBtnPlay].forEach((btn) => {
      if (!btn) return;
      btn.textContent = label;
      btn.title = title;
      btn.setAttribute('aria-label', title);
      btn.classList.toggle('is-muted', muted);
    });
  }

  async function unlockAudio(mode) {
    const a = audio();
    if (!a) return;
    await a.unlock();
    if (!a.isMuted()) {
      if (typeof a.setMusicMode === 'function') a.setMusicMode(mode || 'menu');
      else a.startMusic(mode || 'menu');
    }
    syncMuteButtons();
  }

  function setBgm(mode) {
    try {
      const a = audio();
      if (!a || a.isMuted()) return;
      if (typeof a.setMusicMode === 'function') a.setMusicMode(mode);
      else a.startMusic(mode);
    } catch {
      /* ignore */
    }
  }

  function getTypedWord() {
    return (el.input && el.input.value ? el.input.value : '').toUpperCase();
  }

  function setTypedWord(raw) {
    const cleaned = String(raw || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 16);
    if (el.input) el.input.value = cleaned;
    renderWordDisplay();
  }

  function renderWordDisplay() {
    if (!el.wordDisplay) return;
    const w = getTypedWord();
    if (!w) {
      el.wordDisplay.innerHTML = '<span class="word-placeholder">Tap letters…</span>';
      return;
    }
    el.wordDisplay.innerHTML = '';
    w.split('').forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'word-display-letter';
      s.textContent = ch;
      el.wordDisplay.appendChild(s);
    });
  }

  function buildKeyboard() {
    if (!el.gameKeyboard || el.gameKeyboard.dataset.ready === '1') return;
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    rows.forEach((letters, ri) => {
      const row = el.gameKeyboard.querySelector(`[data-row="${ri}"]`);
      if (!row) return;
      row.innerHTML = '';
      letters.split('').forEach((ch) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'kb-key';
        b.dataset.key = ch;
        b.textContent = ch;
        row.appendChild(b);
      });
      if (ri === 2) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'kb-key kb-wide kb-del';
        del.dataset.key = 'DEL';
        del.textContent = '⌫';
        row.appendChild(del);
      }
    });
    el.gameKeyboard.dataset.ready = '1';
    el.gameKeyboard.addEventListener('click', onKeyboardClick);
  }

  function onKeyboardClick(e) {
    const btn = e.target.closest('.kb-key');
    if (!btn || !roundActive) return;
    const key = btn.dataset.key;
    if (!key) return;
    if (key === 'DEL') {
      playSfx('key');
      setTypedWord(getTypedWord().slice(0, -1));
      return;
    }
    if (/^[A-Z]$/.test(key)) {
      playSfx('key');
      setTypedWord(getTypedWord() + key);
    }
  }

  function submitWord() {
    if (!roundActive) return;
    const typed = getTypedWord();
    const check = validNext(typed);
    if (!check.ok) {
      playSfx('bad');
      let msg = check.reason;
      if (check.tip && !tipShown) {
        tipShown = true;
        msg = `${check.reason} · Tip: match the gold letter`;
      }
      // Clarify dictionary vs ladder rule for players
      if (msg.includes('word list') && typed.length >= 3) {
        msg = `“${typed}” not in list · or already used / wrong start letter`;
      }
      setPlayStatus(msg, 'bad');
      if (el.wordDisplay) el.wordDisplay.classList.add('shake');
      window.setTimeout(() => el.wordDisplay && el.wordDisplay.classList.remove('shake'), 280);
      return;
    }

    const pts = scoreWord(check.word, remaining);
    played.add(check.word);
    lastWord = check.word;
    chainWords.push(check.word);
    score += pts;
    el.score.textContent = String(score);
    renderTileWord(check.word);
    updateNeed();
    setTypedWord('');
    setPlayStatus(`+${pts} · keep going! Need “${lastWord.slice(-1).toUpperCase()}”`, 'good');
    updateTargetDelta();
    playSfx('ok');
    logEvent('word_accepted', pts, { len: check.word.length });
  }

  function updateTargetDelta() {
    if (!challengeTarget) return;
    const diff = challengeTarget - score;
    el.targetDelta.textContent =
      diff > 0 ? ` · need ${diff} more` : diff === 0 ? ' · tied!' : ' · you lead!';
  }

  function endRound(reason) {
    if (!roundActive) return;
    roundActive = false;
    clearInterval(timerId);
    if (el.input) el.input.disabled = true;
    if (el.gameKeyboard) el.gameKeyboard.classList.add('kb-disabled');
    if (el.submitBtn) el.submitBtn.disabled = true;

    const day = dayKey();
    const wordsCount = chainWords.length;
    const longest = chainWords.reduce((a, w) => (w.length > a.length ? w : a), '');

    // Daily rollover
    if (save.dayKey !== day) {
      save.dayKey = day;
      save.bestToday = 0;
    }

    // Streak: first scoring play of the day continues / starts / breaks
    if (score > 0 && save.lastPlayedDay !== day) {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterday = dayKey(y);
      if (!save.lastPlayedDay) {
        save.streak = 1;
      } else if (save.lastPlayedDay === yesterday) {
        save.streak = (save.streak || 0) + 1;
      } else if (save.freezes > 0) {
        // Missed day(s) but freeze bank absorbs the gap
        save.freezes -= 1;
        save.streak = (save.streak || 0) + 1;
        save.freezeUsedDay = day;
      } else {
        save.streak = 1;
      }
      save.lastPlayedDay = day;
      logEvent('streak_increment', save.streak, { day });
    }

    if (score > (save.bestToday || 0)) save.bestToday = score;
    persist();

    const beat = challengeTarget > 0 && score > challengeTarget;
    const tied = challengeTarget > 0 && score === challengeTarget;
    el.endHeadline.textContent = beat
      ? 'You beat the challenge!'
      : tied
        ? 'Dead heat!'
        : score >= 80
          ? 'Blazing chain!'
          : score >= 40
            ? 'Nice chain!'
            : wordsCount === 0
              ? 'Empty chain'
              : 'Round over';

    el.finalScore.textContent = String(score);
    el.finalWords.textContent = String(wordsCount);
    el.finalLongest.textContent = longest ? longest.toUpperCase() : '—';
    el.finalStreak.textContent = String(save.streak || 0);
    el.endStatus.textContent =
      reason === 'quit'
        ? 'Ended early — challenge a friend or check the board.'
        : challengeTarget
          ? beat
            ? 'You beat their score — send a rematch!'
            : `Target was ${challengeTarget}. Try again or challenge them back.`
          : playMode === 'friends'
            ? 'Score posted to friends ranks when online on Facebook.'
            : 'Score posts to today’s daily leaderboard.';

    if (el.boardStatus) el.boardStatus.textContent = 'Updating leaderboards…';

    // Offer freeze earn when bank empty (rewarded ad stub)
    const canEarnFreeze = score > 0 && (save.freezes || 0) <= 0;
    el.freezeBtn.hidden = !canEarnFreeze;
    el.freezeBtn.disabled = false;
    el.freezeBtn.textContent = 'Protect streak (watch ad)';

    if (beat || score >= 80) playSfx('win');
    else playSfx('end');

    showScreen('end');
    setBgm('menu');
    logEvent('round_complete', score, {
      words: wordsCount,
      reason: reason || 'timer',
      seed: dailySeed,
      mode: playMode,
    });

    submitScoreToBoards(score)
      .then((res) => {
        if (!el.boardStatus) return;
        if (res.daily || res.friends) {
          el.boardStatus.textContent =
            playMode === 'friends'
              ? 'Friends leaderboard updated (when available).'
              : 'Daily leaderboard updated (when available).';
        } else {
          el.boardStatus.textContent =
            'Leaderboard will sync fully inside Facebook Instant Games.';
        }
      })
      .catch(() => {
        if (el.boardStatus) {
          el.boardStatus.textContent = 'Could not reach leaderboard this time.';
        }
      });
  }

  function tick() {
    remaining -= 1;
    el.timer.textContent = String(remaining);
    el.timer.classList.toggle('urgent', remaining <= 10);
    if (remaining <= 10 && remaining > 0) {
      playSfx(remaining <= 5 ? 'urgent' : 'tick');
    }
    if (remaining <= 0) endRound('timer');
  }

  function startRound() {
    void unlockAudio('play');
    setBgm('play');
    const seed = (challengeSeed || dailySeed).toUpperCase();
    score = 0;
    remaining = ROUND_SECONDS;
    lastWord = seed.toLowerCase();
    played = new Set([lastWord]);
    chainWords = [];
    tipShown = false;
    roundActive = true;
    el.chain.innerHTML = '';
    el.score.textContent = '0';
    el.timer.textContent = String(ROUND_SECONDS);
    el.timer.classList.remove('urgent');
    if (el.input) el.input.disabled = false;
    if (el.gameKeyboard) el.gameKeyboard.classList.remove('kb-disabled');
    if (el.submitBtn) el.submitBtn.disabled = false;
    setTypedWord('');
    buildKeyboard();

    if (challengeTarget > 0) {
      el.targetBar.hidden = false;
      el.targetScore.textContent = String(challengeTarget);
      updateTargetDelta();
    } else {
      el.targetBar.hidden = true;
    }

    renderTileWord(seed, { first: true, seed: true });
    updateNeed();
    setPlayStatus(`Build a chain. Next word must start with “${seed.slice(-1)}”.`);
    if (el.playModeBadge) {
      el.playModeBadge.textContent = playMode === 'friends' ? 'Friends' : 'Daily';
    }
    showScreen('play');
    clearInterval(timerId);
    timerId = setInterval(tick, 1000);
    playSfx('start');
    logEvent('game_start', 1, {
      seed,
      challenge: Boolean(challengeTarget),
      mode: playMode,
    });
  }

  function mockRewarded(kind) {
    logEvent('rewarded_offer', 1, { kind });
    return new Promise((resolve) => {
      // Local/mock: short delay, always complete (real FB ads would use getRewardedVideoAsync)
      setTimeout(() => resolve(true), 600);
    });
  }

  async function shareChallenge() {
    const seed = (challengeSeed || dailySeed).toUpperCase();
    const text = `I scored ${score} on seed ${seed} in Word Streak Duels — beat my chain!`;
    playSfx('share');
    try {
      await window.FBInstant.shareAsync({
        intent: 'CHALLENGE',
        text,
        data: { seed, targetScore: score },
      });
      el.endStatus.textContent = 'Challenge sent (or mocked in local preview).';
      logEvent('challenge_sent', score, { seed });
      logEvent('share_complete', 1, { seed });
    } catch (err) {
      el.endStatus.textContent = 'Share cancelled or failed.';
      console.warn(err);
    }
  }

  async function protectStreak() {
    el.freezeBtn.disabled = true;
    const ok = await mockRewarded('streak_freeze');
    if (!ok) {
      el.freezeBtn.disabled = false;
      el.endStatus.textContent = 'Ad skipped — streak not protected.';
      return;
    }
    save.freezes = (save.freezes || 0) + 1;
    save.freezeUsedDay = dayKey();
    // If we were about to break due to a gap, restore continuity by not resetting
    if (save.streak < 1) save.streak = 1;
    persist();
    el.freezeBtn.hidden = true;
    el.endStatus.textContent = 'Streak freeze earned — you’re covered for a miss.';
    el.finalStreak.textContent = String(save.streak || 0);
    logEvent('rewarded_complete', 1, { kind: 'streak_freeze' });
  }

  function refreshHome() {
    const today = dayKey();
    if (save.dayKey !== today) {
      save.dayKey = today;
      save.bestToday = 0;
      persist();
    }

    const daily = pickDaily();
    dailySeed = daily.seed;
    themeName = daily.theme;

    // Challenge entry overrides display seed
    const displaySeed = (challengeSeed || dailySeed).toUpperCase();
    if (el.homeSeed) el.homeSeed.textContent = displaySeed;
    if (el.homeTheme) {
      el.homeTheme.textContent = challengeSeed
        ? 'Challenge seed'
        : `${themeName} · changes tomorrow`;
    }
    if (el.homeStreak) el.homeStreak.textContent = String(save.streak || 0);
    if (el.homeBest) el.homeBest.textContent = String(save.bestToday || 0);
    if (el.homeFreeze) el.homeFreeze.textContent = String(save.freezes || 0);
    if (el.friendsSeed) el.friendsSeed.textContent = displaySeed;
    if (el.friendsBest) el.friendsBest.textContent = String(save.bestToday || 0);
    if (el.friendsStreak) el.friendsStreak.textContent = String(save.streak || 0);

    if (challengeTarget > 0) {
      el.challengeBanner.hidden = false;
      el.challengeText.textContent = `Beat ${challengeTarget} on seed ${displaySeed}`;
    } else {
      el.challengeBanner.hidden = true;
    }
  }

  function logEvent(name, valueToSum, params) {
    try {
      if (window.FBInstant && window.FBInstant.logEvent) {
        window.FBInstant.logEvent(name, valueToSum || 0, params || {});
      }
    } catch {
      /* ignore */
    }
  }

  function wire() {
    if (el.tabDaily) {
      el.tabDaily.addEventListener('click', () => {
        playSfx('tap');
        setPlayMode('daily');
      });
    }
    if (el.tabFriends) {
      el.tabFriends.addEventListener('click', () => {
        playSfx('tap');
        setPlayMode('friends');
      });
    }

    el.playBtn.addEventListener('click', () => {
      playSfx('tap');
      setPlayMode('daily');
      startRound();
    });
    if (el.friendsPlayBtn) {
      el.friendsPlayBtn.addEventListener('click', () => {
        playSfx('tap');
        setPlayMode('friends');
        startRound();
      });
    }
    if (el.dailyBoardBtn) {
      el.dailyBoardBtn.addEventListener('click', () => {
        playSfx('tap');
        openLeaderboard('daily').catch(console.error);
      });
    }
    if (el.friendsBoardBtn) {
      el.friendsBoardBtn.addEventListener('click', () => {
        playSfx('tap');
        openLeaderboard('friends').catch(console.error);
      });
    }
    if (el.friendsInviteBtn) {
      el.friendsInviteBtn.addEventListener('click', () => {
        playSfx('tap');
        // Invite uses share with today's seed so friends join the same ladder
        const seed = (challengeSeed || dailySeed).toUpperCase();
        const text = `Play Word Streak Duels with me — today's seed is ${seed}. Beat my best ${save.bestToday || 0}!`;
        window.FBInstant
          .shareAsync({
            intent: 'REQUEST',
            text,
            data: { seed, targetScore: save.bestToday || 0, mode: 'friends' },
          })
          .then(() => playSfx('share'))
          .catch((err) => console.warn(err));
      });
    }
    if (el.endBoardBtn) {
      el.endBoardBtn.addEventListener('click', () => {
        playSfx('tap');
        openLeaderboard(playMode).catch(console.error);
      });
    }
    if (el.boardCloseBtn) {
      el.boardCloseBtn.addEventListener('click', () => {
        playSfx('tap');
        showScreen('home');
        setBgm('menu');
      });
    }
    if (el.boardPlayBtn) {
      el.boardPlayBtn.addEventListener('click', () => {
        playSfx('tap');
        setPlayMode(boardKind === 'friends' ? 'friends' : 'daily');
        startRound();
      });
    }

    // Desktop fallback: physical keyboard still works without opening mobile IME
    document.addEventListener('keydown', (e) => {
      if (!roundActive || el.play.hidden) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        submitWord();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        setTypedWord(getTypedWord().slice(0, -1));
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        setTypedWord(getTypedWord() + e.key.toUpperCase());
      }
    });
    if (el.submitBtn) {
      el.submitBtn.addEventListener('click', () => {
        playSfx('tap');
        submitWord();
      });
    }
    el.quitBtn.addEventListener('click', () => {
      playSfx('tap');
      endRound('quit');
    });
    el.shareBtn.addEventListener('click', () => {
      shareChallenge().catch(console.error);
    });
    el.freezeBtn.addEventListener('click', () => {
      playSfx('tap');
      protectStreak().catch(console.error);
    });
    el.replayBtn.addEventListener('click', () => {
      playSfx('tap');
      startRound();
    });
    el.homeBtn.addEventListener('click', () => {
      playSfx('tap');
      refreshHome();
      showScreen('home');
      setBgm('menu');
    });

    function onMuteClick() {
      const a = audio();
      if (!a) return;
      void a.unlock().then(() => {
        a.toggleMute();
        if (!a.isMuted()) {
          const mode = !el.play.hidden ? 'play' : 'menu';
          if (typeof a.setMusicMode === 'function') a.setMusicMode(mode);
          else a.startMusic(mode);
        }
        syncMuteButtons();
        playSfx('tap');
      });
    }
    if (el.muteBtn) el.muteBtn.addEventListener('click', onMuteClick);
    if (el.muteBtnPlay) el.muteBtnPlay.addEventListener('click', onMuteClick);

    const unlockOnce = () => {
      void unlockAudio('menu');
      document.removeEventListener('pointerdown', unlockOnce);
      document.removeEventListener('keydown', unlockOnce);
    };
    document.addEventListener('pointerdown', unlockOnce, { once: true });
    document.addEventListener('keydown', unlockOnce, { once: true });
    syncMuteButtons();
    setPlayMode('daily');
  }

  async function boot() {
    ensureFBInstant();
    const FB = window.FBInstant;
    setBoot('Initializing…', 10);
    await FB.initializeAsync();
    FB.setLoadingProgress(35);
    setBoot('Loading word shard…', 35);

    // Dictionary already in memory via words.js
    await new Promise((r) => setTimeout(r, 80));
    dictionary = window.WSD_WORDS || dictionary;
    ensureCoreWords();
    if (!dictionary || dictionary.size < 100) {
      console.error('Dictionary missing or empty', dictionary && dictionary.size);
      setBoot('Word list failed to load — re-upload game.zip', 100);
      throw new Error('Dictionary empty');
    }
    setBoot(`Loaded ${dictionary.size.toLocaleString()} words…`, 75);
    FB.setLoadingProgress(75);
    setBoot('Almost ready…', 75);
    await new Promise((r) => setTimeout(r, 60));
    FB.setLoadingProgress(100);
    await FB.startGameAsync();

    const entry = (FB.getEntryPointData && FB.getEntryPointData()) || {};
    if (entry.seed) {
      challengeSeed = String(entry.seed).toUpperCase();
    }
    if (entry.targetScore) {
      challengeTarget = Number(entry.targetScore) || 0;
    }

    wire();
    refreshHome();
    setPlayMode(challengeTarget > 0 ? 'friends' : 'daily');
    showScreen('home');
    logEvent('boot_complete', dictionary.size, { load: 'ok' });
  }

  boot().catch((err) => {
    console.error(err);
    setBoot('Failed to start: ' + (err && err.message ? err.message : String(err)), 100);
  });
})();
