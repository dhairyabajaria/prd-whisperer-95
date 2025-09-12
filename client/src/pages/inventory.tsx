import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Plus, AlertTriangle, Calendar, MapPin, Hash, Pill } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema, type Inventory, type Product, type Warehouse, type InsertInventory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format, differenceInDays } from "date-fns";

interface InventoryWithProduct extends Inventory {
  product: Product;
}

export default function InventoryPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: inventory, isLoading, error } = useQuery<InventoryWithProduct[]>({
    queryKey: ["/api/inventory", selectedWarehouse === "all" ? undefined : selectedWarehouse],
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<InsertInventory>({
    resolver: zodResolver(insertInventorySchema),
    defaultValues: {
      productId: "",
      warehouseId: "",
      batchNumber: "",
      quantity: 0,
      manufactureDate: "",
      expiryDate: "",
      costPerUnit: "0",
    },
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (data: InsertInventory) => {
      const response = await apiRequest("POST", "/api/inventory", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInventory) => {
    createInventoryMutation.mutate(data);
  };

  const filteredInventory = inventory?.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    return differenceInDays(new Date(expiryDate), new Date());
  };

  const getExpiryStatus = (daysLeft: number | null) => {
    if (daysLeft === null) return { color: "bg-gray-100 text-gray-800", text: "No expiry" };
    if (daysLeft <= 0) return { color: "bg-red-100 text-red-800", text: "Expired" };
    if (daysLeft <= 30) return { color: "bg-red-100 text-red-800", text: `${daysLeft}d left` };
    if (daysLeft <= 90) return { color: "bg-orange-100 text-orange-800", text: `${daysLeft}d left` };
    return { color: "bg-green-100 text-green-800", text: `${daysLeft}d left` };
  };

  const getStockStatus = (quantity: number, minLevel: number = 10) => {
    if (quantity === 0) return { color: "bg-red-100 text-red-800", text: "Out of stock" };
    if (quantity <= minLevel) return { color: "bg-orange-100 text-orange-800", text: "Low stock" };
    return { color: "bg-green-100 text-green-800", text: "In stock" };
  };

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Inventory"
            subtitle="Manage pharmaceutical inventory with batch tracking and expiry management"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load inventory</h3>
                  <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Inventory"
          subtitle="Manage pharmaceutical inventory with batch tracking and expiry management"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-inventory">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products or batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-inventory"
                />
              </div>
              
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-48" data-testid="select-warehouse-filter">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses?.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground" data-testid="button-add-inventory">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Inventory
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-product">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} - {product.sku}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="warehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warehouse *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-warehouse">
                                  <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses?.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="batchNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batch Number</FormLabel>
                            <FormControl>
                              <Input placeholder="BT-2024-001" {...field} data-testid="input-batch-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} data-testid="input-quantity" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="manufactureDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manufacture Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-manufacture-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-expiry-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="costPerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Per Unit</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-cost-per-unit" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createInventoryMutation.isPending}
                        data-testid="button-submit-inventory"
                      >
                        {createInventoryMutation.isPending ? "Adding..." : "Add Item"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">
                      <Skeleton className="w-10 h-10 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </Card>
              ))
            ) : filteredInventory.length > 0 ? (
              filteredInventory.map((item) => {
                const daysLeft = getDaysUntilExpiry(item.expiryDate);
                const expiryStatus = getExpiryStatus(daysLeft);
                const stockStatus = getStockStatus(item.quantity, item.product.minStockLevel);
                
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid={`card-inventory-${item.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                            <Pill className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate" data-testid={`text-product-name-${item.id}`}>
                              {item.product.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground truncate" data-testid={`text-product-sku-${item.id}`}>
                              SKU: {item.product.sku}
                            </p>
                          </div>
                        </div>
                        <Badge className={stockStatus.color}>
                          {stockStatus.text}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Quantity</span>
                        <span className="font-medium" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity.toLocaleString()} units
                        </span>
                      </div>
                      
                      {item.batchNumber && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Hash className="w-4 h-4" />
                            <span>Batch</span>
                          </div>
                          <span className="text-sm font-mono" data-testid={`text-batch-${item.id}`}>
                            {item.batchNumber}
                          </span>
                        </div>
                      )}

                      {item.expiryDate && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Expiry</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm" data-testid={`text-expiry-date-${item.id}`}>
                              {format(new Date(item.expiryDate), 'MMM dd, yyyy')}
                            </div>
                            <Badge className={`text-xs ${expiryStatus.color}`} data-testid={`badge-expiry-status-${item.id}`}>
                              {expiryStatus.text}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {item.manufactureDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Manufactured</span>
                          <span className="text-sm" data-testid={`text-manufacture-date-${item.id}`}>
                            {format(new Date(item.manufactureDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      )}

                      {item.costPerUnit && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Cost/Unit</span>
                          <span className="text-sm font-medium" data-testid={`text-cost-per-unit-${item.id}`}>
                            ${parseFloat(item.costPerUnit).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Warning for expiring items */}
                      {daysLeft !== null && daysLeft <= 90 && daysLeft > 0 && (
                        <div className="flex items-start space-x-2 p-2 bg-orange-50 rounded-md border border-orange-200">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-orange-800">
                            <p className="font-medium">Expiring Soon</p>
                            <p>Consider prioritizing this batch for sales</p>
                          </div>
                        </div>
                      )}

                      {/* Critical warning for expired items */}
                      {daysLeft !== null && daysLeft <= 0 && (
                        <div className="flex items-start space-x-2 p-2 bg-red-50 rounded-md border border-red-200">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-red-800">
                            <p className="font-medium">Expired Product</p>
                            <p>Remove from active inventory immediately</p>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                        <span>Added {format(new Date(item.createdAt), 'MMM dd')}</span>
                        <Button size="sm" variant="outline" data-testid={`button-manage-${item.id}`}>
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm || selectedWarehouse !== "all" ? "No items found" : "No inventory items yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || selectedWarehouse !== "all"
                        ? "No items match your current filters. Try adjusting your search."
                        : "Get started by adding your first inventory item."
                      }
                    </p>
                    {!searchTerm && selectedWarehouse === "all" && (
                      <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-first-inventory">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Inventory Item
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
