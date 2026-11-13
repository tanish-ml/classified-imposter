import React, { useEffect, useRef, useState } from 'react';
import { CustomDeckModal } from './components/CustomDeckModal';
import { DebriefScoreboard } from './components/DebriefScoreboard';
import { FieldManualModal } from './components/FieldManualModal';
import { HeaderBar } from './components/HeaderBar';
import { InterrogationScreen } from './components/InterrogationScreen';
import { LiveRoomLobby } from './components/LiveRoomLobby';
import { PassAndPlayReveal } from './components/PassAndPlayReveal';
import { SetupScreen } from './components/SetupScreen';
import { TribunalVotingScreen, SurvivalBannerInfo } from './components/TribunalVotingScreen';
import {
  BUILTIN_CATEGORIES,
  getAllCategories,
  loadCustomDecks,
  saveCustomDecks,
} from './data/categories';
import {
  AGENT_AVATARS,
  advanceToNextSurvivalRound,
  createRoundState,
  DEFAULT_AGENT_NAMES,
  evaluateTribunalResolution,
  getCivilianRewardForCycle,
  resolveLastChanceSteal,
} from './engine/gameEngine';
import { roomManager } from './network/roomManager';
import {
  CategoryDeck,
  GamePhase,
  GameSettings,
  Player,
  RoomNetworkMessage,
  RoundOutcome,
  RoundState,
} from './types/game';
import { spyAudio } from './utils/soundEffects';

const PLAYERS_STORAGE_KEY = 'classified_imposter_players_v2';
const SETTINGS_STORAGE_KEY = 'classified_imposter_settings_v2';

const INITIAL_PLAYERS: Player[] = [
  { id: 'p_1', name: 'Agent Vance', avatar: '🕵️', score: 0, streak: 0 },
  { id: 'p_2', name: 'Agent Cipher', avatar: '🕶️', score: 0, streak: 0 },
  { id: 'p_3', name: 'Agent Rook', avatar: '🦊', score: 0, streak: 0 },
  { id: 'p_4', name: 'Agent Nyx', avatar: '🐺', score: 0, streak: 0 },
];

const INITIAL_SETTINGS: GameSettings = {
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
  enableSurvivalRounds: true,
  enableLastChanceSteal: true,
  lastChanceMode: 'lineup',
  selectedCategoryIds: [
    'food_drink',
    'movies_cinema',
    'genz_slang',
    'places_landmarks',
    'celebrities_icons',
  ],
  soundEnabled: true,
  hapticsEnabled: true,
};

