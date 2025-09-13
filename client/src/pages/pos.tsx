import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Wallet, 
  CreditCard, 
  Smartphone,
  Banknote,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Calculator,
  Receipt,
  Clock,
  DollarSign,
  Users,
  Package,
  Settings,
  Play,
  Square,
  Eye,
  Edit,
  Monitor,
  MapPin,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";
import { insertPosTerminalSchema, insertPosSessionSchema, InsertPosTerminal, InsertPosSession } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// Types
interface PosTerminal {
  id: string;
  terminalNumber: string;
  name: string;
  location: string;
  warehouseId: string;
  ipAddress?: string | null;
  macAddress?: string | null;
  deviceSerial?: string | null;
  softwareVersion?: string | null;
  lastHeartbeat?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PosSession {
  id: string;
  sessionNumber: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  expectedCash: number;
  actualCash: number;
  cashVariance?: number;
  totalSales: number;
  totalTransactions: number;
  status: 'open' | 'closed';
  notes?: string;
  terminal: PosTerminal;
  cashier: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Schema for opening a session
const openSessionSchema = z.object({
  terminalId: z.string().min(1, "Terminal is required"),
  startingCash: z.coerce.number().min(0, "Starting cash must be positive"),
});

// Schema for closing a session
const closeSessionSchema = z.object({
  actualCash: z.coerce.number().min(0, "Actual cash must be positive"),
  notes: z.string().optional(),
});

// Schema for creating/editing terminals - properly use shared schema
const terminalFormSchema = insertPosTerminalSchema.extend({
  terminalNumber: z.string().min(1, "Terminal number is required"),
  name: z.string().min(1, "Terminal name is required"),
  location: z.string().min(1, "Location is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
});

export default function POS() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("register");
  const [selectedTerminal, setSelectedTerminal] = useState<string>("");
  const [activeSession, setActiveSession] = useState<PosSession | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [isEditTerminalModalOpen, setIsEditTerminalModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PosSession | null>(null);
  const [selectedTerminalForEdit, setSelectedTerminalForEdit] = useState<PosTerminal | null>(null);

  // Fetch POS terminals
  const { data: terminals, isLoading: terminalsLoading } = useQuery<PosTerminal[]>({
    queryKey: ["/api/pos/terminals"],
    enabled: isAuthenticated && !isLoading,
  });

  // Fetch active session for selected terminal
  const { data: sessionData, isLoading: sessionLoading, refetch: refetchSession } = useQuery<PosSession>({
    queryKey: ["/api/pos/sessions/active", selectedTerminal],
    queryFn: async () => {
      if (!selectedTerminal) throw new Error("Terminal ID is required");
      const response = await fetch(`/api/pos/sessions/active/${selectedTerminal}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No active session found
        }
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!selectedTerminal && isAuthenticated,
  });

  // Fetch products for the register
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated && !isLoading,
  });

  // Fetch all POS sessions
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useQuery<PosSession[]>({
    queryKey: ["/api/pos/sessions"],
    enabled: isAuthenticated && !isLoading,
  });

  // Fetch warehouses for terminal creation
  const { data: warehouses, isLoading: warehousesLoading } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
    enabled: isAuthenticated && !isLoading,
  });

  // Form for opening session
  const openSessionForm = useForm<z.infer<typeof openSessionSchema>>({
    resolver: zodResolver(openSessionSchema),
    defaultValues: {
      terminalId: "",
      startingCash: 0,
    },
  });

  // Form for closing session
  const closeSessionForm = useForm<z.infer<typeof closeSessionSchema>>({
    resolver: zodResolver(closeSessionSchema),
    defaultValues: {
      actualCash: 0,
      notes: "",
    },
  });

  // Form for terminal creation/editing
  const terminalForm = useForm<z.infer<typeof terminalFormSchema>>({
    resolver: zodResolver(terminalFormSchema),
    defaultValues: {
      terminalNumber: "",
      name: "",
      location: "",
      warehouseId: "",
      ipAddress: "",
      macAddress: "",
      deviceSerial: "",
      softwareVersion: "",
      isActive: true,
    },
  });

  // Open session mutation
  const openSessionMutation = useMutation({
    mutationFn: (data: z.infer<typeof openSessionSchema>) =>
      apiRequest("/api/pos/sessions/open", "POST", data),
    onSuccess: () => {
      // Invalidate specific active session query for the terminal that just opened a session
      const terminalId = openSessionForm.getValues("terminalId");
      queryClient.invalidateQueries({
        queryKey: ["/api/pos/sessions/active", terminalId]
      });
      // Invalidate all sessions list
      queryClient.invalidateQueries({ queryKey: ["/api/pos/sessions"] });
      setIsOpenSessionModalOpen(false);
      openSessionForm.reset();
      toast({
        title: "Success",
        description: "POS session opened successfully",
      });
      refetchSession();
      refetchSessions();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to open session",
        variant: "destructive",
      });
    },
  });

  // Close session mutation
  const closeSessionMutation = useMutation({
    mutationFn: ({ sessionId, actualCash, notes }: { sessionId: string; actualCash: number; notes?: string }) =>
      apiRequest(`/api/pos/sessions/${sessionId}/close`, "PATCH", { actualCash, notes }),
    onSuccess: () => {
      // Invalidate specific active session query for the current terminal
      if (selectedTerminal) {
        queryClient.invalidateQueries({
          queryKey: ["/api/pos/sessions/active", selectedTerminal]
        });
      }
      // Invalidate all sessions list
      queryClient.invalidateQueries({ queryKey: ["/api/pos/sessions"] });
      setActiveSession(null);
      setIsCloseSessionModalOpen(false);
      closeSessionForm.reset();
      toast({
        title: "Success",
        description: "POS session closed successfully",
      });
      refetchSessions();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to close session",
        variant: "destructive",
      });
    },
  });

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: (saleData: any) => apiRequest("/api/pos/sales", "POST", saleData),
    onSuccess: () => {
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["/api/pos/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/sessions"] });
      // Invalidate the active session for the current terminal
      if (selectedTerminal) {
        queryClient.invalidateQueries({
          queryKey: ["/api/pos/sessions/active", selectedTerminal]
        });
      }
      refetchSession();
      toast({
        title: "Success",
        description: "Sale completed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process sale",
        variant: "destructive",
      });
    },
  });

  // Create terminal mutation
  const createTerminalMutation = useMutation({
    mutationFn: (terminalData: z.infer<typeof terminalFormSchema>) =>
      apiRequest("/api/pos/terminals", "POST", terminalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/terminals"] });
      setIsTerminalModalOpen(false);
      terminalForm.reset();
      toast({
        title: "Success",
        description: "Terminal created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create terminal",
        variant: "destructive",
      });
    },
  });

  // Update terminal mutation
  const updateTerminalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<z.infer<typeof terminalFormSchema>> }) =>
      apiRequest(`/api/pos/terminals/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/terminals"] });
      setIsEditTerminalModalOpen(false);
      setSelectedTerminalForEdit(null);
      terminalForm.reset();
      toast({
        title: "Success",
        description: "Terminal updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update terminal",
        variant: "destructive",
      });
    },
  });

  // Set active session when session data changes
  useEffect(() => {
    if (sessionData) {
      setActiveSession(sessionData);
    } else {
      setActiveSession(null);
    }
  }, [sessionData]);

  // Handle opening terminal modal
  const handleOpenTerminalModal = () => {
    terminalForm.reset();
    setIsTerminalModalOpen(true);
  };

  // Handle editing terminal
  const handleEditTerminal = (terminal: PosTerminal) => {
    setSelectedTerminalForEdit(terminal);
    terminalForm.reset({
      terminalNumber: terminal.terminalNumber,
      name: terminal.name,
      location: terminal.location,
      warehouseId: terminal.warehouseId,
      ipAddress: terminal.ipAddress || "",
      macAddress: terminal.macAddress || "",
      deviceSerial: terminal.deviceSerial || "",
      softwareVersion: terminal.softwareVersion || "",
      isActive: terminal.isActive ?? true,
    });
    setIsEditTerminalModalOpen(true);
  };

  // Handle closing session
  const handleCloseSession = (session: PosSession) => {
    setSelectedSession(session);
    closeSessionForm.reset({
      actualCash: session.expectedCash,
      notes: "",
    });
    setIsCloseSessionModalOpen(true);
  };

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: product.unitPrice,
        total: product.unitPrice,
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const processSale = () => {
    if (!activeSession || cart.length === 0) return;

    const saleData = {
      sessionId: activeSession.id,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      payments: [
        {
          method: 'cash' as const,
          amount: getCartTotal(),
        }
      ],
      taxRate: 0,
      discountAmount: 0,
    };

    createSaleMutation.mutate(saleData);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Point of Sale"
          subtitle="Retail operations and cash management"
          onOpenAIChat={() => {}}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-pos">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3" data-testid="tabs-pos-navigation">
              <TabsTrigger value="register" data-testid="tab-register">Cash Register</TabsTrigger>
              <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
              <TabsTrigger value="terminals" data-testid="tab-terminals">Terminals</TabsTrigger>
            </TabsList>
            
            {/* Cash Register Tab */}
            <TabsContent value="register" className="space-y-6">
              {/* Terminal Selection & Session Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Session Status</span>
                    {!activeSession && (
                      <Dialog open={isOpenSessionModalOpen} onOpenChange={setIsOpenSessionModalOpen}>
                        <DialogTrigger asChild>
                          <Button data-testid="button-open-session">
                            <Clock className="w-4 h-4 mr-2" />
                            Open Session
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Open POS Session</DialogTitle>
                          </DialogHeader>
                          <Form {...openSessionForm}>
                            <form onSubmit={openSessionForm.handleSubmit((data) => openSessionMutation.mutate(data))} className="space-y-4">
                              <FormField
                                control={openSessionForm.control}
                                name="terminalId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Terminal</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-terminal">
                                          <SelectValue placeholder="Select a terminal" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {terminals?.map((terminal) => (
                                          <SelectItem key={terminal.id} value={terminal.id}>
                                            {terminal.name} - {terminal.location}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={openSessionForm.control}
                                name="startingCash"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Starting Cash</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        data-testid="input-starting-cash"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsOpenSessionModalOpen(false)}
                                  data-testid="button-cancel-open-session"
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={openSessionMutation.isPending} data-testid="button-confirm-open-session">
                                  {openSessionMutation.isPending ? "Opening..." : "Open Session"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeSession ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Session Active</p>
                          <p className="text-sm text-muted-foreground">{activeSession.sessionNumber}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Terminal</p>
                        <p className="text-sm text-muted-foreground">{activeSession.terminal.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Sales</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(activeSession.totalSales)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Transactions</p>
                        <p className="text-sm text-muted-foreground">{activeSession.totalTransactions}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No active session</p>
                      <p className="text-sm text-muted-foreground">Open a session to start processing sales</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {activeSession && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Product Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Package className="w-5 h-5 mr-2" />
                        Products
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {productsLoading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} className="h-16 w-full" />
                          ))
                        ) : products?.length ? (
                          products.slice(0, 20).map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                              onClick={() => addToCart(product)}
                              data-testid={`product-${product.id}`}
                            >
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.sku}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(product.unitPrice)}</p>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" data-testid={`button-add-product-${product.id}`}>
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No products available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shopping Cart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Cart ({cart.length})
                        </span>
                        {cart.length > 0 && (
                          <Button size="sm" variant="outline" onClick={() => setCart([])} data-testid="button-clear-cart">
                            Clear
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {cart.length === 0 ? (
                          <div className="text-center py-8">
                            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Cart is empty</p>
                            <p className="text-sm text-muted-foreground">Add products to start a sale</p>
                          </div>
                        ) : (
                          <>
                            <div className="max-h-64 overflow-y-auto space-y-3">
                              {cart.map((item) => (
                                <div
                                  key={item.productId}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                  data-testid={`cart-item-${item.productId}`}
                                >
                                  <div className="flex-1">
                                    <p className="font-medium">{item.product.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatCurrency(item.unitPrice)} each
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                      data-testid={`button-decrease-${item.productId}`}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-8 text-center">{item.quantity}</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                      data-testid={`button-increase-${item.productId}`}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                    <div className="w-20 text-right">
                                      <p className="font-medium">{formatCurrency(item.total)}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                      onClick={() => removeFromCart(item.productId)}
                                      data-testid={`button-remove-${item.productId}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Total & Checkout */}
                            <div className="border-t pt-4 space-y-4">
                              <div className="flex justify-between items-center text-lg font-semibold">
                                <span>Total:</span>
                                <span data-testid="cart-total">{formatCurrency(getCartTotal())}</span>
                              </div>
                              
                              <Button
                                className="w-full"
                                size="lg"
                                onClick={processSale}
                                disabled={createSaleMutation.isPending}
                                data-testid="button-process-sale"
                              >
                                {createSaleMutation.isPending ? (
                                  "Processing..."
                                ) : (
                                  <>
                                    <Receipt className="w-4 h-4 mr-2" />
                                    Process Sale
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-6">
              {/* Session Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Active Sessions</p>
                        <p className="text-2xl font-bold" data-testid="active-sessions-count">
                          {sessions?.filter(s => s.status === 'open').length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Completed Today</p>
                        <p className="text-2xl font-bold" data-testid="completed-sessions-count">
                          {sessions?.filter(s => s.status === 'closed' && 
                            new Date(s.endTime!).toDateString() === new Date().toDateString()).length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">Total Sales Today</p>
                        <p className="text-2xl font-bold" data-testid="total-sales-today">
                          {formatCurrency(
                            sessions?.filter(s => s.status === 'closed' && 
                              new Date(s.endTime!).toDateString() === new Date().toDateString())
                              .reduce((sum, s) => sum + Number(s.totalSales), 0) || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Transactions</p>
                        <p className="text-2xl font-bold" data-testid="total-transactions-today">
                          {sessions?.filter(s => s.status === 'closed' && 
                            new Date(s.endTime!).toDateString() === new Date().toDateString())
                            .reduce((sum, s) => sum + s.totalTransactions, 0) || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sessions List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>POS Sessions</span>
                    <Button onClick={() => setIsOpenSessionModalOpen(true)} data-testid="button-new-session">
                      <Play className="w-4 h-4 mr-2" />
                      Start New Session
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : sessions && sessions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Session</TableHead>
                            <TableHead>Terminal</TableHead>
                            <TableHead>Cashier</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Sales</TableHead>
                            <TableHead>Transactions</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions.map((session) => (
                            <TableRow key={session.id} data-testid={`session-row-${session.id}`}>
                              <TableCell className="font-medium">
                                <div>
                                  <p className="font-semibold" data-testid={`session-number-${session.id}`}>
                                    {session.sessionNumber}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {session.id.substring(0, 8)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{session.terminal.name}</p>
                                  <p className="text-sm text-muted-foreground">{session.terminal.location}</p>
                                </div>
                              </TableCell>
                              <TableCell data-testid={`cashier-${session.id}`}>
                                {session.cashier.firstName} {session.cashier.lastName}
                              </TableCell>
                              <TableCell data-testid={`start-time-${session.id}`}>
                                {new Date(session.startTime).toLocaleString()}
                              </TableCell>
                              <TableCell data-testid={`end-time-${session.id}`}>
                                {session.endTime ? new Date(session.endTime).toLocaleString() : '-'}
                              </TableCell>
                              <TableCell data-testid={`sales-${session.id}`}>
                                {formatCurrency(Number(session.totalSales))}
                              </TableCell>
                              <TableCell data-testid={`transactions-${session.id}`}>
                                {session.totalTransactions}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={session.status === 'open' ? 'default' : 'secondary'}
                                  data-testid={`status-${session.id}`}
                                >
                                  {session.status === 'open' ? (
                                    <><Activity className="w-3 h-3 mr-1" />Active</>
                                  ) : (
                                    <><CheckCircle className="w-3 h-3 mr-1" />Closed</>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {session.status === 'open' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCloseSession(session)}
                                      data-testid={`button-close-session-${session.id}`}
                                    >
                                      <Square className="w-3 h-3 mr-1" />
                                      Close
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedSession(session)}
                                      data-testid={`button-view-session-${session.id}`}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No sessions found</p>
                      <p className="text-sm text-muted-foreground">Start a new POS session to begin</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Close Session Modal */}
              <Dialog open={isCloseSessionModalOpen} onOpenChange={setIsCloseSessionModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Close POS Session</DialogTitle>
                  </DialogHeader>
                  {selectedSession && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Session Number</Label>
                          <p className="font-medium" data-testid="close-session-number">{selectedSession.sessionNumber}</p>
                        </div>
                        <div>
                          <Label>Terminal</Label>
                          <p className="font-medium">{selectedSession.terminal.name}</p>
                        </div>
                        <div>
                          <Label>Starting Cash</Label>
                          <p className="font-medium">{formatCurrency(Number(selectedSession.startingCash))}</p>
                        </div>
                        <div>
                          <Label>Expected Cash</Label>
                          <p className="font-medium" data-testid="expected-cash">{formatCurrency(Number(selectedSession.expectedCash))}</p>
                        </div>
                        <div>
                          <Label>Total Sales</Label>
                          <p className="font-medium">{formatCurrency(Number(selectedSession.totalSales))}</p>
                        </div>
                        <div>
                          <Label>Transactions</Label>
                          <p className="font-medium">{selectedSession.totalTransactions}</p>
                        </div>
                      </div>
                      
                      <Form {...closeSessionForm}>
                        <form onSubmit={closeSessionForm.handleSubmit((data) => 
                          closeSessionMutation.mutate({
                            sessionId: selectedSession.id,
                            actualCash: data.actualCash,
                            notes: data.notes,
                          })
                        )} className="space-y-4">
                          <FormField
                            control={closeSessionForm.control}
                            name="actualCash"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Actual Cash Count</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    data-testid="input-actual-cash"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={closeSessionForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Add any notes about this session..."
                                    {...field}
                                    data-testid="input-session-notes"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCloseSessionModalOpen(false)}
                              data-testid="button-cancel-close-session"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={closeSessionMutation.isPending}
                              data-testid="button-confirm-close-session"
                            >
                              {closeSessionMutation.isPending ? "Closing..." : "Close Session"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* Terminals Tab */}
            <TabsContent value="terminals" className="space-y-6">
              {/* Terminal Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Total Terminals</p>
                        <p className="text-2xl font-bold" data-testid="total-terminals-count">
                          {terminals?.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Active</p>
                        <p className="text-2xl font-bold" data-testid="active-terminals-count">
                          {terminals?.filter(t => t.isActive).length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Inactive</p>
                        <p className="text-2xl font-bold" data-testid="inactive-terminals-count">
                          {terminals?.filter(t => !t.isActive).length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">In Use</p>
                        <p className="text-2xl font-bold" data-testid="in-use-terminals-count">
                          {sessions?.filter(s => s.status === 'open').length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Terminals List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>POS Terminals</span>
                    <Button onClick={handleOpenTerminalModal} data-testid="button-new-terminal">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Terminal
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {terminalsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : terminals && terminals.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Terminal</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Activity</TableHead>
                            <TableHead>Current Session</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {terminals.map((terminal) => {
                            const currentSession = sessions?.find(s => 
                              s.terminal.id === terminal.id && s.status === 'open'
                            );
                            return (
                              <TableRow key={terminal.id} data-testid={`terminal-row-${terminal.id}`}>
                                <TableCell className="font-medium">
                                  <div>
                                    <p className="font-semibold" data-testid={`terminal-name-${terminal.id}`}>
                                      {terminal.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      #{terminal.terminalNumber}
                                    </p>
                                    {terminal.ipAddress && (
                                      <p className="text-xs text-muted-foreground">
                                        {terminal.ipAddress}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell data-testid={`terminal-location-${terminal.id}`}>
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                                    {terminal.location}
                                  </div>
                                </TableCell>
                                <TableCell data-testid={`terminal-warehouse-${terminal.id}`}>
                                  {warehouses?.find(w => w.id === terminal.warehouseId)?.name || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Badge 
                                      variant={terminal.isActive ? 'default' : 'secondary'}
                                      data-testid={`terminal-status-${terminal.id}`}
                                    >
                                      {terminal.isActive ? (
                                        <><CheckCircle className="w-3 h-3 mr-1" />Active</>
                                      ) : (
                                        <><XCircle className="w-3 h-3 mr-1" />Inactive</>
                                      )}
                                    </Badge>
                                    {currentSession && (
                                      <Badge variant="outline">
                                        <Activity className="w-3 h-3 mr-1" />In Use
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell data-testid={`terminal-last-activity-${terminal.id}`}>
                                  {terminal.lastHeartbeat ? 
                                    new Date(terminal.lastHeartbeat).toLocaleString() : 
                                    'Never'
                                  }
                                </TableCell>
                                <TableCell data-testid={`terminal-session-${terminal.id}`}>
                                  {currentSession ? (
                                    <div className="text-sm">
                                      <p className="font-medium">{currentSession.sessionNumber}</p>
                                      <p className="text-muted-foreground">
                                        {currentSession.cashier.firstName} {currentSession.cashier.lastName}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">No active session</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditTerminal(terminal)}
                                      data-testid={`button-edit-terminal-${terminal.id}`}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No terminals found</p>
                      <p className="text-sm text-muted-foreground">Add your first POS terminal to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Terminal Modal */}
              <Dialog open={isTerminalModalOpen} onOpenChange={setIsTerminalModalOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Terminal</DialogTitle>
                  </DialogHeader>
                  <Form {...terminalForm}>
                    <form onSubmit={terminalForm.handleSubmit((data) => 
                      createTerminalMutation.mutate(data)
                    )} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={terminalForm.control}
                          name="terminalNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Terminal Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="T001"
                                  {...field}
                                  data-testid="input-terminal-number"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={terminalForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Terminal Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Main Counter Terminal"
                                  {...field}
                                  data-testid="input-terminal-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={terminalForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Front Store - Counter 1"
                                  {...field}
                                  data-testid="input-terminal-location"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={terminalForm.control}
                          name="warehouseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Warehouse</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-warehouse">
                                    <SelectValue placeholder="Select a warehouse" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {warehouses?.map((warehouse) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id}>
                                      {warehouse.name} - {warehouse.location}
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
                          control={terminalForm.control}
                          name="ipAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>IP Address (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="192.168.1.100"
                                  {...field}
                                  value={field.value ?? ""}
                                  data-testid="input-ip-address"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={terminalForm.control}
                          name="macAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>MAC Address (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="00:1B:63:84:45:E6"
                                  {...field}
                                  value={field.value ?? ""}
                                  data-testid="input-mac-address"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={terminalForm.control}
                          name="deviceSerial"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Device Serial (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="DEV123456789"
                                  {...field}
                                  value={field.value ?? ""}
                                  data-testid="input-device-serial"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={terminalForm.control}
                          name="softwareVersion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Software Version (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="v1.2.3"
                                  {...field}
                                  value={field.value ?? ""}
                                  data-testid="input-software-version"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={terminalForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Active Terminal</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Enable this terminal for POS operations
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                                data-testid="switch-terminal-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsTerminalModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTerminalMutation.isPending}
                          data-testid="button-create-terminal"
                        >
                          {createTerminalMutation.isPending ? "Creating..." : "Create Terminal"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Edit Terminal Modal */}
              <Dialog open={isEditTerminalModalOpen} onOpenChange={setIsEditTerminalModalOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Terminal</DialogTitle>
                  </DialogHeader>
                  {selectedTerminalForEdit && (
                    <Form {...terminalForm}>
                      <form onSubmit={terminalForm.handleSubmit((data) => 
                        updateTerminalMutation.mutate({
                          id: selectedTerminalForEdit.id,
                          data,
                        })
                      )} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={terminalForm.control}
                            name="terminalNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Terminal Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="T001"
                                    {...field}
                                    data-testid="input-edit-terminal-number"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={terminalForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Terminal Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Main Counter Terminal"
                                    {...field}
                                    data-testid="input-edit-terminal-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={terminalForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Front Store - Counter 1"
                                    {...field}
                                    data-testid="input-edit-terminal-location"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={terminalForm.control}
                            name="warehouseId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Warehouse</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-edit-warehouse">
                                      <SelectValue placeholder="Select a warehouse" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {warehouses?.map((warehouse) => (
                                      <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} - {warehouse.location}
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
                            control={terminalForm.control}
                            name="ipAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IP Address (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="192.168.1.100"
                                    {...field}
                                    value={field.value ?? ""}
                                    data-testid="input-edit-ip-address"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={terminalForm.control}
                            name="macAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>MAC Address (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="00:1B:63:84:45:E6"
                                    {...field}
                                    value={field.value ?? ""}
                                    data-testid="input-edit-mac-address"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={terminalForm.control}
                            name="deviceSerial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Device Serial (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="DEV123456789"
                                    {...field}
                                    value={field.value ?? ""}
                                    data-testid="input-edit-device-serial"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={terminalForm.control}
                            name="softwareVersion"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Software Version (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="v1.2.3"
                                    {...field}
                                    value={field.value ?? ""}
                                    data-testid="input-edit-software-version"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={terminalForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Active Terminal</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Enable this terminal for POS operations
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value ?? false}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-edit-terminal-active"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditTerminalModalOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateTerminalMutation.isPending}
                            data-testid="button-update-terminal"
                          >
                            {updateTerminalMutation.isPending ? "Updating..." : "Update Terminal"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}