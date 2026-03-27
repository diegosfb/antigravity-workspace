import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlayerState {
  id: string;
  name: string;
  board: number[][];
  score: number;
  isGameOver: boolean;
  isReady: boolean;
}

interface RoomState {
  players: Map<string, PlayerState>;
  status: "waiting" | "playing" | "finished";
  attackSpeedMultiplier: number;
  ownerId: string;
  ww2Mode: boolean;
  levelIntervalMinutes: number;
  speedIncreasePercent: number;
  levelLineThreshold: number;
  currentLevel: number;
  currentStageIndex: number;
  baseSpeedMultiplier: number;
  gameStartTime?: number;
  levelTimer?: NodeJS.Timeout;
  cleanupTimer?: NodeJS.Timeout;
  debugMode: boolean;
  backgroundMusicEnabled: boolean;
  totalLines: number;
  // Per-player board update throttle (last emit timestamp)
  boardUpdateTimers: Map<string, NodeJS.Timeout>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BOARD_UPDATE_THROTTLE_MS = 100; // max 10 board updates/sec per player
const ROOM_CLEANUP_DELAY_MS = 60_000; // clean finished/empty rooms after 60s

function buildRoomUpdate(room: RoomState) {
  return {
    players: Array.from(room.players.values()),
    status: room.status,
    attackSpeedMultiplier: room.attackSpeedMultiplier,
    ownerId: room.ownerId,
    ww2Mode: room.ww2Mode,
    levelIntervalMinutes: room.levelIntervalMinutes,
    speedIncreasePercent: room.speedIncreasePercent,
    levelLineThreshold: room.levelLineThreshold,
    currentLevel: room.currentLevel,
    currentStageIndex: room.currentStageIndex,
    baseSpeedMultiplier: room.baseSpeedMultiplier,
    debugMode: room.debugMode,
    backgroundMusicEnabled: room.backgroundMusicEnabled,
  };
}

function clearRoomTimers(room: RoomState) {
  if (room.levelTimer) {
    clearInterval(room.levelTimer);
    room.levelTimer = undefined;
  }
  if (room.cleanupTimer) {
    clearTimeout(room.cleanupTimer);
    room.cleanupTimer = undefined;
  }
  room.boardUpdateTimers.forEach((t) => clearTimeout(t));
  room.boardUpdateTimers.clear();
}

// ─── Server ──────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    // Tune Socket.io reliability settings
    pingTimeout: 20000,
    pingInterval: 10000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6, // 1 MB – prevent oversized payloads from crashing
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

  const rooms = new Map<string, RoomState>();

  // Health check endpoint (used by App Runner / load balancers)
  app.get("/health", (_req, res) => res.json({ status: "ok", rooms: rooms.size }));

  // ── Level progression ──────────────────────────────────────────────────────

  function levelUp(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.status !== "playing") return;

    room.currentLevel++;
    room.currentStageIndex = (room.currentStageIndex + 1) % 10;
    room.baseSpeedMultiplier *= 1 - room.speedIncreasePercent / 100;

