import Papa from 'papaparse';
import { validateEmail } from './validation';

export interface ParsedEmail {
  email: string;
  isValid: boolean;
  error?: string;
}

export interface CsvParseResult {
  success: boolean;
  emails: ParsedEmail[];
  validEmails: string[];
  invalidEmails: ParsedEmail[];
  totalCount: number;
  validCount: number;
  error?: string;
}


export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    if (!file) {
      resolve({
        success: false,
        emails: [],
        validEmails: [],
        invalidEmails: [],
        totalCount: 0,
        validCount: 0,
        error: 'No file provided'
      });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      resolve({
        success: false,
        emails: [],
        validEmails: [],
        invalidEmails: [],
        totalCount: 0,
        validCount: 0,
        error: 'Please upload a CSV file'
      });
      return;
    }

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const emails: ParsedEmail[] = [];
          const validEmails: string[] = [];
          const invalidEmails: ParsedEmail[] = [];

          (results.data as string[][]).forEach((row) => {
            if (Array.isArray(row) && row.length > 0) {
              const emailCandidate = String(row[0]).trim();
              
              if (emailCandidate) {
                const isValid = validateEmail(emailCandidate);
                const parsedEmail: ParsedEmail = {
                  email: emailCandidate,
                  isValid,
                  error: isValid ? undefined : 'Invalid email format'
                };

                emails.push(parsedEmail);

                if (isValid) {
                  if (!validEmails.includes(emailCandidate)) {
                    validEmails.push(emailCandidate);
                  }
                } else {
                  invalidEmails.push(parsedEmail);
                }
              }
            }
          });

          resolve({
            success: true,
            emails,
            validEmails,
            invalidEmails,
            totalCount: emails.length,
            validCount: validEmails.length,
          });
        } catch {
          resolve({
            success: false,
            emails: [],
            validEmails: [],
            invalidEmails: [],
            totalCount: 0,
            validCount: 0,
            error: 'Failed to parse CSV file'
          });
        }
      },
      error: () => {
        resolve({
          success: false,
          emails: [],
          validEmails: [],
          invalidEmails: [],
          totalCount: 0,
          validCount: 0,
          error: 'CSV parsing error occurred'
        });
      }
    });
  });
}

export function generateSampleCsv(): string {
  const sampleEmails = [
    'user1@example.com',
    'user2@company.org',
    'admin@domain.net',
    'test@sample.io'
  ];
  
  return sampleEmails.join('\n');
}

export function downloadSampleCsv(): void {
  const csvContent = generateSampleCsv();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_emails.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}