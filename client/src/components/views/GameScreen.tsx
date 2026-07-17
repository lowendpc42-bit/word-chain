import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Send, Clock, User, XCircle, CheckCircle } from 'lucide-react';

const GameScreen: React.FC = () => {
  const { socket, room, playerId, turnData, wordResult, clearWordResult } = useSocket();
  const [inputWord, setInputWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  const chainEndRef = useRef<HTMLDivElement>(null);

  if (!room || !socket) return null;

  const isMyTurn = turnData?.activePlayerId === playerId;
  const activePlayer = room.players.find(p => p.id === turnData?.activePlayerId);

  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMyTurn]);

  // Scroll to bottom of chain
  useEffect(() => {
    chainEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chain]);

  // Timer logic
  useEffect(() => {
    if (!turnData?.deadline) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, turnData.deadline - now);
      setTimeLeft(Math.ceil(remaining / 1000));
      
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

  const getTimerColor = () => {
    if (progress > 50) return 'bg-green-500';
    if (progress > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-4xl h-[90vh] flex flex-col md:flex-row gap-6 animate-slide-up">
      
      {/* Left Column: Chain & Input */}
      <div className="flex-1 flex flex-col bg-surface rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden relative">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Round {room.currentRound} / {room.settings.rounds}</h2>
          </div>
          {turnData?.requiredLetter && (
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-600">
              <span className="text-sm text-slate-400">Must start with</span>
              <span className="text-xl font-black text-white">{turnData.requiredLetter.toUpperCase()}</span>
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
                  <span className="text-xs text-slate-500 mb-1 font-medium">{player?.name || 'Unknown'}</span>
                )}
                <div className={`px-4 py-2 rounded-2xl text-lg font-medium shadow-md ${
                  isFirst ? 'bg-slate-700 text-white' : 
                  item.playerId === playerId ? 'bg-primary text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
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
        <div className="h-1.5 w-full bg-slate-800 shrink-0">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${getTimerColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-800/80 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              disabled={!isMyTurn}
              placeholder={isMyTurn ? `Starts with ${turnData?.requiredLetter.toUpperCase()}...` : `${activePlayer?.name}'s turn...`}
              className={`flex-1 bg-slate-900 border rounded-xl px-4 py-3 text-lg font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                isMyTurn ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-slate-700 opacity-70 cursor-not-allowed'
              }`}
            />
            <button
              type="submit"
              disabled={!isMyTurn || !inputWord.trim()}
              className={`px-6 rounded-xl flex items-center justify-center transition-all ${
                isMyTurn && inputWord.trim() ? 'bg-primary hover:bg-blue-600 text-white shadow-lg transform hover:-translate-y-0.5' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Scoreboard */}
      <div className="w-full md:w-64 flex flex-col gap-4 shrink-0">
        <div className="bg-surface rounded-2xl shadow-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-4 text-slate-300">
            <Clock size={18} className={timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-400'} />
            <h3 className="font-semibold text-lg">{timeLeft}s left</h3>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Scores</div>
            {/* Sort players by score desc */}
            {[...room.players].sort((a, b) => b.score - a.score).map((p, idx) => (
              <div 
                key={p.id} 
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  p.id === turnData?.activePlayerId ? 'bg-primary/20 border-primary animate-pulse-border' : 'bg-slate-800/50 border-transparent'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`font-medium text-sm truncate max-w-[120px] ${p.id === playerId ? 'text-white' : 'text-slate-300'}`}>
                    {p.name} {p.id === playerId && '(You)'}
                  </span>
                  {!p.connected && <span className="text-[10px] text-red-400">Offline</span>}
                </div>
                <span className="font-bold text-secondary">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
        
        {wordResult && wordResult.valid && wordResult.pointsAwarded && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 flex items-center gap-2 animate-slide-up text-green-400">
            <CheckCircle size={18} />
            <span className="font-medium text-sm text-green-100">
              +{wordResult.pointsAwarded} pts!
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default GameScreen;
