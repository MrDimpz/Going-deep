import React from 'react';
import {
  Check,
  Clock,
  Grid3X3,
  KeyRound,
  Lock,
  Moon,
  RotateCcw,
  Search,
  Shuffle,
  Sun,
  TextCursorInput,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  DifficultyLevel,
  MiniGameType,
  PuzzleData,
  PuzzleProgress,
  TierId,
} from '../types';
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  getMiniGameForWord,
  MINI_GAME_META,
  MINI_GAME_ORDER,
  TIERS,
} from '../data/dailyGenerator';
import { formatTime } from '../utils/storage';

interface FinalBoardProps {
  puzzle: PuzzleData;
  progress: PuzzleProgress;
  difficulty: DifficultyLevel;
  countdownLabel: string;
  isNewDayAvailable: boolean;
  selectedWords: string[];
  shakingWords: string[];
  recentlyUnlockedKeyId: string | null;
  toastMessage: string | null;
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  onSelectDifficulty: (level: DifficultyLevel) => void;
  onLoadNewDaily: () => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onOpenMiniGameKey: (keyId: string) => void;
  onOpenMiniGameType: (type: MiniGameType) => void;
  onToggleWord: (word: string) => void;
  onShuffle: () => void;
  onDeselectAll: () => void;
  onSubmit: () => void;
  onOpenResults: () => void;
  onResetPuzzle: () => void;
}

const MINI_GAME_ICONS: Record<MiniGameType, React.FC<{ className?: string }>> = {
  letterlock: KeyRound,
  anagram: TextCursorInput,
  crossword: Grid3X3,
  wordsearch: Search,
};

