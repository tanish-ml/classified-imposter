import {
  AssignedPlayerRole,
  CategoryDeck,
  ChaosMode,
  GameSettings,
  HintStyle,
  Player,
  RoleType,
  RoundOutcome,
  RoundState,
  WordEntry,
} from '../types/game';

export const AGENT_AVATARS = [
  '🕵️', '🕶️', '🦊', '🐺', '🦅', '🐍', '🎭', '👻',
  '🤖', '🥷', '🎩', '🦉', '🦈', '🐆', '🦂', '🦇',
  '👑', '⚡', '🔥', '💀',
];

export const DEFAULT_AGENT_NAMES = [
  'Agent Vance',
  'Agent Cipher',
  'Agent Rook',
  'Agent Nyx',
  'Agent Kestrel',
  'Agent Viper',
  'Agent Sterling',
  'Agent Sable',
  'Agent Phantom',
  'Agent Orion',
  'Agent Echo',
  'Agent Lynx',
];

export const ROLE_METADATA: Record<
  RoleType,
  {
    title: string;
    shortBadge: string;
    clearanceColor: string;
    bgAccent: string;
    objective: string;
    tacticalAdvice: string;
  }
> = {
  civilian: {
    title: 'FIELD AGENT // CLEARED',
    shortBadge: 'AGENT',
    clearanceColor: 'text-emerald-400 border-emerald-500/50',
    bgAccent: 'bg-emerald-950/40',
    objective: 'Give a subtle 1-word clue to prove you know the target word without giving it away to the Imposter.',
    tacticalAdvice: 'Too obvious = Imposter steals the word. Too vague = the Tribunal suspects YOU.',
  },
  imposter: {
    title: 'IMPOSTER // UNAUTHORIZED',
    shortBadge: 'IMPOSTER',
    clearanceColor: 'text-crimson-glow border-crimson',
    bgAccent: 'bg-crimson-dark/30',
    objective: 'Blend in with the cleared agents, deduce the secret word from their clues, and avoid elimination.',
    tacticalAdvice: 'Listen closely to earlier speakers. Even if caught, you can steal the win if you deduce the word!',
  },
  undercover: {
    title: 'UNDERCOVER // DECOY DOSSIER',
    shortBadge: 'UNDERCOVER',
    clearanceColor: 'text-amber-tactical border-amber-tactical',
    bgAccent: 'bg-amber-950/40',
    objective: 'You received a closely related DECOY word! Notice if your word differs from the room and adapt.',
    tacticalAdvice: 'Note: In Undercover mode, your dossier looks identical to a Field Agent’s until the debrief!',
  },
  jester: {
    title: 'DOUBLE AGENT // THE JESTER',
    shortBadge: 'JESTER',
    clearanceColor: 'text-purple-400 border-purple-500/60',
    bgAccent: 'bg-purple-950/40',
    objective: 'You know the secret word—but your goal is to act suspiciously enough to get VOTED OUT!',
    tacticalAdvice: 'Give a clue that is slightly off-kilter so the group eliminates you instead of the real Imposter.',
  },
  detective: {
    title: 'DIRECTOR // SPECIAL INVESTIGATOR',
    shortBadge: 'DETECTIVE',
    clearanceColor: 'text-sky-400 border-sky-500/60',
    bgAccent: 'bg-sky-950/40',
    objective: 'Cleared Agent with 1 tactical scan during the Tribunal to verify whether a suspect is Cleared or Suspicious.',
    tacticalAdvice: 'Keep your Detective clearance hidden until the Tribunal vote so the Imposter doesn’t mimic you.',
  },
  accomplice: {
    title: 'THE MOLE // ACCOMPLICE',
    shortBadge: 'ACCOMPLICE',
    clearanceColor: 'text-rose-400 border-rose-500/60',
    bgAccent: 'bg-rose-950/40',
    objective: 'You know BOTH the secret word AND the Imposter’s identity. Help the Imposter survive!',
    tacticalAdvice: 'Drop a clue that secretly helps the Imposter figure out the true word, and deflect votes away from them.',
  },
};

export const CHAOS_MODE_METADATA: Record<
  ChaosMode,
  { name: string; tag: string; description: string }
