import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  MINI_GAME_META,
  MINI_GAME_ORDER,
  TIER_ORDER,
  TIERS,
} from '../data/dailyGenerator';

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  open,
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-[#F6F5F0] dark:bg-[#191815] border border-[#DFDCD2] dark:border-[#2E2C27] p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-[#E4E1D6] dark:border-[#2A2925]">
          <div>
            <h2
              id="how-to-play-title"
              className="font-display text-2xl font-semibold text-[#171614] dark:text-[#F4F3EE]"
            >
              How to Play Layers Going Deep
            </h2>
            <p className="text-xs text-[#6B675E] dark:text-[#9A968C] mt-0.5">
              A new daily puzzle generates every day across three difficulty levels.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close instructions"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5A574F] dark:text-[#A8A49B] hover:bg-[#EAE7DC] dark:hover:bg-[#282722] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 text-sm text-[#3F3D37] dark:text-[#CFCBC0]">
          {/* Step 1 */}
          <div>
            <h3 className="font-semibold text-[#171614] dark:text-[#F4F3EE] mb-2">
              1. Solve the Layer Keys
            </h3>
            <p className="leading-relaxed mb-3">
              Locked tiles on the 16-word board hide words behind four mini-game types. Tap any locked tile or key card to solve them in any order:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              {MINI_GAME_ORDER.map((id) => {
                const m = MINI_GAME_META[id];
                return (
                  <li key={id} className="flex items-baseline gap-2">
                    <span className="font-semibold text-[#171614] dark:text-[#F4F3EE] whitespace-nowrap">
                      {m.label}:
                    </span>
                    <span className="text-[#5A574F] dark:text-[#A8A49B]">
                      {m.description}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Step 2: Difficulty Scaling */}
          <div className="pt-4 border-t border-[#E4E1D6] dark:border-[#2A2925]">
            <h3 className="font-semibold text-[#171614] dark:text-[#F4F3EE] mb-2.5">
              2. Choose Your Difficulty
            </h3>
            <div className="space-y-2">
              {DIFFICULTY_ORDER.map((level) => {
                const cfg = DIFFICULTIES[level];
                return (
                  <div
                    key={level}
                    className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27] flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-semibold text-[#171614] dark:text-[#F4F3EE]">
                      {cfg.label} ({cfg.keyCount} Keys)
                    </span>
                    <span className="font-mono text-[#5A574F] dark:text-[#A8A49B]">
                      {cfg.summary}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[#6B675E] dark:text-[#9A968C]">
              Higher difficulties also introduce trickier clues, reverse-diagonal word searches, and strict clue reuse in LetterLock.
            </p>
          </div>

          {/* Step 3: Difficulty Tiers */}
          <div className="pt-4 border-t border-[#E4E1D6] dark:border-[#2A2925]">
            <h3 className="font-semibold text-[#171614] dark:text-[#F4F3EE] mb-3">
              3. Sort the 16-Word Board
            </h3>
            <div className="space-y-2">
              {TIER_ORDER.map((tierId) => {
                const t = TIERS[tierId];
                return (
                  <div
                    key={tierId}
                    className={`px-3.5 py-2 rounded-lg border flex items-center justify-between text-xs font-semibold ${t.bgClass} ${t.borderClass} ${t.textClass}`}
                  >
                    <span>
                      {t.rank}. {t.name}
                    </span>
                    <span className="opacity-85">{t.difficulty}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E4E1D6] dark:border-[#2A2925] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Start Playing
          </button>
        </div>
      </div>
    </div>
  );
};
