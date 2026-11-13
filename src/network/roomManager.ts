import Peer, { DataConnection } from 'peerjs';
import { RoomNetworkMessage } from '../types/game';

const PEER_PREFIX = 'classified-imposter-v2-room-';

export type MessageHandler = (msg: RoomNetworkMessage) => void;

export class LiveRoomManager {
  public roomCode = '';
  public isHost = false;
  public localPlayerId = '';
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private peerToPlayerId: Map<string, string> = new Map();
  private hostConn: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private onMessageCallback: MessageHandler | null = null;
  private onPeerDisconnectCallback: ((playerId: string) => void) | null = null;
  private onStatusChangeCallback: ((status: 'connecting' | 'connected' | 'error', detail?: string) => void) | null = null;
  private processedMsgIds: Set<string> = new Set();

  public generateRoomCode(): string {
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `SPY-${digits}`;
  }

  public initHost(
    roomCode: string,
    localPlayerId: string,
    onMessage: MessageHandler,
    onStatus?: (status: 'connecting' | 'connected' | 'error', detail?: string) => void,
    onPeerDisconnect?: (playerId: string) => void
  ) {
    this.cleanup();
    this.roomCode = roomCode.toUpperCase().trim();
    this.isHost = true;
    this.localPlayerId = localPlayerId;
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatus || null;
    this.onPeerDisconnectCallback = onPeerDisconnect || null;

    this.setupBroadcastChannel(this.roomCode);
    this.onStatusChangeCallback?.('connecting', 'Initializing encrypted relay...');

    try {
      const peerId = `${PEER_PREFIX}${this.roomCode}`;
      const peer = new Peer(peerId);
      this.peer = peer;

      peer.on('open', () => {
        this.onStatusChangeCallback?.('connected', `Room ${this.roomCode} Live (P2P + Local Sync)`);
      });

      peer.on('connection', (conn) => {
        conn.on('open', () => {
          this.connections.set(conn.peer, conn);
        });
        conn.on('data', (data) => {
          this.handleIncomingRaw(data, conn.peer);
        });
        conn.on('close', () => {
          this.connections.delete(conn.peer);
          const pid = this.peerToPlayerId.get(conn.peer);
          if (pid) {
            this.peerToPlayerId.delete(conn.peer);
            this.onPeerDisconnectCallback?.(pid);
          }
        });
      });

      peer.on('error', () => {
        // Even if PeerJS cloud signaling has an issue, BroadcastChannel still works locally
        this.onStatusChangeCallback?.('connected', `Room ${this.roomCode} Active (Local Frequency)`);
      });
    } catch {
      this.onStatusChangeCallback?.('connected', `Room ${this.roomCode} Active (Local Frequency)`);
    }
  }

  public initClient(
    roomCode: string,
    localPlayerId: string,
    localPlayerName: string,
    localPlayerAvatar: string,
    onMessage: MessageHandler,
    onStatus?: (status: 'connecting' | 'connected' | 'error', detail?: string) => void
  ) {
    this.cleanup();
    this.roomCode = roomCode.toUpperCase().trim();
    this.isHost = false;
    this.localPlayerId = localPlayerId;
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatus || null;

    this.setupBroadcastChannel(this.roomCode);
    this.onStatusChangeCallback?.('connecting', `Connecting to ${this.roomCode}...`);

    // Immediately announce join over BroadcastChannel for instant same-device/multi-tab join
    this.send({
      type: 'JOIN_REQUEST',
      senderId: localPlayerId,
      senderName: localPlayerName,
      senderAvatar: localPlayerAvatar,
    });

    try {
      const peer = new Peer();
      this.peer = peer;

      peer.on('open', () => {
        const hostPeerId = `${PEER_PREFIX}${this.roomCode}`;
        const conn = peer.connect(hostPeerId, { reliable: true });
        this.hostConn = conn;

        conn.on('open', () => {
          this.onStatusChangeCallback?.('connected', `Connected to ${this.roomCode}`);
          this.send({
            type: 'JOIN_REQUEST',
            senderId: localPlayerId,
            senderName: localPlayerName,
            senderAvatar: localPlayerAvatar,
          });
        });

        conn.on('data', (data) => {
          this.handleIncomingRaw(data);
        });

        conn.on('error', () => {
          this.onStatusChangeCallback?.('connected', `Synced via Local Frequency (${this.roomCode})`);
        });
      });

      peer.on('error', () => {
        this.onStatusChangeCallback?.('connected', `Synced via Local Frequency (${this.roomCode})`);
      });
    } catch {
      this.onStatusChangeCallback?.('connected', `Synced via Local Frequency (${this.roomCode})`);
    }
  }

  private setupBroadcastChannel(roomCode: string) {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel(`classified_room_${roomCode}`);
        this.broadcastChannel.onmessage = (ev) => {
          this.handleIncomingRaw(ev.data);
        };
      }
    } catch {
      // Ignore if BroadcastChannel is unavailable
    }
  }

  private handleIncomingRaw(raw: unknown, remotePeerId?: string) {
    if (!raw || typeof raw !== 'object') return;
    const envelope = raw as { msgId?: string; msg?: RoomNetworkMessage };
    if (!envelope.msg || !envelope.msg.type) return;

    if (remotePeerId && envelope.msg.senderId) {
      this.peerToPlayerId.set(remotePeerId, envelope.msg.senderId);
    }

    if (envelope.msgId) {
      if (this.processedMsgIds.has(envelope.msgId)) return;
      this.processedMsgIds.add(envelope.msgId);
    }

    if (envelope.msg.senderId === this.localPlayerId) return;
    this.onMessageCallback?.(envelope.msg);
  }

  public sendLeave(playerId: string) {
    if (!this.roomCode) return;
    this.send({
      type: this.isHost ? 'HOST_CLOSED' : 'LEAVE_ROOM',
      senderId: playerId,
    });
  }

  public send(msg: RoomNetworkMessage) {
    const msgId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.processedMsgIds.add(msgId);
    const envelope = { msgId, msg };

    // 1. Send via BroadcastChannel
    try {
      this.broadcastChannel?.postMessage(envelope);
    } catch {
      // Ignore
    }

    // 2. Send via PeerJS WebRTC DataConnections
    if (this.isHost) {
      this.connections.forEach((conn) => {
        try {
          if (conn.open) conn.send(envelope);
        } catch {
          // Ignore
        }
      });
    } else if (this.hostConn && this.hostConn.open) {
      try {
        this.hostConn.send(envelope);
      } catch {
        // Ignore
      }
    }
  }

  public cleanup() {
    try {
      this.broadcastChannel?.close();
    } catch {}
    this.broadcastChannel = null;

    this.connections.forEach((c) => {
      try {
        c.close();
      } catch {}
    });
    this.connections.clear();
    this.peerToPlayerId.clear();

    try {
      this.hostConn?.close();
    } catch {}
    this.hostConn = null;

    try {
      this.peer?.destroy();
    } catch {}
    this.peer = null;
  }
}

export const roomManager = new LiveRoomManager();
