import { useState, createContext, useContext, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export default function Tabs({ tabs, defaultTab, onChange, className, children }: TabsProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab || tabs[0]?.id || '');

  const setActiveTab = (id: string) => {
    setActiveTabState(id);
    onChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>
        <div className="flex border-b border-surface-200 dark:border-surface-800" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:text-surface-400 dark:hover:text-surface-200',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4" role="tabpanel">{children}</div>
      </div>
    </TabsContext.Provider>
  );
}

interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  tabId: string;
}

Tabs.Panel = function TabPanel({ tabId, className, children }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab.Panel must be used within Tabs');
  if (context.activeTab !== tabId) return null;
  return (
    <div role="tabpanel" className={cn('text-surface-900 dark:text-surface-100', className)}>
      {children}
    </div>
  );
};
