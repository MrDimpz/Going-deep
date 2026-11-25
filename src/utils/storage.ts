import {
  DifficultyLevel,
  GameStats,
  MiniGameProgress,
  PuzzleData,
  PuzzleProgress,
} from '../types';
import {
  DIFFICULTIES,
  getInitialTileOrder,
  getProgressKey,
  TIERS,
} from '../data/dailyGenerator';

const PROGRESS_KEY = 'layers_daily_progress_v2';
const STATS_KEY = 'layers_player_stats_v2';
const PREFS_KEY = 'layers_prefs_v2';

export function createInitialProgress(puzzle: PuzzleData): PuzzleProgress {
  const miniGames: Record<string, MiniGameProgress> = {};
  for (const mg of puzzle.miniGames) {
    miniGames[mg.keyId] = {
      status: 'locked',
      hintsUsed: 0,
      ...(mg.type === 'letterlock' ? { letterLockGuesses: [] } : {}),
    };
  }

  return {
    progressKey: getProgressKey(puzzle.dateKey, puzzle.difficulty),
    puzzleId: puzzle.id,
    dateKey: puzzle.dateKey,
    difficulty: puzzle.difficulty,
    status: 'in_progress',
    mistakesRemaining: puzzle.maxMistakes,
    maxMistakes: puzzle.maxMistakes,
    solvedTiers: [],
    tileOrder: getInitialTileOrder(puzzle),
    guesses: [],
    miniGames,
    elapsedSeconds: 0,
  };
}

export function loadAllProgress(): Record<string, PuzzleProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PuzzleProgress>;
  } catch {
    return {};
  }
}

export function saveAllProgress(map: Record<string, PuzzleProgress>): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function createDefaultStats(): GameStats {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    perfectGames: 0,
    mistakeDistribution: [0, 0, 0, 0, 0],
    miniGamesSolved: {
      letterlock: 0,
      anagram: 0,
      crossword: 0,
      wordsearch: 0,
    },
    winsByDifficulty: {
      standard: 0,
      hard: 0,
      expert: 0,
    },
  };
}

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return createDefaultStats();
    const parsed = JSON.parse(raw) as Partial<GameStats>;
    const defaults = createDefaultStats();
    return {
      ...defaults,
      ...parsed,
      mistakeDistribution:
        parsed.mistakeDistribution && parsed.mistakeDistribution.length === 5
          ? parsed.mistakeDistribution
          : defaults.mistakeDistribution,
      miniGamesSolved: {
        ...defaults.miniGamesSolved,
        ...(parsed.miniGamesSolved ?? {}),
      },
      winsByDifficulty: {
        ...defaults.winsByDifficulty,
        ...(parsed.winsByDifficulty ?? {}),
      },
    };
  } catch {
    return createDefaultStats();
  }
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

export interface UserPrefs {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  difficulty: DifficultyLevel;
}

export function loadPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return { theme: 'light', soundEnabled: true, difficulty: 'standard' };
    }
    const parsed = JSON.parse(raw) as Partial<UserPrefs>;
    const difficulty: DifficultyLevel =
      parsed.difficulty === 'hard' || parsed.difficulty === 'expert'
        ? parsed.difficulty
        : 'standard';
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      soundEnabled: parsed.soundEnabled !== false,
      difficulty,
    };
  } catch {
    return { theme: 'light', soundEnabled: true, difficulty: 'standard' };
  }
}

export function savePrefs(prefs: UserPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function buildShareText(puzzle: PuzzleData, progress: PuzzleProgress): string {
  const diffMeta = DIFFICULTIES[puzzle.difficulty];
  const solvedKeys = puzzle.miniGames.filter(
    (mg) => progress.miniGames[mg.keyId]?.status === 'solved'
  ).length;
  const keyIcons = puzzle.miniGames
    .map((mg) => {
      const st = progress.miniGames[mg.keyId]?.status;
      if (st === 'solved') return '🔑';
      if (st === 'revealed') return '🔓';
      return '🔒';
    })
    .join('');

  const guessLines = progress.guesses.map((g) =>
    g.tiers.map((t) => TIERS[t].emoji).join('')
  );

  const mistakesUsed = progress.maxMistakes - progress.mistakesRemaining;
  const outcomeLine =
    progress.status === 'won'
      ? `Solved · ${mistakesUsed}/${progress.maxMistakes} mistakes · ${formatTime(progress.elapsedSeconds)}`
      : `Out of guesses · ${progress.solvedTiers.length}/4 layers`;

  return [
    `Layers Going Deep #${puzzle.id} (${diffMeta.label} · ${diffMeta.keyCount} Keys)`,
    `Keys (${solvedKeys}/${puzzle.miniGames.length}): ${keyIcons}`,
    ...guessLines,
    outcomeLine,
  ].join('\n');
}