> = {
  standard: {
    name: 'Standard Protocol',
    tag: 'NORMAL',
    description: 'Exact configured number of Imposters and Special Roles.',
  },
  all_imposters: {
    name: 'Troll Mode: All Imposters',
    tag: 'CHAOS',
    description: 'EVERYONE is secretly an Imposter with only a subtle clue! Nobody actually knows the word.',
  },
  zero_imposters: {
    name: 'Paranoia: Zero Imposters',
    tag: 'MINDGAME',
    description: 'EVERYONE is a Cleared Agent with the exact same word—watch the room accuse each other over nothing!',
  },
  mystery_count: {
    name: 'Blind Clearance (Mystery Count)',
    tag: 'REDACTED',
    description: 'Randomizes 1 to 3 Imposters each round without telling the room how many exist.',
  },
  random_chaos: {
    name: 'Russian Roulette (Random Chaos)',
    tag: 'WILDCARD',
    description: '65% Standard Protocol, 35% surprise Troll/Paranoia/Mystery twist each mission.',
  },
};

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildImposterHint(
  entry: WordEntry,
  hintStyle: HintStyle,
  forceHintForChaos = false
): string | null {
  const cleanWord = entry.word.trim();
  const firstChar = cleanWord[0]?.toUpperCase() || '?';
  const wordCount = cleanWord.split(/\s+/).length;
  const letterMeta = `Starts with "${firstChar}" (${cleanWord.length} chars, ${wordCount} ${wordCount === 1 ? 'word' : 'words'})`;

  if (hintStyle === 'none') {
    return forceHintForChaos ? `INTEL CLUE: ${entry.hint}` : null;
  }
  if (hintStyle === 'subtle_clue') {
    return entry.hint;
  }
  if (hintStyle === 'first_letter') {
    return letterMeta;
  }
  return `${entry.hint} • ${letterMeta}`;
}

export function resolveActiveChaos(configuredChaos: ChaosMode): ChaosMode {
  if (configuredChaos !== 'random_chaos') {
    return configuredChaos;
  }
  const roll = Math.random();
  if (roll < 0.65) return 'standard';
  if (roll < 0.78) return 'all_imposters';
  if (roll < 0.89) return 'zero_imposters';
  return 'mystery_count';
}

