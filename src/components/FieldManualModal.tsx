import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Fingerprint,
  Flame,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { CHAOS_MODE_METADATA, ROLE_METADATA } from '../engine/gameEngine';
import { ChaosMode, RoleType } from '../types/game';
import { spyAudio } from '../utils/soundEffects';

interface FieldManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FieldManualModal: React.FC<FieldManualModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const roleKeys: RoleType[] = [
    'civilian',
    'imposter',
    'undercover',
    'jester',
    'detective',
    'accomplice',
  ];

  const chaosKeys: ChaosMode[] = [
    'standard',
    'all_imposters',
    'zero_imposters',
    'mystery_count',
    'random_chaos',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-700/80 bg-noir-900 shadow-dossier">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-noir-950 px-5 py-4">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-tactical">
              AGENCY DIRECTIVE // DECLASSIFIED
            </span>
            <h2 className="font-display text-xl font-bold text-white">
              FIELD MANUAL & TACTICAL PROTOCOLS
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              onClose();
            }}
            className="rounded-lg border border-zinc-800 bg-noir-800 p-2 text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-6 overflow-y-auto p-5 text-sm text-zinc-300 sm:p-6">
          {/* Core Loop */}
          <section className="rounded-xl border border-zinc-800 bg-noir-800/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Fingerprint className="h-4 w-4" />
              01 // THE CORE OPERATION LOOP
            </h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-800 bg-noir-900 p-3">
                <div className="font-mono text-xs font-bold text-amber-tactical">STEP 1: DOSSIER</div>
                <p className="mt-1 text-xs text-zinc-400">
                  Pass one phone around (or join via QR/Room Code). Hold the biometric scanner to un-redact your secret word or Imposter status.
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-noir-900 p-3">
                <div className="font-mono text-xs font-bold text-amber-tactical">STEP 2: CLUES</div>
                <p className="mt-1 text-xs text-zinc-400">
                  In speaking order, each agent says <strong>one subtle word</strong> aloud related to the secret target. Don’t make it too obvious!
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-noir-900 p-3">
                <div className="font-mono text-xs font-bold text-amber-tactical">STEP 3: TRIBUNAL</div>
                <p className="mt-1 text-xs text-zinc-400">
                  Debate who gave a shady clue and vote to unmask the Imposter before time expires.
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-noir-900 p-3">
                <div className="font-mono text-xs font-bold text-amber-tactical">STEP 4: STEAL</div>
                <p className="mt-1 text-xs text-zinc-400">
                  If the Imposter is caught, they get one <strong>15-second Last Chance</strong> to guess the secret word and steal the win!
                </p>
              </div>
            </div>
          </section>

          {/* Roles Breakdown */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-tactical">
              <Users className="h-4 w-4" />
              02 // AGENT CLEARANCE ROLES (ALL UNLOCKED)
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {roleKeys.map((rKey) => {
                const meta = ROLE_METADATA[rKey];
                return (
                  <div
                    key={rKey}
                    className="rounded-xl border border-zinc-800 bg-noir-800/40 p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[11px] font-bold ${meta.clearanceColor} ${meta.bgAccent}`}
                      >
                        {meta.shortBadge}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {meta.title}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-200">
                      {meta.objective}
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                      Tip: {meta.tacticalAdvice}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Chaos / Troll Modes */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-crimson-glow">
              <Flame className="h-4 w-4" />
              03 // TROLL & CHAOS MODIFIERS
            </h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {chaosKeys.map((cKey) => {
                const cMeta = CHAOS_MODE_METADATA[cKey];
                return (
                  <div
                    key={cKey}
                    className="rounded-xl border border-zinc-800 bg-noir-950/70 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-white">
                        {cMeta.name}
                      </span>
                      <span className="rounded bg-crimson/20 px-2 py-0.5 font-mono text-[10px] font-bold text-crimson-glow">
                        {cMeta.tag}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">{cMeta.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Scoring System */}
          <section className="rounded-xl border border-zinc-800 bg-noir-800/40 p-4">
            <h3 className="mb-2 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-sky-400">
              <Sparkles className="h-4 w-4" />
              04 // AGENCY SCORING & LEADERBOARD
            </h3>
            <ul className="space-y-1.5 font-mono text-xs text-zinc-300">
              <li>• <strong>+250 PTS:</strong> Imposter / Undercover survives the Tribunal undetected.</li>
              <li>• <strong>+225 PTS:</strong> Caught Imposter successfully guesses the secret word during Last-Chance Steal.</li>
              <li>• <strong>+300 PTS:</strong> The Jester successfully tricks the group into voting them out.</li>
              <li>• <strong>+200 PTS:</strong> The Accomplice protects the Imposter until escape.</li>
              <li>• <strong>+150 PTS:</strong> Cleared Field Agents & Detective unmask the Imposter and block the word steal.</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 bg-noir-950 px-5 py-3">
          <button
            type="button"
            onClick={() => {
              spyAudio.playTick();
              onClose();
            }}
            className="rounded-xl bg-crimson px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-crimson-glow hover:bg-crimson-glow"
          >
            Acknowledge Briefing
          </button>
        </div>
      </div>
    </div>
  );
};
