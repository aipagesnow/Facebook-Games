const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "leaderboard.json");

const MAX_ENTRIES = 100;
const MAX_NAME = 16;
const MIN_NAME = 2;
const MAX_SCORE = 999999;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with disk
let memoryBoard = loadBoardFromDisk();

function loadBoardFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error reading leaderboard.json:", err.message);
  }
  return [];
}

function saveBoardToDisk(board) {
  try {
    memoryBoard = board;
    fs.writeFileSync(DATA_FILE, JSON.stringify(board, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing leaderboard.json:", err.message);
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

const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // Handle Leaderboard API endpoint
  if (pathname === "/api/leaderboard") {
    if (req.method === "GET") {
      const board = sortBoard(memoryBoard);
      const limitParam = Number(urlObj.searchParams.get("limit")) || 20;
      const limit = Math.min(100, Math.max(1, limitParam));

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          ok: true,
          storage: "file",
          entries: board.slice(0, limit),
        })
      );
    }

    if (req.method === "POST") {
      let bodyStr = "";
      req.on("data", (chunk) => {
        bodyStr += chunk;
        if (bodyStr.length > 1e6) req.destroy();
      });

      req.on("end", () => {
        try {
          const body = JSON.parse(bodyStr || "{}");
          const name = sanitizeName(body.name);
          const score = sanitizeScore(body.score);
          const playerId =
            typeof body.playerId === "string"
              ? body.playerId.slice(0, 64).replace(/[^\w\-]/g, "")
              : "";

          if (!name) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                ok: false,
                error: "Name must be 2–16 characters",
              })
            );
          }
          if (score === null) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({ ok: false, error: "Invalid score" })
            );
          }

          let board = loadBoardFromDisk();
          const now = Date.now();

          // Check for existing player entry by ID or Name
          let idx = -1;
          if (playerId) {
            idx = board.findIndex(
              (e) => e.playerId && e.playerId === playerId
            );
          }
          if (idx < 0) {
            idx = board.findIndex(
              (e) => e.name.toLowerCase() === name.toLowerCase()
            );
          }

          let updated = false;

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
              const sorted = sortBoard(board);
              const rank =
                sorted.findIndex(
                  (e) =>
                    e.name.toLowerCase() === name.toLowerCase() ||
                    (playerId && e.playerId === playerId)
                ) + 1;

              res.writeHead(200, { "Content-Type": "application/json" });
              return res.end(
                JSON.stringify({
                  ok: true,
                  updated: false,
                  message: "Existing score is higher or equal",
                  best: board[idx].score,
                  rank: rank || null,
                  entries: sorted.slice(0, 20),
                  storage: "file",
                })
              );
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
          saveBoardToDisk(sorted);

          const rank =
            sorted.findIndex(
              (e) =>
                e.name.toLowerCase() === name.toLowerCase() ||
                (playerId && e.playerId === playerId)
            ) + 1;

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              ok: true,
              updated,
              rank: rank || null,
              best: score,
              entries: sorted.slice(0, 20),
              storage: "file",
            })
          );
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ ok: false, error: "Invalid request payload" })
          );
        }
      });
      return;
    }

    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
  }

  // Serve static files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
  if (safePath === "/" || safePath === "\\") {
    safePath = "/index.html";
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Prevent directory traversal outside PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("404 Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`🦆 Flappy Duck server running at http://localhost:${PORT}/`);
  console.log(`🏆 Persistent Leaderboard saved to: ${DATA_FILE}`);
});
