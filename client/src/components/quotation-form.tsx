import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertQuotationSchema, type Customer, type Product, type User as UserType, type Quotation } from "@shared/schema";

// Extended schema for the form with line items
const quotationFormSchema = insertQuotationSchema.extend({
  quotationDate: z.string(),
  validityDate: z.string(),
  items: z.array(z.object({
    productId: z.string().min(1, "Product is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be non-negative"),
    discount: z.number().min(0).max(100, "Discount must be between 0 and 100"),
    tax: z.number().min(0).max(100, "Tax must be between 0 and 100"),
  }))
});

type QuotationFormData = z.infer<typeof quotationFormSchema>;

interface QuotationFormProps {
  quotation?: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface QuotationItemWithProduct {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  product?: Product;
}

export default function QuotationForm({ quotation, isOpen, onClose, onSuccess }: QuotationFormProps) {
  const { toast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [fxRate, setFxRate] = useState<number>(1);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: salesReps } = useQuery<UserType[]>({
    queryKey: ["/api/users", { role: "sales" }],
  });

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      quotationNumber: "",
      customerId: "",
      salesRepId: "",
      quotationDate: format(new Date(), "yyyy-MM-dd"),
      validityDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
      status: "draft",
      currency: "USD",
      fxRate: "1",
      subtotal: "0",
      taxAmount: "0",
      discountAmount: "0",
      totalAmount: "0",
      notes: "",
      items: []
    }
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Generate quotation number
  useEffect(() => {
    if (!quotation && isOpen) {
      const now = new Date();
      const quotationNumber = `QUO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;
      form.setValue("quotationNumber", quotationNumber);
    }
  }, [isOpen, quotation, form]);

  // Load quotation data for editing
  useEffect(() => {
    if (quotation && isOpen) {
      form.reset({
        quotationNumber: quotation.quotationNumber,
        customerId: quotation.customerId,
        salesRepId: quotation.salesRepId || "",
        quotationDate: quotation.quotationDate,
        validityDate: quotation.validityDate,
        status: quotation.status,
        currency: quotation.currency,
        fxRate: quotation.fxRate,
        subtotal: quotation.subtotal,
        taxAmount: quotation.taxAmount,
        discountAmount: quotation.discountAmount,
        totalAmount: quotation.totalAmount,
        notes: quotation.notes || "",
        items: []
      });
      setSelectedCurrency(quotation.currency || 'USD');
      setFxRate(parseFloat(quotation.fxRate || '1'));
    }
  }, [quotation, isOpen, form]);

  const createQuotationMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const quotationData = {
        ...data,
        quotationDate: data.quotationDate,
        validityDate: data.validityDate,
        fxRate: fxRate.toString(),
        currency: selectedCurrency,
      };
      
      const { items, ...quotationOnly } = quotationData;
      
      // Create quotation first
      const response = await apiRequest("/api/crm/quotations", "POST", quotationOnly);
      const createdQuotation = await response.json();

      // Then add items
      if (items && items.length > 0) {
        for (const item of items) {
          const lineTotal = item.quantity * item.unitPrice * (1 - item.discount / 100) * (1 + item.tax / 100);
          await apiRequest(`/api/crm/quotations/${createdQuotation.id}/items`, "POST", {
            quotationId: createdQuotation.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            lineTotal: lineTotal.toString(),
            discount: item.discount.toString(),
            tax: item.tax.toString(),
          });
        }
      }

      return createdQuotation;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/quotations"] });
      onSuccess?.();
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  const updateQuotationMutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const quotationData = {
        ...data,
        quotationDate: data.quotationDate,
        validityDate: data.validityDate,
        fxRate: fxRate.toString(),
        currency: selectedCurrency,
      };
      
      const { items, ...quotationOnly } = quotationData;
      
      return apiRequest(`/api/crm/quotations/${quotation?.id}`, "PATCH", quotationOnly);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/quotations"] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quotation",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    appendItem({
      productId: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
    });
  };

  const calculateTotals = () => {
    const items = form.getValues("items");
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach(item => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const discountAmount = lineSubtotal * (item.discount / 100);
      const afterDiscount = lineSubtotal - discountAmount;
      const taxAmount = afterDiscount * (item.tax / 100);
      
      subtotal += lineSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    const total = subtotal - totalDiscount + totalTax;

    form.setValue("subtotal", subtotal.toFixed(2));
    form.setValue("discountAmount", totalDiscount.toFixed(2));
    form.setValue("taxAmount", totalTax.toFixed(2));
    form.setValue("totalAmount", total.toFixed(2));
  };

  useEffect(() => {
    calculateTotals();
  }, [form.watch("items")]);

  const onSubmit = (data: QuotationFormData) => {
    if (quotation) {
      updateQuotationMutation.mutate(data);
    } else {
      createQuotationMutation.mutate(data);
    }
  };

  const currencies = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "AOA", label: "AOA - Angolan Kwanza" },
    { value: "GBP", label: "GBP - British Pound" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>
                {quotation ? "Edit Quotation" : "Create New Quotation"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-form">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quotationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quotation Number</FormLabel>
                          <FormControl>
                            <Input {...field} disabled data-testid="input-quotation-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || 'draft'}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-customer">
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers?.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name}
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
                      name="salesRepId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sales Representative</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-sales-rep">
                                <SelectValue placeholder="Select sales rep" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {salesReps?.map((rep) => (
                                <SelectItem key={rep.id} value={rep.id}>
                                  {rep.firstName && rep.lastName
                                    ? `${rep.firstName} ${rep.lastName}`
                                    : rep.email
                                  }
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
                      name="quotationDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Quotation Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  data-testid="button-quotation-date"
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="validityDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Valid Until *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  data-testid="button-validity-date"
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Currency Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="fxRate">Exchange Rate</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={fxRate}
                        onChange={(e) => setFxRate(parseFloat(e.target.value) || 1)}
                        data-testid="input-fx-rate"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Line Items</h3>
                      <Button type="button" onClick={handleAddItem} data-testid="button-add-item">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {itemFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                            <div className="md:col-span-2">
                              <Label>Product *</Label>
                              <Select
                                value={form.watch(`items.${index}.productId`)}
                                onValueChange={(value) => form.setValue(`items.${index}.productId`, value)}
                              >
                                <SelectTrigger data-testid={`select-product-${index}`}>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products?.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                                data-testid={`input-quantity-${index}`}
                              />
                            </div>

                            <div>
                              <Label>Unit Price *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                data-testid={`input-unit-price-${index}`}
                              />
                            </div>

                            <div>
                              <Label>Discount %</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                {...form.register(`items.${index}.discount`, { valueAsNumber: true })}
                                data-testid={`input-discount-${index}`}
                              />
                            </div>

                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <Label>Tax %</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  {...form.register(`items.${index}.tax`, { valueAsNumber: true })}
                                  data-testid={`input-tax-${index}`}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(index)}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Additional notes or terms..." 
                                {...field}
                                value={field.value || ''}
                                data-testid="textarea-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span data-testid="text-subtotal">{selectedCurrency} {form.watch("subtotal")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span data-testid="text-discount">-{selectedCurrency} {form.watch("discountAmount")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span data-testid="text-tax">{selectedCurrency} {form.watch("taxAmount")}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span data-testid="text-total">{selectedCurrency} {form.watch("totalAmount")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2 pt-6">
                    <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createQuotationMutation.isPending || updateQuotationMutation.isPending}
                      data-testid="button-save-quotation"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {quotation ? "Update" : "Create"} Quotation
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}