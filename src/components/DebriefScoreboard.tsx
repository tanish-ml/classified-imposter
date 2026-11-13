import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Play,
  Sliders,
  Trophy,
} from 'lucide-react';
import { BUILTIN_CATEGORIES } from '../data/categories';
import { CHAOS_MODE_METADATA, ROLE_METADATA } from '../engine/gameEngine';
import { Player, RoundOutcome, RoundState } from '../types/game';
import { spyAudio } from '../utils/soundEffects';
import { DeckIcon } from './DeckIcon';

interface DebriefScoreboardProps {
  round: RoundState;
  outcome: RoundOutcome;
  players: Player[];
  onPlayNextMission: () => void;
  onReturnToSetup: () => void;
}

export const DebriefScoreboard: React.FC<DebriefScoreboardProps> = ({
  round,
  outcome,
  players,
  onPlayNextMission,
  onReturnToSetup,
}) => {
  useEffect(() => {
    spyAudio.playVictoryFanfare();
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore in headless/non-canvas environments
    }
  }, []);

  const sortedLeaderboard = [...players].sort((a, b) => b.score - a.score);

  const isCiviliansWin = outcome.winnerTeam === 'civilians';
  const isJesterWin = outcome.winnerTeam === 'jester';
  const categoryIcon =
    BUILTIN_CATEGORIES.find((c) => c.id === round.categoryId)?.icon || 'Layers';

  return (
    <div className="animate-card-in mx-auto max-w-4xl px-3 pb-24 pt-5 sm:px-6">
      {/* Outcome Banner Card */}
      <div
        className={`relative overflow-hidden rounded-3xl border-2 p-6 shadow-dossier sm:p-8 ${
          isCiviliansWin
            ? 'border-emerald-500/70 bg-gradient-to-b from-emerald-950/50 to-noir-900'
            : isJesterWin
            ? 'border-purple-500/70 bg-gradient-to-b from-purple-950/50 to-noir-900'
            : 'border-crimson bg-gradient-to-b from-crimson-dark/45 to-noir-900'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-black/40 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-amber-tactical">
              MISSION DECLASSIFIED // OPERATION #{round.roundNumber}
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {outcome.headline}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-zinc-200 sm:text-base">
              {outcome.subheadline}
            </p>
          </div>

          <div
            className={`rubber-stamp text-xs font-extrabold ${
              isCiviliansWin
                ? 'text-emerald-400'
                : isJesterWin
                ? 'text-purple-400'
                : 'text-crimson-glow'
            }`}
          >
            {isCiviliansWin
              ? 'AGENCY CLEARED'
              : isJesterWin
              ? 'JESTER TRIUMPH'
              : 'SYNDICATE WIN'}
          </div>
        </div>

        {/* Declassified Word & Hint Intel Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-zinc-800/90 bg-noir-950/90 p-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-noir-900 p-3">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-zinc-400">
              <DeckIcon name={categoryIcon} className="h-3.5 w-3.5 text-amber-tactical" />
              <span>{round.categoryName}</span>
            </span>
            <div className="mt-1 font-display text-xl font-extrabold text-amber-tactical">
              {round.trueWord}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-noir-900 p-3">
            <span className="font-mono text-[10px] uppercase text-zinc-400">
              IMPOSTER CLUE / HINT
            </span>
            <div className="mt-1 font-mono text-sm font-bold text-zinc-200">
              {round.trueHint}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-noir-900 p-3">
            <span className="font-mono text-[10px] uppercase text-zinc-400">
              UNDERCOVER DECOY / PROTOCOL
            </span>
            <div className="mt-1 font-mono text-sm font-bold text-emerald-400">
              {round.decoyWord} •{' '}
              <span className="text-xs text-zinc-400">
                {CHAOS_MODE_METADATA[round.activeChaosApplied].tag}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Breakdown: Agent Declassification + Session Leaderboard */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left: True Roles & Point Breakdown (7 cols) */}
        <div className="rounded-2xl border border-zinc-800 bg-noir-900 p-5 shadow-dossier lg:col-span-7">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-display text-lg font-bold text-white">
              Operative Allegiances & Mission Points
            </h3>
            <span className="font-mono text-[10px] uppercase text-zinc-400">
              FULL DISCLOSURE
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {players.map((p) => {
              const assign = round.assignments[p.id];
              if (!assign) return null;
              const roleMeta = ROLE_METADATA[assign.role];
              const delta = outcome.scoreDeltas[p.id];
              const wasEliminated = outcome.eliminatedPlayerIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3.5 ${
                    assign.role === 'imposter' || assign.role === 'undercover'
                      ? 'border-crimson/50 bg-crimson-dark/15'
                      : 'border-zinc-800 bg-noir-950/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-noir-800 text-xl">
                      {p.avatar}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-bold text-white">
                          {p.name}
                        </span>
                        <span
                          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${roleMeta.clearanceColor} ${roleMeta.bgAccent}`}
                        >
                          {roleMeta.shortBadge}
                        </span>
                        {wasEliminated && (
                          <span className="rounded bg-crimson/25 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-crimson-glow">
                            VOTED OUT
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-400">
                        {delta?.reason}
                        {assign.clueGiven ? ` • Clue: “${assign.clueGiven}”` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="font-mono text-sm font-extrabold text-amber-tactical">
                    +{delta?.points || 0} PTS
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cumulative Agency Leaderboard (5 cols) */}
        <div className="rounded-2xl border border-zinc-800 bg-noir-900 p-5 shadow-dossier lg:col-span-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
              <Trophy className="h-5 w-5 text-amber-tactical" />
              Agency Leaderboard
            </h3>
            <span className="font-mono text-[10px] text-amber-tactical">
              OVERALL STANDINGS
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {sortedLeaderboard.map((p, rank) => (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
                  rank === 0 && p.score > 0
                    ? 'border-amber-tactical/60 bg-amber-950/25'
                    : 'border-zinc-800 bg-noir-950/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-extrabold ${
                      rank === 0
                        ? 'bg-amber-tactical text-noir-950'
                        : rank === 1
                        ? 'bg-zinc-300 text-noir-950'
                        : rank === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-noir-800 text-zinc-400'
                    }`}
                  >
                    {rank + 1}
                  </span>
                  <span className="text-lg">{p.avatar}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{p.name}</div>
                    {p.streak > 1 && (
                      <div className="inline-flex items-center gap-1 font-mono text-[10px] text-orange-400">
                        <Flame className="h-3 w-3" /> {p.streak} Streak
                      </div>
                    )}
                  </div>
                </div>

                <div className="font-mono text-sm font-extrabold text-white">
                  {p.score} <span className="text-[10px] text-zinc-400">PTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Next Round Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-noir-950/95 p-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2.5 px-1 sm:px-2">
          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              onReturnToSetup();
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-700 bg-noir-800 px-3.5 py-3 font-mono text-xs font-bold uppercase text-zinc-200 hover:border-zinc-500"
          >
            <Sliders className="h-4 w-4" />
            <span>Rules</span>
          </button>

          <button
            type="button"
            onClick={() => {
              spyAudio.playStamp();
              onPlayNextMission();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-crimson px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-white shadow-crimson-glow transition hover:bg-crimson-glow sm:flex-initial sm:min-w-[260px] sm:text-base"
          >
            <Play className="h-4 w-4 shrink-0 fill-current" />
            <span>NEXT MISSION (SAME AGENTS)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
