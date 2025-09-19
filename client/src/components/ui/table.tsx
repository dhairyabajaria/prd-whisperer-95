import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-x-auto overflow-y-visible">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-table-cell", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 text-table-header [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle text-table-header font-semibold text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle text-table-cell [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-form-hint text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Skeleton Components for Table Loading States
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  headers?: string[];
  cellWidths?: string[];
  showActions?: boolean;
  className?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  headers,
  cellWidths = ["w-1/4", "w-1/4", "w-1/4", "w-1/4"],
  showActions = false,
  className 
}: TableSkeletonProps) {
  const actualColumns = headers ? headers.length : columns;
  const adjustedCellWidths = cellWidths.slice(0, actualColumns);
  
  // Ensure we have enough cell widths
  while (adjustedCellWidths.length < actualColumns) {
    adjustedCellWidths.push("w-1/4");
  }

  return (
    <div className={cn("relative w-full overflow-x-auto overflow-y-visible", className)}>
      <table className="w-full caption-bottom text-table-cell">
        <TableHeader>
          <TableRow>
            {headers ? (
              headers.map((header, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-3/4" />
                </TableHead>
              ))
            ) : (
              Array.from({ length: actualColumns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-3/4" />
                </TableHead>
              ))
            )}
            {showActions && (
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {adjustedCellWidths.map((width, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className={cn("h-4", width)} />
                </TableCell>
              ))}
              {showActions && (
                <TableCell>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  );
}

// Specialized skeleton for card-based table layouts
interface TableCardSkeletonProps {
  rows?: number;
  className?: string;
}

export function TableCardSkeleton({ rows = 5, className }: TableCardSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div 
          key={index} 
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
