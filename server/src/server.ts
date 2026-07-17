import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './game/RoomManager';
import { Room } from './game/Room';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, RoomSettings } from './game/events';
import { GameLogic } from './game/GameLogic';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  console.log(`Socket connected: ${socket.id}`);

  // Helper to get room
  const getRoom = () => {
    if (!socket.data.roomCode) return null;
    return roomManager.getRoom(socket.data.roomCode);
  };

  const broadcastRoomUpdate = (room: Room) => {
    io.to(room.code).emit('room_update', room.state);
  };

  socket.on('create_room', ({ playerName }, callback) => {
    const room = roomManager.createRoom();
    const playerId = socket.id;
    socket.data.playerId = playerId;
    socket.data.roomCode = room.code;
    socket.join(room.code);
    room.addPlayer(playerId, playerName);
    callback({ roomCode: room.code, playerId });
    broadcastRoomUpdate(room);
  });

  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }
    if (room.status !== 'lobby') {
      return callback({ success: false, error: 'Game already in progress' });
    }
    const playerId = socket.id;
    socket.data.playerId = playerId;
    socket.data.roomCode = room.code;
    socket.join(room.code);
    room.addPlayer(playerId, playerName);
    callback({ success: true, playerId });
    broadcastRoomUpdate(room);
  });

  socket.on('rejoin_room', ({ roomCode, playerId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return callback({ success: false, error: 'Player not found in room' });
    }
    socket.data.playerId = playerId;
    socket.data.roomCode = room.code;
    socket.join(room.code);
    room.setPlayerConnected(playerId, true);
    callback({ success: true });
    broadcastRoomUpdate(room);
  });

  socket.on('update_settings', (settings: RoomSettings) => {
    const room = getRoom();
    if (!room) return;
    const player = room.players.find(p => p.id === socket.data.playerId);
    if (player && player.isHost && room.status === 'lobby') {
      room.updateSettings(settings);
      broadcastRoomUpdate(room);
    }
  });

  const setupTurnTimer = (room: Room) => {
    room.setTimerCallback(() => {
      // Timeout
      const failedPlayerId = room.activePlayerId;
      const player = room.players.find(p => p.id === failedPlayerId);
      if (player) {
        player.score -= 20;
        room.chat.push({ playerId: 'system', text: `${player.name} ran out of time! (-20 pts)`, timestamp: Date.now() });
      }

      // Instead of ending the round, just advance the turn
      room.advanceTurn();
      setupTurnTimer(room);
      broadcastRoomUpdate(room);
    });

    const reqLetter = room.chain.length > 0 ? room.chain[room.chain.length - 1].word.slice(-1) : '';
    io.to(room.code).emit('turn_changed', {
      activePlayerId: room.activePlayerId!,
      requiredLetter: reqLetter,
      deadline: room.turnDeadline!
    });
  };

  const startNewRoundOrEndGame = (room: Room) => {
    if (room.currentRound >= room.settings.rounds) {
      room.status = 'game-end';
      const finalScores = room.players.reduce((acc, p) => ({ ...acc, [p.id]: p.score }), {});
      const maxScore = Math.max(...room.players.map(p => p.score));
      const winnerIds = room.players.filter(p => p.score === maxScore).map(p => p.id);
      
      io.to(room.code).emit('game_ended', { finalScores, winnerIds });
      broadcastRoomUpdate(room);
    } else {
      room.startNextRound();
      io.to(room.code).emit('round_started', {
        roundNumber: room.currentRound,
        startingWord: room.chain[0].word,
        activePlayerId: room.activePlayerId!
      });
      setupTurnTimer(room);
      broadcastRoomUpdate(room);
    }
  };

  socket.on('start_game', () => {
    const room = getRoom();
    if (!room) return;
    const player = room.players.find(p => p.id === socket.data.playerId);
    if (player && player.isHost && room.players.length >= 2) {
      room.startGame();
      io.to(room.code).emit('round_started', {
        roundNumber: room.currentRound,
        startingWord: room.chain[0].word,
        activePlayerId: room.activePlayerId!
      });
      setupTurnTimer(room);
      broadcastRoomUpdate(room);
    }
  });

  socket.on('send_chat', ({ text }) => {
    const room = getRoom();
    if (!room) return;
    const playerId = socket.data.playerId;
    if (playerId) {
      // Keep chat history small
      if (room.chat.length > 50) room.chat.shift();
      room.chat.push({ playerId, text, timestamp: Date.now() });
      broadcastRoomUpdate(room);
    }
  });

  socket.on('kick_player', ({ playerId }) => {
    const room = getRoom();
    if (!room) return;
    const player = room.players.find(p => p.id === socket.data.playerId);
    if (player && player.isHost && playerId !== player.id) {
      room.removePlayer(playerId);
      // force disconnect the kicked player
      const targetSocket = io.sockets.sockets.get(playerId);
      if (targetSocket) {
        targetSocket.emit('error', { message: 'You have been kicked by the host.' });
        targetSocket.disconnect(true);
      }
      broadcastRoomUpdate(room);
    }
  });

  socket.on('skip_turn', () => {
    const room = getRoom();
    if (!room || room.status !== 'playing') return;
    
    if (room.activePlayerId !== socket.data.playerId) return;
    
    const player = room.players.find(p => p.id === socket.data.playerId);
    if (player && player.skips > 0) {
      player.skips -= 1;
      room.chat.push({ playerId: 'system', text: `${player.name} used a Skip!`, timestamp: Date.now() });
      
      room.advanceTurn();
      // Need setupTurnTimer but wait, setupTurnTimer is defined earlier in the scope.
      // Yes, setupTurnTimer is available here.
      setupTurnTimer(room);
      broadcastRoomUpdate(room);
    }
  });

  socket.on('stop_game', () => {
    const room = getRoom();
    if (!room) return;
    const player = room.players.find(p => p.id === socket.data.playerId);
    
    // Only the host can stop the game
    if (player && player.isHost && (room.status === 'playing' || room.status === 'round-end')) {
      room.status = 'game-end';
      const finalScores = room.players.reduce((acc, p) => ({ ...acc, [p.id]: p.score }), {});
      const maxScore = Math.max(...room.players.map(p => p.score));
      const winnerIds = room.players.filter(p => p.score === maxScore).map(p => p.id);
      
      io.to(room.code).emit('game_ended', { finalScores, winnerIds });
      broadcastRoomUpdate(room);
    }
  });

  socket.on('submit_word', ({ word }) => {
    const room = getRoom();
    if (!room || room.status !== 'playing') return;
    
    // Check if it's the player's turn
    if (room.activePlayerId !== socket.data.playerId) return;

    const cleanWord = word.trim().toLowerCase();
    let valid = true;
    let reason = '';

    const lastWord = room.chain[room.chain.length - 1].word;
    const expectedLetter = lastWord[lastWord.length - 1].toLowerCase();

    // 1. Minimum length
    if (cleanWord.length < room.settings.minWordLength) {
      valid = false;
      reason = `Word must be at least ${room.settings.minWordLength} letters long.`;
    }
    // 2. Contains only letters
    else if (!/^[a-z]+$/.test(cleanWord)) {
      valid = false;
      reason = 'Word must contain only letters.';
    }
    // 3. Starts with correct letter
    else if (cleanWord[0] !== expectedLetter) {
      valid = false;
      reason = `Word must start with "${expectedLetter.toUpperCase()}".`;
    }
    // 4. Used already
    else if (room.usedWords.has(cleanWord)) {
      valid = false;
      reason = 'Word has already been used in this game.';
    }
    // 5. Valid English word
    else if (!GameLogic.isValidWord(cleanWord)) {
      valid = false;
      reason = 'Not a valid English word.';
    }

    if (valid) {
      const timeTaken = room.turnDeadline ? room.settings.turnTimeSeconds * 1000 - (room.turnDeadline - Date.now()) : 0;
      const points = GameLogic.calculatePoints(cleanWord, timeTaken, room.settings.turnTimeSeconds * 1000);
      
      const player = room.players.find(p => p.id === socket.data.playerId);
      if (player) player.score += points;

      room.chain.push({ word: cleanWord, playerId: socket.data.playerId });
      room.usedWords.add(cleanWord);
      
      io.to(room.code).emit('word_result', {
        playerId: socket.data.playerId!,
        word: cleanWord,
        valid: true,
        pointsAwarded: points,
        updatedChain: room.chain
      });

      if (room.chain.length >= 15) {
        // Round completed successfully
        room.endRound('chain_completed', undefined);
        const scores = room.players.reduce((acc, p) => ({ ...acc, [p.id]: p.score }), {});
        io.to(room.code).emit('round_ended', { reason: 'chain_completed', scores });
        broadcastRoomUpdate(room);

        setTimeout(() => {
          const r = roomManager.getRoom(room.code);
          if (r && r.status === 'round-end') {
            startNewRoundOrEndGame(r);
          }
        }, 5000);
      } else {
        room.advanceTurn();
        setupTurnTimer(room);
        broadcastRoomUpdate(room);
      }
    } else {
      const player = room.players.find(p => p.id === socket.data.playerId);
      if (player) {
        player.score -= 20;
        room.chat.push({ playerId: 'system', text: `${player.name} submitted an invalid word! (-20 pts)`, timestamp: Date.now() });
      }

      io.to(room.code).emit('word_result', {
        playerId: socket.data.playerId!,
        word: cleanWord,
        valid: false,
        reason,
        updatedChain: room.chain
      });

      // Continue round, just advance turn
      room.advanceTurn();
      setupTurnTimer(room);
      broadcastRoomUpdate(room);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const room = getRoom();
    if (room) {
      room.setPlayerConnected(socket.data.playerId!, false);
      broadcastRoomUpdate(room);

      // Clean up room if empty
      setTimeout(() => {
        roomManager.cleanUpEmptyRooms();
      }, 5000);
      
      // If it's this player's turn, we could auto-fail them or just wait for timeout.
      // Timeout will naturally handle it for now.
    }
  });
});

import path from 'path';

// Serve static frontend files from client/dist when running in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
