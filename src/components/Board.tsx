import React, { useMemo } from 'react';
import { COLORS, BLOCK_SIZE, COLS, ROWS } from '../constants';

interface BoardProps {
  board: number[][];
  activePiece?: {
    pos: { x: number; y: number };
    matrix: number[][];
  } | null;
  isSmall?: boolean;
}

const Board: React.FC<BoardProps> = ({ board, activePiece, isSmall = false }) => {
  const size = isSmall ? 18 : BLOCK_SIZE;
  
  const displayBoard = useMemo(() => {
    const display = Array(ROWS).fill(0).map((_, y) => 
      Array(COLS).fill(0).map((_, x) => board[y]?.[x] ?? 0)
    );
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
    return display;
  }, [board, activePiece]);

  return (
    <div 
      className="grid bg-neutral-900 border-2 border-neutral-700 shadow-2xl overflow-hidden box-content"
      style={{
        width: `${COLS * size}px`,
        height: `${ROWS * size}px`,
        gridTemplateColumns: `repeat(${COLS}, ${size}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${size}px)`,
      }}
    >
      {displayBoard.map((row, y) => 
        row.map((value, x) => (
          <div
            key={`${y}-${x}`}
            className="border-[0.5px] border-neutral-800/20"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: COLORS[value],
              boxShadow: value !== 0 ? 'inset 0 0 8px rgba(0,0,0,0.4)' : 'none',
            }}
          />
        ))
      )}
    </div>
  );
};

export default Board;
