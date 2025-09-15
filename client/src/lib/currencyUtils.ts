import { apiRequest } from "@/lib/queryClient";

// Common currencies used in pharmaceutical distribution
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', locale: 'pt-AO' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

// FX Rate interface
export interface FxRate {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  asOfDate: string;
  source: string;
  createdAt: Date;
}

// Currency formatting options
export interface CurrencyFormatOptions {
  currency?: CurrencyCode;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
  showCode?: boolean;
}

// Get currency info by code
export const getCurrencyInfo = (code: CurrencyCode) => {
  return SUPPORTED_CURRENCIES.find(c => c.code === code);
};

// Format currency amount with proper locale and symbol
export const formatCurrency = (
  amount: number | string, 
  options: CurrencyFormatOptions = {}
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.00';
  }

  const {
    currency = 'USD',
    locale,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
    showCode = false,
  } = options;

  const currencyInfo = getCurrencyInfo(currency);
  const formatLocale = locale || currencyInfo?.locale || 'en-US';

  try {
    const formatter = new Intl.NumberFormat(formatLocale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? currency : undefined,
      minimumFractionDigits,
      maximumFractionDigits,
    });

    let formatted = formatter.format(numAmount);

    // Add currency code if requested
    if (showCode && !showSymbol) {
      formatted = `${formatted} ${currency}`;
    } else if (showCode && showSymbol) {
      formatted = `${formatted} (${currency})`;
    }

    return formatted;
  } catch (error) {
    // Fallback formatting
    const symbol = showSymbol ? (currencyInfo?.symbol || currency) : '';
    const code = showCode ? ` ${currency}` : '';
    return `${symbol}${numAmount.toFixed(maximumFractionDigits)}${code}`;
  }
};

