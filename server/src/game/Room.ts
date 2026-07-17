import { RoomState, Player, RoomSettings, ChainItem, ChatMessage } from './events';
import { GameLogic } from './GameLogic';

export class Room {
  code: string;
  players: Player[] = [];
  settings: RoomSettings = {
    rounds: 5,
    turnTimeSeconds: 20,
    minWordLength: 3
  };
  status: RoomState['status'] = 'lobby';
  currentRound: number = 0;
  chain: ChainItem[] = [];
  usedWords: Set<string> = new Set();
  activePlayerId: string | null = null;
  turnDeadline: number | null = null;
  chat: ChatMessage[] = [];

  // Track who should start the next round
  private roundStarterIndex: number = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(code: string) {
    this.code = code;
  }

  get state(): RoomState {
    return {
      code: this.code,
      players: this.players,
      settings: this.settings,
      status: this.status,
      currentRound: this.currentRound,
      chain: this.chain,
      usedWords: Array.from(this.usedWords),
      activePlayerId: this.activePlayerId,
      turnDeadline: this.turnDeadline,
      chat: this.chat
    };
  }

  addPlayer(playerId: string, name: string): Player {
    const isHost = this.players.length === 0;
    
    const emojis = ['🦊', '🐼', '🐨', '🐸', '🐙', '🐵', '🦄', '🦖', '🐉', '🦉'];
    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316'];
    
    const usedEmojis = this.players.map(p => p.avatar);
    const usedColors = this.players.map(p => p.color);
    
    const availableEmojis = emojis.filter(e => !usedEmojis.includes(e));
    const availableColors = colors.filter(c => !usedColors.includes(c));
    
    const avatar = availableEmojis.length > 0 ? availableEmojis[Math.floor(Math.random() * availableEmojis.length)] : emojis[Math.floor(Math.random() * emojis.length)];
    const color = availableColors.length > 0 ? availableColors[Math.floor(Math.random() * availableColors.length)] : colors[Math.floor(Math.random() * colors.length)];
    
    const player: Player = { id: playerId, name, connected: true, isHost, score: 0, avatar, color, skips: 1 };
    this.players.push(player);
    return player;
  }

  removePlayer(playerId: string) {
    this.players = this.players.filter(p => p.id !== playerId);
    if (this.players.length > 0 && !this.players.some(p => p.isHost)) {
      this.players[0].isHost = true;
    }
  }

  setPlayerConnected(playerId: string, connected: boolean) {
    const player = this.players.find(p => p.id === playerId);
    if (player) player.connected = connected;
  }

  updateSettings(settings: RoomSettings) {
    if (this.status !== 'lobby') return;
    this.settings = settings;
  }

  startGame() {
    if (this.status !== 'lobby' || this.players.length < 2) return;
    this.status = 'playing';
    this.currentRound = 0;
    this.usedWords.clear();
    this.players.forEach(p => p.score = 0);
    this.roundStarterIndex = 0;
    this.startNextRound();
  }

  startNextRound() {
    this.currentRound++;
    if (this.currentRound > this.settings.rounds) {
      this.status = 'game-end';
      this.activePlayerId = null;
      this.turnDeadline = null;
      return;
    }

    this.status = 'playing';
    const startingWord = GameLogic.getRandomStartingWord();
    this.chain = [{ word: startingWord, playerId: null }];
    this.usedWords.add(startingWord);
    
    // Determine active player
    const connectedPlayers = this.players.filter(p => p.connected);
    if (connectedPlayers.length === 0) return;

    // Use roundStarterIndex
    this.activePlayerId = this.players[this.roundStarterIndex % this.players.length].id;
    this.roundStarterIndex++;

    this.resetTurnTimer();
  }

  resetTurnTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.turnDeadline = Date.now() + this.settings.turnTimeSeconds * 1000;
  }

  clearTurnTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.turnDeadline = null;
  }

  setTimerCallback(callback: () => void) {
    if (this.timer) clearTimeout(this.timer);
    const msLeft = this.turnDeadline ? this.turnDeadline - Date.now() : 0;
    this.timer = setTimeout(callback, Math.max(0, msLeft));
  }

  advanceTurn() {
    const currentIndex = this.players.findIndex(p => p.id === this.activePlayerId);
    let nextIndex = (currentIndex + 1) % this.players.length;
    
    // Find next connected player, to avoid infinite loop just count attempts
    let attempts = 0;
    while (!this.players[nextIndex].connected && attempts < this.players.length) {
        nextIndex = (nextIndex + 1) % this.players.length;
        attempts++;
    }
    
    this.activePlayerId = this.players[nextIndex].id;
    this.resetTurnTimer();
  }

  endRound(reason: string, failedPlayerId?: string) {
    this.status = 'round-end';
    this.clearTurnTimer();
    this.activePlayerId = null;
  }
}
