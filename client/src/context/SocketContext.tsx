import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// Keep this in sync with server types
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

interface SocketContextProps {
  socket: Socket | null;
  room: RoomState | null;
  playerId: string | null;
  setPlayerId: (id: string | null) => void;
  error: string | null;
  setError: (err: string | null) => void;
  turnData: { requiredLetter: string, deadline: number, activePlayerId: string } | null;
  wordResult: { word: string, valid: boolean, reason?: string, pointsAwarded?: number, playerId: string } | null;
  roundEndData: { reason: string, failedPlayerId?: string, scores: Record<string, number> } | null;
  gameEndData: { finalScores: Record<string, number>, winnerIds: string[] } | null;
  clearTurnData: () => void;
  clearWordResult: () => void;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Game events
  const [turnData, setTurnData] = useState<SocketContextProps['turnData'] | null>(null);
  const [wordResult, setWordResult] = useState<SocketContextProps['wordResult'] | null>(null);
  const [roundEndData, setRoundEndData] = useState<SocketContextProps['roundEndData'] | null>(null);
  const [gameEndData, setGameEndData] = useState<SocketContextProps['gameEndData'] | null>(null);

  useEffect(() => {
    // Attempt auto-reconnect logic if playerId and roomCode are in localStorage
    const savedPlayerId = localStorage.getItem('playerId');
    const savedRoomCode = localStorage.getItem('roomCode');

    const serverUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    if (savedPlayerId && savedRoomCode) {
      newSocket.emit('rejoin_room', { roomCode: savedRoomCode, playerId: savedPlayerId }, (res: { success: boolean, error?: string }) => {
        if (res.success) {
          setPlayerId(savedPlayerId);
        } else {
          localStorage.removeItem('playerId');
          localStorage.removeItem('roomCode');
        }
      });
    }

    newSocket.on('room_update', (newRoom: RoomState) => {
      setRoom(newRoom);
      if (newRoom.status === 'playing') {
        setRoundEndData(null);
        setGameEndData(null);
      }
    });

    newSocket.on('turn_changed', (data: any) => {
      setTurnData(data);
      setWordResult(null); // Clear previous word result on new turn
    });

    newSocket.on('round_started', (data: any) => {
      setRoundEndData(null);
      setWordResult(null);
    });

    newSocket.on('word_result', (data: any) => {
      setWordResult(data);
    });

    newSocket.on('round_ended', (data: any) => {
      setRoundEndData(data);
    });

    newSocket.on('game_ended', (data: any) => {
      setGameEndData(data);
    });

    newSocket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Persist playerId and roomCode
  useEffect(() => {
    if (playerId && room?.code) {
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('roomCode', room.code);
    }
  }, [playerId, room?.code]);

  return (
    <SocketContext.Provider value={{
      socket, room, playerId, setPlayerId, error, setError,
      turnData, wordResult, roundEndData, gameEndData,
      clearTurnData: () => setTurnData(null),
      clearWordResult: () => setWordResult(null)
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
