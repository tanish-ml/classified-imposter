import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  Copy,
  Link,
  LogOut,
  Pencil,
  Play,
  QrCode,
  Radio,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { AGENT_AVATARS, DEFAULT_AGENT_NAMES } from '../engine/gameEngine';
import { Player } from '../types/game';
import { spyAudio } from '../utils/soundEffects';

interface LiveRoomLobbyProps {
  roomCode: string;
  isHost: boolean;
  localPlayerId: string;
  networkStatus: string;
  players: Player[];
  onUpdatePlayerInfo: (playerId: string, name: string, avatar: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onAddBotOrLocalAgent: (name: string, avatar: string) => void;
  onStartLiveMission: () => void;
  onLeaveRoom: () => void;
}

export const LiveRoomLobby: React.FC<LiveRoomLobbyProps> = ({
  roomCode,
  isHost,
  localPlayerId,
  networkStatus,
  players,
  onUpdatePlayerInfo,
  onRemovePlayer,
  onAddBotOrLocalAgent,
  onStartLiveMission,
  onLeaveRoom,
}) => {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);
  const [showQrOnMobile, setShowQrOnMobile] = useState(true);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`
      : `https://imposter.local/?room=${roomCode}`;

  const handleCopy = (type: 'code' | 'link') => {
    spyAudio.playTick();
    const text = type === 'code' ? roomCode : joinUrl;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleQuickAddAgent = () => {
    spyAudio.playTick();
    const idx = players.length;
    const name =
      DEFAULT_AGENT_NAMES[idx % DEFAULT_AGENT_NAMES.length] ||
      `Agent #${idx + 1}`;
    const avatar = AGENT_AVATARS[idx % AGENT_AVATARS.length];
    onAddBotOrLocalAgent(name, avatar);
  };

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="rounded-2xl border border-zinc-800 bg-noir-900 p-4 sm:p-6">
        {/* Minimalist Top Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-400">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>{roomCode}</span>
            </span>
            <span className="hidden text-xs text-zinc-400 sm:inline">
              {networkStatus || (isHost ? 'Host Lobby' : 'Connected')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQrOnMobile((v) => !v)}
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-noir-950 px-2.5 py-1.5 text-xs font-medium text-zinc-300 md:hidden"
            >
              <QrCode className="h-3.5 w-3.5 text-amber-tactical" />
              <span>{showQrOnMobile ? 'Hide QR' : 'Show QR'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                spyAudio.playTick();
                onLeaveRoom();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-crimson/40 bg-crimson/10 px-3 py-1.5 text-xs font-bold text-crimson-glow hover:bg-crimson/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Leave</span>
            </button>
          </div>
        </div>

        {/* 2-Column Lobby Grid */}
        <div className="mt-4 grid gap-4 md:grid-cols-12">
          {/* Left: QR Code & Invite */}
          <div
            className={`flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-noir-950 p-4 text-center md:col-span-5 md:flex ${
              showQrOnMobile ? 'flex' : 'hidden'
            }`}
          >
            <div className="font-mono text-2xl font-extrabold tracking-widest text-white">
              {roomCode}
            </div>

            <div className="my-3 rounded-2xl border-2 border-amber-tactical bg-white p-2.5">
              <QRCodeSVG
                value={joinUrl}
                size={140}
                bgColor="#FFFFFF"
                fgColor="#07080A"
                level="M"
              />
            </div>

            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={() => handleCopy('code')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-noir-900 py-2 text-xs font-bold text-zinc-200 hover:border-amber-tactical"
              >
                {copiedType === 'code' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedType === 'code' ? 'Copied' : 'Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy('link')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-noir-900 py-2 text-xs font-bold text-zinc-200 hover:border-amber-tactical"
              >
                {copiedType === 'link' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Link className="h-3.5 w-3.5" />
                )}
                <span>{copiedType === 'link' ? 'Copied' : 'Link'}</span>
              </button>
            </div>
          </div>

          {/* Right: Players List (Editable Names & Avatars!) */}
          <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-noir-950/60 p-4 md:col-span-7">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-tactical" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                    Players ({players.length})
                  </h3>
                </div>
                {isHost && (
                  <button
                    type="button"
                    onClick={handleQuickAddAgent}
                    className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-700 bg-noir-800 px-3 py-2 text-xs font-semibold text-amber-tactical transition hover:border-amber-tactical active:scale-95"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add Local</span>
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-[260px] space-y-2 overflow-y-auto pr-1">
                {players.map((p, idx) => {
                  const isMe = p.id === localPlayerId;
                  const canEdit = isMe || isHost;

                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
                        isMe
                          ? 'border-amber-tactical/60 bg-amber-950/20'
                          : 'border-zinc-800 bg-noir-900'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => {
                          if (!canEdit) return;
                          spyAudio.playTick(1050);
                          const currIdx = AGENT_AVATARS.indexOf(p.avatar);
                          const nextAvatar =
                            AGENT_AVATARS[(currIdx + 1) % AGENT_AVATARS.length];
                          onUpdatePlayerInfo(p.id, p.name, nextAvatar);
                        }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-noir-800 text-lg transition hover:scale-105 active:scale-95 disabled:opacity-70"
                        title={canEdit ? 'Tap to change icon' : ''}
                      >
                        {p.avatar}
                      </button>

                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        {canEdit ? (
                          <div className="flex w-full items-center gap-1.5">
                            <input
                              type="text"
                              value={p.name}
                              maxLength={22}
                              onChange={(e) =>
                                onUpdatePlayerInfo(p.id, e.target.value, p.avatar)
                              }
                              onFocus={(e) => {
                                setTimeout(() => {
                                  e.target.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                  });
                                }, 250);
                              }}
                              aria-label={`Edit ${p.name}`}
                              className="min-h-[44px] w-full bg-transparent py-2 text-sm font-bold text-white focus:border-b focus:border-amber-tactical focus:outline-none"
                            />
                            <Pencil className="h-3 w-3 shrink-0 text-zinc-500" />
                          </div>
                        ) : (
                          <span className="truncate text-sm font-bold text-white">
                            {p.name}
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {idx === 0 && (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] font-bold text-zinc-300">
                            HOST
                          </span>
                        )}
                        {isMe && (
                          <span className="rounded bg-amber-tactical/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-tactical">
                            YOU
                          </span>
                        )}
                        {isHost && !isMe && (
                          <button
                            type="button"
                            onClick={() => {
                              spyAudio.playTick();
                              onRemovePlayer(p.id);
                            }}
                            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-crimson/15 hover:text-crimson-glow active:scale-95"
                            title="Remove player"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 border-t border-zinc-800 pt-3">
              {isHost ? (
                <button
                  type="button"
                  disabled={players.length < 3}
                  onClick={() => {
                    spyAudio.playStamp();
                    onStartLiveMission();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-crimson py-3 font-display text-sm font-bold uppercase tracking-wider text-white shadow-crimson-glow transition hover:bg-crimson-glow disabled:opacity-40"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {players.length < 3
                      ? `Need ${3 - players.length} More Player(s)`
                      : `Start Game (${players.length} Players)`}
                  </span>
                </button>
              ) : (
                <div className="rounded-xl border border-amber-tactical/30 bg-amber-950/20 py-2.5 text-center font-mono text-xs text-amber-tactical">
                  Waiting for Host to start...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
