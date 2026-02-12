import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import axios from "axios";
import { supabase } from "../lib/db";
import { normalize } from "../lib/resolution/entity-resolver";

const DATASETS_DIR = path.join(process.cwd(), "datasets");

// Ensure datasets directory exists
if (!fs.existsSync(DATASETS_DIR)) {
    fs.mkdirSync(DATASETS_DIR);
}

/**
 * Log data lineage to prevent "hallucination claims"
 */
async function logLineage(entityType: string, entityId: string, source: string, rawData: any) {
    await supabase.from("data_lineage").insert({
        entity_type: entityType,
        entity_id: entityId,
        source_table: "companies", // Or appropriate table
        raw_value: JSON.stringify(rawData),
        confidence_score: 100,
        fetched_at: new Date().toISOString()
    });
}

/**
 * Step 1: Ingest Companies from CSV (e.g., OpenCorporates/Kaggle export)
 */
async function ingestCompaniesFromCSV(filename: string) {
    console.log(`[Ingestion] Starting company ingestion from ${filename}...`);
    const filePath = path.join(process.cwd(), filename);

    if (!fs.existsSync(filePath)) {
        console.warn(`[Ingestion] File ${filename} not found. Skipping.`);
        return;
    }

    const results: any[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", async () => {
                for (const row of results) {
                    const { company, industry, country } = row;
                    const normalized = normalize(company);

                    console.log(`[Ingestion] Processing ${company}...`);

                    const { data: upserted, error } = await supabase
                        .from("companies")
                        .upsert({
                            name: company,
                            normalized_name: normalized,
                            industry: industry,
                            country: country,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'name' })
                        .select()
                        .single();

                    if (error) {
                        console.error(`[Ingestion] Error upserting ${company}:`, error.message);
                    } else if (upserted) {
                        await logLineage("company", upserted.id, "local_csv", row);
                    }
                }
                console.log(`[Ingestion] Company ingestion completed.`);
                resolve(true);
            })
            .on("error", reject);
    });
}

/**
 * Step 2: Fetch Brand Data from Wikidata (Mocked/Simplified for this example)
 * In a real scenario, this would use the Wikidata SPARQL endpoint.
 */
async function ingestBrandsFromWikidata() {
    console.log(`[Ingestion] Starting brand ingestion...`);

    // Example data that would be fetched from Wikidata/Wikipedia
    const brandData = [
        { brand: "Harpic", parent: "Reckitt", category: "Home Care" },
        { brand: "Dettol", parent: "Reckitt", category: "Personal Care" },
        { brand: "Dove", parent: "Unilever", category: "Personal Care" },
        { brand: "Maggi", parent: "Nestle", category: "Food" },
        { brand: "Jio", parent: "Reliance Industries", category: "Telecom" }
    ];

    for (const item of brandData) {
        console.log(`[Ingestion] Mapping brand ${item.brand} to ${item.parent}...`);

        // Find parent company
        const { data: company } = await supabase
            .from("companies")
            .select("id")
            .ilike("name", `%${item.parent}%`)
            .limit(1)
            .single();

        if (!company) {
            console.warn(`[Ingestion] Parent company ${item.parent} not found for brand ${item.brand}`);
            continue;
        }

        const { data: brand, error } = await supabase
            .from("brands")
            .upsert({
                name: item.brand,
                normalized_name: normalize(item.brand),
                company_id: company.id,
                product_category: item.category,
                updated_at: new Date().toISOString()
            }, { onConflict: 'name, company_id' })
            .select()
            .single();

        if (error) {
            console.error(`[Ingestion] Error upserting brand ${item.brand}:`, error.message);
        } else if (brand) {
            await logLineage("brand", brand.id, "wikidata_mock", item);
        }
    }

    console.log(`[Ingestion] Brand ingestion completed.`);
}

/**
 * Main Run Function
 */
async function run() {
    try {
        // Ingest core companies
        await ingestCompaniesFromCSV("companies.csv");

        // Ingest brand mappings
        await ingestBrandsFromWikidata();

        console.log("🚀 Ingestion Pipeline Finished Successfully");
    } catch (error) {
        console.error("❌ Ingestion Pipeline Failed:", error);
    }
}

run();
