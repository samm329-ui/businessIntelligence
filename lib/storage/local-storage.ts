import * as fs from 'fs';
import * as path from 'path';

const BASE_DIR = path.join(process.cwd(), 'data');
const CRAWL_DIR = path.join(BASE_DIR, 'crawled');
const HISTORY_DIR = path.join(BASE_DIR, 'history');
const SEARCH_DIR = path.join(BASE_DIR, 'search-cache');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 100);
}

export function storeCrawledData(entityName: string, data: any): void {
  ensureDir(CRAWL_DIR);
  const key = sanitizeKey(entityName);
  const filePath = path.join(CRAWL_DIR, `${key}.json`);
  
  const existing = loadCrawledData(entityName);
  const merged = {
    entity: entityName,
    updatedAt: new Date().toISOString(),
    pages: [...(existing?.pages || []), ...(data.pages || [])].slice(-50),
  };
  
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
}

export function loadCrawledData(entityName: string): any | null {
  const key = sanitizeKey(entityName);
  const filePath = path.join(CRAWL_DIR, `${key}.json`);
  
  if (!fs.existsSync(filePath)) return null;
  
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export function storeSearchCache(query: string, results: any[], ttlMs: number = 3600000): void {
  ensureDir(SEARCH_DIR);
  const key = sanitizeKey(query);
  const filePath = path.join(SEARCH_DIR, `${key}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify({
    query,
    results,
    cachedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  }, null, 2));
}

export function loadSearchCache(query: string): any[] | null {
  const key = sanitizeKey(query);
  const filePath = path.join(SEARCH_DIR, `${key}.json`);
  
  if (!fs.existsSync(filePath)) return null;
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (new Date(data.expiresAt) < new Date()) {
      fs.unlinkSync(filePath);
      return null;
    }
    return data.results;
  } catch {
    return null;
  }
}

export function storeHistoricalData(entityName: string, data: any): void {
  ensureDir(HISTORY_DIR);
  const key = sanitizeKey(entityName);
  const filePath = path.join(HISTORY_DIR, `${key}.jsonl`);
  
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...data,
  });
  
  fs.appendFileSync(filePath, entry + '\n');
}

export function loadHistoricalData(entityName: string, limit: number = 10): any[] {
  const key = sanitizeKey(entityName);
  const filePath = path.join(HISTORY_DIR, `${key}.jsonl`);
  
  if (!fs.existsSync(filePath)) return [];
  
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
    return lines.slice(-limit).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

export function getStorageStats(): {
  crawledFiles: number;
  searchCacheFiles: number;
  historyFiles: number;
  totalSizeBytes: number;
} {
  let crawledFiles = 0, searchCacheFiles = 0, historyFiles = 0, totalSizeBytes = 0;
  
  const countDir = (dir: string) => {
    if (!fs.existsSync(dir)) return { files: 0, size: 0 };
    const files = fs.readdirSync(dir);
    let size = 0;
    for (const file of files) {
      const stat = fs.statSync(path.join(dir, file));
      size += stat.size;
    }
    return { files: files.length, size };
  };
  
  const crawl = countDir(CRAWL_DIR);
  const search = countDir(SEARCH_DIR);
  const history = countDir(HISTORY_DIR);
  
  return {
    crawledFiles: crawl.files,
    searchCacheFiles: search.files,
    historyFiles: history.files,
    totalSizeBytes: crawl.size + search.size + history.size,
  };
}

export function cleanupExpiredCache(): number {
  let cleaned = 0;
  
  if (fs.existsSync(SEARCH_DIR)) {
    for (const file of fs.readdirSync(SEARCH_DIR)) {
      const filePath = path.join(SEARCH_DIR, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (new Date(data.expiresAt) < new Date()) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }
  }
  
  return cleaned;
}
