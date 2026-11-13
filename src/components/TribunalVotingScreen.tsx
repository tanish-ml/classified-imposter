import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Crosshair,
  Gavel,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { getCivilianRewardForCycle } from '../engine/gameEngine';
import {
  GamePhase,
  GameSettings,
  Player,
  RoundOutcome,
  RoundState,
} from '../types/game';
import { spyAudio } from '../utils/soundEffects';

export interface SurvivalBannerInfo {
  eliminatedNames: string;
  remainingCount: number;
  nextCycle: number;
  nextReward: number;
}

interface TribunalVotingScreenProps {
  phase: GamePhase;
  round: RoundState;
  players: Player[];
  settings: GameSettings;
  caughtImposterIds: string[];
  preliminaryOutcome: RoundOutcome | null;
  survivalBanner: SurvivalBannerInfo | null;
  onContinueToNextSurvivalRound: () => void;
  onExecuteVerdict: (eliminatedIds: string[], votedNoImposter?: boolean) => void;
  onSubmitLastChanceGuess: (guessedWord: string) => void;
  onDetectiveScan: (targetPlayerId: string) => void;
}

export const TribunalVotingScreen: React.FC<TribunalVotingScreenProps> = ({
  phase,
  round,
  players,
  settings,
  caughtImposterIds,
  survivalBanner,
  onContinueToNextSurvivalRound,
  onExecuteVerdict,
  onSubmitLastChanceGuess,
  onDetectiveScan,
}) => {
  const [votingStyle, setVotingStyle] = useState<'group' | 'ballot'>('group');
  const [selectedSuspectIds, setSelectedSuspectIds] = useState<string[]>([]);
  const [ballotVoterIdx, setBallotVoterIdx] = useState(0);
  const [ballotVotes, setBallotVotes] = useState<Record<string, string>>({});
  const [showDetectiveModal, setShowDetectiveModal] = useState(false);
  const [scannedTargetId, setScannedTargetId] = useState<string | null>(null);
  const [isVerifyingVerdict, setIsVerifyingVerdict] = useState(false);
  const verdictTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (verdictTimeoutRef.current !== null) {
        window.clearTimeout(verdictTimeoutRef.current);
      }
    };
  }, []);

  const handleExecuteWithSuspense = (
    suspectIds: string[],
    votedNoImposter = false
  ) => {
    if (isVerifyingVerdict) return;
    setIsVerifyingVerdict(true);
    spyAudio.playScannerReveal();
    verdictTimeoutRef.current = window.setTimeout(() => {
      setIsVerifyingVerdict(false);
      spyAudio.playStamp();
      onExecuteVerdict(suspectIds, votedNoImposter);
    }, 1500);
  };

  // Last Chance Steal states
  const [stealSeconds, setStealSeconds] = useState(20);
  const [customGuessText, setCustomGuessText] = useState('');

  useEffect(() => {
    setSelectedSuspectIds([]);
    setBallotVoterIdx(0);
    setBallotVotes({});
  }, [round.voteCycle, phase]);

  useEffect(() => {
    if (phase !== 'last_chance_steal') return;
    setStealSeconds(20);
    const interval = setInterval(() => {
      setStealSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onSubmitLastChanceGuess('');
          return 0;
        }
        spyAudio.playRadarPing(prev <= 6);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const activePlayers = players.filter((p) =>
    round.activePlayerIds.includes(p.id)
  );

  const detectiveAssignment = Object.values(round.assignments).find(
    (a) => a.role === 'detective' && round.activePlayerIds.includes(a.playerId)
  );

  // === SURVIVAL ROUND CONTINUATION CARD (When Imposter wasn't caught on Vote 1) ===
  if (survivalBanner) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-3xl border border-amber-tactical/60 bg-noir-900 p-6 text-center shadow-dossier">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-400">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-amber-tactical">
            NOT THE IMPOSTER!
          </span>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-white">
            {survivalBanner.eliminatedNames} Was Cleared
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            <strong className="text-white">{survivalBanner.remainingCount} players</strong> remain, and the Imposter is still among you.
          </p>

          <div className="my-5 rounded-2xl border border-zinc-800 bg-noir-950 p-3.5 font-mono text-xs text-zinc-400">
            Round {survivalBanner.nextCycle} Reward:{' '}
            <strong className="text-amber-tactical">
              +{survivalBanner.nextReward} PTS
            </strong>{' '}
            (Reduced)
          </div>

          <button
            type="button"
            onClick={() => {
              spyAudio.playStamp();
              onContinueToNextSurvivalRound();
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-amber-tactical py-3.5 font-display text-sm font-bold uppercase tracking-wider text-noir-950 active:scale-[0.98]"
          >
            <span>Start Round {survivalBanner.nextCycle}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // === RENDER PHASE: IMPOSTER'S LAST CHANCE STEAL ===
  if (phase === 'last_chance_steal') {
    const caughtNames = caughtImposterIds
      .map((id) => round.assignments[id]?.playerName)
      .join(' & ');

    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="overflow-hidden rounded-3xl border-2 border-crimson bg-noir-900 shadow-crimson-glow">
          <div className="bg-crimson px-4 py-2.5 text-center font-mono text-xs font-extrabold uppercase tracking-wider text-white">
            LAST-CHANCE WORD STEAL • {stealSeconds}s
          </div>

          <div className="p-5 text-center">
            <h2 className="font-display text-2xl font-extrabold text-white">
              {caughtNames} Caught!
            </h2>
            <p className="mt-1 text-xs text-zinc-300 sm:text-sm">
              Guess the secret word from <strong className="text-amber-tactical">{round.categoryName}</strong> to steal the win:
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {round.lineupOptions.map((optionWord) => (
                <button
                  key={optionWord}
                  type="button"
                  onClick={() => {
                    spyAudio.playStamp();
                    onSubmitLastChanceGuess(optionWord);
                  }}
                  className="flex items-center justify-center rounded-xl border border-zinc-700 bg-noir-950 p-3.5 text-sm font-bold text-white transition hover:border-amber-tactical hover:text-amber-tactical active:scale-95"
                >
                  {optionWord}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customGuessText.trim()) return;
                spyAudio.playStamp();
                onSubmitLastChanceGuess(customGuessText.trim());
              }}
              className="mt-4 flex gap-2 border-t border-zinc-800 pt-4"
            >
              <input
                type="text"
                value={customGuessText}
                onChange={(e) => setCustomGuessText(e.target.value)}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 250);
                }}
                placeholder="Or type word..."
                className="min-h-[44px] w-full rounded-xl border border-zinc-700 bg-noir-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-tactical focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[44px] shrink-0 rounded-xl bg-amber-tactical px-4 py-2 text-xs font-bold uppercase text-noir-950 active:scale-95"
              >
                Guess
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER PHASE: TRIBUNAL VOTING ===
  const toggleSuspect = (id: string) => {
    spyAudio.playTick();
    if (selectedSuspectIds.includes(id)) {
      setSelectedSuspectIds((prev) => prev.filter((item) => item !== id));
    } else {
      const maxSelect = Math.max(1, settings.imposterCount);
      if (selectedSuspectIds.length >= maxSelect) {
        setSelectedSuspectIds([...selectedSuspectIds.slice(1), id]);
      } else {
        setSelectedSuspectIds([...selectedSuspectIds, id]);
      }
    }
  };

  const handleCastSecretBallot = (suspectId: string) => {
    spyAudio.playTick();
    const currentVoter = activePlayers[ballotVoterIdx];
    const nextVotes = { ...ballotVotes, [currentVoter.id]: suspectId };
    setBallotVotes(nextVotes);

    if (ballotVoterIdx + 1 < activePlayers.length) {
      setBallotVoterIdx(ballotVoterIdx + 1);
    } else {
      const counts: Record<string, number> = {};
      Object.values(nextVotes).forEach((targetId) => {
        counts[targetId] = (counts[targetId] || 0) + 1;
      });
      let maxVotes = 0;
      Object.values(counts).forEach((c) => {
        if (c > maxVotes) maxVotes = c;
      });
      const topSuspects = Object.keys(counts).filter(
        (id) => counts[id] === maxVotes
      );
      handleExecuteWithSuspense(
        topSuspects.slice(0, Math.max(1, settings.imposterCount)),
        false
      );
    }
  };

  const currentReward = getCivilianRewardForCycle(round.voteCycle);

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="rounded-2xl border border-zinc-800 bg-noir-900 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase text-crimson-glow">
                VOTE ROUND {round.voteCycle}
              </span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-tactical">
                +{currentReward} PTS
              </span>
            </div>
            <h2 className="mt-0.5 font-display text-xl font-bold text-white">
              Who Is The Imposter?
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {detectiveAssignment && !round.detectiveScannedPlayerId && (
              <button
                type="button"
                onClick={() => {
                  spyAudio.playTick();
                  setShowDetectiveModal(true);
                }}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/30 px-3 py-2 text-xs font-bold text-sky-300 active:scale-95"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Scan</span>
              </button>
            )}

            <div className="flex rounded-xl border border-zinc-800 bg-noir-950 p-1">
              <button
                type="button"
                onClick={() => {
                  spyAudio.playTick();
                  setVotingStyle('group');
                }}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  votingStyle === 'group'
                    ? 'bg-crimson text-white'
                    : 'text-zinc-400'
                }`}
              >
                Group
              </button>
              <button
                type="button"
                onClick={() => {
                  spyAudio.playTick();
                  setVotingStyle('ballot');
                  setBallotVoterIdx(0);
                  setBallotVotes({});
                }}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  votingStyle === 'ballot'
                    ? 'bg-amber-tactical text-noir-950'
                    : 'text-zinc-400'
                }`}
              >
                Ballot
              </button>
            </div>
          </div>
        </div>

        {votingStyle === 'group' ? (
          <>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {activePlayers.map((p) => {
                const isSelected = selectedSuspectIds.includes(p.id);
                const clue = round.assignments[p.id]?.clueGiven;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSuspect(p.id)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? 'border-crimson bg-crimson/20 shadow-crimson-glow'
                        : 'border-zinc-800 bg-noir-950 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-noir-800 text-xl">
                        {p.avatar}
                      </span>
                      <div>
                        <div className="font-display text-sm font-bold text-white sm:text-base">
                          {p.name}
                        </div>
                        {clue && (
                          <div className="font-mono text-[11px] text-emerald-400">
                            “{clue}”
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-crimson bg-crimson text-white'
                          : 'border-zinc-700 bg-noir-900'
                      }`}
                    >
                      {isSelected && <Crosshair className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 border-t border-zinc-800 pt-4">
              {(settings.chaosMode === 'zero_imposters' ||
                settings.chaosMode === 'random_chaos') && (
                <button
                  type="button"
                  onClick={() => handleExecuteWithSuspense([], true)}
                  className="min-h-[44px] rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2.5 text-xs font-bold text-emerald-300 transition active:scale-95"
                >
                  🛡️ False Alarm (0 Imposters)
                </button>
              )}

              <button
                type="button"
                disabled={selectedSuspectIds.length === 0 || isVerifyingVerdict}
                onClick={() =>
                  handleExecuteWithSuspense(selectedSuspectIds, false)
                }
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-crimson px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition hover:bg-crimson-glow active:scale-[0.98] disabled:opacity-40 sm:flex-initial"
              >
                <Gavel className="h-4 w-4" />
                <span>Eliminate ({selectedSuspectIds.length})</span>
              </button>
            </div>
          </>
        ) : (
          /* Individual Secret Ballot Mode */
          <div className="mt-4">
            <div className="mb-3 rounded-xl border border-amber-tactical/40 bg-amber-950/20 p-3 text-center">
              <div className="font-mono text-[10px] font-bold uppercase text-amber-tactical">
                VOTER {ballotVoterIdx + 1} OF {activePlayers.length}
              </div>
              <h3 className="mt-0.5 font-display text-lg font-bold text-white">
                {activePlayers[ballotVoterIdx]?.avatar}{' '}
                {activePlayers[ballotVoterIdx]?.name}, Vote Suspect:
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activePlayers
                .filter((p) => p.id !== activePlayers[ballotVoterIdx]?.id)
                .map((suspect) => (
                  <button
                    key={suspect.id}
                    type="button"
                    onClick={() => handleCastSecretBallot(suspect.id)}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-noir-950 p-3 text-left hover:border-amber-tactical"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{suspect.avatar}</span>
                      <span className="font-display text-sm font-bold text-white">
                        {suspect.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-tactical">
                      Vote →
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Detective Scan Modal */}
      {showDetectiveModal && detectiveAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-sky-500/50 bg-noir-900 p-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display text-base font-bold text-white">
                🔍 Detective Scan
              </h3>
              <button
                type="button"
                onClick={() => setShowDetectiveModal(false)}
                className="p-1 text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!scannedTargetId ? (
              <div className="my-4 space-y-2">
                {activePlayers
                  .filter((p) => p.id !== detectiveAssignment.playerId)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        spyAudio.playScannerReveal();
                        setScannedTargetId(p.id);
                        onDetectiveScan(p.id);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-noir-950 p-3 text-left hover:border-sky-400"
                    >
                      <span className="font-bold text-white">
                        {p.avatar} {p.name}
                      </span>
                      <span className="font-mono text-xs text-sky-400">
                        Scan
                      </span>
                    </button>
                  ))}
              </div>
            ) : (
              <div className="my-5 rounded-xl border border-zinc-700 bg-noir-950 p-4 text-center">
                <div className="font-mono text-xs text-zinc-400">
                  {round.assignments[scannedTargetId]?.playerName}:
                </div>
                {round.assignments[scannedTargetId]?.role === 'civilian' ||
                round.assignments[scannedTargetId]?.role === 'accomplice' ? (
                  <div className="mt-1 font-display text-lg font-bold text-emerald-400">
                    ✓ CLEARED AGENT
                  </div>
                ) : (
                  <div className="mt-1 font-display text-lg font-bold text-crimson-glow">
                    ⚠️ ANOMALY DETECTED
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDetectiveModal(false)}
              className="min-h-[44px] w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold uppercase text-white active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Suspense Elimination Drumroll Overlay */}
      {isVerifyingVerdict && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6 backdrop-blur-md">
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-crimson/35" />
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-crimson bg-noir-950 text-3xl shadow-crimson-glow">
              ⚖️
            </div>
          </div>
          <h2 className="animate-pulse text-center font-display text-xl font-extrabold uppercase tracking-widest text-crimson-glow">
            ANALYZING CLEARANCE DATA...
          </h2>
          <p className="mt-2 text-center font-mono text-xs text-zinc-400">
            Transmitting verdict to Tribunal
          </p>
        </div>
      )}
    </div>
  );
};
