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
import { Building2, Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Globe, Calendar, CreditCard, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema, type Supplier, type InsertSupplier } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA" },
];

const COUNTRIES = [
  "Angola", "South Africa", "Nigeria", "Ghana", "Kenya", "United States", 
  "United Kingdom", "Germany", "France", "India", "China", "Brazil"
];

export default function SuppliersPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  const { data: suppliers, isLoading, error } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      country: "",
      creditDays: 30,
      currency: "USD",
      isActive: true,
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateModalOpen(false);
      setEditingSupplier(null);
      form.reset();
      toast({
        title: "Success",
        description: editingSupplier ? "Supplier updated successfully" : "Supplier created successfully",
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
        description: editingSupplier ? "Failed to update supplier" : "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSupplier> }) => {
      const response = await apiRequest("PATCH", `/api/suppliers/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateModalOpen(false);
      setEditingSupplier(null);
      form.reset();
      toast({
        title: "Success",
        description: "Supplier updated successfully",
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
        description: "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/suppliers/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
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
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSupplier) => {
    // Clean up empty values
    const cleanedData = {
      ...data,
       email: data.email || undefined,
       phone: data.phone || undefined,
       address: data.address || null,
       country: data.country || undefined,
       creditDays: data.creditDays || 0,
       currency: data.currency || "USD",
    };

    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data: cleanedData });
    } else {
      createSupplierMutation.mutate(cleanedData);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      country: supplier.country || "",
      creditDays: supplier.creditDays || 30,
      currency: supplier.currency || "USD",
      isActive: supplier.isActive ?? true,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      deleteSupplierMutation.mutate(supplier.id);
    }
  };

  const filteredSuppliers = suppliers?.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCountry = countryFilter === "all" || supplier.country === countryFilter;
    
    return matchesSearch && matchesCountry;
  }) || [];

  // Get unique countries for filter
  const countries = Array.from(new Set(suppliers?.map(s => s.country).filter(Boolean) || []));

  const getCurrencySymbol = (currencyCode: string | null) => {
    if (!currencyCode) return "$";
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Suppliers"
            subtitle="Manage pharmaceutical suppliers with multi-currency support"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-heading-5 content-gap">Failed to load suppliers</h3>
                  <p className="text-body-small text-muted-foreground">Please check your connection and try again</p>
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
          title="Suppliers"
          subtitle="Manage pharmaceutical suppliers with multi-currency support"
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
                    data-testid="input-search-suppliers"
                    placeholder="Search suppliers, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80"
                  />
                </div>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger data-testid="select-country-filter" className="w-full sm:w-48">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country} value={country!}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    data-testid="button-create-supplier"
                    onClick={() => {
                      setEditingSupplier(null);
                      form.reset();
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSupplier ? "Edit Supplier" : "Create New Supplier"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier Name *</FormLabel>
                            <FormControl>
                              <Input data-testid="input-supplier-name" placeholder="e.g., Pharma Supply Co." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input data-testid="input-supplier-email" type="email" placeholder="orders@supplier.com" {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input data-testid="input-supplier-phone" placeholder="+244-123-456-789" {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input data-testid="input-supplier-address" placeholder="123 Supplier Street, City, Country" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-supplier-country">
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {COUNTRIES.map(country => (
                                    <SelectItem key={country} value={country}>{country}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-supplier-currency">
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CURRENCIES.map(currency => (
                                    <SelectItem key={currency.code} value={currency.code}>
                                      {currency.symbol} {currency.code} - {currency.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="creditDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credit Days</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-supplier-credit-days"
                                  type="number"
                                  placeholder="30"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Active Supplier</FormLabel>
                                <div className="text-body-small text-muted-foreground">
                                  Supplier is available for operations
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  data-testid="switch-supplier-active"
                                  checked={field.value ?? false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          data-testid="button-cancel-supplier"
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setIsCreateModalOpen(false);
                            setEditingSupplier(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          data-testid="button-save-supplier"
                          type="submit"
                          disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                        >
                          {createSupplierMutation.isPending || updateSupplierMutation.isPending ? "Saving..." : 
                           editingSupplier ? "Update Supplier" : "Create Supplier"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Suppliers Grid */}
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
            ) : filteredSuppliers.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-heading-5 content-gap">No suppliers found</h3>
                    <p className="text-body-small text-muted-foreground mb-4">
                      {searchTerm || countryFilter !== "all" 
                        ? "Try adjusting your search or filters"
                        : "Get started by creating your first supplier"
                      }
                    </p>
                    {!searchTerm && countryFilter === "all" && (
                      <Button 
                        data-testid="button-create-first-supplier"
                        onClick={() => {
                          setEditingSupplier(null);
                          form.reset();
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Supplier
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => (
                  <Card key={supplier.id} data-testid={`card-supplier-${supplier.id}`} className="hover:shadow-md transition-shadow border-l-4 border-l-[var(--supplier-bg)] bg-[var(--supplier-bg-light)]/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-heading-5 line-clamp-2 text-[var(--supplier-fg)]">{supplier.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {supplier.country && (
                              <Badge data-testid={`badge-country-${supplier.id}`} className="badge-supplier-light">
                                <Globe className="h-3 w-3 mr-1" />
                                {supplier.country}
                              </Badge>
                            )}
                            {supplier.currency && (
                              <Badge className="badge-supplier-light text-xs border-[var(--supplier-bg)]">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {supplier.currency}
                              </Badge>
                            )}
                            {!supplier.isActive && (
                              <Badge className="badge-error-light text-xs">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            data-testid={`button-edit-${supplier.id}`}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            data-testid={`button-delete-${supplier.id}`}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(supplier)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span data-testid={`text-email-${supplier.id}`} className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span data-testid={`text-phone-${supplier.id}`} className="truncate">{supplier.phone}</span>
                          </div>
                        )}
                        
                        {supplier.address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span data-testid={`text-address-${supplier.id}`} className="truncate">{supplier.address}</span>
                          </div>
                        )}
                      </div>
                      
                      {supplier.creditDays && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Credit Terms</div>
                            <div data-testid={`text-credit-days-${supplier.id}`} className="font-medium flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {supplier.creditDays} days
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-muted-foreground">Currency</div>
                            <div data-testid={`text-currency-${supplier.id}`} className="font-medium">
                              {getCurrencySymbol(supplier.currency)} {supplier.currency}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Created: {format(new Date(supplier.createdAt!), "MMM dd, yyyy")}
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