export function createRoundState(
  players: Player[],
  settings: GameSettings,
  categories: CategoryDeck[],
  usedWords: Set<string>,
  roundNumber: number
): RoundState {
  // 1. Filter selected categories (fallback to all categories if none matched)
  const matchingDecks = categories.filter((c) =>
    settings.selectedCategoryIds.includes(c.id)
  );
  const poolDecks = matchingDecks.length > 0 ? matchingDecks : categories;
  const chosenDeck = poolDecks[Math.floor(Math.random() * poolDecks.length)];

  // 2. Pick an unplayed word from chosenDeck (or reset if all played)
  const unplayedWords = chosenDeck.words.filter(
    (w) => !usedWords.has(`${chosenDeck.id}:${w.word}`)
  );
  const candidateWords =
    unplayedWords.length > 0 ? unplayedWords : chosenDeck.words;
  const chosenEntry =
    candidateWords[Math.floor(Math.random() * candidateWords.length)];

  usedWords.add(`${chosenDeck.id}:${chosenEntry.word}`);

  // 3. Build 6-word tactical lineup for Imposter's Last Chance Steal
  const distractors = shuffleArray(
    chosenDeck.words
      .map((w) => w.word)
      .filter(
        (w) =>
          w.toLowerCase() !== chosenEntry.word.toLowerCase() &&
          w.toLowerCase() !== chosenEntry.decoy.toLowerCase()
      )
  ).slice(0, 4);

  const rawLineup = Array.from(
    new Set([chosenEntry.word, chosenEntry.decoy, ...distractors])
  );
  // Ensure 6 options if deck has enough words
  for (const w of chosenDeck.words) {
    if (rawLineup.length >= 6) break;
    if (!rawLineup.includes(w.word)) rawLineup.push(w.word);
  }
  const lineupOptions = shuffleArray(rawLineup.slice(0, 6));

  // 4. Determine Chaos Mode for this round
  const activeChaos = resolveActiveChaos(settings.chaosMode);

  // 5. Assign Roles across players
  const shuffledPlayers = shuffleArray(players);
  const totalPlayers = shuffledPlayers.length;
  const assignments: Record<string, AssignedPlayerRole> = {};

  if (activeChaos === 'all_imposters') {
    // Everyone is an imposter with a hint so everyone bluffs!
    const sharedHint = buildImposterHint(chosenEntry, settings.hintStyle, true);
    for (const p of shuffledPlayers) {
      assignments[p.id] = {
        playerId: p.id,
        playerName: p.name,
        avatar: p.avatar,
        role: 'imposter',
        secretWord: null,
        hintText: sharedHint,
        hasReviewedDossier: false,
      };
    }
  } else if (activeChaos === 'zero_imposters') {
    // Everyone is a civilian with the trueWord!
    for (const p of shuffledPlayers) {
      assignments[p.id] = {
        playerId: p.id,
        playerName: p.name,
        avatar: p.avatar,
        role: 'civilian',
        secretWord: chosenEntry.word,
        hintText: null,
        hasReviewedDossier: false,
      };
    }
  } else {
    // Standard or Mystery Count
    const maxAllowedImposters = Math.max(1, Math.floor((totalPlayers - 1) / 2));
    let targetImposters = Math.min(settings.imposterCount, maxAllowedImposters);

    if (activeChaos === 'mystery_count') {
      const maxMystery = Math.min(3, maxAllowedImposters);
      targetImposters = Math.floor(Math.random() * maxMystery) + 1;
    }

    const hintForImposter = buildImposterHint(
      chosenEntry,
      settings.hintStyle,
      false
    );

    let cursor = 0;
    const imposterPlayers: Player[] = [];

    // Determine how many are standard imposters vs undercover
    let undercoverSlots = 0;
    let standardImposterSlots = targetImposters;

    if (settings.enableUndercover) {
      if (targetImposters >= 2) {
        undercoverSlots = 1;
        standardImposterSlots = targetImposters - 1;
      } else if (totalPlayers >= 5) {
        // Add 1 undercover alongside the 1 imposter
        undercoverSlots = 1;
        standardImposterSlots = 1;
      } else {
        // 3-4 players with 1 outsider & Undercover enabled: make them Undercover
        undercoverSlots = 1;
        standardImposterSlots = 0;
      }
    }

    for (let i = 0; i < standardImposterSlots && cursor < totalPlayers; i++) {
      const p = shuffledPlayers[cursor++];
      imposterPlayers.push(p);
      assignments[p.id] = {
        playerId: p.id,
        playerName: p.name,
        avatar: p.avatar,
        role: 'imposter',
        secretWord: null,
        hintText: hintForImposter,
        hasReviewedDossier: false,
      };
    }

    for (let i = 0; i < undercoverSlots && cursor < totalPlayers; i++) {
      const p = shuffledPlayers[cursor++];
      imposterPlayers.push(p);
      assignments[p.id] = {
        playerId: p.id,
        playerName: p.name,
        avatar: p.avatar,
        role: 'undercover',
        secretWord: chosenEntry.decoy,
        hintText: null,
        hasReviewedDossier: false,
      };
    }

    // Optional Special Roles from remaining players
    if (settings.enableJester && cursor < totalPlayers - 1) {
      const p = shuffledPlayers[cursor++];
      assignments[p.id] = {
        playerId: p.id,
        playerName: p.name,
        avatar: p.avatar,
        role: 'jester',
        secretWord: chosenEntry.word,
        hintText: 'MISSION: Act subtly suspicious so the group votes YOU out!',
        hasReviewedDossier: false,
      };
    }

    if (settings.enableDetective && cursor < totalPlayers - 1) {
      const p = shuffledPlayers[cursor++];
      assignments[p.id] = {
        playerId: p.id,
        playerName: p.name,
        avatar: p.avatar,
        role: 'detective',
        secretWord: chosenEntry.word,
        hintText: 'ABILITY: You can scan 1 suspect’s clearance during the Tribunal.',
        hasReviewedDossier: false,
      };
    }

    if (
      settings.enableAccomplice &&
      totalPlayers >= 5 &&
      imposterPlayers.length > 0 &&
      cursor < totalPlayers - 1
    ) {
      const p = shuffledPlayers[cursor++];
      assignments[p.id] = {
        playerId: p.id,
        playerName: p.name,
        avatar: p.avatar,
        role: 'accomplice',
        secretWord: chosenEntry.word,
        hintText: `PROTECT IMPOSTER: ${imposterPlayers.map((imp) => imp.name).join(', ')}`,
        knownImposterNames: imposterPlayers.map((imp) => imp.name),
        hasReviewedDossier: false,
      };
    }

    // Remaining players are standard Cleared Civilians
    while (cursor < totalPlayers) {
      const p = shuffledPlayers[cursor++];
      assignments[p.id] = {
        playerId: p.id,
        playerName: p.name,
        avatar: p.avatar,
        role: 'civilian',
        secretWord: chosenEntry.word,
        hintText: null,
        hasReviewedDossier: false,
      };
    }

    // Populate co-imposter awareness if enabled
    if (settings.impostersKnowEachOther && imposterPlayers.length > 1) {
      const allImpNames = imposterPlayers.map((imp) => imp.name);
      for (const imp of imposterPlayers) {
        if (assignments[imp.id].role === 'imposter') {
          assignments[imp.id].knownImposterNames = allImpNames.filter(
            (n) => n !== imp.name
          );
        }
      }
    }
  }

  // 6. Determine Speaking Order (respecting imposterNeverFirst if enabled)
  const speakingOrder = shuffleArray(players.map((p) => p.id));
  if (settings.imposterNeverFirst && speakingOrder.length > 1) {
    const firstId = speakingOrder[0];
    if (assignments[firstId]?.role === 'imposter') {
      const nonImposterIdx = speakingOrder.findIndex(
        (id) => assignments[id]?.role !== 'imposter'
      );
      if (nonImposterIdx > 0) {
        [speakingOrder[0], speakingOrder[nonImposterIdx]] = [
          speakingOrder[nonImposterIdx],
          speakingOrder[0],
        ];
      }
    }
  }

  // OrderPassAndPlay reveal in the original player list order so passing the phone around a circle is natural
  return {
    roundNumber,
    categoryId: chosenDeck.id,
    categoryName: chosenDeck.name,
    categoryCodename: chosenDeck.codename,
    trueWord: chosenEntry.word,
    trueHint: chosenEntry.hint,
    decoyWord: chosenEntry.decoy,
    lineupOptions,
    assignments,
    activePlayerIds: players.map((p) => p.id),
    eliminatedHistory: [],
    voteCycle: 1,
    speakingOrder,
    currentSpeakerIndex: 0,
    currentClueCycle: 1,
    revealIndex: 0,
    detectiveScannedPlayerId: null,
    activeChaosApplied: activeChaos,
    outcome: null,
  };
}

