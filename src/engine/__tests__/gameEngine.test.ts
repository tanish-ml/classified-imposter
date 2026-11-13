import { describe, expect, it } from 'vitest';
import {
  BUILTIN_CATEGORIES,
  decodeDeckShareCode,
  encodeDeckShareCode,
  generateSmartCustomDeck,
} from '../../data/categories';
import { GameSettings, Player } from '../../types/game';
import {
  advanceToNextSurvivalRound,
  createRoundState,
  evaluateTribunalResolution,
  resolveLastChanceSteal,
} from '../gameEngine';

const samplePlayers: Player[] = [
  { id: 'p1', name: 'Agent Vance', avatar: '🕵️', score: 0, streak: 0 },
  { id: 'p2', name: 'Agent Cipher', avatar: '🕶️', score: 0, streak: 0 },
  { id: 'p3', name: 'Agent Rook', avatar: '🦊', score: 0, streak: 0 },
  { id: 'p4', name: 'Agent Nyx', avatar: '🐺', score: 0, streak: 0 },
  { id: 'p5', name: 'Agent Kestrel', avatar: '🦅', score: 0, streak: 0 },
  { id: 'p6', name: 'Agent Viper', avatar: '🐍', score: 0, streak: 0 },
];

const baseSettings: GameSettings = {
  playMode: 'pass_and_play',
  imposterCount: 1,
  hintStyle: 'subtle_clue',
  enableUndercover: false,
  enableJester: false,
  enableDetective: false,
  enableAccomplice: false,
  impostersKnowEachOther: true,
  imposterNeverFirst: true,
  chaosMode: 'standard',
  discussionSeconds: 180,
  clueRounds: 1,
  enableSurvivalRounds: false,
  enableLastChanceSteal: true,
  lastChanceMode: 'lineup',
  selectedCategoryIds: ['food_drink'],
  soundEnabled: true,
  hapticsEnabled: true,
};

describe('Classified Imposter Word Bank & Categories', () => {
  it('provides 32 unlocked categories with 1,600+ curated word triples', () => {
    expect(BUILTIN_CATEGORIES.length).toBeGreaterThanOrEqual(32);

    let totalWords = 0;
    for (const deck of BUILTIN_CATEGORIES) {
      expect(deck.words.length).toBeGreaterThanOrEqual(45);
      for (const entry of deck.words) {
        expect(entry.word.trim().length).toBeGreaterThan(0);
        expect(entry.hint.trim().length).toBeGreaterThan(0);
        expect(entry.decoy.trim().length).toBeGreaterThan(0);
      }
      totalWords += deck.words.length;
    }

    expect(totalWords).toBeGreaterThanOrEqual(1600);
  });

  it('encodes, decodes, and smart-generates custom dossiers accurately', () => {
    const generated = generateSmartCustomDeck(
      'Vegas Heist Crew',
      'Bellagio Fountain, Craps Table, Penthouse Keycard, Elvis Impersonator'
    );
    expect(generated.isCustom).toBe(true);
    expect(generated.words.length).toBeGreaterThanOrEqual(15);

    const shareCode = encodeDeckShareCode(generated);
    expect(shareCode.startsWith('DOSSIER1:')).toBe(true);

    const decoded = decodeDeckShareCode(shareCode);
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe('Vegas Heist Crew');
    expect(decoded?.words.length).toBe(generated.words.length);
    expect(decoded?.words[0].word).toBe('Bellagio Fountain');
  });
});

