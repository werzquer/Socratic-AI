import React, { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import SocraticMentor from './components/SocraticMentor';
import { SettingsModal, AiModelType, SocraticMode } from './components/SettingsModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'chat'>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiModel, setAiModel] = useState<AiModelType>('flash');
  const [mode, setMode] = useState<SocraticMode>('socratic');
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  const handleStartChat = (prompt?: string) => {
    setInitialPrompt(prompt);
    setCurrentView('chat');
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('socratic_sessions');
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0E15]">
      {currentView === 'home' ? (
        <HomeScreen
          onStartChat={handleStartChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          aiModel={aiModel}
          setAiModel={setAiModel}
          mode={mode}
        />
      ) : (
        <SocraticMentor
          onGoHome={() => setCurrentView('home')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          aiModel={aiModel}
          setAiModel={setAiModel}
          mode={mode}
          setMode={setMode}
          initialPrompt={initialPrompt}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        aiModel={aiModel}
        setAiModel={setAiModel}
        mode={mode}
        setMode={setMode}
        onClearHistory={handleClearHistory}
        hasApiKey={true}
      />
    </div>
  );
}
