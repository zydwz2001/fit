export type TrainingTab = 'today' | 'history' | 'library' | 'trends';

interface BottomNavProps {
  activeTab: TrainingTab | null;
  onTabChange: (tab: TrainingTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'today', label: '今日健身' },
    { id: 'history', label: '月视图' },
    { id: 'library', label: '动作库' },
    { id: 'trends', label: '动作趋势' },
  ] as const;

  return (
    <nav className="bottom-nav" aria-label="训练导航">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
