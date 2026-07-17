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
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs for Glassmorphism */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-secondary/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-accent/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Foreground Content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
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
