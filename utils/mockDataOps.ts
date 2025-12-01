import { ActiveDataset, DatasetVersion } from '../types';

export const DataOps = {
  
  // Create a new committed version from current state
  commitVersion: (
    current: ActiveDataset, 
    changeDescription: string
  ): ActiveDataset => {
    const newVersionNum = current.version + 1;
    const versionRecord: DatasetVersion = {
      version: current.version,
      timestamp: new Date(),
      changeDescription: changeDescription,
      rowCount: current.rows.length,
      modificationsCount: 1 // Simplified for demo
    };

    return {
      ...current,
      version: newVersionNum,
      history: [...current.history, versionRecord],
      lastModified: new Date(),
      isModified: false
    };
  },

  // Helper used internally by other ops
  createVersion: (
    current: ActiveDataset, 
    changeDescription: string, 
    newRows: any[]
  ): ActiveDataset => {
    // For specific discrete actions like "Delete Row", we commit immediately for simplicity in this demo,
    // or we could mark as modified. Let's assume discrete buttons commit immediately to v+1.
    const newVersionNum = current.version + 1;
    const versionRecord: DatasetVersion = {
      version: current.version,
      timestamp: new Date(),
      changeDescription: changeDescription,
      rowCount: current.rows.length
    };

    return {
      ...current,
      rows: newRows,
      version: newVersionNum,
      history: [...current.history, versionRecord],
      lastModified: new Date(),
      isModified: false
    };
  },

  removeNulls: (dataset: ActiveDataset): ActiveDataset => {
    const cleanRows = dataset.rows.filter(row => {
      return Object.values(row).every(val => val !== null && val !== '' && val !== undefined);
    });
    
    if (cleanRows.length === dataset.rows.length) return dataset; // No change

    return DataOps.createVersion(
      dataset, 
      `Removed ${dataset.rows.length - cleanRows.length} rows with NULL values`, 
      cleanRows
    );
  },

  fillNulls: (dataset: ActiveDataset): ActiveDataset => {
    // Simple logic: fill numeric with median (or 0), string with "Unknown"
    const newRows = dataset.rows.map(row => {
      const newRow = { ...row };
      dataset.columns.forEach(col => {
        const val = newRow[col.name];
        if (val === null || val === '' || val === undefined) {
          if (col.type === 'number') newRow[col.name] = 0; // Simplified
          else newRow[col.name] = "Unknown";
        }
      });
      return newRow;
    });

    return {
      ...dataset,
      rows: newRows,
      isModified: true
    };
  },

  normalizeDates: (dataset: ActiveDataset): ActiveDataset => {
    // Attempt to standardize date strings to YYYY-MM-DD
    const dateCols = dataset.columns.filter(c => c.type === 'date' || c.name.toLowerCase().includes('date'));
    if (dateCols.length === 0) return dataset;

    const newRows = dataset.rows.map(row => {
      const newRow = { ...row };
      dateCols.forEach(col => {
        const val = newRow[col.name];
        if (val) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
             newRow[col.name] = d.toISOString().split('T')[0];
          }
        }
      });
      return newRow;
    });

    return {
      ...dataset,
      rows: newRows,
      isModified: true
    };
  },

  removeDuplicates: (dataset: ActiveDataset): ActiveDataset => {
    const uniqueRows: any[] = [];
    const seen = new Set();
    
    dataset.rows.forEach(row => {
      const sig = JSON.stringify(row);
      if (!seen.has(sig)) {
        seen.add(sig);
        uniqueRows.push(row);
      }
    });

    if (uniqueRows.length === dataset.rows.length) return dataset;

    return DataOps.createVersion(
      dataset,
      `Removed ${dataset.rows.length - uniqueRows.length} duplicate rows`,
      uniqueRows
    );
  },

  deleteRows: (dataset: ActiveDataset, indices: number[]): ActiveDataset => {
    const newRows = dataset.rows.filter((_, idx) => !indices.includes(idx));
    return DataOps.createVersion(
      dataset,
      `Deleted ${indices.length} user-selected rows`,
      newRows
    );
  },

  addRow: (dataset: ActiveDataset, rowData?: any): ActiveDataset => {
    // Create empty row based on schema if no data provided
    let newRow: any = rowData || {};
    
    if (!rowData) {
        dataset.columns.forEach(col => {
          newRow[col.name] = col.type === 'number' ? 0 : '';
        });
    }
    
    const newRows = [newRow, ...dataset.rows];
    // Mark as modified instead of immediate version commit for Add Row
    return {
        ...dataset,
        rows: newRows,
        isModified: true,
        lastModified: new Date()
    };
  },
  
  updateCell: (dataset: ActiveDataset, rowIndex: number, key: string, value: any): ActiveDataset => {
    const newRows = [...dataset.rows];
    
    // Validate type roughly
    const col = dataset.columns.find(c => c.name === key);
    let safeValue = value;
    if (col?.type === 'number') {
        safeValue = Number(value);
    }

    newRows[rowIndex] = { ...newRows[rowIndex], [key]: safeValue };
    
    return {
       ...dataset,
       rows: newRows,
       isModified: true,
       lastModified: new Date()
    };
  }
};