    io.to(roomId).emit("room-update", buildRoomUpdate(room));
    io.to(roomId).emit("level-up", {
      level: room.currentLevel,
      stageIndex: room.currentStageIndex,
      baseSpeedMultiplier: room.baseSpeedMultiplier,
    });
  }

  // ── Room cleanup ───────────────────────────────────────────────────────────

  function scheduleRoomCleanup(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
    room.cleanupTimer = setTimeout(() => {
      const r = rooms.get(roomId);
      if (r && (r.players.size === 0 || r.status === "finished")) {
        clearRoomTimers(r);
        rooms.delete(roomId);
        console.log(`Room ${roomId} cleaned up.`);
      }
    }, ROOM_CLEANUP_DELAY_MS);
  }

  // ── Connections ────────────────────────────────────────────────────────────

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Wrap every handler in try/catch so one bad event doesn't crash the server
    function safe<T>(fn: (data: T) => void) {
      return (data: T) => {
        try {
          fn(data);
        } catch (err) {
          console.error(`[socket:${socket.id}] Handler error:`, err);
        }
      };
    }

    // ── join-room ────────────────────────────────────────────────────────────
    socket.on(
      "join-room",
      safe<{ roomId: string; playerName: string }>(async ({ roomId, playerName }) => {
        const rId = String(roomId).slice(0, 20); // sanitize
        const name = String(playerName || "Anonymous").slice(0, 30);

        console.log(`Player ${name} (${socket.id}) joining room ${rId}`);

        await socket.join(rId);

        if (!rooms.has(rId)) {
          rooms.set(rId, {
            players: new Map(),
            status: "waiting",
            attackSpeedMultiplier: 0.33,
            ownerId: socket.id,
            ww2Mode: true,
            levelIntervalMinutes: 5,
            speedIncreasePercent: 25,
            levelLineThreshold: 10,
            currentLevel: 1,
            currentStageIndex: 0,
            baseSpeedMultiplier: 1.0,
            debugMode: true,
            backgroundMusicEnabled: true,
            totalLines: 0,
            boardUpdateTimers: new Map(),
          });
        }

        const room = rooms.get(rId)!;

        // Cancel any pending cleanup (player rejoined)
        if (room.cleanupTimer) {
          clearTimeout(room.cleanupTimer);
          room.cleanupTimer = undefined;
        }

        // If player is rejoining an active game, restore their slot
        const existing = room.players.get(socket.id);
        room.players.set(socket.id, {
          id: socket.id,
          name,
          board: existing?.board ?? Array(20).fill(0).map(() => Array(10).fill(0)),
          score: existing?.score ?? 0,
          isGameOver: existing?.isGameOver ?? false,
          isReady: existing?.isReady ?? false,
        });

        io.to(rId).emit("room-update", buildRoomUpdate(room));
      })
    );

    // ── update-settings ──────────────────────────────────────────────────────
    socket.on(
      "update-settings",
      safe<{
        roomId: string;
        attackSpeedMultiplier?: number;
        ww2Mode?: boolean;
        levelIntervalMinutes?: number;
        speedIncreasePercent?: number;
        levelLineThreshold?: number;
        backgroundMusicEnabled?: boolean;
      }>(({ roomId, attackSpeedMultiplier, ww2Mode, levelIntervalMinutes, speedIncreasePercent, levelLineThreshold, backgroundMusicEnabled }) => {
        const room = rooms.get(roomId);
        if (!room || room.ownerId !== socket.id) return;

        if (attackSpeedMultiplier !== undefined) room.attackSpeedMultiplier = attackSpeedMultiplier;
        if (ww2Mode !== undefined) room.ww2Mode = ww2Mode;
        if (levelIntervalMinutes !== undefined) room.levelIntervalMinutes = levelIntervalMinutes;
        if (speedIncreasePercent !== undefined) room.speedIncreasePercent = speedIncreasePercent;
        if (levelLineThreshold !== undefined) room.levelLineThreshold = levelLineThreshold;
        if (backgroundMusicEnabled !== undefined) room.backgroundMusicEnabled = backgroundMusicEnabled;

        io.to(roomId).emit("room-update", buildRoomUpdate(room));
      })
    );

    // ── player-ready ─────────────────────────────────────────────────────────
    socket.on(
      "player-ready",
      safe<{ roomId: string }>(({ roomId }) => {
        const rId = String(roomId);
        const room = rooms.get(rId);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (player) player.isReady = true;

        const allReady = Array.from(room.players.values()).every((p) => p.isReady);
        if (allReady && room.players.size >= 2) {
          room.status = "playing";
          room.currentLevel = 1;
          room.currentStageIndex = 0;
          room.baseSpeedMultiplier = 1.0;
          room.totalLines = 0;
          room.gameStartTime = Date.now();

          if (room.ww2Mode) {
            if (room.levelTimer) clearInterval(room.levelTimer);
            room.levelTimer = setInterval(() => levelUp(rId), room.levelIntervalMinutes * 60 * 1000);
          }

          io.to(rId).emit("game-start");
        }

        io.to(rId).emit("room-update", buildRoomUpdate(room));
      })
    );

    // ── lines-cleared ────────────────────────────────────────────────────────
    socket.on(
      "lines-cleared",
      safe<{ roomId: string; lines: number }>(({ roomId, lines }) => {
        const room = rooms.get(roomId);
        if (!room || !room.ww2Mode || room.status !== "playing") return;

        room.totalLines += Math.min(lines, 4); // cap at 4 (tetris) to prevent abuse
        if (room.totalLines >= room.levelLineThreshold) {
          room.totalLines = 0;
          levelUp(roomId);
        }
      })
    );

    // ── navigate-level (debug) ────────────────────────────────────────────────
    socket.on(
      "navigate-level",
      safe<{ roomId: string; direction: "prev" | "next" }>(({ roomId, direction }) => {
        const rId = String(roomId);
        const room = rooms.get(rId);
        if (!room || !room.debugMode || room.status !== "playing") return;

        if (direction === "next") {
          room.currentStageIndex = (room.currentStageIndex + 1) % 10;
          room.currentLevel++;
        } else {
          room.currentStageIndex = (room.currentStageIndex - 1 + 10) % 10;
          if (room.currentLevel > 1) room.currentLevel--;
        }

        room.baseSpeedMultiplier = Math.pow(1 - room.speedIncreasePercent / 100, room.currentLevel - 1);
        io.to(rId).emit("room-update", buildRoomUpdate(room));
      })
    );

    // ── update-board (throttled) ──────────────────────────────────────────────
    socket.on(
      "update-board",
      safe<{ roomId: string; board: number[][]; score: number }>(({ roomId, board, score }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (!player) return;

        // Always keep internal state up-to-date
        player.board = board;
        player.score = score;

        // Throttle the broadcast to opponents to avoid flooding
        if (room.boardUpdateTimers.has(socket.id)) return; // already scheduled

        room.boardUpdateTimers.set(
          socket.id,
          setTimeout(() => {
            room.boardUpdateTimers.delete(socket.id);
            // Only broadcast if game is still active
            if (room.status === "playing") {
              socket.to(roomId).emit("opponent-update", { id: socket.id, board: player.board, score: player.score });
            }
          }, BOARD_UPDATE_THROTTLE_MS)
        );
      })
    );

    // ── game-over ─────────────────────────────────────────────────────────────
    socket.on(
      "game-over",
      safe<{ roomId: string }>(({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (player) player.isGameOver = true;

        const alivePlayers = Array.from(room.players.values()).filter((p) => !p.isGameOver);

        if (alivePlayers.length <= 1) {
          room.status = "finished";
          clearRoomTimers(room);
          const winner = alivePlayers[0] ?? null;
          io.to(roomId).emit("game-over-all", { winnerId: winner?.id ?? null });
          scheduleRoomCleanup(roomId);
        } else {
          io.to(roomId).emit("room-update", buildRoomUpdate(room));
        }
      })
    );

    // ── send-garbage ──────────────────────────────────────────────────────────
    socket.on(
      "send-garbage",
      safe<{ roomId: string; lines: number }>(({ roomId, lines }) => {
        const sanitizedLines = Math.min(Math.max(1, lines), 8); // clamp 1-8
        socket.to(roomId).emit("receive-garbage", { lines: sanitizedLines });
      })
    );

    // ── send-special ──────────────────────────────────────────────────────────
    socket.on(
      "send-special",
      safe<{ roomId: string; targetId: string; type: string }>(({ targetId, type }) => {
        const allowedTypes = ["I", "O", "T", "S", "Z", "J", "L"];
        if (!allowedTypes.includes(type)) return; // prevent injection
        io.to(targetId).emit("receive-special", { type });
      })
    );

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.id} (reason: ${reason})`);

      rooms.forEach((room, roomId) => {
        if (!room.players.has(socket.id)) return;

        // Clear any pending board update timer for this player
        const boardTimer = room.boardUpdateTimers.get(socket.id);
        if (boardTimer) {
          clearTimeout(boardTimer);
          room.boardUpdateTimers.delete(socket.id);
        }

        room.players.delete(socket.id);

        if (room.players.size === 0) {
          // No players left – clean up immediately
          clearRoomTimers(room);
          scheduleRoomCleanup(roomId);
          return;
        }

        // Reassign owner if needed
        if (room.ownerId === socket.id) {
          const nextId = room.players.keys().next().value as string;
          room.ownerId = nextId;
        }

        // If game was in progress and only one player remains, end the game
        if (room.status === "playing") {
          const alivePlayers = Array.from(room.players.values()).filter((p) => !p.isGameOver);
          if (alivePlayers.length <= 1) {
            room.status = "finished";
            clearRoomTimers(room);
            const winner = alivePlayers[0] ?? null;
            io.to(roomId).emit("game-over-all", { winnerId: winner?.id ?? null });
            scheduleRoomCleanup(roomId);
            return;
          }
        }

        io.to(roomId).emit("room-update", buildRoomUpdate(room));
      });
    });
  });

  // Global uncaught exception guard – prevent the process from crashing
  process.on("uncaughtException", (err) => {
    console.error("[uncaughtException]", err);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
  });

  // ── Static / Vite ──────────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
