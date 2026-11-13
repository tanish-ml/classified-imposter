export type PlayMode = 'pass_and_play' | 'live_room';

export type RoleType =
  | 'civilian'    // Knows the secret word
  | 'imposter'    // Doesn't know the secret word (may get hint if enabled)
  | 'undercover'  // Receives a closely related decoy word; thinks they are a Civilian!
  | 'jester'      // Knows the secret word, wins SOLO if voted out by the group!
  | 'detective'   // Civilian with a 1-time ability to scan a player or cast a 2x weight vote
  | 'accomplice'; // Knows the secret word AND knows who the Imposter is; wins with the Imposter!

export type ChaosMode =
  | 'standard'        // Normal rules
  | 'all_imposters'   // TROLL MODE: Everyone is an imposter with only a category/hint!
  | 'zero_imposters'  // PARANOIA MODE: Nobody is an imposter; everyone is a civilian!
  | 'mystery_count'   // Randomizes 1 to maxImposters without telling the group
  | 'random_chaos';   // 20% chance of a secret chaos twist each round

export type HintStyle =
  | 'none'            // Hardcore: Imposter only sees the Category name
  | 'subtle_clue'     // Imposter receives a curated tactical clue word
  | 'first_letter'    // Imposter sees the first letter + word length
  | 'both';           // Imposter receives both the subtle clue and first letter

export type ClearanceTier =
  | 'standard'        // Everyday, Food, Animals, Places, Jobs, Objects
  | 'pop_culture'     // Movies, TV, Gaming, Anime, Music, Celebrities, Superheroes
  | 'lifestyle'       // Gen-Z Slang, Brands, Fast Food, Sports, Cars, College, Luxury
  | 'classified';     // Spicy 18+, Red Flags, Crimes & Heists, Conspiracies, History, Mythology

export interface WordEntry {
  word: string;
  hint: string;
  decoy: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface CategoryDeck {
  id: string;
  name: string;
  codename: string;
  icon: string;
  tier: ClearanceTier;
  description: string;
  isCustom?: boolean;
  isSpicy?: boolean;
  words: WordEntry[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  isHost?: boolean;
  isConnected?: boolean;
  peerId?: string;
}

export interface AssignedPlayerRole {
  playerId: string;
  playerName: string;
  avatar: string;
  role: RoleType;
  secretWord: string | null;     // What this player sees as their word (Civilian word, Undercover decoy, or null)
  hintText: string | null;       // Clue shown to Imposter (or all players in All-Imposters mode)
  knownImposterNames?: string[]; // Shown to Accomplice or co-imposters if co-op awareness is enabled
  hasReviewedDossier: boolean;
  clueGiven?: string;
  votedForId?: string | null;
}

export interface GameSettings {
  playMode: PlayMode;
  imposterCount: number;
  hintStyle: HintStyle;
  enableUndercover: boolean;     // Replaces 1 imposter (or adds 1) with an Undercover agent who gets a decoy word
  enableJester: boolean;         // Adds 1 Jester who wants to be voted out
  enableDetective: boolean;      // Upgrades 1 Civilian to Detective
  enableAccomplice: boolean;     // Upgrades 1 Civilian to Accomplice (for 5+ players)
  impostersKnowEachOther: boolean;
  imposterNeverFirst: boolean;   // Prevents the Imposter from being picked as the #1 speaker
  chaosMode: ChaosMode;
  discussionSeconds: number;     // e.g. 120, 180, 240, 300
  clueRounds: number;            // 1, 2, or 3 clue cycles
  enableSurvivalRounds: boolean; // If imposter isn't caught on vote 1, eliminate suspect & continue with remaining players for reduced pts
  enableLastChanceSteal: boolean;// Caught Imposter gets 15s to guess the secret word from a 6-word lineup or text
  lastChanceMode: 'lineup' | 'text'; // 'lineup' = 6 multiple-choice tactical targets; 'text' = type exact word
  selectedCategoryIds: string[];
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type GamePhase =
  | 'setup'
  | 'lobby'              // For Multi-Device Live Room waiting for players
  | 'dossier_reveal'     // Pass & Play or Live Room secret role reveal
  | 'interrogation'      // Speaking order, clue logger, timer
  | 'tribunal_voting'    // Secret ballot or group elimination vote
  | 'last_chance_steal'  // Caught imposter gets 1 shot to guess the secret word
  | 'debrief';           // Full role reveal, points breakdown & leaderboard

export interface RoundOutcome {
  winnerTeam: 'civilians' | 'imposters' | 'jester' | 'no_one';
  headline: string;
  subheadline: string;
  eliminatedPlayerIds: string[];
  imposterCaught: boolean;
  imposterStoleVictory: boolean;
  imposterGuessWord?: string;
  activeChaosApplied: ChaosMode;
  scoreDeltas: Record<string, { points: number; reason: string }>;
}

export interface RoundState {
  roundNumber: number;
  categoryId: string;
  categoryName: string;
  categoryCodename: string;
  trueWord: string;
  trueHint: string;
  decoyWord: string;
  lineupOptions: string[]; // 6 words from the same category (including trueWord) for Last Chance Steal
  assignments: Record<string, AssignedPlayerRole>;
  activePlayerIds: string[];
  eliminatedHistory: { playerId: string; round: number; role: RoleType }[];
  voteCycle: number;
  speakingOrder: string[]; // Array of playerIds
  currentSpeakerIndex: number;
  currentClueCycle: number;
  revealIndex: number;     // Which player is currently viewing their dossier in Pass & Play
  detectiveScannedPlayerId?: string | null;
  activeChaosApplied: ChaosMode;
  outcome?: RoundOutcome | null;
}

export interface RoomNetworkMessage {
  type:
    | 'JOIN_REQUEST'
    | 'UPDATE_PLAYER'
    | 'LEAVE_ROOM'
    | 'HOST_CLOSED'
    | 'PLAYER_LIST_SYNC'
    | 'ROUND_STARTED'
    | 'SUBMIT_CLUE'
    | 'SUBMIT_VOTE'
    | 'PHASE_CHANGE'
    | 'LAST_CHANCE_GUESS'
    | 'HOST_STATE_SYNC';
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  payload?: any;
}
