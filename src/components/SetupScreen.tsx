import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Crosshair,
  Dices,
  Flame,
  FolderPlus,
  Layers,
  Play,
  QrCode,
  Repeat,
  RotateCcw,
  Search,
  Shield,
  Shuffle,
  Sliders,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  VenetianMask,
  X,
  Zap,
} from 'lucide-react';
import { DeckIcon, getDeckTierAccent } from './DeckIcon';
import {
  AGENT_AVATARS,
  CHAOS_MODE_METADATA,
  DEFAULT_AGENT_NAMES,
} from '../engine/gameEngine';
import {
  CategoryDeck,
  ChaosMode,
  ClearanceTier,
  GameSettings,
  HintStyle,
  Player,
} from '../types/game';
import { spyAudio } from '../utils/soundEffects';

interface SetupScreenProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  categories: CategoryDeck[];
  onStartPassAndPlay: () => void;
  onHostLiveRoom: () => void;
  onJoinLiveRoom: (code: string, playerName: string, avatar: string) => void;
  onOpenCustomDecks: () => void;
  onResetLeaderboard: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  players,
  onUpdatePlayers,
  settings,
  onUpdateSettings,
  categories,
  onStartPassAndPlay,
  onHostLiveRoom,
  onJoinLiveRoom,
  onOpenCustomDecks,
  onResetLeaderboard,
}) => {
  const [mobileTab, setMobileTab] = useState<'players' | 'rules' | 'decks'>('players');
  const [tierFilter, setTierFilter] = useState<'all' | ClearanceTier | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [joinAgentName, setJoinAgentName] = useState(
    players[0]?.name || 'Agent Cipher'
  );
  const [joinAvatar, setJoinAvatar] = useState(players[0]?.avatar || '🕵️');
  const [liveSubMode, setLiveSubMode] = useState<'host' | 'join'>('host');

  const maxAllowedImposters = Math.max(1, Math.floor((players.length - 1) / 2));

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (tierFilter === 'custom' && !c.isCustom) return false;
      if (tierFilter !== 'all' && tierFilter !== 'custom' && c.tier !== tierFilter)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.words.some((w) => w.word.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [categories, tierFilter, searchQuery]);

  const handleAddPlayer = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (players.length >= 20) return;
    spyAudio.playTick();
    const nextIdx = players.length;
    const fallbackName =
      DEFAULT_AGENT_NAMES[nextIdx % DEFAULT_AGENT_NAMES.length] ||
      `Agent #${nextIdx + 1}`;
    const name = newAgentName.trim() || fallbackName;
    const avatar = AGENT_AVATARS[nextIdx % AGENT_AVATARS.length];
    onUpdatePlayers([
      ...players,
      {
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        avatar,
        score: 0,
        streak: 0,
      },
    ]);
    setNewAgentName('');
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 3) return;
    spyAudio.playTick();
    const updated = players.filter((p) => p.id !== id);
    onUpdatePlayers(updated);
    const newMaxImp = Math.max(1, Math.floor((updated.length - 1) / 2));
    if (settings.imposterCount > newMaxImp) {
      onUpdateSettings({ imposterCount: newMaxImp });
    }
  };

  const handleCycleAvatar = (id: string) => {
    spyAudio.playTick(1050);
    onUpdatePlayers(
      players.map((p) => {
        if (p.id !== id) return p;
        const currIdx = AGENT_AVATARS.indexOf(p.avatar);
        return {
          ...p,
          avatar: AGENT_AVATARS[(currIdx + 1) % AGENT_AVATARS.length],
        };
      })
    );
  };

  const handleRenamePlayer = (id: string, name: string) => {
    onUpdatePlayers(
      players.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  const handleShuffleRoster = () => {
    spyAudio.playTick();
    const copy = [...players];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    onUpdatePlayers(copy);
  };

  const toggleCategory = (id: string) => {
    spyAudio.playTick();
    const exists = settings.selectedCategoryIds.includes(id);
    if (exists) {
      if (settings.selectedCategoryIds.length === 1) return;
      onUpdateSettings({
        selectedCategoryIds: settings.selectedCategoryIds.filter((c) => c !== id),
      });
    } else {
      onUpdateSettings({
        selectedCategoryIds: [...settings.selectedCategoryIds, id],
      });
    }
  };

  const handleSelectAllFiltered = () => {
    spyAudio.playStamp();
    const merged = Array.from(
      new Set([
        ...settings.selectedCategoryIds,
        ...filteredCategories.map((c) => c.id),
      ])
    );
    onUpdateSettings({ selectedCategoryIds: merged });
  };

  const handleSelectRandomThree = () => {
    spyAudio.playStamp();
    const pool = [...categories];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    onUpdateSettings({
      selectedCategoryIds: pool.slice(0, 3).map((c) => c.id),
    });
  };

  const hasScores = players.some((p) => p.score > 0);

  return (
    <div className="mx-auto max-w-5xl px-3 pb-24 pt-3 sm:px-6 sm:pt-5">
      {/* Compact Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800/90 bg-noir-900 p-1.5">
        <button
          type="button"
          onClick={() => {
            spyAudio.playTick();
            onUpdateSettings({ playMode: 'pass_and_play' });
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
            settings.playMode === 'pass_and_play'
              ? 'bg-crimson text-white shadow-crimson-glow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Pass & Play</span>
        </button>
        <button
          type="button"
          onClick={() => {
            spyAudio.playTick();
            onUpdateSettings({ playMode: 'live_room' });
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
            settings.playMode === 'live_room'
              ? 'bg-amber-tactical text-noir-950 shadow-amber-glow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>Live Room</span>
        </button>
      </div>

      {/* Live Room Join/Host Compact Card */}
      {settings.playMode === 'live_room' && (
        <div className="mt-3 rounded-2xl border border-amber-tactical/40 bg-noir-900 p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  spyAudio.playTick();
                  setLiveSubMode('host');
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase ${
                  liveSubMode === 'host'
                    ? 'bg-amber-tactical text-noir-950'
                    : 'bg-noir-800 text-zinc-400'
                }`}
              >
                Host Room
              </button>
              <button
                type="button"
                onClick={() => {
                  spyAudio.playTick();
                  setLiveSubMode('join');
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase ${
                  liveSubMode === 'join'
                    ? 'bg-amber-tactical text-noir-950'
                    : 'bg-noir-800 text-zinc-400'
                }`}
              >
                Join Code
              </button>
            </div>
            {liveSubMode === 'host' && (
              <button
                type="button"
                onClick={() => {
                  spyAudio.playStamp();
                  onHostLiveRoom();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-tactical px-4 py-2 text-xs font-bold uppercase text-noir-950 shadow-amber-glow"
              >
                <QrCode className="h-4 w-4" />
                <span>Open Lobby</span>
              </button>
            )}
          </div>

          {liveSubMode === 'join' && (
            <div className="mt-3 grid gap-2 sm:grid-cols-12">
              <input
                type="text"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                placeholder="SPY-4820"
                className="rounded-xl border border-zinc-700 bg-noir-950 px-3 py-2.5 font-mono text-sm font-bold uppercase tracking-widest text-amber-tactical placeholder-zinc-600 focus:border-amber-tactical focus:outline-none sm:col-span-4"
              />
              <div className="flex gap-2 sm:col-span-5">
                <button
                  type="button"
                  onClick={() => {
                    const idx = AGENT_AVATARS.indexOf(joinAvatar);
                    setJoinAvatar(AGENT_AVATARS[(idx + 1) % AGENT_AVATARS.length]);
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-noir-950 text-lg"
                >
                  {joinAvatar}
                </button>
                <input
                  type="text"
                  value={joinAgentName}
                  onChange={(e) => setJoinAgentName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-zinc-700 bg-noir-950 px-3 py-2 text-sm text-white focus:border-amber-tactical focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!joinRoomInput.trim()) return;
                  spyAudio.playStamp();
                  onJoinLiveRoom(
                    joinRoomInput.trim(),
                    joinAgentName.trim() || 'Field Agent',
                    joinAvatar
                  );
                }}
                className="rounded-xl bg-amber-tactical py-2.5 text-xs font-bold uppercase text-noir-950 sm:col-span-3"
              >
                Join Room
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile-Only 3-Tab Navigation (Players / Rules / Decks) */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl border border-zinc-800 bg-noir-900 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => {
            spyAudio.playTick();
            setMobileTab('players');
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
            mobileTab === 'players'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400'
          }`}
        >
          <Users className="h-3.5 w-3.5 text-crimson-glow" />
          <span>Players ({players.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            spyAudio.playTick();
            setMobileTab('rules');
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
            mobileTab === 'rules'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400'
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-amber-tactical" />
          <span>Rules</span>
        </button>
        <button
          type="button"
          onClick={() => {
            spyAudio.playTick();
            setMobileTab('decks');
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
            mobileTab === 'decks'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400'
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-emerald-400" />
          <span>Decks ({settings.selectedCategoryIds.length})</span>
        </button>
      </div>

      {/* Main Responsive Grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* LEFT COLUMN (5 cols): Players & Rules */}
        <div className="space-y-4 lg:col-span-5">
          {/* PLAYERS CARD */}
          <section
            className={`rounded-2xl border border-zinc-800 bg-noir-900 p-4 ${
              mobileTab === 'players' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-crimson-glow" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Players ({players.length}/20)
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                {hasScores && (
                  <button
                    type="button"
                    onClick={() => {
                      spyAudio.playTick();
                      onResetLeaderboard();
                    }}
                    className="rounded-lg border border-zinc-800 bg-noir-950 p-1.5 text-zinc-400 hover:text-crimson-glow"
                    title="Reset Scores"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleShuffleRoster}
                  className="rounded-lg border border-zinc-800 bg-noir-950 p-1.5 text-zinc-400 hover:text-amber-tactical"
                  title="Shuffle Players"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddPlayer} className="flex gap-2">
              <input
                type="text"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="Add player name..."
                maxLength={22}
                className="w-full rounded-xl border border-zinc-800 bg-noir-950 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-crimson focus:outline-none"
              />
              <button
                type="submit"
                disabled={players.length >= 20}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-crimson text-white transition hover:bg-crimson-glow disabled:opacity-40"
                title="Add Player"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-3 max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-noir-950/70 px-2.5 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => handleCycleAvatar(player.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-noir-800 text-base transition hover:scale-105"
                    title="Tap to change icon"
                  >
                    {player.avatar}
                  </button>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleRenamePlayer(player.id, e.target.value)}
                    aria-label="Player name"
                    className="w-full bg-transparent text-sm font-medium text-zinc-100 focus:border-b focus:border-amber-tactical focus:outline-none"
                  />
                  {player.score > 0 && (
                    <span className="shrink-0 font-mono text-[11px] font-bold text-amber-tactical">
                      {player.score}p
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={players.length <= 3}
                    onClick={() => handleRemovePlayer(player.id)}
                    className="p-1.5 text-zinc-600 hover:text-crimson-glow disabled:opacity-20"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* RULES & ROLES CARD */}
          <section
            className={`rounded-2xl border border-zinc-800 bg-noir-900 p-4 space-y-4 ${
              mobileTab === 'rules' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-tactical" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Game Rules
                </h2>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    spyAudio.playStamp();
                    onUpdateSettings({
                      imposterCount: 1,
                      hintStyle: 'subtle_clue',
                      enableUndercover: false,
                      enableJester: false,
                      enableDetective: false,
                      enableAccomplice: false,
                      chaosMode: 'standard',
                      enableSurvivalRounds: true,
                    });
                  }}
                  className="rounded-lg border border-zinc-800 bg-noir-950 px-2 py-1 text-[10px] font-bold text-zinc-300 hover:border-amber-tactical"
                  title="Classic Preset"
                >
                  ⚡ Classic
                </button>
                <button
                  type="button"
                  onClick={() => {
                    spyAudio.playStamp();
                    onUpdateSettings({
                      chaosMode: 'random_chaos',
                      enableJester: true,
                      enableDetective: true,
                    });
                  }}
                  className="rounded-lg border border-zinc-800 bg-noir-950 px-2 py-1 text-[10px] font-bold text-crimson-glow hover:border-crimson"
                  title="Chaos Preset"
                >
                  🔥 Chaos
                </button>
              </div>
            </div>

            {/* Imposters & Timer */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <span className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                  <VenetianMask className="h-3.5 w-3.5 text-crimson-glow" />
                  Imposters
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((num) => {
                    const disabled = num > maxAllowedImposters;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          spyAudio.playTick();
                          onUpdateSettings({ imposterCount: num });
                        }}
                        className={`rounded-lg border py-1.5 font-mono text-xs font-bold ${
                          settings.imposterCount === num
                            ? 'border-crimson bg-crimson text-white'
                            : disabled
                            ? 'border-zinc-900 bg-noir-950 text-zinc-700'
                            : 'border-zinc-800 bg-noir-950 text-zinc-300'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-amber-tactical" />
                  Timer
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[60, 120, 180, 300].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        spyAudio.playTick();
                        onUpdateSettings({ discussionSeconds: sec });
                      }}
                      className={`rounded-lg border py-1.5 font-mono text-xs font-bold ${
                        settings.discussionSeconds === sec
                          ? 'border-amber-tactical bg-amber-tactical/20 text-amber-tactical'
                          : 'border-zinc-800 bg-noir-950 text-zinc-400'
                      }`}
                    >
                      {sec / 60}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hint Style */}
            <div>
              <span className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-tactical" />
                Imposter Hint
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'subtle_clue', label: 'Clue' },
                    { id: 'first_letter', label: '1st Ltr' },
                    { id: 'both', label: 'Both' },
                    { id: 'none', label: 'None' },
                  ] as { id: HintStyle; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      spyAudio.playTick();
                      onUpdateSettings({ hintStyle: opt.id });
                    }}
                    className={`rounded-lg border py-1.5 text-xs font-semibold ${
                      settings.hintStyle === opt.id
                        ? 'border-amber-tactical bg-amber-tactical/20 text-amber-tactical'
                        : 'border-zinc-800 bg-noir-950 text-zinc-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Roles Chips */}
            <div>
              <span className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                Special Roles
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    spyAudio.playTick();
                    onUpdateSettings({
                      enableUndercover: !settings.enableUndercover,
                    });
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold ${
                    settings.enableUndercover
                      ? 'border-amber-tactical bg-amber-950/35 text-amber-tactical'
                      : 'border-zinc-800 bg-noir-950 text-zinc-400'
                  }`}
                >
                  <span>🎭</span>
                  <span>Undercover</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    spyAudio.playTick();
                    onUpdateSettings({ enableJester: !settings.enableJester });
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold ${
                    settings.enableJester
                      ? 'border-purple-500 bg-purple-950/35 text-purple-300'
                      : 'border-zinc-800 bg-noir-950 text-zinc-400'
                  }`}
                >
                  <span>🃏</span>
                  <span>Jester</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    spyAudio.playTick();
                    onUpdateSettings({
                      enableDetective: !settings.enableDetective,
                    });
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold ${
                    settings.enableDetective
                      ? 'border-sky-500 bg-sky-950/35 text-sky-300'
                      : 'border-zinc-800 bg-noir-950 text-zinc-400'
                  }`}
                >
                  <span>🔍</span>
                  <span>Detective</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    spyAudio.playTick();
                    onUpdateSettings({
                      enableAccomplice: !settings.enableAccomplice,
                    });
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold ${
                    settings.enableAccomplice
                      ? 'border-rose-500 bg-rose-950/35 text-rose-300'
                      : 'border-zinc-800 bg-noir-950 text-zinc-400'
                  }`}
                >
                  <span>🤝</span>
                  <span>Mole (5P+)</span>
                </button>
              </div>
            </div>

            {/* Key Gameplay Toggles (Including Multi-Round Survival!) */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  spyAudio.playTick();
                  onUpdateSettings({
                    enableSurvivalRounds: !settings.enableSurvivalRounds,
                  });
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                  settings.enableSurvivalRounds
                    ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300'
                    : 'border-zinc-800 bg-noir-950 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-bold">Multi-Round Elimination</div>
                    <div className="text-[10px] opacity-75">
                      If missed, continue with remaining players (less pts)
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold">
                  {settings.enableSurvivalRounds ? 'ON' : 'OFF'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    spyAudio.playTick();
                    onUpdateSettings({
                      enableLastChanceSteal: !settings.enableLastChanceSteal,
                    });
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold ${
                    settings.enableLastChanceSteal
                      ? 'border-amber-tactical/60 bg-amber-950/30 text-amber-tactical'
                      : 'border-zinc-800 bg-noir-950 text-zinc-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Crosshair className="h-3.5 w-3.5" /> Word Steal
                  </span>
                  <span>{settings.enableLastChanceSteal ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    spyAudio.playTick();
                    onUpdateSettings({
                      imposterNeverFirst: !settings.imposterNeverFirst,
                    });
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold ${
                    settings.imposterNeverFirst
                      ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                      : 'border-zinc-800 bg-noir-950 text-zinc-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Spy ≠ 1st
                  </span>
                  <span>{settings.imposterNeverFirst ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Chaos Mode Row */}
            <div>
              <span className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                <Flame className="h-3.5 w-3.5 text-crimson-glow" />
                Troll / Chaos Mode
              </span>
              <div className="grid grid-cols-5 gap-1">
                {(
                  [
                    { id: 'standard', short: 'Off' },
                    { id: 'all_imposters', short: 'All Spy' },
                    { id: 'zero_imposters', short: '0 Spy' },
                    { id: 'mystery_count', short: '???' },
                    { id: 'random_chaos', short: 'Mix' },
                  ] as { id: ChaosMode; short: string }[]
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      spyAudio.playTick();
                      onUpdateSettings({ chaosMode: c.id });
                    }}
                    className={`rounded-lg border py-1.5 font-mono text-[11px] font-bold ${
                      settings.chaosMode === c.id
                        ? 'border-crimson bg-crimson/25 text-white'
                        : 'border-zinc-800 bg-noir-950 text-zinc-400'
                    }`}
                  >
                    {c.short}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (7 cols): Minimal Category Decks */}
        <section
          className={`rounded-2xl border border-zinc-800 bg-noir-900 p-4 lg:col-span-7 ${
            mobileTab === 'decks' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Decks ({settings.selectedCategoryIds.length})
              </h2>
              <span className="rounded-md border border-zinc-800 bg-noir-950 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                {categories
                  .filter((c) => settings.selectedCategoryIds.includes(c.id))
                  .reduce((sum, c) => sum + c.words.length, 0)}{' '}
                words
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenCustomDecks}
                className="flex items-center gap-1 rounded-lg border border-amber-tactical/50 bg-amber-950/30 px-2.5 py-1.5 text-xs font-bold text-amber-tactical transition active:scale-95"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>Custom</span>
              </button>
              <button
                type="button"
                onClick={handleSelectRandomThree}
                className="rounded-lg border border-zinc-800 bg-noir-950 p-1.5 text-zinc-300 transition hover:text-crimson-glow active:scale-95"
                title="Random 3 Decks"
              >
                <Dices className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="rounded-lg border border-zinc-800 bg-noir-950 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 active:scale-95"
              >
                All
              </button>
            </div>
          </div>

          {/* Search & Tier Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <div className="relative min-w-[160px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 32+ decks..."
                className="w-full rounded-xl border border-zinc-800 bg-noir-950 py-2 pl-8 pr-8 text-xs text-white placeholder-zinc-600 focus:border-amber-tactical focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear deck search"
                  className="absolute right-2 top-2 rounded-md p-0.5 text-zinc-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'standard', label: 'Classic' },
                  { id: 'pop_culture', label: 'Media' },
                  { id: 'lifestyle', label: 'Modern' },
                  { id: 'classified', label: '18+ / Dark' },
                ] as { id: typeof tierFilter; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    spyAudio.playTick();
                    setTierFilter(t.id);
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                    tierFilter === t.id
                      ? 'bg-amber-tactical text-noir-950'
                      : 'bg-noir-950 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Readable Icon-First Category Tiles */}
          <div className="grid max-h-[480px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredCategories.map((deck) => {
              const isSelected = settings.selectedCategoryIds.includes(deck.id);
              const accent = getDeckTierAccent(
                deck.tier,
                deck.isCustom,
                deck.isSpicy
              );
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => toggleCategory(deck.id)}
                  className={`flex items-center justify-between gap-2.5 rounded-xl border p-2.5 text-left transition active:scale-[0.98] ${
                    isSelected
                      ? 'border-amber-tactical/90 bg-amber-950/25 text-white shadow-sm'
                      : 'border-zinc-800/80 bg-noir-950/75 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${accent.iconBg} ${accent.iconText}`}
                    >
                      <DeckIcon name={deck.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-sm font-bold leading-snug text-white">
                        {deck.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                        <span>{deck.words.length} words</span>
                        {deck.isSpicy && (
                          <span className="rounded bg-crimson/20 px-1 py-0.2 font-bold text-crimson-glow">
                            18+
                          </span>
                        )}
                        {deck.isCustom && (
                          <span className="rounded bg-purple-500/20 px-1 py-0.2 font-bold text-purple-300">
                            CUSTOM
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      isSelected
                        ? 'border-amber-tactical bg-amber-tactical text-noir-950'
                        : 'border-zinc-700 bg-noir-900 text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                </button>
              );
            })}
            {filteredCategories.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-zinc-800 py-8 text-center font-mono text-xs text-zinc-500">
                No decks match “{searchQuery}”.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Sticky Bottom Launch Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/90 bg-noir-950/95 p-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="hidden font-mono text-xs text-zinc-400 sm:block">
            <strong className="text-white">{players.length}</strong> Players •{' '}
            <strong className="text-crimson-glow">{settings.imposterCount}</strong>{' '}
            {settings.imposterCount === 1 ? 'Imposter' : 'Imposters'} •{' '}
            <strong className="text-amber-tactical">
              {settings.selectedCategoryIds.length}
            </strong>{' '}
            Decks
            {settings.enableSurvivalRounds && ' • 2nd-Round Survival ON'}
          </div>

          {settings.playMode === 'pass_and_play' ? (
            <button
              type="button"
              onClick={() => {
                spyAudio.playStamp();
                onStartPassAndPlay();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-crimson px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-white shadow-crimson-glow transition hover:bg-crimson-glow active:scale-[0.98] sm:w-auto sm:min-w-[240px]"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Start Game ({players.length}P)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                spyAudio.playStamp();
                onHostLiveRoom();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-tactical px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-noir-950 shadow-amber-glow transition hover:bg-amber-glow active:scale-[0.98] sm:w-auto sm:min-w-[240px]"
            >
              <QrCode className="h-4 w-4" />
              <span>Open Live Lobby</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
