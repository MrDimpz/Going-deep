import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Delete,
  HelpCircle,
  KeyRound,
  Unlock,
} from 'lucide-react';
import { LetterLockData, MiniGameStatus } from '../../types';
import { sound } from '../../utils/sound';

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export interface SiblingKeyItem {
  keyId: string;
  label: string;
  status: MiniGameStatus;
}

interface LetterLockGameProps {
  data: LetterLockData;
  status: MiniGameStatus;
  initialGuesses: string[];
  siblings: SiblingKeyItem[];
  activeKeyId: string;
  onSelectKey: (keyId: string) => void;
  onUpdateGuesses: (guesses: string[]) => void;
  onComplete: (mode: 'solved' | 'revealed', hintsUsed: number) => void;
  onBack: () => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

function evaluateGuess(guess: string, target: string): LetterState[] {
  const len = target.length;
  const result: LetterState[] = Array(len).fill('absent');
  const remainingCounts: Record<string, number> = {};

  for (let i = 0; i < len; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct';
    } else {
      const ch = target[i];
      remainingCounts[ch] = (remainingCounts[ch] || 0) + 1;
    }
  }

  for (let i = 0; i < len; i++) {
    if (result[i] === 'correct') continue;
    const ch = guess[i];
    if (remainingCounts[ch] && remainingCounts[ch] > 0) {
      result[i] = 'present';
      remainingCounts[ch] -= 1;
    }
  }

  return result;
}

function validateStrictGuess(
  guess: string,
  prevGuesses: string[],
  prevEvals: LetterState[][]
): string | null {
  if (prevGuesses.length === 0) return null;
  const lastGuess = prevGuesses[prevGuesses.length - 1];
  const lastEval = prevEvals[prevEvals.length - 1];

  for (let i = 0; i < lastEval.length; i++) {
    if (lastEval[i] === 'correct' && guess[i] !== lastGuess[i]) {
      return `Strict mode: position ${i + 1} must be "${lastGuess[i]}"`;
    }
  }
  for (let i = 0; i < lastEval.length; i++) {
    if (lastEval[i] === 'present' && !guess.includes(lastGuess[i])) {
      return `Strict mode: guess must include "${lastGuess[i]}"`;
    }
  }
  return null;
}

