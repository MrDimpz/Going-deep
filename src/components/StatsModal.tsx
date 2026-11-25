import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { GameStats } from '../types';
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  MINI_GAME_META,
  MINI_GAME_ORDER,
} from '../data/dailyGenerator';

interface StatsModalProps {
  open: boolean;
  stats: GameStats;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  open,
  stats,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const winRate =
    stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  const maxDist = Math.max(1, ...stats.mistakeDistribution);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl bg-[#F6F5F0] dark:bg-[#191815] border border-[#DFDCD2] dark:border-[#2E2C27] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-[#E4E1D6] dark:border-[#2A2925]">
          <div>
            <h2
              id="stats-modal-title"
              className="font-display text-2xl font-semibold text-[#171614] dark:text-[#F4F3EE]"
            >
              Statistics
            </h2>
            <p className="text-xs text-[#6B675E] dark:text-[#9A968C] mt-0.5">
              Saved locally in this browser
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close statistics"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5A574F] dark:text-[#A8A49B] hover:bg-[#EAE7DC] dark:hover:bg-[#282722] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-4 gap-3 text-center mb-6">
          <div className="p-3 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27]">
            <div className="font-mono text-2xl font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
              {stats.played}
            </div>
            <div className="text-[11px] text-[#6B675E] dark:text-[#9A968C] mt-0.5">
              Played
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27]">
            <div className="font-mono text-2xl font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
              {winRate}%
            </div>
            <div className="text-[11px] text-[#6B675E] dark:text-[#9A968C] mt-0.5">
              Win Rate
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27]">
            <div className="font-mono text-2xl font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
              {stats.currentStreak}
            </div>
            <div className="text-[11px] text-[#6B675E] dark:text-[#9A968C] mt-0.5">
              Streak
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27]">
            <div className="font-mono text-2xl font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
              {stats.perfectGames}
            </div>
            <div className="text-[11px] text-[#6B675E] dark:text-[#9A968C] mt-0.5">
              Perfect
            </div>
          </div>
        </div>

        {/* Wins by Difficulty */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-[#5A574F] dark:text-[#A8A49B] mb-2.5">
            Boards Solved by Difficulty
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_ORDER.map((level) => {
              const cfg = DIFFICULTIES[level];
              return (
                <div
                  key={level}
                  className="px-3 py-2.5 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27] text-center"
                >
                  <div className="font-mono text-lg font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
                    {stats.winsByDifficulty[level]}
                  </div>
                  <div className="text-[11px] text-[#6B675E] dark:text-[#9A968C]">
                    {cfg.label} ({cfg.keyCount})
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mistake Distribution */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-[#5A574F] dark:text-[#A8A49B] mb-2.5">
            Mistakes on Solved Boards
          </h3>
          <div className="space-y-2">
            {stats.mistakeDistribution.slice(0, 4).map((count, idx) => {
              const pct = Math.max(8, Math.round((count / maxDist) * 100));
              return (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <span className="w-20 font-mono text-[#5A574F] dark:text-[#A8A49B] tabular-nums shrink-0">
                    {idx} {idx === 1 ? 'mistake' : 'mistakes'}
                  </span>
                  <div className="flex-1 h-6 bg-[#E9E6DC] dark:bg-[#252420] rounded-md overflow-hidden">
                    <div
                      className="h-full bg-[#5B8759] dark:bg-[#6A9968] flex items-center justify-end px-2 font-mono text-[11px] font-semibold text-white tabular-nums transition-all duration-300"
                      style={{ width: count > 0 ? `${pct}%` : '28px' }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mini-game Solves */}
        <div className="pt-4 border-t border-[#E4E1D6] dark:border-[#2A2925]">
          <h3 className="text-xs font-semibold text-[#5A574F] dark:text-[#A8A49B] mb-2.5">
            Layer Keys Solved Cleanly
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {MINI_GAME_ORDER.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27] text-xs"
              >
                <span className="text-[#4A473F] dark:text-[#CFCBC0]">
                  {MINI_GAME_META[id].label}
                </span>
                <span className="font-mono font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
                  {stats.miniGamesSolved[id]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
