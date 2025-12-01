
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { UploadModal } from './components/UploadModal';
import { FloatingChat } from './components/FloatingChat';
import { Overview } from './pages/Overview';
import { DataStudio } from './pages/DataStudio';
import { AgentConsole } from './pages/AgentConsole';
import { processFile } from './utils/parsers';
import { generateAgentResponse } from './services/geminiService';
import { 
  Page, 
  IngestionStatus, 
  ActiveDataset, 
  ChatMessage,
<<<<<<< HEAD
=======
  DatasetVersion,
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
  DatasetListItem
} from './types';
import { agentLogger } from './services/agentLogger';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);
// Simple hash util
const generateHash = (content: string): string => {
  let hash = 0;
  if (content.length === 0) return hash.toString(16);
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

const App: React.FC = () => {
  // --- Global State ---
  const [currentPage, setCurrentPage] = useState<Page>(Page.OVERVIEW);
<<<<<<< HEAD
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isMobile, setIsMobile] = useState(false);
  
  // --- Data State ---
  const [datasetList, setDatasetList] = useState<DatasetListItem[]>([]);
  const [datasetCache, setDatasetCache] = useState<Record<string, ActiveDataset>>({});
=======
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  const [isMobile, setIsMobile] = useState(false);
  
  // --- Data State ---
  // List of all uploaded datasets (metadata only)
  const [datasetList, setDatasetList] = useState<DatasetListItem[]>([]);
  // Store full dataset objects in memory for demo (in real app, fetch by ID)
  const [datasetCache, setDatasetCache] = useState<Record<string, ActiveDataset>>({});
  // Pointer to active dataset
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
  const [activeDataset, setActiveDataset] = useState<ActiveDataset | null>(null);
  
  // --- Ingestion State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus>(IngestionStatus.IDLE);
  
<<<<<<< HEAD
  // --- Chat State ---
=======
  // --- Chat State (Orchestrator) ---
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatThinking, setIsChatThinking] = useState(false);

  // Responsive Check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Handlers ---

  const handleUpload = async (file: File) => {
    setIngestionStatus(IngestionStatus.UPLOADING);
    const startTime = performance.now();
    
    try {
<<<<<<< HEAD
      await new Promise(r => setTimeout(r, 500)); 
=======
      // 1. Parse
      await new Promise(r => setTimeout(r, 800)); // Fake network
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
      setIngestionStatus(IngestionStatus.ANALYZING);
      
      const { fileName, rows, columns } = await processFile(file);
      
<<<<<<< HEAD
      await new Promise(r => setTimeout(r, 500));
      setIngestionStatus(IngestionStatus.INDEXING);
      
      await new Promise(r => setTimeout(r, 500));
=======
      // 2. Index
      await new Promise(r => setTimeout(r, 800));
      setIngestionStatus(IngestionStatus.INDEXING);

      // 3. Complete
      await new Promise(r => setTimeout(r, 800));
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
      
      const versionHash = generateHash(JSON.stringify(rows));
      const newId = generateId();

      const newDataset: ActiveDataset = {
        id: newId,
        fileName,
        rows,
        columns,
        version: 1,
<<<<<<< HEAD
        versionHash,
=======
        versionHash, // Init hash
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
        history: [{
           version: 1,
           timestamp: new Date(),
           changeDescription: 'Initial Upload',
           rowCount: rows.length
        }],
        lastModified: new Date(),
        uploadedAt: new Date()
      };

<<<<<<< HEAD
      setDatasetCache(prev => ({ ...prev, [newId]: newDataset }));

=======
      // Add to Cache
      setDatasetCache(prev => ({ ...prev, [newId]: newDataset }));

      // Add to List
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
      const newItem: DatasetListItem = {
        id: newId,
        name: fileName,
        rows: rows.length,
        version: 1,
        uploadedAt: new Date(),
<<<<<<< HEAD
        active: false 
=======
        active: false // Inactive by default unless it's the first one
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
      };

      setDatasetList(prev => {
        const isFirst = prev.length === 0;
        if (isFirst) {
             newItem.active = true;
             setActiveDataset(newDataset);
        }
        return [...prev, newItem];
      });

      agentLogger.addLog(
         '0', 
         `Uploaded ${fileName}`, 
         'action', 
         { rows: rows.length }, 
         generateId(), 
         Math.round(performance.now() - startTime)
      );

      setIngestionStatus(IngestionStatus.COMPLETED);

    } catch (e) {
      console.error(e);
      setIngestionStatus(IngestionStatus.FAILED);
    }
  };

  const handleActivateDataset = (id: string) => {
    const target = datasetCache[id];
    if (target) {
<<<<<<< HEAD
        // Deep clone to ensure clean state
        const safeTarget = JSON.parse(JSON.stringify(target));
        
        // FIX: Revive Date objects from strings after JSON cloning
        if (safeTarget.history) {
          safeTarget.history.forEach((h: any) => {
            h.timestamp = new Date(h.timestamp);
          });
        }
        if (safeTarget.lastModified) safeTarget.lastModified = new Date(safeTarget.lastModified);
        if (safeTarget.uploadedAt) safeTarget.uploadedAt = new Date(safeTarget.uploadedAt);

        setActiveDataset(safeTarget);
=======
        setActiveDataset(target);
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
        setDatasetList(prev => prev.map(ds => ({
            ...ds,
            active: ds.id === id
        })));
        agentLogger.addLog('0', `Activated dataset ${target.fileName}`, 'info');
    }
  };

