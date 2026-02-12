import yahooFinance from 'yahoo-finance2';

/**
 * Yahoo Finance Fetcher
 * Provides unlimited free access to global financial data.
 */

export async function fetchYahooQuote(symbol: string) {
    try {
        // Automatically handle Indian tickers if not specified
        const formattedSymbol = (symbol.includes('.') || symbol === '^NSEI')
            ? symbol
            : `${symbol}.NS`;

        const result = await yahooFinance.quote(formattedSymbol);
        return result;
    } catch (error) {
        console.error(`Yahoo Quote Fetch Failed for ${symbol}:`, error);
        return null;
    }
}

export async function fetchYahooSummary(symbol: string) {
    try {
        const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
        const result = await yahooFinance.quoteSummary(formattedSymbol, {
            modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'assetProfile']
        });
        return result;
    } catch (error) {
        console.error(`Yahoo Summary Fetch Failed for ${symbol}:`, error);
        return null;
    }
}

export async function fetchYahooHolders(symbol: string) {
    try {
        const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
        const result = await yahooFinance.quoteSummary(formattedSymbol, {
            modules: ['institutionOwnership', 'majorDirectHolders', 'majorHoldersBreakdown']
        });
        return result;
    } catch (error) {
        console.error(`Yahoo Holders Fetch Failed for ${symbol}:`, error);
        return null;
    }
}
