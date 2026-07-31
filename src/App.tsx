import { useState } from 'react';
import { StatusBar, BottomNav } from '@/components';
import { TrainingPage, BodyPage, KnowledgePage } from '@/pages';
import { AppProvider } from '@/contexts/AppContext';
import { Capacitor } from '@capacitor/core';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'training' | 'body' | 'knowledge'>('training');
  const isNativeApp = Capacitor.isNativePlatform();

  return (
    <div className={`phone-container ${isNativeApp ? 'native-app' : ''}`}>
      {!isNativeApp && <StatusBar />}

      {activeTab === 'training' && <TrainingPage />}
      {activeTab === 'body' && <BodyPage />}
      {activeTab === 'knowledge' && <KnowledgePage />}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
