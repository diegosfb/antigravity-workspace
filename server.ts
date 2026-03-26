import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // Game state management
  const rooms = new Map<string, {
    players: Map<string, {
      id: string;
      name: string;
      board: number[][];
      score: number;
      isGameOver: boolean;
      isReady: boolean;
    }>;
    status: 'waiting' | 'playing' | 'finished';
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
    debugMode: boolean;
    backgroundMusicEnabled: boolean;
  }>();

  function levelUp(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    room.currentLevel++;
    room.currentStageIndex = (room.currentStageIndex + 1) % 10; // 10 stages in constants.ts
    room.baseSpeedMultiplier *= (1 - (room.speedIncreasePercent / 100)); // Decrease interval = increase speed

    io.to(roomId).emit("room-update", {
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
    });

    io.to(roomId).emit("level-up", {
      level: room.currentLevel,
      stageIndex: room.currentStageIndex,
      baseSpeedMultiplier: room.baseSpeedMultiplier
    });
  }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", async ({ roomId, playerName }) => {
      const rId = String(roomId);
      console.log(`Player ${playerName} (${socket.id}) joining room ${rId}`);
      
      await socket.join(rId);
      
      if (!rooms.has(rId)) {
        rooms.set(rId, {
          players: new Map(),
          status: 'waiting',
          attackSpeedMultiplier: 0.33, // Default 200% faster (0.33x interval)
          ownerId: socket.id, // Set the first player as owner
          ww2Mode: true,
          levelIntervalMinutes: 5,
          speedIncreasePercent: 25,
          levelLineThreshold: 10,
          currentLevel: 1,
          currentStageIndex: 0,
          baseSpeedMultiplier: 1.0,
          debugMode: true,
          backgroundMusicEnabled: true,
        });
      }

      const room = rooms.get(rId)!;
      room.players.set(socket.id, {
        id: socket.id,
        name: playerName,
        board: Array(20).fill(0).map(() => Array(10).fill(0)),
        score: 0,
        isGameOver: false,
        isReady: false,
      });

      const playersList = Array.from(room.players.values());
      
      io.to(rId).emit("room-update", {
        players: playersList,
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
      });
    });

    socket.on("update-settings", ({ roomId, attackSpeedMultiplier, ww2Mode, levelIntervalMinutes, speedIncreasePercent, levelLineThreshold, backgroundMusicEnabled }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // Only allow the owner to update settings
      if (room.ownerId === socket.id) {
        if (attackSpeedMultiplier !== undefined) room.attackSpeedMultiplier = attackSpeedMultiplier;
        if (ww2Mode !== undefined) room.ww2Mode = ww2Mode;
        if (levelIntervalMinutes !== undefined) room.levelIntervalMinutes = levelIntervalMinutes;
        if (speedIncreasePercent !== undefined) room.speedIncreasePercent = speedIncreasePercent;
        if (levelLineThreshold !== undefined) room.levelLineThreshold = levelLineThreshold;
        if (backgroundMusicEnabled !== undefined) room.backgroundMusicEnabled = backgroundMusicEnabled;

        io.to(roomId).emit("room-update", {
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
        });
      }
    });

    socket.on("player-ready", ({ roomId }) => {
      const rId = String(roomId);
      const room = rooms.get(rId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (player) {
        player.isReady = true;
      }

      const allReady = Array.from(room.players.values()).every(p => p.isReady);
      if (allReady && room.players.size >= 2) {
        room.status = 'playing';
        room.currentLevel = 1;
        room.currentStageIndex = 0;
        room.baseSpeedMultiplier = 1.0;
        room.gameStartTime = Date.now();
        
        // Start level progression timer if ww2Mode is on
        if (room.ww2Mode) {
          if (room.levelTimer) clearInterval(room.levelTimer);
          room.levelTimer = setInterval(() => {
            levelUp(rId);
          }, room.levelIntervalMinutes * 60 * 1000);
        }

        io.to(rId).emit("game-start");
      }

      io.to(rId).emit("room-update", {
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
      });
    });

    socket.on("lines-cleared", ({ roomId, lines }) => {
      const room = rooms.get(roomId);
      if (!room || !room.ww2Mode || room.status !== 'playing') return;

      // Track lines per player or just global?
      // The request says "if a player makes 10 lines".
      // Let's use a simple global counter for the room or per-player?
      // Usually in these games, it's per-player or global.
      // Let's track it per player in the socket session or room state.
      // For simplicity, let's just trigger level up if ANY player clears enough lines.
      // But we need to track how many lines they've cleared since the last level up.
      
      // Actually, let's just use the score or a separate counter.
      // I'll add a lines counter to the room state.
      if (!(room as any).totalLines) (room as any).totalLines = 0;
      (room as any).totalLines += lines;

      if ((room as any).totalLines >= room.levelLineThreshold) {
        (room as any).totalLines = 0;
        levelUp(roomId);
      }
    });

    socket.on("navigate-level", ({ roomId, direction }) => {
      const rId = String(roomId);
      const room = rooms.get(rId);
      console.log(`Navigate level request: room=${rId}, direction=${direction}, found=${!!room}`);
      
      if (!room || !room.debugMode || room.status !== 'playing') {
        console.log(`Navigate level rejected: room=${!!room}, debug=${room?.debugMode}, status=${room?.status}`);
        return;
      }

      if (direction === 'next') {
        room.currentStageIndex = (room.currentStageIndex + 1) % 10;
        room.currentLevel++;
      } else {
        room.currentStageIndex = (room.currentStageIndex - 1 + 10) % 10;
        if (room.currentLevel > 1) {
          room.currentLevel--;
        }
      }

      // Recalculate speed based on current level
      room.baseSpeedMultiplier = Math.pow(1 - (room.speedIncreasePercent / 100), room.currentLevel - 1);
      console.log(`New level: ${room.currentLevel}, speed: ${room.baseSpeedMultiplier}`);

      io.to(rId).emit("room-update", {
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
      });
    });

    socket.on("update-board", ({ roomId, board, score }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (player) {
        player.board = board;
        player.score = score;
        socket.to(roomId).emit("opponent-update", {
          id: socket.id,
          board,
          score,
        });
      }
    });

    socket.on("game-over", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (player) {
        player.isGameOver = true;
      }

      const alivePlayers = Array.from(room.players.values()).filter(p => !p.isGameOver);
      
      if (alivePlayers.length <= 1) {
        room.status = 'finished';
        if (room.levelTimer) clearInterval(room.levelTimer);
        const winner = alivePlayers.length === 1 ? alivePlayers[0] : null;
        io.to(roomId).emit("game-over-all", { winnerId: winner?.id });
      } else {
        io.to(roomId).emit("room-update", {
          players: Array.from(room.players.values()),
          status: room.status,
          attackSpeedMultiplier: room.attackSpeedMultiplier,
          ownerId: room.ownerId,
          ww2Mode: room.ww2Mode,
          levelIntervalMinutes: room.levelIntervalMinutes,
          speedIncreasePercent: room.speedIncreasePercent,
          currentLevel: room.currentLevel,
          currentStageIndex: room.currentStageIndex,
          baseSpeedMultiplier: room.baseSpeedMultiplier,
        });
      }
    });

    socket.on("send-garbage", ({ roomId, lines }) => {
      // Send garbage lines to all other players in the room
      socket.to(roomId).emit("receive-garbage", { lines });
    });

    socket.on("send-special", ({ roomId, targetId, type }) => {
      // Send a forced piece to a specific player
      io.to(targetId).emit("receive-special", { type });
    });

    socket.on("disconnect", () => {
      rooms.forEach((room, roomId) => {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          if (room.players.size === 0) {
            rooms.delete(roomId);
          } else {
            // If the owner disconnected, assign a new owner
            if (room.ownerId === socket.id) {
              const nextPlayer = room.players.keys().next().value;
              if (nextPlayer) {
                room.ownerId = nextPlayer;
              }
            }
            io.to(roomId).emit("room-update", {
              players: Array.from(room.players.values()),
              status: room.status,
              attackSpeedMultiplier: room.attackSpeedMultiplier,
              ownerId: room.ownerId,
            });
          }
        }
      });
    });
  });

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
