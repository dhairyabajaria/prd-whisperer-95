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
import { Switch } from "@/components/ui/switch";
import { Warehouse, Search, Plus, Edit, Trash2, MapPin, Package, Gauge, Building } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWarehouseSchema, type Warehouse as WarehouseType, type InsertWarehouse } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

const WAREHOUSE_TYPES = [
  { value: "standard", label: "Standard Warehouse" },
  { value: "cold_storage", label: "Cold Storage" },
  { value: "controlled_temperature", label: "Controlled Temperature" },
  { value: "hazardous", label: "Hazardous Materials" },
  { value: "distribution_center", label: "Distribution Center" },
  { value: "pharmacy", label: "Pharmacy Storage" },
];

export default function WarehousesPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const { toast } = useToast();

  const { data: warehouses, isLoading, error } = useQuery<WarehouseType[]>({
    queryKey: ["/api/warehouses"],
  });

  const form = useForm<InsertWarehouse>({
    resolver: zodResolver(insertWarehouseSchema),
    defaultValues: {
      name: "",
      location: "",
      type: "standard",
      capacity: null,
      isActive: true,
    },
  });

  const createWarehouseMutation = useMutation({
    mutationFn: async (data: InsertWarehouse) => {
      const response = await apiRequest("POST", "/api/warehouses", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setIsCreateModalOpen(false);
      setEditingWarehouse(null);
      form.reset();
      toast({
        title: "Success",
        description: editingWarehouse ? "Warehouse updated successfully" : "Warehouse created successfully",
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
        description: editingWarehouse ? "Failed to update warehouse" : "Failed to create warehouse",
        variant: "destructive",
      });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertWarehouse> }) => {
      const response = await apiRequest("PATCH", `/api/warehouses/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setIsCreateModalOpen(false);
      setEditingWarehouse(null);
      form.reset();
      toast({
        title: "Success",
        description: "Warehouse updated successfully",
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
        description: "Failed to update warehouse",
        variant: "destructive",
      });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/warehouses/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse deleted successfully",
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
        description: "Failed to delete warehouse",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWarehouse) => {
    // Clean up empty values
    const cleanedData = {
      ...data,
      location: data.location || null,
      type: data.type || null,
      capacity: data.capacity || null,
    };

    if (editingWarehouse) {
      updateWarehouseMutation.mutate({ id: editingWarehouse.id, data: cleanedData });
    } else {
      createWarehouseMutation.mutate(cleanedData);
    }
  };

  const handleEdit = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse);
    form.reset({
      name: warehouse.name,
      location: warehouse.location || "",
      type: warehouse.type || "standard",
      capacity: warehouse.capacity || null,
      isActive: warehouse.isActive ?? true,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (warehouse: WarehouseType) => {
    if (confirm(`Are you sure you want to delete "${warehouse.name}"?`)) {
      deleteWarehouseMutation.mutate(warehouse.id);
    }
  };

  const filteredWarehouses = warehouses?.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || warehouse.type === typeFilter;
    
    return matchesSearch && matchesType;
  }) || [];

  // Get unique types for filter
  const types = Array.from(new Set(warehouses?.map(w => w.type).filter(Boolean) || []));

  const getWarehouseTypeLabel = (type: string | null) => {
    if (!type) return "Standard";
    const warehouseType = WAREHOUSE_TYPES.find(t => t.value === type);
    return warehouseType?.label || type;
  };

  const formatCapacity = (capacity: number | null) => {
    if (!capacity) return "N/A";
    return new Intl.NumberFormat('en-US').format(capacity) + " units";
  };

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Warehouses"
            subtitle="Manage warehouse locations and storage facilities"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Warehouse className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load warehouses</h3>
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
          title="Warehouses"
          subtitle="Manage warehouse locations and storage facilities"
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
                    data-testid="input-search-warehouses"
                    placeholder="Search warehouses or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter" className="w-full sm:w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map(type => (
                      <SelectItem key={type} value={type!}>{getWarehouseTypeLabel(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    data-testid="button-create-warehouse"
                    onClick={() => {
                      setEditingWarehouse(null);
                      form.reset();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warehouse
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingWarehouse ? "Edit Warehouse" : "Create New Warehouse"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warehouse Name *</FormLabel>
                            <FormControl>
                              <Input data-testid="input-warehouse-name" placeholder="e.g., Main Warehouse" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input data-testid="input-warehouse-location" placeholder="e.g., Luanda, Angola" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Warehouse Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-warehouse-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {WAREHOUSE_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capacity (units)</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-warehouse-capacity"
                                  type="number"
                                  placeholder="10000"
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

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active Warehouse</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Warehouse is available for operations
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                data-testid="switch-warehouse-active"
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          data-testid="button-cancel-warehouse"
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setIsCreateModalOpen(false);
                            setEditingWarehouse(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          data-testid="button-save-warehouse"
                          type="submit"
                          disabled={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
                        >
                          {createWarehouseMutation.isPending || updateWarehouseMutation.isPending ? "Saving..." : 
                           editingWarehouse ? "Update Warehouse" : "Create Warehouse"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Warehouses Grid */}
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
            ) : filteredWarehouses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Warehouse className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No warehouses found</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {searchTerm || typeFilter !== "all" 
                        ? "Try adjusting your search or filters"
                        : "Get started by creating your first warehouse"
                      }
                    </p>
                    {!searchTerm && typeFilter === "all" && (
                      <Button 
                        data-testid="button-create-first-warehouse"
                        onClick={() => {
                          setEditingWarehouse(null);
                          form.reset();
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Warehouse
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWarehouses.map((warehouse) => (
                  <Card key={warehouse.id} data-testid={`card-warehouse-${warehouse.id}`} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{warehouse.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge data-testid={`badge-type-${warehouse.id}`} variant="secondary" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              {getWarehouseTypeLabel(warehouse.type)}
                            </Badge>
                            {!warehouse.isActive && (
                              <Badge variant="destructive" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            data-testid={`button-edit-${warehouse.id}`}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(warehouse)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            data-testid={`button-delete-${warehouse.id}`}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(warehouse)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {warehouse.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span data-testid={`text-location-${warehouse.id}`} className="truncate">{warehouse.location}</span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Capacity</div>
                          <div data-testid={`text-capacity-${warehouse.id}`} className="font-medium flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {formatCapacity(warehouse.capacity)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-muted-foreground">Type</div>
                          <div data-testid={`text-type-${warehouse.id}`} className="font-medium flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {getWarehouseTypeLabel(warehouse.type)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Created: {format(new Date(warehouse.createdAt!), "MMM dd, yyyy")}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}