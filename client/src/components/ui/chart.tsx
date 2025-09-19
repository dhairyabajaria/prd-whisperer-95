import * as React from "react"
import * as RechartsPrimitive from "recharts"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { Download, FileImage, FileText, Database, ChevronRight, Home, ArrowUp, ArrowDown, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Badge } from "./badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./breadcrumb"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

// Enhanced chart types
export type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'gauge' | 'scatter'

// Drill-down state management
export interface DrillDownLevel {
  id: string
  label: string
  data: any[]
  parentId?: string
}

export interface ChartDrillDownState {
  levels: DrillDownLevel[]
  currentLevel: number
  onDrillDown?: (data: any, level: DrillDownLevel) => void
  onDrillUp?: () => void
}

// Comparison types
export type ComparisonPeriod = 'none' | 'yoy' | 'mom' | 'wow' | 'dod'

export interface ComparisonData {
  current: number
  previous: number
  change: number
  changePercentage: number
  trend: 'up' | 'down' | 'stable'
}

// Export options
export interface ChartExportOptions {
  enableExport?: boolean
  filename?: string
  formats?: Array<'png' | 'pdf' | 'csv'>
  onExport?: (format: string, data: any) => void
}

// Responsive breakpoints
export const CHART_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export type ResponsiveConfig = {
  [K in keyof typeof CHART_BREAKPOINTS]?: {
    height?: number
    aspectRatio?: string
    fontSize?: string
    margin?: { top?: number; right?: number; bottom?: number; left?: number }
  }
}

