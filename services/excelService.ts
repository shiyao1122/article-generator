import * as XLSX from 'xlsx';
import { ArticleData } from '../types';

export const parseExcelFile = async (file: File): Promise<ArticleData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedRows: ArticleData[] = jsonData.map((row: any, index: number) => ({
          id: `row-${Date.now()}-${index}`,
          scenario: row['Scenarios'] || '',
          subScenario: row['Sub-scenarios'] || '',
          topic: row['Topic'] || '',
          keywords: row['Keywords'] || '',
          outline: row['Outline'] || '',
          status: 'idle'
        }));

        resolve(parsedRows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};