// Parse currency string to number
export const parseCurrencyAmount = (value: string): number => {
  if (!value) return 0;
  
  // Remove currency symbols, commas, and spaces
  const cleaned = value
    .replace(/[^\d.,\-]/g, '')
    .replace(/,/g, '');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Validate currency code
export const isValidCurrency = (code: string): code is CurrencyCode => {
  return SUPPORTED_CURRENCIES.some(c => c.code === code);
};

// FX Rate API functions
export class CurrencyService {
  private static rateCache = new Map<string, { rate: FxRate; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Get all FX rates
  static async getFxRates(baseCurrency?: string, quoteCurrency?: string): Promise<FxRate[]> {
    try {
      const params = new URLSearchParams();
      if (baseCurrency) params.append('baseCurrency', baseCurrency);
      if (quoteCurrency) params.append('quoteCurrency', quoteCurrency);
      
      const response = await apiRequest('GET', `/api/fx/rates?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching FX rates:', error);
      return [];
    }
  }

  // Get latest FX rate for currency pair
  static async getLatestFxRate(baseCurrency: string, quoteCurrency: string): Promise<FxRate | null> {
    if (baseCurrency === quoteCurrency) {
      // Return mock rate for same currency
      return {
        id: `same-${baseCurrency}`,
        baseCurrency,
        quoteCurrency,
        rate: '1.0',
        asOfDate: new Date().toISOString().split('T')[0],
        source: 'identity',
        createdAt: new Date(),
      };
    }

    const cacheKey = `${baseCurrency}_${quoteCurrency}`;
    const cached = this.rateCache.get(cacheKey);
    
    // Return cached rate if still valid
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.rate;
    }

    try {
      const response = await apiRequest('GET', `/api/fx/latest?baseCurrency=${baseCurrency}&quoteCurrency=${quoteCurrency}`);
      const rate = await response.json();
      
      // Cache the rate
      if (rate) {
        this.rateCache.set(cacheKey, { rate, timestamp: Date.now() });
      }
      
      return rate;
    } catch (error) {
      console.error(`Error fetching latest FX rate for ${baseCurrency}/${quoteCurrency}:`, error);
      return null;
    }
  }

  // Convert currency amount
  static async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<{ amount: number; rate: number; date: string } | null> {
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1, date: new Date().toISOString().split('T')[0] };
    }

    try {
      const fxRate = await this.getLatestFxRate(fromCurrency, toCurrency);
      if (!fxRate) {
        console.warn(`No FX rate found for ${fromCurrency}/${toCurrency}`);
        return null;
      }

      const rate = parseFloat(fxRate.rate);
      const convertedAmount = amount * rate;

      return {
        amount: convertedAmount,
        rate,
        date: fxRate.asOfDate,
      };
    } catch (error) {
      console.error(`Error converting ${amount} ${fromCurrency} to ${toCurrency}:`, error);
      return null;
    }
  }

  // Refresh FX rates from external sources
  static async refreshFxRates(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest('POST', '/api/fx/refresh');
      const result = await response.json();
      
      // Clear cache after refresh
      this.rateCache.clear();
      
      return {
        success: true,
        message: `Successfully updated ${result.updatedRates?.length || 0} FX rates`,
      };
    } catch (error) {
      console.error('Error refreshing FX rates:', error);
      return {
        success: false,
        message: 'Failed to refresh FX rates',
      };
    }
  }

  // Get FX rate scheduler status
  static async getSchedulerStatus(): Promise<any> {
    try {
      const response = await apiRequest('GET', '/api/fx/scheduler/status');
      return await response.json();
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
      return null;
    }
  }

  // Clear rate cache manually
  static clearCache(): void {
    this.rateCache.clear();
  }
}

// Format currency with conversion display
export const formatCurrencyWithConversion = async (
  amount: number | string,
  fromCurrency: CurrencyCode,
  toCurrency?: CurrencyCode,
  options: CurrencyFormatOptions = {}
): Promise<string> => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const primaryFormatted = formatCurrency(numAmount, { ...options, currency: fromCurrency });

  // If no target currency or same currency, return primary only
  if (!toCurrency || fromCurrency === toCurrency) {
    return primaryFormatted;
  }

  try {
    const conversion = await CurrencyService.convertCurrency(numAmount, fromCurrency, toCurrency);
    if (conversion) {
      const convertedFormatted = formatCurrency(conversion.amount, { 
        ...options, 
        currency: toCurrency,
        showCode: true
      });
      return `${primaryFormatted} (≈ ${convertedFormatted})`;
    }
  } catch (error) {
    console.warn(`Could not convert ${fromCurrency} to ${toCurrency}:`, error);
  }

  return primaryFormatted;
};

// Get user's preferred currency (from localStorage or default)
export const getUserPreferredCurrency = (): CurrencyCode => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferred_currency');
    if (stored && isValidCurrency(stored)) {
      return stored;
    }
  }
  return 'USD'; // Default currency
};

// Set user's preferred currency
export const setUserPreferredCurrency = (currency: CurrencyCode): void => {
  if (typeof window !== 'undefined' && isValidCurrency(currency)) {
    localStorage.setItem('preferred_currency', currency);
  }
};

// Currency input validation
export const validateCurrencyInput = (value: string): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: false, error: 'Amount is required' };
  }

  const numValue = parseCurrencyAmount(value);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Invalid currency format' };
  }

  if (numValue < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }

  if (numValue > 999999999.99) {
    return { isValid: false, error: 'Amount is too large' };
  }

  return { isValid: true };
};

// Get exchange rate summary for dashboard
export const getExchangeRateSummary = async (): Promise<{
  baseCurrency: CurrencyCode;
  rates: Array<{ currency: CurrencyCode; rate: number; change?: number }>;
  lastUpdated: string;
}> => {
  try {
    const baseCurrency = getUserPreferredCurrency();
    const rates = await CurrencyService.getFxRates(baseCurrency);
    
    // Group by quote currency and get latest
    const latestRates = new Map<string, FxRate>();
    rates.forEach(rate => {
      const existing = latestRates.get(rate.quoteCurrency);
      if (!existing || new Date(rate.asOfDate) > new Date(existing.asOfDate)) {
        latestRates.set(rate.quoteCurrency, rate);
      }
    });

    const ratesSummary = Array.from(latestRates.values()).map(rate => ({
      currency: rate.quoteCurrency as CurrencyCode,
      rate: parseFloat(rate.rate),
      // TODO: Calculate change from previous rate
    }));

    return {
      baseCurrency,
      rates: ratesSummary,
      lastUpdated: rates.length > 0 ? rates[0].asOfDate : new Date().toISOString().split('T')[0],
    };
  } catch (error) {
    console.error('Error getting exchange rate summary:', error);
    return {
      baseCurrency: 'USD',
      rates: [],
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  }
};

// Export default for convenience
export default {
  formatCurrency,
  parseCurrencyAmount,
  isValidCurrency,
  getCurrencyInfo,
  formatCurrencyWithConversion,
  getUserPreferredCurrency,
  setUserPreferredCurrency,
  validateCurrencyInput,
  getExchangeRateSummary,
  CurrencyService,
  SUPPORTED_CURRENCIES,
};