describe('Game Engine Role Distribution & Fairness', () => {
  it('assigns exact imposter and civilian counts in standard mode', () => {
    const used = new Set<string>();
    const round = createRoundState(
      samplePlayers,
      { ...baseSettings, imposterCount: 2 },
      BUILTIN_CATEGORIES,
      used,
      1
    );

    const roles = Object.values(round.assignments);
    const imposters = roles.filter((r) => r.role === 'imposter');
    const civilians = roles.filter((r) => r.role === 'civilian');

    expect(imposters.length).toBe(2);
    expect(civilians.length).toBe(4);
    expect(round.lineupOptions).toContain(round.trueWord);
    expect(round.lineupOptions.length).toBe(6);

    // Imposter gets hint, no secret word
    for (const imp of imposters) {
      expect(imp.secretWord).toBeNull();
      expect(imp.hintText).toBe(round.trueHint);
    }
    // Civilians get secret word
    for (const civ of civilians) {
      expect(civ.secretWord).toBe(round.trueWord);
    }
  });

  it('enforces imposterNeverFirst speaking order guard across 30 rounds', () => {
    const used = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const round = createRoundState(
        samplePlayers,
        { ...baseSettings, imposterNeverFirst: true },
        BUILTIN_CATEGORIES,
        used,
        i + 1
      );
      const firstSpeakerId = round.speakingOrder[0];
      expect(round.assignments[firstSpeakerId].role).not.toBe('imposter');
    }
  });

  it('assigns Undercover, Jester, Detective, and Accomplice roles when enabled', () => {
    const used = new Set<string>();
    const round = createRoundState(
      samplePlayers,
      {
        ...baseSettings,
        imposterCount: 1,
        enableUndercover: true,
        enableJester: true,
        enableDetective: true,
        enableAccomplice: true,
      },
      BUILTIN_CATEGORIES,
      used,
      1
    );

    const roles = Object.values(round.assignments);
    expect(roles.some((r) => r.role === 'imposter')).toBe(true);
    expect(roles.some((r) => r.role === 'undercover')).toBe(true);
    expect(roles.some((r) => r.role === 'jester')).toBe(true);
    expect(roles.some((r) => r.role === 'detective')).toBe(true);
    expect(roles.some((r) => r.role === 'accomplice')).toBe(true);

    const undercover = roles.find((r) => r.role === 'undercover')!;
    expect(undercover.secretWord).toBe(round.decoyWord);
  });

  it('supports Troll Mode (All Imposters) and Paranoia Mode (Zero Imposters)', () => {
    const used = new Set<string>();
    const allImpRound = createRoundState(
      samplePlayers,
      { ...baseSettings, chaosMode: 'all_imposters' },
      BUILTIN_CATEGORIES,
      used,
      1
    );
    expect(
      Object.values(allImpRound.assignments).every((a) => a.role === 'imposter')
    ).toBe(true);

    const zeroImpRound = createRoundState(
      samplePlayers,
      { ...baseSettings, chaosMode: 'zero_imposters' },
      BUILTIN_CATEGORIES,
      used,
      2
    );
    expect(
      Object.values(zeroImpRound.assignments).every((a) => a.role === 'civilian')
    ).toBe(true);
  });
});

