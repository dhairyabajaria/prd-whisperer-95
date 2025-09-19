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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Package, Search, Plus, Edit, Trash2, Calendar, Factory, Hash, Pill, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type Product, type InsertProduct } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

export default function ProductsPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      category: "",
      manufacturer: "",
      unitPrice: "",
      minStockLevel: 0,
      requiresBatchTracking: true,
      shelfLifeDays: undefined,
      isActive: true,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await apiRequest("POST", "/api/products", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateModalOpen(false);
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Success",
        description: editingProduct ? "Product updated successfully" : "Product created successfully",
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
        description: editingProduct ? "Failed to update product" : "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProduct> }) => {
      const response = await apiRequest("PATCH", `/api/products/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateModalOpen(false);
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Success",
        description: "Product updated successfully",
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
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
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
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    // Clean up empty values - convert empty strings to undefined for optional fields
    const cleanedData: InsertProduct = {
      ...data,
      description: data.description?.trim() || undefined,
      category: data.category?.trim() || undefined,
      manufacturer: data.manufacturer?.trim() || undefined,
      unitPrice: data.unitPrice?.trim() || undefined,
      shelfLifeDays: data.shelfLifeDays || undefined,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: cleanedData });
    } else {
      createProductMutation.mutate(cleanedData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      category: product.category || "",
      manufacturer: product.manufacturer || "",
      unitPrice: product.unitPrice || "",
      minStockLevel: product.minStockLevel || 0,
      requiresBatchTracking: product.requiresBatchTracking ?? false,
      shelfLifeDays: product.shelfLifeDays || undefined,
      isActive: product.isActive ?? true,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories for filter
  const categories = Array.from(new Set(products?.map(p => p.category).filter(Boolean) || []));

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "N/A";
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getShelfLifeStatus = (shelfLifeDays: number | null) => {
    if (!shelfLifeDays) return { icon: Clock, color: "text-muted-foreground", text: "No expiry" };
    if (shelfLifeDays <= 90) return { icon: AlertTriangle, color: "text-[var(--status-error-fg)]", text: `${shelfLifeDays} days` };
    if (shelfLifeDays <= 365) return { icon: Clock, color: "text-[var(--status-warning-fg)]", text: `${shelfLifeDays} days` };
    return { icon: CheckCircle, color: "text-[var(--status-success-fg)]", text: `${shelfLifeDays} days` };
  };

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Products"
            subtitle="Manage pharmaceutical products with batch tracking and expiry management"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load products</h3>
                  <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
        <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Products"
          subtitle="Manage pharmaceutical products with batch tracking and expiry management"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    data-testid="input-search-products"
                    placeholder="Search products, SKU, or manufacturer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter" className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category!}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    data-testid="button-create-product"
                    onClick={() => {
                      setEditingProduct(null);
                      form.reset();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "Edit Product" : "Create New Product"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name *</FormLabel>
                              <FormControl>
                                <Input data-testid="input-product-name" placeholder="e.g., Paracetamol 500mg" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU *</FormLabel>
                              <FormControl>
                                <Input data-testid="input-product-sku" placeholder="e.g., PARA-500" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                data-testid="textarea-product-description"
                                placeholder="Product description..."
                                className="min-h-[80px]"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <FormControl>
                                <Input data-testid="input-product-category" placeholder="e.g., Analgesics" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="manufacturer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Manufacturer</FormLabel>
                              <FormControl>
                                <Input data-testid="input-product-manufacturer" placeholder="e.g., PharmaCorp" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-product-price"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="minStockLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min Stock Level</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-product-min-stock"
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shelfLifeDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shelf Life (Days)</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-product-shelf-life"
                                  type="number"
                                  placeholder="365"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="requiresBatchTracking"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Requires Batch Tracking</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Enable batch and lot number tracking
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  data-testid="switch-batch-tracking"
                                  checked={field.value ?? false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Active Product</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Product is available for operations
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  data-testid="switch-product-active"
                                  checked={field.value ?? true}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          data-testid="button-cancel-product"
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setIsCreateModalOpen(false);
                            setEditingProduct(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          data-testid="button-save-product"
                          type="submit"
                          disabled={createProductMutation.isPending || updateProductMutation.isPending}
                        >
                          {createProductMutation.isPending || updateProductMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                           editingProduct ? "Update Product" : "Create Product"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No products found</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {searchTerm || categoryFilter !== "all" 
                        ? "Try adjusting your search or filters"
                        : "Get started by creating your first product"
                      }
                    </p>
                    {!searchTerm && categoryFilter === "all" && (
                      <Button 
                        data-testid="button-create-first-product"
                        onClick={() => {
                          setEditingProduct(null);
                          form.reset();
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Product
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const shelfLifeStatus = getShelfLifeStatus(product.shelfLifeDays);
                  
                  return (
                    <Card key={product.id} data-testid={`card-product-${product.id}`} className="hover:shadow-md transition-shadow border-l-4 border-l-[var(--product-bg)] bg-[var(--product-bg-light)]/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2 text-[var(--product-fg)] font-semibold">{product.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge data-testid={`badge-sku-${product.id}`} className="badge-product-light text-xs">
                                <Hash className="h-3 w-3 mr-1" />
                                {product.sku}
                              </Badge>
                              {!product.isActive && (
                                <Badge className="badge-error-light text-xs">Inactive</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              data-testid={`button-edit-${product.id}`}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              data-testid={`button-delete-${product.id}`}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {product.category && (
                            <div className="flex items-center gap-2">
                              <Pill className="h-4 w-4 text-muted-foreground" />
                              <span data-testid={`text-category-${product.id}`} className="truncate">{product.category}</span>
                            </div>
                          )}
                          
                          {product.manufacturer && (
                            <div className="flex items-center gap-2">
                              <Factory className="h-4 w-4 text-muted-foreground" />
                              <span data-testid={`text-manufacturer-${product.id}`} className="truncate">{product.manufacturer}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Unit Price</div>
                            <div data-testid={`text-price-${product.id}`} className="font-medium">
                              {formatCurrency(product.unitPrice)}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-muted-foreground">Min Stock</div>
                            <div data-testid={`text-min-stock-${product.id}`} className="font-medium">
                              {product.minStockLevel || 0}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Batch Tracking</div>
                            <div className="flex items-center gap-1">
                              {product.requiresBatchTracking ? (
                                <>
                                  <CheckCircle className="h-3 w-3 text-[var(--status-success-fg)]" />
                                  <span className="text-[var(--status-success-fg)]">Enabled</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-3 w-3 text-[var(--status-warning-fg)]" />
                                  <span className="text-[var(--status-warning-fg)]">Disabled</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-muted-foreground">Shelf Life</div>
                            <div className="flex items-center gap-1">
                              <shelfLifeStatus.icon className={`h-3 w-3 ${shelfLifeStatus.color}`} />
                              <span data-testid={`text-shelf-life-${product.id}`} className={shelfLifeStatus.color}>
                                {shelfLifeStatus.text}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          Created: {format(new Date(product.createdAt!), "MMM dd, yyyy")}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}