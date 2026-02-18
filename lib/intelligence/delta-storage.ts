/**
 * Delta Storage Model
 * 
 * FIX 7: Data Storage Strategy
 * - Store baseline data first
 * - Store deltas/changes only
 * - Saves database space massively
 */

export interface DeltaRecord {
  id: string;
  entityId: string;
  metricName: string;
  previousValue: number | null;
  newValue: number | null;
  changePercent: number;
  source: string;
  detectedAt: string;
}

export interface BaseData {
  entityId: string;
  entityName: string;
  lastUpdated: string;
  metrics: Record<string, number>;
  sources: string[];
}

export class DeltaStorage {
  private baseData: Map<string, BaseData> = new Map();
  private changeLog: DeltaRecord[] = [];
  private readonly MAX_DELTA_RECORDS = 10000;
  
  storeBaseData(entityId: string, entityName: string, metrics: Record<string, number>, sources: string[]): void {
    const baseData: BaseData = {
      entityId,
      entityName,
      lastUpdated: new Date().toISOString(),
      metrics: { ...metrics },
      sources: [...sources],
    };
    this.baseData.set(entityId, baseData);
    console.log(`[DeltaStorage] Stored base data for ${entityName}`);
  }
  
  checkForChanges(entityId: string, newMetrics: Record<string, number>, source: string): DeltaRecord[] {
    const baseData = this.baseData.get(entityId);
    const entityName = baseData?.entityName || entityId;
    
    if (!baseData) {
      console.log(`[DeltaStorage] No base data for ${entityId}, storing new baseline`);
      this.storeBaseData(entityId, entityName, newMetrics, [source]);
      return [];
    }
    
    const changes: DeltaRecord[] = [];
    
    for (const [metric, newValue] of Object.entries(newMetrics)) {
      const previousValue = baseData.metrics[metric];
      
      if (previousValue !== newValue) {
        const changePercent = previousValue 
          ? ((newValue - previousValue) / Math.abs(previousValue)) * 100 
          : 100;
        
        const delta: DeltaRecord = {
          id: `${entityId}-${metric}-${Date.now()}`,
          entityId,
          metricName: metric,
          previousValue,
          newValue,
          changePercent,
          source,
          detectedAt: new Date().toISOString(),
        };
        
        changes.push(delta);
        
        // Update base data
        baseData.metrics[metric] = newValue;
        if (!baseData.sources.includes(source)) {
          baseData.sources.push(source);
        }
      }
    }
    
    if (changes.length > 0) {
      this.changeLog.push(...changes);
      baseData.lastUpdated = new Date().toISOString();
      
      // Trim old delta records
      if (this.changeLog.length > this.MAX_DELTA_RECORDS) {
        this.changeLog = this.changeLog.slice(-this.MAX_DELTA_RECORDS);
      }
      
      console.log(`[DeltaStorage] Detected ${changes.length} changes for ${entityId}`);
    }
    
    return changes;
  }
  
  getBaseData(entityId: string): BaseData | undefined {
    return this.baseData.get(entityId);
  }
  
  getChangeLog(entityId?: string, limit: number = 100): DeltaRecord[] {
    let logs = entityId 
      ? this.changeLog.filter(r => r.entityId === entityId)
      : this.changeLog;
    
    return logs.slice(-limit);
  }
  
  getSignificantChanges(entityId: string, thresholdPercent: number = 10): DeltaRecord[] {
    return this.changeLog.filter(r => 
      r.entityId === entityId && 
      Math.abs(r.changePercent) >= thresholdPercent
    );
  }
  
  getStorageStats(): { baseRecords: number; deltaRecords: number; oldestDelta: string | null } {
    return {
      baseRecords: this.baseData.size,
      deltaRecords: this.changeLog.length,
      oldestDelta: this.changeLog.length > 0 ? this.changeLog[0].detectedAt : null,
    };
  }
  
  clear(): void {
    this.baseData.clear();
    this.changeLog = [];
    console.log('[DeltaStorage] Cleared all data');
  }
}

let deltaStorageInstance: DeltaStorage | null = null;

export function getDeltaStorage(): DeltaStorage {
  if (!deltaStorageInstance) {
    deltaStorageInstance = new DeltaStorage();
  }
  return deltaStorageInstance;
}
