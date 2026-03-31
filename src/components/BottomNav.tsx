interface BottomNavProps {
  activeTab: 'training' | 'body' | 'knowledge';
  onTabChange: (tab: 'training' | 'body' | 'knowledge') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'training', icon: 'fa-bolt', label: '训练' },
    { id: 'body', icon: 'fa-chart-pie', label: '身体' },
    { id: 'knowledge', icon: 'fa-brain', label: '知识' },
  ] as const;

  return (
    <div className="bottom-nav">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <i className={`fas ${tab.icon}`}></i>
          <span className="text-[9px] font-black">{tab.label}</span>
        </div>
      ))}
    </div>
  );
}
