import { SchemaColumn } from '../types';

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

interface ParseResult {
  rows: any[];
  columns: SchemaColumn[];
}

export const parseCSV = (csvText: string): ParseResult => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) {
    throw new Error("Empty CSV file");
  }

  // Handle basic CSV parsing (splitting by comma, handling quotes roughly for demo)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const rows: any[] = [];
  
  // Parse rows (skipping header)
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(','); // Simple split for demo
    if (currentLine.length === headers.length) {
      const rowObj: any = {};
      headers.forEach((header, index) => {
        let val = currentLine[index]?.trim().replace(/^"|"$/g, '');
        // Try to convert numbers
        if (!isNaN(Number(val)) && val !== '') {
          rowObj[header] = Number(val);
        } else {
          rowObj[header] = val;
        }
      });
      rows.push(rowObj);
    }
  }

  // Infer Schema
  const columns: SchemaColumn[] = headers.map((header) => {
    // Check first 5 rows to guess type
    let type = 'string';
    const sampleVal = rows[0] ? rows[0][header] : '';
    
    if (typeof sampleVal === 'number') type = 'number';
    else if (header.toLowerCase().includes('date') || !isNaN(Date.parse(sampleVal))) type = 'date';
    
    return {
      name: header,
      type,
      example: sampleVal
    };
  });

  return { rows, columns };
};

export const parseJSON = (jsonText: string): ParseResult => {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    throw new Error("Invalid JSON");
  }

  const rows = Array.isArray(data) ? data : [data];
  
  if (rows.length === 0) {
    return { rows: [], columns: [] };
  }

  const keys = Object.keys(rows[0]);
  const columns: SchemaColumn[] = keys.map(key => {
    const val = rows[0][key];
    let type = typeof val;
    if (type === 'object') type = 'string'; // simplify for demo
    
    return {
      name: key,
      type: type,
      example: String(val).substring(0, 20)
    };
  });

  return { rows, columns };
};

export const processFile = async (file: File): Promise<{ fileName: string, rows: any[], columns: SchemaColumn[] }> => {
  const text = await readFileAsText(file);
  
  let result: ParseResult;

  if (file.name.toLowerCase().endsWith('.csv')) {
    result = parseCSV(text);
  } else if (file.name.toLowerCase().endsWith('.json')) {
    result = parseJSON(text);
  } else {
    throw new Error("Unsupported file type. Please upload CSV or JSON.");
  }

  return {
    fileName: file.name,
    rows: result.rows,
    columns: result.columns
  };
};
