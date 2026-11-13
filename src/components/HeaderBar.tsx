import React from 'react';
import {
  BookOpen,
  FolderPlus,
  LogOut,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GamePhase, PlayMode } from '../types/game';
import { spyAudio } from '../utils/soundEffects';

interface HeaderBarProps {
  phase: GamePhase;
  playMode: PlayMode;
  roundNumber: number;
  roomCode?: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenManual: () => void;
  onOpenCustomDecks: () => void;
  onAbortToSetup: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  phase,
  playMode,
  roundNumber,
  roomCode,
  soundEnabled,
  onToggleSound,
  onOpenManual,
  onOpenCustomDecks,
  onAbortToSetup,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-noir-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Minimalist Brand */}
        <button
          type="button"
          onClick={() => {
            spyAudio.playTick();
            if (phase !== 'setup') onAbortToSetup();
          }}
          className="flex items-center gap-2.5 text-left focus:outline-none"
          title="Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-crimson/40 bg-crimson/10 text-crimson-glow">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold tracking-tight text-white">
              IMPOSTER
            </span>
            {phase !== 'setup' ? (
              <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-tactical">
                #{roundNumber}
              </span>
            ) : (
              <span className="hidden rounded-md border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 sm:inline-block">
                FREE
              </span>
            )}
            {playMode === 'live_room' && roomCode && (
              <span className="rounded-md border border-amber-tactical/40 bg-amber-950/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-tactical">
                {roomCode}
              </span>
            )}
          </div>
        </button>

        {/* Minimal Icon Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              onOpenCustomDecks();
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-800 bg-noir-900 px-2.5 text-xs font-medium text-zinc-200 transition hover:border-amber-tactical/50 hover:text-amber-tactical"
            title="Custom Decks"
          >
            <FolderPlus className="h-4 w-4 text-amber-tactical" />
            <span className="hidden sm:inline">Decks</span>
          </button>

          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              onOpenManual();
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-800 bg-noir-900 px-2.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-600"
            title="Rules & Roles"
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              soundEnabled
                ? 'border-zinc-800 bg-noir-900 text-zinc-300 hover:border-zinc-600'
                : 'border-crimson/40 bg-crimson-dark/20 text-crimson-glow'
            }`}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            aria-label="Toggle Audio"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          {phase !== 'setup' && (
            <button
              type="button"
              onClick={() => {
                spyAudio.playTick();
                onAbortToSetup();
              }}
              className="flex h-9 items-center gap-1 rounded-xl border border-crimson/40 bg-crimson/10 px-2.5 text-xs font-semibold text-crimson-glow transition hover:bg-crimson/20"
              title="Exit to Setup"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
