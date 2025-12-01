
import React, { useEffect, useState } from 'react';
import { AgentStatus, AgentLog } from '../types';
import { Activity, Clock, CheckCircle, Zap, Shield, Server } from 'lucide-react';
import { agentLogger } from '../services/agentLogger';

export const AgentConsole: React.FC = () => {
  const [logs, setLogs] = useState<AgentLog[]>([]);

  // Subscribe to logger
  useEffect(() => {
    const unsubscribe = agentLogger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, []);

  const agents: AgentStatus[] = [
    { id: '1', name: 'Orchestrator Agent', role: 'System Controller', status: 'online', uptime: '99.9%', lastActive: new Date() },
    { id: '2', name: 'HR Analytics Agent', role: 'Data Analysis', status: 'online', uptime: '98.5%', lastActive: new Date() },
    { id: '3', name: 'DataOps Agent', role: 'Data Transformation', status: 'online', uptime: '99.0%', lastActive: new Date() },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
       <div className="flex flex-col gap-2">
         <h1 className="text-2xl font-bold text-slate-900">Agent Console</h1>
         <p className="text-slate-500">Monitor active agents and system health.</p>
       </div>

       {/* Agent Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map(agent => (
             <div key={agent.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className={`absolute top-0 left-0 w-1 h-full ${agent.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-purple-50 transition-colors">
                      {agent.id === '1' ? <Server size={24} className="text-purple-600" /> : 
                       agent.id === '2' ? <Zap size={24} className="text-blue-600" /> : 
                       <Shield size={24} className="text-amber-600" />}
                   </div>
                   <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      agent.status === 'online' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                   }`}>
                      {agent.status === 'online' ? <CheckCircle size={12} /> : <Activity size={12} className="animate-pulse" />}
                      {agent.status}
                   </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{agent.name}</h3>
                <p className="text-sm text-slate-500 mb-6">{agent.role}</p>
                
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
                   <span className="flex items-center gap-1"><Clock size={12} /> Last active: {agent.lastActive.toLocaleTimeString()}</span>
                   <span className="font-mono">UP: {agent.uptime}</span>
                </div>
             </div>
          ))}
       </div>

       {/* System Logs */}
       <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden flex flex-col h-[400px]">
          <div className="bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-700">
             <div className="flex items-center gap-2 text-slate-100 font-mono text-sm">
                <Activity size={16} className="text-purple-400" /> System Logs
             </div>
             <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs custom-scrollbar">
             {logs.map(log => (
                <div key={log.id} className="flex gap-4 p-2 hover:bg-white/5 rounded transition-colors group">
                   <span className="text-slate-500 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                   <span className={`font-bold shrink-0 w-24 ${
                      log.agentId === '1' ? 'text-purple-400' : 
                      log.agentId === '2' ? 'text-blue-400' : 'text-amber-400'
                   }`}>
                      [{log.agentId === '1' ? 'ORCHESTRATOR' : log.agentId === '2' ? 'HR-AGENT' : 'DATAOPS'}]
                   </span>
                   <span className={`${
                      log.type === 'action' ? 'text-green-300' : 
                      log.type === 'error' ? 'text-red-300' : 
                      'text-slate-300'
                   }`}>
                      {log.message}
                   </span>
                </div>
             ))}
             {logs.length === 0 && (
                 <div className="text-slate-600 p-2">Waiting for events...</div>
             )}
          </div>
       </div>

    </div>
  );
};
