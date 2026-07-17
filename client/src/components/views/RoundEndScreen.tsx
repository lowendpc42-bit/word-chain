import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { AlertTriangle, Clock, Frown, Users } from 'lucide-react';

const RoundEndScreen: React.FC = () => {
  const { room, roundEndData, playerId } = useSocket();

  if (!room || !roundEndData) return null;

  const failedPlayer = room.players.find(p => p.id === roundEndData.failedPlayerId);
  const isMe = failedPlayer?.id === playerId;

  let Icon = AlertTriangle;
  let title = 'Round Over!';
  let message = roundEndData.reason;

  if (roundEndData.reason === 'timeout') {
    Icon = Clock;
    title = 'Time\'s Up!';
    message = failedPlayer ? `${failedPlayer.name} ran out of time.` : 'Someone ran out of time.';
  } else if (failedPlayer) {
    Icon = Frown;
    title = isMe ? 'Oops!' : 'Chain Broken!';
    message = `${failedPlayer.name} broke the chain: ${roundEndData.reason}`;
  }

  return (
    <div className="w-full max-w-lg text-center animate-slide-up">
      <div className="bg-surface rounded-2xl p-8 shadow-xl border border-slate-700/50 backdrop-blur-sm relative overflow-hidden">
        {/* Background visual element */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-secondary"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-inner">
            <Icon size={40} className="text-accent" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-3">{title}</h2>
        <p className="text-lg text-slate-300 mb-8 font-medium">{message}</p>

        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-4 text-slate-400 justify-center">
            <Users size={16} />
            <span className="text-sm font-semibold uppercase tracking-wider">Current Standings</span>
          </div>
          
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {[...room.players].sort((a, b) => b.score - a.score).map((p, idx) => (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg ${p.id === failedPlayer?.id ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-900/50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono font-bold w-4">{idx + 1}.</span>
                  <span className={`font-medium ${p.id === playerId ? 'text-white' : 'text-slate-300'}`}>
                    {p.name} {p.id === playerId && '(You)'}
                  </span>
                </div>
                <span className="font-bold text-secondary">{p.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
          Next round starting soon...
        </div>
      </div>
    </div>
  );
};

export default RoundEndScreen;