describe('Tribunal Resolution & Last-Chance Word Steal', () => {
  it('triggers Last-Chance Steal when Imposter is caught and allows stealing the win', () => {
    const used = new Set<string>();
    const round = createRoundState(
      samplePlayers,
      baseSettings,
      BUILTIN_CATEGORIES,
      used,
      1
    );

    const imposter = Object.values(round.assignments).find(
      (a) => a.role === 'imposter'
    )!;

    const evalResult = evaluateTribunalResolution(round, [imposter.playerId]);
    expect(evalResult.needsLastChanceSteal).toBe(true);
    expect(evalResult.caughtImposterIds).toContain(imposter.playerId);

    // 1. Imposter guesses WRONG -> Civilians keep victory
    const failedSteal = resolveLastChanceSteal(
      round,
      evalResult.preliminaryOutcome,
      'Totally Wrong Word'
    );
    expect(failedSteal.winnerTeam).toBe('civilians');
    expect(failedSteal.imposterStoleVictory).toBe(false);

    // 2. Imposter guesses RIGHT -> Imposter steals victory!
    const successSteal = resolveLastChanceSteal(
      round,
      evalResult.preliminaryOutcome,
      round.trueWord
    );
    expect(successSteal.winnerTeam).toBe('imposters');
    expect(successSteal.imposterStoleVictory).toBe(true);
    expect(successSteal.scoreDeltas[imposter.playerId].points).toBe(225);
  });

  it('awards Jester solo victory when the Jester is voted out', () => {
    const used = new Set<string>();
    const round = createRoundState(
      samplePlayers,
      { ...baseSettings, enableJester: true },
      BUILTIN_CATEGORIES,
      used,
      1
    );

    const jester = Object.values(round.assignments).find(
      (a) => a.role === 'jester'
    )!;

    const evalResult = evaluateTribunalResolution(round, [jester.playerId]);
    expect(evalResult.needsLastChanceSteal).toBe(false);
    expect(evalResult.preliminaryOutcome.winnerTeam).toBe('jester');
    expect(
      evalResult.preliminaryOutcome.scoreDeltas[jester.playerId].points
    ).toBe(300);
  });

  it('awards Imposter escape victory when an innocent Civilian is eliminated', () => {
    const used = new Set<string>();
    const round = createRoundState(
      samplePlayers,
      baseSettings,
      BUILTIN_CATEGORIES,
      used,
      1
    );

    const civilian = Object.values(round.assignments).find(
      (a) => a.role === 'civilian'
    )!;
    const imposter = Object.values(round.assignments).find(
      (a) => a.role === 'imposter'
    )!;

    const evalResult = evaluateTribunalResolution(round, [civilian.playerId]);
    expect(evalResult.needsLastChanceSteal).toBe(false);
    expect(evalResult.preliminaryOutcome.winnerTeam).toBe('imposters');
    expect(
      evalResult.preliminaryOutcome.scoreDeltas[imposter.playerId].points
    ).toBe(250);
  });

  it('resolves Paranoia Mode (Zero Imposters) accurately on both Call Paranoia and Friendly Fire', () => {
    const used = new Set<string>();
    const round = createRoundState(
      samplePlayers,
      { ...baseSettings, chaosMode: 'zero_imposters' },
      BUILTIN_CATEGORIES,
      used,
      1
    );

    // 1. Group calls Paranoia (0 Imposters Present) -> Civilians win!
    const clearResult = evaluateTribunalResolution(round, [], true);
    expect(clearResult.preliminaryOutcome.winnerTeam).toBe('civilians');

    // 2. Group votes out an innocent player -> Friendly Fire!
    const friendlyFire = evaluateTribunalResolution(
      round,
      [samplePlayers[0].id],
      false
    );
    expect(friendlyFire.preliminaryOutcome.winnerTeam).toBe('no_one');
  });

  it('formats all 4 HintStyles accurately for Imposters', () => {
    const used = new Set<string>();
    const roundNone = createRoundState(
      samplePlayers,
      { ...baseSettings, hintStyle: 'none' },
      BUILTIN_CATEGORIES,
      used,
      1
    );
    const impNone = Object.values(roundNone.assignments).find(
      (a) => a.role === 'imposter'
    )!;
    expect(impNone.hintText).toBeNull();

    const roundLetter = createRoundState(
      samplePlayers,
      { ...baseSettings, hintStyle: 'first_letter' },
      BUILTIN_CATEGORIES,
      used,
      2
    );
    const impLetter = Object.values(roundLetter.assignments).find(
      (a) => a.role === 'imposter'
    )!;
    expect(impLetter.hintText).toContain('Starts with');

    const roundBoth = createRoundState(
      samplePlayers,
      { ...baseSettings, hintStyle: 'both' },
      BUILTIN_CATEGORIES,
      used,
      3
    );
    const impBoth = Object.values(roundBoth.assignments).find(
      (a) => a.role === 'imposter'
    )!;
    expect(impBoth.hintText).toContain(roundBoth.trueHint);
    expect(impBoth.hintText).toContain('Starts with');
  });

  it('continues to Round 2 with 3 players and reduced points (100 PTS) when 4-player Round 1 misses Imposter', () => {
    const fourPlayers = samplePlayers.slice(0, 4);
    const used = new Set<string>();
    const round1 = createRoundState(
      fourPlayers,
      { ...baseSettings, enableSurvivalRounds: true },
      BUILTIN_CATEGORIES,
      used,
      1
    );

    const civilians = Object.values(round1.assignments).filter(
      (a) => a.role === 'civilian'
    );
    const imposter = Object.values(round1.assignments).find(
      (a) => a.role === 'imposter'
    )!;

    // Vote out an innocent Civilian on Round 1
    const res1 = evaluateTribunalResolution(
      round1,
      [civilians[0].playerId],
      false,
      true
    );
    expect(res1.continueToNextRound).toBe(true);
    expect(res1.remainingCount).toBe(3);

    // Advance to Round 2
    const round2 = advanceToNextSurvivalRound(round1, [civilians[0].playerId]);
    expect(round2.voteCycle).toBe(2);
    expect(round2.activePlayerIds.length).toBe(3);
    expect(round2.activePlayerIds).not.toContain(civilians[0].playerId);

    // Catch Imposter on Round 2 -> Civilians earn reduced 100 PTS instead of 150 PTS
    const res2 = evaluateTribunalResolution(
      round2,
      [imposter.playerId],
      false,
      true
    );
    expect(res2.needsLastChanceSteal).toBe(true);
    expect(res2.preliminaryOutcome.scoreDeltas[civilians[1].playerId].points).toBe(
      100
    );

    // If Round 2 ALSO misses the Imposter (only 2 left), Imposter wins 250 PTS
    const res2Miss = evaluateTribunalResolution(
      round2,
      [civilians[1].playerId],
      false,
      true
    );
    expect(res2Miss.continueToNextRound).toBeFalsy();
    expect(res2Miss.preliminaryOutcome.winnerTeam).toBe('imposters');
    expect(res2Miss.preliminaryOutcome.scoreDeltas[imposter.playerId].points).toBe(
      250
    );
  });

  it('does not duplicate INTEL CLUE prefix in All-Imposters mode when hintStyle is none', () => {
    const used = new Set<string>();
    const round = createRoundState(
      samplePlayers,
      { ...baseSettings, chaosMode: 'all_imposters', hintStyle: 'none' },
      BUILTIN_CATEGORIES,
      used,
      1
    );

    const anyPlayer = Object.values(round.assignments)[0];
    expect(anyPlayer.role).toBe('imposter');
    expect(anyPlayer.hintText).toBe(round.trueHint);
    expect(anyPlayer.hintText).not.toMatch(/^INTEL CLUE:/i);
  });
});
