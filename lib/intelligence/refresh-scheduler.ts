/**
 * Automated Data Refresh Scheduler
 * 
 * FIX 5: Add Automated Data Refresh Jobs
 * - Daily: Top industries, Top companies, Trending sectors
 * - Benefits: Faster responses, Better accuracy, Less API load
 */

import { runCollector } from './bot-collector';
import * as fs from 'fs';
import * as path from 'path';

export interface RefreshJob {
  id: string;
  name: string;
  target: string;
  type: 'industry' | 'company';
  lastRun?: string;
  lastStatus?: 'success' | 'failed' | 'skipped';
  lastDuration?: number;
}

export interface SchedulerConfig {
  enabled: boolean;
  intervalHours: number;
  topIndustries: string[];
  topCompanies: string[];
}

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: false, // Disabled by default, enable via API
  intervalHours: 24,
  topIndustries: [
    'Automotive',
    'Pharmaceuticals',
    'IT Services',
    'Banking',
    'FMCG',
    'Steel',
    'Telecom',
    'Power',
    'Oil & Gas',
    'Real Estate',
  ],
  topCompanies: [
    'Tata Motors',
    'Mahindra & Maruti',
    'Reliance Industries',
    'TCS',
    'HDFC Bank',
    'ICICI Bank',
    'Infosys',
    'Hindustan Unilever',
    'ITC',
    'Asian Paints',
  ],
};

const SCHEDULER_STATE_FILE = path.join(process.cwd(), 'data', 'scheduler-state.json');

class RefreshScheduler {
  private config: SchedulerConfig;
  private jobs: Map<string, RefreshJob> = new Map();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.loadJobs();
  }

  private loadConfig(): SchedulerConfig {
    const configPath = path.join(process.cwd(), 'data', 'scheduler-config.json');
    try {
      if (fs.existsSync(configPath)) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) };
      }
    } catch (e) {
      console.warn('[Scheduler] Failed to load config, using defaults');
    }
    return DEFAULT_CONFIG;
  }

  private loadJobs(): void {
    try {
      if (fs.existsSync(SCHEDULER_STATE_FILE)) {
        const state = JSON.parse(fs.readFileSync(SCHEDULER_STATE_FILE, 'utf-8'));
        for (const job of state.jobs || []) {
          this.jobs.set(job.id, job);
        }
      }
    } catch (e) {
      console.warn('[Scheduler] Failed to load job state');
    }

    // Initialize missing jobs
    for (const industry of this.config.topIndustries) {
      const id = `industry-${industry.toLowerCase().replace(/\s+/g, '-')}`;
      if (!this.jobs.has(id)) {
        this.jobs.set(id, {
          id,
          name: `Industry: ${industry}`,
          target: industry,
          type: 'industry',
        });
      }
    }

    for (const company of this.config.topCompanies) {
      const id = `company-${company.toLowerCase().replace(/\s+/g, '-')}`;
      if (!this.jobs.has(id)) {
        this.jobs.set(id, {
          id,
          name: `Company: ${company}`,
          target: company,
          type: 'company',
        });
      }
    }
  }

  private saveJobs(): void {
    const dir = path.dirname(SCHEDULER_STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SCHEDULER_STATE_FILE, JSON.stringify({
      jobs: Array.from(this.jobs.values()),
      lastUpdate: new Date().toISOString(),
    }, null, 2));
  }

  async runJob(job: RefreshJob): Promise<{ success: boolean; duration: number; error?: string }> {
    const startTime = Date.now();
    console.log(`[Scheduler] Running job: ${job.name}`);

    try {
      // Run collector to refresh data (without full analysis)
      await runCollector(job.target);
      
      const duration = Date.now() - startTime;
      console.log(`[Scheduler] Job ${job.name} completed in ${duration}ms`);
      
      return { success: true, duration };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[Scheduler] Job ${job.name} failed:`, error.message);
      return { success: false, duration, error: error.message };
    }
  }

  async runAllJobs(): Promise<void> {
    console.log(`[Scheduler] Starting batch refresh of ${this.jobs.size} jobs`);
    
    const results: { job: RefreshJob; result: { success: boolean; duration: number } }[] = [];
    
    for (const [_, job] of this.jobs) {
      const result = await this.runJob(job);
      results.push({ job, result: { ...result, success: result.success, duration: result.duration } });
      
      job.lastRun = new Date().toISOString();
      job.lastStatus = result.success ? 'success' : 'failed';
      job.lastDuration = result.duration;
      
      // Save after each job
      this.saveJobs();
      
      // Rate limiting - wait between jobs
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const successCount = results.filter(r => r.result.success).length;
    console.log(`[Scheduler] Batch complete: ${successCount}/${results.length} jobs succeeded`);
  }

  start(intervalHours?: number): void {
    if (this.timer) {
      console.log('[Scheduler] Already running');
      return;
    }

    const hours = intervalHours ?? this.config.intervalHours;
    const ms = hours * 60 * 60 * 1000;
    
    console.log(`[Scheduler] Starting with ${hours}h interval`);
    
    // Run immediately on start
    this.runAllJobs().catch(console.error);
    
    // Schedule recurring runs
    this.timer = setInterval(() => {
      this.runAllJobs().catch(console.error);
    }, ms);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Scheduler] Stopped');
    }
  }

  getStatus(): { running: boolean; jobs: RefreshJob[]; config: SchedulerConfig } {
    return {
      running: this.timer !== null,
      jobs: Array.from(this.jobs.values()),
      config: this.config,
    };
  }

  async refreshNow(target: string): Promise<{ success: boolean; message: string }> {
    const job = Array.from(this.jobs.values()).find(j => j.target.toLowerCase() === target.toLowerCase());
    
    if (!job) {
      return { success: false, message: `No job found for: ${target}` };
    }

    const result = await this.runJob(job);
    job.lastRun = new Date().toISOString();
    job.lastStatus = result.success ? 'success' : 'failed';
    job.lastDuration = result.duration;
    this.saveJobs();

    return {
      success: result.success,
      message: result.success ? `Refreshed in ${result.duration}ms` : `Failed: ${result.error}`,
    };
  }
}

let schedulerInstance: RefreshScheduler | null = null;

export function getScheduler(): RefreshScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new RefreshScheduler();
  }
  return schedulerInstance;
}

export function startScheduler(intervalHours?: number): void {
  getScheduler().start(intervalHours);
}

export function stopScheduler(): void {
  getScheduler().stop();
}

export function getSchedulerStatus() {
  return getScheduler().getStatus();
}
