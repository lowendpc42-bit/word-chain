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
    <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
      <div className="bg-slate-800/80 p-3 border-b border-slate-700 font-bold text-slate-200 text-sm">
        Room Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[300px]">
        {(!room.chat || room.chat.length === 0) && (
          <div className="text-center text-slate-500 text-sm mt-4 italic">No messages yet...</div>
        )}
        {room.chat?.map((c: any, i: number) => {
          if (c.playerId === 'system') {
            return (
              <div key={i} className="text-center text-xs text-slate-400 italic bg-slate-800/50 rounded py-1 px-2 mx-auto w-fit">
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
                className={`px-3 py-1.5 rounded-xl text-sm max-w-[90%] break-words ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}
              >
                {c.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="p-2 bg-slate-800/50 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-primary transition-colors"
        />
        <button 
          type="submit"
          disabled={!msg.trim()}
          className="px-3 py-1.5 bg-primary hover:bg-primary-hover disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center justify-center"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
