import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Send, Clock, User, XCircle, CheckCircle, Volume2, VolumeX, FastForward } from 'lucide-react';
import { ChatBox } from './ChatBox';
import { playDing, playBuzz, playTick, setMuted } from '../../utils/audio';

const GameScreen: React.FC = () => {
  const { socket, room, playerId, turnData, wordResult, clearWordResult } = useSocket();
  const [inputWord, setInputWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chainEndRef = useRef<HTMLDivElement>(null);
  const isMyTurnRef = useRef(false);

  if (!room || !socket) return null;

  const isMyTurn = turnData?.activePlayerId === playerId;
  isMyTurnRef.current = isMyTurn;
  const activePlayer = room.players.find(p => p.id === turnData?.activePlayerId);
  const isHost = room.players.find(p => p.id === playerId)?.isHost;

  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMyTurn]);

  // Scroll to bottom of chain
  useEffect(() => {
    chainEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chain]);

  useEffect(() => {
    if (wordResult) {
      if (wordResult.valid) playDing();
      else playBuzz();
    }
  }, [wordResult]);

  // Timer logic
  useEffect(() => {
    if (!turnData?.deadline) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, turnData.deadline - now);
      const newSecs = Math.ceil(remaining / 1000);
      
      setTimeLeft(prev => {
        if (prev !== newSecs && newSecs <= 5 && newSecs > 0) {
          playTick();
        }
        return newSecs;
      });
      
      const totalTimeMs = room.settings.turnTimeSeconds * 1000;
      setProgress((remaining / totalTimeMs) * 100);

      if (remaining <= 0) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [turnData?.deadline, room.settings.turnTimeSeconds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMyTurn || !inputWord.trim()) return;
    
    socket.emit('submit_word', { word: inputWord.trim() });
    setInputWord('');
    clearWordResult();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setMuted(!isMuted);
  };

  const getTimerColor = () => {
    if (progress > 50) return 'bg-green-500';
    if (progress > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-6xl h-[90vh] flex flex-col md:flex-row gap-6 animate-slide-up">
      
      {/* Left Column: Chain & Input */}
      <div className="flex-1 flex flex-col bg-surface rounded-2xl shadow-sm border border-border overflow-hidden relative min-w-[300px]">
        {/* Header */}
        <div className="p-4 bg-background border-b border-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-serif text-textMain">Round {room.currentRound} / {room.settings.rounds}</h2>
            <button onClick={toggleMute} className="text-textMuted hover:text-textMain transition-colors" title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
          {turnData?.requiredLetter && (
            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm">
              <span className="text-sm text-textMuted">Must start with</span>
              <span className="text-xl font-black text-textMain">{turnData.requiredLetter.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Chain Display */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {room.chain.map((item, idx) => {
            const player = room.players.find(p => p.id === item.playerId);
            const isFirst = idx === 0;
            return (
              <div key={idx} className={`flex flex-col ${item.playerId === playerId ? 'items-end' : 'items-start'}`}>
                {!isFirst && (
                  <span className="text-xs text-textMuted mb-1 font-medium flex items-center gap-1" style={{ color: player?.color || 'inherit' }}>
                    <span>{player?.avatar}</span>
                    {player?.name || 'Unknown'}
                  </span>
                )}
                <div className={`px-4 py-2 rounded-2xl text-lg shadow-sm ${
                  isFirst ? 'bg-background border border-border text-textMuted' : 
                  item.playerId === playerId ? 'bg-primary text-white rounded-br-sm font-medium' : 'bg-surface border border-border text-textMain rounded-bl-sm font-medium'
                }`}>
                  {item.word}
                </div>
              </div>
            );
          })}
          <div ref={chainEndRef} />
        </div>

        {/* Validation Feedback overlay */}
        {wordResult && !wordResult.valid && wordResult.playerId === playerId && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-500/95 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up z-10">
            <XCircle size={18} />
            <span className="font-medium text-sm">{wordResult.reason}</span>
          </div>
        )}

        {/* Timer Bar */}
        <div className="h-1.5 w-full bg-background border-y border-border shrink-0">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${getTimerColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              disabled={!isMyTurn}
              placeholder={isMyTurn ? `Starts with ${turnData?.requiredLetter.toUpperCase()}...` : `${activePlayer?.name}'s turn...`}
              className={`flex-1 bg-surface border rounded-xl px-4 py-3 text-lg font-medium text-textMain placeholder-textMuted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm ${
                isMyTurn ? 'border-primary' : 'border-border opacity-70 cursor-not-allowed'
              }`}
            />
            <button
              type="submit"
              disabled={!isMyTurn || !inputWord.trim()}
              className={`px-6 rounded-xl flex items-center justify-center transition-all ${
                isMyTurn && inputWord.trim() ? 'bg-primary hover:bg-primary-hover text-white shadow-md transform hover:-translate-y-0.5' : 'bg-surface border border-border text-textMuted/50 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
            <button
              type="button"
              disabled={!isMyTurn || (activePlayer?.skips || 0) === 0}
              onClick={() => socket.emit('skip_turn')}
              title={`Skip turn (${activePlayer?.skips || 0} left)`}
              className={`px-4 rounded-xl flex items-center justify-center transition-all ${
                isMyTurn && (activePlayer?.skips || 0) > 0 ? 'bg-surface border border-border text-textMuted hover:text-primary hover:border-primary shadow-sm' : 'bg-surface border border-border text-textMuted/50 hidden'
              }`}
            >
              <FastForward size={20} />
              <span className="ml-1 font-bold">{activePlayer?.skips || 0}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Scoreboard */}
      <div className="w-full md:w-64 flex flex-col gap-4 shrink-0">
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-4">
          <div className="flex items-center gap-2 mb-4 text-textMain">
            <Clock size={18} className={timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-textMuted'} />
            <h3 className="font-semibold text-lg">{timeLeft}s left</h3>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-textMuted/70 uppercase tracking-wider mb-2">Scores</div>
            {/* Sort players by score desc */}
            {[...room.players].sort((a, b) => b.score - a.score).map((p, idx) => (
              <div 
                key={p.id} 
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  p.id === turnData?.activePlayerId ? 'bg-surface border-primary/50 shadow-sm' : 'bg-background border-border'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`font-medium text-sm truncate max-w-[120px] flex items-center gap-1 ${p.id === playerId ? 'text-textMain font-bold' : 'text-textMuted'}`} style={{ color: p.color || 'inherit' }}>
                    <span>{p.avatar}</span>
                    {p.name} {p.id === playerId && '(You)'}
                  </span>
                  {!p.connected && <span className="text-[10px] text-red-500">Offline</span>}
                </div>
                <span className="font-bold text-primary">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
        
        {wordResult && wordResult.valid && wordResult.pointsAwarded && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 animate-slide-up text-green-700 shadow-sm">
            <CheckCircle size={18} />
            <span className="font-medium text-sm text-green-800">
              +{wordResult.pointsAwarded} pts!
            </span>
          </div>
        )}

        {isHost && (
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to end the game early?')) {
                socket.emit('stop_game');
              }
            }}
            className="mt-auto w-full py-3 bg-background text-red-600 hover:bg-red-50 border border-red-200 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <XCircle size={18} />
            End Game Early
          </button>
        )}
      </div>

      {/* Right Column: ChatBox */}
      <div className="w-full md:w-72 flex flex-col shrink-0 h-[250px] md:h-full">
        <ChatBox socket={socket} room={room} playerId={playerId!} />
      </div>

    </div>
  );
};

export default GameScreen;
