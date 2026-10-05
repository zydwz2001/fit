import { useEffect, useState } from 'react';
import { StatusBar, MainNav, BottomNav } from '@/components';
import type { TrainingTab } from '@/components/BottomNav';
import { TrainingPage, BodyPage, KnowledgePage } from '@/pages';
import { AppProvider } from '@/contexts/AppContext';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { handleAppBack } from '@/utils/navigation';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'training' | 'body' | 'knowledge'>('training');
  const [trainingTab, setTrainingTab] = useState<TrainingTab>('today');
  const isNativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    const dismissNativeKeyboardOnOutsideTap = (event: PointerEvent) => {
      const focused = document.activeElement;
      if (
        !(focused instanceof HTMLInputElement) &&
        !(focused instanceof HTMLTextAreaElement) &&
        !(focused instanceof HTMLElement && focused.isContentEditable)
      ) return;

      const target = event.target;
      if (!(target instanceof Node) || focused.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest('input, textarea, select, [contenteditable]')
      ) return;

      focused.blur();
    };

    document.addEventListener('pointerdown', dismissNativeKeyboardOnOutsideTap);
    return () => document.removeEventListener('pointerdown', dismissNativeKeyboardOnOutsideTap);
  }, []);

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

      <MainNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="app-content">
        {activeTab === 'training' && <TrainingPage subTab={trainingTab} onSubTabChange={setTrainingTab} />}
        {activeTab === 'body' && <BodyPage />}
        {activeTab === 'knowledge' && <KnowledgePage />}
      </main>
      <BottomNav activeTab={activeTab === 'training' ? trainingTab : null} onTabChange={(tab) => {
        setTrainingTab(tab);
        setActiveTab('training');
      }} />
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