function TierRankBars({ rank }: { rank: 1 | 2 | 3 | 4 }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Difficulty level ${rank} of 4`}
    >
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`w-1.5 h-1.5 rounded-[1px] ${
            n <= rank ? 'bg-current opacity-95' : 'bg-current opacity-25'
          }`}
        />
      ))}
    </span>
  );
}

export const FinalBoard: React.FC<FinalBoardProps> = ({
  puzzle,
  progress,
  difficulty,
  countdownLabel,
  isNewDayAvailable,
  selectedWords,
  shakingWords,
  recentlyUnlockedKeyId,
  toastMessage,
  theme,
  soundEnabled,
  onSelectDifficulty,
  onLoadNewDaily,
  onToggleTheme,
  onToggleSound,
  onOpenMiniGameKey,
  onOpenMiniGameType,
  onToggleWord,
  onShuffle,
  onDeselectAll,
  onSubmit,
  onOpenResults,
  onResetPuzzle,
}) => {
  const diffConfig = DIFFICULTIES[difficulty];

  const solvedWordSet = new Set(
    puzzle.categories
      .filter((c) => progress.solvedTiers.includes(c.tier))
      .flatMap((c) => c.words)
  );

  const remainingTiles = progress.tileOrder.filter(
    (word) => !solvedWordSet.has(word)
  );

  const totalKeys = puzzle.miniGames.length;
  const unlockedCount = puzzle.miniGames.filter(
    (mg) => progress.miniGames[mg.keyId]?.status !== 'locked'
  ).length;

  const isFinished = progress.status !== 'in_progress';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Midnight New Daily Rollover Notice */}
      {isNewDayAvailable && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-[#FCF3D4] dark:bg-[#332A12] border border-[#E0B338]/70 dark:border-[#C2931B]/60 flex flex-wrap items-center justify-between gap-3 animate-band-enter">
          <span className="text-xs sm:text-sm font-medium text-[#2A2007] dark:text-[#FCE8A8]">
            A brand-new daily puzzle is ready for today.
          </span>
          <button
            type="button"
            onClick={onLoadNewDaily}
            className="px-3.5 py-1.5 rounded-lg bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
          >
            Load Today’s Puzzle
          </button>
        </div>
      )}

      {/* Puzzle Info & Utility Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 mb-4 border-b border-[#E4E1D6] dark:border-[#2A2925]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#171614] dark:text-[#F4F3EE] text-balance">
            {puzzle.dateLabel}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6B675E] dark:text-[#9A968C]">
            <span>{puzzle.subtitle}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Keys {unlockedCount}/{totalKeys}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {formatTime(progress.elapsedSeconds)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Clock className="w-3 h-3" />
              Next daily {countdownLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Sound on' : 'Sound muted'}
            className="w-9 h-9 rounded-lg border border-[#E0DDD2] dark:border-[#2E2C27] bg-white dark:bg-[#1C1B18] text-[#4A473F] dark:text-[#B8B4AA] hover:text-[#171614] dark:hover:text-[#F4F3EE] flex items-center justify-center transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="w-9 h-9 rounded-lg border border-[#E0DDD2] dark:border-[#2E2C27] bg-white dark:bg-[#1C1B18] text-[#4A473F] dark:text-[#B8B4AA] hover:text-[#171614] dark:hover:text-[#F4F3EE] flex items-center justify-center transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          {isFinished && (
            <button
              type="button"
              onClick={onResetPuzzle}
              aria-label="Replay this puzzle"
              title="Replay puzzle"
              className="w-9 h-9 rounded-lg border border-[#E0DDD2] dark:border-[#2E2C27] bg-white dark:bg-[#1C1B18] text-[#4A473F] dark:text-[#B8B4AA] hover:text-[#171614] dark:hover:text-[#F4F3EE] flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Difficulty Level Selector */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div
          role="group"
          aria-label="Difficulty level"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EAE7DC] dark:bg-[#201F1B] self-start"
        >
          {DIFFICULTY_ORDER.map((level) => {
            const cfg = DIFFICULTIES[level];
            const active = level === difficulty;
            return (
              <button
                key={level}
                type="button"
                onClick={() => onSelectDifficulty(level)}
                aria-pressed={active}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#141311] text-[#171614] dark:text-[#F4F3EE] shadow-xs'
                    : 'text-[#5A574F] dark:text-[#9A968C] hover:text-[#171614] dark:hover:text-[#F4F3EE]'
                }`}
              >
                {cfg.label} · {cfg.keyCount}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#6B675E] dark:text-[#9A968C] font-mono tabular-nums">
          {diffConfig.summary}
        </p>
      </div>

      {/* Step 1: Four Mini-Game Layer Key Buckets (scales cleanly for 4, 8, or 12 keys) */}
      <section aria-label="Layer key mini-games" className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold tracking-wide text-[#5A574F] dark:text-[#A8A49B]">
            Layer Keys — Unlock {totalKeys} Hidden Words
          </h2>
          <span className="text-xs text-[#7A766C] dark:text-[#8E8A80]">
            {unlockedCount === totalKeys
              ? 'All keys unlocked'
              : `${totalKeys - unlockedCount} remaining · Solve in any order`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MINI_GAME_ORDER.map((typeId) => {
            const meta = MINI_GAME_META[typeId];
            const Icon = MINI_GAME_ICONS[typeId];
            const instances = puzzle.miniGames.filter((mg) => mg.type === typeId);
            const unlockedInstances = instances.filter(
              (mg) => progress.miniGames[mg.keyId]?.status !== 'locked'
            );
            const allDone = unlockedInstances.length === instances.length;

            const sublabel =
              instances.length === 1
                ? allDone
                  ? instances[0].word
                  : 'Play to unlock'
                : `${unlockedInstances.length}/${instances.length} unlocked`;

            return (
              <button
                key={typeId}
                type="button"
                onClick={() => onOpenMiniGameType(typeId)}
                className={`group text-left px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center gap-2.5 ${
                  allDone
                    ? 'bg-[#EEF4ED] dark:bg-[#1B261B] border-[#C6DBC4] dark:border-[#2F472F] hover:border-[#9CC099]'
                    : 'bg-white dark:bg-[#1C1B18] border-[#DFDCD2] dark:border-[#2E2C27] hover:border-[#171614] dark:hover:border-[#CFCBC0]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    allDone
                      ? 'bg-[#5B8759] text-white'
                      : 'bg-[#F1EFE7] dark:bg-[#272621] text-[#4A473F] dark:text-[#C5C1B7] group-hover:bg-[#171614] group-hover:text-[#F6F5F0] dark:group-hover:bg-[#F4F3EE] dark:group-hover:text-[#171614]'
                  }`}
                >
                  {allDone ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#171614] dark:text-[#F4F3EE] truncate">
                    {meta.shortLabel}
                  </div>
                  <div
                    className={`text-[11px] truncate font-mono ${
                      allDone
                        ? 'font-semibold text-[#3C5C3B] dark:text-[#9FD19D]'
                        : unlockedInstances.length > 0
                        ? 'font-medium text-[#5B8759] dark:text-[#86B884]'
                        : 'text-[#7A766C] dark:text-[#8E8A80]'
                    }`}
                  >
                    {sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Toast Feedback Area */}
      <div
        aria-live="polite"
        className="h-8 mb-2 flex items-center justify-center"
      >
        {toastMessage ? (
          <div className="px-3.5 py-1 rounded-lg bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-xs font-semibold animate-band-enter">
            {toastMessage}
          </div>
        ) : (
          <p className="text-xs text-[#6B675E] dark:text-[#9A968C]">
            {isFinished
              ? progress.status === 'won'
                ? 'All four connection layers solved.'
                : 'Out of guesses — all four layers revealed.'
              : 'Tap any locked tile to unlock its word, then group all 16 into four sets.'}
          </p>
        )}
      </div>

      {/* Step 2: 16-Word Final Connections Board */}
      <section aria-label="16-word connections board" className="space-y-2.5">
        {/* Solved Category Bands */}
        {progress.solvedTiers.map((tierId: TierId) => {
          const cat = puzzle.categories.find((c) => c.tier === tierId);
          if (!cat) return null;
          const meta = TIERS[tierId];

          return (
            <div
              key={tierId}
              className={`w-full rounded-xl border px-4 py-3.5 text-center animate-band-enter ${meta.bgClass} ${meta.borderClass} ${meta.textClass}`}
            >
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold tracking-wide opacity-80 mb-0.5">
                <TierRankBars rank={meta.rank} />
                <span>{meta.name}</span>
                <span aria-hidden="true">·</span>
                <span>{meta.difficulty}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight">
                {cat.title}
              </h3>
              <p className="mt-1 font-mono text-xs sm:text-sm font-medium tracking-wide opacity-90">
                {cat.words.join('  ·  ')}
              </p>
            </div>
          );
        })}

        {/* Remaining 4-Column Word Grid */}
        {remainingTiles.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            {remainingTiles.map((word) => {
              const mgInstance = getMiniGameForWord(puzzle, word);
              const mgProg = mgInstance
                ? progress.miniGames[mgInstance.keyId]
                : null;
              const isLocked = mgInstance !== null && mgProg?.status === 'locked';
              const isSelected = selectedWords.includes(word);
              const isShaking = shakingWords.includes(word);
              const isFreshUnlock =
                mgInstance !== null &&
                mgInstance.keyId === recentlyUnlockedKeyId;

              if (isLocked && mgInstance) {
                const Icon = MINI_GAME_ICONS[mgInstance.type];
                const meta = MINI_GAME_META[mgInstance.type];
                const showNumber = diffConfig.keysPerType > 1;
                return (
                  <button
                    key={word}
                    type="button"
                    onClick={() => onOpenMiniGameKey(mgInstance.keyId)}
                    className="h-18 sm:h-20 px-1.5 rounded-xl border border-dashed border-[#C7C2B4] dark:border-[#3D3B34] bg-[#ECE9E0]/70 dark:bg-[#1A1916] hover:bg-[#E4E0D4] dark:hover:bg-[#24231E] hover:border-[#171614] dark:hover:border-[#A8A49B] transition-all duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer group"
                  >
                    <div className="flex items-center gap-1 text-[#5A574F] dark:text-[#A8A49B] group-hover:text-[#171614] dark:group-hover:text-[#F4F3EE]">
                      <Lock className="w-3 h-3" />
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-[#3D3A33] dark:text-[#D5D1C7] leading-tight text-center">
                      {meta.shortLabel}
                      {showNumber ? ` #${mgInstance.indexInType + 1}` : ''}
                    </span>
                  </button>
                );
              }

              const longWord = word.length >= 9;

              return (
                <button
                  key={word}
                  type="button"
                  disabled={isFinished}
                  onClick={() => onToggleWord(word)}
                  aria-pressed={isSelected}
                  className={`relative h-18 sm:h-20 px-1.5 sm:px-2 rounded-xl border font-semibold tracking-tight flex items-center justify-center text-center select-none transition-all duration-150 cursor-pointer ${
                    longWord ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'
                  } ${
                    isSelected
                      ? 'bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] border-[#171614] dark:border-[#F4F3EE] -translate-y-0.5'
                      : 'bg-white dark:bg-[#1E1D1A] text-[#171614] dark:text-[#F4F3EE] border-[#DFDCD2] dark:border-[#2F2D28] border-b-[3px] hover:bg-[#FAF9F4] dark:hover:bg-[#262520]'
                  } ${isShaking ? 'animate-tile-shake' : ''} ${
                    isFreshUnlock ? 'animate-tile-pop ring-2 ring-[#5B8759]' : ''
                  }`}
                >
                  <span className="break-words leading-tight">{word}</span>
                  {mgInstance && !isSelected && (
                    <span
                      title={`Unlocked via ${MINI_GAME_META[mgInstance.type].label}`}
                      className="absolute top-1.5 right-1.5 text-[#5B8759] dark:text-[#86B884]"
                      aria-hidden="true"
                    >
                      <KeyRound className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer Controls: Mistakes + Shuffle / Deselect / Submit */}
      <div className="mt-6 pt-5 border-t border-[#E4E1D6] dark:border-[#2A2925] flex flex-col items-center gap-4">
        {!isFinished ? (
          <>
            <div className="flex items-center gap-3 text-sm text-[#4A473F] dark:text-[#B8B4AA]">
              <span>Mistakes remaining</span>
              <div
                className="flex items-center gap-1.5"
                aria-label={`${progress.mistakesRemaining} of ${progress.maxMistakes} mistakes remaining`}
              >
                {Array.from({ length: progress.maxMistakes }).map((_, idx) => {
                  const active = idx < progress.mistakesRemaining;
                  return (
                    <span
                      key={idx}
                      className={`w-3 h-3 rounded-sm transition-all duration-200 ${
                        active
                          ? 'bg-[#171614] dark:bg-[#F4F3EE] scale-100'
                          : 'bg-[#DFDCD2] dark:bg-[#2E2C27] scale-75'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
                {progress.mistakesRemaining}/{progress.maxMistakes}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onShuffle}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D8D4C9] dark:border-[#34322C] bg-white dark:bg-[#1E1D1A] text-sm font-medium text-[#171614] dark:text-[#F4F3EE] hover:bg-[#EFECE3] dark:hover:bg-[#282722] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle
              </button>
              <button
                type="button"
                disabled={selectedWords.length === 0}
                onClick={onDeselectAll}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D8D4C9] dark:border-[#34322C] bg-white dark:bg-[#1E1D1A] text-sm font-medium text-[#171614] dark:text-[#F4F3EE] hover:bg-[#EFECE3] dark:hover:bg-[#282722] disabled:opacity-35 transition-colors whitespace-nowrap cursor-pointer"
              >
                <X className="w-4 h-4" />
                Deselect All
              </button>
              <button
                type="button"
                disabled={selectedWords.length !== 4}
                onClick={onSubmit}
                className="px-6 py-2.5 rounded-xl bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-sm font-semibold disabled:opacity-35 hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
              >
                Submit
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenResults}
              className="px-6 py-2.5 rounded-xl bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
            >
              View Results & Share
            </button>
            <button
              type="button"
              onClick={onResetPuzzle}
              className="px-4 py-2.5 rounded-xl border border-[#D8D4C9] dark:border-[#34322C] bg-white dark:bg-[#1E1D1A] text-sm font-medium text-[#171614] dark:text-[#F4F3EE] hover:bg-[#EFECE3] dark:hover:bg-[#282722] transition-colors whitespace-nowrap cursor-pointer"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
