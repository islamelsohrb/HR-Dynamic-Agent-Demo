
import { GoogleGenAI } from "@google/genai";
import { ActiveDataset, DataOpsRequest, DataOpsResponse, DataOpsMode, TransformationPlan, DataOpsOperation } from "../types";
import { agentLogger } from "./agentLogger";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

const DATAOPS_SYSTEM_PROMPT = `
[ROLE / IDENTITY]
You are the **DATAOPS_AGENT** for the "Enterprise Insight OS – Demo".
You are the platform’s **DataOps & Transformation brain**.

[PRIMARY OBJECTIVES]
1. Understand the dataset (columns, types).
2. Generate safe, explicit data transformation plans based on the requested mode.
3. Support core actions: DELETE_ROWS, CLEAN_NULLS, FILL_NULLS, DEDUPLICATE, NORMALIZE_DATES, ADD_ROW, EDIT_CELL.

[OUTPUT FORMAT]
Response must be JSON:
{
  "plan": {
    "operations": [
      {
        "type": "CLEAN_NULLS | FILL_NULLS | DEDUPLICATE | ...",
        "params": { ... }
      }
    ]
  },
  "summary": "Human readable summary of what will happen.",
  "new_version": "vN+1"
}

[SAFETY]
- Do not delete all rows.
- If request is ambiguous, default to the safest operation.
`;

// Simple hash function for demo purposes (simulating atomic content addressing)
const generateHash = (content: string): string => {
  let hash = 0;
  if (content.length === 0) return hash.toString(16);
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

export const dataOpsService = {

  /**
   * Generates a transformation plan using Gemini
   */
  generateTransformationPlan: async (request: DataOpsRequest, dataset: ActiveDataset): Promise<DataOpsResponse | null> => {
    agentLogger.addLog('3', `Generating plan for ${request.mode}`, 'action');

    const sampleRows = dataset.rows.slice(0, 10);
    const context = `
      DATASET: ${dataset.fileName} (v${dataset.version})
      COLUMNS: ${dataset.columns.map(c => c.name + '(' + c.type + ')').join(', ')}
      SAMPLE DATA: ${JSON.stringify(sampleRows)}
      
      REQUEST MODE: ${request.mode}
      REQUEST DETAILS: ${JSON.stringify(request.details || request.natural_language_instruction)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: context,
        config: {
          systemInstruction: DATAOPS_SYSTEM_PROMPT,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      // Construct local preview
      const resp: DataOpsResponse = {
        plan: parsed.plan,
        summary: parsed.summary,
        preview: {
          rows_sample: sampleRows, // Simplified
          row_count_before: dataset.rows.length,
          row_count_after: dataset.rows.length // Placeholder
        },
        new_version: parsed.new_version
      };

      return resp;
    } catch (e) {
      console.error("DataOps Planning Error:", e);
      agentLogger.addLog('3', 'Failed to generate transformation plan', 'error');
      return null;
    }
  },

  /**
   * Executes the transformation plan on the dataset
   */
  executeTransformation: (dataset: ActiveDataset, plan: TransformationPlan, summaryOverride?: string): ActiveDataset => {
    agentLogger.addLog('3', `Executing transformation plan: ${summaryOverride || 'Multiple operations'}`, 'action');
    
    let currentRows = [...dataset.rows];
    let modifications = 0;

    plan.operations.forEach((op: DataOpsOperation) => {
      // SAFETY GUARDRAILS
      if (op.type === DataOpsMode.DELETE_ROWS) {
        if (!op.params || (!op.params.indices && !op.params.filter)) {
           console.warn("Safety Check Failed: DELETE_ROWS requires specific indices or filter.");
           throw new Error("Safety Check Failed: Cannot execute destructive DELETE without specific target.");
        }
      }

      switch (op.type) {
        case DataOpsMode.CLEAN_NULLS: {
          const startLen = currentRows.length;
          currentRows = currentRows.filter(row => 
            Object.values(row).every(val => val !== null && val !== '' && val !== undefined)
          );
          modifications += (startLen - currentRows.length);
          break;
        }
        
        case DataOpsMode.DEDUPLICATE: {
           const startLen = currentRows.length;
           const seen = new Set();
           const unique: any[] = [];
           currentRows.forEach(row => {
             const sig = JSON.stringify(row);
             if (!seen.has(sig)) {
               seen.add(sig);
               unique.push(row);
             }
           });
           currentRows = unique;
           modifications += (startLen - currentRows.length);
           break;
        }

        case DataOpsMode.FILL_NULLS: {
           currentRows = currentRows.map(row => {
              const newRow = { ...row };
              dataset.columns.forEach(col => {
                 const val = newRow[col.name];
                 if (val === null || val === '' || val === undefined) {
                    newRow[col.name] = col.type === 'number' ? 0 : "Unknown";
                    modifications++;
                 }
              });
              return newRow;
           });
           break;
        }

        case DataOpsMode.NORMALIZE_DATES: {
           const dateCols = dataset.columns.filter(c => c.type === 'date' || c.name.toLowerCase().includes('date'));
           currentRows = currentRows.map(row => {
             const newRow = { ...row };
             dateCols.forEach(col => {
               const val = newRow[col.name];
               if (val) {
                 const d = new Date(val);
                 if (!isNaN(d.getTime())) {
                    const iso = d.toISOString().split('T')[0];
                    if (iso !== val) {
                       newRow[col.name] = iso;
                       modifications++;
                    }
                 }
               }
             });
             return newRow;
           });
           break;
        }

        case DataOpsMode.DELETE_ROWS: {
          if (op.params && op.params.indices) {
             const indices = new Set(op.params.indices as number[]);
             currentRows = currentRows.filter((_, idx) => !indices.has(idx));
             modifications += indices.size;
          }
          break;
        }
        
        case DataOpsMode.ADD_ROW: {
           if (op.params && op.params.row) {
             currentRows = [op.params.row, ...currentRows];
             modifications++;
           }
           break;
        }

        case DataOpsMode.EDIT_CELL: {
           if (op.params && typeof op.params.rowIndex === 'number' && op.params.colName) {
              const { rowIndex, colName, value } = op.params;
              if (currentRows[rowIndex]) {
                 currentRows[rowIndex] = { ...currentRows[rowIndex], [colName]: value };
                 modifications++;
              }
           }
           break;
        }
      }
    });

    // ATOMIC WRITE SIMULATION: Generate new Hash
    const contentString = JSON.stringify(currentRows);
    const newVersionHash = generateHash(contentString);
    const newVersion = dataset.version + 1;

    // VALIDATION: Ensure we didn't wipe the dataset unexpectedly (unless intended)
    if (currentRows.length === 0 && dataset.rows.length > 0 && summaryOverride?.toLowerCase().includes("delete")) {
        // If it was a generic delete without explicit "all", this is suspicious.
        // For now, allow it but log warning.
        agentLogger.addLog('3', 'Warning: Dataset is empty after transformation.', 'info');
    }

    return {
      ...dataset,
      rows: currentRows,
      version: newVersion,
      versionHash: newVersionHash, // ATOMIC POINTER
      lastModified: new Date(),
      history: [
        ...dataset.history,
        {
          version: dataset.version,
          timestamp: new Date(),
          changeDescription: summaryOverride || "Applied transformations via DataOps Agent",
          rowCount: dataset.rows.length,
          modificationsCount: modifications
        }
      ],
      isModified: false
    };
  }
};
