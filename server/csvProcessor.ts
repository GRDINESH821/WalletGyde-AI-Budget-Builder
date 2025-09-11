import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { analyzeCsvAndGenerateInsights } from './openai';

export interface CsvRow {
  date: string;
  description: string;
  amount: number;
  [key: string]: any;
}

export async function processCsvFile(filePath: string): Promise<{ data: CsvRow[], analysis: string, chartConfig: any }> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Try to standardize different CSV formats
        const row: CsvRow = {
          date: data.date || data.Date || data.DATE || data['Transaction Date'] || '',
          description: data.description || data.Description || data.DESCRIPTION || data['Transaction Description'] || data.Merchant || '',
          amount: parseFloat(data.amount || data.Amount || data.AMOUNT || data.Credit || data.Debit || '0'),
        };
        
        // Handle debit/credit columns
        if (data.Credit && !data.Debit) {
          row.amount = parseFloat(data.Credit);
        } else if (data.Debit && !data.Credit) {
          row.amount = -parseFloat(data.Debit);
        } else if (data.Credit && data.Debit) {
          row.amount = parseFloat(data.Credit) - parseFloat(data.Debit);
        }
        
        if (row.date && row.description && !isNaN(row.amount)) {
          results.push(row);
        }
      })
      .on('end', async () => {
        try {
          if (results.length === 0) {
            reject(new Error('No valid transactions found in CSV. Please ensure your file has columns for date, description, and amount.'));
            return;
          }
          
          const insights = await analyzeCsvAndGenerateInsights(results);
          resolve({
            data: results,
            analysis: insights.analysis,
            chartConfig: insights.chartConfig
          });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}