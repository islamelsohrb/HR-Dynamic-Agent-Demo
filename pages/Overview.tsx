
import React, { useEffect, useState } from 'react';
import { ActiveDataset, DashboardConfig } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Sparkles, Box, Activity, Loader2 } from 'lucide-react';
import { hrAnalyticsService } from '../services/hrAnalyticsService';
import { agentLogger } from '../services/agentLogger';

interface OverviewProps {
  activeDataset: ActiveDataset | null;
}

export const Overview: React.FC<OverviewProps> = ({ activeDataset }) => {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAnalytics = async () => {
      if (!activeDataset) {
        setConfig(null);
        return;
      }
      
      // SMART REGENERATION: Only fetch if dataset version hash differs from what we have cached
      // If we have config and the dataset version hash matches our config's hash, skip.
      if (config && config.analyticsVersionHash === activeDataset.versionHash) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        agentLogger.addLog('1', 'DASHBOARD_REFRESH_REQUEST received', 'info');
        const newConfig = await hrAnalyticsService.generateDashboardAnalytics(activeDataset);
        
        if (mounted && newConfig) {
          // Attach current hash to config for cache invalidation check next time
          newConfig.analyticsVersionHash = activeDataset.versionHash;
          setConfig(newConfig);
        } else if (mounted) {
          setError("Failed to generate analytics config");
        }
      } catch (err) {
        if (mounted) setError("Error loading dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAnalytics();
    
    return () => { mounted = false; };
  }, [activeDataset]); // Re-run when activeDataset reference or content changes

  const COLORS = ['#9333ea', '#c084fc', '#e9d5ff', '#6b21a8', '#d8b4fe'];

  if (!activeDataset) {
    return (
        <div className="flex flex-col gap-2 pb-10">
           <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
           <p className="text-slate-500">Active dataset analysis and insights powered by AI agents.</p>
           <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center mt-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Box size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No Dataset Active</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">Upload a CSV or JSON file to start the HR Analytics Agent.</p>
           </div>
        </div>
    );
  }

  if (loading) {
     return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center">
           <Loader2 size={48} className="text-purple-600 animate-spin mb-4" />
           <h3 className="text-xl font-bold text-slate-800">HR Agent is Analyzing...</h3>
           <p className="text-slate-500">Computing KPIs, identifying patterns, and generating insights.</p>
        </div>
     );
  }

  return (
    <div className="flex flex-col gap-8 pb-10 animate-in fade-in duration-500">
      
      {/* 1. Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500">Active dataset analysis and insights powered by AI agents.</p>
        <div className="flex items-center gap-2 mt-2">
           <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded">
              Active: {activeDataset.fileName}
           </span>
           <span className="text-xs text-slate-400">Version: v{activeDataset.version}</span>
        </div>
      </div>

      {/* 2. KPI Cards (Dynamic) */}
      {config && config.kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {config.kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-500 truncate pr-2" title={kpi.label}>{kpi.label}</span>
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                     <Activity size={18} />
                  </div>
               </div>
               <span className="text-2xl md:text-3xl font-bold text-slate-900 truncate" title={String(kpi.value)}>{kpi.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Analytics & Insights Grid */}
      {config && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1 (Main) */}
            {config.charts?.[0] && (
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[350px]">
                   <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <TrendingUp size={20} className="text-purple-600" />
                     {config.charts[0].title}
                   </h3>
                   <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={config.charts[0].data || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey={config.charts[0].xField || "name"} 
                            axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} 
                            interval={0}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <Tooltip 
                            cursor={{fill: '#faf5ff'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                          />
                          <Bar dataKey={config.charts[0].yField || "value"} fill="#9333ea" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
            )}

            {/* AI Insights Feed */}
            <div className="row-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
               <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Sparkles size={20} className="text-purple-500" />
                 AI Insights
               </h3>
               <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar max-h-[600px] pr-2">
                  {config.insights.map((insight, i) => (
                     <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-purple-200 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-semibold text-slate-800 text-sm group-hover:text-purple-700 transition-colors">{insight.title}</h4>
                           <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border bg-white text-slate-500 border-slate-200">
                              {insight.tag || 'INFO'}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{insight.summary || insight.description}</p>
                     </div>
                  ))}
               </div>
            </div>

            {/* Chart 2 (Secondary) */}
            {config.charts?.[1] && (
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Users size={20} className="text-purple-600" />
                     {config.charts[1].title}
                   </h3>
                   <div className="h-64 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={config.charts[1].data || []}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey={config.charts[1].yField || "value"}
                            nameKey={config.charts[1].xField || "name"}
                          >
                            {(config.charts[1].data || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 ml-8 max-h-48 overflow-y-auto custom-scrollbar">
                         {(config.charts[1].data || []).slice(0, 5).map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                               <div className="w-3 h-3 rounded-full" style={{background: COLORS[index % COLORS.length]}}></div>
                               <span className="truncate max-w-[100px]" title={entry.name || entry[config.charts[1].xField!]}>{entry.name || entry[config.charts[1].xField!]}</span>
                               <span className="font-bold">{entry.value || entry[config.charts[1].yField!]}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
            )}
         </div>
      )}
    </div>
  );
};
