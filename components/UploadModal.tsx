import React, { useState, useRef } from 'react';
import { X, UploadCloud, CheckCircle, Loader2 } from 'lucide-react';
import { IngestionStatus } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  status: IngestionStatus;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, status }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const isProcessing = status !== IngestionStatus.IDLE && status !== IngestionStatus.COMPLETED && status !== IngestionStatus.FAILED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Upload Dataset</h3>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {status === IngestionStatus.IDLE || status === IngestionStatus.FAILED ? (
            <div 
              className={`
                relative border-2 border-dashed rounded-xl p-10 
                flex flex-col items-center justify-center text-center transition-all
                ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleChange} 
                className="hidden" 
                accept=".csv,.json" 
              />
              
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <UploadCloud size={32} />
              </div>
              
              <p className="text-slate-900 font-medium mb-1">Click to browse or drag file here</p>
              <p className="text-slate-500 text-sm mb-6">Supports CSV or JSON (Max 10MB)</p>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-sm transition-transform active:scale-95"
              >
                Browse Files
              </button>
              
              {status === IngestionStatus.FAILED && (
                <p className="mt-4 text-sm text-red-500 font-medium">Upload failed. Please try again.</p>
              )}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center">
               {status === IngestionStatus.COMPLETED ? (
                 <>
                   <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                     <CheckCircle size={32} />
                   </div>
                   <h4 className="text-xl font-bold text-slate-900 mb-2">Ready!</h4>
                   <p className="text-slate-500">Your dataset has been indexed successfully.</p>
                   <button 
                     onClick={onClose}
                     className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
                   >
                     Done
                   </button>
                 </>
               ) : (
                 <>
                   <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6">
                     <Loader2 size={32} className="animate-spin" />
                   </div>
                   <h4 className="text-lg font-semibold text-slate-900 mb-6">Processing Data...</h4>
                   <div className="w-full max-w-xs space-y-4">
                      <Step label="Uploading file" active={status === IngestionStatus.UPLOADING} completed={status !== IngestionStatus.UPLOADING} />
                      <Step label="Analyzing schema" active={status === IngestionStatus.ANALYZING} completed={status === IngestionStatus.INDEXING} />
                      <Step label="Indexing records" active={status === IngestionStatus.INDEXING} completed={false} />
                   </div>
                 </>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Step = ({ label, active, completed }: { label: string, active: boolean, completed: boolean }) => (
  <div className={`flex items-center gap-3 text-sm ${active ? 'text-purple-600 font-medium' : completed ? 'text-green-600' : 'text-slate-400'}`}>
     <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
        completed ? 'bg-green-500 border-green-500 text-white' : 
        active ? 'border-purple-600 border-2' : 
        'border-slate-300'
     }`}>
        {completed && <CheckCircle size={12} fill="currentColor" className="text-white" />}
        {active && <div className="w-2 h-2 bg-purple-600 rounded-full" />}
     </div>
     <span>{label}</span>
  </div>
);