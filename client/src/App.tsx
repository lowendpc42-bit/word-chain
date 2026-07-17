import React from 'react';
import { useSocket } from './context/SocketContext';
import HomeView from './components/views/HomeView';
import LobbyView from './components/views/LobbyView';
import GameScreen from './components/views/GameScreen';
import RoundEndScreen from './components/views/RoundEndScreen';
import GameEndScreen from './components/views/GameEndScreen';
import { AlertCircle } from 'lucide-react';

function AppContent() {
  const { room, error, setError } = useSocket();

  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col items-center justify-center p-4">
      {/* Foreground Content */}
      <div className="w-full flex flex-col items-center justify-center">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50 animate-slide-up">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 hover:text-red-200 text-sm font-bold">×</button>
        </div>
      )}
      
      {!room && <HomeView />}
      
      {room && room.status === 'lobby' && <LobbyView />}
      
      {room && room.status === 'playing' && <GameScreen />}
      
      {room && room.status === 'round-end' && <RoundEndScreen />}
      
      {room && room.status === 'game-end' && <GameEndScreen />}
      </div>
    </div>
  );
}

function App() {
  return (
    <AppContent />
  );
}

export default App;
