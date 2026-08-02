import { useEffect, useState } from 'react';
import { StatusBar, BottomNav } from '@/components';
import { TrainingPage, BodyPage, KnowledgePage } from '@/pages';
import { AppProvider } from '@/contexts/AppContext';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { handleAppBack } from '@/utils/navigation';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'training' | 'body' | 'knowledge'>('training');
  const isNativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNativeApp) return;

    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;

    void NativeApp.addListener('backButton', () => {
      if (handleAppBack()) return;

      if (activeTab !== 'training') {
        setActiveTab('training');
        return;
      }

      void NativeApp.exitApp();
    }).then((handle) => {
      if (disposed) {
        void handle.remove();
      } else {
        removeListener = () => handle.remove();
      }
    });

    return () => {
      disposed = true;
      if (removeListener) void removeListener();
    };
  }, [activeTab, isNativeApp]);

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
