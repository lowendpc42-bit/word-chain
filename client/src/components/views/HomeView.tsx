import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Keyboard, LogIn } from 'lucide-react';

const HomeView: React.FC = () => {
  const { socket, setError, setPlayerId } = useSocket();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // Check if there's a room code in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
      setIsJoining(true);
    }
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !socket) return;
    
    socket.emit('create_room', { playerName: name }, (res: { roomCode: string, playerId: string }) => {
      setPlayerId(res.playerId);
      window.history.pushState({}, '', `?room=${res.roomCode}`);
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim() || !socket) return;
    
    socket.emit('join_room', { roomCode: roomCode.toUpperCase(), playerName: name }, (res: { success: boolean, playerId?: string, error?: string }) => {
      if (res.success && res.playerId) {
        setPlayerId(res.playerId);
        window.history.pushState({}, '', `?room=${roomCode.toUpperCase()}`);
      } else if (res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-serif text-textMain mb-3">Word Chain</h1>
        <p className="text-textMuted text-lg font-serif italic">The fast-paced multiplayer word game.</p>
      </div>

      <div className="bg-surface rounded-2xl p-8 shadow-sm border border-border">
        <div className="flex gap-2 mb-8 p-1 bg-background rounded-xl border border-border">
          <button 
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${!isJoining ? 'bg-surface text-textMain shadow-sm border border-border' : 'text-textMuted hover:text-textMain hover:bg-surface/50'}`}
            onClick={() => setIsJoining(false)}
          >
            Create Room
          </button>
          <button 
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${isJoining ? 'bg-surface text-textMain shadow-sm border border-border' : 'text-textMuted hover:text-textMain hover:bg-surface/50'}`}
            onClick={() => setIsJoining(true)}
          >
            Join Room
          </button>
        </div>

        <form onSubmit={isJoining ? handleJoin : handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Your Name</label>
            <input 
              type="text" 
              maxLength={15}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-textMain placeholder-textMuted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Enter your name"
              required
            />
          </div>

          {isJoining && (
            <div className="animate-slide-up">
              <label className="block text-sm font-medium text-textMuted mb-2">Room Code</label>
              <input 
                type="text" 
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-textMain placeholder-textMuted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono uppercase tracking-widest text-xl"
                placeholder="ABCDEF"
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isJoining ? <><LogIn size={18} /> Join Game</> : <><Keyboard size={18} /> Create Game</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomeView;
