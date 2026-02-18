/**
 * EBITA Intelligence - Indian Industry Excel Database Loader
 * Primary source: c:\Users\jishu\Downloads\Indian_Industry_Companies_Database.xlsx
 * 
 * This file serves as the PRIMARY database for:
 * - Company identification
 * - Industry identification
 * - Sub-category identification
 * 
 * Other datasets (CSV, JSON) are used as fallback.
 */

import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import type { CompanyRecord } from '../resolution/entity-resolver-v2';

export interface ExcelCompanyRecord {
  id: string;
  companyName: string;
  normalizedName: string;
  brands: string;
  location: string;
  sector: string;
  industry: string;
  subCategory: string;
  sizeTier: string;
  region: string;
  country: string;
  isListed: boolean;
}

const INDIAN_EXCEL_PATHS = [
  'C:\\Users\\jishu\\Downloads\\Indian_Industry_Companies_Database.xlsx',
  path.resolve(process.cwd(), '..', '..', 'Users', 'jishu', 'Downloads', 'Indian_Industry_Companies_Database.xlsx'),
  path.resolve(process.cwd(), 'datasets', 'Indian_Industry_Companies_Database.xlsx'),
];

const EXCEL_WORKSHEET_NAME = 'Sheet1';

let cachedRecords: ExcelCompanyRecord[] | null = null;

function mapSectorToIndustry(sector: string): Record<string, string> {
  return {
    'Primary': 'Agriculture & Mining',
    'Secondary': 'Manufacturing & Industry',
    'Tertiary': 'Services',
  };
}

function excelRowToRecord(row: any, index: number): ExcelCompanyRecord {
  const brandList = row.brands && typeof row.brands === 'string'
    ? row.brands.split('|').map((b: string) => b.trim()).filter(Boolean)
    : [];

  return {
    id: row.id || `excel_${index}`,
    companyName: row.company_name || row.Company_Name || row.companyName || '',
    normalizedName: row.normalized_name || row.normalizedName || (row.company_name || row.Company_Name || '').toLowerCase().replace(/\s+/g, '_'),
    brands: row.brands || '',
    location: row.location || row.Location || '',
    sector: row.sector || row.Sector || 'Tertiary',
    industry: row.industry || row.Industry || 'Unknown',
    subCategory: row.sub_category || row.subCategory || row['Sub-Category'] || 'General',
    sizeTier: row.size_tier || row.sizeTier || row.Size_Tier || 'Unknown',
    region: row.region || row.Region || 'India',
    country: row.country || row.Country || 'India',
    isListed: row.is_listed === true || row.is_listed === 'true' || row.isListed === true || row.listed === 'Yes',
  };
}

export async function loadIndianCompaniesFromExcel(): Promise<ExcelCompanyRecord[]> {
  if (cachedRecords) {
    return cachedRecords;
  }

  for (const excelPath of INDIAN_EXCEL_PATHS) {
    try {
      if (!fs.existsSync(excelPath)) {
        continue;
      }

      console.log(`[IndianExcel] Loading from: ${excelPath}`);
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(excelPath);
      
      const worksheet = workbook.getWorksheet(EXCEL_WORKSHEET_NAME) || workbook.getWorksheet(1);
      if (!worksheet) {
        console.warn(`[IndianExcel] No worksheet found in ${excelPath}`);
        continue;
      }

      const records: ExcelCompanyRecord[] = [];
      const headers: string[] = [];
      
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) {
          row.eachCell((cell) => {
            headers.push(cell.value?.toString() || '');
          });
          return;
        }

        const rowData: any = {};
        row.eachCell((cell, colNum) => {
          const header = headers[colNum - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });

        if (rowData.company_name || rowData.Company_Name || rowData.companyName) {
          records.push(excelRowToRecord(rowData, records.length));
        }
      });

      cachedRecords = records;
      console.log(`[IndianExcel] ✅ Loaded ${records.length} companies from Excel`);
      return records;
      
    } catch (err) {
      console.warn(`[IndianExcel] Error loading ${excelPath}:`, err);
    }
  }

  console.warn('[IndianExcel] ⚠️ Could not load Excel file from any path');
  return [];
}

export function searchIndianCompanies(query: string): ExcelCompanyRecord[] {
  if (!cachedRecords || cachedRecords.length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: ExcelCompanyRecord[] = [];
  
  for (const company of cachedRecords) {
    const nameMatch = company.normalizedName?.includes(normalizedQuery) || 
                     company.companyName?.toLowerCase().includes(normalizedQuery);
    const industryMatch = company.industry?.toLowerCase().includes(normalizedQuery);
    const subMatch = company.subCategory?.toLowerCase().includes(normalizedQuery);
    const brandMatch = company.brands?.toLowerCase().includes(normalizedQuery);
    
    if (nameMatch || industryMatch || subMatch || brandMatch) {
      results.push(company);
    }
  }

  return results.sort((a, b) => {
    const aExact = a.normalizedName === normalizedQuery ? 3 : 
                    a.companyName?.toLowerCase().startsWith(normalizedQuery) ? 2 : 0;
    const bExact = b.normalizedName === normalizedQuery ? 3 : 
                    b.companyName?.toLowerCase().startsWith(normalizedQuery) ? 2 : 0;
    return bExact - aExact;
  }).slice(0, 20);
}

export function getCompanyByExactName(name: string): ExcelCompanyRecord | undefined {
  if (!cachedRecords) return undefined;
  
  const normalized = name.toLowerCase().trim();
  return cachedRecords.find(c => 
    c.normalizedName === normalized || 
    c.companyName.toLowerCase() === normalized
  );
}

export function getCompaniesByIndustry(industry: string): ExcelCompanyRecord[] {
  if (!cachedRecords) return [];
  return cachedRecords.filter(c => 
    c.industry?.toLowerCase().includes(industry.toLowerCase())
  );
}

export function getCompaniesBySubCategory(subCategory: string): ExcelCompanyRecord[] {
  if (!cachedRecords) return [];
  return cachedRecords.filter(c => 
    c.subCategory?.toLowerCase().includes(subCategory.toLowerCase())
  );
}

export function getAllIndustries(): string[] {
  if (!cachedRecords) return [];
  return [...new Set(cachedRecords.map(c => c.industry).filter(Boolean))].sort();
}

export function getAllSubCategories(): string[] {
  if (!cachedRecords) return [];
  return [...new Set(cachedRecords.map(c => c.subCategory).filter(Boolean))].sort();
}

export function getSubCategoriesByIndustry(industry: string): string[] {
  if (!cachedRecords) return [];
  return [...new Set(
    cachedRecords
      .filter(c => c.industry?.toLowerCase().includes(industry.toLowerCase()))
      .map(c => c.subCategory)
      .filter(Boolean)
  )].sort();
}

export function getIndustryInfo(industry: string): { 
  industry: string; 
  subCategories: string[]; 
  companyCount: number;
} | null {
  if (!cachedRecords) return null;
  
  const companies = cachedRecords.filter(c => 
    c.industry?.toLowerCase() === industry.toLowerCase()
  );
  
  if (companies.length === 0) return null;
  
  return {
    industry,
    subCategories: [...new Set(companies.map(c => c.subCategory).filter(Boolean))],
    companyCount: companies.length,
  };
}
