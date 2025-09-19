import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Pill } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface ExpiringProduct {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
  batchNumber: string | null;
  quantity: number;
  expiryDate: string | null;
}

export default function ExpiryAlertsTable() {
  const { data: expiringProducts, isLoading, error } = useQuery<ExpiringProduct[]>({
    queryKey: ["/api/dashboard/expiring-products"],
  });

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    return differenceInDays(new Date(expiryDate), new Date());
  };

  const getStatusColor = (daysLeft: number | null) => {
    if (daysLeft === null) return "badge-expired-light";
    if (daysLeft <= 30) return "badge-error-light";
    if (daysLeft <= 60) return "badge-warning-light";
    return "badge-pending-light";
  };

  const getStatusText = (daysLeft: number | null) => {
    if (daysLeft === null) return "Unknown";
    if (daysLeft <= 0) return "Expired";
    return `${daysLeft} days left`;
  };

  if (error) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <AlertTriangle className="text-orange-500 mr-2" />
              Expiry Alerts (90 Day Window)
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load expiring products</p>
            <p className="text-sm text-destructive mt-1">Please check your connection and try again</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2" data-testid="card-expiry-alerts">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <AlertTriangle className="text-orange-500 mr-2 w-5 h-5" />
            Expiry Alerts (90 Day Window)
          </h3>
          <Button 
            variant="link" 
            className="text-primary hover:text-primary/80 text-sm p-0"
            data-testid="button-view-all-expiry"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto overflow-y-visible max-w-full">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Batch</th>
                <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Skeleton className="w-8 h-8 rounded mr-3" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))
              ) : expiringProducts && expiringProducts.length > 0 ? (
                expiringProducts.map((item) => {
                  const daysLeft = getDaysUntilExpiry(item.expiryDate);
                  const statusColor = getStatusColor(daysLeft);
                  const statusText = getStatusText(daysLeft);
                  
                  return (
                    <tr key={item.id} className="table-row" data-testid={`row-expiry-product-${item.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center mr-3">
                            <Pill className="text-primary text-xs w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground" data-testid={`text-product-name-${item.id}`}>
                              {item.product.name}
                            </p>
                            <p className="text-muted-foreground text-sm" data-testid={`text-product-sku-${item.id}`}>
                              SKU: {item.product.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground" data-testid={`text-batch-${item.id}`}>
                        {item.batchNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground" data-testid={`text-expiry-date-${item.id}`}>
                        {item.expiryDate ? format(new Date(item.expiryDate), 'yyyy-MM-dd') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground" data-testid={`text-quantity-${item.id}`}>
                        {item.quantity.toLocaleString()} units
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}
                              data-testid={`badge-status-${item.id}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="link"
                          className={`text-sm p-0 ${daysLeft !== null && daysLeft <= 30 ? 'text-destructive hover:text-destructive/80' : 'text-primary hover:text-primary/80'}`}
                          data-testid={`button-action-${item.id}`}
                        >
                          {daysLeft !== null && daysLeft <= 30 ? 'Urgent' : 'Mark Sale'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground">No products expiring in the next 90 days</p>
                      <p className="text-sm text-muted-foreground/70">All inventory is within safe expiry ranges</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
