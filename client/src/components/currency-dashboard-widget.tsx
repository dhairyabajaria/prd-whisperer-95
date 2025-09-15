import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, DollarSign } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  CurrencyService, 
  formatCurrency, 
  getUserPreferredCurrency,
  getCurrencyInfo,
  type CurrencyCode,
  type FxRate 
} from "@/lib/currencyUtils";
import { useToast } from "@/hooks/use-toast";

interface CurrencyMetrics {
  totalValue: number;
  currency: CurrencyCode;
  conversionToBase: number;
  percentageOfTotal: number;
}

interface ExchangeRateSummary {
  baseCurrency: CurrencyCode;
  rates: Array<{
    currency: CurrencyCode;
    rate: number;
    change?: number;
    lastUpdated: string;
  }>;
  lastRefresh: string;
}

export function CurrencyDashboardWidget() {
  const { toast } = useToast();
  const [baseCurrency] = useState<CurrencyCode>(getUserPreferredCurrency());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch FX rates for dashboard display
  const { data: fxRates, refetch: refetchRates, isLoading, error } = useQuery<FxRate[]>({
    queryKey: ["/api/fx/rates"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mock currency metrics - in real app, this would come from actual transaction data
  const currencyMetrics: CurrencyMetrics[] = [
    { totalValue: 150000, currency: "USD", conversionToBase: 150000, percentageOfTotal: 45 },
    { totalValue: 85000, currency: "EUR", conversionToBase: 100000, percentageOfTotal: 30 },
    { totalValue: 41500000, currency: "AOA", conversionToBase: 50000, percentageOfTotal: 15 },
    { totalValue: 8000, currency: "GBP", conversionToBase: 11000, percentageOfTotal: 10 },
  ];

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    try {
      const result = await CurrencyService.refreshFxRates();
      if (result.success) {
        await refetchRates();
        toast({
          title: "Exchange Rates Updated",
          description: result.message,
        });
      } else {
        toast({
          title: "Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh exchange rates",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Process FX rates for display
  const exchangeRateSummary: ExchangeRateSummary = {
    baseCurrency,
    rates: [],
    lastRefresh: new Date().toISOString(),
  };

  if (fxRates) {
    // Get latest rates for each currency
    const latestRates = new Map<string, FxRate>();
    fxRates.forEach(rate => {
      if (rate.baseCurrency === baseCurrency) {
        const existing = latestRates.get(rate.quoteCurrency);
        if (!existing || new Date(rate.asOfDate) > new Date(existing.asOfDate)) {
          latestRates.set(rate.quoteCurrency, rate);
        }
      }
    });

    exchangeRateSummary.rates = Array.from(latestRates.values())
      .map(rate => ({
        currency: rate.quoteCurrency as CurrencyCode,
        rate: parseFloat(rate.rate),
        lastUpdated: rate.asOfDate,
      }))
      .sort((a, b) => a.currency.localeCompare(b.currency))
      .slice(0, 5); // Show top 5 currencies
  }

  const totalPortfolioValue = currencyMetrics.reduce((sum, metric) => sum + metric.conversionToBase, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Currency Portfolio Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Multi-Currency Portfolio</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-4">
            {formatCurrency(totalPortfolioValue, { currency: baseCurrency, showSymbol: true })}
          </div>
          
          <div className="space-y-3">
            <div className="text-sm font-medium">Currency Breakdown</div>
            {currencyMetrics.map((metric, index) => {
              const currencyInfo = getCurrencyInfo(metric.currency);
              return (
                <div key={metric.currency} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currencyInfo?.symbol}</span>
                      <span>{metric.currency}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(metric.totalValue, { 
                          currency: metric.currency, 
                          showSymbol: true 
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ≈ {formatCurrency(metric.conversionToBase, { 
                          currency: baseCurrency, 
                          showSymbol: true 
                        })}
                      </div>
                    </div>
                  </div>
                  <Progress value={metric.percentageOfTotal} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {metric.percentageOfTotal}% of total portfolio
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Exchange Rates</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshRates}
            disabled={isRefreshing || isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Base: {baseCurrency} • {exchangeRateSummary.rates.length} currencies
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive mb-4">
              <AlertCircle className="h-4 w-4" />
              Failed to load exchange rates
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded w-12"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {exchangeRateSummary.rates.length > 0 ? (
                exchangeRateSummary.rates.map((rate) => {
                  const currencyInfo = getCurrencyInfo(rate.currency);
                  const changeIcon = rate.change && rate.change > 0 ? 
                    <TrendingUp className="h-3 w-3 text-green-600" /> : 
                    rate.change && rate.change < 0 ? 
                    <TrendingDown className="h-3 w-3 text-red-600" /> : 
                    null;

                  return (
                    <div key={rate.currency} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm w-8">{currencyInfo?.symbol}</span>
                        <span className="text-sm">{rate.currency}</span>
                        {changeIcon}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {rate.rate.toFixed(rate.rate >= 1 ? 2 : 6)}
                        </div>
                        {rate.change && (
                          <div className={`text-xs ${
                            rate.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {rate.change > 0 ? '+' : ''}{(rate.change * 100).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No exchange rates available
                </div>
              )}
            </div>
          )}

          {exchangeRateSummary.rates.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(exchangeRateSummary.lastRefresh).toLocaleString()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Currency conversion quick widget
export function CurrencyConverterWidget() {
  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>("USD");
  const [toCurrency, setToCurrency] = useState<CurrencyCode>("EUR");
  const [result, setResult] = useState<{ amount: number; rate: number } | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsConverting(true);
    try {
      const conversion = await CurrencyService.convertCurrency(numAmount, fromCurrency, toCurrency);
      setResult(conversion);
    } catch (error) {
      console.error('Conversion error:', error);
      setResult(null);
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const timeoutId = setTimeout(handleConvert, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [amount, fromCurrency, toCurrency]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-base">Quick Currency Converter</CardTitle>
        <CardDescription>Convert between currencies with live rates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded"
              placeholder="100"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AOA">AOA</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="AOA">AOA</option>
            </select>
          </div>
        </div>

        {isConverting ? (
          <div className="text-center text-sm text-muted-foreground">Converting...</div>
        ) : result ? (
          <div className="text-center p-3 bg-muted rounded">
            <div className="text-lg font-medium">
              {formatCurrency(result.amount, { currency: toCurrency, showSymbol: true })}
            </div>
            <div className="text-xs text-muted-foreground">
              Rate: 1 {fromCurrency} = {result.rate.toFixed(6)} {toCurrency}
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Enter amount to convert
          </div>
        )}
      </CardContent>
    </Card>
  );
}