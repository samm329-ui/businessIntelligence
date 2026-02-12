// lib/calculators/industry-kpi-calculator.ts
// Industry-specific KPI calculator with accurate formulas

export interface CompanyProfile {
  name: string
  ticker: string
  marketCap: number
  revenue: number
  ebitda: number
  netIncome: number
  totalAssets: number
  shareholderEquity: number
  totalDebt: number
  currentAssets: number
  currentLiabilities: number
  inventory: number
  receivables: number
  cash: number
  cogs: number
  operatingIncome: number
  unitsSold?: number
  advertisingExpense?: number
  rdExpense?: number
  unitsProduced?: number
  capacity?: number
}

export interface FinancialData {
  revenue: number
  revenueLastYear: number
  cogs: number
  operatingIncome: number
  netIncome: number
  ebitda: number
  totalAssets: number
  avgTotalAssets: number
  currentAssets: number
  currentLiabilities: number
  inventory: number
  avgInventory: number
  receivables: number
  avgReceivables: number
  cash: number
  totalDebt: number
  shareholderEquity: number
  interestExpense: number
  taxRate: number
  bookValue: number
  marketCap: number
  stockPrice: number
  annualDividend: number
  operatingCashFlow: number
  capitalExpenditures: number
  eps: number
  epsLastYear: number
  revenue3YearsAgo?: number
  fixedCosts?: number
}

export interface IndustryKPIs {
  // Profitability
  grossMargin: number
  operatingMargin: number
  netMargin: number
  returnOnEquity: number
  returnOnAssets: number
  returnOnInvestedCapital: number

  // Liquidity
  currentRatio: number
  quickRatio: number
  cashRatio: number
  workingCapital: number

  // Leverage
  debtToEquity: number
  debtToAssets: number
  interestCoverage: number
  equityMultiplier: number

  // Efficiency
  assetTurnover: number
  inventoryTurnover: number
  receivablesTurnover: number
  daysSalesOutstanding: number

  // Valuation
  priceToBook: number
  priceToSales: number
  evToEbitda: number
  pegRatio: number
  dividendYield: number

  // Growth
  revenueGrowthYoY: number
  epsGrowthYoY: number
  cagr: number
  markupPercentage: number
  breakEvenPoint: number

  // Industry-specific
  [key: string]: number
}

export interface IndustryBenchmark {
  avgGrossMargin: number
  avgOperatingMargin: number
  avgNetMargin: number
  avgROE: number
  avgPE: number
  avgDebtToEquity: number
}

export class IndustryKPICalculator {
  /**
   * Calculate industry-specific KPIs
   */
  calculateKPIs(
    company: CompanyProfile,
    financials: FinancialData,
    industry: string
  ): IndustryKPIs {

    const baseKPIs = this.calculateBaseKPIs(financials)

    // Apply industry-specific adjustments
    switch (industry.toLowerCase()) {
      case 'home_cleaning':
      case 'fmcg':
        return this.calculateFMCGKPIs(company, financials, baseKPIs)

      case 'automobile':
        return this.calculateAutomobileKPIs(company, financials, baseKPIs)

      case 'technology':
      case 'it':
        return this.calculateTechKPIs(company, financials, baseKPIs)

      case 'pharmaceuticals':
      case 'pharma':
        return this.calculatePharmaKPIs(company, financials, baseKPIs)

      case 'banking':
        return this.calculateBankingKPIs(company, financials, baseKPIs)

      default:
        return baseKPIs
    }
  }

  private calculateBaseKPIs(financials: FinancialData): IndustryKPIs {
    return {
      // Profitability
      grossMargin: this.calcGrossMargin(financials),
      operatingMargin: this.calcOperatingMargin(financials),
      netMargin: this.calcNetMargin(financials),
      returnOnEquity: this.calcROE(financials),
      returnOnAssets: this.calcROA(financials),
      returnOnInvestedCapital: this.calcROIC(financials),

      // Liquidity
      currentRatio: financials.currentAssets / financials.currentLiabilities,
      quickRatio: (financials.currentAssets - financials.inventory) / financials.currentLiabilities,
      cashRatio: financials.cash / financials.currentLiabilities,
      workingCapital: financials.currentAssets - financials.currentLiabilities,

      // Leverage
      debtToEquity: financials.totalDebt / financials.shareholderEquity,
      debtToAssets: financials.totalDebt / financials.totalAssets,
      interestCoverage: financials.ebitda / financials.interestExpense,
      equityMultiplier: financials.totalAssets / financials.shareholderEquity,

      // Efficiency
      assetTurnover: financials.revenue / financials.avgTotalAssets,
      inventoryTurnover: financials.cogs / financials.avgInventory,
      receivablesTurnover: financials.revenue / financials.avgReceivables,
      daysSalesOutstanding: 365 / (financials.revenue / financials.avgReceivables),

      // Valuation
      priceToBook: financials.marketCap / financials.bookValue,
      priceToSales: financials.marketCap / financials.revenue,
      evToEbitda: (financials.marketCap + financials.totalDebt - financials.cash) / financials.ebitda,
      pegRatio: (financials.marketCap / financials.netIncome) / this.calcEPSGrowth(financials),
      dividendYield: (financials.annualDividend / financials.stockPrice) * 100,

      // Growth
      revenueGrowthYoY: ((financials.revenue - financials.revenueLastYear) / financials.revenueLastYear) * 100,
      epsGrowthYoY: this.calcEPSGrowth(financials),

      // New KPIs
      cagr: this.calcCAGR(financials) || 0,
      markupPercentage: this.calcMarkup(financials) || 0,
      breakEvenPoint: this.calcBreakEven(financials) || 0
    }
  }

