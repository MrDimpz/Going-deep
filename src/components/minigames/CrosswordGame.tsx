import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { CrosswordData, MiniGameStatus } from '../../types';
import { SiblingKeyItem } from './LetterLockGame';
import { sound } from '../../utils/sound';

interface CrosswordGameProps {
  data: CrosswordData;
  status: MiniGameStatus;
  siblings: SiblingKeyItem[];
  activeKeyId: string;
  onSelectKey: (keyId: string) => void;
  onComplete: (mode: 'solved' | 'revealed', hintsUsed: number) => void;
  onBack: () => void;
}

export const CrosswordGame: React.FC<CrosswordGameProps> = ({
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

  const layout = useMemo(() => {
    const maxLeft = Math.max(...data.rows.map((r) => r.intersectIndex));
    const maxRight = Math.max(
      ...data.rows.map((r) => r.answer.length - 1 - r.intersectIndex)
    );
    const totalCols = maxLeft + 1 + maxRight;
    return { targetCol: maxLeft, totalCols };
  }, [data.rows]);

  const [entries, setEntries] = useState<string[][]>(() =>
    data.rows.map((r) =>
      isDone ? r.answer.toUpperCase().split('') : Array(r.answer.length).fill('')
    )
  );
  const [activeRow, setActiveRow] = useState(0);
  const [activeCharIdx, setActiveCharIdx] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [checkedWrongCells, setCheckedWrongCells] = useState<Set<string>>(
    () => new Set()
  );

  const solvedRowFlags = useMemo(
    () =>
      data.rows.map(
        (r, idx) => entries[idx].join('') === r.answer.toUpperCase()
      ),
    [data.rows, entries]
  );

  const nextLockedSibling = siblings.find(
    (s) => s.keyId !== activeKeyId && s.status === 'locked'
  );

  const checkCompletion = useCallback(
    (nextEntries: string[][], currentHints: number) => {
      const verticalWord = data.rows
        .map((r, rIdx) => nextEntries[rIdx][r.intersectIndex] ?? '')
        .join('');
      if (verticalWord === target) {
        sound.unlock();
        onComplete('solved', currentHints);
        return true;
      }
      return false;
    },
    [data.rows, onComplete, target]
  );

  const handleInputLetter = useCallback(
    (letter: string) => {
      if (isDone) return;
      const rowDef = data.rows[activeRow];
      const nextEntries = entries.map((r) => [...r]);
      nextEntries[activeRow][activeCharIdx] = letter;

      setCheckedWrongCells((prev) => {
        const next = new Set(prev);
        next.delete(`${activeRow}-${activeCharIdx}`);
        return next;
      });
      setEntries(nextEntries);

      const rowJustSolved =
        nextEntries[activeRow].join('') === rowDef.answer.toUpperCase();
      const finishedAll = checkCompletion(nextEntries, hintsUsed);

      if (!finishedAll) {
        if (rowJustSolved) {
          sound.groupSolved();
          const nextRow = data.rows.findIndex(
            (r, idx) =>
              idx > activeRow &&
              nextEntries[idx].join('') !== r.answer.toUpperCase()
          );
          if (nextRow !== -1) {
            setActiveRow(nextRow);
            setActiveCharIdx(0);
          }
        } else {
          sound.tap();
          if (activeCharIdx < rowDef.answer.length - 1) {
            setActiveCharIdx(activeCharIdx + 1);
          }
        }
      }
    },
    [activeCharIdx, activeRow, checkCompletion, data.rows, entries, hintsUsed, isDone]
  );

  const handleBackspace = useCallback(() => {
    if (isDone) return;
    const nextEntries = entries.map((r) => [...r]);
    if (nextEntries[activeRow][activeCharIdx]) {
      nextEntries[activeRow][activeCharIdx] = '';
      setEntries(nextEntries);
      sound.deselect();
    } else if (activeCharIdx > 0) {
      nextEntries[activeRow][activeCharIdx - 1] = '';
      setEntries(nextEntries);
      setActiveCharIdx(activeCharIdx - 1);
      sound.deselect();
    }
  }, [activeCharIdx, activeRow, entries, isDone]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        onBack();
        return;
      }
      if (isDone) return;

      const rowLen = data.rows[activeRow].answer.length;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveCharIdx((i) => Math.min(rowLen - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveCharIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const nextRow = (activeRow + 1) % data.rows.length;
        setActiveRow(nextRow);
        setActiveCharIdx(0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevRow = (activeRow - 1 + data.rows.length) % data.rows.length;
        setActiveRow(prevRow);
        setActiveCharIdx(0);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleInputLetter(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeRow, data.rows, handleBackspace, handleInputLetter, isDone, onBack]);

  const handleCheckRow = () => {
    if (isDone) return;
    const wrong = new Set<string>();
    data.rows.forEach((r, rIdx) => {
      const answer = r.answer.toUpperCase();
      entries[rIdx].forEach((ch, cIdx) => {
        if (ch && ch !== answer[cIdx]) {
          wrong.add(`${rIdx}-${cIdx}`);
        }
      });
    });
    setCheckedWrongCells(wrong);
    if (wrong.size > 0) {
      sound.error();
    } else {
      sound.tap();
    }
  };

  const handleRevealCell = () => {
    if (isDone) return;
    const nextEntries = entries.map((r) => [...r]);
    const rowDef = data.rows[activeRow];
    let targetR = activeRow;
    let targetC = activeCharIdx;

    if (nextEntries[targetR][targetC] === rowDef.answer[targetC].toUpperCase()) {
      const interRow = data.rows.findIndex(
        (r, idx) =>
          nextEntries[idx][r.intersectIndex] !==
          r.answer[r.intersectIndex].toUpperCase()
      );
      if (interRow !== -1) {
        targetR = interRow;
        targetC = data.rows[interRow].intersectIndex;
      }
    }

    nextEntries[targetR][targetC] = data.rows[targetR].answer[targetC].toUpperCase();
    const nextHints = hintsUsed + 1;
    setHintsUsed(nextHints);
    setEntries(nextEntries);
    setActiveRow(targetR);
    setActiveCharIdx(targetC);
    setCheckedWrongCells((prev) => {
      const next = new Set(prev);
      next.delete(`${targetR}-${targetC}`);
      return next;
    });

    if (!checkCompletion(nextEntries, nextHints)) {
      sound.tap();
    }
  };

  const handleRevealAll = () => {
    if (isDone) return;
    setEntries(data.rows.map((r) => r.answer.toUpperCase().split('')));
    sound.unlock();
    onComplete('revealed', hintsUsed + 1);
  };

  const cellDim =
    layout.totalCols >= 10
      ? 'w-8 h-8 sm:w-9 sm:h-9 text-sm'
      : layout.totalCols >= 8
      ? 'w-9 h-9 sm:w-10 sm:h-10 text-base'
      : 'w-10 h-10 sm:w-11 sm:h-11 text-lg';

  return (
    <div className="w-full max-w-3xl mx-auto">
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
            Crossword
          </h2>
          <p className="text-xs text-[#6B675E] dark:text-[#9A968C]">
            Solve the across clues to spell the highlighted vertical key word
          </p>
        </div>
      </div>

      {/* Sibling Switcher */}
      {siblings.length > 1 && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-[#6B675E] dark:text-[#9A968C]">
            Select Crossword key
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

      {/* Completed Banner */}
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#6B675E] dark:text-[#9A968C]">
            <span className="font-semibold text-[#171614] dark:text-[#F4F3EE]">
              Vertical key clue:
            </span>{' '}
            {data.clue} ({target.length})
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCheckRow}
              className="text-xs font-medium text-[#5A574F] dark:text-[#A8A49B] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              Check Letters
            </button>
            <button
              type="button"
              onClick={handleRevealCell}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A574F] dark:text-[#A8A49B] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Reveal Letter
            </button>
            <button
              type="button"
              onClick={handleRevealAll}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A6B4F] dark:text-[#C5B084] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Reveal Word
            </button>
          </div>
        </div>
      )}

      {/* Split Layout: Intersecting Grid + Clue List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white dark:bg-[#1C1B18] border border-[#E4E1D6] dark:border-[#2C2A26] rounded-2xl p-4 sm:p-6 overflow-x-auto">
          <div className="inline-flex flex-col gap-1.5 mx-auto min-w-max">
            {data.rows.map((rowDef, rIdx) => {
              const startCol = layout.targetCol - rowDef.intersectIndex;
              const isRowSolved = solvedRowFlags[rIdx];

              return (
                <div key={rIdx} className="flex items-center gap-1">
                  <span className="w-4 text-right font-mono text-xs font-medium text-[#8C887E] select-none mr-1">
                    {rIdx + 1}
                  </span>
                  {Array.from({ length: layout.totalCols }).map((_, cIdx) => {
                    const charIdx = cIdx - startCol;
                    const isValid =
                      charIdx >= 0 && charIdx < rowDef.answer.length;

                    if (!isValid) {
                      return (
                        <div
                          key={cIdx}
                          className={`${cellDim} shrink-0`}
                          aria-hidden="true"
                        />
                      );
                    }

                    const isIntersection = cIdx === layout.targetCol;
                    const isFocused =
                      !isDone && activeRow === rIdx && activeCharIdx === charIdx;
                    const isRowActive = !isDone && activeRow === rIdx;
                    const isWrong = checkedWrongCells.has(`${rIdx}-${charIdx}`);
                    const value = entries[rIdx][charIdx];

                    return (
                      <button
                        key={cIdx}
                        type="button"
                        disabled={isDone}
                        onClick={() => {
                          setActiveRow(rIdx);
                          setActiveCharIdx(charIdx);
                        }}
                        aria-label={`Row ${rIdx + 1}, letter ${charIdx + 1}${
                          isIntersection ? ', target key column' : ''
                        }`}
                        className={`relative rounded-lg border-2 font-mono font-semibold flex items-center justify-center transition-colors shrink-0 cursor-pointer ${cellDim} ${
                          isDone && isIntersection
                            ? 'bg-[#5B8759] border-[#4B7549] text-white'
                            : isFocused
                            ? 'bg-[#171614] dark:bg-[#F4F3EE] border-[#171614] dark:border-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614]'
                            : isIntersection
                            ? 'bg-[#FCF3D4] dark:bg-[#3A3015] border-[#E0B338] dark:border-[#C2931B] text-[#171614] dark:text-[#FCE8A8]'
                            : isRowSolved
                            ? 'bg-[#EEF4ED] dark:bg-[#1E2B1E] border-[#B6D1B4] dark:border-[#395538] text-[#1D351C] dark:text-[#C4E6C2]'
                            : isRowActive
                            ? 'bg-[#F3F1EA] dark:bg-[#252420] border-[#BDB8AC] dark:border-[#4A4740] text-[#171614] dark:text-[#F4F3EE]'
                            : 'bg-[#FAF9F5] dark:bg-[#171614] border-[#DFDCD2] dark:border-[#2F2D28] text-[#171614] dark:text-[#F4F3EE]'
                        } ${
                          isWrong
                            ? 'ring-2 ring-[#C74336] text-[#B43C2E] dark:text-[#F28478]'
                            : ''
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-xs text-[#7D796F] dark:text-[#8E8A80]">
            Click any cell and type · Highlighted amber column spells the hidden board word
          </p>

          {/* Compact Touch Keyboard for Mobile / Tablet */}
          {!isDone && (
            <div className="mt-4 pt-4 border-t border-[#EFECE3] dark:border-[#292824] flex flex-col gap-1.5 lg:hidden select-none">
              {[
                ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
              ].map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-1">
                  {row.map((key) =>
                    key === 'BACK' ? (
                      <button
                        key={key}
                        type="button"
                        onClick={handleBackspace}
                        className="h-10 px-3 rounded-md bg-[#E8E5DC] dark:bg-[#2C2B26] text-xs font-semibold text-[#171614] dark:text-[#F4F3EE] cursor-pointer"
                      >
                        Del
                      </button>
                    ) : (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleInputLetter(key)}
                        className="h-10 min-w-[26px] flex-1 max-w-[38px] rounded-md bg-[#F1EFE7] dark:bg-[#262520] border border-[#D8D4C9] dark:border-[#3A3832] font-mono text-xs font-semibold text-[#171614] dark:text-[#F4F3EE] cursor-pointer"
                      >
                        {key}
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clues List */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1C1B18] border border-[#E4E1D6] dark:border-[#2C2A26] rounded-2xl p-5">
          <h3 className="text-xs font-semibold tracking-wide text-[#6B675E] dark:text-[#9A968C] mb-3">
            Across Clues
          </h3>
          <ol className="divide-y divide-[#EFECE3] dark:divide-[#292824]">
            {data.rows.map((rowDef, idx) => {
              const isSelected = !isDone && activeRow === idx;
              const isSolved = solvedRowFlags[idx];
              return (
                <li key={idx}>
                  <button
                    type="button"
                    disabled={isDone}
                    onClick={() => {
                      setActiveRow(idx);
                      const firstEmpty = entries[idx].findIndex((c) => !c);
                      setActiveCharIdx(firstEmpty === -1 ? 0 : firstEmpty);
                    }}
                    className={`w-full text-left py-2.5 px-2.5 -mx-2.5 rounded-lg transition-colors flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F4F1E8] dark:bg-[#272621]'
                        : 'hover:bg-[#FAF9F4] dark:hover:bg-[#22211D]'
                    }`}
                  >
                    <span className="font-mono text-xs font-semibold text-[#7A766C] dark:text-[#9A968C] mt-0.5 w-4 shrink-0">
                      {idx + 1}.
                    </span>
                    <span
                      className={`text-sm leading-snug flex-1 ${
                        isSolved
                          ? 'line-through text-[#8A867C] dark:text-[#736F66]'
                          : 'text-[#171614] dark:text-[#F4F3EE]'
                      }`}
                    >
                      {rowDef.clue}
                    </span>
                    {isSolved && (
                      <Check className="w-4 h-4 text-[#5B8759] shrink-0 mt-0.5" />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
};
