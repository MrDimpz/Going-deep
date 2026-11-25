import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, X } from 'lucide-react';
import { PuzzleData, PuzzleProgress } from '../types';
import { DIFFICULTIES, MINI_GAME_META, TIERS } from '../data/dailyGenerator';
import { buildShareText, formatTime } from '../utils/storage';

interface ResultsModalProps {
  open: boolean;
  puzzle: PuzzleData;
  progress: PuzzleProgress;
  nextDateKey: string | null;
  nextPuzzleNumber: number | null;
  onClose: () => void;
  onPlayNext: (dateKey: string) => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  open,
  puzzle,
  progress,
  nextDateKey,
  nextPuzzleNumber,
  onClose,
  onPlayNext,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const won = progress.status === 'won';
  const diffMeta = DIFFICULTIES[puzzle.difficulty];
  const mistakesUsed = progress.maxMistakes - progress.mistakesRemaining;
  const totalKeys = puzzle.miniGames.length;
  const cleanKeys = puzzle.miniGames.filter(
    (mg) => progress.miniGames[mg.keyId]?.status === 'solved'
  ).length;

  const handleCopy = async () => {
    const text = buildShareText(puzzle, progress);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl bg-[#F6F5F0] dark:bg-[#191815] border border-[#DFDCD2] dark:border-[#2E2C27] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-[#E4E1D6] dark:border-[#2A2925]">
          <div>
            <p className="text-xs font-mono text-[#6B675E] dark:text-[#9A968C]">
              Layers Going Deep #{puzzle.id} · {diffMeta.label} ({diffMeta.keyCount} Keys)
            </p>
            <h2
              id="results-modal-title"
              className="font-display text-2xl font-semibold text-[#171614] dark:text-[#F4F3EE] mt-0.5"
            >
              {won
                ? mistakesUsed === 0
                  ? 'Flawless Clear'
                  : 'All Layers Solved'
                : 'Board Revealed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close results"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5A574F] dark:text-[#A8A49B] hover:bg-[#EAE7DC] dark:hover:bg-[#282722] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-2.5 text-center mb-5">
          <div className="p-3 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27]">
            <div className="font-mono text-xl font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
              {cleanKeys}/{totalKeys}
            </div>
            <div className="text-[11px] text-[#6B675E] dark:text-[#9A968C]">
              Keys Solved
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27]">
            <div className="font-mono text-xl font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
              {mistakesUsed}/{progress.maxMistakes}
            </div>
            <div className="text-[11px] text-[#6B675E] dark:text-[#9A968C]">
              Mistakes
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27]">
            <div className="font-mono text-xl font-semibold tabular-nums text-[#171614] dark:text-[#F4F3EE]">
              {formatTime(progress.elapsedSeconds)}
            </div>
            <div className="text-[11px] text-[#6B675E] dark:text-[#9A968C]">
              Time
            </div>
          </div>
        </div>

        {/* Visual Spoiler-Free Guess Grid */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#21201C] border border-[#E4E1D6] dark:border-[#2E2C27] mb-5">
          <div className="flex items-center justify-between text-xs text-[#6B675E] dark:text-[#9A968C] mb-3">
            <span>Guess Sequence</span>
            <span className="font-mono tabular-nums">
              {progress.guesses.length}{' '}
              {progress.guesses.length === 1 ? 'turn' : 'turns'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            {progress.guesses.map((guess, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                {guess.tiers.map((tierId, tIdx) => (
                  <span
                    key={tIdx}
                    title={TIERS[tierId].name}
                    className={`w-7 h-7 rounded-md ${TIERS[tierId].bgClass}`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#EFECE3] dark:border-[#2C2A26]">
            <div className="text-xs text-[#6B675E] dark:text-[#9A968C] mb-2">
              Unlocked Keys ({cleanKeys}/{totalKeys} solved cleanly)
            </div>
            <div className="flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-[11px]">
              {puzzle.miniGames.map((mg) => (
                <span
                  key={mg.keyId}
                  title={MINI_GAME_META[mg.type].label}
                  className={
                    progress.miniGames[mg.keyId]?.status === 'solved'
                      ? 'text-[#4B7549] dark:text-[#93C490] font-semibold'
                      : 'text-[#8A867C]'
                  }
                >
                  {mg.word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied Results
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Share Results
              </>
            )}
          </button>
          {nextDateKey !== null && nextPuzzleNumber !== null && (
            <button
              type="button"
              onClick={() => onPlayNext(nextDateKey)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D8D4C9] dark:border-[#34322C] bg-white dark:bg-[#21201C] text-sm font-semibold text-[#171614] dark:text-[#F4F3EE] hover:bg-[#EFECE3] dark:hover:bg-[#2A2925] transition-colors whitespace-nowrap cursor-pointer"
            >
              Play #{nextPuzzleNumber}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
