export interface Skin {
  id: string;
  name: string;
  /** Lifetime apples needed to unlock. */
  unlockAt: number;
  bg: string;
  bgEdge: string;
  grid: string;
  wall: string;
  wallEdge: string;
  head: string;
  tail: string;
  glow: string;
  food: string;
  foodGlow: string;
  rival: string;
  rivalHead: string;
  accent: string;
}

export const SKINS: Skin[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    unlockAt: 0,
    bg: '#0b1120',
    bgEdge: '#060a14',
    grid: 'rgba(148,163,184,0.055)',
    wall: '#1e293b',
    wallEdge: '#334155',
    head: '#86efac',
    tail: '#15803d',
    glow: 'rgba(74,222,128,0.55)',
    food: '#f87171',
    foodGlow: 'rgba(248,113,113,0.65)',
    rival: '#7dd3fc',
    rivalHead: '#e0f2fe',
    accent: '#4ade80',
  },
  {
    id: 'neon',
    name: 'Neon',
    unlockAt: 50,
    bg: '#0a0a12',
    bgEdge: '#05050a',
    grid: 'rgba(236,72,153,0.06)',
    wall: '#1f1235',
    wallEdge: '#4c1d95',
    head: '#f0abfc',
    tail: '#7e22ce',
    glow: 'rgba(217,70,239,0.6)',
    food: '#22d3ee',
    foodGlow: 'rgba(34,211,238,0.7)',
    rival: '#fde047',
    rivalHead: '#fefce8',
    accent: '#d946ef',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    unlockAt: 150,
    bg: '#1a1024',
    bgEdge: '#0d0813',
    grid: 'rgba(251,146,60,0.06)',
    wall: '#3b1f2b',
    wallEdge: '#7c2d12',
    head: '#fed7aa',
    tail: '#c2410c',
    glow: 'rgba(251,146,60,0.6)',
    food: '#facc15',
    foodGlow: 'rgba(250,204,21,0.7)',
    rival: '#a78bfa',
    rivalHead: '#ede9fe',
    accent: '#fb923c',
  },
  {
    id: 'frost',
    name: 'Frost',
    unlockAt: 300,
    bg: '#0c1626',
    bgEdge: '#060d18',
    grid: 'rgba(186,230,253,0.07)',
    wall: '#1e2f45',
    wallEdge: '#38536f',
    head: '#e0f2fe',
    tail: '#0369a1',
    glow: 'rgba(56,189,248,0.6)',
    food: '#fb7185',
    foodGlow: 'rgba(251,113,133,0.7)',
    rival: '#4ade80',
    rivalHead: '#dcfce7',
    accent: '#38bdf8',
  },
  {
    id: 'vapor',
    name: 'Vapor',
    unlockAt: 500,
    bg: '#150e1f',
    bgEdge: '#0a0710',
    grid: 'rgba(244,114,182,0.07)',
    wall: '#2b1b3d',
    wallEdge: '#5b21b6',
    head: '#fbcfe8',
    tail: '#9d174d',
    glow: 'rgba(244,114,182,0.6)',
    food: '#67e8f9',
    foodGlow: 'rgba(103,232,249,0.7)',
    rival: '#fdba74',
    rivalHead: '#ffedd5',
    accent: '#f472b6',
  },
  {
    id: 'molten',
    name: 'Molten',
    unlockAt: 800,
    bg: '#160b0b',
    bgEdge: '#0a0505',
    grid: 'rgba(248,113,113,0.07)',
    wall: '#3a1a17',
    wallEdge: '#7f1d1d',
    head: '#fde68a',
    tail: '#b91c1c',
    glow: 'rgba(249,115,22,0.65)',
    food: '#a3e635',
    foodGlow: 'rgba(163,230,53,0.7)',
    rival: '#60a5fa',
    rivalHead: '#dbeafe',
    accent: '#f97316',
  },
];

export const DEFAULT_SKIN = SKINS[0];

export function skinById(id: string): Skin {
  return SKINS.find((s) => s.id === id) ?? DEFAULT_SKIN;
}

export function isUnlocked(skin: Skin, lifetimeApples: number): boolean {
  return lifetimeApples >= skin.unlockAt;
}
