import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { Trophy, Medal, RotateCcw, Home } from 'lucide-react';

const GameEndScreen: React.FC = () => {
  const { socket, room, gameEndData, playerId, setPlayerId } = useSocket();

  if (!room || !gameEndData) return null;

  const isHost = room.players.find(p => p.id === playerId)?.isHost;
  const isWinner = gameEndData.winnerIds.includes(playerId || '');

  // Sort players by final score
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  const handlePlayAgain = () => {
    // A simple approach is for the host to emit 'update_settings' or just a new 'play_again' event
    // For MVP, they can just leave room or we can add a reset feature. Let's just have them leave and create a new room for now if we don't have play again fully wired up on server.
    // Wait, the easiest is to just reload the page and let them join the same room. But it might be in game-end state.
    // Let's implement a 'leave_room' client side reset
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomCode');
    window.location.href = '/';
  };

  return (
    <div className="w-full max-w-2xl text-center animate-slide-up py-8">
      <div className="mb-10 relative inline-block">
        <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
        <Trophy size={80} className="text-yellow-400 relative z-10 mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mt-4 relative z-10">Game Over!</h1>
      </div>

      {isWinner && (
        <div className="text-2xl font-bold text-white mb-8 animate-pulse">
          🎉 You are a Winner! 🎉
        </div>
      )}

      <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 mb-8 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-slate-300 mb-6 uppercase tracking-widest">Final Leaderboard</h2>
        
        <div className="space-y-4">
          {sortedPlayers.map((p, idx) => {
            const isFirst = idx === 0;
            const isWinnerItem = gameEndData.winnerIds.includes(p.id);
            return (
              <div 
                key={p.id} 
                className={`flex items-center justify-between p-4 rounded-xl backdrop-blur-sm ${
                  isWinnerItem 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-inner ${
                    isFirst ? 'bg-yellow-500 text-yellow-900' : 'bg-white/10 text-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={`font-bold text-lg flex items-center gap-2 ${p.id === playerId ? 'text-white' : 'text-slate-300'}`} style={{ color: p.color || 'inherit' }}>
                      <span>{p.avatar}</span>
                      {p.name} {p.id === playerId && '(You)'}
                    </span>
                    {isWinnerItem && <span className="text-xs text-yellow-400 font-medium flex items-center gap-1"><Medal size={12}/> Winner</span>}
                  </div>
                </div>
                <div className={`text-2xl font-black ${isWinnerItem ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {p.score}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={handlePlayAgain}
          className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Home size={20} />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default GameEndScreen;