<<<<<<< HEAD
  const handleUpdateDataset = (updatedDataset: ActiveDataset) => {
      // FORCE FRESH REFERENCE to trigger effects in children
      const newDatasetState = { 
          ...updatedDataset, 
          lastModified: new Date() 
      };

      // 1. Update Active State
      setActiveDataset(newDatasetState);
      
      // 2. Update Cache
      setDatasetCache(prev => ({ ...prev, [updatedDataset.id]: newDatasetState }));
      
      // 3. Update Sidebar List Metadata
      setDatasetList(prev => prev.map(ds => {
          if (ds.id === updatedDataset.id) {
              return {
                  ...ds,
                  rows: updatedDataset.rows.length,
                  version: updatedDataset.version
=======
  const handleUpdateDataset = (updated: ActiveDataset) => {
      // Update Active
      setActiveDataset(updated);
      
      // Update Cache
      setDatasetCache(prev => ({ ...prev, [updated.id]: updated }));
      
      // Update List Metadata
      setDatasetList(prev => prev.map(ds => {
          if (ds.id === updated.id) {
              return {
                  ...ds,
                  rows: updated.rows.length,
                  version: updated.version
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
              };
          }
          return ds;
      }));
<<<<<<< HEAD

      agentLogger.addLog('0', `Dataset committed: v${updatedDataset.version}`, 'action');
=======
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
  };

  const handleChat = async (text: string) => {
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsChatThinking(true);

<<<<<<< HEAD
=======
    // Prepare context for Gemini (simulated ingestion context)
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
    const filesForAgent = activeDataset ? [{
       id: activeDataset.id,
       name: activeDataset.fileName,
       type: 'text/csv',
<<<<<<< HEAD
       content: JSON.stringify(activeDataset.rows.slice(0, 50)), 
=======
       content: JSON.stringify(activeDataset.rows.slice(0, 50)), // pass sample
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
       version: activeDataset.version,
       uploadDate: activeDataset.lastModified
    }] : [];

    const response = await generateAgentResponse(
       text, 
       filesForAgent, 
       [...messages, userMsg], 
       activeDataset,
<<<<<<< HEAD
       handleUpdateDataset 
=======
       handleUpdateDataset // Callback for DataOps edits
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
    );

    const botMsg: ChatMessage = {
      id: generateId(),
      role: 'model',
      text: response.text,
      sources: response.sources,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsChatThinking(false);
  };

<<<<<<< HEAD
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
=======
  // --- Render ---

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 1. Sidebar */}
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
      <Sidebar 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
        activeDataset={activeDataset}
        datasetList={datasetList}
        onActivateDataset={handleActivateDataset}
      />

<<<<<<< HEAD
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!isMobile && isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
=======
      {/* 2. Main Content Wrapper */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!isMobile && isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
        {/* Top Bar */}
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
        <TopBar 
          currentPage={currentPage}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />

<<<<<<< HEAD
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
           <div className="max-w-[1600px] mx-auto h-full">
=======
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
           <div className="max-w-7xl mx-auto h-full">
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
              {currentPage === Page.OVERVIEW && (
                <Overview 
                  activeDataset={activeDataset}
                />
              )}
              
              {currentPage === Page.DATA_STUDIO && (
                <DataStudio 
                   activeDataset={activeDataset} 
                   onUpdateDataset={handleUpdateDataset}
                />
              )}

              {currentPage === Page.AGENT_CONSOLE && (
                 <AgentConsole />
              )}
           </div>
        </main>
      </div>

<<<<<<< HEAD
=======
      {/* 3. Global Floating Chat */}
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
      <FloatingChat 
         messages={messages}
         onSendMessage={handleChat}
         isThinking={isChatThinking}
      />

<<<<<<< HEAD
=======
      {/* 4. Upload Modal */}
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => {
           setIsUploadModalOpen(false);
           setIngestionStatus(IngestionStatus.IDLE);
        }}
        onUpload={handleUpload}
        status={ingestionStatus}
      />

    </div>
  );
};

export default App;
