import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Play, LogIn, Crown, Ghost, Wifi, WifiOff, Zap, Plus, Music, Volume2, VolumeX, Clock, TrendingUp, MapPin } from 'lucide-react';
import { useTetris } from './useTetris';
import Board from './components/Board';
import { GameState, Player, ROWS, COLS, WW2_STAGES } from './constants';

export default function App() {
  const socket = useMemo(() => {
    // In some environments, we need to be explicit about the path
    return io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
  }, []);

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [mode, setMode] = useState<'initial' | 'create' | 'join'>('initial');
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    status: 'waiting',
    attackSpeedMultiplier: 0.33,
    ww2Mode: false,
    levelIntervalMinutes: 5,
    speedIncreasePercent: 25,
    levelLineThreshold: 10,
    currentLevel: 1,
    currentStageIndex: 0,
    baseSpeedMultiplier: 1.0,
    debugMode: true,
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const onGameOver = useCallback(() => {
    setIsGameOver(true);
    socket.emit('game-over', { roomId });
  }, [roomId, socket]);

  const onLineClear = useCallback((lines: number) => {
    socket.emit('lines-cleared', { roomId, lines });
    if (lines >= 2) {
      socket.emit('send-garbage', { roomId, lines: lines - 1 });
    }
  }, [roomId, socket]);

  const {
    board,
    activePiece,
    score,
    move,
    drop,
    hardDrop,
    playerRotate,
    resetGame,
    addGarbage,
    setIsPaused,
    specials,
    setSpecials,
    setForcedNextPiece,
    forcedNextPiece,
    isSpecialActive,
  } = useTetris(onGameOver, onLineClear, gameState.attackSpeedMultiplier, gameState.baseSpeedMultiplier);

  const updateSettings = (settings: Partial<GameState>) => {
    socket.emit('update-settings', { roomId, ...settings });
  };

  const sendSpecial = (targetId: string, type: string, index: number) => {
    socket.emit('send-special', { roomId, targetId, type });
    setSpecials(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('room-update', (data: GameState) => {
      console.log('Room update received:', data);
      setGameState(data);
    });

    socket.on('game-start', () => {
      console.log('Game starting!');
      setIsGameOver(false);
      setWinner(null);
      resetGame();
    });

    socket.on('opponent-update', ({ id, board: oppBoard, score: oppScore }) => {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.id === id ? { ...p, board: oppBoard, score: oppScore } : p
        ),
      }));
    });

    socket.on('receive-garbage', ({ lines }) => {
      addGarbage(lines);
    });

    socket.on('receive-special', ({ type }) => {
      setForcedNextPiece(type);
    });

    socket.on('game-over-all', ({ winnerId }) => {
      setWinner(winnerId);
      setIsPaused(true);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room-update');
      socket.off('game-start');
      socket.off('opponent-update');
      socket.off('receive-garbage');
      socket.off('receive-special');
      socket.off('game-over-all');
    };
  }, [resetGame, addGarbage, setIsPaused, setForcedNextPiece, socket]);

  useEffect(() => {
    if (gameState.status === 'playing' && !isGameOver) {
      // Create display board to send to opponents so they see active pieces
      const display = board.map(row => [...row]);
      if (activePiece) {
        activePiece.matrix.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value !== 0) {
              const boardY = y + activePiece.pos.y;
              const boardX = x + activePiece.pos.x;
              if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                display[boardY][boardX] = value;
              }
            }
          });
        });
      }
      socket.emit('update-board', { roomId, board: display, score });
    }
  }, [board, activePiece, score, roomId, gameState.status, isGameOver, socket]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.status !== 'playing' || isGameOver) return;
      
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowDown') drop();
      if (e.key === 'ArrowUp') playerRotate();
      if (e.key === ' ') {
        hardDrop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, drop, hardDrop, playerRotate, gameState.status, isGameOver]);

  const createRoom = () => {
    if (!playerName) return;
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    socket.emit('join-room', { roomId: newRoomId, playerName });
    setInRoom(true);
  };

  const joinRoom = () => {
    if (!playerName || !roomId) return;
    socket.emit('join-room', { roomId, playerName });
    setInRoom(true);
  };

  const setReady = () => {
    socket.emit('player-ready', { roomId });
  };

  const navigateLevel = (direction: 'prev' | 'next') => {
    socket.emit('navigate-level', { roomId, direction });
  };

  // Audio management
  useEffect(() => {
    if (gameState.ww2Mode && gameState.status === 'playing' && !isGameOver) {
      const stage = WW2_STAGES[gameState.currentStageIndex];
      if (!audioRef.current) {
        audioRef.current = new Audio(stage.audioUrl);
        audioRef.current.loop = true;
      } else if (audioRef.current.src !== stage.audioUrl) {
        audioRef.current.src = stage.audioUrl;
      }
      
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [gameState.ww2Mode, gameState.status, gameState.currentStageIndex, isGameOver, isMuted]);

  const currentStage = WW2_STAGES[gameState.currentStageIndex];

  if (!inRoom) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-orange-500 rounded-2xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic">TETRIS ROYALE</h1>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Server Status</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <span className="text-xs text-green-500 font-bold">CONNECTED</span>
                    <Wifi className="w-4 h-4 text-green-500" />
                  </>
                ) : (
                  <>
                    <span className="text-xs text-red-500 font-bold">DISCONNECTED</span>
                    <WifiOff className="w-4 h-4 text-red-500" />
                  </>
                )}
              </div>
            </div>

            {mode === 'initial' && (
              <div className="space-y-4">
                <button
                  onClick={() => setMode('create')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold p-6 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-lg leading-none">CREATE ROOM</div>
                    <div className="text-[10px] text-orange-200 font-normal mt-1">Start a new match as owner</div>
                  </div>
                </button>
                <button
                  onClick={() => setMode('join')}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold p-6 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 border border-neutral-700"
                >
                  <LogIn className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-lg leading-none">JOIN MATCH</div>
                    <div className="text-[10px] text-neutral-500 font-normal mt-1">Enter a room code to play</div>
                  </div>
                </button>
              </div>
            )}

            {mode === 'create' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Your Name</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-neutral-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                    placeholder="Enter name..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode('initial')}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold p-4 rounded-xl transition-all"
                  >
                    BACK
                  </button>
                  <button
                    onClick={createRoom}
                    disabled={!playerName}
                    className="flex-[2] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    CREATE
                  </button>
                </div>
              </div>
            )}

            {mode === 'join' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Your Name</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-neutral-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                    placeholder="Enter name..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Room ID</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    className="w-full bg-neutral-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 transition-all outline-none font-mono uppercase"
                    placeholder="Enter room code..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode('initial')}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold p-4 rounded-xl transition-all"
                  >
                    BACK
                  </button>
                  <button
                    onClick={joinRoom}
                    disabled={!playerName || !roomId}
                    className="flex-[2] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <LogIn className="w-5 h-5" />
                    JOIN
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const me = gameState.players.find(p => p.id === socket.id);
  const opponents = gameState.players.filter(p => p.id !== socket.id);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 lg:p-8 font-sans relative overflow-hidden">
      {/* WW2 Background */}
      <AnimatePresence mode="wait">
        {gameState.ww2Mode && (
          <motion.div
            key={gameState.currentStageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 z-0 pointer-events-none bg-neutral-950"
            style={{
              backgroundImage: `url(${currentStage.bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(100%) contrast(1.2) brightness(0.5)',
            }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Sidebar - Player Info */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-neutral-900/80 backdrop-blur-md p-6 rounded-3xl border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold uppercase tracking-widest text-sm text-neutral-400">Players</h2>
              </div>
              {gameState.ww2Mode && (
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-orange-500" />}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {gameState.players.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${p.isReady ? 'bg-green-500' : 'bg-neutral-600'}`} />
                    <span className="font-medium">{p.name} {p.id === socket.id && '(You)'}</span>
                  </div>
                  {p.isGameOver && <Ghost className="w-4 h-4 text-neutral-500" />}
                </div>
              ))}
            </div>
            
            {gameState.status === 'waiting' && (
              <button
                onClick={setReady}
                disabled={me?.isReady}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-5 h-5" />
                {me?.isReady ? 'READY!' : 'READY UP'}
              </button>
            )}
          </div>

          {/* Room Settings - Only for Owner */}
          {gameState.status === 'waiting' && gameState.ownerId === socket.id && (
            <div className="bg-neutral-900/80 backdrop-blur-md p-6 rounded-3xl border border-neutral-800 space-y-6">
              <div className="flex items-center gap-2 text-purple-400">
                <Zap className="w-5 h-5" />
                <h2 className="font-bold uppercase tracking-widest text-sm">Room Settings</h2>
              </div>
              
              <div className="space-y-6">
                {/* Attack Speed */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold">Attack Speed</label>
                    <span className="text-[10px] font-mono text-purple-400">
                      +{Math.round((1/gameState.attackSpeedMultiplier - 1) * 100)}% Faster
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1.1" 
                    max="10.0" 
                    step="0.1"
                    value={1 / gameState.attackSpeedMultiplier}
                    onChange={(e) => updateSettings({ attackSpeedMultiplier: 1 / parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between mt-1 text-[8px] text-neutral-600 font-mono uppercase font-bold">
                    <span>Slower</span>
                    <span>Insane</span>
                  </div>
                </div>

                {/* WW2 Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-xl border border-neutral-700">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">WW2 Mode</span>
                  </div>
                  <button
                    onClick={() => updateSettings({ ww2Mode: !gameState.ww2Mode })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${gameState.ww2Mode ? 'bg-orange-500' : 'bg-neutral-600'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${gameState.ww2Mode ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {gameState.ww2Mode && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Level Interval */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <label className="text-[10px] text-neutral-500 uppercase font-bold">Level Change</label>
                        </div>
                        <span className="text-[10px] font-mono text-orange-400">{gameState.levelIntervalMinutes}m</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        value={gameState.levelIntervalMinutes}
                        onChange={(e) => updateSettings({ levelIntervalMinutes: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>

                    {/* Speed Increase */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-neutral-500" />
                          <label className="text-[10px] text-neutral-500 uppercase font-bold">Speed Increase</label>
                        </div>
                        <span className="text-[10px] font-mono text-orange-400">+{gameState.speedIncreasePercent}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        step="5"
                        value={gameState.speedIncreasePercent}
                        onChange={(e) => updateSettings({ speedIncreasePercent: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>

                    {/* Line Threshold */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <Plus className="w-3 h-3 text-neutral-500" />
                          <label className="text-[10px] text-neutral-500 uppercase font-bold">Lines to Level Up</label>
                        </div>
                        <span className="text-[10px] font-mono text-orange-400">{gameState.levelLineThreshold} lines</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        step="5"
                        value={gameState.levelLineThreshold}
                        onChange={(e) => updateSettings({ levelLineThreshold: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState.ww2Mode && gameState.status === 'playing' && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-orange-900/40 backdrop-blur-md p-6 rounded-3xl border border-orange-500/50 mb-6"
            >
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Current Stage</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-2xl font-black italic text-white mb-1">{currentStage.name}</div>
                  <div className="text-xs text-orange-200/70 uppercase font-bold tracking-widest">{currentStage.country}</div>
                </div>
                {gameState.debugMode && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigateLevel('prev')}
                      className="p-2 bg-orange-500/20 hover:bg-orange-500/40 rounded-lg border border-orange-500/50 transition-all active:scale-90"
                    >
                      <span className="font-black text-orange-400">&lt;</span>
                    </button>
                    <button 
                      onClick={() => navigateLevel('next')}
                      className="p-2 bg-orange-500/20 hover:bg-orange-500/40 rounded-lg border border-orange-500/50 transition-all active:scale-90"
                    >
                      <span className="font-black text-orange-400">&gt;</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="text-[10px] text-white/50 mt-2 max-w-[200px] leading-tight italic">{currentStage.description}</div>
              
              <div className="mt-4 pt-4 border-t border-orange-500/20 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-orange-400 font-bold uppercase">Level</span>
                  <span className="text-xl font-black">{gameState.currentLevel}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-orange-400 font-bold uppercase">Speed</span>
                  <span className="text-xl font-black">x{ (1 / gameState.baseSpeedMultiplier).toFixed(2) }</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="bg-neutral-900/80 backdrop-blur-md p-6 rounded-3xl border border-neutral-800">
            <h2 className="font-bold uppercase tracking-widest text-sm text-neutral-400 mb-2">Room Code</h2>
            <div className="text-2xl font-mono font-bold text-orange-500">{roomId}</div>
          </div>

          {isSpecialActive && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-purple-900/60 backdrop-blur-md p-4 rounded-2xl border border-purple-500/50 mb-4"
            >
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Fast Fall!</span>
              </div>
              <p className="text-xs text-purple-200/70">
                Special piece is falling {Math.round((1/gameState.attackSpeedMultiplier - 1) * 100)}% faster!
              </p>
            </motion.div>
          )}

          {forcedNextPiece && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/60 backdrop-blur-md p-4 rounded-2xl border border-red-500/50 mb-4"
            >
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <Ghost className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Incoming Attack!</span>
              </div>
              <p className="text-xs text-red-200/70">Next piece: <span className="font-black text-red-400">{forcedNextPiece}</span></p>
            </motion.div>
          )}

          {specials.length > 0 && (
            <div className="bg-neutral-900/80 backdrop-blur-md p-6 rounded-3xl border border-neutral-800">
              <div className="flex items-center gap-2 mb-4">
                <Ghost className="w-5 h-5 text-purple-500" />
                <h2 className="font-bold uppercase tracking-widest text-sm text-neutral-400">Specials</h2>
              </div>
              <div className="flex gap-3">
                {specials.map((type, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 bg-neutral-800 rounded-xl border border-purple-500/30">
                    <div className="text-2xl font-black text-purple-500">{type}</div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Ready</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 mt-4 uppercase font-bold tracking-tighter">Click an opponent's board to attack!</p>
            </div>
          )}
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative">
            <Board board={board} activePiece={activePiece} />
            
            <AnimatePresence>
              {gameState.status === 'waiting' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-center items-center justify-center rounded-lg z-10"
                >
                  <div className="text-center p-8">
                    <Users className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Waiting for Players</h3>
                    <p className="text-neutral-400">Need at least 2 players to start</p>
                  </div>
                </motion.div>
              )}

              {isGameOver && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-20"
                >
                  <div className="text-center p-8">
                    <Ghost className="w-16 h-16 text-neutral-500 mx-auto mb-4" />
                    <h3 className="text-4xl font-black italic mb-2">GAME OVER</h3>
                    <p className="text-neutral-400">Waiting for other players...</p>
                  </div>
                </motion.div>
              )}

              {winner && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-orange-500/90 backdrop-blur-md flex items-center justify-center rounded-lg z-30"
                >
                  <div className="text-center p-8 text-white">
                    <Crown className="w-20 h-20 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-5xl font-black italic mb-2">VICTORY!</h3>
                    <p className="text-xl font-bold">
                      {gameState.players.find(p => p.id === winner)?.name} wins!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-8 w-full max-w-[300px]">
            <div className="text-center">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Score</div>
              <div className="text-3xl font-black italic">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Lines</div>
              <div className="text-3xl font-black italic">{Math.floor(score / 100)}</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Opponents */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="font-bold uppercase tracking-widest text-sm text-neutral-400">Opponents</h2>
          <div className="grid grid-cols-1 gap-6">
            {opponents.map(opp => (
              <div key={opp.id} className="bg-neutral-900/80 backdrop-blur-md p-4 rounded-3xl border border-neutral-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm truncate max-w-[100px]">{opp.name}</span>
                  <span className="text-xs font-mono text-neutral-500">{opp.score}</span>
                </div>
                <div className="flex justify-center scale-75 origin-top">
                  <Board board={opp.board} isSmall />
                </div>
                {specials.length > 0 && !opp.isGameOver && (
                  <div className="mt-4 flex gap-2 justify-center">
                    {specials.map((type, i) => (
                      <button
                        key={i}
                        onClick={() => sendSpecial(opp.id, type, i)}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold py-1 px-3 rounded-full transition-all active:scale-95"
                      >
                        SEND {type}
                      </button>
                    ))}
                  </div>
                )}
                {opp.isGameOver && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Ghost className="w-8 h-8 text-neutral-400" />
                  </div>
                )}
              </div>
            ))}
            {opponents.length === 0 && (
              <div className="text-neutral-600 italic text-sm text-center py-12 border-2 border-dashed border-neutral-800 rounded-3xl">
                No opponents yet
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
