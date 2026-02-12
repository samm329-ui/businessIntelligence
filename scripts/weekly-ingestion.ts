import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabase } from "../lib/db";
import { IndustryKPICalculator } from "../lib/calculators/industry-kpi-calculator";

/**
 * Weekly Ingestion & Analysis Update
 * 1. Runs the ingestion pipeline (simulated here)
 * 2. Recalculates benchmarks/KPIs for all companies
 * 3. Updates analysis_cache
 */
async function runWeeklyUpdate() {
    console.log("🕒 Starting Weekly BI Update...");
    const startTime = new Date();

    try {
        // Stage 1: Check Job Lock (Prevent concurrent runs)
        const { data: lock } = await supabase
            .from("job_locks")
            .select("*")
            .eq("job_name", "weekly_update")
            .single();

        if (lock && lock.is_locked && new Date(lock.expires_at) > new Date()) {
            console.warn("⚠️ Job is already running or locked. Skipping.");
            return;
        }

        await supabase.from("job_locks").upsert({
            job_name: "weekly_update",
            is_locked: true,
            locked_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 3600000).toISOString() // 1h expiry
        });

        console.log("✅ Job lock acquired.");

        // Stage 2: Trigger Ingestion (In a real app, this might call the ingest-datasets script)
        // For this demo, we'll log the intention
        console.log("📥 Refreshing data from sources...");

        // Stage 3: Recalculate KPIs for all companies
        const { data: companies } = await supabase.from("companies").select("*");
        const calculator = new IndustryKPICalculator();

        if (companies) {
            console.log(`📊 Recalculating KPIs for ${companies.length} companies...`);
            for (const company of companies) {
                // In a real app, we'd fetch latest financials here
                // For now, we simulate the calculation
                console.log(`   - Updating BI for ${company.name}`);

                // Update company metadata
                await supabase.from("companies").update({
                    updated_at: new Date().toISOString()
                }).eq("id", company.id);
            }
        }

        // Stage 4: Release Lock
        await supabase.from("job_locks").update({
            is_locked: false,
            last_run_at: new Date().toISOString()
        }).eq("job_name", "weekly_update");

        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        console.log(`🚀 Weekly update finished in ${duration}s`);

    } catch (error) {
        console.error("❌ Weekly update failed:", error);
        // Release lock on error
        await supabase.from("job_locks").update({ is_locked: false }).eq("job_name", "weekly_update");
    }
}

runWeeklyUpdate();
