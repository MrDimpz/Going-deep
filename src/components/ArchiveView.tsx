import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { DifficultyLevel, PuzzleProgress } from '../types';
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  generateDailyPuzzle,
  getProgressKey,
  TIER_ORDER,
  TIERS,
} from '../data/dailyGenerator';
import { formatTime } from '../utils/storage';

interface ArchiveViewProps {
  dateKeys: string[];
  todayDateKey: string;
  currentDateKey: string;
  difficulty: DifficultyLevel;
  progressMap: Record<string, PuzzleProgress>;
  onSelectDifficulty: (level: DifficultyLevel) => void;
  onSelectDaily: (dateKey: string, difficulty: DifficultyLevel) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  dateKeys,
  todayDateKey,
  currentDateKey,
  difficulty,
  progressMap,
  onSelectDifficulty,
  onSelectDaily,
}) => {
  const diffConfig = DIFFICULTIES[difficulty];

  const solvedCount = dateKeys.filter(
    (dk) => progressMap[getProgressKey(dk, difficulty)]?.status === 'won'
  ).length;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="pb-5 mb-5 border-b border-[#E4E1D6] dark:border-[#2A2925] flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#171614] dark:text-[#F4F3EE]">
            Daily Archive
          </h1>
          <p className="mt-1 text-sm text-[#6B675E] dark:text-[#9A968C]">
            A fresh puzzle is generated every calendar day across all three difficulty levels.
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-[#5A574F] dark:text-[#A8A49B]">
          {solvedCount} / {dateKeys.length} solved ({diffConfig.label})
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Archive difficulty filter"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EAE7DC] dark:bg-[#201F1B]"
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
                {cfg.label} · {cfg.keyCount} Keys
              </button>
            );
          })}
        </div>
        <span className="text-xs font-mono text-[#6B675E] dark:text-[#9A968C]">
          {diffConfig.summary}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {dateKeys.map((dateKey) => {
          const puzzle = generateDailyPuzzle(dateKey, difficulty);
          const pKey = getProgressKey(dateKey, difficulty);
          const prog = progressMap[pKey];
          const status = prog?.status ?? 'unstarted';
          const totalKeys = puzzle.miniGames.length;
          const keysDone = prog
            ? puzzle.miniGames.filter(
                (mg) => prog.miniGames[mg.keyId]?.status !== 'locked'
              ).length
            : 0;
          const solvedTiers = prog?.solvedTiers ?? [];
          const isCurrent = dateKey === currentDateKey;
          const isToday = dateKey === todayDateKey;

          return (
            <button
              key={pKey}
              type="button"
              onClick={() => onSelectDaily(dateKey, difficulty)}
              className={`text-left p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-4 ${
                isCurrent
                  ? 'bg-white dark:bg-[#1F1E1A] border-[#171614] dark:border-[#F4F3EE]'
                  : 'bg-white dark:bg-[#1C1B18] border-[#E4E1D6] dark:border-[#2C2A26] hover:border-[#9A968C] dark:hover:border-[#524F47]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#6B675E] dark:text-[#9A968C]">
                    #{puzzle.id} · {isToday ? 'Today' : puzzle.dateDisplay}
                  </span>
                  <span
                    className={`text-xs font-medium inline-flex items-center gap-1 ${
                      status === 'won'
                        ? 'text-[#4B7549] dark:text-[#93C490]'
                        : status === 'lost'
                        ? 'text-[#B43C2E] dark:text-[#F28478]'
                        : prog && (keysDone > 0 || solvedTiers.length > 0)
                        ? 'text-[#9C7212] dark:text-[#E8C05A]'
                        : 'text-[#7A766C] dark:text-[#8E8A80]'
                    }`}
                  >
                    {status === 'won' && <Check className="w-3.5 h-3.5" />}
                    {status === 'won'
                      ? 'Solved'
                      : status === 'lost'
                      ? 'Completed'
                      : prog && (keysDone > 0 || solvedTiers.length > 0)
                      ? 'In progress'
                      : 'Unplayed'}
                  </span>
                </div>

                <h2 className="font-display text-lg font-semibold text-[#171614] dark:text-[#F4F3EE]">
                  {puzzle.subtitle}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-xs text-[#6B675E] dark:text-[#9A968C] font-mono tabular-nums">
                  <span>
                    Keys {keysDone}/{totalKeys}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Layers {solvedTiers.length}/4</span>
                  {prog && prog.elapsedSeconds > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{formatTime(prog.elapsedSeconds)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F0EDE4] dark:border-[#282722]">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {TIER_ORDER.map((tierId) => {
                    const isSolved = solvedTiers.includes(tierId);
                    return (
                      <span
                        key={tierId}
                        className={`w-6 h-2 rounded-xs transition-opacity ${
                          isSolved
                            ? TIERS[tierId].bgClass
                            : 'bg-[#E5E2D8] dark:bg-[#2E2C27]'
                        }`}
                      />
                    );
                  })}
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#171614] dark:text-[#F4F3EE]">
                  {status === 'won' || status === 'lost'
                    ? 'Review'
                    : isCurrent
                    ? 'Resume'
                    : 'Play'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
