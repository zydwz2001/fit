interface MainNavProps {
  activeTab: 'training' | 'body' | 'knowledge';
  onTabChange: (tab: 'training' | 'body' | 'knowledge') => void;
}

export function MainNav({ activeTab, onTabChange }: MainNavProps) {
  const tabs = [
    { id: 'training', label: '训练' },
    { id: 'body', label: '身体' },
    { id: 'knowledge', label: '知识' },
  ] as const;

  return (
    <nav className="main-nav" aria-label="主要功能">
      {tabs.map(tab => <button
        key={tab.id}
        type="button"
        className={activeTab === tab.id ? 'active' : ''}
        aria-current={activeTab === tab.id ? 'page' : undefined}
        onClick={() => onTabChange(tab.id)}
      >{tab.label}</button>)}
    </nav>
  );
}
