export interface Player {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
  score: number;
}

export interface RoomSettings {
  rounds: number;
  turnTimeSeconds: number;
  minWordLength: number;
}

export interface ChainItem {
  word: string;
  playerId: string | null;
}

export interface RoomState {
  code: string;
  players: Player[];
  settings: RoomSettings;
  status: 'lobby' | 'playing' | 'round-end' | 'game-end';
  currentRound: number;
  chain: ChainItem[];
  usedWords: string[];
  activePlayerId: string | null;
  turnDeadline: number | null;
}

export interface ClientToServerEvents {
  create_room: (data: { playerName: string }, callback: (res: { roomCode: string, playerId: string }) => void) => void;
  join_room: (data: { roomCode: string, playerName: string }, callback: (res: { success: boolean, playerId?: string, error?: string }) => void) => void;
  update_settings: (settings: RoomSettings) => void;
  start_game: () => void;
  submit_word: (data: { word: string }) => void;
  rejoin_room: (data: { roomCode: string, playerId: string }, callback: (res: { success: boolean, error?: string }) => void) => void;
  leave_room: () => void;
  stop_game: () => void;
}

export interface ServerToClientEvents {
  room_update: (roomState: RoomState) => void;
  round_started: (data: { roundNumber: number, startingWord: string, activePlayerId: string }) => void;
  turn_changed: (data: { activePlayerId: string, requiredLetter: string, deadline: number }) => void;
  word_result: (data: { playerId: string, word: string, valid: boolean, reason?: string, pointsAwarded?: number, updatedChain: ChainItem[] }) => void;
  round_ended: (data: { reason: string, failedPlayerId?: string, scores: Record<string, number> }) => void;
  game_ended: (data: { finalScores: Record<string, number>, winnerIds: string[] }) => void;
  error: (data: { message: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId: string;
  roomCode: string;
}
