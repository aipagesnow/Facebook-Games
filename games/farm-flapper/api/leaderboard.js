/**
 * Flappy Duck leaderboard API
 *
 * Storage priority:
 *  1. Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 *     — recommended for real multiplayer on Vercel
 *  2. In-memory fallback (fine for local dev; resets on cold starts)
 *
 * Set env vars in Vercel → Project → Settings → Environment Variables
 * Free Upstash Redis: https://upstash.com (or Vercel Storage → KV)
 */

const KEY = "flappy-duck:leaderboard";
const MAX_ENTRIES = 50;
const MAX_NAME = 16;
const MIN_NAME = 2;
const MAX_SCORE = 999999;

// Warm-instance fallback (dev / no Redis)
let memoryBoard = [];

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function hasRedis() {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function redisFetch(path, init = {}) {
  const base = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, "");
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Redis ${res.status}: ${text}`);
  }
  return res.json();
}

const fs = require("fs");
const path = require("path");
const DATA_FILE = path.join(__dirname, "../data/leaderboard.json");

function loadFileBoard() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return memoryBoard;
}

function saveFileBoard(board) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(board, null, 2), "utf8");
  } catch {}
}

async function loadBoard() {
  if (hasRedis()) {
    try {
      const data = await redisFetch(`/get/${encodeURIComponent(KEY)}`);
      if (data && data.result) {
        const parsed =
          typeof data.result === "string"
            ? JSON.parse(data.result)
            : data.result;
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Redis load failed:", e.message);
    }
  }
  return loadFileBoard();
}

async function saveBoard(board) {
  memoryBoard = board;
  saveFileBoard(board);
  if (!hasRedis()) return;
  try {
    // Pipeline body form handles JSON values cleanly
    await redisFetch("/pipeline", {
      method: "POST",
      body: JSON.stringify([["SET", KEY, JSON.stringify(board)]]),
    });
  } catch (e) {
    console.error("Redis save failed:", e.message);
  }
}

function sanitizeName(raw) {
  if (typeof raw !== "string") return null;
  let name = raw
    .replace(/[^\w\s\-_.!]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME);
  if (name.length < MIN_NAME) return null;
  return name;
}

function sanitizeScore(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > MAX_SCORE) return null;
  return Math.floor(n);
}

function sortBoard(board) {
  return board
    .slice()
    .sort((a, b) => b.score - a.score || a.at - b.at)
    .slice(0, MAX_ENTRIES);
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    if (req.method === "GET") {
      const board = sortBoard(await loadBoard());
      const limit = Math.min(50, Math.max(1, Number(req.query?.limit) || 20));
      return res.status(200).json({
        ok: true,
        storage: hasRedis() ? "redis" : "memory",
        entries: board.slice(0, limit),
      });
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ ok: false, error: "Invalid JSON" });
        }
      }
      body = body || {};

      const name = sanitizeName(body.name);
      const score = sanitizeScore(body.score);
      if (!name) {
        return res
          .status(400)
          .json({ ok: false, error: "Name must be 2–16 characters" });
      }
      if (score === null) {
        return res.status(400).json({ ok: false, error: "Invalid score" });
      }

      const board = await loadBoard();
      const now = Date.now();
      const playerId =
        typeof body.playerId === "string"
          ? body.playerId.slice(0, 64).replace(/[^\w\-]/g, "")
          : "";

      // Same playerId → update if higher; else match by exact name (case-insensitive)
      let idx = -1;
      if (playerId) {
        idx = board.findIndex((e) => e.playerId && e.playerId === playerId);
      }
      if (idx < 0) {
        idx = board.findIndex(
          (e) => e.name.toLowerCase() === name.toLowerCase()
        );
      }

      let updated = false;
      let rank = 0;

      if (idx >= 0) {
        if (score > board[idx].score) {
          board[idx] = {
            ...board[idx],
            name,
            score,
            at: now,
            playerId: playerId || board[idx].playerId || undefined,
          };
          updated = true;
        } else {
          // Keep best; still return rank of existing
          const sorted = sortBoard(board);
          rank =
            sorted.findIndex(
              (e) =>
                e.name.toLowerCase() === name.toLowerCase() ||
                (playerId && e.playerId === playerId)
            ) + 1;
          return res.status(200).json({
            ok: true,
            updated: false,
            message: "Existing best is higher",
            best: board[idx].score,
            rank: rank || null,
            entries: sorted.slice(0, 20),
            storage: hasRedis() ? "redis" : "memory",
          });
        }
      } else {
        board.push({
          name,
          score,
          at: now,
          playerId: playerId || undefined,
        });
        updated = true;
      }

      const sorted = sortBoard(board);
      await saveBoard(sorted);

      rank =
        sorted.findIndex(
          (e) =>
            e.name.toLowerCase() === name.toLowerCase() ||
            (playerId && e.playerId === playerId)
        ) + 1;

      return res.status(200).json({
        ok: true,
        updated,
        rank: rank || null,
        best: score,
        entries: sorted.slice(0, 20),
        storage: hasRedis() ? "redis" : "memory",
      });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};
