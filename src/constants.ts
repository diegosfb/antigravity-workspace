export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 30;

export const COLORS = [
  'transparent',
  '#FF0D72', // T
  '#0DC2FF', // I
  '#0DFF72', // S
  '#F538FF', // Z
  '#FF8E0D', // L
  '#FFE138', // O
  '#3877FF', // J
  '#888888', // Garbage
];

export const TETROMINOS = {
  'T': [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  'I': [
    [0, 2, 0, 0],
    [0, 2, 0, 0],
    [0, 2, 0, 0],
    [0, 2, 0, 0],
  ],
  'S': [
    [0, 3, 3],
    [3, 3, 0],
    [0, 0, 0],
  ],
  'Z': [
    [4, 4, 0],
    [0, 4, 4],
    [0, 0, 0],
  ],
  'L': [
    [0, 5, 0],
    [0, 5, 0],
    [0, 5, 5],
  ],
  'O': [
    [6, 6],
    [6, 6],
  ],
  'J': [
    [0, 7, 0],
    [0, 7, 0],
    [7, 7, 0],
  ],
};

export const SHAPES = ['T', 'I', 'S', 'Z', 'L', 'O', 'J'] as const;
export type ShapeType = typeof SHAPES[number];

export interface Player {
  id: string;
  name: string;
  board: number[][];
  score: number;
  isGameOver: boolean;
  isReady: boolean;
}

export interface WW2Stage {
  name: string;
  country: string;
  description: string;
  bgUrl: string;
  audioUrl: string;
}

export const WW2_STAGES: WW2Stage[] = [
  { 
    name: 'The Panzer Advance', 
    country: 'Berlin', 
    description: 'High-contrast shot of a Tiger tank moving through urban ruins.',
    bgUrl: '/assets/stages/panzer_advance.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  { 
    name: 'The Spitfire Patrol', 
    country: 'London', 
    description: 'A squadron of planes over the white cliffs, heavy grain filter.',
    bgUrl: '/assets/stages/spitfire_patrol.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  { 
    name: 'The Resistance Cell', 
    country: 'Paris', 
    description: 'Low-light, moody shot of soldiers in a bombed-out basement.',
    bgUrl: '/assets/stages/resistance_cell.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  { 
    name: 'The Winter Siege', 
    country: 'Stalingrad', 
    description: 'Snow-covered ruins with a lone sniper silhouette.',
    bgUrl: '/assets/stages/winter_siege.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  { 
    name: 'The Beachhead', 
    country: 'Normandy', 
    description: 'Landing craft approaching a foggy shore under heavy fire.',
    bgUrl: '/assets/stages/beachhead.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  { 
    name: 'The Urban Ruin', 
    country: 'Warsaw', 
    description: 'A destroyed city street with a single flag hanging from a balcony.',
    bgUrl: '/assets/stages/urban_ruin.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  { 
    name: 'The Naval Convoy', 
    country: 'Atlantic', 
    description: 'Warships in a stormy sea with anti-aircraft fire in the sky.',
    bgUrl: '/assets/stages/naval_convoy.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  { 
    name: 'The Paratrooper Drop', 
    country: 'Europe', 
    description: 'Hundreds of parachutes filling a moonlit sky.',
    bgUrl: '/assets/stages/paratrooper_drop.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  { 
    name: 'The Artillery Battery', 
    country: 'Frontline', 
    description: 'Large cannons firing into the distance at night.',
    bgUrl: '/assets/stages/artillery_battery.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  { 
    name: 'The Victory Parade', 
    country: 'Global', 
    description: 'Soldiers marching through a liberated city square.',
    bgUrl: '/assets/stages/victory_parade.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
];

export interface GameState {
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  winnerId?: string;
  attackSpeedMultiplier: number;
  ownerId?: string;
  ww2Mode: boolean;
  levelIntervalMinutes: number;
  speedIncreasePercent: number;
  currentLevel: number;
  currentStageIndex: number;
  baseSpeedMultiplier: number;
  levelLineThreshold: number;
  debugMode: boolean;
}
