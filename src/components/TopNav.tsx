
"use client";

import React from 'react';
import { Plus } from 'lucide-react';
import { AppTab } from '@/app/page';
import { cn } from '@/lib/utils';

interface TopNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onAddClick: () => void;
}

const TopNav = ({ activeTab, setActiveTab, onAddClick }: TopNavProps) => {
  const tabs: AppTab[] = ['Notebook', 'Chat', 'Quiz'];

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-8 h-full">
        <div className="flex items-center gap-6 h-full pt-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative h-full flex items-center px-1 text-sm font-medium transition-colors hover:text-foreground",
                activeTab === tab ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={onAddClick}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all active:scale-95"
      >
        <Plus size={16} />
        Add
      </button>
    </header>
  );
};

export default TopNav;
