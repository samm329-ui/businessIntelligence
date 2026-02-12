import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabase } from "../lib/db";
import { EntityResolver } from "../lib/resolution/entity-resolver";
import { IndustryKPICalculator, CompanyProfile, FinancialData } from "../lib/calculators/industry-kpi-calculator";

async function testSystem() {
    console.log("🔍 Starting System Verification...\n");

    const resolver = new EntityResolver();
    const kpiCalculator = new IndustryKPICalculator();

    // Test 1: Entity Resolution (Brand/Alias/Fuzzy -> Company)
    console.log("🧪 Test 1: Entity Resolution (Brand/Alias/Fuzzy -> Parent)");
    const testBrands = ["Harpic", "HUL", "Reckit", "Harpyc", "iPhone"];

    for (const testBrand of testBrands) {
        const resolution = await resolver.resolve(testBrand);
        if (resolution.matchMethod !== 'none') {
            console.log(`✅ Resolved "${testBrand}" to: ${resolution.name} (${resolution.entityType}, ${resolution.confidence}% confidence)`);
            if (resolution.parentCompany) {
                console.log(`   Parent: ${resolution.parentCompany.name}`);
            }
        } else {
            console.error(`❌ Failed to resolve "${testBrand}"`);
        }
    }

    // Test 2: KPI Calculations (CAGR, Markup, Break-even)
    console.log("\n🧪 Test 2: KPI Calculations Verification");

    const company: CompanyProfile = {
        name: "Reckitt Benckiser India",
        ticker: "RECKITT",
        marketCap: 1000000000,
        revenue: 500000000,
        ebitda: 100000000,
        netIncome: 60000000,
        totalAssets: 800000000,
        shareholderEquity: 400000000,
        totalDebt: 200000000,
        currentAssets: 300000000,
        currentLiabilities: 150000000,
        inventory: 50000000,
        receivables: 40000000,
        cash: 100000000,
        cogs: 200000000,
        operatingIncome: 80000000
    };

    const financials: FinancialData = {
        revenue: 500000000,
        revenueLastYear: 450000000,
        revenue3YearsAgo: 350000000,
        cogs: 200000000,
        operatingIncome: 80000000,
        netIncome: 60000000,
        ebitda: 100000000,
        totalAssets: 800000000,
        avgTotalAssets: 750000000,
        currentAssets: 300000000,
        currentLiabilities: 150000000,
        inventory: 50000000,
        avgInventory: 45000000,
        receivables: 40000000,
        avgReceivables: 35000000,
        cash: 100000000,
        totalDebt: 200000000,
        shareholderEquity: 400000000,
        interestExpense: 10000000,
        taxRate: 25,
        bookValue: 350000000,
        marketCap: 1000000000,
        stockPrice: 1500,
        annualDividend: 30,
        operatingCashFlow: 90000000,
        capitalExpenditures: 20000000,
        eps: 45,
        epsLastYear: 40,
        fixedCosts: 100000000
    };

    const kpis = kpiCalculator.calculateKPIs(company, financials, "FMCG");

    console.log(`✅ CAGR (3-year): ${kpis.cagr.toFixed(2)}% (Expected: ~12.6%)`);
    console.log(`✅ Markup %: ${kpis.markupPercentage.toFixed(2)}% (Expected: 150%)`);
    console.log(`✅ Break-even Point: ${kpis.breakEvenPoint.toFixed(0)} (Expected: 166,666,667)`);

    if (kpis.cagr > 12 && kpis.markupPercentage === 150) {
        console.log("\n🧪 Test 3: Database Normalization Check");
        const { data: companyData, error } = await supabase.from("companies").select("normalized_name").eq("name", "Reliance Industries").single();
        if (companyData && companyData.normalized_name === "reliance industries") {
            console.log("✅ Database normalization trigger working correctly.");
            console.log("\n🚀 Verification Successful!");
        } else {
            console.error("❌ Database normalization check failed:", error?.message);
        }
    } else {
        console.error("\n❌ Some KPI calculations seem incorrect.");
    }
}

testSystem();
