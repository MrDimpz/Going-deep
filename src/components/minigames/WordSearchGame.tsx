import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { MiniGameStatus, WordSearchData } from '../../types';
import { buildWordSearchGrid } from '../../data/dailyGenerator';
import { SiblingKeyItem } from './LetterLockGame';
import { sound } from '../../utils/sound';

interface WordSearchGameProps {
  seedKey: string;
  data: WordSearchData;
  status: MiniGameStatus;
  siblings: SiblingKeyItem[];
  activeKeyId: string;
  onSelectKey: (keyId: string) => void;
  onComplete: (mode: 'solved' | 'revealed', hintsUsed: number) => void;
  onBack: () => void;
}

type CellCoord = [number, number];

function getLineCells(start: CellCoord, end: CellCoord): CellCoord[] | null {
  const [r1, c1] = start;
  const [r2, c2] = end;
  const dr = r2 - r1;
  const dc = c2 - c1;

  if (dr === 0 && dc === 0) return [start];

  const absR = Math.abs(dr);
  const absC = Math.abs(dc);

  if (dr !== 0 && dc !== 0 && absR !== absC) {
    return null;
  }

  const steps = Math.max(absR, absC);
  const stepR = dr === 0 ? 0 : dr / absR;
  const stepC = dc === 0 ? 0 : dc / absC;

  const cells: CellCoord[] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push([r1 + i * stepR, c1 + i * stepC]);
  }
  return cells;
}

function directionLabel(dr: number, dc: number): string {
  if (dr === 0 && dc > 0) return 'Horizontal (left to right)';
  if (dr === 0 && dc < 0) return 'Horizontal (right to left)';
  if (dr > 0 && dc === 0) return 'Vertical (top to bottom)';
  if (dr < 0 && dc === 0) return 'Vertical (bottom to top)';
  if (dr > 0 && dc > 0) return 'Diagonal (down-right)';
  if (dr > 0 && dc < 0) return 'Diagonal (down-left)';
  if (dr < 0 && dc > 0) return 'Diagonal (up-right)';
  return 'Diagonal (up-left)';
}

