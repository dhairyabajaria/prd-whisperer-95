import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, RefreshCw, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  SUPPORTED_CURRENCIES, 
  CurrencyCode, 
  CurrencyService, 
  formatCurrency,
  getCurrencyInfo,
  type FxRate 
} from "@/lib/currencyUtils";

interface CurrencySelectorProps {
  value?: CurrencyCode;
  onValueChange: (currency: CurrencyCode) => void;
  placeholder?: string;
  disabled?: boolean;
  showRates?: boolean;
  baseCurrency?: CurrencyCode;
  compact?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function CurrencySelector({
  value,
  onValueChange,
  placeholder = "Select currency...",
  disabled = false,
  showRates = false,
  baseCurrency = "USD",
  compact = false,
  className,
  "data-testid": testId,
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Fetch FX rates if showRates is enabled
  const { data: fxRates, refetch: refetchRates, isLoading: ratesLoading } = useQuery<FxRate[]>({
    queryKey: ["/api/fx/rates", baseCurrency],
    enabled: showRates && !!baseCurrency,
  });

  // Create rate lookup for quick access
  const rateMap = new Map<string, number>();
  if (fxRates) {
    fxRates.forEach(rate => {
      if (rate.baseCurrency === baseCurrency) {
        rateMap.set(rate.quoteCurrency, parseFloat(rate.rate));
      }
    });
  }

  // Filter currencies based on search
  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(currency => {
    const searchTerm = searchValue.toLowerCase();
    return (
      currency.code.toLowerCase().includes(searchTerm) ||
      currency.name.toLowerCase().includes(searchTerm) ||
      currency.symbol.toLowerCase().includes(searchTerm)
    );
  });

  const selectedCurrency = value ? getCurrencyInfo(value) : null;

  const handleRefreshRates = async () => {
    if (showRates) {
      await refetchRates();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal",
            compact ? "h-9 px-3" : "h-10 px-3",
            className
          )}
          disabled={disabled}
          data-testid={testId}
        >
          <div className="flex items-center gap-2">
            {selectedCurrency ? (
              <>
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">{selectedCurrency.symbol}</span>
                {!compact && (
                  <>
                    <span>{selectedCurrency.code}</span>
                    <span className="text-muted-foreground">
                      {selectedCurrency.name}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search currencies..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>No currency found.</CommandEmpty>
          <CommandGroup>
            {showRates && (
              <>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm font-medium">Exchange Rates (base: {baseCurrency})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshRates}
                    disabled={ratesLoading}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={cn("h-3 w-3", ratesLoading && "animate-spin")} />
                  </Button>
                </div>
                <Separator />
              </>
            )}
            {filteredCurrencies.map((currency) => {
              const rate = rateMap.get(currency.code);
              const isSelected = value === currency.code;
              const isBaseCurrency = baseCurrency === currency.code;
              
              return (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={(selectedValue) => {
                    onValueChange(selectedValue as CurrencyCode);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium w-8">
                        {currency.symbol}
                      </span>
                      <span className="font-medium">{currency.code}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {currency.name}
                    </span>
                    {isBaseCurrency && (
                      <Badge variant="secondary" className="text-xs">
                        Base
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {showRates && rate && !isBaseCurrency && (
                      <Badge variant="outline" className="text-xs">
                        {rate.toFixed(rate >= 1 ? 2 : 6)}
                      </Badge>
                    )}
                    {isSelected && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Currency display component for showing formatted amounts
interface CurrencyDisplayProps {
  amount: number | string;
  currency: CurrencyCode;
  showCode?: boolean;
  showConversion?: boolean;
  baseCurrency?: CurrencyCode;
  className?: string;
  "data-testid"?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  showCode = false,
  showConversion = false,
  baseCurrency = "USD",
  className,
  "data-testid": testId,
}: CurrencyDisplayProps) {
  const [conversion, setConversion] = useState<{amount: number; rate: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showConversion && currency !== baseCurrency) {
      setIsLoading(true);
      CurrencyService.convertCurrency(
        typeof amount === 'string' ? parseFloat(amount) : amount,
        currency,
        baseCurrency
      ).then(result => {
        setConversion(result);
        setIsLoading(false);
      }).catch(() => {
        setConversion(null);
        setIsLoading(false);
      });
    }
  }, [amount, currency, baseCurrency, showConversion]);

  const primaryAmount = formatCurrency(amount, { 
    currency, 
    showCode,
    showSymbol: true 
  });

  return (
    <div className={cn("flex flex-col", className)} data-testid={testId}>
      <span className="font-medium">{primaryAmount}</span>
      {showConversion && currency !== baseCurrency && (
        <span className="text-xs text-muted-foreground">
          {isLoading ? (
            "Converting..."
          ) : conversion ? (
            `≈ ${formatCurrency(conversion.amount, { currency: baseCurrency, showSymbol: true })}`
          ) : (
            "Conversion unavailable"
          )}
        </span>
      )}
    </div>
  );
}

// Currency input component with validation
interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  currency: CurrencyCode;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  "data-testid"?: string;
}

export function CurrencyInput({
  value,
  onChange,
  currency,
  placeholder = "0.00",
  disabled = false,
  error,
  className,
  "data-testid": testId,
}: CurrencyInputProps) {
  const currencyInfo = getCurrencyInfo(currency);
  const symbol = currencyInfo?.symbol || currency;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow only numbers, decimal point, and formatting characters
    const cleaned = inputValue.replace(/[^\d.,]/g, '');
    
    // Handle decimal point formatting
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // Only allow one decimal point
      const formatted = parts[0] + '.' + parts.slice(1).join('');
      onChange(formatted);
    } else {
      onChange(cleaned);
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        {symbol}
      </div>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          symbol.length > 1 ? "pl-12" : "pl-8",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        data-testid={testId}
      />
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}