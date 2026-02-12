// lib/calculators/advanced-metrics.ts
// Enhanced financial metrics calculator with 15+ additional KPIs

export interface RawFinancials {
  revenue: number
  revenueLastYear?: number
  cogs: number
  operatingIncome: number
  netIncome: number
  ebitda: number
  ebit: number
  marketCap: number
  stockPrice: number
  sharesOutstanding: number
  totalAssets: number
  avgTotalAssets?: number
  currentAssets: number
  currentLiabilities: number
  inventory: number
  cash: number
  totalDebt: number
  shareholderEquity: number
  interestExpense: number
  taxRate: number
  bookValue: number
  annualDividend: number
  operatingCashFlow: number
  capitalExpenditures: number
  eps: number
  epsLastYear?: number
  priceHistory?: number[]
  marketIndex?: number[]
  avgInventory?: number
  avgReceivables?: number
  receivables?: number
}

export interface EnhancedFinancialMetrics {
  // Profitability Metrics
  grossMargin: number
  operatingMargin: number
  netMargin: number
  returnOnEquity: number
  returnOnAssets: number
  returnOnInvestedCapital: number

  // Liquidity Metrics
  currentRatio: number
  quickRatio: number
  cashRatio: number
  workingCapital: number

  // Leverage Metrics
  debtToEquity: number
  debtToAssets: number
  interestCoverage: number
  equityMultiplier: number

  // Efficiency Metrics
  assetTurnover: number
  inventoryTurnover: number
  receivablesTurnover: number
  daysSalesOutstanding: number

  // Valuation Metrics
  priceToBook: number
  priceToSales: number
  evToEbitda: number
  pegRatio: number
  dividendYield: number

  // Growth Metrics
  revenueGrowthYoY: number
  revenueGrowthQoQ: number
  epsGrowthYoY: number
  ebitdaGrowthYoY: number
  freeCashFlowGrowth: number

  // Market Metrics
  beta: number
  sharpeRatio: number
  alphaCoefficient: number
  volatility: number

  // Composite Metrics
  enterpriseValue: number
  freeCashFlow: number
  burnRate: number
}

export class AdvancedMetricsCalculator {
  calculate(financials: RawFinancials): EnhancedFinancialMetrics {
    return {
      // Profitability
      grossMargin: this.calcGrossMargin(financials),
      operatingMargin: this.calcOperatingMargin(financials),
      netMargin: this.calcNetMargin(financials),
      returnOnEquity: this.calcROE(financials),
      returnOnAssets: this.calcROA(financials),
      returnOnInvestedCapital: this.calcROIC(financials),

      // Liquidity
      currentRatio: financials.currentAssets / (financials.currentLiabilities || 1),
      quickRatio: (financials.currentAssets - (financials.inventory || 0)) / (financials.currentLiabilities || 1),
      cashRatio: financials.cash / (financials.currentLiabilities || 1),
      workingCapital: financials.currentAssets - financials.currentLiabilities,

      // Leverage
      debtToEquity: financials.totalDebt / (financials.shareholderEquity || 1),
      debtToAssets: financials.totalDebt / (financials.totalAssets || 1),
      interestCoverage: financials.ebit / (financials.interestExpense || 1),
      equityMultiplier: financials.totalAssets / (financials.shareholderEquity || 1),

      // Efficiency
      assetTurnover: financials.revenue / (financials.avgTotalAssets || financials.totalAssets || 1),
      inventoryTurnover: financials.cogs / (financials.avgInventory || financials.inventory || 1),
      receivablesTurnover: financials.revenue / (financials.avgReceivables || financials.receivables || 1),
      daysSalesOutstanding: 365 / (financials.revenue / (financials.avgReceivables || financials.receivables || 1)),

      // Valuation
      priceToBook: financials.marketCap / (financials.bookValue || 1),
      priceToSales: financials.marketCap / (financials.revenue || 1),
      evToEbitda: this.calcEnterpriseValue(financials) / (financials.ebitda || 1),
      pegRatio: this.calcPEGRatio(financials),
      dividendYield: ((financials.annualDividend || 0) / (financials.stockPrice || 1)) * 100,

      // Growth (requires historical data)
      revenueGrowthYoY: this.calcYoYGrowth(financials.revenue, financials.revenueLastYear),
      revenueGrowthQoQ: 0, // Requires quarterly data
      epsGrowthYoY: this.calcYoYGrowth(financials.eps, financials.epsLastYear),
      ebitdaGrowthYoY: 0, // Requires historical EBITDA
      freeCashFlowGrowth: 0, // Requires historical FCF

      // Market metrics (requires price history)
      beta: this.calcBeta(financials.priceHistory, financials.marketIndex),
      sharpeRatio: 0, // Requires risk-free rate
      alphaCoefficient: 0, // Requires detailed regression
      volatility: this.calcVolatility(financials.priceHistory),

      // Composite
      enterpriseValue: this.calcEnterpriseValue(financials),
      freeCashFlow: (financials.operatingCashFlow || 0) - (financials.capitalExpenditures || 0),
      burnRate: this.calcBurnRate(financials)
    }
  }

  private calcGrossMargin(f: RawFinancials): number {
    if (!f.revenue || !f.cogs) return 0
    return ((f.revenue - f.cogs) / f.revenue) * 100
  }

  private calcOperatingMargin(f: RawFinancials): number {
    if (!f.revenue || !f.operatingIncome) return 0
    return (f.operatingIncome / f.revenue) * 100
  }

