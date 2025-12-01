
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Maximize2, Minimize2, FileSearch, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { ChatMessage } from '../types';

interface FloatingChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ messages, onSendMessage, isThinking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedSources, setExpandedSources] = useState<string | null>(null);

  const toggleOpen = () => setIsOpen(!isOpen);
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      onSendMessage(input);
      setInput('');
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources(expandedSources === msgId ? null : msgId);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end transition-all duration-300 ${isOpen ? 'z-50' : 'z-40'}`}>
      
      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`
            bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mb-4 transition-all duration-300 origin-bottom-right
            ${isExpanded 
              ? 'w-[90vw] h-[80vh] md:w-[600px] md:h-[700px]' 
              : 'w-[90vw] h-[500px] md:w-[400px]'}
          `}
        >
          {/* Header */}
          <div className="bg-purple-600 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Orchestrator</h3>
                <p className="text-[10px] text-purple-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={toggleExpanded}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-purple-100 hidden md:block"
                title={isExpanded ? "Minimize size" : "Expand size"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button 
                onClick={toggleOpen}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-purple-100"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-xl flex items-center justify-center mb-3">
                  <MessageCircle size={24} />
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">How can I help?</p>
                <p className="text-xs">Ask about your data, generate charts, or check metrics.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-purple-600 mt-1">
                      <Bot size={14} />
                    </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`
                      px-4 py-3 rounded-2xl text-sm shadow-sm
                      ${msg.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-sm' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}
                    `}>
                      <div className="markdown-body" dangerouslySetInnerHTML={{ 
                         __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                      }} />
                    </div>

                    {/* Sources */}
                    {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-1 ml-1">
                        <button 
                          onClick={() => toggleSources(msg.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-purple-600 transition-colors"
                        >
                          <BookOpen size={10} />
                          Sources ({msg.sources.length})
                          {expandedSources === msg.id ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                        
                        {expandedSources === msg.id && (
                          <div className="flex flex-wrap gap-2 mt-2 animate-in slide-in-from-top-1 duration-200">
                             {msg.sources.map((source, idx) => (
                                 <div key={idx} className="group relative">
                                     <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-slate-500 text-[10px] hover:border-purple-200 hover:text-purple-600 transition-colors shadow-sm cursor-help">
                                         <FileSearch size={10} />
                                         <span className="truncate max-w-[100px]">{source.fileName}</span>
                                     </div>
                                     {source.snippet && (
                                         <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-800 text-slate-200 text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                             "{source.snippet}"
                                         </div>
                                     )}
                                 </div>
                             ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isThinking && (
              <div className="flex gap-3 justify-start">
                 <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-purple-600">
                    <Bot size={14} />
                 </div>
                 <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                       <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                       <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
             <form onSubmit={handleSubmit} className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm transition-all"
                  disabled={isThinking}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="absolute right-2 top-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                   <Send size={16} />
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={toggleOpen}
        className={`
          w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
          ${isOpen ? 'bg-slate-700 text-white rotate-90' : 'bg-purple-600 text-white hover:bg-purple-700'}
        `}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>

    </div>
  );
};
    