/**
 * Advances the round to the next survival vote cycle when an innocent was eliminated.
 * Removes eliminated players from activePlayerIds and resets clues for the remaining players.
 */
export function advanceToNextSurvivalRound(
  round: RoundState,
  newlyEliminatedIds: string[],
  imposterNeverFirst = true
): RoundState {
  const nextActiveIds = round.activePlayerIds.filter(
    (id) => !newlyEliminatedIds.includes(id)
  );
  const newHistory = [
    ...round.eliminatedHistory,
    ...newlyEliminatedIds.map((id) => ({
      playerId: id,
      round: round.voteCycle,
      role: round.assignments[id]?.role || 'civilian',
    })),
  ];

  // Clear previous clues for active players so Round 2+ starts fresh
  const updatedAssignments = { ...round.assignments };
  for (const id of nextActiveIds) {
    if (updatedAssignments[id]) {
      updatedAssignments[id] = {
        ...updatedAssignments[id],
        clueGiven: undefined,
      };
    }
  }

  const nextSpeakingOrder = shuffleArray(nextActiveIds);
  if (imposterNeverFirst && nextSpeakingOrder.length > 1) {
    const firstId = nextSpeakingOrder[0];
    if (updatedAssignments[firstId]?.role === 'imposter') {
      const nonImpIdx = nextSpeakingOrder.findIndex(
        (id) => updatedAssignments[id]?.role !== 'imposter'
      );
      if (nonImpIdx > 0) {
        [nextSpeakingOrder[0], nextSpeakingOrder[nonImpIdx]] = [
          nextSpeakingOrder[nonImpIdx],
          nextSpeakingOrder[0],
        ];
      }
    }
  }

  return {
    ...round,
    assignments: updatedAssignments,
    activePlayerIds: nextActiveIds,
    eliminatedHistory: newHistory,
    voteCycle: round.voteCycle + 1,
    speakingOrder: nextSpeakingOrder,
    currentSpeakerIndex: 0,
  };
}

