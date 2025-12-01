
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, IngestedFile, SourceCitation, ActiveDataset, DataOpsRequest, DataOpsMode } from "../types";
import { hrAnalyticsService } from "./hrAnalyticsService";
import { dataOpsService } from "./dataOpsService";
import { agentLogger } from "./agentLogger";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

// --- ORCHESTRATOR SYSTEM PROMPT ---
const ORCHESTRATOR_PROMPT = `
[ROLE / IDENTITY]
You are the **Orchestrator Agent** for "Enterprise Insight OS".
You are a multi-agent controller that delegates work to specialized sub-agents.

[SUB-AGENTS]
1) **HR_ANALYTICS_AGENT**: Analyzes HR data, computes stats, finds records.
2) **DATAOPS_AGENT**: Edits/cleans data.

[OUTPUT FORMAT]
Return JSON:
{
  "answer": "Markdown string...", 
  "sources": []
}
`;

export const generateAgentResponse = async (
  query: string,
  files: IngestedFile[], 
  history: ChatMessage[],
  activeDataset: ActiveDataset | null,
  onUpdateDataset?: (dataset: ActiveDataset) => void // Callback for mutations
): Promise<{ text: string; sources: SourceCitation[] }> => {
  
  agentLogger.addLog('1', `Received user query: "${query}"`, 'info');

  if (!activeDataset) {
    return {
      text: "**No Active Dataset**\n\nPlease upload a dataset using the 'Upload Data' button before asking questions.",
      sources: []
    };
  }

  const lowerQuery = query.toLowerCase();

  // --- 1. DATAOPS ROUTING ---
  const dataOpsKeywords = ['clean', 'remove', 'delete', 'add row', 'fix', 'filter', 'deduplicate', 'fill', 'normalize', 'edit', 'transform'];
  const isDataOpsQuery = dataOpsKeywords.some(k => lowerQuery.includes(k));

  if (isDataOpsQuery) {
     agentLogger.addLog('1', 'Routing to DATAOPS_AGENT', 'action');

     const request: DataOpsRequest = {
        mode: DataOpsMode.BULK_UPDATE, // Generic, will be refined by DataOps Agent
        natural_language_instruction: query
     };

     const planResponse = await dataOpsService.generateTransformationPlan(request, activeDataset);

     if (planResponse && onUpdateDataset) {
        // AUTO-EXECUTE FOR DEMO
        const newDataset = dataOpsService.executeTransformation(activeDataset, planResponse.plan, planResponse.summary);
        onUpdateDataset(newDataset);
        
        return {
           text: `**DataOps Execution Complete**\n\n${planResponse.summary}\n\nDataset updated to **v${newDataset.version}**.`,
           sources: [{ fileName: activeDataset.fileName }]
        };
     } else {
        return {
           text: "I understood the request but could not generate a valid transformation plan.",
           sources: []
        };
     }
  }

  // --- 2. HR ANALYTICS ROUTING ---
  const hrKeywords = ['analyze', 'who', 'count', 'average', 'sum', 'trend', 'compare', 'highest', 'lowest', 'department', 'score', 'salary', 'performance', 'show', 'list', 'find', 'insights', 'chart', 'kpi'];
  const isHRQuery = hrKeywords.some(k => lowerQuery.includes(k));

  if (isHRQuery) {
    agentLogger.addLog('1', 'Routing to HR_ANALYTICS_AGENT', 'action');
    
    // Call Sub-Agent
    const analysisResult = await hrAnalyticsService.generateAnalysis(query, activeDataset);
    
    // Wrap result in Orchestrator format
    const wrappedText = `
${analysisResult}

**Agent Actions:**
- Identified intent: HR_ANALYTICS
- Delegated to **HR Analytics Agent** (v${activeDataset.version})
`;
    
    return {
      text: wrappedText,
      sources: [{ fileName: activeDataset.fileName }]
    };
  }

  // --- 3. GENERAL CONVERSATION ---
  agentLogger.addLog('1', 'Handling as general conversational query', 'info');

  const contextString = `
    ACTIVE DATASET: ${activeDataset.fileName} (v${activeDataset.version})
    ROWS: ${activeDataset.rows.length}
    COLUMNS: ${activeDataset.columns.map(c => c.name).join(', ')}
  `;

  const recentHistory = history.slice(-4).map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        ${contextString}
        HISTORY: ${recentHistory}
        QUERY: ${query}
      `,
      config: {
        systemInstruction: ORCHESTRATOR_PROMPT,
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      text: parsed.answer || "I processed the request.",
      sources: parsed.sources || []
    };
  } catch (e) {
    console.error("Orchestrator Error", e);
    agentLogger.addLog('1', 'Orchestrator failed to process query', 'error');
    return {
      text: "I encountered an internal error. Please try again.",
      sources: []
    };
  }
};
