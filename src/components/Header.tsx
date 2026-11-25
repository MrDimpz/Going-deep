import React from 'react';

export type ActiveTab = 'play' | 'archive';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenStats: () => void;
  onOpenHowToPlay: () => void;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenStats,
  onOpenHowToPlay,
  primaryActionLabel,
  onPrimaryAction,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F6F5F0]/95 dark:bg-[#121210]/95 backdrop-blur-sm border-b border-[#E4E1D6] dark:border-[#262521]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('play')}
          className="inline-flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171614] dark:focus-visible:ring-[#F4F3EE] rounded-md"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="3" y="4" width="18" height="3.2" rx="1" fill="#EAB308" />
            <rect x="3" y="8.8" width="18" height="3.2" rx="1" fill="#6F9B6D" />
            <rect x="3" y="13.6" width="18" height="3.2" rx="1" fill="#599BBF" />
            <rect x="3" y="18.4" width="18" height="3.2" rx="1" fill="#4B3963" />
          </svg>
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#171614] dark:text-[#F4F3EE]">
            Layers Going Deep
          </span>
        </button>

        {/* Zone 2: 4 Clean Single-Line Nav Links */}
        <nav
          aria-label="Primary"
          className="flex items-center gap-5 sm:gap-7 text-sm font-medium text-[#5A574F] dark:text-[#A8A49B]"
        >
          <button
            type="button"
            onClick={() => onSelectTab('play')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'play'
                ? 'border-[#171614] dark:border-[#F4F3EE] text-[#171614] dark:text-[#F4F3EE]'
                : 'border-transparent hover:text-[#171614] dark:hover:text-[#F4F3EE]'
            }`}
          >
            Play
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('archive')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'archive'
                ? 'border-[#171614] dark:border-[#F4F3EE] text-[#171614] dark:text-[#F4F3EE]'
                : 'border-transparent hover:text-[#171614] dark:hover:text-[#F4F3EE]'
            }`}
          >
            Archive
          </button>
          <button
            type="button"
            onClick={onOpenStats}
            className="py-1 whitespace-nowrap shrink-0 border-b-2 border-transparent hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors cursor-pointer"
          >
            Stats
          </button>
          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="hidden sm:inline-block py-1 whitespace-nowrap shrink-0 border-b-2 border-transparent hover:text-[#171614] dark:hover:text-[#F4F3EE] transition-colors cursor-pointer"
          >
            How to Play
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="px-4 py-2 rounded-lg bg-[#171614] dark:bg-[#F4F3EE] text-[#F6F5F0] dark:text-[#171614] text-xs font-semibold tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>
    </header>
  );
};
