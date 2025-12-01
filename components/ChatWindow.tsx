import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, FileSearch, BookOpen, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { ChatMessage, SourceCitation } from '../types';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isThinking }) => {
  const [input, setInput] = useState('');
  const [expandedSources, setExpandedSources] = useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources(expandedSources === msgId ? null : msgId);
  };

  return (
    <div className="flex flex-col w-full bg-white rounded-xl shadow-sm border border-slate-200 relative">
      {/* Messages Area - Grows with content */}
      <div className="p-4 md:p-8 space-y-8 min-h-[300px]">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles size={32} className="text-indigo-500 opacity-80" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">HR Agent Ready</h3>
                <p className="text-slate-500 max-w-md mb-8">
                    Upload your data above, then ask questions. I can calculate stats, find specific records, and summarize information.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    <button onClick={() => onSendMessage("Who has the highest performance score?")} className="p-4 text-sm text-slate-600 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md rounded-xl text-left transition-all">
                        "Who has the highest performance score?"
                    </button>
                    <button onClick={() => onSendMessage("Count employees by department")} className="p-4 text-sm text-slate-600 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md rounded-xl text-left transition-all">
                        "Count employees by department"
                    </button>
                </div>
            </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-200 mt-1">
                <Bot size={20} className="text-indigo-600" />
              </div>
            )}
            
            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-6 py-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}
              >
                 <div className="markdown-body" dangerouslySetInnerHTML={{ 
                     __html: msg.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                        .replace(/\n/g, '<br/>') 
                 }} />
              </div>

              {/* Sources Section */}
              {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 ml-2">
                  <button 
                    onClick={() => toggleSources(msg.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-indigo-600 transition-colors mb-2"
                  >
                    <BookOpen size={12} />
                    Sources ({msg.sources.length})
                    {expandedSources === msg.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  
                  {expandedSources === msg.id && (
                    <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-1 duration-200">
                        {msg.sources.map((source, idx) => (
                            <div key={idx} className="group relative">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-600 text-xs hover:border-indigo-300 hover:text-indigo-700 transition-colors cursor-help shadow-sm">
                                    <FileSearch size={12} className="text-slate-400 group-hover:text-indigo-500" />
                                    <span className="font-medium">{source.fileName}</span>
                                </div>
                                {source.snippet && (
                                    <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-snug">
                                        <div className="font-bold text-white border-b border-slate-700 mb-2 pb-1">Context Snippet</div>
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

            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-300 mt-1">
                <User size={20} className="text-slate-500" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
            <div className="flex gap-4 md:gap-6 justify-start animate-pulse">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                    <Bot size={20} className="text-indigo-400" />
                </div>
                <div className="bg-white px-6 py-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-400">Analyzing data...</span>
                </div>
            </div>
        )}
      </div>

      {/* Input Area - Sticky at bottom for mobile, bottom of card for desktop */}
      <div className="sticky bottom-0 md:static bg-white border-t border-slate-100 p-4 md:p-6 rounded-b-xl z-10">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base shadow-inner transition-all"
            disabled={isThinking}
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="absolute right-2.5 p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 hover:shadow-md disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-center mt-3 hidden md:block">
            <p className="text-xs text-slate-400 font-medium">
                AI can make mistakes. Verify important figures with the source data.
            </p>
        </div>
      </div>
    </div>
  );
};