export function App() {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(PLAYERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
      }
    } catch {}
    return INITIAL_PLAYERS;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return INITIAL_SETTINGS;
  });

  const [customDecks, setCustomDecks] = useState<CategoryDeck[]>(() =>
    loadCustomDecks()
  );

  const [phase, setPhase] = useState<GamePhase>('setup');
  const [round, setRound] = useState<RoundState | null>(null);
  const [caughtImposterIds, setCaughtImposterIds] = useState<string[]>([]);
  const [preliminaryOutcome, setPreliminaryOutcome] =
    useState<RoundOutcome | null>(null);
  const [survivalBanner, setSurvivalBanner] =
    useState<SurvivalBannerInfo | null>(null);
  const [pendingClearedIds, setPendingClearedIds] = useState<string[]>([]);
  const [roundCounter, setRoundCounter] = useState(1);

  // Modals
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCustomDecksOpen, setIsCustomDecksOpen] = useState(false);

  // Multi-Device Live Room State
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(true);
  const [localPlayerId, setLocalPlayerId] = useState<string>(
    () => `agent_${Math.random().toString(36).slice(2, 9)}`
  );
  const [networkStatus, setNetworkStatus] = useState('');

  const usedWordsRef = useRef<Set<string>>(new Set());
  const playersRef = useRef(players);
  playersRef.current = players;
  const roundRef = useRef(round);
  roundRef.current = round;

  const allCategories = getAllCategories(customDecks);

  // Sync audio settings & persist state
  useEffect(() => {
    spyAudio.soundEnabled = settings.soundEnabled;
    spyAudio.hapticsEnabled = settings.hapticsEnabled;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
    } catch {}
  }, [players]);

  // Send leave signal if user closes or reloads browser tab while in a live room
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomCode) {
        roomManager.sendLeave(localPlayerId);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [roomCode, localPlayerId]);

  // Check URL for ?room=SPY-XXXX deep link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.trim()) {
      const code = roomParam.trim().toUpperCase();
      const randIdx = Math.floor(Math.random() * DEFAULT_AGENT_NAMES.length);
      const guestName = DEFAULT_AGENT_NAMES[randIdx] || 'Field Agent';
      const guestAvatar = AGENT_AVATARS[randIdx % AGENT_AVATARS.length];
      handleJoinLiveRoom(code, guestName, guestAvatar);
    }
  }, []);

  const updateSettings = (patch: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleSaveCustomDecks = (
    decks: CategoryDeck[],
    newlyCreatedId?: string
  ) => {
    setCustomDecks(decks);
    saveCustomDecks(decks);
    if (newlyCreatedId) {
      updateSettings({
        selectedCategoryIds: [
          newlyCreatedId,
          ...settings.selectedCategoryIds,
        ],
      });
    }
  };

  const handleResetLeaderboard = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, streak: 0 })));
  };

  // === PASS & PLAY FLOW ===
  const handleStartPassAndPlay = () => {
    const newRound = createRoundState(
      players,
      settings,
      allCategories,
      usedWordsRef.current,
      roundCounter
    );
    setRound(newRound);
    setCaughtImposterIds([]);
    setPreliminaryOutcome(null);
    setIsHost(true);
    setPhase('dossier_reveal');
  };

  // === MULTI-DEVICE LIVE ROOM FLOW ===
  const handleIncomingNetworkMessage = (msg: RoomNetworkMessage) => {
    if (msg.type === 'JOIN_REQUEST') {
      // Host adds joining client to player list and broadcasts updated list
      setPlayers((prev) => {
        const exists = prev.some((p) => p.id === msg.senderId);
        const updated = exists
          ? prev
          : [
              ...prev,
              {
                id: msg.senderId,
                name: msg.senderName || 'Field Agent',
                avatar: msg.senderAvatar || '🕵️',
                score: 0,
                streak: 0,
              },
            ];
        setTimeout(() => {
          roomManager.send({
            type: 'PLAYER_LIST_SYNC',
            senderId: roomManager.localPlayerId,
            payload: { players: updated },
          });
        }, 50);
        return updated;
      });
    } else if (msg.type === 'UPDATE_PLAYER') {
      if (roomManager.isHost) {
        setPlayers((prev) => {
          const updated = prev.map((p) =>
            p.id === msg.senderId
              ? {
                  ...p,
                  name: msg.senderName ?? p.name,
                  avatar: msg.senderAvatar ?? p.avatar,
                }
              : p
          );
          setTimeout(() => {
            roomManager.send({
              type: 'PLAYER_LIST_SYNC',
              senderId: roomManager.localPlayerId,
              payload: { players: updated },
            });
          }, 30);
          return updated;
        });
      }
    } else if (msg.type === 'LEAVE_ROOM') {
      if (roomManager.isHost) {
        setPlayers((prev) => {
          const updated = prev.filter((p) => p.id !== msg.senderId);
          setTimeout(() => {
            roomManager.send({
              type: 'PLAYER_LIST_SYNC',
              senderId: roomManager.localPlayerId,
              payload: { players: updated },
            });
          }, 30);
          return updated;
        });
      }
    } else if (msg.type === 'HOST_CLOSED') {
      roomManager.cleanup();
      setRoomCode('');
      setPhase('setup');
    } else if (msg.type === 'PLAYER_LIST_SYNC') {
      if (msg.payload?.players) {
        setPlayers(msg.payload.players);
      }
    } else if (msg.type === 'ROUND_STARTED') {
      if (msg.payload?.round && msg.payload?.players) {
        setPlayers(msg.payload.players);
        setRound(msg.payload.round);
        setCaughtImposterIds([]);
        setPreliminaryOutcome(null);
        setSurvivalBanner(null);
        setPhase('dossier_reveal');
        spyAudio.playScannerReveal();
      }
    } else if (msg.type === 'PHASE_CHANGE') {
      if (msg.payload?.phase) {
        setPhase(msg.payload.phase);
      }
      if (msg.payload?.round) {
        setRound(msg.payload.round);
      }
      if (msg.payload?.players) {
        setPlayers(msg.payload.players);
      }
      if (msg.payload?.caughtImposterIds) {
        setCaughtImposterIds(msg.payload.caughtImposterIds);
      }
      if (msg.payload?.preliminaryOutcome) {
        setPreliminaryOutcome(msg.payload.preliminaryOutcome);
      }
      if (msg.payload?.survivalBanner !== undefined) {
        setSurvivalBanner(msg.payload.survivalBanner);
      }
    } else if (msg.type === 'SUBMIT_CLUE') {
      if (msg.payload?.round) {
        setRound(msg.payload.round);
      }
    }
  };

  const handleHostLiveRoom = () => {
    const generatedCode = roomManager.generateRoomCode();
    const hostPlayer: Player = {
      id: localPlayerId,
      name: players[0]?.name || 'Commander Vance',
      avatar: players[0]?.avatar || '🕵️',
      score: players[0]?.score || 0,
      streak: players[0]?.streak || 0,
      isHost: true,
    };
    setPlayers([hostPlayer]);
    setRoomCode(generatedCode);
    setIsHost(true);
    updateSettings({ playMode: 'live_room' });
    setPhase('lobby');

    roomManager.initHost(
      generatedCode,
      localPlayerId,
      handleIncomingNetworkMessage,
      (_status, detail) => {
        if (detail) setNetworkStatus(detail);
      },
      (disconnectedPlayerId) => {
        setPlayers((prev) => {
          const updated = prev.filter((p) => p.id !== disconnectedPlayerId);
          setTimeout(() => {
            roomManager.send({
              type: 'PLAYER_LIST_SYNC',
              senderId: localPlayerId,
              payload: { players: updated },
            });
          }, 30);
          return updated;
        });
      }
    );
  };

  const handleJoinLiveRoom = (
    code: string,
    playerName: string,
    avatar: string
  ) => {
    const cleanCode = code.toUpperCase().trim();
    const clientPlayer: Player = {
      id: localPlayerId,
      name: playerName,
      avatar,
      score: 0,
      streak: 0,
      isHost: false,
    };
    setPlayers([clientPlayer]);
    setRoomCode(cleanCode);
    setIsHost(false);
    updateSettings({ playMode: 'live_room' });
    setPhase('lobby');

    roomManager.initClient(
      cleanCode,
      localPlayerId,
      playerName,
      avatar,
      handleIncomingNetworkMessage,
      (_status, detail) => {
        if (detail) setNetworkStatus(detail);
      }
    );
  };

  const handleUpdatePlayerInfo = (
    playerId: string,
    name: string,
    avatar: string
  ) => {
    const updated = players.map((p) =>
      p.id === playerId ? { ...p, name, avatar } : p
    );
    setPlayers(updated);

    if (isHost) {
      roomManager.send({
        type: 'PLAYER_LIST_SYNC',
        senderId: localPlayerId,
        payload: { players: updated },
      });
    } else {
      roomManager.send({
        type: 'UPDATE_PLAYER',
        senderId: localPlayerId,
        senderName: name,
        senderAvatar: avatar,
      });
    }
  };

  const handleRemovePlayerInLobby = (playerId: string) => {
    const updated = players.filter((p) => p.id !== playerId);
    setPlayers(updated);
    if (isHost) {
      roomManager.send({
        type: 'PLAYER_LIST_SYNC',
        senderId: localPlayerId,
        payload: { players: updated },
      });
    }
  };

  const handleAddBotOrLocalAgentInLobby = (name: string, avatar: string) => {
    const updated = [
      ...players,
      {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        avatar,
        score: 0,
        streak: 0,
      },
    ];
    setPlayers(updated);
    roomManager.send({
      type: 'PLAYER_LIST_SYNC',
      senderId: localPlayerId,
      payload: { players: updated },
    });
  };

  const handleStartLiveMission = () => {
    const newRound = createRoundState(
      players,
      settings,
      allCategories,
      usedWordsRef.current,
      roundCounter
    );
    setRound(newRound);
    setCaughtImposterIds([]);
    setPreliminaryOutcome(null);
    setPhase('dossier_reveal');

    roomManager.send({
      type: 'ROUND_STARTED',
      senderId: localPlayerId,
      payload: {
        round: newRound,
        players,
      },
    });
  };

  // === ROUND PROGRESSION HANDLERS ===
  const handleNextPlayerOrInterrogation = () => {
    if (!round) return;

    if (settings.playMode === 'pass_and_play') {
      if (round.revealIndex + 1 < players.length) {
        setRound({
          ...round,
          revealIndex: round.revealIndex + 1,
        });
      } else {
        setPhase('interrogation');
      }
    } else {
      // Live room host advances everyone to interrogation
      setPhase('interrogation');
      roomManager.send({
        type: 'PHASE_CHANGE',
        senderId: localPlayerId,
        payload: { phase: 'interrogation', round },
      });
    }
  };

  const handleRecordClueAndNext = (playerId: string, clueText: string) => {
    if (!round) return;
    const updatedAssignments = { ...round.assignments };
    if (clueText && updatedAssignments[playerId]) {
      updatedAssignments[playerId] = {
        ...updatedAssignments[playerId],
        clueGiven: clueText,
      };
    }
    const updatedRound: RoundState = {
      ...round,
      assignments: updatedAssignments,
      currentSpeakerIndex: round.currentSpeakerIndex + 1,
    };
    setRound(updatedRound);

    if (settings.playMode === 'live_room') {
      roomManager.send({
        type: 'SUBMIT_CLUE',
        senderId: localPlayerId,
        payload: { round: updatedRound },
      });
    }
  };

  const handleStartTribunal = () => {
    setPhase('tribunal_voting');
    if (settings.playMode === 'live_room') {
      roomManager.send({
        type: 'PHASE_CHANGE',
        senderId: localPlayerId,
        payload: { phase: 'tribunal_voting', round },
      });
    }
  };

  const handleDetectiveScan = (targetPlayerId: string) => {
    if (!round) return;
    setRound({
      ...round,
      detectiveScannedPlayerId: targetPlayerId,
    });
  };

  const applyFinalOutcomeAndScores = (
    currentRound: RoundState,
    finalOutcome: RoundOutcome
  ) => {
    const updatedPlayers = players.map((p) => {
      const pts = finalOutcome.scoreDeltas[p.id]?.points || 0;
      return {
        ...p,
        score: p.score + pts,
        streak: pts >= 150 ? p.streak + 1 : 0,
      };
    });
    const completedRound: RoundState = {
      ...currentRound,
      outcome: finalOutcome,
    };
    setPlayers(updatedPlayers);
    setRound(completedRound);
    setRoundCounter((c) => c + 1);
    setPhase('debrief');

    if (settings.playMode === 'live_room') {
      roomManager.send({
        type: 'PHASE_CHANGE',
        senderId: localPlayerId,
        payload: {
          phase: 'debrief',
          round: completedRound,
          players: updatedPlayers,
        },
      });
    }
  };

  const handleExecuteTribunalVerdict = (
    eliminatedIds: string[],
    votedNoImposter = false
  ) => {
    if (!round) return;
    const resolution = evaluateTribunalResolution(
      round,
      eliminatedIds,
      votedNoImposter,
      settings.enableSurvivalRounds
    );

    if (resolution.continueToNextRound && resolution.clearedEliminatedIds) {
      const eliminatedNames = resolution.clearedEliminatedIds
        .map((id) => round.assignments[id]?.playerName || 'Agent')
        .join(' & ');
      const nextCycle = round.voteCycle + 1;
      const banner: SurvivalBannerInfo = {
        eliminatedNames,
        remainingCount: resolution.remainingCount || round.activePlayerIds.length - 1,
        nextCycle,
        nextReward: getCivilianRewardForCycle(nextCycle),
      };
      setPendingClearedIds(resolution.clearedEliminatedIds);
      setSurvivalBanner(banner);

      if (settings.playMode === 'live_room') {
        roomManager.send({
          type: 'PHASE_CHANGE',
          senderId: localPlayerId,
          payload: {
            phase: 'tribunal_voting',
            survivalBanner: banner,
          },
        });
      }
      return;
    }

    if (resolution.needsLastChanceSteal && settings.enableLastChanceSteal) {
      setCaughtImposterIds(resolution.caughtImposterIds);
      setPreliminaryOutcome(resolution.preliminaryOutcome);
      setPhase('last_chance_steal');
      if (settings.playMode === 'live_room') {
        roomManager.send({
          type: 'PHASE_CHANGE',
          senderId: localPlayerId,
          payload: {
            phase: 'last_chance_steal',
            caughtImposterIds: resolution.caughtImposterIds,
            preliminaryOutcome: resolution.preliminaryOutcome,
          },
        });
      }
    } else {
      applyFinalOutcomeAndScores(round, resolution.preliminaryOutcome);
    }
  };

  const handleContinueToNextSurvivalRound = () => {
    if (!round) return;
    const nextRound = advanceToNextSurvivalRound(
      round,
      pendingClearedIds,
      settings.imposterNeverFirst
    );
    setRound(nextRound);
    setSurvivalBanner(null);
    setPendingClearedIds([]);
    setPhase('interrogation');

    if (settings.playMode === 'live_room') {
      roomManager.send({
        type: 'PHASE_CHANGE',
        senderId: localPlayerId,
        payload: {
          phase: 'interrogation',
          round: nextRound,
          survivalBanner: null,
        },
      });
    }
  };

  const handleSubmitLastChanceGuess = (guessedWord: string) => {
    if (!round || !preliminaryOutcome) return;
    const finalOutcome = resolveLastChanceSteal(
      round,
      preliminaryOutcome,
      guessedWord
    );
    applyFinalOutcomeAndScores(round, finalOutcome);
  };

  const handlePlayNextMission = () => {
    if (settings.playMode === 'live_room' && isHost) {
      handleStartLiveMission();
    } else {
      handleStartPassAndPlay();
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <HeaderBar
        phase={phase}
        playMode={settings.playMode}
        roundNumber={roundCounter}
        roomCode={roomCode}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() =>
          updateSettings({ soundEnabled: !settings.soundEnabled })
        }
        onOpenManual={() => setIsManualOpen(true)}
        onOpenCustomDecks={() => setIsCustomDecksOpen(true)}
        onAbortToSetup={() => {
          setPhase('setup');
        }}
      />

      <main className="flex-1">
        {phase === 'setup' && (
          <SetupScreen
            players={players}
            onUpdatePlayers={setPlayers}
            settings={settings}
            onUpdateSettings={updateSettings}
            categories={allCategories}
            onStartPassAndPlay={handleStartPassAndPlay}
            onHostLiveRoom={handleHostLiveRoom}
            onJoinLiveRoom={handleJoinLiveRoom}
            onOpenCustomDecks={() => setIsCustomDecksOpen(true)}
            onResetLeaderboard={handleResetLeaderboard}
          />
        )}

        {phase === 'lobby' && (
          <LiveRoomLobby
            roomCode={roomCode}
            isHost={isHost}
            localPlayerId={localPlayerId}
            networkStatus={networkStatus}
            players={players}
            onUpdatePlayerInfo={handleUpdatePlayerInfo}
            onRemovePlayer={handleRemovePlayerInLobby}
            onAddBotOrLocalAgent={handleAddBotOrLocalAgentInLobby}
            onStartLiveMission={handleStartLiveMission}
            onLeaveRoom={() => {
              roomManager.sendLeave(localPlayerId);
              roomManager.cleanup();
              setRoomCode('');
              setPhase('setup');
            }}
          />
        )}

        {phase === 'dossier_reveal' && round && (
          <PassAndPlayReveal
            playMode={settings.playMode}
            round={round}
            players={players}
            localPlayerId={localPlayerId}
            isHost={isHost}
            onNextPlayerOrPhase={handleNextPlayerOrInterrogation}
          />
        )}

        {phase === 'interrogation' && round && (
          <InterrogationScreen
            round={round}
            players={players}
            settings={settings}
            localPlayerId={localPlayerId}
            isHost={isHost}
            onRecordClueAndNext={handleRecordClueAndNext}
            onStartTribunal={handleStartTribunal}
          />
        )}

        {(phase === 'tribunal_voting' || phase === 'last_chance_steal') &&
          round && (
            <TribunalVotingScreen
              phase={phase}
              round={round}
              players={players}
              settings={settings}
              caughtImposterIds={caughtImposterIds}
              preliminaryOutcome={preliminaryOutcome}
              survivalBanner={survivalBanner}
              onContinueToNextSurvivalRound={handleContinueToNextSurvivalRound}
              onExecuteVerdict={handleExecuteTribunalVerdict}
              onSubmitLastChanceGuess={handleSubmitLastChanceGuess}
              onDetectiveScan={handleDetectiveScan}
            />
          )}

        {phase === 'debrief' && round && round.outcome && (
          <DebriefScoreboard
            round={round}
            outcome={round.outcome}
            players={players}
            onPlayNextMission={handlePlayNextMission}
            onReturnToSetup={() => setPhase('setup')}
          />
        )}
      </main>

      {/* Modals */}
      <FieldManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      <CustomDeckModal
        isOpen={isCustomDecksOpen}
        onClose={() => setIsCustomDecksOpen(false)}
        customDecks={customDecks}
        onSaveCustomDecks={handleSaveCustomDecks}
      />
    </div>
  );
}
export default App;