export const WordSearchGame: React.FC<WordSearchGameProps> = ({
  seedKey,
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

  const { grid, targetCells } = useMemo(
    () => buildWordSearchGrid(seedKey, data),
    [seedKey, data]
  );

  const [dragStart, setDragStart] = useState<CellCoord | null>(null);
  const [dragCurrent, setDragCurrent] = useState<CellCoord | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tapAnchor, setTapAnchor] = useState<CellCoord | null>(null);
  const [hintTier, setHintTier] = useState<0 | 1 | 2>(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const nextLockedSibling = siblings.find(
    (s) => s.keyId !== activeKeyId && s.status === 'locked'
  );

  const activeSelection = useMemo<CellCoord[]>(() => {
    if (isDone) return targetCells;
    if (dragStart && dragCurrent) {
      return getLineCells(dragStart, dragCurrent) ?? [dragStart];
    }
    if (tapAnchor) return [tapAnchor];
    return [];
  }, [dragCurrent, dragStart, isDone, tapAnchor, targetCells]);

  const activeSet = useMemo(
    () => new Set(activeSelection.map(([r, c]) => `${r}-${c}`)),
    [activeSelection]
  );

  const evaluateCells = (cells: CellCoord[]) => {
    if (cells.length < 2) return;
    const forward = cells.map(([r, c]) => grid[r][c]).join('');
    const backward = forward.split('').reverse().join('');

    if (forward === target || backward === target) {
      sound.unlock();
      setFeedback(null);
      setTapAnchor(null);
      onComplete('solved', hintTier);
    } else {
      sound.error();
      setWrongFlash(true);
      setFeedback(`"${forward}" isn’t the hidden word — try again`);
      window.setTimeout(() => setWrongFlash(false), 360);
    }
  };

  const handlePointerDown = (r: number, c: number) => {
    if (isDone) return;
    setFeedback(null);
    setDragStart([r, c]);
    setDragCurrent([r, c]);
    setIsDragging(true);
    sound.tap();
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (!isDragging || !dragStart || isDone) return;
    const line = getLineCells(dragStart, [r, c]);
    if (line) {
      setDragCurrent([r, c]);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || !dragStart || isDone) return;
    const end = dragCurrent ?? dragStart;
    const cells = getLineCells(dragStart, end);

    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);

    if (cells && cells.length > 1) {
      setTapAnchor(null);
      evaluateCells(cells);
      return;
    }

    if (!tapAnchor) {
      setTapAnchor(end);
    } else if (tapAnchor[0] === end[0] && tapAnchor[1] === end[1]) {
      setTapAnchor(null);
    } else {
      const tapLine = getLineCells(tapAnchor, end);
      if (tapLine && tapLine.length > 1) {
        evaluateCells(tapLine);
        setTapAnchor(null);
      } else {
        setTapAnchor(end);
      }
    }
  };

  const handleHint = () => {
    if (isDone) return;
    if (hintTier < 2) {
      setHintTier((prev) => (prev + 1) as 1 | 2);
      sound.tap();
    }
  };

  const handleReveal = () => {
    if (isDone) return;
    sound.unlock();
    onComplete('revealed', hintTier + 1);
  };

  const previewWord =
    !isDone && activeSelection.length > 0
      ? activeSelection.map(([r, c]) => grid[r][c]).join('')
      : '';

  const cellSizeClass =
    data.gridSize >= 9
      ? 'w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base rounded-lg'
      : data.gridSize === 8
      ? 'w-9 h-9 sm:w-11 sm:h-11 text-base sm:text-lg rounded-lg'
      : 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl rounded-xl';

  return (
    <div
      className="w-full max-w-xl mx-auto"
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        if (isDragging) handlePointerUp();
      }}
    >
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
            Word Search
          </h2>
          <p className="text-xs text-[#6B675E] dark:text-[#9A968C]">
            {data.gridSize}×{data.gridSize} grid · Drag or tap start & end letters
          </p>
        </div>
      </div>

      {/* Sibling Switcher */}
      {siblings.length > 1 && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-[#6B675E] dark:text-[#9A968C]">
            Select Word Search key
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

      {/* Solved Banner or Clue Card */}
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
        <div className="mb-5 p-4 rounded-xl bg-white dark:bg-[#1C1B18] border border-[#E4E1D6] dark:border-[#2C2A26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#6B675E] dark:text-[#9A968C] mb-0.5">
              Hidden word clue · {target.length} letters
            </p>
            <p className="text-sm font-medium text-[#171614] dark:text-[#F4F3EE]">
              {data.clue}
            </p>
            {hintTier >= 2 && (
              <p className="text-xs text-[#6B5A2C] dark:text-[#E8C86A] mt-1">
                Direction: {directionLabel(data.deltaRow, data.deltaCol)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {hintTier < 2 && (
              <button
                type="button"
                onClick={handleHint}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A574F] dark:text-[#A8A49B] hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {hintTier === 0 ? 'Highlight First Letter' : 'Show Direction'}
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

      {/* Selection preview / error feedback */}
      <div className="h-7 mb-2 flex items-center justify-center">
        {previewWord ? (
          <span className="font-mono text-sm font-semibold tracking-widest text-[#171614] dark:text-[#F4F3EE]">
            {previewWord}
          </span>
        ) : feedback ? (
          <span className="text-xs font-semibold text-[#B43C2E] dark:text-[#F28478]">
            {feedback}
          </span>
        ) : (
          <span className="text-xs text-[#7D796F] dark:text-[#8E8A80]">
            {isDone
              ? 'Found inside the grid below'
              : data.denseDecoys
              ? 'Watch for reverse diagonals and decoy letters'
              : 'Trace straight horizontally, vertically, or diagonally'}
          </span>
        )}
      </div>

      {/* Dynamic Grid */}
      <div
        className={`bg-white dark:bg-[#1C1B18] border border-[#E4E1D6] dark:border-[#2C2A26] rounded-2xl p-3 sm:p-5 flex justify-center select-none touch-none ${
          wrongFlash ? 'animate-tile-shake' : ''
        }`}
      >
        <div
          className="grid gap-1 sm:gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${data.gridSize}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, rIdx) =>
            row.map((letter, cIdx) => {
              const key = `${rIdx}-${cIdx}`;
              const isSelected = activeSet.has(key);
              const isHintStart =
                !isDone &&
                hintTier >= 1 &&
                rIdx === data.startRow &&
                cIdx === data.startCol;

              return (
                <button
                  key={key}
                  type="button"
                  onPointerDown={() => handlePointerDown(rIdx, cIdx)}
                  onPointerEnter={() => handlePointerEnter(rIdx, cIdx)}
                  className={`font-mono font-semibold flex items-center justify-center transition-colors duration-100 cursor-pointer ${cellSizeClass} ${
                    isDone && isSelected
                      ? 'bg-[#5B8759] text-white border border-[#4B7549]'
                      : isSelected
                      ? 'bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] scale-[1.04]'
                      : isHintStart
                      ? 'bg-[#FCF3D4] dark:bg-[#3B3014] text-[#171614] dark:text-[#FCE8A8] border-2 border-[#E0B338]'
                      : 'bg-[#F6F5F0] dark:bg-[#24231F] text-[#171614] dark:text-[#F4F3EE] hover:bg-[#EAE7DC] dark:hover:bg-[#302E29]'
                  }`}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
