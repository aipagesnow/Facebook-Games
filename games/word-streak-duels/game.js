/**
 * Word Streak Duels — Facebook Instant Game
 * Core: 60s word ladder (last letter → next word)
 * Social: shareAsync challenge with seed + target score
 * Retention: daily seed + streak + freeze
 * Monetization: streak freeze via rewarded video (never mid-typing)
 */
(function () {
  'use strict';

  const ROUND_SECONDS = 60;
  const MIN_LEN = 3;
  const STORAGE_KEY = 'wsd_v1';
  /**
   * Audience Network rewarded placement ID from Meta.
   * App Dashboard → Instant Games → Add “Show ads in your game” → copy Rewarded Video placement ID.
   * Override anytime: window.WSD_REWARDED_PLACEMENT_ID = 'your_id';
   */
  const REWARDED_PLACEMENT_ID =
    (typeof window !== 'undefined' && window.WSD_REWARDED_PLACEMENT_ID) ||
    '1593839865675820_1595058932220580';
  /**
   * Themed seed pools — day picks a theme, then a seed inside that theme.
   * People-name themes are intentionally omitted (odd spellings / obscure names).
   * Countries and well-known places remain valid via the main dictionary.
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
    friendsInviteBtn: document.getElementById('friendsInviteBtn'),
    friendsInviteStatus: document.getElementById('friendsInviteStatus'),
    muteBtn: document.getElementById('muteBtn'),
    muteBtnPlay: document.getElementById('muteBtnPlay'),
    playModeBadge: document.getElementById('playModeBadge'),
    timer: document.getElementById('timer'),
    needLetter: document.getElementById('needLetter'),
    score: document.getElementById('score'),
    scoreBonusPop: document.getElementById('scoreBonusPop'),
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
              .share({
                title: 'Word Streak Duels',
                text: typeof payload.text === 'string' ? payload.text : payload.text?.default,
              })
              .catch(() => Promise.resolve());
          }
          return Promise.resolve();
        },
        inviteAsync: (payload) => {
          console.log('[mock] inviteAsync', payload);
          return Promise.resolve();
        },
        getLeaderboardAsync: (name) => Promise.resolve(createMockLeaderboard(name)),
        getRewardedVideoAsync: () =>
          Promise.resolve({
            loadAsync: () => Promise.resolve(),
            showAsync: () => Promise.resolve(),
            getPlacementID: () => 'mock_rewarded',
          }),
        getSupportedAPIs: () => [
          'shareAsync',
          'inviteAsync',
          'getEntryPointData',
          'getLeaderboardAsync',
          'getRewardedVideoAsync',
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

  /** Solo ship: always daily. Dual-mode tabs return with shared leaderboards later. */
  function setPlayMode(mode) {
    playMode = 'daily';
    if (el.playModeBadge) el.playModeBadge.textContent = '60s';
  }

  /**
   * Meta boards (context-scoped): base names wsd_daily / wsd_friends.
   * Play from facebook.com/gaming is usually SOLO → no context ID → Meta API fails.
   * So we always keep a local device board, and also try Meta when a context exists.
   */
  const BOARD_DAILY = 'wsd_daily';
  const BOARD_FRIENDS = 'wsd_friends';
  const LOCAL_BOARD_KEY = 'wsd_local_boards_v1';

  function contextId() {
    try {
      const FB = window.FBInstant;
      if (FB && FB.context && typeof FB.context.getID === 'function') {
        const id = FB.context.getID();
        return id != null && id !== '' ? String(id) : null;
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  function contextType() {
    try {
      const FB = window.FBInstant;
      if (FB && FB.context && typeof FB.context.getType === 'function') {
        return FB.context.getType() || 'UNKNOWN';
      }
    } catch {
      /* ignore */
    }
    return 'UNKNOWN';
  }

  function boardBaseName(mode) {
    return mode === 'friends' ? BOARD_FRIENDS : BOARD_DAILY;
  }

  function boardNameCandidates(mode) {
    const base = boardBaseName(mode);
    const cid = contextId();
    const names = [];
    if (cid) names.push(base + '.' + cid);
    names.push(base);
    return names;
  }

  async function getPlayerProfile() {
    const FB = window.FBInstant;
    let id = 'local-player';
    let name = 'You';
    try {
      if (FB && FB.player) {
        if (typeof FB.player.getID === 'function') {
          const pid = FB.player.getID();
          if (pid) id = String(pid);
        }
        if (typeof FB.player.getName === 'function') {
          const n = await Promise.resolve(FB.player.getName());
          if (n) name = String(n);
        }
      }
    } catch {
      /* ignore */
    }
    return { id, name };
  }

  function loadLocalBoards() {
    try {
      const raw = localStorage.getItem(LOCAL_BOARD_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return { daily: {}, friends: {} };
  }

  function saveLocalBoards(data) {
    try {
      localStorage.setItem(LOCAL_BOARD_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  /** Always works — ranks on this device for today. */
  async function postLocalScore(mode, finalScore) {
    if (!finalScore || finalScore < 1) return null;
    const { id, name } = await getPlayerProfile();
    const day = dayKey();
    const seed = (challengeSeed || dailySeed).toUpperCase();
    const key = mode === 'friends' ? 'friends' : 'daily';
    const data = loadLocalBoards();
    if (!data[key]) data[key] = {};
    if (!Array.isArray(data[key][day])) data[key][day] = [];
    const list = data[key][day];
    const existing = list.find((e) => e.id === id);
    if (existing) {
      if (finalScore > existing.score) {
        existing.score = finalScore;
        existing.name = name;
        existing.seed = seed;
        existing.at = Date.now();
      }
    } else {
      list.push({ id, name, score: finalScore, seed, at: Date.now() });
    }
    list.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    data[key][day] = list.slice(0, 50);
    saveLocalBoards(data);
    return { id, name, score: finalScore, seed, source: 'local' };
  }

  function getLocalEntries(mode) {
    const day = dayKey();
    const key = mode === 'friends' ? 'friends' : 'daily';
    const data = loadLocalBoards();
    const list = (data[key] && data[key][day]) || [];
    return list.map((e, i) => ({
      id: e.id,
      name: e.name || 'Player',
      score: e.score || 0,
      seed: e.seed || '',
      rank: i + 1,
      source: 'local',
    }));
  }

  async function getLeaderboardForMode(mode) {
    const FB = window.FBInstant;
    if (!FB || typeof FB.getLeaderboardAsync !== 'function') {
      const err = new Error('NO_FB_LEADERBOARD_API');
      err.code = 'NO_FB_LEADERBOARD_API';
      throw err;
    }
    const names = boardNameCandidates(mode);
    let lastErr = null;
    for (let i = 0; i < names.length; i++) {
      try {
        const board = await FB.getLeaderboardAsync(names[i]);
        return { board, name: names[i] };
      } catch (err) {
        lastErr = err;
        console.warn('getLeaderboardAsync failed', names[i], err);
      }
    }
    const e = lastErr || new Error('Leaderboard not found');
    e.triedNames = names;
    e.solo = !contextId();
    throw e;
  }

  function entryExtra(entry) {
    try {
      const raw =
        (entry.getExtraData && entry.getExtraData()) ||
        (entry.getExtraDataAsync ? null : '') ||
        '';
      if (!raw) return {};
      return typeof raw === 'string' ? JSON.parse(raw) : raw || {};
    } catch {
      return {};
    }
  }

  function isTodaysEntry(entry) {
    const extra = entryExtra(entry);
    if (!extra.day) return true;
    return String(extra.day) === dayKey();
  }

  function fbEntryToRow(entry, rankFallback) {
    try {
      const player = entry.getPlayer();
      const id = player && player.getID ? player.getID() : 'unknown';
      const name = (player && player.getName && player.getName()) || 'Player';
      const extra = entryExtra(entry);
      return {
        id: String(id),
        name: String(name),
        score: entry.getScore() || 0,
        seed: extra.seed || '',
        rank: (entry.getRank && entry.getRank()) || rankFallback,
        source: 'facebook',
      };
    } catch {
      return null;
    }
  }

  /** Merge FB + local rows by player id (keep highest score). */
  function mergeBoardRows(fbRows, localRows) {
    const map = new Map();
    [...localRows, ...fbRows].forEach((row) => {
      if (!row || !row.id) return;
      const prev = map.get(row.id);
      if (!prev || row.score > prev.score) {
        map.set(row.id, {
          ...row,
          source: prev && prev.source !== row.source ? 'both' : row.source,
        });
      } else if (prev && row.score === prev.score && row.source === 'facebook') {
        map.set(row.id, { ...prev, source: 'both' });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .map((row, i) => ({ ...row, rank: i + 1 }));
  }

  /**
   * Post score: always local (reliable), then try Meta when context allows.
   */
  async function submitScoreToBoards(finalScore) {
    if (!finalScore || finalScore < 1) {
      return {
        daily: null,
        friends: null,
        local: false,
        error: null,
        boardName: null,
        facebook: false,
      };
    }
    const postFriends = playMode === 'friends';
    const mode = postFriends ? 'friends' : 'daily';
    const results = {
      daily: null,
      friends: null,
      local: false,
      facebook: false,
      error: null,
      boardName: null,
      contextType: contextType(),
      solo: !contextId(),
    };

    try {
      await postLocalScore(mode, finalScore);
      results.local = true;
      if (postFriends) results.friends = true;
      else results.daily = true;
    } catch (err) {
      console.warn('local board', err);
    }

    const extra = JSON.stringify({
      seed: (challengeSeed || dailySeed).toUpperCase(),
      mode: playMode,
      day: dayKey(),
      contextType: contextType(),
    });

    try {
      const { board, name } = await getLeaderboardForMode(mode);
      results.boardName = name;
      await board.setScoreAsync(finalScore, extra);
      results.facebook = true;
      if (postFriends) results.friends = true;
      else results.daily = true;
    } catch (err) {
      console.warn('facebook leaderboard submit', err);
      results.error = err;
      results.boardName =
        (err && err.triedNames && err.triedNames[0]) || boardBaseName(mode);
      // local already saved — not a hard failure for the player
    }
    return results;
  }

  async function loadBoardEntries(kind) {
    const localRows = getLocalEntries(kind);
    let fbRows = [];
    let name = boardBaseName(kind);
    let fbOk = false;
    let fbError = null;

    try {
      const { board, name: apiName } = await getLeaderboardForMode(kind);
      name = apiName;
      let entries = [];
      if (kind === 'friends' && board.getConnectedPlayerEntriesAsync) {
        try {
          entries = await board.getConnectedPlayerEntriesAsync(25, 0);
        } catch {
          entries = await board.getEntriesAsync(25, 0);
        }
      } else {
        entries = await board.getEntriesAsync(25, 0);
      }
      const todayOnly = (entries || []).filter(isTodaysEntry);
      entries = todayOnly.length ? todayOnly : entries || [];
      fbRows = entries
        .map((e, i) => fbEntryToRow(e, i + 1))
        .filter(Boolean);
      fbOk = true;
    } catch (err) {
      fbError = err;
      console.warn('load FB board', err);
    }

    const rows = mergeBoardRows(fbRows, localRows);
    const meProfile = await getPlayerProfile();
    return {
      rows,
      meId: meProfile.id,
      name,
      fbOk,
      fbError,
      localCount: localRows.length,
      solo: !contextId(),
    };
  }

  /**
   * Solo ship: personal bests only — no fake #1 ranking.
   * Shared multiplayer ranks can bring # ranks back later.
   */
  function renderBoardRows(rows, meId) {
    if (!el.boardList) return;
    el.boardList.innerHTML = '';
    // Prefer the current player's best; otherwise top score
    let best = rows.find((r) => meId && r.id === meId) || rows[0];
    if (!best) return;
    rows
      .slice()
      .sort((a, b) => b.score - a.score)
      .forEach((row, i) => {
        // Solo: only show the player's own best (one clear card)
        if (meId && row.id !== meId) return;
        if (!meId && i > 0) return;
        const li = document.createElement('li');
        li.classList.add('me', 'best-card');
        const seedHint = row.seed ? row.seed : '';
        li.innerHTML =
          `<span class="board-rank board-rank-label">Best</span>` +
          `<span class="board-name"></span>` +
          `<span class="board-score"><strong class="best-score-num">${row.score}</strong>` +
          (seedHint ? `<span class="best-seed"> · ${seedHint}</span>` : '') +
          `</span>`;
        li.querySelector('.board-name').textContent = row.name || 'You';
        el.boardList.appendChild(li);
        best = row;
      });
  }

  async function openLeaderboard(kind) {
    boardKind = kind === 'friends' ? 'friends' : 'daily';
    const daily = pickDaily();
    if (el.boardEyebrow) el.boardEyebrow.textContent = 'Your scores';
    if (el.boardTitle) el.boardTitle.textContent = 'My bests';
    if (el.boardSubtitle) {
      el.boardSubtitle.textContent = `Today · seed ${daily.seed}`;
    }
    if (el.boardPlayBtn) el.boardPlayBtn.textContent = 'Play 60 seconds';
    if (el.boardList) el.boardList.innerHTML = '';
    if (el.boardEmpty) {
      el.boardEmpty.hidden = true;
      el.boardEmpty.textContent = 'Loading…';
      el.boardEmpty.hidden = false;
    }
    showScreen('board');
    setBgm('off');
    try {
      const localRows = getLocalEntries(boardKind);
      const me = await getPlayerProfile();
      let rows = localRows;
      try {
        const loaded = await loadBoardEntries(boardKind);
        if (loaded.rows && loaded.rows.length) rows = loaded.rows;
      } catch {
        /* local is enough */
      }
      if (!rows.length) {
        if (el.boardEmpty) {
          el.boardEmpty.textContent = 'No score yet — play a round to set today’s best.';
          el.boardEmpty.hidden = false;
        }
        return;
      }
      if (el.boardEmpty) {
        el.boardEmpty.textContent = 'Beat this score to set a new personal best.';
        el.boardEmpty.hidden = false;
      }
      renderBoardRows(rows, me.id);
    } catch (err) {
      console.warn(err);
      const localRows = getLocalEntries(boardKind);
      const me = await getPlayerProfile();
      if (localRows.length) {
        renderBoardRows(localRows, me.id);
        if (el.boardEmpty) {
          el.boardEmpty.textContent = 'Beat this score to set a new personal best.';
          el.boardEmpty.hidden = false;
        }
      } else if (el.boardEmpty) {
        el.boardEmpty.textContent = 'No score yet — play a round to set today’s best.';
        el.boardEmpty.hidden = false;
      }
    }
  }

  function setPlayStatus(text, kind) {
    el.playStatus.textContent = text;
    el.playStatus.classList.remove('good', 'bad', 'has-bonus');
    if (kind === 'bonus') {
      el.playStatus.classList.add('good', 'has-bonus');
    } else if (kind) {
      el.playStatus.classList.add(kind);
    }
  }

  function flashScoreBonus(bonusPts, wordLen) {
    if (!el.score) return;
    const big = bonusPts >= 45;
    const cell = el.score.closest ? el.score.closest('.hud-score') : null;

    el.score.classList.remove('score-pop', 'score-pop-big');
    void el.score.offsetWidth;
    el.score.classList.add(big ? 'score-pop-big' : 'score-pop');
    window.setTimeout(() => {
      if (!el.score) return;
      el.score.classList.remove('score-pop', 'score-pop-big');
    }, 560);

    if (cell) {
      cell.classList.remove('hud-bonus-flash', 'hud-bonus-flash-big');
      void cell.offsetWidth;
      cell.classList.add(big ? 'hud-bonus-flash-big' : 'hud-bonus-flash');
      window.setTimeout(() => {
        cell.classList.remove('hud-bonus-flash', 'hud-bonus-flash-big');
      }, 750);
    }

    if (!el.scoreBonusPop || !bonusPts) return;
    el.scoreBonusPop.hidden = false;
    el.scoreBonusPop.textContent = big
      ? `✦ +${bonusPts} long word!`
      : `✦ +${bonusPts} bonus`;
    el.scoreBonusPop.className =
      'score-bonus-pop' + (big ? ' score-bonus-pop--big' : '');
    void el.scoreBonusPop.offsetWidth;
    el.scoreBonusPop.classList.add('is-on');
    window.setTimeout(() => {
      if (!el.scoreBonusPop) return;
      el.scoreBonusPop.classList.remove('is-on');
      el.scoreBonusPop.hidden = true;
    }, 1200);
  }

  function renderTileWord(word, opts = {}) {
    const li = document.createElement('li');
    if (opts.bonus) li.classList.add('chain-word-bonus');
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
      span.className =
        'tile' +
        (opts.seed ? ' seed' : '') +
        (opts.hintIndex === i ? ' hint' : '') +
        (opts.bonus ? ' tile-bonus' : '');
      span.textContent = ch;
      li.appendChild(span);
    });
    if (opts.bonus && opts.bonusPts) {
      const badge = document.createElement('span');
      badge.className = 'chain-bonus-badge';
      badge.textContent = `+${opts.bonusPts}`;
      badge.title = 'Bonus for a long word';
      li.appendChild(badge);
    }
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
    if (w.length < MIN_LEN) {
      return {
        ok: false,
        reason: `Too short — use at least ${MIN_LEN} letters`,
      };
    }
    if (played.has(w)) {
      return { ok: false, reason: `“${w.toUpperCase()}” was already used` };
    }
    const need = lastWord.slice(-1).toLowerCase();
    if (w[0] !== need) {
      const needU = need.toUpperCase();
      const gotU = (w[0] || '?').toUpperCase();
      return {
        ok: false,
        wrongStart: true,
        needLetter: needU,
        gotLetter: gotU,
        reason: `First letter must be “${needU}” (you used “${gotU}”)`,
        tip: true,
      };
    }
    if (!dictionary.has(w)) {
      return {
        ok: false,
        reason: `“${w.toUpperCase()}” isn’t a valid word`,
      };
    }
    return { ok: true, word: w };
  }

  function ensureCoreWords() {
    // Everyday ladder words always available
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
    // People-name blocklist may also hit dual-use English / places — keep these playable
    const keepAsWord = [
      // common English dual-use (also appear as given names)
      'will','hope','grace','rose','mark','may','june','april','faith','angel','ruby','iris',
      'daisy','summer','autumn','chase','clay','cliff','reed','bill','jack','king','grant','frank',
      'dawn','mason','hunter','taylor','carter','pearl','robin','holly','hazel','ivy','jade',
      'amber','crystal','violet','viola','opal','melody','penny','ray','max','sam','ted','joe',
      'tony','art','don','sue','guy','lee','jay','van','dean','rocky','sandy','gene','gail','gale',
      'carol','lance','walker','warren','wade','wayne','terra','genesis','destiny','victor',
      'heath','glen','dale','brook','page','joy','bob','pat','ford','norman','scarlett','sterling',
      // countries / well-known places that appear in the name list
      'india','kenya','georgia','jordan','chad','austin','dallas','orlando','phoenix','florence',
      'victoria','carolina','madison','lincoln','jackson','houston','orlando','paris','rome',
      'london','tokyo','berlin','madrid','moscow','dublin','athens','cairo','sydney','denver',
      'boston','miami','seattle','chicago','memphis','dallas','york','jersey','mexico','canada',
      'brazil','chile','peru','cuba','haiti','ghana','mali','togo','niger','sudan','egypt',
      'spain','italy','china','japan','korea','nepal','tibet','yemen','oman','qatar','malta',
      'monaco','andorra','belize','panama','cuba','haiti','jamaica','bahamas','fiji','samoa',
      'tonga','nauru','palau','tuvalu','kiribati','vanuatu','cyprus','turkey','poland','france',
      'greece','sweden','norway','finland','ireland','scotland','wales','england','holland',
      'belgium','austria','hungary','romania','serbia','croatia','bosnia','albania','kosovo',
      'ukraine','russia','latvia','estonia','lithuania','georgia','armenia','azerbaijan',
    ];
    if (!dictionary || typeof dictionary.add !== 'function') {
      dictionary = new Set(core);
    } else {
      core.forEach((w) => dictionary.add(w));
    }
    // Strip people given-names (funny/obscure spellings); keep dual-use words + places
    const names = window.WSD_NAMES;
    if (Array.isArray(names) && dictionary && typeof dictionary.delete === 'function') {
      const keep = new Set(keepAsWord);
      core.forEach((w) => keep.add(w));
      Object.values(THEME_SEEDS).forEach((pool) => {
        pool.forEach((s) => keep.add(String(s).toLowerCase()));
      });
      names.forEach((n) => {
        const w = String(n || '')
          .toLowerCase()
          .replace(/[^a-z]/g, '');
        if (w.length >= MIN_LEN && w.length <= 12 && !keep.has(w)) {
          dictionary.delete(w);
        }
      });
    }
    // Guarantee core + themed seeds + dual-use/places remain playable
    core.forEach((w) => dictionary.add(w));
    keepAsWord.forEach((w) => {
      if (w.length >= MIN_LEN) dictionary.add(w);
    });
    Object.values(THEME_SEEDS).forEach((pool) => {
      pool.forEach((s) => {
        const w = String(s).toLowerCase();
        if (w.length >= MIN_LEN) dictionary.add(w);
      });
    });
  }

  /**
   * Extra points for longer words so big plays feel rewarding.
   * 7: small · 8: solid · 9+: ramps up
   */
  function lengthBonus(len) {
    if (len < 7) return 0;
    if (len === 7) return 10;
    if (len === 8) return 25;
    if (len === 9) return 45;
    if (len === 10) return 70;
    if (len === 11) return 100;
    // 12+ keeps growing
    return 100 + (len - 11) * 35;
  }

  function scoreWord(word, timeLeft) {
    // base by length + tiny speed bonus + long-word boost
    const len = word.length;
    const base = len * 10;
    const speed = Math.floor(timeLeft / 12);
    const bonus = lengthBonus(len);
    return {
      total: base + speed + bonus,
      base,
      speed,
      bonus,
      len,
    };
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
    // Music only during active play — never start BGM for menu/home
    if (!a.isMuted() && mode === 'play') {
      if (typeof a.setMusicMode === 'function') a.setMusicMode('play');
      else a.startMusic('play');
    }
    syncMuteButtons();
  }

  /** @param {'play' | 'menu' | 'off' | null} mode — only 'play' has music */
  function setBgm(mode) {
    try {
      const a = audio();
      if (!a) return;
      if (mode === 'play') {
        if (a.isMuted()) return;
        if (typeof a.setMusicMode === 'function') a.setMusicMode('play');
        else a.startMusic('play');
        return;
      }
      // Menu, end screen, boards: silence
      if (typeof a.stopMusic === 'function') a.stopMusic();
      else if (typeof a.setMusicMode === 'function') a.setMusicMode('off');
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
      if (check.wrongStart) {
        msg = `Start with “${check.needLetter}” — you used “${check.gotLetter}”`;
        if (!tipShown) {
          tipShown = true;
          msg += ' · look at the gold letter';
        }
      } else if (check.tip && !tipShown) {
        tipShown = true;
        msg = `${check.reason} · use the gold letter`;
      }
      setPlayStatus(msg, 'bad');
      if (el.wordDisplay) el.wordDisplay.classList.add('shake');
      window.setTimeout(() => el.wordDisplay && el.wordDisplay.classList.remove('shake'), 280);
      return;
    }

    const scored = scoreWord(check.word, remaining);
    const pts = scored.total;
    played.add(check.word);
    lastWord = check.word;
    chainWords.push(check.word);
    score += pts;
    el.score.textContent = String(score);
    renderTileWord(check.word, {
      bonus: scored.bonus > 0,
      bonusPts: scored.bonus,
    });
    updateNeed();
    setTypedWord('');
    const nextNeed = lastWord.slice(-1).toUpperCase();
    if (scored.bonus > 0) {
      flashScoreBonus(scored.bonus, scored.len);
      setPlayStatus(
        `+${pts} · long-word bonus +${scored.bonus}! Next: “${nextNeed}”`,
        'bonus'
      );
      playSfx(scored.bonus >= 45 ? 'bonusBig' : 'bonus');
    } else {
      setPlayStatus(`+${pts} · nice! Next starts with “${nextNeed}”`, 'good');
      playSfx('ok');
    }
    updateTargetDelta();
    logEvent('word_accepted', pts, {
      len: check.word.length,
      bonus: scored.bonus,
    });
  }

  function updateTargetDelta() {
    if (!challengeTarget) return;
    const diff = challengeTarget - score;
    el.targetDelta.textContent =
      diff > 0 ? ` · need ${diff} more` : diff === 0 ? ' · tied!' : ' · you lead!';
  }

  function clearEndMessages() {
    if (el.endStatus) el.endStatus.textContent = '';
    if (el.boardStatus) el.boardStatus.textContent = '';
  }

  function endRound(reason) {
    if (!roundActive) return;
    roundActive = false;
    clearInterval(timerId);
    if (el.input) el.input.disabled = true;
    if (el.gameKeyboard) el.gameKeyboard.classList.add('kb-disabled');
    if (el.submitBtn) el.submitBtn.disabled = true;
    // Never keep share/ad text from a previous action on this screen
    clearEndMessages();

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
        : score >= 120
          ? 'Incredible chain!'
          : score >= 80
            ? 'Blazing chain!'
            : score >= 40
              ? 'Nice chain!'
              : wordsCount === 0
                ? 'No words this time'
                : 'Round over';

    el.finalScore.textContent = String(score);
    el.finalWords.textContent = String(wordsCount);
    el.finalLongest.textContent = longest ? longest.toUpperCase() : '—';
    el.finalStreak.textContent = String(save.streak || 0);
    // endStatus = round result only (not share/ad feedback)
    el.endStatus.textContent =
      reason === 'quit'
        ? 'Ended early — try again when you’re ready.'
        : challengeTarget
          ? beat
            ? 'You beat their score — nice!'
            : `Target was ${challengeTarget}. Try again to beat it.`
          : score > 0
            ? 'Great run!'
            : 'Time’s up — jump back in and build a chain!';

    // boardStatus = save / share / ad feedback (secondary line)
    if (el.boardStatus) {
      el.boardStatus.textContent = score > 0 ? 'Saving your best…' : '';
    }

    // Offer freeze after any scoring round (can bank more than one)
    const canEarnFreeze = score > 0;
    if (el.freezeBtn) {
      el.freezeBtn.hidden = !canEarnFreeze;
      el.freezeBtn.disabled = false;
      const n = save.freezes || 0;
      el.freezeBtn.textContent =
        n > 0
          ? `Earn another freeze (watch ad) · you have ${n}`
          : 'Earn streak freeze (watch ad)';
    }

    if (beat || score >= 80) playSfx('win');
    else playSfx('end');

    showScreen('end');
    setBgm('off');
    logEvent('round_complete', score, {
      words: wordsCount,
      reason: reason || 'timer',
      seed: dailySeed,
      mode: playMode,
    });

    submitScoreToBoards(score)
      .then((res) => {
        if (!el.boardStatus) return;
        if (res.local || res.facebook) {
          el.boardStatus.textContent = 'Best saved ✓ Open My bests anytime.';
          return;
        }
        el.boardStatus.textContent = 'Could not save this score — try another round.';
      })
      .catch(() => {
        if (el.boardStatus) {
          el.boardStatus.textContent = 'Could not save this score — try again.';
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
    clearEndMessages();
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
    setPlayStatus(
      `Start with “${seed.slice(-1)}”. Longer words (7+) earn bonus points!`
    );
    if (el.playModeBadge) el.playModeBadge.textContent = '60s';
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

  function isLikelyDesktopBrowser() {
    try {
      const ua = navigator.userAgent || '';
      const mobile = /Android|iPhone|iPad|iPod|Mobile|FBAN|FBAV/i.test(ua);
      return !mobile && (window.innerWidth || 0) > 700;
    } catch {
      return false;
    }
  }

  /**
   * Show a rewarded video for streak freeze.
   * Returns { ok, reason } — ok only if the player finishes the ad (or local mock).
   */
  async function showRewardedVideo(kind) {
    logEvent('rewarded_offer', 1, { kind });
    const FB = window.FBInstant;
    const placement =
      (window.WSD_REWARDED_PLACEMENT_ID || REWARDED_PLACEMENT_ID || '').trim();

    const isMock =
      FB &&
      FB.player &&
      typeof FB.player.getID === 'function' &&
      String(FB.player.getID()) === 'local-player';

    if (!FB || typeof FB.getRewardedVideoAsync !== 'function') {
      logEvent('rewarded_unavailable', 0, { kind, reason: 'no_api' });
      return { ok: false, reason: isLikelyDesktopBrowser() ? 'desktop' : 'unavailable' };
    }

    // Some Instant Game clients omit ads from supported APIs (esp. desktop web)
    try {
      if (typeof FB.getSupportedAPIs === 'function') {
        const apis = FB.getSupportedAPIs() || [];
        if (apis.length && !apis.includes('getRewardedVideoAsync')) {
          logEvent('rewarded_unavailable', 0, { kind, reason: 'not_in_apis' });
          return {
            ok: false,
            reason: isLikelyDesktopBrowser() ? 'desktop' : 'unsupported',
          };
        }
      }
    } catch {
      /* continue and try load anyway */
    }

    if (!placement) {
      logEvent('rewarded_unavailable', 0, { kind, reason: 'no_placement' });
      return { ok: false, reason: 'placement' };
    }

    try {
      if (el.boardStatus) el.boardStatus.textContent = 'Loading ad…';
      const ad = await FB.getRewardedVideoAsync(placement);
      await ad.loadAsync();
      if (el.boardStatus) el.boardStatus.textContent = 'Watch the ad to earn your freeze…';
      await ad.showAsync();
      logEvent('rewarded_complete', 1, { kind, placement });
      return { ok: true, reason: 'watched' };
    } catch (err) {
      console.warn('rewarded video', err);
      const code = String((err && (err.code || err.message)) || err || '');
      logEvent('rewarded_fail', 0, { kind, code: code.slice(0, 120) });

      if (isMock) {
        await new Promise((r) => setTimeout(r, 500));
        logEvent('rewarded_complete', 1, { kind, mock: true });
        return { ok: true, reason: 'mock' };
      }

      if (/USER_INPUT|cancel|abort|ADS_NOT_LOADED.*dismiss|closed/i.test(code)) {
        return { ok: false, reason: 'skipped' };
      }
      if (/ADS_NO_FILL|NO_FILL|rate.?limit|TOO_MANY|FREQUENCY/i.test(code)) {
        return { ok: false, reason: 'nofill' };
      }
      if (
        /CLIENT_UNSUPPORTED|UNSUPPORTED|not support|not available|ADS_NOT_LOADED|NETWORK/i.test(
          code
        )
      ) {
        return {
          ok: false,
          reason: isLikelyDesktopBrowser() ? 'desktop' : 'unsupported',
        };
      }
      if (/INVALID_PARAM|placement|PLACEMENT|INVALID_OPERATION/i.test(code)) {
        return { ok: false, reason: 'placement' };
      }
      return {
        ok: false,
        reason: isLikelyDesktopBrowser() ? 'desktop' : 'error',
      };
    }
  }

  const PLAY_LINK = 'https://www.facebook.com/gaming/play/1593839865675820/';

  function setFriendsInviteStatus(text, kind) {
    if (!el.friendsInviteStatus) return;
    el.friendsInviteStatus.textContent = text || '';
    el.friendsInviteStatus.classList.remove('invite-ok', 'invite-bad', 'invite-busy');
    if (kind) el.friendsInviteStatus.classList.add(kind);
  }

  /** Meta share/invite dialogs often want a base64 image — build a small branded card. */
  function buildShareImageDataUrl(seed, scoreHint) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 314;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const g = ctx.createLinearGradient(0, 0, 600, 314);
      g.addColorStop(0, '#0b1220');
      g.addColorStop(1, '#1a3a6b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 600, 314);
      ctx.fillStyle = '#ffd56a';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText('Word Streak Duels', 36, 70);
      ctx.fillStyle = '#e8eef8';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText('60s word ladder · challenge a friend', 36, 120);
      ctx.fillStyle = '#8ec5ff';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.fillText('Seed ' + String(seed || '—'), 36, 200);
      if (scoreHint != null) {
        ctx.fillStyle = '#9dffb0';
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.fillText('Beat my ' + scoreHint, 36, 260);
      }
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  function supportedApis() {
    try {
      const FB = window.FBInstant;
      if (FB && typeof FB.getSupportedAPIs === 'function') {
        return FB.getSupportedAPIs() || [];
      }
    } catch {
      /* ignore */
    }
    return [];
  }

  function apiSupported(name) {
    const apis = supportedApis();
    // Empty list = unknown (real SDK sometimes returns full list after start)
    if (!apis.length) return true;
    return apis.includes(name);
  }

  async function copyPlayLink(extraText) {
    const blob = (extraText ? extraText + '\n' : '') + PLAY_LINK;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(blob);
        return true;
      }
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = blob;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  /**
   * Home Friends tab: invite via Instant Games APIs.
   * Prefer inviteAsync (real friend picker). shareAsync needs an image.
   * Always ends with visible status; last resort copies the play link.
   */
  async function inviteFriendShare() {
    playSfx('tap');
    const seed = (challengeSeed || dailySeed).toUpperCase();
    const best = save.bestToday || 0;
    const textStr = `Play Word Streak Duels with me — today's seed is ${seed}. Beat my best ${best}!`;
    const data = { seed, targetScore: best, mode: 'friends' };
    const image = buildShareImageDataUrl(seed, best);
    const FB = window.FBInstant;

    setFriendsInviteStatus('Getting share ready…', 'invite-busy');
    if (el.friendsInviteBtn) el.friendsInviteBtn.disabled = true;

    let lastErr = null;
    let opened = false;

    try {
      if (!FB) {
        setFriendsInviteStatus('Sharing works when you play on Facebook.', 'invite-bad');
        return;
      }

      if (typeof FB.inviteAsync === 'function' && apiSupported('inviteAsync')) {
        try {
          const payload = { text: textStr, data };
          if (image) payload.image = image;
          await FB.inviteAsync(payload);
          opened = true;
          playSfx('share');
          setFriendsInviteStatus(
            'Invite ready ✓ Pick a friend so they can try to beat your score.',
            'invite-ok'
          );
          logEvent('invite_sent', best, { seed, via: 'inviteAsync' });
          return;
        } catch (err) {
          lastErr = err;
          console.warn('inviteAsync', err);
          if (/USER_INPUT|cancel|abort/i.test(String(err && (err.message || err.code) || err))) {
            setFriendsInviteStatus('Share cancelled — try again anytime.', 'invite-bad');
            return;
          }
        }
      }

      if (typeof FB.shareAsync === 'function' && apiSupported('shareAsync')) {
        const intents = ['SHARE', 'CHALLENGE', 'REQUEST', 'INVITE'];
        for (let i = 0; i < intents.length; i++) {
          try {
            const payload = { intent: intents[i], text: textStr, data };
            if (image) payload.image = image;
            await FB.shareAsync(payload);
            opened = true;
            playSfx('share');
            setFriendsInviteStatus(
              'Share ready ✓ Send it so a friend can try to beat your score.',
              'invite-ok'
            );
            logEvent('invite_sent', best, { seed, via: 'shareAsync', intent: intents[i] });
            return;
          } catch (err) {
            lastErr = err;
            console.warn('shareAsync ' + intents[i], err);
            if (/USER_INPUT|cancel|abort/i.test(String(err && (err.message || err.code) || err))) {
              setFriendsInviteStatus('Share cancelled — try again anytime.', 'invite-bad');
              return;
            }
          }
        }
      }

      if (FB.context && typeof FB.context.chooseAsync === 'function' && apiSupported('context.chooseAsync')) {
        try {
          await FB.context.chooseAsync();
          opened = true;
          playSfx('share');
          setFriendsInviteStatus('Friend selected ✓ Play a round and share your score!', 'invite-ok');
          logEvent('invite_sent', best, { seed, via: 'context.chooseAsync' });
          return;
        } catch (err) {
          lastErr = err;
          console.warn('context.chooseAsync', err);
        }
      }

      const copied = await copyPlayLink(textStr);
      if (copied) {
        playSfx('share');
        setFriendsInviteStatus(
          'Play link copied ✓ Paste it in Messenger or chat so a friend can open the game and try to beat your score.',
          'invite-ok'
        );
        logEvent('invite_fallback_copy', 1, { seed });
      } else {
        setFriendsInviteStatus(
          'Couldn’t open share — copy this link for a friend: ' + PLAY_LINK,
          'invite-bad'
        );
      }
      if (lastErr) console.warn('invite final error', lastErr);
    } catch (err) {
      console.warn(err);
      setFriendsInviteStatus(
        'Couldn’t share right now. Try again, or copy: ' + PLAY_LINK,
        'invite-bad'
      );
    } finally {
      if (el.friendsInviteBtn) el.friendsInviteBtn.disabled = false;
      if (!opened && el.friendsInviteStatus && !el.friendsInviteStatus.textContent) {
        setFriendsInviteStatus('Couldn’t share right now — try again.', 'invite-bad');
      }
    }
  }

  function setActionStatus(text) {
    // Secondary line only — never replaces the main “Great run!” message
    if (el.boardStatus) el.boardStatus.textContent = text || '';
  }

  async function shareChallenge() {
    const seed = (challengeSeed || dailySeed).toUpperCase();
    const text = `I scored ${score} on seed ${seed} in Word Streak Duels — beat my chain!`;
    const image = buildShareImageDataUrl(seed, score);
    playSfx('share');
    setActionStatus('Opening share…');
    try {
      const FB = window.FBInstant;
      if (FB && typeof FB.inviteAsync === 'function' && apiSupported('inviteAsync')) {
        try {
          const payload = { text, data: { seed, targetScore: score, mode: 'friends' } };
          if (image) payload.image = image;
          await FB.inviteAsync(payload);
          setActionStatus('Invite ready ✓ Pick a friend to challenge.');
          logEvent('challenge_sent', score, { seed, via: 'inviteAsync' });
          return;
        } catch (err) {
          console.warn(err);
        }
      }
      const payload = {
        intent: 'CHALLENGE',
        text,
        data: { seed, targetScore: score, mode: 'friends' },
      };
      if (image) payload.image = image;
      await window.FBInstant.shareAsync(payload);
      setActionStatus('Share ready ✓ Send your score to a friend.');
      logEvent('challenge_sent', score, { seed, via: 'shareAsync' });
      logEvent('share_complete', 1, { seed });
    } catch (err) {
      const copied = await copyPlayLink(text);
      setActionStatus(
        copied
          ? 'Score link copied ✓ Paste it in Messenger or chat for a friend.'
          : 'Couldn’t share right now — try again in a moment.'
      );
      console.warn(err);
    }
  }

  async function protectStreak() {
    if (!el.freezeBtn) return;
    el.freezeBtn.disabled = true;
    setActionStatus('Loading ad…');
    const result = await showRewardedVideo('streak_freeze');
    if (!result.ok) {
      el.freezeBtn.disabled = false;
      const n = save.freezes || 0;
      el.freezeBtn.textContent =
        n > 0
          ? `Earn another freeze (watch ad) · you have ${n}`
          : 'Earn streak freeze (watch ad)';
      const msg =
        result.reason === 'skipped'
          ? 'Ad closed early — no streak freeze this time.'
          : result.reason === 'nofill'
            ? 'No ad available right now. New placements can take a while — try again later.'
            : result.reason === 'desktop'
              ? 'Ads work best in the Facebook mobile app (not desktop).'
              : result.reason === 'unsupported'
                ? 'Ads aren’t available here yet. Try again later in the Facebook app.'
                : result.reason === 'placement'
                  ? 'Ad placement isn’t ready yet. Try again later.'
                  : 'Couldn’t show an ad — try again later.';
      setActionStatus(msg);
      return;
    }
    save.freezes = (save.freezes || 0) + 1;
    save.freezeUsedDay = dayKey();
    if (save.streak < 1) save.streak = 1;
    persist();
    el.freezeBtn.hidden = false;
    el.freezeBtn.disabled = false;
    el.freezeBtn.textContent = `Earn another freeze (watch ad) · you have ${save.freezes}`;
    setActionStatus(
      'Streak freeze earned ✓ If you miss a day, your 🔥 streak stays safe.'
    );
    el.finalStreak.textContent = String(save.streak || 0);
    if (el.homeFreeze) el.homeFreeze.textContent = String(save.freezes || 0);
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
    el.playBtn.addEventListener('click', () => {
      playSfx('tap');
      setPlayMode('daily');
      startRound();
    });
    if (el.dailyBoardBtn) {
      el.dailyBoardBtn.addEventListener('click', () => {
        playSfx('tap');
        openLeaderboard('daily').catch(console.error);
      });
    }
    if (el.friendsInviteBtn) {
      el.friendsInviteBtn.addEventListener('click', () => {
        void inviteFriendShare().catch(console.warn);
      });
    }
    if (el.endBoardBtn) {
      el.endBoardBtn.addEventListener('click', () => {
        playSfx('tap');
        openLeaderboard('daily').catch(console.error);
      });
    }
    if (el.boardCloseBtn) {
      el.boardCloseBtn.addEventListener('click', () => {
        playSfx('tap');
        showScreen('home');
        setBgm('off');
      });
    }
    if (el.boardPlayBtn) {
      el.boardPlayBtn.addEventListener('click', () => {
        playSfx('tap');
        setPlayMode('daily');
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
      setBgm('off');
    });

    function onMuteClick() {
      const a = audio();
      if (!a) return;
      void a.unlock().then(() => {
        a.toggleMute();
        // Unmute only restarts music if a round is active
        if (!a.isMuted() && !el.play.hidden) {
          if (typeof a.setMusicMode === 'function') a.setMusicMode('play');
          else a.startMusic('play');
        } else if (a.isMuted() || el.play.hidden) {
          if (typeof a.stopMusic === 'function') a.stopMusic();
        }
        syncMuteButtons();
        playSfx('tap');
      });
    }
    if (el.muteBtn) el.muteBtn.addEventListener('click', onMuteClick);
    if (el.muteBtnPlay) el.muteBtnPlay.addEventListener('click', onMuteClick);

    const unlockOnce = () => {
      // Unlock Web Audio for SFX; do not start menu music
      void unlockAudio(null);
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
    setBoot('Starting…', 10);
    await FB.initializeAsync();
    FB.setLoadingProgress(35);
    setBoot('Loading words…', 35);

    // Dictionary already in memory via words.js
    await new Promise((r) => setTimeout(r, 80));
    dictionary = window.WSD_WORDS || dictionary;
    ensureCoreWords();
    if (!dictionary || dictionary.size < 100) {
      console.error('Dictionary missing or empty', dictionary && dictionary.size);
      setBoot('Couldn’t load words. Close and reopen the game.', 100);
      throw new Error('Dictionary empty');
    }
    setBoot('Almost ready…', 75);
    FB.setLoadingProgress(75);
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
    setPlayMode('daily');
    showScreen('home');
    logEvent('boot_complete', dictionary.size, { load: 'ok' });
  }

  boot().catch((err) => {
    console.error(err);
    setBoot('Couldn’t start. Close and reopen the game.', 100);
  });
})();