type ChartContextProps = {
  config: ChartConfig
  drillDown?: ChartDrillDownState
  comparison?: ComparisonData
  comparisonPeriod?: ComparisonPeriod
  exportOptions?: ChartExportOptions
  responsiveConfig?: ResponsiveConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    drillDown?: ChartDrillDownState
    comparison?: ComparisonData
    comparisonPeriod?: ComparisonPeriod
    exportOptions?: ChartExportOptions
    responsiveConfig?: ResponsiveConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ 
  id, 
  className, 
  children, 
  config, 
  drillDown,
  comparison,
  comparisonPeriod = 'none',
  exportOptions,
  responsiveConfig,
  ...props 
}, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  // Responsive sizing
  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height: width * 0.5625 }) // 16:9 aspect ratio default
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Get responsive configuration based on screen size
  const getResponsiveConfig = () => {
    if (!responsiveConfig) return {}
    
    const width = dimensions.width
    if (width >= CHART_BREAKPOINTS.xl) return responsiveConfig.xl || {}
    if (width >= CHART_BREAKPOINTS.lg) return responsiveConfig.lg || {}
    if (width >= CHART_BREAKPOINTS.md) return responsiveConfig.md || {}
    if (width >= CHART_BREAKPOINTS.sm) return responsiveConfig.sm || {}
    return {}
  }

  const responsiveStyles = getResponsiveConfig()

  return (
    <ChartContext.Provider value={{ 
      config,
      drillDown,
      comparison,
      comparisonPeriod,
      exportOptions,
      responsiveConfig
    }}>
      <div className="space-y-4">
        {/* Drill-down breadcrumbs */}
        {drillDown && drillDown.levels.length > 1 && (
          <ChartBreadcrumbs drillDown={drillDown} />
        )}
        
        {/* Comparison period selector and export controls */}
        <div className="flex items-center justify-between">
          {comparisonPeriod !== 'none' && comparison && (
            <ChartComparisonIndicator comparison={comparison} period={comparisonPeriod} />
          )}
          
          <div className="flex items-center gap-2">
            {exportOptions?.enableExport && (
              <ChartExportControls 
                chartId={chartId} 
                options={exportOptions}
                containerRef={containerRef}
              />
            )}
          </div>
        </div>

        {/* Main chart container */}
        <div
          ref={containerRef}
          data-chart={chartId}
          className={cn(
            "flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
            responsiveStyles.aspectRatio ? `aspect-[${responsiveStyles.aspectRatio}]` : "aspect-video",
            className
          )}
          style={{
            fontSize: responsiveStyles.fontSize,
            height: responsiveStyles.height,
          }}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
      showPercentage?: boolean
      showTrend?: boolean
      showComparison?: boolean
      currencyFormatter?: (value: number) => string
      percentageFormatter?: (value: number) => string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      showPercentage = false,
      showTrend = false,
      showComparison = false,
      currencyFormatter,
      percentageFormatter,
    },
    ref
  ) => {
    const { config, comparison, comparisonPeriod } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      <div className="text-right">
                        {item.value && (
                          <div className="space-y-1">
                            <span className="font-mono font-medium tabular-nums text-foreground block">
                              {currencyFormatter ? currencyFormatter(item.value) : item.value.toLocaleString()}
                            </span>
                            
                            {/* Show percentage if requested and total available */}
                            {showPercentage && item.payload?.total && (
                              <span className="text-xs text-muted-foreground block">
                                {percentageFormatter 
                                  ? percentageFormatter((item.value / item.payload.total) * 100)
                                  : `${((item.value / item.payload.total) * 100).toFixed(1)}%`
                                }
                              </span>
                            )}
                            
                            {/* Show trend if requested */}
                            {showTrend && item.payload?.trend && (
                              <div className="flex items-center text-xs">
                                {item.payload.trend.direction === 'up' && <ArrowUp className="h-3 w-3 text-green-600 mr-1" />}
                                {item.payload.trend.direction === 'down' && <ArrowDown className="h-3 w-3 text-red-600 mr-1" />}
                                {item.payload.trend.direction === 'stable' && <Minus className="h-3 w-3 text-gray-600 mr-1" />}
                                <span className={cn(
                                  item.payload.trend.direction === 'up' ? 'text-green-600' :
                                  item.payload.trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                                )}>
                                  {item.payload.trend.changePercentage?.toFixed(1)}%
                                </span>
                              </div>
                            )}
                            
                            {/* Show comparison if requested */}
                            {showComparison && comparison && comparisonPeriod !== 'none' && (
                              <div className="text-xs text-muted-foreground">
                                vs {comparisonPeriod.toUpperCase()}: {comparison.changePercentage > 0 ? '+' : ''}{comparison.changePercentage.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

// Breadcrumbs component for drill-down navigation
const ChartBreadcrumbs = ({ drillDown }: { drillDown: ChartDrillDownState }) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault()
              if (drillDown.onDrillUp) {
                // Go to root level
                for (let i = drillDown.currentLevel; i > 0; i--) {
                  drillDown.onDrillUp()
                }
              }
            }}
            className="flex items-center"
          >
            <Home className="h-3 w-3 mr-1" />
            Overview
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {drillDown.levels.slice(1, drillDown.currentLevel + 1).map((level, index) => (
          <React.Fragment key={level.id}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {index < drillDown.currentLevel - 1 ? (
                <BreadcrumbLink 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    if (drillDown.onDrillUp) {
                      for (let i = drillDown.currentLevel; i > index + 1; i--) {
                        drillDown.onDrillUp()
                      }
                    }
                  }}
                >
                  {level.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{level.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

// Comparison indicator component
const ChartComparisonIndicator = ({ 
  comparison, 
  period 
}: { 
  comparison: ComparisonData
  period: ComparisonPeriod
}) => {
  const getTrendIcon = () => {
    switch (comparison.trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (comparison.trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'yoy': return 'vs Last Year'
      case 'mom': return 'vs Last Month'
      case 'wow': return 'vs Last Week'
      case 'dod': return 'vs Yesterday'
      default: return ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={period}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Comparison</SelectItem>
          <SelectItem value="yoy">Year over Year</SelectItem>
          <SelectItem value="mom">Month over Month</SelectItem>
          <SelectItem value="wow">Week over Week</SelectItem>
          <SelectItem value="dod">Day over Day</SelectItem>
        </SelectContent>
      </Select>
      
      <Badge variant="outline" className="flex items-center gap-1">
        {getTrendIcon()}
        <span className={getTrendColor()}>
          {comparison.changePercentage > 0 ? '+' : ''}{comparison.changePercentage.toFixed(1)}%
        </span>
        <span className="text-muted-foreground">{getPeriodLabel()}</span>
      </Badge>
    </div>
  )
}

// Export controls component
const ChartExportControls = ({ 
  chartId, 
  options, 
  containerRef 
}: {
  chartId: string
  options: ChartExportOptions
  containerRef: React.RefObject<HTMLDivElement>
}) => {
  const exportToPNG = async () => {
    if (!containerRef.current) return
    
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })
      
      const link = document.createElement('a')
      link.download = `${options.filename || 'chart'}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      options.onExport?.('png', canvas)
    } catch (error) {
      console.error('Failed to export PNG:', error)
    }
  }

  const exportToPDF = async () => {
    if (!containerRef.current) return
    
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })
      
      const pdf = new jsPDF()
      const imgData = canvas.toDataURL('image/png')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${options.filename || 'chart'}.pdf`)
      
      options.onExport?.('pdf', pdf)
    } catch (error) {
      console.error('Failed to export PDF:', error)
    }
  }

  const exportToCSV = () => {
    // This would need chart data passed in - simplified for now
    const csvContent = "data:text/csv;charset=utf-8,\n"
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `${options.filename || 'chart'}.csv`)
    link.click()
    
    options.onExport?.('csv', csvContent)
  }

  const availableFormats = options.formats || ['png', 'pdf', 'csv']

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-export-chart">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableFormats.includes('png') && (
          <DropdownMenuItem onClick={exportToPNG} data-testid="button-export-png">
            <FileImage className="h-4 w-4 mr-2" />
            Export as PNG
          </DropdownMenuItem>
        )}
        {availableFormats.includes('pdf') && (
          <DropdownMenuItem onClick={exportToPDF} data-testid="button-export-pdf">
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        )}
        {availableFormats.includes('csv') && (
          <DropdownMenuItem onClick={exportToCSV} data-testid="button-export-csv">
            <Database className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// New chart type components

// Donut Chart Component
export const ChartDonut = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.PieChart> & {
    data: any[]
    config: ChartConfig
    innerRadius?: number
    outerRadius?: number
    centerContent?: React.ReactNode
  }
>(({ data, config, innerRadius = 60, outerRadius = 80, centerContent, ...props }, ref) => {
  return (
    <div ref={ref} className="relative">
      <RechartsPrimitive.PieChart {...props}>
        <RechartsPrimitive.Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <RechartsPrimitive.Cell 
              key={`cell-${index}`} 
              fill={`var(--color-${entry.name || entry.key || `item-${index}`})`} 
            />
          ))}
        </RechartsPrimitive.Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
      </RechartsPrimitive.PieChart>
      
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {centerContent}
        </div>
      )}
    </div>
  )
})
ChartDonut.displayName = "ChartDonut"

// Gauge Chart Component (using RadialBarChart)
export const ChartGauge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.RadialBarChart> & {
    value: number
    max?: number
    min?: number
    label?: string
    color?: string
  }
>(({ value, max = 100, min = 0, label, color = "var(--chart-1)", ...props }, ref) => {
  const percentage = ((value - min) / (max - min)) * 100
  const data = [{ value: percentage, max: 100 }]

  return (
    <div ref={ref} className="relative">
      <RechartsPrimitive.RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="80%"
        barSize={10}
        data={data}
        startAngle={180}
        endAngle={0}
        {...props}
      >
        <RechartsPrimitive.RadialBar
          minAngle={15}
          clockWise
          dataKey="value"
          cornerRadius={5}
          fill={color}
        />
      </RechartsPrimitive.RadialBarChart>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">{value}</div>
        {label && <div className="text-sm text-muted-foreground">{label}</div>}
        <div className="text-xs text-muted-foreground">of {max}</div>
      </div>
    </div>
  )
})
ChartGauge.displayName = "ChartGauge"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartBreadcrumbs,
  ChartComparisonIndicator,
  ChartExportControls,
}
