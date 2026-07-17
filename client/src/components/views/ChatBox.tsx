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
    <div className="flex flex-col h-full bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="bg-background p-3 border-b border-border font-bold text-textMain text-sm">
        Room Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[300px]">
        {(!room.chat || room.chat.length === 0) && (
          <div className="text-center text-textMuted text-sm mt-4 italic">No messages yet...</div>
        )}
        {room.chat?.map((c: any, i: number) => {
          if (c.playerId === 'system') {
            return (
              <div key={i} className="text-center text-xs text-textMuted italic bg-background border border-border rounded py-1 px-2 mx-auto w-fit">
                {c.text}
              </div>
            );
          }
          const player = room.players.find((p: any) => p.id === c.playerId);
          const isMe = c.playerId === playerId;
          
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] text-textMuted mb-0.5 flex items-center gap-1">
                {!isMe && <span>{player?.avatar}</span>}
                <span style={{ color: player?.color || '#737373' }} className="font-medium">{player?.name || 'Unknown'}</span>
                {isMe && <span>{player?.avatar}</span>}
              </div>
              <div 
                className={`px-3 py-1.5 rounded-xl text-sm max-w-[90%] break-words ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-background text-textMain rounded-tl-none border border-border shadow-sm'}`}
              >
                {c.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="p-2 bg-background border-t border-border flex gap-2">
        <input
          type="text"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-textMain placeholder-textMuted/50 focus:outline-none focus:border-primary/50 shadow-sm transition-colors"
        />
        <button 
          type="submit"
          disabled={!msg.trim()}
          className="px-3 py-1.5 bg-primary hover:bg-primary-hover disabled:bg-surface disabled:border disabled:border-border disabled:text-textMuted/50 text-white rounded-lg transition-colors flex items-center justify-center shadow-sm"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
