import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { supabase } from "../lib/db";
import { normalize } from "../lib/resolution/entity-resolver";

const DATASETS_DIR = path.join(process.cwd(), "datasets");

/**
 * Utility to read CSV
 */
async function readCSV(filename: string): Promise<any[]> {
    const filePath = path.join(DATASETS_DIR, filename);
    const results: any[] = [];
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return resolve([]);
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", reject);
    });
}

async function importMasterData() {
    console.log("🚀 Starting Master Data Import...");

    try {
        // 1. Import Industries
        console.log("📁 Importing Industries...");
        const industries = await readCSV("industries_master.csv");
        for (const ind of industries) {
            await supabase.from("industries").upsert({
                name: ind.industry_name,
                sector: ind.sector,
                description: ind.description
            }, { onConflict: "name" });
        }

        // 2. Import Companies
        console.log("📁 Importing Companies...");
        const companies = await readCSV("companies_master.csv");
        const companyMap = new Map<string, string>(); // temp_id -> uuid

        for (const comp of companies) {
            const { data, error } = await supabase.from("companies").upsert({
                name: comp.company_name,
                normalized_name: normalize(comp.company_name),
                industry: comp.industry,
                country: comp.country,
                updated_at: new Date().toISOString()
            }, { onConflict: "name" }).select("id").single();

            if (data) {
                companyMap.set(comp.company_id, data.id);
            } else if (error) {
                console.error(`Error importing company ${comp.company_name}:`, error.message);
            }
        }

        // 3. Import Brands
        console.log("📁 Importing Brands...");
        const brands = await readCSV("brands_master.csv");
        for (const brand of brands) {
            const companyId = companyMap.get(brand.company_id);
            if (!companyId) {
                console.warn(`Company ID ${brand.company_id} not found for brand ${brand.brand_name}`);
                continue;
            }

            await supabase.from("brands").upsert({
                name: brand.brand_name,
                normalized_name: normalize(brand.brand_name),
                company_id: companyId,
                product_category: brand.category,
                updated_at: new Date().toISOString()
            }, { onConflict: "name, company_id" });
        }

        // 4. Import Aliases (Add to company_aliases)
        console.log("📁 Importing Aliases...");
        const aliases = await readCSV("company_aliases_master.csv");
        for (const al of aliases) {
            const companyId = companyMap.get(al.company_id);
            if (!companyId) continue;

            await supabase.from("company_aliases").upsert({
                alias: al.alias,
                normalized_alias: normalize(al.alias),
                company_id: companyId,
                confidence_score: 100
            }, { onConflict: "alias, company_id" });

            // Also keep them in brands for general search compatibility
            await supabase.from("brands").upsert({
                name: al.alias,
                normalized_name: normalize(al.alias),
                company_id: companyId,
                product_category: "Company Alias",
                updated_at: new Date().toISOString()
            }, { onConflict: "name, company_id" });
        }

        // 5. Populate some sample financials for training
        console.log("📁 Seeding Sample Financials...");
        for (const [tempId, uuid] of companyMap.entries()) {
            await supabase.from("company_financials").upsert({
                company_id: uuid,
                revenue: Math.floor(Math.random() * 10000000000), // Mock data
                data_year: 2024,
                confidence_score: 95
            }, { onConflict: "company_id, data_year" });
        }

        console.log("✨ Master Data Import Finished Successfully!");
    } catch (error) {
        console.error("❌ Master Data Import Failed:", error);
    }
}

importMasterData();
