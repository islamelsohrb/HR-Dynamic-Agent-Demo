import React from 'react';
import { Menu, UploadCloud, UserCircle } from 'lucide-react';
import { Page } from '../types';

interface TopBarProps {
  currentPage: Page;
  onToggleSidebar: () => void;
  onUploadClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  currentPage, 
  onToggleSidebar, 
  onUploadClick 
}) => {
  
  const getPageTitle = () => {
    switch (currentPage) {
      case Page.OVERVIEW: return 'Overview';
      case Page.DATA_STUDIO: return 'Data Studio';
      case Page.AGENT_CONSOLE: return 'Agent Console';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{getPageTitle()}</h2>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
        >
          <UploadCloud size={18} />
          <span className="hidden sm:inline">Upload Data</span>
        </button>
        
        <div className="w-px h-8 bg-slate-200 mx-1"></div>
        
        <button className="text-slate-400 hover:text-purple-600 transition-colors">
          <UserCircle size={28} />
        </button>
      </div>
    </header>
  );
};