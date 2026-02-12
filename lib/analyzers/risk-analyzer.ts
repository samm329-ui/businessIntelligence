// lib/analyzers/risk-analyzer.ts
// Segregated service: Risk Assessment Only
// Responsibility: Calculate risk scores and generate risk assessments

export interface RiskFactor {
  type: string
  severity: 'High' | 'Medium' | 'Low-Medium' | 'Low'
  description: string
  mitigation: string
}

export interface RiskHeatmapItem {
  dimension: string
  score: number
  label: string
}

export interface RiskAnalysisResult {
  overallRiskScore: number
  keyRisks: RiskFactor[]
  positiveFactors: Array<{
    type: string
    impact: string
    description: string
  }>
  heatMap: RiskHeatmapItem[]
  riskLevel: 'High' | 'Moderate' | 'Low'
}

export class RiskAnalyzer {
  /**
   * Analyze risks based on market and competitor data
   * Single Responsibility: Risk assessment only
   */
  analyze(params: {
    competitorCount: number
    avgMargin: number
    avgGrowth: number
    industry?: string
  }): RiskAnalysisResult {
    const { competitorCount, avgMargin, avgGrowth, industry } = params

    // Calculate individual risk scores
    const competitionScore = this.calculateCompetitionRisk(competitorCount)
    const marketRisk = this.calculateMarketRisk(avgGrowth)
    const financialRisk = this.calculateFinancialRisk(avgMargin)
    const regulatoryRisk = this.calculateRegulatoryRisk(industry)
    const technologyRisk = this.calculateTechnologyRisk(competitorCount)
    const operationalRisk = this.calculateOperationalRisk(avgMargin)
    const supplyChainRisk = 55 // Industry baseline
    const talentRisk = this.calculateTalentRisk(competitorCount)

    // Build heatmap
    const heatMap: RiskHeatmapItem[] = [
      { dimension: 'Market Risk', score: marketRisk, label: this.getRiskLabel(marketRisk) },
      { dimension: 'Competition Risk', score: competitionScore, label: this.getRiskLabel(competitionScore) },
      { dimension: 'Regulatory Risk', score: regulatoryRisk, label: this.getRiskLabel(regulatoryRisk) },
      { dimension: 'Technology Risk', score: technologyRisk, label: this.getRiskLabel(technologyRisk) },
      { dimension: 'Financial Risk', score: financialRisk, label: this.getRiskLabel(financialRisk) },
      { dimension: 'Operational Risk', score: operationalRisk, label: this.getRiskLabel(operationalRisk) },
      { dimension: 'Supply Chain Risk', score: supplyChainRisk, label: this.getRiskLabel(supplyChainRisk) },
      { dimension: 'Talent Risk', score: talentRisk, label: this.getRiskLabel(talentRisk) }
    ]

    // Calculate overall score
    const overallRiskScore = Math.round(
      heatMap.reduce((s, r) => s + r.score, 0) / heatMap.length
    )

    return {
      overallRiskScore,
      keyRisks: this.generateKeyRisks(avgMargin, avgGrowth),
      positiveFactors: this.generatePositiveFactors(avgGrowth),
      heatMap,
      riskLevel: this.getOverallRiskLevel(overallRiskScore)
    }
  }

  private calculateCompetitionRisk(competitorCount: number): number {
    return Math.min(95, 30 + competitorCount * 3)
  }

  private calculateMarketRisk(avgGrowth: number): number {
    return avgGrowth > 15 ? 40 : avgGrowth > 5 ? 55 : 70
  }

  private calculateFinancialRisk(avgMargin: number): number {
    return avgMargin > 20 ? 35 : avgMargin > 10 ? 50 : 70
  }

  private calculateRegulatoryRisk(industry?: string): number {
    // Different industries have different regulatory risks
    const highRiskIndustries = ['pharmaceuticals', 'healthcare', 'banking', 'finance']
    const mediumRiskIndustries = ['automobile', 'fmcg', 'food']
    
    const industryLower = industry?.toLowerCase() || ''
    if (highRiskIndustries.some(i => industryLower.includes(i))) return 65
    if (mediumRiskIndustries.some(i => industryLower.includes(i))) return 50
    return 45
  }

  private calculateTechnologyRisk(competitorCount: number): number {
    return Math.round(55 + (competitorCount > 15 ? 10 : 0))
  }

  private calculateOperationalRisk(avgMargin: number): number {
    return Math.round(40 + (avgMargin < 10 ? 15 : 0))
  }

  private calculateTalentRisk(competitorCount: number): number {
    return competitorCount > 20 ? 65 : 50
  }

  private getRiskLabel(score: number): string {
    if (score >= 70) return 'High'
    if (score >= 50) return 'Moderate'
    if (score >= 30) return 'Low-Moderate'
    return 'Low'
  }

  private getOverallRiskLevel(score: number): RiskAnalysisResult['riskLevel'] {
    if (score >= 60) return 'High'
    if (score >= 40) return 'Moderate'
    return 'Low'
  }

  private generateKeyRisks(avgMargin: number, avgGrowth: number): RiskFactor[] {
    return [
      {
        type: 'Competition',
        severity: 'High',
        description: 'Intense competition from established players',
        mitigation: 'Focus on niche segments and differentiation'
      },
      {
        type: 'Regulatory',
        severity: 'Medium',
        description: 'Changing compliance requirements',
        mitigation: 'Dedicated legal team and compliance framework'
      },
      {
        type: 'Technology',
        severity: 'Medium',
        description: 'Rapid technology obsolescence',
        mitigation: 'Continuous R&D investment and partnerships'
      },
      {
        type: 'Market',
        severity: avgGrowth < 5 ? 'High' : 'Medium',
        description: 'Economic downturn impact on spending',
        mitigation: 'Diversified product portfolio'
      },
      {
        type: 'Talent',
        severity: 'Low-Medium',
        description: 'Difficulty in hiring skilled workforce',
        mitigation: 'Competitive compensation and culture'
      }
    ]
  }

  private generatePositiveFactors(avgGrowth: number): Array<{
    type: string
    impact: string
    description: string
  }> {
    return [
      {
        type: 'Growing Demand',
        impact: 'High',
        description: 'Increasing consumer adoption and market expansion'
      },
      {
        type: 'Digital Transformation',
        impact: 'High',
        description: 'Technology enabling new business models'
      },
      {
        type: 'Government Support',
        impact: 'Medium',
        description: 'Favorable policies and subsidies for the sector'
      },
      {
        type: 'Export Potential',
        impact: 'Medium',
        description: 'Growing international market opportunities'
      },
      {
        type: 'Innovation Ecosystem',
        impact: 'Medium',
        description: 'Access to startups and technology partners'
      }
    ]
  }
}

export const riskAnalyzer = new RiskAnalyzer()
export default riskAnalyzer
