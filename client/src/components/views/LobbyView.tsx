import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Copy, Users, Settings, Play, Check } from 'lucide-react';
import { ChatBox } from './ChatBox';

const LobbyView: React.FC = () => {
  const { socket, room, playerId } = useSocket();
  const [copied, setCopied] = useState(false);

  if (!room || !socket) return null;

  const isHost = room.players.find(p => p.id === playerId)?.isHost;
  const shareableLink = `${window.location.origin}?room=${room.code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateSetting = (key: keyof typeof room.settings, value: number) => {
    if (!isHost) return;
    socket.emit('update_settings', { ...room.settings, [key]: value });
  };

  const handleStart = () => {
    if (isHost && room.players.length >= 2) {
      socket.emit('start_game');
    }
  };

  return (
    <div className="w-full max-w-4xl animate-slide-up space-y-6">
      
      {/* Header & Link Share */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Room: <span className="text-primary font-mono tracking-widest">{room.code}</span></h2>
          <p className="text-slate-400">Invite friends using the link below</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 shadow-inner">
          <input 
            type="text" 
            readOnly 
            value={shareableLink}
            className="bg-transparent flex-1 outline-none px-3 text-slate-300 font-medium truncate"
          />
          <button 
            onClick={handleCopy}
            className="bg-primary/20 hover:bg-primary/30 text-primary p-3 rounded-lg transition-colors flex items-center justify-center min-w-[48px]"
            title="Copy link"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Player List */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-slate-300">
            <Users size={20} className="text-secondary" />
            <h3 className="font-semibold text-lg">Players ({room.players.length}/8)</h3>
          </div>
          
          <ul className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2">
            {room.players.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: p.color ? p.color + '40' : undefined, border: p.color ? `1px solid ${p.color}` : undefined }}>
                    {p.avatar || p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-medium ${p.id === playerId ? 'text-white' : 'text-slate-300'}`} style={{ color: p.color || 'inherit' }}>
                    {p.name} {p.id === playerId && '(You)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.isHost && <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-md font-medium">Host</span>}
                  {!p.connected && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-medium">Offline</span>}
                  {isHost && !p.isHost && (
                    <button 
                      onClick={() => { if (window.confirm('Kick this player?')) socket.emit('kick_player', { playerId: p.id }); }} 
                      className="text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-2 py-1 rounded transition-colors text-xs border border-red-500/30"
                    >
                      Kick
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Settings & Actions */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4 text-slate-300">
              <Settings size={20} className="text-primary" />
              <h3 className="font-semibold text-lg">Game Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-slate-400">Rounds</label>
                  <span className="text-sm font-medium text-white">{room.settings.rounds}</span>
                </div>
                <input 
                  type="range" min="1" max="15" 
                  value={room.settings.rounds}
                  onChange={(e) => updateSetting('rounds', parseInt(e.target.value))}
                  disabled={!isHost}
                  className={`w-full accent-primary ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-slate-400">Turn Timer</label>
                  <span className="text-sm font-medium text-white">{room.settings.turnTimeSeconds}s</span>
                </div>
                <input 
                  type="range" min="10" max="60" step="5"
                  value={room.settings.turnTimeSeconds}
                  onChange={(e) => updateSetting('turnTimeSeconds', parseInt(e.target.value))}
                  disabled={!isHost}
                  className={`w-full accent-secondary ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-slate-400">Min Word Length</label>
                  <span className="text-sm font-medium text-white">{room.settings.minWordLength}</span>
                </div>
                <input 
                  type="range" min="2" max="5"
                  value={room.settings.minWordLength}
                  onChange={(e) => updateSetting('minWordLength', parseInt(e.target.value))}
                  disabled={!isHost}
                  className={`w-full accent-primary ${!isHost && 'opacity-50 cursor-not-allowed'}`}
                />
              </div>
            </div>
          </div>

          <div>
            {isHost ? (
              <button 
                onClick={handleStart}
                disabled={room.players.length < 2}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform ${room.players.length >= 2 ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <Play size={20} />
                {room.players.length < 2 ? 'Waiting for players...' : 'Start Game'}
              </button>
            ) : (
              <div className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-center flex items-center justify-center gap-2 shadow-inner">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                Waiting for host to start...
              </div>
            )}
          </div>
        </div>

        {/* Chat Box */}
        <div className="md:col-span-1 h-[450px]">
          <ChatBox socket={socket} room={room} playerId={playerId!} />
        </div>
      </div>
    </div>
  );
};

export default LobbyView;
