import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  EyeOff,
  Fingerprint,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { BUILTIN_CATEGORIES } from '../data/categories';
import { ROLE_METADATA } from '../engine/gameEngine';
import { AssignedPlayerRole, Player, PlayMode, RoundState } from '../types/game';
import { spyAudio } from '../utils/soundEffects';
import { DeckIcon } from './DeckIcon';

interface PassAndPlayRevealProps {
  playMode: PlayMode;
  round: RoundState;
  players: Player[];
  localPlayerId: string;
  isHost: boolean;
  onNextPlayerOrPhase: () => void;
}

export const PassAndPlayReveal: React.FC<PassAndPlayRevealProps> = ({
  playMode,
  round,
  players,
  localPlayerId,
  isHost,
  onNextPlayerOrPhase,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasSeenOnce, setHasSeenOnce] = useState(false);

  // Determine which player's dossier is being displayed
  const activePlayer: Player =
    playMode === 'live_room'
      ? players.find((p) => p.id === localPlayerId) || players[0]
      : players[round.revealIndex] || players[0];

  const assignment: AssignedPlayerRole | undefined =
    round.assignments[activePlayer?.id];

  if (!activePlayer || !assignment) return null;

  // Undercover players think they are standard Field Agents until the Debrief!
  const displayedRoleKey =
    assignment.role === 'undercover' ? 'civilian' : assignment.role;
  const roleMeta = ROLE_METADATA[displayedRoleKey];
  const isImposter = assignment.role === 'imposter';

  const handleRevealStart = () => {
    if (!isUnlocked) {
      spyAudio.playScannerReveal();
      setIsUnlocked(true);
      setHasSeenOnce(true);
    }
  };

  const handleHideDossier = () => {
    if (isUnlocked) {
      spyAudio.playTick();
      setIsUnlocked(false);
    }
  };

  const handleToggleDossier = () => {
    if (isUnlocked) {
      handleHideDossier();
    } else {
      handleRevealStart();
    }
  };

  const handleAdvance = () => {
    spyAudio.playStamp();
    setIsUnlocked(false);
    setHasSeenOnce(false);
    onNextPlayerOrPhase();
  };

  const isLastPlayer = round.revealIndex >= players.length - 1;
  const categoryIcon =
    BUILTIN_CATEGORIES.find((c) => c.id === round.categoryId)?.icon || 'Layers';

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-5 sm:py-8">
      {/* Top Progress Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-tactical/40 bg-amber-950/30 text-amber-tactical">
            <DeckIcon name={categoryIcon} className="h-4 w-4" />
          </span>
          <div>
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {playMode === 'pass_and_play'
                ? `Agent ${round.revealIndex + 1} / ${players.length}`
                : 'Your Secret Role'}
            </span>
            <h2 className="font-display text-base font-bold text-white">
              {round.categoryName}
            </h2>
          </div>
        </div>

        {playMode === 'pass_and_play' && (
          <div className="flex gap-1">
            {players.map((p, idx) => (
              <span
                key={p.id}
                className={`h-2 w-3.5 rounded-full transition-all ${
                  idx < round.revealIndex
                    ? 'bg-emerald-500'
                    : idx === round.revealIndex
                    ? 'w-6 bg-crimson'
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Classified Folder Container */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-zinc-700/90 bg-noir-900 shadow-dossier">
        {/* Top Folder Tab */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-noir-950 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-noir-800 text-2xl">
              {activePlayer.avatar}
            </span>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Eyes Only
              </span>
              <h3 className="font-display text-lg font-bold text-white">
                {activePlayer.name}
              </h3>
            </div>
          </div>

          <div className="rubber-stamp text-[10px] font-bold text-crimson-glow">
            CLASSIFIED
          </div>
        </div>

        {/* Folder Interior: Locked vs Declassified */}
        {!isUnlocked ? (
          <div className="flex flex-col items-center px-6 py-8 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-crimson/40 bg-crimson-dark/20 px-3 py-1 font-mono text-[11px] font-bold text-crimson-glow">
              <Lock className="h-3.5 w-3.5" />
              Privacy Shield Active
            </div>

            <p className="max-w-xs text-sm text-zinc-300">
              {playMode === 'pass_and_play' ? (
                <>
                  Pass to <strong className="text-white">{activePlayer.name}</strong> and make sure nobody else is peeking.
                </>
              ) : (
                <>Shield your screen, then scan below to reveal your word.</>
              )}
            </p>

            {/* Compact Redacted Strip */}
            <div className="my-5 w-full max-w-xs space-y-2 rounded-2xl border border-zinc-800 bg-noir-950/80 p-3.5">
              <div className="redacted-bar h-6 w-full rounded-lg border border-zinc-800" />
              <div className="redacted-bar h-9 w-full rounded-lg border border-zinc-800" />
            </div>

            {/* Biometric Scanner Button */}
            <button
              type="button"
              onMouseDown={handleRevealStart}
              onTouchStart={(e) => {
                e.preventDefault();
                handleRevealStart();
              }}
              onClick={handleToggleDossier}
              className="group relative flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-crimson bg-crimson/15 text-crimson-glow shadow-crimson-glow transition active:scale-95"
              aria-label="Reveal Classified Dossier"
            >
              <div className="scanner-laser" />
              <Fingerprint className="h-12 w-12 transition-transform group-hover:scale-110" />
              <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                Tap to Scan
              </span>
            </button>
          </div>
        ) : (
          /* DECLASSIFIED DOSSIER VIEW */
          <div className="animate-card-in p-5 sm:p-6">
            <div
              className={`rounded-2xl border-2 p-5 transition-all ${
                isImposter
                  ? 'border-crimson bg-gradient-to-b from-crimson-dark/35 to-noir-950'
                  : 'manila-surface border-dossier-dark'
              }`}
            >
              {/* Role Clearance Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-current/15 pb-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider ${
                    isImposter
                      ? 'border-crimson bg-crimson text-white shadow-crimson-glow'
                      : 'border-noir-900 bg-noir-950 text-emerald-400'
                  }`}
                >
                  {isImposter ? (
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{roleMeta.title}</span>
                </span>

                <span
                  className={`font-mono text-[10px] font-bold uppercase ${
                    isImposter ? 'text-amber-tactical' : 'text-zinc-700'
                  }`}
                >
                  {round.categoryName}
                </span>
              </div>

              {/* Secret Word or Imposter Alert */}
              <div className="my-5 text-center">
                <span
                  className={`block font-mono text-xs font-bold uppercase tracking-widest ${
                    isImposter ? 'text-crimson-glow' : 'text-noir-900/80'
                  }`}
                >
                  {isImposter
                    ? 'TARGET WORD UNKNOWN // BLUFF TO SURVIVE'
                    : 'SECRET MISSION TARGET WORD'}
                </span>

                {isImposter ? (
                  <div className="mt-2 rounded-xl border border-crimson/60 bg-noir-950/90 py-4 px-3">
                    <div className="font-display text-2xl font-extrabold uppercase tracking-wider text-crimson-glow sm:text-3xl">
                      YOU ARE THE IMPOSTER
                    </div>
                    {assignment.hintText ? (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-tactical/50 bg-amber-950/50 px-3 py-1.5 font-mono text-xs font-bold text-amber-tactical">
                        <Sparkles className="h-4 w-4 shrink-0" />
                        <span>INTEL CLUE: {assignment.hintText}</span>
                      </div>
                    ) : (
                      <div className="mt-2 font-mono text-xs text-zinc-400">
                        Hardcore Mode: No Clue Word (Use Category "{round.categoryName}" to blend in!)
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border-2 border-noir-900 bg-noir-950 py-5 px-4 text-white shadow-inner">
                    <div className="font-display text-2xl font-extrabold tracking-tight text-amber-tactical sm:text-3xl">
                      {assignment.secretWord}
                    </div>
                    {assignment.hintText && (
                      <div className="mt-2 font-mono text-xs text-emerald-400">
                        {assignment.hintText}
                      </div>
                    )}
                  </div>
                )}

                {/* Co-Imposter or Accomplice Intel */}
                {assignment.knownImposterNames &&
                  assignment.knownImposterNames.length > 0 && (
                    <div className="mt-3 rounded-lg border border-crimson/50 bg-crimson-dark/30 px-3 py-2 font-mono text-xs font-bold text-white">
                      🕵️ KNOWN SYNDICATE ALLIES:{' '}
                      <span className="text-amber-tactical">
                        {assignment.knownImposterNames.join(', ')}
                      </span>
                    </div>
                  )}
              </div>

              {/* Mission Briefing Directive */}
              <div
                className={`rounded-xl border p-3 text-left text-xs ${
                  isImposter
                    ? 'border-zinc-800 bg-noir-950/80 text-zinc-300'
                    : 'border-noir-900/20 bg-white/55 text-noir-900'
                }`}
              >
                <div className="font-mono text-[10px] font-bold uppercase opacity-75">
                  DIRECTIVE:
                </div>
                <p className="mt-0.5 font-medium leading-relaxed">
                  {roleMeta.objective}
                </p>
              </div>
            </div>

            {/* Hide / Re-seal button */}
            <button
              type="button"
              onClick={handleHideDossier}
              className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-noir-800 py-3 font-mono text-xs font-bold uppercase text-zinc-200 transition hover:border-zinc-500 active:scale-[0.98]"
            >
              <EyeOff className="h-4 w-4" />
              <span>Re-Lock Dossier View</span>
            </button>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="border-t border-zinc-800 bg-noir-950 p-4">
          {playMode === 'pass_and_play' ? (
            <button
              type="button"
              disabled={!hasSeenOnce}
              onClick={handleAdvance}
              className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-sm font-bold uppercase tracking-wider active:scale-[0.98] ${
                hasSeenOnce
                  ? 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-500'
                  : 'cursor-not-allowed border border-zinc-800 bg-noir-900 text-zinc-600'
              }`}
            >
              {!hasSeenOnce ? (
                <span>Scan Fingerprint Above First</span>
              ) : isLastPlayer ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>ALL CLEAR — BEGIN INTERROGATION</span>
                </>
              ) : (
                <>
                  <span>SEAL & PASS TO {players[round.revealIndex + 1]?.name.toUpperCase()}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : isHost ? (
            <button
              type="button"
              onClick={handleAdvance}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-white hover:bg-emerald-500"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>START INTERROGATION & TIMER FOR ALL AGENTS</span>
            </button>
          ) : (
            <div className="text-center font-mono text-xs text-zinc-400">
              Memorize your dossier! Host will start the Interrogation timer shortly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
