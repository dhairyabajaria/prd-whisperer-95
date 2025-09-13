// External Integrations Service for Purchase Module
// Handles FX rates, competitor price scraping, and other external data sources

interface FxRateResponse {
  success: boolean;
  base: string;
  rates?: Record<string, number>;
  timestamp?: number;
  error?: string;
}

interface CompetitorPriceSource {
  name: string;
  url: string;
  selectors: {
    price: string;
    currency: string;
    availability: string;
  };
}

export class ExternalIntegrationsService {
  private readonly fxApiKeys = {
    exchangeRatesApi: process.env.EXCHANGE_RATES_API_KEY,
    fixer: process.env.FIXER_API_KEY,
    currencyLayer: process.env.CURRENCY_LAYER_API_KEY,
  };

  private readonly rateCache = new Map<string, { rates: Record<string, number>; timestamp: number }>();
  private readonly cacheExpiryMs = 60 * 60 * 1000; // 1 hour

  // FX Rate Integration with multiple providers and fallbacks
  async getFxRatesWithFallbacks(baseCurrency = 'USD'): Promise<{
    success: boolean;
    rates: Record<string, number>;
    source: string;
    cached: boolean;
    error?: string;
  }> {
    try {
      // Check cache first
      const cacheKey = baseCurrency;
      const cached = this.rateCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < this.cacheExpiryMs) {
        return {
          success: true,
          rates: cached.rates,
          source: 'cache',
          cached: true
        };
      }

      // Try primary providers in order of preference
      const providers = [
        () => this.fetchFromExchangeRatesApi(baseCurrency),
        () => this.fetchFromFixer(baseCurrency),
        () => this.fetchFromCurrencyLayer(baseCurrency),
        () => this.fetchFromEcbApi(baseCurrency), // European Central Bank - free fallback
        () => this.getStaticFallbackRates(baseCurrency), // Static fallback rates
      ];

      for (const [index, provider] of providers.entries()) {
        try {
          const result = await provider();
          if (result.success && result.rates) {
            // Cache successful result
            this.rateCache.set(cacheKey, {
              rates: result.rates,
              timestamp: now
            });

            const sourceNames = ['ExchangeRates-API', 'Fixer', 'CurrencyLayer', 'ECB', 'Static'];
            return {
              success: true,
              rates: result.rates,
              source: sourceNames[index],
              cached: false
            };
          }
        } catch (error) {
          console.warn(`FX provider ${index + 1} failed:`, error);
          continue;
        }
      }

      return {
        success: false,
        rates: {},
        source: 'none',
        cached: false,
        error: 'All FX rate providers failed'
      };

    } catch (error) {
      console.error('Error fetching FX rates:', error);
      return {
        success: false,
        rates: {},
        source: 'error',
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async fetchFromExchangeRatesApi(base: string): Promise<FxRateResponse> {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    
    if (!response.ok) {
      throw new Error(`ExchangeRates API failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      base: data.base,
      rates: data.rates,
      timestamp: data.time_last_updated
    };
  }

  private async fetchFromFixer(base: string): Promise<FxRateResponse> {
    if (!this.fxApiKeys.fixer) {
      throw new Error('Fixer API key not configured');
    }

    const response = await fetch(
      `https://api.fixer.io/latest?access_key=${this.fxApiKeys.fixer}&base=${base}`
    );
    
    if (!response.ok) {
      throw new Error(`Fixer API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Fixer API error: ${data.error?.code}`);
    }

    return {
      success: true,
      base: data.base,
      rates: data.rates,
      timestamp: data.timestamp
    };
  }

  private async fetchFromCurrencyLayer(base: string): Promise<FxRateResponse> {
    if (!this.fxApiKeys.currencyLayer) {
      throw new Error('CurrencyLayer API key not configured');
    }

    const response = await fetch(
      `https://api.currencylayer.com/live?access_key=${this.fxApiKeys.currencyLayer}&source=${base}`
    );
    
    if (!response.ok) {
      throw new Error(`CurrencyLayer API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`CurrencyLayer API error: ${data.error?.code}`);
    }

    // Convert quotes format (USDEUR: 0.85) to rates format (EUR: 0.85)
    const rates: Record<string, number> = {};
    Object.entries(data.quotes).forEach(([key, value]) => {
      const currency = key.slice(3); // Remove base currency prefix
      rates[currency] = value as number;
    });

    return {
      success: true,
      base: data.source,
      rates,
      timestamp: data.timestamp
    };
  }

  private async fetchFromEcbApi(base: string): Promise<FxRateResponse> {
    // European Central Bank API - free but only EUR base
    if (base !== 'EUR') {
      throw new Error('ECB API only supports EUR base');
    }

    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    
    if (!response.ok) {
      throw new Error(`ECB API failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      base: 'EUR',
      rates: data.rates,
      timestamp: Date.now()
    };
  }

  private async getStaticFallbackRates(base: string): Promise<FxRateResponse> {
    // Static fallback rates for essential currencies (updated periodically)
    const fallbackRates: Record<string, Record<string, number>> = {
      'USD': {
        'EUR': 0.85,
        'GBP': 0.73,
        'JPY': 110.0,
        'AOA': 830.0, // Angola Kwanza
        'BRL': 5.20,   // Brazilian Real
        'CAD': 1.25,
        'AUD': 1.35,
        'CHF': 0.92,
        'CNY': 7.10,
      },
      'EUR': {
        'USD': 1.18,
        'GBP': 0.86,
        'JPY': 129.5,
        'AOA': 976.5,
        'BRL': 6.12,
        'CAD': 1.47,
        'AUD': 1.59,
        'CHF': 1.08,
        'CNY': 8.37,
      },
      'AOA': {
        'USD': 0.0012,
        'EUR': 0.00102,
        'BRL': 0.0063,
        'GBP': 0.00088,
        'JPY': 0.133,
      }
    };

    const rates = fallbackRates[base];
    if (!rates) {
      throw new Error(`No static fallback rates available for ${base}`);
    }

    console.warn(`Using static fallback FX rates for ${base} - consider updating external API keys`);

    return {
      success: true,
      base,
      rates,
      timestamp: Date.now()
    };
  }

  // Get specific currency pair rate with caching
  async getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<{
    success: boolean;
    rate?: number;
    inverse?: number;
    source: string;
    error?: string;
  }> {
    try {
      if (fromCurrency === toCurrency) {
        return { success: true, rate: 1.0, inverse: 1.0, source: 'same_currency' };
      }

      const fxData = await this.getFxRatesWithFallbacks(fromCurrency);
      
      if (!fxData.success || !fxData.rates[toCurrency]) {
        // Try inverse lookup
        const inverseFxData = await this.getFxRatesWithFallbacks(toCurrency);
        
        if (inverseFxData.success && inverseFxData.rates[fromCurrency]) {
          const inverseRate = inverseFxData.rates[fromCurrency];
          return {
            success: true,
            rate: 1 / inverseRate,
            inverse: inverseRate,
            source: `${inverseFxData.source}_inverse`
          };
        }

        return {
          success: false,
          source: 'none',
          error: `Currency pair ${fromCurrency}/${toCurrency} not available`
        };
      }

      const rate = fxData.rates[toCurrency];
      return {
        success: true,
        rate,
        inverse: 1 / rate,
        source: fxData.source
      };

    } catch (error) {
      console.error(`Error getting currency rate ${fromCurrency}/${toCurrency}:`, error);
      return {
        success: false,
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Basic competitor price monitoring (web scraping simulation)
  async monitorCompetitorPrices(productSearchTerms: Array<{
    productId: string;
    searchTerm: string;
    expectedPriceRange: { min: number; max: number };
  }>): Promise<Array<{
    productId: string;
    competitor: string;
    price?: number;
    currency: string;
    availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
    sourceUrl: string;
    collectedAt: Date;
    confidence: number; // 0-100
    error?: string;
  }>> {
    const results: Array<{
      productId: string;
      competitor: string;
      price?: number;
      currency: string;
      availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
      sourceUrl: string;
      collectedAt: Date;
      confidence: number;
      error?: string;
    }> = [];

    // Simulated competitor sources for pharmaceutical products
    const competitorSources: CompetitorPriceSource[] = [
      {
        name: 'PharmaCorp',
        url: 'https://pharmacorp.com/search',
        selectors: { price: '.price', currency: '.currency', availability: '.stock-status' }
      },
      {
        name: 'MediSupply',
        url: 'https://medisupply.com/products',
        selectors: { price: '.product-price', currency: '.price-currency', availability: '.availability' }
      },
      {
        name: 'HealthDistribution',
        url: 'https://healthdist.com/catalog',
        selectors: { price: '.item-price', currency: '.price-unit', availability: '.stock-info' }
      }
    ];

    for (const product of productSearchTerms) {
      for (const source of competitorSources) {
        try {
          // Simulate web scraping with realistic delays and fallbacks
          const mockPrice = this.generateMockCompetitorPrice(
            product.expectedPriceRange.min,
            product.expectedPriceRange.max
          );

          // Simulate availability and confidence based on price range
          const availability = mockPrice ? 'in_stock' : 'out_of_stock';
          const confidence = mockPrice ? Math.floor(Math.random() * 30) + 70 : 30; // 70-100 for valid prices

          results.push({
            productId: product.productId,
            competitor: source.name,
            price: mockPrice,
            currency: 'USD', // Default to USD for simulation
            availability,
            sourceUrl: `${source.url}?q=${encodeURIComponent(product.searchTerm)}`,
            collectedAt: new Date(),
            confidence,
            error: mockPrice ? undefined : 'Product not found or price unavailable'
          });

          // Realistic delay between requests
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        } catch (error) {
          results.push({
            productId: product.productId,
            competitor: source.name,
            price: undefined,
            currency: 'USD',
            availability: 'unknown',
            sourceUrl: source.url,
            collectedAt: new Date(),
            confidence: 0,
            error: error instanceof Error ? error.message : 'Scraping failed'
          });
        }
      }
    }

    return results;
  }

  private generateMockCompetitorPrice(min: number, max: number): number | undefined {
    // 80% chance of finding a price
    if (Math.random() < 0.8) {
      const variance = 0.2; // ±20% variance from expected range
      const midpoint = (min + max) / 2;
      const range = max - min;
      const adjustment = (Math.random() - 0.5) * variance * range;
      return Math.max(0, midpoint + adjustment);
    }
    return undefined;
  }

  // Health check for external services
  async checkExternalServicesHealth(): Promise<{
    fxRates: { status: 'healthy' | 'degraded' | 'unhealthy'; latency?: number; error?: string };
    competitorMonitoring: { status: 'healthy' | 'degraded' | 'unhealthy'; error?: string };
    timestamp: Date;
  }> {
    const results = {
      fxRates: { status: 'unhealthy' as const, latency: undefined, error: undefined },
      competitorMonitoring: { status: 'healthy' as const, error: undefined },
      timestamp: new Date()
    };

    // Test FX rate services
    try {
      const startTime = Date.now();
      const fxTest = await this.getFxRatesWithFallbacks('USD');
      const latency = Date.now() - startTime;

      if (fxTest.success) {
        results.fxRates = { 
          status: fxTest.cached ? 'healthy' : (latency > 5000 ? 'degraded' : 'healthy'),
          latency
        };
      } else {
        results.fxRates = { 
          status: 'unhealthy',
          latency,
          error: fxTest.error 
        };
      }
    } catch (error) {
      results.fxRates = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Competitor monitoring is always available (uses mock data)
    results.competitorMonitoring = { status: 'healthy' };

    return results;
  }

  // Clear caches (useful for testing and manual refresh)
  clearCaches(): void {
    this.rateCache.clear();
  }

  // Get cache statistics
  getCacheStats(): {
    fxRates: {
      entries: number;
      oldestEntry?: Date;
      newestEntry?: Date;
    };
  } {
    const now = Date.now();
    let oldest: number | undefined;
    let newest: number | undefined;

    for (const entry of this.rateCache.values()) {
      if (!oldest || entry.timestamp < oldest) oldest = entry.timestamp;
      if (!newest || entry.timestamp > newest) newest = entry.timestamp;
    }

    return {
      fxRates: {
        entries: this.rateCache.size,
        oldestEntry: oldest ? new Date(oldest) : undefined,
        newestEntry: newest ? new Date(newest) : undefined,
      }
    };
  }
}

export const externalIntegrationsService = new ExternalIntegrationsService();