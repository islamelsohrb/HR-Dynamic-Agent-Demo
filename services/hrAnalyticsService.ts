
import { GoogleGenAI } from "@google/genai";
import { ActiveDataset, DashboardConfig, SchemaColumn } from "../types";
import { agentLogger } from "./agentLogger";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

const HR_AGENT_SYSTEM_PROMPT = `
[ROLE / IDENTITY]
You are the **HR Analytics Agent** for "Enterprise Insight OS".
You receive PRE-CALCULATED STATISTICS about a dataset. You do NOT calculate them yourself.
Your job is to map these stats into a structured Dashboard JSON.

[INPUT DATA]
You will be provided with a "Statistical Summary" containing:
1. Total Row Count (Use this EXACTLY for "Total Employees" or similar KPIs).
2. Column Distributions (Top values and counts).
3. Numeric Averages/Sums.

[OUTPUT FORMAT]
Return PURE JSON matching this schema:
{
  "kpis": [
     { "id": "string", "label": "string", "value": "string or number", "change": "+12% (optional)" }
  ],
  "charts": [
     { 
       "id": "string", 
       "type": "bar|pie|line|area", 
       "title": "string", 
       "data": [ {"name": "Category", "value": 123} ] 
     }
  ],
  "insights": [
     { "id": "string", "tag": "HR|RISK|INFO", "title": "string", "summary": "string" }
  ]
}

[RULES]
1. **ACCURACY**: If the summary says "Total Rows: 1010", your KPI MUST say 1010. Do not hallucinate numbers.
2. **CHARTS**: Use the provided "Top Values" in the summary to populate chart data.
3. **INSIGHTS**: Generate qualitative insights based on the high/low values in the summary.
`;

// --- STATISTICAL ENGINE (Runs in browser, 100% Accurate) ---
const calculateDatasetStats = (dataset: ActiveDataset) => {
  const rowCount = dataset.rows.length;
  const numericStats: Record<string, { sum: number; min: number; max: number; avg: number }> = {};
  const frequencyStats: Record<string, Record<string, number>> = {};

  // Initialize accumulators
  dataset.columns.forEach(col => {
    if (col.type === 'number') {
      numericStats[col.name] = { sum: 0, min: Infinity, max: -Infinity, avg: 0 };
    } else {
      frequencyStats[col.name] = {};
    }
  });

  // Single Pass Aggregation
  dataset.rows.forEach(row => {
    dataset.columns.forEach(col => {
      const val = row[col.name];
      
      if (col.type === 'number') {
        const num = Number(val) || 0;
        const stat = numericStats[col.name];
        stat.sum += num;
        if (num < stat.min) stat.min = num;
        if (num > stat.max) stat.max = num;
      } else {
        const strVal = String(val === null || val === undefined ? 'Unknown' : val);
        frequencyStats[col.name][strVal] = (frequencyStats[col.name][strVal] || 0) + 1;
      }
    });
  });

  // Finalize (Averages & Top N Sorting)
  const numericSummary: any = {};
  Object.keys(numericStats).forEach(key => {
    const s = numericStats[key];
    s.avg = rowCount > 0 ? parseFloat((s.sum / rowCount).toFixed(2)) : 0;
    // Reset min/max if no data
    if (s.min === Infinity) s.min = 0;
    if (s.max === -Infinity) s.max = 0;
    numericSummary[key] = s;
  });

  const categoricalSummary: any = {};
  Object.keys(frequencyStats).forEach(key => {
    const counts = frequencyStats[key];
    // Sort by frequency desc and take top 10
    const sorted = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([val, count]) => ({ name: val, value: count }));
    
    categoricalSummary[key] = {
      uniqueCount: Object.keys(counts).length,
      topValues: sorted
    };
  });

  return { rowCount, numericSummary, categoricalSummary };
};

export const hrAnalyticsService = {
  
  /**
   * Generates the JSON configuration for the Overview Dashboard
   */
  generateDashboardAnalytics: async (dataset: ActiveDataset): Promise<DashboardConfig | null> => {
    agentLogger.addLog('2', `Computing deterministic stats for ${dataset.fileName} (v${dataset.version})`, 'action');
    
    // 1. Calculate deterministic stats locally (FAST & ACCURATE)
    const stats = calculateDatasetStats(dataset);
    
    // 2. Prepare concise prompt for AI
    const dataContext = `
      DATASET FILE: ${dataset.fileName}
      VERSION: v${dataset.version}
      
      === EXACT STATISTICS (DO NOT RE-CALCULATE) ===
      TOTAL ROWS (EMPLOYEES): ${stats.rowCount}
      
      NUMERIC COLUMNS STATS:
      ${JSON.stringify(stats.numericSummary, null, 2)}
      
      CATEGORICAL DISTRIBUTIONS (Top 10):
      ${JSON.stringify(stats.categoricalSummary, null, 2)}
    `;

    const prompt = `
      ${dataContext}
      
      TASK: Generate a Dashboard Configuration based strictly on the statistics above.
      - Create a KPI for "Total Employees" using TOTAL ROWS.
      - Create a Bar Chart showing distribution of the most relevant categorical column (e.g. Department, Role, Gender).
      - Create a Pie Chart for another relevant distribution.
      - Generate 3 insights based on the averages and distributions.
      
      MODE: DASHBOARD MODE (JSON ONLY).
    `;

    try {
      agentLogger.addLog('2', 'Sending stats to Gemini for layout...', 'info');
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: HR_AGENT_SYSTEM_PROMPT,
          temperature: 0.1, // High determinism
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      const config = JSON.parse(cleanJson) as DashboardConfig;
      
      agentLogger.addLog('2', 'Dashboard analytics generated successfully', 'info');
      return config;
    } catch (e) {
      console.error("HR Agent Dashboard Error:", e);
      agentLogger.addLog('2', 'Failed to generate dashboard analytics', 'error', e);
      return null;
    }
  },

  /**
   * Generates a natural language answer using stats + sample
   */
  generateAnalysis: async (query: string, dataset: ActiveDataset): Promise<string> => {
    agentLogger.addLog('2', `Analyzing query: "${query}"`, 'action');

    // Mix of exact stats and small sample for context
    const stats = calculateDatasetStats(dataset);
    const sampleRows = dataset.rows.slice(0, 10); 

    const dataContext = `
      FILE: ${dataset.fileName}
      TOTAL ROWS: ${stats.rowCount}
      
      KEY STATS:
      ${JSON.stringify(stats.numericSummary)}
      ${JSON.stringify(stats.categoricalSummary)}
      
      SAMPLE ROWS (For structure reference only):
      ${JSON.stringify(sampleRows)}
    `;

    const prompt = `
      ${dataContext}
      
      USER QUERY: "${query}"
      
      Use the KEY STATS for numbers (counts, averages). Use SAMPLE ROWS only to understand data format.
      Reply in Markdown.
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: "You are an expert HR Analyst. Use the provided statistics to answer accurately.",
          temperature: 0.2,
        },
      });

      agentLogger.addLog('2', 'Analysis complete', 'info');
      return response.text || "I could not generate an analysis.";
    } catch (e) {
      console.error("HR Agent Analysis Error:", e);
      return "Error running HR analysis.";
    }
  }
};