export function getCivilianRewardForCycle(voteCycle: number): number {
  if (voteCycle <= 1) return 150;
  if (voteCycle === 2) return 100;
  return 50;
}

/**
 * Evaluates the Tribunal Vote and computes either an immediate RoundOutcome,
 * triggers Survival Round continuation, or triggers Last-Chance Word Steal.
 */
export function evaluateTribunalResolution(
  round: RoundState,
  eliminatedPlayerIds: string[],
  votedNoImposter = false,
  enableSurvivalRounds = false
): {
  continueToNextRound?: boolean;
  clearedEliminatedIds?: string[];
  remainingCount?: number;
  needsLastChanceSteal: boolean;
  caughtImposterIds: string[];
  preliminaryOutcome: RoundOutcome;
} {
  const assignmentsList = Object.values(round.assignments);
  const allImposterIds = assignmentsList
    .filter((a) => a.role === 'imposter' || a.role === 'undercover')
    .map((a) => a.playerId);

  const scoreDeltas: Record<string, { points: number; reason: string }> = {};
  for (const a of assignmentsList) {
    scoreDeltas[a.playerId] = { points: 0, reason: 'Participated in mission' };
  }

  // Special Case 1: Zero Imposters (Paranoia Mode)
  if (round.activeChaosApplied === 'zero_imposters') {
    if (votedNoImposter || eliminatedPlayerIds.length === 0) {
      for (const a of assignmentsList) {
        scoreDeltas[a.playerId] = {
          points: 150,
          reason: 'Identified Paranoia False Alarm (0 Imposters)',
        };
      }
      return {
        needsLastChanceSteal: false,
        caughtImposterIds: [],
        preliminaryOutcome: {
          winnerTeam: 'civilians',
          headline: 'PARANOIA DEFEATED // ZERO IMPOSTERS',
          subheadline:
            'Every single agent was cleared! The squad saw through the false alarm.',
          eliminatedPlayerIds: [],
          imposterCaught: false,
          imposterStoleVictory: false,
          activeChaosApplied: round.activeChaosApplied,
          scoreDeltas,
        },
      };
    } else {
      // Group falsely eliminated an innocent agent in Paranoia mode!
      for (const id of eliminatedPlayerIds) {
        scoreDeltas[id] = {
          points: 100,
          reason: 'Wrongfully accused in Paranoia Mode (Sympathy Bonus)',
        };
      }
      return {
        needsLastChanceSteal: false,
        caughtImposterIds: [],
        preliminaryOutcome: {
          winnerTeam: 'no_one',
          headline: 'FRIENDLY FIRE // ZERO IMPOSTERS EXISTED!',
          subheadline:
            'Paranoia Twist: Everyone had the exact same word, yet you still voted out one of your own!',
          eliminatedPlayerIds,
          imposterCaught: false,
          imposterStoleVictory: false,
          activeChaosApplied: round.activeChaosApplied,
          scoreDeltas,
        },
      };
    }
  }

  // Special Case 2: All Imposters (Troll Mode)
  if (round.activeChaosApplied === 'all_imposters') {
    for (const a of assignmentsList) {
      const wasEliminated = eliminatedPlayerIds.includes(a.playerId);
      scoreDeltas[a.playerId] = {
        points: wasEliminated ? 50 : 150,
        reason: wasEliminated
          ? 'Scapegoated in All-Imposters Troll Mode'
          : 'Survived All-Imposters Chaos!',
      };
    }
    return {
      needsLastChanceSteal: false,
      caughtImposterIds: eliminatedPlayerIds,
      preliminaryOutcome: {
        winnerTeam: 'imposters',
        headline: 'TROLL PROTOCOL // EVERYONE WAS AN IMPOSTER!',
        subheadline: `Nobody knew the secret word ("${round.trueWord}")—every agent in the room was bluffing!`,
        eliminatedPlayerIds,
        imposterCaught: true,
        imposterStoleVictory: false,
        activeChaosApplied: round.activeChaosApplied,
        scoreDeltas,
      },
    };
  }

  // Special Case 3: Did the group vote out the JESTER?
  const eliminatedJester = eliminatedPlayerIds
    .map((id) => round.assignments[id])
    .find((a) => a && a.role === 'jester');

  if (eliminatedJester) {
    scoreDeltas[eliminatedJester.playerId] = {
      points: 300,
      reason: 'JESTER MASTERMIND: Successfully tricked the Tribunal into voting you out!',
    };
    return {
      needsLastChanceSteal: false,
      caughtImposterIds: [],
      preliminaryOutcome: {
        winnerTeam: 'jester',
        headline: `JESTER VICTORY // ${eliminatedJester.playerName.toUpperCase()} PLAYED YOU ALL!`,
        subheadline: `${eliminatedJester.playerName} was the Double Agent Jester and wanted to be eliminated!`,
        eliminatedPlayerIds,
        imposterCaught: false,
        imposterStoleVictory: false,
        activeChaosApplied: round.activeChaosApplied,
        scoreDeltas,
      },
    };
  }

  // Standard / Mystery Count check: Were any imposters/undercovers eliminated?
  const caughtImposterIds = eliminatedPlayerIds.filter((id) =>
    allImposterIds.includes(id)
  );
  const imposterCaught = caughtImposterIds.length > 0;

  if (imposterCaught) {
    const civilianReward = getCivilianRewardForCycle(round.voteCycle);
    const rewardNote =
      round.voteCycle > 1
        ? `Caught Imposter in Round ${round.voteCycle} (Reduced Reward)`
        : 'Neutralized the Imposter at the Tribunal';

    for (const a of assignmentsList) {
      if (a.role === 'civilian' || a.role === 'detective') {
        scoreDeltas[a.playerId] = {
          points: civilianReward,
          reason: rewardNote,
        };
      } else if (caughtImposterIds.includes(a.playerId)) {
        scoreDeltas[a.playerId] = {
          points: 0,
          reason: 'Exposed during Tribunal interrogation',
        };
      } else if (a.role === 'imposter' || a.role === 'undercover') {
        scoreDeltas[a.playerId] = {
          points: 100,
          reason: 'Remained undetected while co-imposter was caught',
        };
      }
    }

    const caughtNames = caughtImposterIds
      .map((id) => round.assignments[id]?.playerName)
      .join(' & ');

    return {
      needsLastChanceSteal: true,
      caughtImposterIds,
      preliminaryOutcome: {
        winnerTeam: 'civilians',
        headline: `TARGET NEUTRALIZED // ${caughtNames.toUpperCase()} EXPOSED!`,
        subheadline: `The Agency successfully unmasked ${caughtNames}${
          round.voteCycle > 1 ? ` on Round ${round.voteCycle} (+${civilianReward} pts)` : ''
        }.`,
        eliminatedPlayerIds,
        imposterCaught: true,
        imposterStoleVictory: false,
        activeChaosApplied: round.activeChaosApplied,
        scoreDeltas,
      },
    };
  } else {
    // Check if Survival Rounds is enabled and enough players (>= 3) + at least 1 Imposter remain
    const remainingIds = round.activePlayerIds.filter(
      (id) => !eliminatedPlayerIds.includes(id)
    );
    const remainingImposters = remainingIds.filter((id) => {
      const role = round.assignments[id]?.role;
      return role === 'imposter' || role === 'undercover';
    });

    if (
      enableSurvivalRounds &&
      !votedNoImposter &&
      eliminatedPlayerIds.length > 0 &&
      remainingIds.length >= 3 &&
      remainingImposters.length > 0
    ) {
      return {
        continueToNextRound: true,
        clearedEliminatedIds: eliminatedPlayerIds,
        remainingCount: remainingIds.length,
        needsLastChanceSteal: false,
        caughtImposterIds: [],
        preliminaryOutcome: {
          winnerTeam: 'no_one',
          headline: 'INNOCENT ELIMINATED // CONTINUING TO NEXT ROUND',
          subheadline: `${remainingIds.length} players remain, and ${remainingImposters.length} Imposter is still among you.`,
          eliminatedPlayerIds,
          imposterCaught: false,
          imposterStoleVictory: false,
          activeChaosApplied: round.activeChaosApplied,
          scoreDeltas,
        },
      };
    }

    // Imposters escaped!
    for (const a of assignmentsList) {
      if (a.role === 'imposter' || a.role === 'undercover') {
        scoreDeltas[a.playerId] = {
          points: 250,
          reason: 'Deceived the entire Tribunal undetected!',
        };
      } else if (a.role === 'accomplice') {
        scoreDeltas[a.playerId] = {
          points: 200,
          reason: 'Protected the Imposter as the Mole!',
        };
      } else {
        scoreDeltas[a.playerId] = {
          points: 0,
          reason: 'Eliminated an innocent agent while Imposter escaped',
        };
      }
    }

    const imposterNames = allImposterIds
      .map((id) => round.assignments[id]?.playerName)
      .join(' & ');

    return {
      needsLastChanceSteal: false,
      caughtImposterIds: [],
      preliminaryOutcome: {
        winnerTeam: 'imposters',
        headline: `INFILTRATION SUCCESS // IMPOSTER ESCAPED!`,
        subheadline: `The Tribunal eliminated the wrong suspect! ${imposterNames} got away clean.`,
        eliminatedPlayerIds,
        imposterCaught: false,
        imposterStoleVictory: false,
        activeChaosApplied: round.activeChaosApplied,
        scoreDeltas,
      },
    };
  }
}

