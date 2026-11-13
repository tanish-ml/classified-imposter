import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Clock,
  Eye,
  Gavel,
  MessageSquare,
  Mic,
  Pause,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { getCivilianRewardForCycle } from '../engine/gameEngine';
import { GameSettings, Player, RoundState } from '../types/game';
import { spyAudio } from '../utils/soundEffects';

interface InterrogationScreenProps {
  round: RoundState;
  players: Player[];
  settings: GameSettings;
  localPlayerId: string;
  isHost: boolean;
  onRecordClueAndNext: (playerId: string, clueText: string) => void;
  onStartTribunal: () => void;
}

const INTERROGATION_PROMPTS = [
  '“If you saw this at 3 AM, what would your reaction be?”',
  '“How much money would a normal person pay for this?”',
  '“Would you bring this on a first date? Why?”',
  '“What smell or sound do you associate most with this?”',
  '“Where is the most suspicious place to find this?”',
  '“Could this fit inside a standard backpack?”',
  '“Was this around 100 years ago?”',
  '“On a scale of 1 to 10, how loud is this?”',
];

export const InterrogationScreen: React.FC<InterrogationScreenProps> = ({
  round,
  players,
  settings,
  localPlayerId,
  onRecordClueAndNext,
  onStartTribunal,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(settings.discussionSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [clueInput, setClueInput] = useState('');
  const [peekPlayerId, setPeekPlayerId] = useState<string | null>(null);
  const [peekUnlocked, setPeekUnlocked] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    setSecondsLeft(settings.discussionSeconds);
  }, [round.voteCycle, settings.discussionSeconds]);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          spyAudio.playAlertSiren();
          return 0;
        }
        if (prev <= 11) {
          spyAudio.playRadarPing(true);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, secondsLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activeSpeakerId =
    round.speakingOrder[round.currentSpeakerIndex % round.speakingOrder.length];
  const activeSpeaker =
    players.find((p) => p.id === activeSpeakerId) || players[0];

  const handleAdvanceSpeaker = (e?: React.FormEvent) => {
    e?.preventDefault();
    spyAudio.playRadarPing(false);
    onRecordClueAndNext(activeSpeaker.id, clueInput.trim());
    setClueInput('');
  };

  const progressPct = Math.max(
    0,
    Math.min(100, (secondsLeft / settings.discussionSeconds) * 100)
  );

  const peekAssignment = peekPlayerId ? round.assignments[peekPlayerId] : null;
  const currentReward = getCivilianRewardForCycle(round.voteCycle);

  return (
    <div className="mx-auto max-w-4xl px-3 pb-24 pt-4 sm:px-6 sm:pt-6">
      {/* Red Ambient Strobe on Final 10-Second Countdown */}
      {secondsLeft <= 10 && secondsLeft > 0 && !isPaused && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-20 animate-pulse shadow-[inset_0_0_55px_rgba(217,56,58,0.45)]"
        />
      )}
      {/* Minimalist Top Bar: Category, Vote Cycle & Timer */}
      <div className="rounded-2xl border border-zinc-800 bg-noir-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-amber-tactical/15 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-tactical">
                {round.categoryName}
              </span>
              {round.voteCycle > 1 && (
                <span className="rounded-md border border-crimson/40 bg-crimson/15 px-2 py-0.5 font-mono text-[11px] font-bold text-crimson-glow">
                  ROUND {round.voteCycle} • {round.activePlayerIds.length} LEFT • {currentReward} PTS
                </span>
              )}
            </div>
            <h2 className="mt-1 font-display text-lg font-bold text-white sm:text-xl">
              Give a 1-Word Clue
            </h2>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-noir-950 px-3 py-2">
            <Clock
              className={`h-4 w-4 ${
                secondsLeft <= 15
                  ? 'animate-bounce text-crimson-glow'
                  : 'text-amber-tactical'
              }`}
            />
            <span
              className={`font-mono text-xl font-extrabold ${
                secondsLeft <= 15 ? 'text-crimson-glow' : 'text-white'
              }`}
            >
              {formatTime(secondsLeft)}
            </span>
            <button
              type="button"
              onClick={() => {
                spyAudio.playTick();
                setIsPaused(!isPaused);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-noir-800 text-zinc-300 transition hover:text-white active:scale-95"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                spyAudio.playTick();
                setSecondsLeft((s) => s + 30);
              }}
              className="flex h-11 items-center justify-center rounded-xl bg-noir-800 px-3.5 font-mono text-xs font-bold text-zinc-300 transition hover:text-amber-tactical active:scale-95"
            >
              +30s
            </button>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-noir-950">
          <div
            className={`h-full transition-all duration-500 ${
              secondsLeft <= 15 ? 'bg-crimson' : 'bg-amber-tactical'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main 2-Column Area */}
      <div className="mt-4 grid gap-4 md:grid-cols-12">
        {/* Current Speaker Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-noir-900 p-4 md:col-span-6">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-mono font-bold text-amber-tactical">
                <Mic className="h-3.5 w-3.5 animate-pulse" />
                TURN {(round.currentSpeakerIndex % round.speakingOrder.length) + 1}/{round.speakingOrder.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  spyAudio.playTick();
                  setPromptIndex(
                    (prev) => (prev + 1) % INTERROGATION_PROMPTS.length
                  );
                }}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:text-amber-tactical active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-tactical" /> Prompt
              </button>
            </div>

            <div className="my-4 flex items-center gap-3.5 rounded-2xl border border-zinc-800 bg-noir-950 p-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-noir-800 text-2xl">
                {activeSpeaker?.avatar}
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  {activeSpeaker?.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  {INTERROGATION_PROMPTS[promptIndex]}
                </p>
              </div>
            </div>

            <form onSubmit={handleAdvanceSpeaker} className="flex gap-2">
              <input
                type="text"
                value={clueInput}
                onChange={(e) => setClueInput(e.target.value)}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 250);
                }}
                placeholder="Log clue (optional)..."
                className="min-h-[44px] w-full rounded-xl border border-zinc-800 bg-noir-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-tactical focus:outline-none"
              />
              <button
                type="submit"
                className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl bg-amber-tactical px-4 py-2.5 text-xs font-bold uppercase text-noir-950 active:scale-95"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              setPeekPlayerId(
                settings.playMode === 'live_room'
                  ? localPlayerId
                  : activeSpeaker?.id || players[0].id
              );
              setPeekUnlocked(false);
            }}
            className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-noir-950 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 active:scale-[0.98]"
          >
            <Eye className="h-4 w-4 text-amber-tactical" />
            <span>Peek Secret Word</span>
          </button>
        </div>

        {/* Speaking Order & Vote CTA */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-noir-900 p-4 md:col-span-6">
          <div>
            <div className="flex items-center justify-between pb-2.5">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-zinc-300">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                Active Players ({round.speakingOrder.length})
              </span>
            </div>

            <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
              {round.speakingOrder.map((pid, idx) => {
                const p = players.find((pl) => pl.id === pid);
                const assign = round.assignments[pid];
                const isCurrent =
                  idx === round.currentSpeakerIndex % round.speakingOrder.length;
                if (!p) return null;

                return (
                  <div
                    key={pid}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                      isCurrent
                        ? 'border-amber-tactical/70 bg-amber-950/20'
                        : 'border-zinc-800/80 bg-noir-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-zinc-500">
                        {idx + 1}
                      </span>
                      <span className="text-lg">{p.avatar}</span>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {p.name}
                        </div>
                        {assign?.clueGiven && (
                          <div className="font-mono text-[11px] text-emerald-400">
                            “{assign.clueGiven}”
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        spyAudio.playTick();
                        setPeekPlayerId(pid);
                        setPeekUnlocked(false);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-noir-800 text-zinc-400 transition hover:text-white active:scale-95"
                      title="Peek word"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Thumb-Zone Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/90 bg-noir-950/95 p-3 backdrop-blur-md">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => {
              spyAudio.playAlertSiren();
              onStartTribunal();
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-crimson py-3.5 font-display text-sm font-bold uppercase tracking-wider text-white transition hover:bg-crimson-glow active:scale-[0.98]"
          >
            <Gavel className="h-4 w-4" />
            <span>Vote Now</span>
          </button>
        </div>
      </div>

      {/* Private Dossier Peek Modal */}
      {peekPlayerId && peekAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-noir-900 p-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display text-base font-bold text-white">
                {peekAssignment.avatar} {peekAssignment.playerName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPeekPlayerId(null);
                  setPeekUnlocked(false);
                }}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-5 text-center">
              {!peekUnlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    spyAudio.playScannerReveal();
                    setPeekUnlocked(true);
                  }}
                  className="mx-auto flex items-center gap-2 rounded-xl bg-amber-tactical px-5 py-3 text-xs font-bold uppercase text-noir-950"
                >
                  <Eye className="h-4 w-4" />
                  Tap to Peek Word
                </button>
              ) : (
                <div className="rounded-xl border border-zinc-700 bg-noir-950 p-4">
                  {peekAssignment.role === 'imposter' ? (
                    <>
                      <div className="font-display text-xl font-extrabold text-crimson-glow">
                        IMPOSTER
                      </div>
                      {peekAssignment.hintText && (
                        <div className="mt-1 font-mono text-xs text-amber-tactical">
                          {peekAssignment.hintText}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="font-display text-2xl font-extrabold text-amber-tactical">
                      {peekAssignment.secretWord}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setPeekPlayerId(null);
                setPeekUnlocked(false);
              }}
              className="w-full rounded-xl bg-noir-800 py-2.5 text-xs font-bold uppercase text-white"
            >
              Hide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
