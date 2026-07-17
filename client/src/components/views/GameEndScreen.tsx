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
        <Trophy size={80} className="text-primary relative z-10 mx-auto" />
        <h1 className="text-5xl font-serif text-textMain mt-4 relative z-10">Game Over!</h1>
      </div>

      {isWinner && (
        <div className="text-2xl font-serif text-primary mb-8">
          🎉 You are a Winner! 🎉
        </div>
      )}

      <div className="bg-surface rounded-3xl p-8 shadow-sm border border-border mb-8 max-w-lg mx-auto">
        <h2 className="text-xl font-serif text-textMain mb-6 uppercase tracking-widest">Final Leaderboard</h2>
        
        <div className="space-y-4">
          {sortedPlayers.map((p, idx) => {
            const isFirst = idx === 0;
            const isWinnerItem = gameEndData.winnerIds.includes(p.id);
            return (
              <div 
                key={p.id} 
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isWinnerItem 
                    ? 'bg-primary/5 border border-primary/20 shadow-sm' 
                    : 'bg-background border border-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isFirst ? 'bg-primary text-white' : 'bg-surface border border-border text-textMuted'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className={`font-medium text-lg flex items-center gap-2 ${p.id === playerId ? 'text-textMain font-bold' : 'text-textMuted'}`} style={{ color: p.color || 'inherit' }}>
                      <span>{p.avatar}</span>
                      {p.name} {p.id === playerId && '(You)'}
                    </span>
                    {isWinnerItem && <span className="text-xs text-primary font-medium flex items-center gap-1"><Medal size={12}/> Winner</span>}
                  </div>
                </div>
                <div className={`text-2xl font-black ${isWinnerItem ? 'text-primary' : 'text-textMuted'}`}>
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
          className="bg-primary hover:bg-primary-hover text-white font-medium py-4 px-8 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Home size={20} />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default GameEndScreen;
