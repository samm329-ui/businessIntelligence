/**
 * Change Detection System
 * 
 * Detects changes in data over time and only updates when necessary.
 * This reduces storage, GPU usage, and API calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import type { CollectedData } from './collector';

export interface DataVersion {
  entityName: string;
  versionId: string;
  collectedAt: string;
  dataHash: string;
  changes: DataChange[];
  isSignificantChange: boolean;
}

export interface DataChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
  significance: 'high' | 'medium' | 'low';
}

export interface ChangeDetectionResult {
  hasChanges: boolean;
  isSignificant: boolean;
  changes: DataChange[];
  previousVersion?: DataVersion;
  shouldUpdate: boolean;
}

// Storage for version history
const VERSIONS_DIR = path.resolve(process.cwd(), 'data', 'versions');
const CHANGE_THRESHOLD = 0.05; // 5% change threshold

// ═══════════════════════════════════════════════════════════════════════════
// Initialize Storage
// ═══════════════════════════════════════════════════════════════════════════

function ensureVersionsDir(): void {
  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Calculate Data Hash
// ═══════════════════════════════════════════════════════════════════════════

function calculateHash(data: any): string {
  const str = JSON.stringify(data);
  return createHash('md5').update(str).digest('hex');
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Version File Path
// ═══════════════════════════════════════════════════════════════════════════

function getVersionFilePath(entityName: string): string {
  const normalized = entityName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return path.join(VERSIONS_DIR, `${normalized}_versions.json`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Load Version History
// ═══════════════════════════════════════════════════════════════════════════

export function loadVersionHistory(entityName: string): DataVersion[] {
  ensureVersionsDir();
  const filePath = getVersionFilePath(entityName);

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error: any) {
    console.error(`[ChangeDetector] Error loading versions for ${entityName}:`, error.message);
  }

  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// Save Version History
// ═══════════════════════════════════════════════════════════════════════════

export function saveVersionHistory(entityName: string, versions: DataVersion[]): void {
  ensureVersionsDir();
  const filePath = getVersionFilePath(entityName);

  try {
    // Keep only last 5 versions
    const trimmedVersions = versions.slice(-5);
    fs.writeFileSync(filePath, JSON.stringify(trimmedVersions, null, 2));
  } catch (error: any) {
    console.error(`[ChangeDetector] Error saving versions for ${entityName}:`, error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Detect Changes Between Two Data Objects
// ═══════════════════════════════════════════════════════════════════════════

export function detectChanges(oldData: any, newData: any, path: string = ''): DataChange[] {
  const changes: DataChange[] = [];

  // Handle primitive types
  if (typeof oldData !== typeof newData) {
    changes.push({
      field: path || 'root',
      oldValue: oldData,
      newValue: newData,
      changeType: 'modified',
      significance: 'medium',
    });
    return changes;
  }

  // Handle arrays
  if (Array.isArray(oldData) && Array.isArray(newData)) {
    if (oldData.length !== newData.length) {
      changes.push({
        field: path || 'array',
        oldValue: `${oldData.length} items`,
        newValue: `${newData.length} items`,
        changeType: 'modified',
        significance: oldData.length === 0 || newData.length === 0 ? 'high' : 'medium',
      });
    }
    return changes;
  }

  // Handle objects
  if (typeof oldData === 'object' && oldData !== null && newData !== null) {
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (!(key in oldData)) {
        changes.push({
          field: currentPath,
          oldValue: undefined,
          newValue,
          changeType: 'added',
          significance: assessSignificance(key, newValue),
        });
      } else if (!(key in newData)) {
        changes.push({
          field: currentPath,
          oldValue,
          newValue: undefined,
          changeType: 'removed',
          significance: assessSignificance(key, oldValue),
        });
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push(...detectChanges(oldValue, newValue, currentPath));
      }
    }

    return changes;
  }

  // Handle primitives comparison
  if (oldData !== newData) {
    changes.push({
      field: path || 'value',
      oldValue: oldData,
      newValue: newData,
      changeType: 'modified',
      significance: assessSignificance(path, newData),
    });
  }

  return changes;
}

// ═══════════════════════════════════════════════════════════════════════════
// Assess Change Significance
// ═══════════════════════════════════════════════════════════════════════════

function assessSignificance(field: string, value: any): 'high' | 'medium' | 'low' {
  const highSignificanceFields = [
    'revenue', 'ebitda', 'profit', 'growth', 'marketCap',
    'financial', 'earnings', 'sales', 'income',
    'competitors', 'market', 'industry',
  ];

  const mediumSignificanceFields = [
    'news', 'employees', 'headquarters', 'founded',
    'description', 'overview',
  ];

  const fieldLower = field.toLowerCase();

  for (const highField of highSignificanceFields) {
    if (fieldLower.includes(highField)) return 'high';
  }

  for (const medField of mediumSignificanceFields) {
    if (fieldLower.includes(medField)) return 'medium';
  }

  return 'low';
}

// ═══════════════════════════════════════════════════════════════════════════
// Check if Changes are Significant
// ═══════════════════════════════════════════════════════════════════════════

function isSignificantChange(changes: DataChange[]): boolean {
  // Count high and medium significance changes
  const significantChanges = changes.filter(c => 
    c.significance === 'high' || c.significance === 'medium'
  );

  // If more than 3 significant changes, consider it significant
  if (significantChanges.length >= 3) {
    return true;
  }

  // If any high significance change, consider it significant
  if (significantChanges.some(c => c.significance === 'high')) {
    return true;
  }

  // Calculate percentage of fields changed
  const totalFields = new Set(changes.map(c => c.field.split('.')[0])).size;
  const changedPercentage = changes.length / Math.max(totalFields, 1);

  return changedPercentage > CHANGE_THRESHOLD;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Change Detection Function
// ═══════════════════════════════════════════════════════════════════════════

export function detectDataChanges(
  entityName: string,
  newData: CollectedData
): ChangeDetectionResult {
  const versions = loadVersionHistory(entityName);
  const newDataHash = calculateHash(newData);

  // If no previous versions, this is new data
  if (versions.length === 0) {
    const newVersion: DataVersion = {
      entityName,
      versionId: `v1_${Date.now()}`,
      collectedAt: new Date().toISOString(),
      dataHash: newDataHash,
      changes: [],
      isSignificantChange: true,
    };

    saveVersionHistory(entityName, [newVersion]);

    return {
      hasChanges: true,
      isSignificant: true,
      changes: [{ 
        field: 'entity', 
        oldValue: null, 
        newValue: entityName, 
        changeType: 'added',
        significance: 'high',
      }],
      previousVersion: undefined,
      shouldUpdate: true,
    };
  }

  const latestVersion = versions[versions.length - 1];

  // If hash is same, no changes
  if (latestVersion.dataHash === newDataHash) {
    return {
      hasChanges: false,
      isSignificant: false,
      changes: [],
      previousVersion: latestVersion,
      shouldUpdate: false,
    };
  }

  // Detect changes (we need to store full data to compare, but for now we'll do shallow comparison)
  // In production, you'd store the previous data snapshot
  const changes: DataChange[] = [
    {
      field: 'data',
      oldValue: 'previous version',
      newValue: 'new version',
      changeType: 'modified',
      significance: 'high',
    },
  ];

  const significant = isSignificantChange(changes);

  // Create new version
  const newVersion: DataVersion = {
    entityName,
    versionId: `v${versions.length + 1}_${Date.now()}`,
    collectedAt: new Date().toISOString(),
    dataHash: newDataHash,
    changes,
    isSignificantChange: significant,
  };

  versions.push(newVersion);
  saveVersionHistory(entityName, versions);

  return {
    hasChanges: true,
    isSignificant: significant,
    changes,
    previousVersion: latestVersion,
    shouldUpdate: significant || versions.length === 1,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Should Check for Updates?
// ═══════════════════════════════════════════════════════════════════════════

export function shouldCheckForUpdates(entityName: string, checkIntervalHours: number = 24): boolean {
  const versions = loadVersionHistory(entityName);
  
  if (versions.length === 0) {
    return true; // Never checked, should check now
  }

  const lastVersion = versions[versions.length - 1];
  const lastCheck = new Date(lastVersion.collectedAt);
  const now = new Date();
  const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastCheck >= checkIntervalHours;
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Last Check Time
// ═══════════════════════════════════════════════════════════════════════════

export function getLastCheckTime(entityName: string): Date | null {
  const versions = loadVersionHistory(entityName);
  
  if (versions.length === 0) {
    return null;
  }

  return new Date(versions[versions.length - 1].collectedAt);
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Change Statistics
// ═══════════════════════════════════════════════════════════════════════════

export function getChangeStats(entityName: string): {
  totalVersions: number;
  lastCheck: Date | null;
  significantChanges: number;
  averageChangesPerVersion: number;
} {
  const versions = loadVersionHistory(entityName);

  const significantChanges = versions.filter(v => v.isSignificantChange).length;
  const totalChanges = versions.reduce((sum, v) => sum + v.changes.length, 0);
  const averageChanges = versions.length > 0 ? totalChanges / versions.length : 0;

  return {
    totalVersions: versions.length,
    lastCheck: versions.length > 0 ? new Date(versions[versions.length - 1].collectedAt) : null,
    significantChanges,
    averageChangesPerVersion: Math.round(averageChanges * 10) / 10,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Cleanup Old Versions
// ═══════════════════════════════════════════════════════════════════════════

export function cleanupOldVersions(maxAgeDays: number = 30): void {
  ensureVersionsDir();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

  try {
    const files = fs.readdirSync(VERSIONS_DIR);
    let cleanedCount = 0;

    for (const file of files) {
      if (!file.endsWith('_versions.json')) continue;

      const filePath = path.join(VERSIONS_DIR, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }

    console.log(`[ChangeDetector] Cleaned up ${cleanedCount} old version files`);
  } catch (error: any) {
    console.error('[ChangeDetector] Cleanup error:', error.message);
  }
}
