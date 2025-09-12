import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  subtitleColor: string;
  testId?: string;
}

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor, 
  iconBgColor, 
  subtitleColor,
  testId 
}: MetricCardProps) {
  return (
    <Card className="p-6 metric-card" data-testid={testId}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm" data-testid={`${testId}-title`}>{title}</p>
          <h3 className="text-2xl font-bold text-foreground" data-testid={`${testId}-value`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          <p className={cn("text-sm mt-1", subtitleColor)} data-testid={`${testId}-subtitle`}>
            {subtitle}
          </p>
        </div>
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBgColor)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
    </Card>
  );
}
