
import React, { useState } from 'react';
import { LayoutDashboard, Database, Bot, Box, X, List, Layers } from 'lucide-react';
import { Page, ActiveDataset, DatasetListItem } from '../types';
import { DatasetList } from './DatasetList';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  activeDataset: ActiveDataset | null;
  datasetList: DatasetListItem[];
  onActivateDataset: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onNavigate, 
  isOpen, 
  onClose,
  isMobile,
  activeDataset,
  datasetList,
  onActivateDataset
}) => {
  const [viewMode, setViewMode] = useState<'nav' | 'data'>('nav');
  
  const navItems = [
    { id: Page.OVERVIEW, label: 'Overview', icon: LayoutDashboard },
    { id: Page.DATA_STUDIO, label: 'Data Studio', icon: Database },
    { id: Page.AGENT_CONSOLE, label: 'Agent Console', icon: Bot },
  ];

  const sidebarClasses = `
    fixed top-0 left-0 h-full bg-[#0F172A] text-slate-300 border-r border-slate-800
    transition-transform duration-300 ease-in-out z-50 flex flex-col
    ${isMobile 
        ? (isOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full w-72') 
        : 'translate-x-0 w-64'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div className={sidebarClasses}>
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
           <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                 OS
              </div>
              <div className="leading-tight">
                 <h1 className="font-bold tracking-tight text-sm text-slate-100">Enterprise Insight</h1>
                 <p className="text-[10px] text-purple-400 font-mono">DEMO v2.0</p>
              </div>
           </div>
           {isMobile && (
             <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white">
               <X size={20} />
             </button>
           )}
        </div>

        {/* View Toggle */}
        <div className="p-3 border-b border-slate-800 shrink-0">
           <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              <button 
                 onClick={() => setViewMode('nav')}
                 className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    viewMode === 'nav' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                 }`}
              >
                 <List size={14} /> Menu
              </button>
              <button 
                 onClick={() => setViewMode('data')}
                 className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    viewMode === 'data' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                 }`}
              >
                 <Layers size={14} /> Datasets
                 <span className="bg-slate-800 text-slate-400 px-1.5 rounded-full text-[9px]">{datasetList.length}</span>
              </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {viewMode === 'nav' ? (
              <nav className="py-4 px-3 space-y-1">
                 {navItems.map(item => (
                   <button
                     key={item.id}
                     onClick={() => {
                       onNavigate(item.id);
                       if (isMobile) onClose();
                     }}
                     className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                       currentPage === item.id 
                         ? 'bg-purple-600/10 text-purple-300 border border-purple-500/20' 
                         : 'hover:bg-slate-800 hover:text-white text-slate-400'
                     }`}
                   >
                     <item.icon size={18} className={currentPage === item.id ? 'text-purple-400' : ''} />
                     {item.label}
                   </button>
                 ))}
              </nav>
           ) : (
              <div className="py-4 px-2">
                 <DatasetList 
                    datasets={datasetList} 
                    onActivate={(id) => {
                       onActivateDataset(id);
                       if (isMobile) onClose();
                    }}
                    activeDatasetId={activeDataset?.id}
                 />
              </div>
           )}
        </div>

        {/* Active Dataset Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Box size={12} />
              Active Context
           </div>
           
           {activeDataset ? (
             <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 shadow-sm">
                <div className="flex items-start justify-between mb-1">
                   <div className="font-medium text-white text-sm truncate w-32" title={activeDataset.fileName}>
                      {activeDataset.fileName}
                   </div>
                   <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                     v{activeDataset.version}
                   </span>
                </div>
                <div className="text-xs text-slate-400 flex flex-col gap-0.5">
                   <span>{activeDataset.rows.length.toLocaleString()} rows</span>
                   {activeDataset.isModified && (
                     <span className="text-amber-400 font-medium flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                        Unsaved changes
                     </span>
                   )}
                </div>
             </div>
           ) : (
             <div className="text-xs text-slate-500 italic px-2 py-2 border border-dashed border-slate-700 rounded-lg text-center">
               No dataset active.
             </div>
           )}
        </div>
      </div>
    </>
  );
};