/**
 * Resolves the caught Imposter's Last-Chance Word Guess.
 * If the Imposter guesses `trueWord`, they steal the victory!
 */
export function resolveLastChanceSteal(
  round: RoundState,
  preliminaryOutcome: RoundOutcome,
  guessedWord: string
): RoundOutcome {
  const cleanGuess = guessedWord.trim().toLowerCase();
  const cleanTrue = round.trueWord.trim().toLowerCase();
  const stoleWin = cleanGuess.length > 0 && cleanGuess === cleanTrue;

  const assignmentsList = Object.values(round.assignments);
  const updatedDeltas = { ...preliminaryOutcome.scoreDeltas };

  if (stoleWin) {
    for (const a of assignmentsList) {
      if (a.role === 'imposter' || a.role === 'undercover') {
        updatedDeltas[a.playerId] = {
          points: 225,
          reason: `HEIST COMPLETE: Deduced the secret word ("${round.trueWord}") under pressure!`,
        };
      } else if (a.role === 'accomplice') {
        updatedDeltas[a.playerId] = {
          points: 150,
          reason: 'Assisted Imposter in deducing the target word',
        };
      } else {
        updatedDeltas[a.playerId] = {
          points: 50,
          reason: 'Caught the Imposter, but clues gave away the secret word',
        };
      }
    }

    return {
      ...preliminaryOutcome,
      winnerTeam: 'imposters',
      headline: 'CLASSIFIED BREACH // IMPOSTER STOLE THE WIN!',
      subheadline: `Even after being unmasked, the Imposter correctly deduced the secret word: "${round.trueWord}"!`,
      imposterStoleVictory: true,
      imposterGuessWord: guessedWord,
      scoreDeltas: updatedDeltas,
    };
  } else {
    return {
      ...preliminaryOutcome,
      winnerTeam: 'civilians',
      headline: preliminaryOutcome.headline,
      subheadline: `${preliminaryOutcome.subheadline} Last-chance guess ("${guessedWord || 'TIME EXPIRED'}") failed!`,
      imposterStoleVictory: false,
      imposterGuessWord: guessedWord || 'TIME EXPIRED',
      scoreDeltas: updatedDeltas,
    };
  }
}
