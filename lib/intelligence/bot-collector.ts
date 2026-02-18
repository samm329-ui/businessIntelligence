import { collectDataSearchFirst, extractCompetitors, type CollectedData, type CollectionOptions } from './collector';
import { identifyInput, type IdentificationResult, type SearchContext } from './identifier';
import { extractFinancials, financialsToConsensusInput, type StructuredFinancials } from './financial-extractor';
import { buildConsensus, formatForAI, type ConsensusMetrics } from './consensus-engine';
import { searchCompanyInfo } from '../search-bots/google-bot';

export interface EntityInfo {
  name: string;
  type: string;
  industry: string;
  subIndustry: string;
  ticker?: string;
  domain?: string;
  aliases?: string[];
}

export interface CollectorOutput {
  entity: EntityInfo;
  collectedData: CollectedData;
  structuredFinancials: StructuredFinancials;
  consensusMetrics: ConsensusMetrics;
  consensusForAI: string;
  competitors: string[];
  metadata: {
    collectionTimeMs: number;
    sourcesUsed: string[];
    dataConfidenceScore: number;
    pipelineVersion: string;
  };
}

export interface AcquisitionOutput {
  entity: EntityInfo;
  rawData: CollectedData;
  identification: IdentificationResult;
  searchResults: any[];
  acquisitionTimeMs: number;
}

export interface StructuringOutput {
  structuredFinancials: StructuredFinancials;
  consensusMetrics: ConsensusMetrics;
  consensusForAI: string;
  competitors: string[];
  dataConfidenceScore: number;
  structuringTimeMs: number;
}

export async function runBot1A_Acquisition(
  input: string,
  options?: CollectionOptions
): Promise<AcquisitionOutput> {
  const startTime = Date.now();
  console.log(`[Bot1A:Acquisition] Starting data acquisition for: "${input}"`);

  const quickSearchResults = await searchCompanyInfo(input).catch(() => []);

  const searchEntityHints: SearchContext['hints'] = {};
  for (const result of quickSearchResults.slice(0, 5)) {
    const text = `${result.title} ${result.description}`;
    if (!searchEntityHints.industry) {
      const industryMatch = text.match(/(?:industry|sector|segment)[:\s]+([A-Za-z\s&]+?)(?:\.|,|;|\n|$)/i);
      if (industryMatch) searchEntityHints.industry = industryMatch[1].trim();
    }
    if (!searchEntityHints.type) {
      if (/\b(?:Ltd|Limited|Inc|Corp|Company|Group|Holdings)\b/i.test(text)) {
        searchEntityHints.type = 'company';
      }
    }
  }

  const identification = await identifyInput(input, {
    results: quickSearchResults,
    hints: searchEntityHints,
  });

  if (!identification.found && quickSearchResults.length > 0) {
    identification.found = true;
    identification.name = input;
    identification.source = 'google' as any;
    identification.confidence = 60;
    identification.isNew = true;
  }

  if (!identification.found) {
    throw new Error(`Could not identify entity: "${input}"`);
  }

  const rawData = await collectDataSearchFirst(
    input,
    identification,
    quickSearchResults,
    options
  );

  const acquisitionTime = Date.now() - startTime;
  console.log(`[Bot1A:Acquisition] Complete in ${acquisitionTime}ms | sources: ${rawData.metadata.totalSources}`);

  return {
    entity: {
      name: identification.name,
      type: identification.type,
      industry: identification.industry,
      subIndustry: identification.subIndustry,
      ticker: identification.ticker,
      domain: identification.domain,
      aliases: identification.aliases,
    },
    rawData,
    identification,
    searchResults: quickSearchResults,
    acquisitionTimeMs: acquisitionTime,
  };
}

export async function runBot1B_Structuring(
  acquisitionOutput: AcquisitionOutput
): Promise<StructuringOutput> {
  const startTime = Date.now();
  console.log(`[Bot1B:Structuring] Starting data structuring for: "${acquisitionOutput.entity.name}"`);

  const competitors = await extractCompetitors(acquisitionOutput.rawData);
  acquisitionOutput.rawData.csvCompetitors = competitors;

  const structuredFinancials = extractFinancials(
    [...acquisitionOutput.rawData.sources.financialData, ...acquisitionOutput.rawData.sources.companyInfo],
    acquisitionOutput.rawData.sources.crawledPages
  );

  const consensusInput = financialsToConsensusInput(structuredFinancials);
  const consensusMetrics = buildConsensus(
    acquisitionOutput.entity.name,
    acquisitionOutput.entity.name,
    acquisitionOutput.entity.type === 'industry' ? 'industry' : 'company',
    consensusInput
  );
  const consensusForAI = formatForAI(consensusMetrics);

  const dataConfidenceScore = Math.min(100, Math.max(0,
    (acquisitionOutput.rawData.metadata.totalSources >= 10 ? 25 : acquisitionOutput.rawData.metadata.totalSources >= 5 ? 15 : 5) +
    (acquisitionOutput.rawData.sources.financialData.length >= 5 ? 25 : acquisitionOutput.rawData.sources.financialData.length >= 2 ? 15 : 8) +
    (acquisitionOutput.rawData.sources.crawledPages.length >= 3 ? 15 : acquisitionOutput.rawData.sources.crawledPages.length >= 1 ? 8 : 0) +
    (acquisitionOutput.rawData.sources.news.length > 0 ? 10 : 0) +
    (acquisitionOutput.rawData.sources.competitors.length > 0 ? 10 : 0) +
    (structuredFinancials.metadata.uniqueMetrics >= 5 ? 15 : structuredFinancials.metadata.uniqueMetrics >= 2 ? 8 : 0)
  ));

  const structuringTime = Date.now() - startTime;
  console.log(`[Bot1B:Structuring] Complete in ${structuringTime}ms | ${structuredFinancials.metadata.totalExtractions} extractions | ${consensusMetrics.overallConfidence}% consensus | ${dataConfidenceScore}% confidence`);

  return {
    structuredFinancials,
    consensusMetrics,
    consensusForAI,
    competitors,
    dataConfidenceScore,
    structuringTimeMs: structuringTime,
  };
}

export async function runCollector(
  input: string,
  options?: CollectionOptions
): Promise<CollectorOutput> {
  const startTime = Date.now();
  console.log(`[Bot1:Collector] Starting collection for: "${input}"`);

  const acquisitionOutput = await runBot1A_Acquisition(input, options);
  const structuringOutput = await runBot1B_Structuring(acquisitionOutput);

  const collectionTime = Date.now() - startTime;
  console.log(`[Bot1:Collector] Complete in ${collectionTime}ms | ${acquisitionOutput.acquisitionTimeMs}ms acquisition | ${structuringOutput.structuringTimeMs}ms structuring`);

  return {
    entity: acquisitionOutput.entity,
    collectedData: acquisitionOutput.rawData,
    structuredFinancials: structuringOutput.structuredFinancials,
    consensusMetrics: structuringOutput.consensusMetrics,
    consensusForAI: structuringOutput.consensusForAI,
    competitors: structuringOutput.competitors,
    metadata: {
      collectionTimeMs: collectionTime,
      sourcesUsed: structuringOutput.consensusMetrics.sourcesUsed,
      dataConfidenceScore: structuringOutput.dataConfidenceScore,
      pipelineVersion: '4.5-query-builder',
    },
  };
}
