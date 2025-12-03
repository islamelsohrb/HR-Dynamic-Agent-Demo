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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // --- Data State ---
  const [datasetList, setDatasetList] = useState<DatasetListItem[]>([]);
  const [datasetCache, setDatasetCache] = useState<Record<string, ActiveDataset>>({});
  const [activeDataset, setActiveDataset] = useState<ActiveDataset | null>(null);
  
  // --- Ingestion State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus>(IngestionStatus.IDLE);

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
      await new Promise(r => setTimeout(r, 500)); 
      setIngestionStatus(IngestionStatus.ANALYZING);
      
      const { fileName, rows, columns } = await processFile(file);
      
      await new Promise(r => setTimeout(r, 500));
      setIngestionStatus(IngestionStatus.INDEXING);
      
      await new Promise(r => setTimeout(r, 500));
      
      const versionHash = generateHash(JSON.stringify(rows));
      const newId = generateId();

      const newDataset: ActiveDataset = {
        id: newId,
        fileName,
        rows,
        columns,
        version: 1,
        versionHash,
        history: [{
           version: 1,
           timestamp: new Date(),
           changeDescription: 'Initial Upload',
           rowCount: rows.length
        }],
        lastModified: new Date(),
        uploadedAt: new Date()
      };

      setDatasetCache(prev => ({ ...prev, [newId]: newDataset }));

      const newItem: DatasetListItem = {
        id: newId,
        name: fileName,
        rows: rows.length,
        version: 1,
        uploadedAt: new Date(),
        active: false 
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
        // Deep clone to ensure clean state
        const safeTarget = JSON.parse(JSON.stringify(target));
        
        // Revive dates
        if (safeTarget.history) {
          safeTarget.history.forEach((h: any) => {
            h.timestamp = new Date(h.timestamp);
          });
        }
        if (safeTarget.lastModified) safeTarget.lastModified = new Date(safeTarget.lastModified);
        if (safeTarget.uploadedAt) safeTarget.uploadedAt = new Date(safeTarget.uploadedAt);

        setActiveDataset(safeTarget);
        setDatasetList(prev => prev.map(ds => ({
            ...ds,
            active: ds.id === id
        })));
        agentLogger.addLog('0', `Activated dataset ${target.fileName}`, 'info');
    }
  };

  const handleUpdateDataset = (updatedDataset: ActiveDataset) => {
      const newDatasetState = { 
          ...updatedDataset, 
          lastModified: new Date() 
      };

      setActiveDataset(newDatasetState);
      setDatasetCache(prev => ({ ...prev, [updatedDataset.id]: newDatasetState }));
      
      setDatasetList(prev => prev.map(ds => {
          if (ds.id === updatedDataset.id) {
              return {
                  ...ds,
                  rows: updatedDataset.rows.length,
                  version: updatedDataset.version
              };
          }
          return ds;
      }));

      agentLogger.addLog('0', `Dataset committed: v${updatedDataset.version}`, 'action');
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

    const filesForAgent = activeDataset ? [{
       id: activeDataset.id,
       name: activeDataset.fileName,
       type: 'text/csv',
       content: JSON.stringify(activeDataset.rows.slice(0, 50)),
       version: activeDataset.version,
       uploadDate: activeDataset.lastModified
    }] : [];

    const response = await generateAgentResponse(
       text, 
       filesForAgent, 
       [...messages, userMsg], 
       activeDataset,
       handleUpdateDataset 
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

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
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

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!isMobile && isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
        <TopBar 
          currentPage={currentPage}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
           <div className="max-w-[1600px] mx-auto h-full">
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

      <FloatingChat 
         messages={messages}
         onSendMessage={handleChat}
         isThinking={isChatThinking}
      />

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