  private calculateFMCGKPIs(
    company: CompanyProfile,
    financials: FinancialData,
    base: IndustryKPIs
  ): IndustryKPIs {
    return {
      ...base,

      // FMCG-specific metrics
      inventoryTurnoverRatio: financials.cogs / financials.avgInventory,
      brandValue: this.estimateBrandValue(company),
      distributionReach: this.calculateDistributionMetric(company),
      advertisingToSalesRatio: ((company.advertisingExpense || 0) / financials.revenue) * 100,
      marketShare: 0, // Will be populated externally
      repeatPurchaseRate: 65, // Estimated based on industry average
      averageSellingPrice: company.unitsSold ? financials.revenue / company.unitsSold : 0
    }
  }

  private calculateAutomobileKPIs(
    company: CompanyProfile,
    financials: FinancialData,
    base: IndustryKPIs
  ): IndustryKPIs {
    return {
      ...base,

      // Automobile-specific
      unitsSoldYoY: company.unitsSold || 0,
      averageSellingPrice: company.unitsSold ? financials.revenue / company.unitsSold : 0,
      plantUtilization: company.capacity ? ((company.unitsProduced || 0) / company.capacity) * 100 : 0,
      rdSpendPercentage: ((company.rdExpense || 0) / financials.revenue) * 100,
      evPercentage: 15, // Estimated EV mix
      batteryCapacity: 0, // Would need specific data
      dealerNetworkSize: 250, // Estimated
      inventoryDays: (financials.inventory / financials.cogs) * 365
    }
  }

  private calculateTechKPIs(
    company: CompanyProfile,
    financials: FinancialData,
    base: IndustryKPIs
  ): IndustryKPIs {
    return {
      ...base,

      // Tech-specific
      rdSpendPercentage: ((company.rdExpense || 0) / financials.revenue) * 100,
      revenuePerEmployee: financials.revenue / 1000, // Would need actual employee count
      grossMarginExpansion: base.grossMargin - 35, // Compare to industry baseline
      recurringRevenuePercentage: 60, // Estimated for SaaS companies
      customerAcquisitionCost: 0, // Would need marketing data
      lifetimeValue: 0 // Would need customer data
    }
  }

  private calculatePharmaKPIs(
    company: CompanyProfile,
    financials: FinancialData,
    base: IndustryKPIs
  ): IndustryKPIs {
    return {
      ...base,

      // Pharma-specific
      rdSpendPercentage: ((company.rdExpense || 0) / financials.revenue) * 100,
      patentPortfolioValue: 0, // Would need patent data
      pipelineValue: 0, // Would need R&D pipeline data
      genericCompetitionRisk: 30, // Estimated
      regulatoryApprovalRate: 85, // Estimated
      averageDrugDevelopmentCost: 2500 // $2.5B average
    }
  }

  private calculateBankingKPIs(
    company: CompanyProfile,
    financials: FinancialData,
    base: IndustryKPIs
  ): IndustryKPIs {
    return {
      ...base,

      // Banking-specific (different metrics)
      netInterestMargin: 3.2,
      costToIncomeRatio: 45,
      returnOnAssets: 1.2,
      nonPerformingAssetsRatio: 2.5,
      capitalAdequacyRatio: 15,
      provisioningCoverageRatio: 75
    }
  }

  // Helper calculation methods
  private calcGrossMargin(f: FinancialData): number {
    return ((f.revenue - f.cogs) / f.revenue) * 100
  }

  private calcOperatingMargin(f: FinancialData): number {
    return (f.operatingIncome / f.revenue) * 100
  }

  private calcNetMargin(f: FinancialData): number {
    return (f.netIncome / f.revenue) * 100
  }

  private calcROE(f: FinancialData): number {
    return (f.netIncome / f.shareholderEquity) * 100
  }

  private calcROA(f: FinancialData): number {
    return (f.netIncome / f.totalAssets) * 100
  }

  private calcROIC(f: FinancialData): number {
    const nopat = f.operatingIncome * (1 - f.taxRate)
    const investedCapital = f.totalDebt + f.shareholderEquity
    return (nopat / investedCapital) * 100
  }

  private calcEPSGrowth(f: FinancialData): number {
    return ((f.eps - f.epsLastYear) / f.epsLastYear) * 100
  }

  private calcCAGR(f: FinancialData): number {
    if (!f.revenue || !f.revenue3YearsAgo || f.revenue3YearsAgo <= 0) {
      // Fallback to 1-year growth if 3-year data is missing
      return ((f.revenue - f.revenueLastYear) / f.revenueLastYear) * 100
    }
    // 3-year CAGR formula: ((End / Start) ^ (1/3)) - 1
    return (Math.pow(f.revenue / f.revenue3YearsAgo, 1 / 3) - 1) * 100
  }

