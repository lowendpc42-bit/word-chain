import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export const ChatBox = ({ socket, room, playerId }: { socket: any, room: any, playerId: string }) => {
  const [msg, setMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chat]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    socket.emit('send_chat', { text: msg.trim() });
    setMsg('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="bg-white/5 p-3 border-b border-white/10 font-bold text-slate-200 text-sm shadow-sm">
        Room Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[300px]">
        {(!room.chat || room.chat.length === 0) && (
          <div className="text-center text-slate-500 text-sm mt-4 italic">No messages yet...</div>
        )}
        {room.chat?.map((c: any, i: number) => {
          if (c.playerId === 'system') {
            return (
              <div key={i} className="text-center text-xs text-slate-300 font-medium italic bg-white/10 border border-white/10 rounded-lg py-1 px-3 mx-auto w-fit shadow-inner">
                {c.text}
              </div>
            );
          }
          const player = room.players.find((p: any) => p.id === c.playerId);
          const isMe = c.playerId === playerId;
          
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                {!isMe && <span>{player?.avatar}</span>}
                <span style={{ color: player?.color || '#ccc' }} className="font-medium">{player?.name || 'Unknown'}</span>
                {isMe && <span>{player?.avatar}</span>}
              </div>
              <div 
                className={`px-3 py-2 rounded-xl text-sm max-w-[90%] break-words shadow-md backdrop-blur-md font-medium ${isMe ? 'bg-primary/80 text-white rounded-tr-none border border-primary/50' : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/10'}`}
              >
                {c.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
        />
        <button 
          type="submit"
          disabled={!msg.trim()}
          className="px-3 py-2 bg-primary hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-500 disabled:border disabled:border-white/5 border border-primary/50 text-white rounded-lg transition-colors flex items-center justify-center shadow-md"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
