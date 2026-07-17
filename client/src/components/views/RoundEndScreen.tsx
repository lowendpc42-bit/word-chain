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
      <div className="bg-surface rounded-2xl p-8 shadow-sm border border-border relative overflow-hidden">
        {/* Background visual element */}
        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center border-4 border-border shadow-inner">
            <Icon size={40} className="text-primary" />
          </div>
        </div>
        
        <h2 className="text-3xl font-serif text-textMain mb-3">{title}</h2>
        <p className="text-lg text-textMuted mb-8 font-serif italic">{message}</p>

        <div className="bg-background rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-4 text-textMuted/70 justify-center">
            <Users size={16} />
            <span className="text-sm font-semibold uppercase tracking-wider">Current Standings</span>
          </div>
          
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {[...room.players].sort((a, b) => b.score - a.score).map((p, idx) => (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg ${p.id === failedPlayer?.id ? 'bg-red-50 border border-red-100' : 'bg-surface border border-transparent'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-textMuted/50 font-mono font-bold w-4">{idx + 1}.</span>
                  <span className={`font-medium ${p.id === playerId ? 'text-textMain font-bold' : 'text-textMuted'}`}>
                    {p.name} {p.id === playerId && '(You)'}
                  </span>
                </div>
                <span className="font-bold text-primary">{p.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-sm text-textMuted/70 font-medium flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-textMuted/70 border-t-transparent rounded-full animate-spin"></div>
          Next round starting soon...
        </div>
      </div>
    </div>
  );
};

export default RoundEndScreen;