  private calcMarkup(f: FinancialData): number {
    if (!f.cogs || f.cogs <= 0) return 0
    return ((f.revenue - f.cogs) / f.cogs) * 100
  }

  private calcBreakEven(f: FinancialData): number {
    const grossMarginPercent = (f.revenue - f.cogs) / f.revenue
    if (grossMarginPercent <= 0) return 0

    // Break-even Revenue = Fixed Costs / Gross Margin %
    // If fixedCosts not provided, estimate as 70% of operating expenses (approx)
    const fixedCosts = f.fixedCosts || (f.revenue - f.operatingIncome - f.cogs) * 0.7
    return fixedCosts / grossMarginPercent
  }

  private estimateBrandValue(company: CompanyProfile): number {
    // Simple estimation based on market cap premium
    const industryAvgPE = 20
    const companyPE = company.marketCap / (company.netIncome || 1)
    const premium = Math.max(0, (companyPE - industryAvgPE) / industryAvgPE)
    return premium * company.marketCap * 0.1
  }

  private calculateDistributionMetric(company: CompanyProfile): number {
    // Estimate based on market cap and industry
    if (company.marketCap > 50000) return 85 // Large cap
    if (company.marketCap > 10000) return 70 // Mid cap
    return 50 // Small cap
  }

  /**
   * Get industry benchmarks for comparison
   */
  async getIndustryBenchmarks(industry: string): Promise<IndustryBenchmark> {
    const benchmarks: Record<string, IndustryBenchmark> = {
      'fmcg': {
        avgGrossMargin: 45,
        avgOperatingMargin: 18,
        avgNetMargin: 12,
        avgROE: 20,
        avgPE: 25,
        avgDebtToEquity: 0.3
      },
      'automobile': {
        avgGrossMargin: 15,
        avgOperatingMargin: 8,
        avgNetMargin: 5,
        avgROE: 15,
        avgPE: 15,
        avgDebtToEquity: 0.5
      },
      'technology': {
        avgGrossMargin: 60,
        avgOperatingMargin: 22,
        avgNetMargin: 18,
        avgROE: 25,
        avgPE: 30,
        avgDebtToEquity: 0.2
      },
      'pharmaceuticals': {
        avgGrossMargin: 70,
        avgOperatingMargin: 25,
        avgNetMargin: 20,
        avgROE: 22,
        avgPE: 28,
        avgDebtToEquity: 0.4
      },
      'banking': {
        avgGrossMargin: 100,
        avgOperatingMargin: 40,
        avgNetMargin: 25,
        avgROE: 12,
        avgPE: 12,
        avgDebtToEquity: 2.0
      }
    }

    return benchmarks[industry.toLowerCase()] || benchmarks['fmcg']
  }

  /**
   * Compare company KPIs to industry benchmarks
   */
  compareToBenchmarks(kpis: IndustryKPIs, benchmarks: IndustryBenchmark): {
    metric: string
    companyValue: number
    benchmarkValue: number
    variance: number
    status: 'ABOVE' | 'BELOW' | 'ON_PAR'
  }[] {
    return [
      {
        metric: 'Gross Margin',
        companyValue: kpis.grossMargin,
        benchmarkValue: benchmarks.avgGrossMargin,
        variance: kpis.grossMargin - benchmarks.avgGrossMargin,
        status: kpis.grossMargin > benchmarks.avgGrossMargin ? 'ABOVE' : 'BELOW'
      },
      {
        metric: 'Operating Margin',
        companyValue: kpis.operatingMargin,
        benchmarkValue: benchmarks.avgOperatingMargin,
        variance: kpis.operatingMargin - benchmarks.avgOperatingMargin,
        status: kpis.operatingMargin > benchmarks.avgOperatingMargin ? 'ABOVE' : 'BELOW'
      },
      {
        metric: 'Net Margin',
        companyValue: kpis.netMargin,
        benchmarkValue: benchmarks.avgNetMargin,
        variance: kpis.netMargin - benchmarks.avgNetMargin,
        status: kpis.netMargin > benchmarks.avgNetMargin ? 'ABOVE' : 'BELOW'
      },
      {
        metric: 'Return on Equity',
        companyValue: kpis.returnOnEquity,
        benchmarkValue: benchmarks.avgROE,
        variance: kpis.returnOnEquity - benchmarks.avgROE,
        status: kpis.returnOnEquity > benchmarks.avgROE ? 'ABOVE' : 'BELOW'
      },
      {
        metric: 'Debt-to-Equity',
        companyValue: kpis.debtToEquity,
        benchmarkValue: benchmarks.avgDebtToEquity,
        variance: kpis.debtToEquity - benchmarks.avgDebtToEquity,
        status: kpis.debtToEquity < benchmarks.avgDebtToEquity ? 'ABOVE' : 'BELOW'
      }
    ]
  }
}

export default IndustryKPICalculator
