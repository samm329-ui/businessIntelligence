import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { supabase } from "../lib/db";

// Configuration
const PROJECT_ROOT = "d:/ProjectEBITA";
const BATCH_SIZE = 500;

// Indicator Code Mappings
const INDICATOR_MAPPINGS: Record<string, string> = {
    // World Bank
    "NV.IND.TOTL.ZS": "INDUSTRY_GDP_PCT",
    // IMF
    "Exports of goods, Price deflator": "EXPORT_PRICE_DEFLATOR",
    "Import price index": "IMPORT_PRICE_INDEX",
    "Exports of goods, Volume index": "EXPORT_VOLUME_INDEX",
    // UNCTAD
    "International exports in digitally-deliverable services, value in current prices": "DIGITAL_SERVICES_EXPORTS_USD",
    "International imports in digitally-deliverable services, value in current prices": "DIGITAL_SERVICES_IMPORTS_USD",
};

/**
 * Fetch Data Source IDs from the database
 */
async function getDataSourceIds(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from("data_sources").select("id, name");
    if (error) throw error;

    const sources: Record<string, string> = {};
    data.forEach(s => {
        sources[s.name] = s.id;
    });
    return sources;
}

/**
 * Batch Upsert function
 */
async function batchUpsert(table: string, items: any[]) {
    if (items.length === 0) return;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'country_code, indicator_code, year, period' });
        if (error) {
            console.error(`[Upsert Error] ${table}:`, error.message);
            // Log sample item
            console.error("Sample item:", JSON.stringify(chunk[0]));
        }
    }
}

/**
 * Process World Bank CSV (Wide Format)
 */
async function processWorldBank(filePath: string, sourceId: string) {
    console.log(`[WB] Processing ${path.basename(filePath)}...`);
    const rows: any[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv({ skipLines: 4 }))
            .on("data", (data) => rows.push(data))
            .on("end", async () => {
                console.log(`[WB] Read ${rows.length} rows. Preparing batch...`);
                const items: any[] = [];
                for (const row of rows) {
                    const countryName = row["Country Name"];
                    const countryCode = row["Country Code"];
                    const indicatorName = row["Indicator Name"];
                    const indicatorCode = row["Indicator Code"];
                    const internalIndicatorCode = INDICATOR_MAPPINGS[indicatorCode] || indicatorCode;

                    const yearColumns = Object.keys(row).filter(key => /^\d{4}$/.test(key));

                    for (const year of yearColumns) {
                        const value = parseFloat(row[year]);
                        if (!isNaN(value)) {
                            items.push({
                                country_name: countryName,
                                country_code: countryCode,
                                indicator_name: indicatorName,
                                indicator_code: internalIndicatorCode,
                                year: parseInt(year),
                                value: value,
                                unit: "% of GDP",
                                source_id: sourceId
                            });
                        }
                    }
                }
                console.log(`[WB] Upserting ${items.length} records...`);
                await batchUpsert("macro_metrics", items);
                resolve(true);
            })
            .on("error", reject);
    });
}

/**
 * Process IMF CSV (Wide Format)
 */
async function processIMF(filePath: string, sourceId: string) {
    console.log(`[IMF] Processing ${path.basename(filePath)}...`);
    const rows: any[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => rows.push(data))
            .on("end", async () => {
                console.log(`[IMF] Read ${rows.length} rows. Preparing batch...`);
                const items: any[] = [];
                for (const row of rows) {
                    const countryName = row["COUNTRY"];
                    const indicatorName = row["SERIES_NAME"] || row["INDICATOR"];
                    const internalIndicatorCode = INDICATOR_MAPPINGS[indicatorName] || "IMF_GENERAL";

                    const yearColumns = Object.keys(row).filter(key => /^\d{4}$/.test(key));
                    const seriesParts = row["SERIES_CODE"]?.split(".");
                    const countryCode = seriesParts ? seriesParts[0] : "UNK";

                    for (const year of yearColumns) {
                        const value = parseFloat(row[year]);
                        if (!isNaN(value)) {
                            items.push({
                                country_name: countryName,
                                country_code: countryCode,
                                indicator_name: indicatorName,
                                indicator_code: internalIndicatorCode,
                                year: parseInt(year),
                                value: value,
                                unit: row["UNIT"] || "Index",
                                source_id: sourceId
                            });
                        }
                    }
                }
                console.log(`[IMF] Upserting ${items.length} records...`);
                await batchUpsert("macro_metrics", items);
                resolve(true);
            })
            .on("error", reject);
    });
}

/**
 * Process UNCTAD CSV (Long Format)
 */
async function processUNCTAD(filePath: string, sourceId: string) {
    console.log(`[UNCTAD] Processing ${path.basename(filePath)}...`);
    const rows: any[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => rows.push(data))
            .on("end", async () => {
                console.log(`[UNCTAD] Read ${rows.length} rows. Preparing batch...`);
                const items: any[] = [];
                for (const row of rows) {
                    const countryName = row["REF_AREA_LABEL"];
                    const countryCode = row["REF_AREA"];
                    const indicatorLabel = row["INDICATOR_LABEL"];
                    const internalIndicatorCode = INDICATOR_MAPPINGS[indicatorLabel] || "UNCTAD_DIGITAL";
                    const year = row["TIME_PERIOD"];
                    const value = parseFloat(row["OBS_VALUE"]);

                    if (!isNaN(value)) {
                        items.push({
                            country_name: countryName,
                            country_code: countryCode,
                            indicator_name: indicatorLabel,
                            indicator_code: internalIndicatorCode,
                            year: parseInt(year),
                            value: value,
                            unit: row["UNIT_MEASURE_LABEL"] || "USD Millions",
                            source_id: sourceId
                        });
                    }
                }
                console.log(`[UNCTAD] Upserting ${items.length} records...`);
                await batchUpsert("macro_metrics", items);
                resolve(true);
            })
            .on("error", reject);
    });
}

/**
 * Main Run Function
 */
async function run() {
    try {
        const sources = await getDataSourceIds();
        console.log("Found Data Sources:", Object.keys(sources));

        // 1. World Bank
        const wbFile = path.join(PROJECT_ROOT, "API_NV.IND.TOTL.ZS_DS2_en_csv_v2_88.csv");
        if (fs.existsSync(wbFile)) {
            await processWorldBank(wbFile, sources["World Bank Open Data"] || sources["World Bank"]);
        }

        // 2. IMF
        const imfFile = path.join(PROJECT_ROOT, "dataset_2026-02-12T10_08_35.668102759Z_DEFAULT_INTEGRATION_IMF.STA_ITG_4.0.0.csv");
        if (fs.existsSync(imfFile)) {
            await processIMF(imfFile, sources["IMF"]);
        }

        // 3. UNCTAD
        const unctadFile = path.join(PROJECT_ROOT, "UNCTAD_DE_DIG_SERVTRADE_ANN_EXP.csv");
        if (fs.existsSync(unctadFile)) {
            await processUNCTAD(unctadFile, sources["UNCTAD"]);
        }

        console.log("🚀 Dataset Ingestion Completed Successfully");
    } catch (err) {
        console.error("❌ Ingestion Failed:", err);
    }
}

run();
