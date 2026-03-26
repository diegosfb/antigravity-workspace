import { useState, useEffect, useCallback, useRef } from 'react';
import { TETROMINOS, SHAPES, COLS, ROWS, ShapeType } from './constants';

export const useTetris = (
  onGameOver: () => void, 
  onLineClear: (lines: number) => void, 
  attackSpeedMultiplier: number = 0.33,
  baseSpeedMultiplier: number = 1.0
) => {
  const [board, setBoard] = useState<number[][]>(() => 
    Array(ROWS).fill(0).map(() => Array(COLS).fill(0))
  );
  const [activePieceState, setActivePieceState] = useState<{
    pos: { x: number; y: number };
    matrix: number[][];
  } | null>(null);
  
  const activePieceRef = useRef(activePieceState);
  const activePiece = activePieceState;

  const setActivePiece = useCallback((piece: typeof activePieceState | ((prev: typeof activePieceState) => typeof activePieceState)) => {
    if (typeof piece === 'function') {
      const next = piece(activePieceRef.current);
      activePieceRef.current = next;
      setActivePieceState(next);
    } else {
      activePieceRef.current = piece;
      setActivePieceState(piece);
    }
  }, []);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const [specials, setSpecials] = useState<ShapeType[]>([]);
  const [totalLinesState, setTotalLinesState] = useState(0);
  const totalLinesRef = useRef(0);
  const setTotalLines = useCallback((lines: number) => {
    totalLinesRef.current = lines;
    setTotalLinesState(lines);
  }, []);
  
  const [forcedNextPiece, setForcedNextPieceState] = useState<ShapeType | null>(null);
  const [isSpecialActive, setIsSpecialActive] = useState(false);
  const forcedNextPieceRef = useRef<ShapeType | null>(null);
  
  const boardRef = useRef(board);
  boardRef.current = board;

  const setForcedNextPiece = useCallback((type: ShapeType | null) => {
    forcedNextPieceRef.current = type;
    setForcedNextPieceState(type);
  }, []);

  const createPiece = useCallback((forcedType?: ShapeType) => {
    const type = forcedType || SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const matrix = TETROMINOS[type];
    return {
      pos: { x: Math.floor(COLS / 2) - Math.floor(matrix[0].length / 2), y: 0 },
      matrix,
    };
  }, []);

  const collide = useCallback((board: number[][], piece: { pos: { x: number; y: number }; matrix: number[][] }) => {
    const { matrix, pos } = piece;
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < matrix[y].length; ++x) {
        if (matrix[y][x] !== 0) {
          const boardY = y + pos.y;
          const boardX = x + pos.x;
          
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
            return true;
          }
          
          if (boardY >= 0 && board[boardY][boardX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const merge = useCallback((board: number[][], piece: { pos: { x: number; y: number }; matrix: number[][] }) => {
    const newBoard = board.map(row => [...row]);
    piece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = y + piece.pos.y;
          const boardX = x + piece.pos.x;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            newBoard[boardY][boardX] = value;
          }
        }
      });
    });
    return newBoard;
  }, []);

  const rotate = useCallback((matrix: number[][]) => {
    const rotated = matrix[0].map((_, index) =>
      matrix.map(col => col[index]).reverse()
    );
    return rotated;
  }, []);

  const clearLines = useCallback((board: number[][]) => {
    let linesCleared = 0;
    const newBoard = board.filter(row => {
      const isFull = row.every(value => value !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(0));
    }

    if (linesCleared > 0) {
      setScore(prev => prev + (linesCleared * 100));
      
      const prevTotal = totalLinesRef.current;
      const nextTotal = prevTotal + linesCleared;
      
      const oldSpecials = Math.floor(prevTotal / 2);
      const newSpecialsCount = Math.floor(nextTotal / 2);
      
      if (newSpecialsCount > oldSpecials) {
        const piecesToAdd = newSpecialsCount - oldSpecials;
        setSpecials(current => {
          const newPieces = [...current];
          for (let i = 0; i < piecesToAdd && newPieces.length < 2; i++) {
            newPieces.push(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
          }
          return newPieces;
        });
      }
      
      setTotalLines(nextTotal);
      onLineClear(linesCleared);
    }

    return newBoard;
  }, [onLineClear]);

  const drop = useCallback(() => {
    if (isPaused) return;

    const prev = activePieceRef.current;
    if (!prev) return;

    const nextPiece = { ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } };
    
    if (collide(boardRef.current, nextPiece)) {
      const mergedBoard = merge(boardRef.current, prev);
      const clearedBoard = clearLines(mergedBoard);
      setBoard(clearedBoard);
      boardRef.current = clearedBoard; // Update immediately for the next collision check
      
      // Use forced piece if available
      const forcedType = forcedNextPieceRef.current;
      const newPiece = createPiece(forcedType || undefined);
      
      // Update special status
      if (forcedType) {
        forcedNextPieceRef.current = null;
        setForcedNextPieceState(null);
        setIsSpecialActive(true);
      } else {
        setIsSpecialActive(false);
      }

      if (collide(boardRef.current, newPiece)) {
        onGameOver();
        setActivePiece(null);
      } else {
        setActivePiece(newPiece);
      }
    } else {
      setActivePiece(nextPiece);
    }
  }, [collide, merge, clearLines, createPiece, onGameOver, isPaused, setActivePiece]);

  const hardDrop = useCallback(() => {
    if (isPaused) return;
    
    const prev = activePieceRef.current;
    if (!prev) return;

    let currentPos = { ...prev.pos };
    while (!collide(boardRef.current, { ...prev, pos: { ...currentPos, y: currentPos.y + 1 } })) {
      currentPos.y++;
    }
    
    const mergedBoard = merge(boardRef.current, { ...prev, pos: currentPos });
    const clearedBoard = clearLines(mergedBoard);
    setBoard(clearedBoard);
    boardRef.current = clearedBoard; // Update immediately
    
    const forcedType = forcedNextPieceRef.current;
    const newPiece = createPiece(forcedType || undefined);
    
    // Update special status
    if (forcedType) {
      forcedNextPieceRef.current = null;
      setForcedNextPieceState(null);
      setIsSpecialActive(true);
    } else {
      setIsSpecialActive(false);
    }

    if (collide(boardRef.current, newPiece)) {
      onGameOver();
      setActivePiece(null);
    } else {
      setActivePiece(newPiece);
    }
  }, [collide, merge, clearLines, createPiece, onGameOver, isPaused, setActivePiece]);

  const move = useCallback((dir: number) => {
    if (isPaused) return;
    const prev = activePieceRef.current;
    if (!prev) return;

    const nextPiece = { ...prev, pos: { ...prev.pos, x: prev.pos.x + dir } };
    if (!collide(boardRef.current, nextPiece)) {
      setActivePiece(nextPiece);
    }
  }, [collide, isPaused, setActivePiece]);

  const playerRotate = useCallback(() => {
    if (isPaused) return;
    const prev = activePieceRef.current;
    if (!prev) return;

    const rotatedMatrix = rotate(prev.matrix);
    const nextPiece = { ...prev, matrix: rotatedMatrix };
    
    let offset = 1;
    const pos = nextPiece.pos.x;
    while (collide(boardRef.current, nextPiece)) {
      nextPiece.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > nextPiece.matrix[0].length) {
        nextPiece.pos.x = pos;
        return; // Failed to rotate
      }
    }
    setActivePiece(nextPiece);
  }, [collide, rotate, isPaused, setActivePiece]);

  const addGarbage = useCallback((lines: number) => {
    setBoard(prev => {
      const newBoard = prev.slice(lines);
      for (let i = 0; i < lines; i++) {
        const row = Array(COLS).fill(8);
        const hole = Math.floor(Math.random() * COLS);
        row[hole] = 0;
        newBoard.push(row);
      }
      return newBoard;
    });
  }, []);

  const resetGame = useCallback(() => {
    const emptyBoard = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));
    setBoard(emptyBoard);
    boardRef.current = emptyBoard;
    setScore(0);
    setTotalLines(0);
    setActivePiece(createPiece());
    setIsPaused(false);
    setIsSpecialActive(false);
    setSpecials([]);
  }, [createPiece, setActivePiece]);

  useEffect(() => {
    if (!activePiece || isPaused) return;
    // Base speed is 1000ms * baseSpeedMultiplier.
    // attackSpeedMultiplier is the factor applied to the interval for specials.
    const baseInterval = 1000 * baseSpeedMultiplier;
    const speed = isSpecialActive ? (baseInterval * attackSpeedMultiplier) : baseInterval;
    const interval = setInterval(drop, speed);
    return () => clearInterval(interval);
  }, [activePiece, drop, isPaused, isSpecialActive, attackSpeedMultiplier, baseSpeedMultiplier]);

  return {
    board,
    activePiece,
    score,
    specials,
    setSpecials,
    setForcedNextPiece,
    forcedNextPiece,
    isSpecialActive,
    move,
    drop,
    hardDrop,
    playerRotate,
    resetGame,
    addGarbage,
    setIsPaused,
  };
};
