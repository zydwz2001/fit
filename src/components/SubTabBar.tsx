interface SubTabBarProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function SubTabBar({ tabs, activeTab, onTabChange, className = '' }: SubTabBarProps) {
  return (
    <div className={`flex border-b border-slate-100 bg-white ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${
            activeTab === tab.id ? 'text-vibe-green' : 'text-slate-400'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
