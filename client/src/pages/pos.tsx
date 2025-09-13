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
  Package
} from "lucide-react";

// Types
interface PosTerminal {
  id: string;
  terminalNumber: string;
  name: string;
  location: string;
  warehouseId: string;
  isActive: boolean;
}

interface PosSession {
  id: string;
  sessionNumber: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  expectedCash: number;
  actualCash: number;
  totalSales: number;
  totalTransactions: number;
  status: 'open' | 'closed';
  terminal: PosTerminal;
  cashier: {
    firstName: string;
    lastName: string;
  };
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
  startingCash: z.number().min(0, "Starting cash must be positive"),
});

export default function POS() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("register");
  const [selectedTerminal, setSelectedTerminal] = useState<string>("");
  const [activeSession, setActiveSession] = useState<PosSession | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);

  // Fetch POS terminals
  const { data: terminals, isLoading: terminalsLoading } = useQuery<PosTerminal[]>({
    queryKey: ["/api/pos/terminals"],
    enabled: isAuthenticated && !isLoading,
  });

  // Fetch active session for selected terminal
  const { data: sessionData, isLoading: sessionLoading, refetch: refetchSession } = useQuery<PosSession>({
    queryKey: ["/api/pos/sessions/active", selectedTerminal],
    enabled: !!selectedTerminal && isAuthenticated,
  });

  // Fetch products for the register
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
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

  // Open session mutation
  const openSessionMutation = useMutation({
    mutationFn: (data: z.infer<typeof openSessionSchema>) =>
      apiRequest("/api/pos/sessions/open", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/sessions/active"] });
      setIsOpenSessionModalOpen(false);
      toast({
        title: "Success",
        description: "POS session opened successfully",
      });
      refetchSession();
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
      queryClient.invalidateQueries({ queryKey: ["/api/pos/sessions/active"] });
      setActiveSession(null);
      toast({
        title: "Success",
        description: "POS session closed successfully",
      });
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

  // Set active session when session data changes
  useEffect(() => {
    if (sessionData) {
      setActiveSession(sessionData);
    } else {
      setActiveSession(null);
    }
  }, [sessionData]);

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="register">Cash Register</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="terminals">Terminals</TabsTrigger>
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
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
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
                          <Button size="sm" variant="outline" onClick={() => setCart([])}>
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
            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <CardTitle>POS Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Session management will be implemented here</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Terminals Tab */}
            <TabsContent value="terminals">
              <Card>
                <CardHeader>
                  <CardTitle>POS Terminals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Terminal management will be implemented here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}