  private calcNetMargin(f: RawFinancials): number {
    if (!f.revenue || !f.netIncome) return 0
    return (f.netIncome / f.revenue) * 100
  }

  private calcROE(f: RawFinancials): number {
    if (!f.netIncome || !f.shareholderEquity) return 0
    return (f.netIncome / f.shareholderEquity) * 100
  }

  private calcROA(f: RawFinancials): number {
    if (!f.netIncome || !f.totalAssets) return 0
    return (f.netIncome / f.totalAssets) * 100
  }

  private calcROIC(f: RawFinancials): number {
    if (!f.operatingIncome || !f.taxRate) return 0
    const nopat = f.operatingIncome * (1 - f.taxRate)
    const investedCapital = (f.totalDebt || 0) + (f.shareholderEquity || 0)
    if (!investedCapital) return 0
    return (nopat / investedCapital) * 100
  }

  private calcEnterpriseValue(f: RawFinancials): number {
    return (f.marketCap || 0) + (f.totalDebt || 0) - (f.cash || 0)
  }

  private calcPEGRatio(f: RawFinancials): number {
    const pe = f.marketCap / (f.netIncome || 1)
    const epsGrowth = this.calcYoYGrowth(f.eps, f.epsLastYear)
    if (!epsGrowth || epsGrowth <= 0) return pe
    return pe / epsGrowth
  }

  private calcYoYGrowth(current?: number, previous?: number): number {
    if (!current || !previous || previous === 0) return 0
    return ((current - previous) / Math.abs(previous)) * 100
  }

  private calcBeta(stockPrices?: number[], marketPrices?: number[]): number {
    if (!stockPrices || !marketPrices || stockPrices.length < 2 || marketPrices.length < 2) {
      return 1.0 // Default to market beta
    }

    const stockReturns = this.calcReturns(stockPrices)
    const marketReturns = this.calcReturns(marketPrices)

    if (stockReturns.length !== marketReturns.length || stockReturns.length === 0) {
      return 1.0
    }

    const covariance = this.calcCovariance(stockReturns, marketReturns)
    const marketVariance = this.calcVariance(marketReturns)

    if (marketVariance === 0) return 1.0
    return covariance / marketVariance
  }

  private calcVolatility(prices?: number[]): number {
    if (!prices || prices.length < 2) return 0
    const returns = this.calcReturns(prices)
    return Math.sqrt(this.calcVariance(returns)) * Math.sqrt(252) // Annualized
  }

  private calcReturns(prices: number[]): number[] {
    const returns: number[] = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }
    return returns
  }

  private calcCovariance(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0
    const meanX = x.reduce((a, b) => a + b, 0) / x.length
    const meanY = y.reduce((a, b) => a + b, 0) / y.length
    return x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / x.length
  }

  private calcVariance(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  }

  private calcBurnRate(f: RawFinancials): number {
    // Monthly cash burn for startups
    const fcf = (f.operatingCashFlow || 0) - (f.capitalExpenditures || 0)
    if (fcf >= 0) return 0
    return Math.abs(fcf) / 12 // Monthly burn
  }

  /**
   * Get metric explanations and benchmarks
   */
  getMetricInfo(metric: keyof EnhancedFinancialMetrics): {
    name: string
    description: string
    formula: string
    goodRange: string
    industryAverage?: number
  } {
    const info: Record<string, { name: string; description: string; formula: string; goodRange: string; industryAverage?: number }> = {
      grossMargin: {
        name: 'Gross Margin',
        description: 'Profitability after cost of goods sold',
        formula: '(Revenue - COGS) / Revenue',
        goodRange: '> 40%',
        industryAverage: 35
      },
      operatingMargin: {
        name: 'Operating Margin',
        description: 'Profitability from core operations',
        formula: 'Operating Income / Revenue',
        goodRange: '> 15%',
        industryAverage: 12
      },
      returnOnEquity: {
        name: 'Return on Equity',
        description: 'Return generated on shareholder equity',
        formula: 'Net Income / Shareholder Equity',
        goodRange: '> 15%',
        industryAverage: 12
      },
      debtToEquity: {
        name: 'Debt-to-Equity Ratio',
        description: 'Financial leverage ratio',
        formula: 'Total Debt / Shareholder Equity',
        goodRange: '< 1.0',
        industryAverage: 0.8
      },
      currentRatio: {
        name: 'Current Ratio',
        description: 'Ability to pay short-term obligations',
        formula: 'Current Assets / Current Liabilities',
        goodRange: '> 1.5',
        industryAverage: 1.8
      },
      assetTurnover: {
        name: 'Asset Turnover',
        description: 'Efficiency in using assets to generate revenue',
        formula: 'Revenue / Average Total Assets',
        goodRange: '> 0.5',
        industryAverage: 0.6
      },
      priceToEarnings: {
        name: 'P/E Ratio',
        description: 'Price relative to earnings',
        formula: 'Market Cap / Net Income',
        goodRange: '10-25',
        industryAverage: 18
      },
      beta: {
        name: 'Beta',
        description: 'Volatility relative to market',
        formula: 'Covariance(Stock, Market) / Variance(Market)',
        goodRange: '0.8-1.2',
        industryAverage: 1.0
      }
    }

    return info[metric] || {
      name: metric,
      description: 'Financial metric',
      formula: 'N/A',
      goodRange: 'N/A'
    }
  }
}

export default AdvancedMetricsCalculator
