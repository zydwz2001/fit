import { useState } from 'react';
import { StatusBar, BottomNav } from '@/components';
import { TrainingPage, BodyPage, KnowledgePage } from '@/pages';
import { AppProvider } from '@/contexts/AppContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'training' | 'body' | 'knowledge'>('training');

  return (
    <div className="phone-container">
      <StatusBar />

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
