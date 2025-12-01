
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
  DatasetVersion,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  const [isMobile, setIsMobile] = useState(false);
  
  // --- Data State ---
  // List of all uploaded datasets (metadata only)
  const [datasetList, setDatasetList] = useState<DatasetListItem[]>([]);
  // Store full dataset objects in memory for demo (in real app, fetch by ID)
  const [datasetCache, setDatasetCache] = useState<Record<string, ActiveDataset>>({});
  // Pointer to active dataset
  const [activeDataset, setActiveDataset] = useState<ActiveDataset | null>(null);
  
  // --- Ingestion State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus>(IngestionStatus.IDLE);
  
  // --- Chat State (Orchestrator) ---
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
      // 1. Parse
      await new Promise(r => setTimeout(r, 800)); // Fake network
      setIngestionStatus(IngestionStatus.ANALYZING);
      
      const { fileName, rows, columns } = await processFile(file);
      
      // 2. Index
      await new Promise(r => setTimeout(r, 800));
      setIngestionStatus(IngestionStatus.INDEXING);

      // 3. Complete
      await new Promise(r => setTimeout(r, 800));
      
      const versionHash = generateHash(JSON.stringify(rows));
      const newId = generateId();

      const newDataset: ActiveDataset = {
        id: newId,
        fileName,
        rows,
        columns,
        version: 1,
        versionHash, // Init hash
        history: [{
           version: 1,
           timestamp: new Date(),
           changeDescription: 'Initial Upload',
           rowCount: rows.length
        }],
        lastModified: new Date(),
        uploadedAt: new Date()
      };

      // Add to Cache
      setDatasetCache(prev => ({ ...prev, [newId]: newDataset }));

      // Add to List
      const newItem: DatasetListItem = {
        id: newId,
        name: fileName,
        rows: rows.length,
        version: 1,
        uploadedAt: new Date(),
        active: false // Inactive by default unless it's the first one
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
        setActiveDataset(target);
        setDatasetList(prev => prev.map(ds => ({
            ...ds,
            active: ds.id === id
        })));
        agentLogger.addLog('0', `Activated dataset ${target.fileName}`, 'info');
    }
  };

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
              };
          }
          return ds;
      }));
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

    // Prepare context for Gemini (simulated ingestion context)
    const filesForAgent = activeDataset ? [{
       id: activeDataset.id,
       name: activeDataset.fileName,
       type: 'text/csv',
       content: JSON.stringify(activeDataset.rows.slice(0, 50)), // pass sample
       version: activeDataset.version,
       uploadDate: activeDataset.lastModified
    }] : [];

    const response = await generateAgentResponse(
       text, 
       filesForAgent, 
       [...messages, userMsg], 
       activeDataset,
       handleUpdateDataset // Callback for DataOps edits
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

  // --- Render ---

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 1. Sidebar */}
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

      {/* 2. Main Content Wrapper */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!isMobile && isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
        {/* Top Bar */}
        <TopBar 
          currentPage={currentPage}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
           <div className="max-w-7xl mx-auto h-full">
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

      {/* 3. Global Floating Chat */}
      <FloatingChat 
         messages={messages}
         onSendMessage={handleChat}
         isThinking={isChatThinking}
      />

      {/* 4. Upload Modal */}
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