const STATE_PRIORITY: Record<LetterState, number> = {
  empty: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

export const LetterLockGame: React.FC<LetterLockGameProps> = ({
  data,
  status,
  initialGuesses,
  siblings,
  activeKeyId,
  onSelectKey,
  onUpdateGuesses,
  onComplete,
  onBack,
}) => {
  const target = data.word.toUpperCase();
  const wordLength = target.length;
  const maxAttempts = data.maxAttempts;

  const [guesses, setGuesses] = useState<string[]>(initialGuesses);
  const [currentInput, setCurrentInput] = useState('');
  const [shakeRow, setShakeRow] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showClue, setShowClue] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const isDone = status !== 'locked';

  const evaluatedRows = useMemo(
    () => guesses.map((g) => evaluateGuess(g, target)),
    [guesses, target]
  );

  const keyStates = useMemo(() => {
    const map: Record<string, LetterState> = {};
    guesses.forEach((guess, rowIdx) => {
      const states = evaluatedRows[rowIdx];
      for (let i = 0; i < guess.length; i++) {
        const ch = guess[i];
        const st = states[i];
        if (!map[ch] || STATE_PRIORITY[st] > STATE_PRIORITY[map[ch]]) {
          map[ch] = st;
        }
      }
    });
    return map;
  }, [guesses, evaluatedRows]);

  const nextLockedSibling = siblings.find(
    (s) => s.keyId !== activeKeyId && s.status === 'locked'
  );

  const triggerShake = (msg: string) => {
    setFeedback(msg);
    setShakeRow(true);
    sound.error();
    window.setTimeout(() => setShakeRow(false), 360);
  };

  const handleSubmit = useCallback(() => {
    if (isDone) return;
    if (currentInput.length < wordLength) {
      triggerShake(`Enter a ${wordLength}-letter word`);
      return;
    }

    if (data.strictMode) {
      const violation = validateStrictGuess(currentInput, guesses, evaluatedRows);
      if (violation) {
        triggerShake(violation);
        return;
      }
    }

    const nextGuesses = [...guesses, currentInput];
    setGuesses(nextGuesses);
    onUpdateGuesses(nextGuesses);
    setCurrentInput('');
    setFeedback(null);

    if (currentInput === target) {
      sound.unlock();
      onComplete('solved', hintsUsed);
    } else if (nextGuesses.length >= maxAttempts) {
      sound.error();
      onComplete('revealed', hintsUsed);
    } else {
      sound.tap();
    }
  }, [
    currentInput,
    data.strictMode,
    evaluatedRows,
    guesses,
    hintsUsed,
    isDone,
    maxAttempts,
    onComplete,
    onUpdateGuesses,
    target,
    wordLength,
  ]);

  const handleChar = useCallback(
    (ch: string) => {
      if (isDone) return;
      if (currentInput.length >= wordLength) return;
      sound.tap();
      setCurrentInput((prev) => prev + ch);
      setFeedback(null);
    },
    [currentInput.length, isDone, wordLength]
  );

  const handleBackspace = useCallback(() => {
    if (isDone) return;
    if (currentInput.length === 0) return;
    sound.deselect();
    setCurrentInput((prev) => prev.slice(0, -1));
  }, [currentInput.length, isDone]);

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
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleChar(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBackspace, handleChar, handleSubmit, isDone, onBack]);

  const handleToggleClue = () => {
    if (!showClue) {
      setShowClue(true);
      setHintsUsed((h) => h + 1);
      sound.tap();
    }
  };

  const handleReveal = () => {
    if (isDone) return;
    sound.unlock();
    onComplete('revealed', hintsUsed + 1);
  };

  const tileStyle = (state: LetterState, filled: boolean) => {
    switch (state) {
      case 'correct':
        return 'bg-[#5B8759] border-[#4B7549] text-white';
      case 'present':
        return 'bg-[#D9A726] border-[#C2931B] text-[#171614]';
      case 'absent':
        return 'bg-[#6D6A62] dark:bg-[#3A3833] border-[#5C5952] dark:border-[#3A3833] text-white';
      default:
        return filled
          ? 'bg-white dark:bg-[#24231F] border-[#171614] dark:border-[#D6D3C9] text-[#171614] dark:text-[#F4F3EE]'
          : 'bg-white/60 dark:bg-[#1A1916] border-[#DCD9CE] dark:border-[#2F2D28] text-[#171614] dark:text-[#F4F3EE]';
    }
  };

  const keyStyle = (ch: string) => {
    const st = keyStates[ch];
    if (st === 'correct') return 'bg-[#5B8759] text-white border-[#4B7549]';
    if (st === 'present') return 'bg-[#D9A726] text-[#171614] border-[#C2931B]';
    if (st === 'absent')
      return 'bg-[#CFCBC0] dark:bg-[#2A2925] text-[#6E6B62] dark:text-[#78756C] border-transparent';
    return 'bg-[#E8E5DC] dark:bg-[#2C2B26] text-[#171614] dark:text-[#F4F3EE] border-[#D8D4C9] dark:border-[#3A3832] hover:bg-[#DFDBD0] dark:hover:bg-[#37352F]';
  };

  const cellSizeClass =
    wordLength >= 7
      ? 'w-10 h-10 sm:w-11 sm:h-11 text-lg'
      : wordLength === 6
      ? 'w-11 h-11 sm:w-13 sm:h-13 text-xl'
      : 'w-13 h-13 sm:w-14 sm:h-14 text-2xl';

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
            LetterLock
          </h2>
          <p className="text-xs text-[#6B675E] dark:text-[#9A968C]">
            {wordLength} letters · {maxAttempts} tries
            {data.strictMode ? ' · Strict mode' : ''}
          </p>
        </div>
      </div>

      {/* Sibling Switcher when Hard (2) or Expert (3) */}
      {siblings.length > 1 && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-[#6B675E] dark:text-[#9A968C]">
            Select LetterLock key
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

      {/* Clue or Completed Banner */}
      {isDone ? (
        <div className="mb-6 p-4 rounded-xl bg-[#EEF4ED] dark:bg-[#1E2B1E] border border-[#C6DBC4] dark:border-[#344D34] flex flex-wrap items-center justify-between gap-3 animate-band-enter">
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 min-h-[36px]">
          {showClue ? (
            <p className="text-sm text-[#4A473F] dark:text-[#CFCBC0]">
              <span className="font-semibold text-[#171614] dark:text-[#F4F3EE]">Clue:</span>{' '}
              {data.clue}
            </p>
          ) : (
            <p className="text-xs text-[#6B675E] dark:text-[#9A968C]">
              Moss = right spot · Amber = wrong spot
              {data.strictMode ? ' · Revealed clues required' : ''}
            </p>
          )}
          <div className="flex items-center gap-3 shrink-0">
            {!showClue && (
              <button
                type="button"
                onClick={handleToggleClue}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A574F] dark:text-[#A8A49B] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Show Clue
              </button>
            )}
            <button
              type="button"
              onClick={handleReveal}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A6B4F] dark:text-[#C5B084] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Reveal Word
            </button>
          </div>
        </div>
      )}

      {/* Feedback line */}
      <div className="h-6 mb-2 flex items-center justify-center">
        {feedback && (
          <span className="text-xs font-semibold text-[#B43C2E] dark:text-[#F28478]">
            {feedback}
          </span>
        )}
      </div>

      {/* Dynamic Rows x WordLength Grid */}
      <div className="flex flex-col items-center gap-2 mb-7">
        {Array.from({ length: maxAttempts }).map((_, rowIdx) => {
          const isSubmitted = rowIdx < guesses.length;
          const isCurrent = rowIdx === guesses.length && !isDone;
          const rowWord = isSubmitted
            ? guesses[rowIdx]
            : isCurrent
            ? currentInput
            : '';
          const states = isSubmitted
            ? evaluatedRows[rowIdx]
            : Array<LetterState>(wordLength).fill('empty');

          return (
            <div
              key={rowIdx}
              style={{
                gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))`,
              }}
              className={`grid gap-1.5 sm:gap-2 ${
                isCurrent && shakeRow ? 'animate-tile-shake' : ''
              }`}
            >
              {Array.from({ length: wordLength }).map((__, colIdx) => {
                const ch = rowWord[colIdx] ?? '';
                const st = states[colIdx];
                return (
                  <div
                    key={colIdx}
                    className={`rounded-lg border-2 flex items-center justify-center font-mono font-semibold select-none transition-colors duration-150 ${cellSizeClass} ${tileStyle(
                      st,
                      Boolean(ch)
                    )} ${ch && isCurrent ? 'animate-tile-pop' : ''}`}
                  >
                    {ch}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* On-screen QWERTY Keyboard */}
      <div className="flex flex-col gap-1.5 select-none">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              if (key === 'ENTER') {
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isDone}
                    onClick={handleSubmit}
                    className="h-12 px-2.5 sm:px-4 rounded-lg bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-xs font-semibold tracking-wide disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                  >
                    Enter
                  </button>
                );
              }
              if (key === 'BACK') {
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isDone}
                    onClick={handleBackspace}
                    aria-label="Backspace"
                    className="h-12 px-3 sm:px-4 rounded-lg bg-[#E8E5DC] dark:bg-[#2C2B26] text-[#171614] dark:text-[#F4F3EE] border border-[#D8D4C9] dark:border-[#3A3832] flex items-center justify-center disabled:opacity-40 hover:bg-[#DFDBD0] dark:hover:bg-[#37352F] transition-colors cursor-pointer"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isDone}
                  onClick={() => handleChar(key)}
                  className={`h-12 min-w-[30px] sm:min-w-[40px] flex-1 max-w-[46px] rounded-lg border font-mono text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer ${keyStyle(
                    key
                  )}`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
