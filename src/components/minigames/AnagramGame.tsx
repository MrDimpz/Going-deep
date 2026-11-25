import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HelpCircle,
  KeyRound,
  RotateCcw,
  Shuffle,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { AnagramData, MiniGameStatus } from '../../types';
import { SiblingKeyItem } from './LetterLockGame';
import { sound } from '../../utils/sound';

interface AnagramGameProps {
  data: AnagramData;
  status: MiniGameStatus;
  siblings: SiblingKeyItem[];
  activeKeyId: string;
  onSelectKey: (keyId: string) => void;
  onComplete: (mode: 'solved' | 'revealed', hintsUsed: number) => void;
  onBack: () => void;
}

interface LetterTile {
  id: number;
  char: string;
}

export const AnagramGame: React.FC<AnagramGameProps> = ({
  data,
  status,
  siblings,
  activeKeyId,
  onSelectKey,
  onComplete,
  onBack,
}) => {
  const target = data.word.toUpperCase();
  const isDone = status !== 'locked';

  const initialTiles = (): LetterTile[] =>
    data.scrambled
      .toUpperCase()
      .split('')
      .map((char, idx) => ({ id: idx, char }));

  const [bank, setBank] = useState<LetterTile[]>(() =>
    isDone ? [] : initialTiles()
  );
  const [placed, setPlaced] = useState<(LetterTile | null)[]>(() =>
    isDone
      ? target.split('').map((char, id) => ({ id, char }))
      : Array(target.length).fill(null)
  );
  const [lockedIndices, setLockedIndices] = useState<number[]>([]);
  const [shake, setShake] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showClue, setShowClue] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const isFull = placed.every((slot) => slot !== null);

  const nextLockedSibling = siblings.find(
    (s) => s.keyId !== activeKeyId && s.status === 'locked'
  );

  const placeTileFromBank = useCallback(
    (tileId: number) => {
      if (isDone) return;
      const nextEmpty = placed.findIndex((slot) => slot === null);
      if (nextEmpty === -1) return;
      const tile = bank.find((t) => t.id === tileId);
      if (!tile) return;

      sound.tap();
      setFeedback(null);
      setBank((prev) => prev.filter((t) => t.id !== tileId));
      setPlaced((prev) => {
        const next = [...prev];
        next[nextEmpty] = tile;
        return next;
      });
    },
    [bank, isDone, placed]
  );

  const removeSlot = useCallback(
    (slotIdx: number) => {
      if (isDone) return;
      if (lockedIndices.includes(slotIdx)) return;
      const tile = placed[slotIdx];
      if (!tile) return;

      sound.deselect();
      setFeedback(null);
      setPlaced((prev) => {
        const next = [...prev];
        next[slotIdx] = null;
        return next;
      });
      setBank((prev) => [...prev, tile]);
    },
    [isDone, lockedIndices, placed]
  );

  const handleClear = useCallback(() => {
    if (isDone) return;
    const returned: LetterTile[] = [];
    const nextPlaced = placed.map((slot, idx) => {
      if (slot && !lockedIndices.includes(idx)) {
        returned.push(slot);
        return null;
      }
      return slot;
    });
    if (returned.length === 0) return;
    sound.deselect();
    setPlaced(nextPlaced);
    setBank((prev) => [...prev, ...returned]);
    setFeedback(null);
  }, [isDone, lockedIndices, placed]);

  const handleShuffle = useCallback(() => {
    if (isDone) return;
    sound.tap();
    setBank((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }, [isDone]);

  const handleSubmit = useCallback(() => {
    if (isDone) return;
    if (!isFull) {
      setFeedback('Place all letters before submitting');
      setShake(true);
      sound.error();
      window.setTimeout(() => setShake(false), 340);
      return;
    }

    const attempt = placed.map((t) => t?.char ?? '').join('');
    if (attempt === target) {
      sound.unlock();
      setFeedback(null);
      onComplete('solved', hintsUsed);
    } else {
      setFeedback('Not quite — try rearranging the letters');
      setShake(true);
      sound.error();
      window.setTimeout(() => setShake(false), 340);
    }
  }, [hintsUsed, isDone, isFull, onComplete, placed, target]);

  const handleRevealOneLetter = () => {
    if (isDone) return;
    const targetIdx = target.split('').findIndex((ch, idx) => {
      return !lockedIndices.includes(idx) && placed[idx]?.char !== ch;
    });
    if (targetIdx === -1) {
      handleSubmit();
      return;
    }

    const neededChar = target[targetIdx];
    const nextBank = [...bank];
    const nextPlaced = [...placed];

    const existing = nextPlaced[targetIdx];
    if (existing) {
      nextBank.push(existing);
      nextPlaced[targetIdx] = null;
    }

    const bankMatchIdx = nextBank.findIndex((t) => t.char === neededChar);
    if (bankMatchIdx !== -1) {
      const [chosen] = nextBank.splice(bankMatchIdx, 1);
      nextPlaced[targetIdx] = chosen;
    } else {
      const placedMatchIdx = nextPlaced.findIndex(
        (t, idx) =>
          t !== null &&
          t.char === neededChar &&
          !lockedIndices.includes(idx) &&
          idx !== targetIdx
      );
      if (placedMatchIdx !== -1) {
        nextPlaced[targetIdx] = nextPlaced[placedMatchIdx];
        nextPlaced[placedMatchIdx] = null;
      }
    }

    const nextLocked = [...lockedIndices, targetIdx];
    setBank(nextBank);
    setPlaced(nextPlaced);
    setLockedIndices(nextLocked);
    setHintsUsed((h) => h + 1);
    setFeedback(null);
    sound.tap();

    if (nextPlaced.every((t, idx) => t?.char === target[idx])) {
      sound.unlock();
      onComplete('solved', hintsUsed + 1);
    }
  };

  const handleRevealWord = () => {
    if (isDone) return;
    setBank([]);
    setPlaced(target.split('').map((char, id) => ({ id, char })));
    sound.unlock();
    onComplete('revealed', hintsUsed + 1);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        onBack();
        return;
      }
      if (isDone) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        for (let i = placed.length - 1; i >= 0; i--) {
          if (placed[i] !== null && !lockedIndices.includes(i)) {
            removeSlot(i);
            break;
          }
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        handleShuffle();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        const upper = e.key.toUpperCase();
        const match = bank.find((t) => t.char === upper);
        if (match) {
          placeTileFromBank(match.id);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    bank,
    handleShuffle,
    handleSubmit,
    isDone,
    lockedIndices,
    onBack,
    placeTileFromBank,
    placed,
    removeSlot,
  ]);

  const tileSize =
    target.length >= 8
      ? 'w-10 h-12 sm:w-11 sm:h-14 text-lg'
      : 'w-12 h-14 sm:w-14 sm:h-16 text-2xl';

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Sub-header */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-[#E4E1D6] dark:border-[#2A2925]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#5A574F] dark:text-[#A8A49B] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Board
        </button>
        <div className="text-right">
          <h2 className="font-display text-xl font-semibold tracking-tight text-[#171614] dark:text-[#F4F3EE]">
            Anagram
          </h2>
          <p className="text-xs text-[#6B675E] dark:text-[#9A968C]">
            Unscramble all {target.length} letters to reveal the key word
          </p>
        </div>
      </div>

      {/* Sibling Switcher */}
      {siblings.length > 1 && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-[#6B675E] dark:text-[#9A968C]">
            Select Anagram key
          </span>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#EAE7DC] dark:bg-[#22211D]">
            {siblings.map((s) => {
              const isActive = s.keyId === activeKeyId;
              return (
                <button
                  key={s.keyId}
                  type="button"
                  onClick={() => onSelectKey(s.keyId)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-[#141311] text-[#171614] dark:text-[#F4F3EE] shadow-xs'
                      : 'text-[#5A574F] dark:text-[#9A968C] hover:text-[#171614] dark:hover:text-[#F4F3EE]'
                  }`}
                >
                  {s.status !== 'locked' && (
                    <Check className="w-3 h-3 text-[#5B8759]" />
                  )}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Solved Banner or Clue */}
      {isDone ? (
        <div className="mb-7 p-4 rounded-xl bg-[#EEF4ED] dark:bg-[#1E2B1E] border border-[#C6DBC4] dark:border-[#344D34] flex flex-wrap items-center justify-between gap-3 animate-band-enter">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#5B8759] text-white flex items-center justify-center shrink-0">
              {status === 'solved' ? <Check className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-medium text-[#3C5C3B] dark:text-[#A3CFA1]">
                {status === 'solved' ? 'Key word unlocked' : 'Key word revealed'}
              </p>
              <p className="font-mono text-lg font-semibold tracking-widest text-[#171614] dark:text-[#F4F3EE]">
                {target}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {nextLockedSibling && (
              <button
                type="button"
                onClick={() => onSelectKey(nextLockedSibling.keyId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#4B7549]/40 bg-white dark:bg-[#171614] text-[#171614] dark:text-[#F4F3EE] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
              >
                Next {nextLockedSibling.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
            >
              Place on Board
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 min-h-[36px]">
          {showClue ? (
            <p className="text-sm text-[#4A473F] dark:text-[#CFCBC0]">
              <span className="font-semibold text-[#171614] dark:text-[#F4F3EE]">Clue:</span>{' '}
              {data.clue}
            </p>
          ) : (
            <p className="text-xs text-[#6B675E] dark:text-[#9A968C]">
              Tap tiles or type directly on your keyboard
            </p>
          )}
          <div className="flex items-center gap-3 shrink-0">
            {!showClue && (
              <button
                type="button"
                onClick={() => {
                  setShowClue(true);
                  setHintsUsed((h) => h + 1);
                  sound.tap();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A574F] dark:text-[#A8A49B] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Show Clue
              </button>
            )}
            <button
              type="button"
              onClick={handleRevealOneLetter}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A574F] dark:text-[#A8A49B] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Place 1 Letter
            </button>
            <button
              type="button"
              onClick={handleRevealWord}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A6B4F] dark:text-[#C5B084] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Reveal Word
            </button>
          </div>
        </div>
      )}

      {/* Answer Slots */}
      <div className="bg-white dark:bg-[#1C1B18] border border-[#E4E1D6] dark:border-[#2C2A26] rounded-2xl p-6 sm:p-8 mb-6">
        <p className="text-xs font-medium text-[#6B675E] dark:text-[#9A968C] text-center mb-4">
          Your answer
        </p>
        <div
          className={`flex justify-center flex-wrap gap-2 ${
            shake ? 'animate-tile-shake' : ''
          }`}
        >
          {placed.map((slot, idx) => {
            const isLockedHint = lockedIndices.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                disabled={isDone || !slot || isLockedHint}
                onClick={() => removeSlot(idx)}
                className={`rounded-xl font-mono font-semibold flex items-center justify-center transition-all duration-150 ${tileSize} ${
                  isDone
                    ? 'bg-[#5B8759] text-white border-2 border-[#4B7549]'
                    : slot
                    ? isLockedHint
                      ? 'bg-[#F0C64D] dark:bg-[#D9A726] text-[#171614] border-2 border-[#DCAD2E] cursor-default'
                      : 'bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] border-2 border-[#171614] dark:border-[#F4F3EE] hover:opacity-85 cursor-pointer animate-tile-pop'
                    : 'bg-[#F6F5F0] dark:bg-[#141311] border-2 border-dashed border-[#D3CFC3] dark:border-[#34322C] text-transparent cursor-default'
                }`}
              >
                {slot?.char ?? '·'}
              </button>
            );
          })}
        </div>

        <div className="h-6 mt-4 flex items-center justify-center">
          {feedback && (
            <span className="text-xs font-semibold text-[#B43C2E] dark:text-[#F28478]">
              {feedback}
            </span>
          )}
        </div>

        {/* Letter Bank */}
        {!isDone && (
          <div className="mt-4 pt-6 border-t border-[#ECE9DF] dark:border-[#292824]">
            <p className="text-xs font-medium text-[#6B675E] dark:text-[#9A968C] text-center mb-4">
              Available letters
            </p>
            <div className="flex justify-center flex-wrap gap-2 min-h-[60px]">
              {bank.length === 0 ? (
                <span className="text-xs text-[#8A867C] self-center">
                  All tiles placed — press Submit to check
                </span>
              ) : (
                bank.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => placeTileFromBank(tile.id)}
                    className={`rounded-xl bg-[#F6F5F0] dark:bg-[#262520] border border-[#D8D4C9] dark:border-[#3B3932] border-b-[3px] font-mono font-semibold text-[#171614] dark:text-[#F4F3EE] hover:-translate-y-0.5 active:translate-y-0 transition-transform cursor-pointer ${tileSize}`}
                  >
                    {tile.char}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Controls */}
      {!isDone && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleShuffle}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D8D4C9] dark:border-[#34322C] bg-white dark:bg-[#1E1D1A] text-sm font-medium text-[#171614] dark:text-[#F4F3EE] hover:bg-[#EFECE3] dark:hover:bg-[#282722] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D8D4C9] dark:border-[#34322C] bg-white dark:bg-[#1E1D1A] text-sm font-medium text-[#171614] dark:text-[#F4F3EE] hover:bg-[#EFECE3] dark:hover:bg-[#282722] transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
          <button
            type="button"
            disabled={!isFull}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-sm font-semibold disabled:opacity-35 hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
};
