
import React, { useState, useEffect } from 'react';
import { ActiveDataset, DataOpsMode } from '../types';
import { Trash2, Plus, Download, Filter, Eraser, AlertOctagon, Copy, Save, Calendar, Edit2, AlertCircle, RotateCcw, Check, Search } from 'lucide-react';
import { dataOpsService } from '../services/dataOpsService';

interface DataStudioProps {
  activeDataset: ActiveDataset | null;
  onUpdateDataset: (newDataset: ActiveDataset) => void;
}

export const DataStudio: React.FC<DataStudioProps> = ({ activeDataset, onUpdateDataset }) => {
  // STAGED EDITS STATE
  const [draftDataset, setDraftDataset] = useState<ActiveDataset | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, colName: string} | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Sync draft with active dataset on mount or when active changes (unless we have unsaved local changes that are newer?)
  useEffect(() => {
    if (activeDataset) {
        // If we switch datasets externally (e.g. from sidebar), reset draft
        if (!draftDataset || draftDataset.id !== activeDataset.id) {
            setDraftDataset(activeDataset);
            setHasUnsavedChanges(false);
            setSelectedRows([]);
            setSearchQuery('');
        }
    }
  }, [activeDataset]);

  if (!activeDataset || !draftDataset) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <Filter size={48} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Data Available</h2>
        <p className="text-slate-500 mt-2">Upload a dataset to view and edit it here.</p>
      </div>
    );
  }

  // Filter rows based on search
  const filteredRows = draftDataset.rows.filter((row, idx) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some(val => 
        String(val).toLowerCase().includes(query)
    );
  });

  // --- Helper to execute Ops via Service on DRAFT ---
  const executeOp = (mode: DataOpsMode, params: any, summary: string) => {
    setLoadingAction(mode);
    const plan = {
      operations: [{ type: mode, params }]
    };
    
    // Execute on DRAFT dataset
    // Note: We intentionally don't bump the 'active' version hash yet, we create a draft state
    const updatedDraft = dataOpsService.executeTransformation(draftDataset, plan, summary);
    
    // Mark as unsaved draft
    setDraftDataset(updatedDraft);
    setHasUnsavedChanges(true);
    setLoadingAction(null);
  };

  // --- Commit / Discard Workflow ---

  const handleSaveChanges = () => {
    if (draftDataset) {
       if (window.confirm("Are you sure you want to commit these changes? This will create a new dataset version.")) {
         // Commit draft as new active version
         onUpdateDataset(draftDataset);
         setHasUnsavedChanges(false);
       }
    }
  };

  const handleDiscardChanges = () => {
    if (window.confirm("Discard all unsaved changes? This cannot be undone.")) {
        setDraftDataset(activeDataset);
        setHasUnsavedChanges(false);
        setSelectedRows([]);
    }
  };

  // --- Actions ---
  const handleRemoveNulls = () => executeOp(DataOpsMode.CLEAN_NULLS, {}, "Removed rows with NULL values");
  const handleFillNulls = () => executeOp(DataOpsMode.FILL_NULLS, {}, "Filled NULL values");
  const handleNormalizeDates = () => executeOp(DataOpsMode.NORMALIZE_DATES, {}, "Normalized date formats");
  const handleRemoveDuplicates = () => executeOp(DataOpsMode.DEDUPLICATE, {}, "Removed duplicate rows");

  const handleDeleteSelected = () => {
    // Map filtered indices back to original indices if searching?
    // For simplicity in demo, delete by object reference or require exact index matching.
    // Ideally, rows need IDs.
    executeOp(DataOpsMode.DELETE_ROWS, { indices: selectedRows }, `Deleted ${selectedRows.length} rows`);
    setSelectedRows([]);
  };

  // --- Inline Editing ---
  const startEditing = (rowIndex: number, colName: string, value: any) => {
    setEditingCell({ rowIndex, colName });
    setEditValue(value);
  };

  const saveEditing = () => {
    if (!editingCell) return;
    executeOp(DataOpsMode.EDIT_CELL, {
       rowIndex: editingCell.rowIndex,
       colName: editingCell.colName,
       value: editValue
    }, "Edited cell value");
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEditing();
    if (e.key === 'Escape') setEditingCell(null);
  };

  // --- Add Row Modal ---
  const handleOpenAddRow = () => {
    const empty: Record<string, any> = {};
    draftDataset.columns.forEach(c => empty[c.name] = '');
    setNewRowData(empty);
    setIsAddRowModalOpen(true);
  };

  const submitAddRow = () => {
    executeOp(DataOpsMode.ADD_ROW, { row: newRowData }, "Added new row");
    setIsAddRowModalOpen(false);
  };

  const toggleSelectRow = (idx: number) => {
    if (selectedRows.includes(idx)) {
      setSelectedRows(selectedRows.filter(i => i !== idx));
    } else {
      setSelectedRows([...selectedRows, idx]);
    }
  };

  // --- Stats Calculation (on draft) ---
  const nullCount = draftDataset.rows.reduce((acc, row) => {
     return acc + Object.values(row).filter(v => v === null || v === '' || v === undefined).length;
  }, 0);
  
  const uniqueRows = new Set(draftDataset.rows.map(r => JSON.stringify(r))).size;
  const duplicateCount = draftDataset.rows.length - uniqueRows;
  
  const totalCells = draftDataset.rows.length * draftDataset.columns.length;
  const qualityScore = totalCells > 0 ? Math.max(0, Math.round(100 - ((nullCount + duplicateCount * draftDataset.columns.length) / totalCells * 100))) : 100;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6 relative">
      
      {/* Header with Staged Edits Controls */}
      <div className="flex flex-col md:flex-row justify-between md:items-end flex-shrink-0 gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Data Studio</h1>
            <div className="flex items-center gap-3 mt-1">
               <p className="text-slate-500 text-sm flex items-center gap-2">
                  {draftDataset.fileName} <span className="text-slate-300">|</span> v{draftDataset.version} 
               </p>
               {hasUnsavedChanges ? (
                 <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-200 animate-pulse flex items-center gap-1">
                   <AlertCircle size={10} /> Unsaved Draft
                 </span>
               ) : (
                 <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded border border-green-200">
                    Active
                 </span>
               )}
            </div>
         </div>
         
         <div className="flex gap-2 items-center">
            {/* Search Bar */}
            <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search data..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 w-48 transition-all"
                />
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

            {hasUnsavedChanges ? (
               <>
                 <button 
                   onClick={handleDiscardChanges} 
                   className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-red-600 transition-colors"
                 >
                   <RotateCcw size={16} /> <span className="hidden sm:inline">Discard</span>
                 </button>
                 <button 
                   onClick={handleSaveChanges} 
                   className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
                 >
                   <Save size={16} /> <span className="hidden sm:inline">Save Changes</span>
                 </button>
               </>
            ) : (
               <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 hover:text-slate-800 transition-colors">
                  <Download size={16} /> Export
               </button>
            )}
         </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
         
         {/* Main Data Table */}
         <div className={`flex-1 bg-white border rounded-xl overflow-hidden flex flex-col shadow-sm transition-colors ${hasUnsavedChanges ? 'border-amber-300 shadow-amber-100 ring-2 ring-amber-100' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50/50">
               <div className="flex gap-2">
                  <button onClick={handleOpenAddRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-bold rounded hover:bg-purple-100 transition-colors border border-purple-200">
                     <Plus size={14} /> Add Row
                  </button>
                  {selectedRows.length > 0 && (
                    <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded hover:bg-red-100 transition-colors animate-in fade-in border border-red-200">
                       <Trash2 size={14} /> Delete ({selectedRows.length})
                    </button>
                  )}
               </div>
               <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                  <Edit2 size={12} /> Double-click cells to edit
               </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                     <tr>
                        <th className="w-10 px-4 py-3 border-b border-slate-200 bg-slate-50">
                           <input type="checkbox" className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                        </th>
                        {draftDataset.columns.map((col, i) => (
                           <th key={i} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap bg-slate-50">
                              {col.name}
                              <span className="ml-1 text-[9px] text-slate-400 font-normal normal-case">({col.type})</span>
                           </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                     {filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className={`hover:bg-purple-50/30 transition-colors group ${selectedRows.includes(rIdx) ? 'bg-purple-50/50' : ''}`}>
                           <td className="px-4 py-2">
                              <input 
                                type="checkbox" 
                                checked={selectedRows.includes(rIdx)}
                                onChange={() => toggleSelectRow(rIdx)}
                                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                              />
                           </td>
                           {draftDataset.columns.map((col, cIdx) => {
                              const isEditing = editingCell?.rowIndex === rIdx && editingCell?.colName === col.name;
                              return (
                                <td 
                                  key={cIdx} 
                                  className="px-4 py-2 text-slate-700 whitespace-nowrap max-w-[200px] truncate border-r border-transparent group-hover:border-slate-100 last:border-0 cursor-text" 
                                  title={String(row[col.name])}
                                  onDoubleClick={() => startEditing(rIdx, col.name, row[col.name])}
                                >
                                   {isEditing ? (
                                     <input 
                                       autoFocus
                                       type={col.type === 'number' ? 'number' : 'text'}
                                       value={editValue}
                                       onChange={(e) => setEditValue(e.target.value)}
                                       onBlur={saveEditing}
                                       onKeyDown={handleKeyDown}
                                       className="w-full p-1 border border-purple-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                                     />
                                   ) : (
                                     String(row[col.name]) || <span className="text-slate-300 italic">null</span>
                                   )}
                                </td>
                              );
                           })}
                        </tr>
                     ))}
                  </tbody>
               </table>
               {filteredRows.length === 0 && (
                  <div className="p-8 text-center text-slate-500 italic">
                     No rows match your search.
                  </div>
               )}
            </div>
         </div>

         {/* Actions Panel */}
         <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto hidden lg:flex">
            {/* Health Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertOctagon size={18} className="text-purple-500" />
                  Data Health ({hasUnsavedChanges ? 'Draft' : 'Active'})
               </h3>
               <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Null Cells</span>
                     <span className="font-mono text-slate-800 font-medium">{nullCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Duplicate Rows</span>
                     <span className="font-mono text-slate-800 font-medium">{duplicateCount}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                     <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${qualityScore > 90 ? 'bg-green-500' : qualityScore > 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{width: `${qualityScore}%`}}
                     ></div>
                  </div>
                  <p className="text-xs text-slate-400 text-center pt-1">{qualityScore}% Quality Score</p>
               </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1">
               <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
               <div className="space-y-2">
                  <ActionBtn onClick={handleRemoveNulls} icon={Eraser} label="Remove Null Rows" loading={loadingAction === DataOpsMode.CLEAN_NULLS} />
                  <ActionBtn onClick={handleFillNulls} icon={Edit2} label="Fill Nulls (Median)" loading={loadingAction === DataOpsMode.FILL_NULLS} />
                  <ActionBtn onClick={handleRemoveDuplicates} icon={Copy} label="Deduplicate" loading={loadingAction === DataOpsMode.DEDUPLICATE} />
                  <ActionBtn onClick={handleNormalizeDates} icon={Calendar} label="Normalize Dates" loading={loadingAction === DataOpsMode.NORMALIZE_DATES} />
               </div>
               
               <div className="mt-8">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Version History</h4>
                  <div className="space-y-3 relative before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                     {activeDataset.history.slice().reverse().map((h, i) => (
                        <div key={i} className="relative pl-5 text-sm">
                           <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 ${i===0 ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300'}`}></div>
                           <div className="font-medium text-slate-800">v{h.version}</div>
                           <div className="text-xs text-slate-500 leading-tight mt-0.5">{h.changeDescription}</div>
                           <div className="text-[10px] text-slate-400 mt-1">{h.timestamp.toLocaleTimeString()}</div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

         </div>
      </div>

      {/* Add Row Modal */}
      {isAddRowModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Row</h3>
              <div className="max-h-[60vh] overflow-y-auto space-y-4 mb-6 custom-scrollbar pr-2">
                 {draftDataset.columns.map(col => (
                    <div key={col.name}>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{col.name}</label>
                       <input 
                         type={col.type === 'number' ? 'number' : 'text'} 
                         className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                         value={newRowData[col.name] || ''}
                         onChange={e => setNewRowData({...newRowData, [col.name]: e.target.value})}
                         placeholder={String(col.example)}
                       />
                    </div>
                 ))}
              </div>
              <div className="flex justify-end gap-3">
                 <button onClick={() => setIsAddRowModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                 <button onClick={submitAddRow} className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700">Add Row</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ActionBtn = ({ onClick, icon: Icon, label, disabled = false, loading = false }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled || loading}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left border border-transparent hover:border-purple-100"
  >
    {loading ? <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full" /> : <Icon size={16} />}
    {label}
  </button>
);
