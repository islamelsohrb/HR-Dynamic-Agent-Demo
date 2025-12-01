
import React from 'react';
import { Database, CheckCircle, Clock } from 'lucide-react';
import { DatasetListItem } from '../types';

interface DatasetListProps {
  datasets: DatasetListItem[];
  onActivate: (id: string) => void;
  activeDatasetId?: string;
}

export const DatasetList: React.FC<DatasetListProps> = ({ datasets, onActivate, activeDatasetId }) => {
  if (datasets.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-xs italic">
        No datasets uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {datasets.map((ds) => {
        const isActive = ds.id === activeDatasetId;
        return (
          <div 
            key={ds.id}
            className={`
              relative p-3 rounded-lg border transition-all group
              ${isActive 
                ? 'bg-purple-900/20 border-purple-500/50' 
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <Database size={14} className={isActive ? 'text-purple-400' : 'text-slate-500'} />
                <span className="text-sm font-medium text-slate-200 truncate" title={ds.name}>
                  {ds.name}
                </span>
              </div>
              {isActive && (
                <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  Active
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex flex-col gap-0.5">
                <span>{ds.rows.toLocaleString()} rows</span>
                <span className="text-[10px] text-slate-500">v{ds.version}</span>
              </div>
              
              {!isActive && (
                <button
                  onClick={() => onActivate(ds.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-slate-700 hover:bg-purple-600 text-white text-[10px] rounded"
                >
                  Activate
                </button>
              )}
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-1 text-[10px] text-slate-500">
               <Clock size={10} />
               Uploaded {ds.uploadedAt.toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};
