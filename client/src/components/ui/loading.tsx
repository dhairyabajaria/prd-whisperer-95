import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// SPINNER LOADERS
// =============================================================================

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const spinnerSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4", 
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12"
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2 
      className={cn("animate-spin", spinnerSizes[size], className)} 
      data-testid="loading-spinner"
    />
  );
}

// =============================================================================
// BUTTON LOADING STATES
// =============================================================================

interface ButtonLoadingProps {
  text?: string;
  loadingText?: string;
  isLoading?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  children?: React.ReactNode;
  className?: string;
}

export function ButtonLoading({ 
  text = "Submit", 
  loadingText = "Loading...", 
  isLoading = false, 
  size = "sm",
  children,
  className 
}: ButtonLoadingProps) {
  if (children) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {isLoading && <Spinner size={size} />}
        <span>{children}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {isLoading && <Spinner size={size} />}
      <span>{isLoading ? loadingText : text}</span>
    </div>
  );
}

// =============================================================================
// CONTENT PLACEHOLDERS
// =============================================================================

interface ContentSkeletonProps {
  lines?: number;
  className?: string;
  showAvatar?: boolean;
  showTitle?: boolean;
}

export function ContentSkeleton({ 
  lines = 3, 
  className, 
  showAvatar = false, 
  showTitle = false 
}: ContentSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} data-testid="content-skeleton">
      {(showAvatar || showTitle) && (
        <div className="flex items-center space-x-3">
          {showAvatar && <Skeleton className="w-10 h-10 rounded-full" />}
          {showTitle && (
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton 
            key={index} 
            className={cn(
              "h-4",
              index === lines - 1 ? "w-3/4" : "w-full"
            )} 
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// FORM LOADING STATES
// =============================================================================

interface FormSkeletonProps {
  fields?: number;
  showButtons?: boolean;
  className?: string;
}

export function FormSkeleton({ 
  fields = 4, 
  showButtons = true, 
  className 
}: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)} data-testid="form-skeleton">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {showButtons && (
        <div className="flex space-x-3 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LIST & GRID LOADING STATES
// =============================================================================

interface ListSkeletonProps {
  items?: number;
  showBorder?: boolean;
  className?: string;
}

export function ListSkeleton({ 
  items = 5, 
  showBorder = true, 
  className 
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} data-testid="list-skeleton">
      {Array.from({ length: items }).map((_, index) => (
        <div 
          key={index}
          className={cn(
            "flex items-center space-x-4 p-4 rounded-lg",
            showBorder && "border border-border"
          )}
        >
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

interface GridSkeletonProps {
  items?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function GridSkeleton({ 
  items = 6, 
  columns = 3, 
  className 
}: GridSkeletonProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div 
      className={cn("grid gap-6", gridCols[columns], className)}
      data-testid="grid-skeleton"
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="border border-border rounded-lg p-4 space-y-4">
          <Skeleton className="w-full h-32 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// SPECIALIZED COMPONENT LOADERS
// =============================================================================

interface MetricCardSkeletonProps {
  count?: number;
  className?: string;
}

export function MetricCardSkeleton({ count = 4, className }: MetricCardSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="w-5 h-5 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ChartSkeletonProps {
  height?: string;
  className?: string;
  showLegend?: boolean;
}

export function ChartSkeleton({ 
  height = "h-64", 
  className,
  showLegend = false 
}: ChartSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)} data-testid="chart-skeleton">
      <Skeleton className={cn("w-full rounded", height)} />
      {showLegend && (
        <div className="flex items-center justify-center space-x-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PAGE LOADING STATES
// =============================================================================

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8 p-6", className)} data-testid="page-skeleton">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Metrics */}
      <MetricCardSkeleton />
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton showLegend />
        </div>
        <div className="space-y-4">
          <ContentSkeleton lines={4} showTitle />
          <ListSkeleton items={3} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LOADING OVERLAY
// =============================================================================

interface LoadingOverlayProps {
  isLoading?: boolean;
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({ 
  isLoading = true, 
  text = "Loading...", 
  size = "md",
  className,
  children 
}: LoadingOverlayProps) {
  if (!isLoading && !children) return null;

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center space-y-4 p-8",
        className
      )}
      data-testid="loading-overlay"
    >
      {isLoading ? (
        <>
          <Spinner size={size} />
          <p className="text-muted-foreground text-sm">{text}</p>
        </>
      ) : (
        children
      )}
    </div>
  );
}

// =============================================================================
// BOUNCING DOTS (for AI/chat interfaces)
// =============================================================================

export function BouncingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)} data-testid="bouncing-dots">
      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  );
}