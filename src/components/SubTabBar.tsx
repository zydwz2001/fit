interface SubTabBarProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function SubTabBar({ tabs, activeTab, onTabChange, className = '' }: SubTabBarProps) {
  return (
    <div className={`px-6 flex gap-6 border-b border-slate-100 bg-white/80 backdrop-blur-md ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`sub-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
