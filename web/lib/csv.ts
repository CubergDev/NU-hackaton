export function parseCSV(text: string): Record<string, any>[] {
  const result: Record<string, any>[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return result;

  const parseLine = (line: string) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      let val = values[index] || "";
      // Strip outer quotes if they exist
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      
      const cleanHeader = header.toLowerCase();
      if (cleanHeader === 'skills') {
        obj[cleanHeader] = val ? val.split(';').map(s => s.trim()) : [];
      } else {
        obj[cleanHeader || `col_${index}`] = val;
      }
    });

    // Skip empty rows
    if (Object.values(obj).some(v => v !== "" && v !== null && (Array.isArray(v) ? v.length > 0 : true))) {
      result.push(obj);
    }
  }
  return result;
}
