import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MessageSquare,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  User,
  Building,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  BarChart3,
  FileText,
  Filter
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertCampaignSchema, 
  insertLeadSchema,
  insertCommunicationSchema,
  type Campaign, 
  type InsertCampaign,
  type Lead,
  type InsertLead,
  type Communication,
  type InsertCommunication,
  type User as UserType
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MarketingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("campaigns");
  
  // Campaign Management State
  const [campaignSearchTerm, setCampaignSearchTerm] = useState("");
  const [selectedCampaignStatus, setSelectedCampaignStatus] = useState("");
  const [selectedCampaignType, setSelectedCampaignType] = useState("");
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  // Lead Management State
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [selectedLeadStatus, setSelectedLeadStatus] = useState("");
  const [selectedLeadSource, setSelectedLeadSource] = useState("");
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  // Communication State
  const [communicationSearchTerm, setCommunicationSearchTerm] = useState("");
  const [selectedCommunicationType, setSelectedCommunicationType] = useState("");
  const [isCreateCommunicationModalOpen, setIsCreateCommunicationModalOpen] = useState(false);

  // Check if user has marketing access
  const hasMarketingAccess = user && (user.role === 'admin' || user.role === 'marketing');

  // Data queries - only enabled for authorized users
  const { data: campaigns, isLoading: campaignsLoading, error: campaignsError } = useQuery<Campaign[]>({
    queryKey: ["/api/marketing/campaigns"],
    enabled: isAuthenticated && !isLoading && hasMarketingAccess,
  });

  const { data: leads, isLoading: leadsLoading, error: leadsError } = useQuery<Lead[]>({
    queryKey: ["/api/marketing/leads"],
    enabled: isAuthenticated && !isLoading && hasMarketingAccess,
  });

  const { data: communications, isLoading: communicationsLoading, error: communicationsError } = useQuery<Communication[]>({
    queryKey: ["/api/marketing/communications"],
    enabled: isAuthenticated && !isLoading && hasMarketingAccess,
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && !isLoading && hasMarketingAccess,
  });

  // Form configurations
  const campaignForm = useForm<InsertCampaign>({
    resolver: zodResolver(insertCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      campaignType: "email",
      startDate: "",
      endDate: "",
      budget: "0",
      actualSpend: "0",
      currency: "AOA",
      targetAudience: "",
      objectives: "",
      status: "draft",
      managerId: user?.id || "",
      isActive: true,
    },
  });

  const leadForm = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      address: "",
      source: "",
      leadStatus: "new",
      leadScore: 0,
      assignedTo: "",
      notes: "",
      estimatedValue: "0",
      currency: "AOA",
      isActive: true,
    },
  });

  const communicationForm = useForm<InsertCommunication>({
    resolver: zodResolver(insertCommunicationSchema),
    defaultValues: {
      communicationType: "email",
      subject: "",
      content: "",
      direction: "outbound",
      status: "draft",
      userId: user?.id || "",
    },
  });

  // Error handling function
  const handleError = (error: Error) => {
    if (isUnauthorizedError(error)) {
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
      description: "An error occurred. Please try again.",
      variant: "destructive",
    });
  };

  // Mutations
  const createCampaignMutation = useMutation({
    mutationFn: async (data: InsertCampaign) => {
      const response = await apiRequest("POST", "/api/marketing/campaigns", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/campaigns"] });
      setIsCreateCampaignModalOpen(false);
      campaignForm.reset();
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    },
    onError: handleError,
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertCampaign> }) => {
      const response = await apiRequest("PATCH", `/api/marketing/campaigns/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/campaigns"] });
      setEditingCampaign(null);
      campaignForm.reset();
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
    },
    onError: handleError,
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      const response = await apiRequest("POST", "/api/marketing/leads", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      setIsCreateLeadModalOpen(false);
      leadForm.reset();
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    },
    onError: handleError,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertLead> }) => {
      const response = await apiRequest("PATCH", `/api/marketing/leads/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/leads"] });
      setEditingLead(null);
      leadForm.reset();
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    },
    onError: handleError,
  });

  const createCommunicationMutation = useMutation({
    mutationFn: async (data: InsertCommunication) => {
      const response = await apiRequest("POST", "/api/marketing/communications", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/communications"] });
      setIsCreateCommunicationModalOpen(false);
      communicationForm.reset();
      toast({
        title: "Success",
        description: "Communication logged successfully",
      });
    },
    onError: handleError,
  });

  // Form handlers
  const onCampaignSubmit = (data: InsertCampaign) => {
    if (editingCampaign) {
      updateCampaignMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createCampaignMutation.mutate(data);
    }
  };

  const onLeadSubmit = (data: InsertLead) => {
    const cleanedData = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      company: data.company || undefined,
      position: data.position || undefined,
      address: data.address || undefined,
      source: data.source || undefined,
      assignedTo: data.assignedTo || undefined,
      campaignId: data.campaignId || undefined,
    };
    
    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead.id, data: cleanedData });
    } else {
      createLeadMutation.mutate(cleanedData);
    }
  };

  const onCommunicationSubmit = (data: InsertCommunication) => {
    const cleanedData = {
      ...data,
      customerId: data.customerId || undefined,
      leadId: data.leadId || undefined,
      campaignId: data.campaignId || undefined,
      scheduledAt: data.scheduledAt || undefined,
    };
    createCommunicationMutation.mutate(cleanedData);
  };

  // Helper functions
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800'; // draft
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'nurturing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCommunicationTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'sms': return MessageSquare;
      case 'meeting': return Users;
      case 'letter': return FileText;
      case 'visit': return MapPin;
      default: return MessageSquare;
    }
  };

  const getCommunicationStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'opened': return 'bg-purple-100 text-purple-800';
      case 'clicked': return 'bg-orange-100 text-orange-800';
      case 'replied': return 'bg-teal-100 text-teal-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800'; // draft
    }
  };

  // Edit handlers
  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    campaignForm.reset({
      name: campaign.name,
      description: campaign.description || "",
      campaignType: campaign.campaignType,
      startDate: campaign.startDate,
      endDate: campaign.endDate || "",
      budget: campaign.budget,
      actualSpend: campaign.actualSpend,
      currency: campaign.currency,
      targetAudience: campaign.targetAudience || "",
      objectives: campaign.objectives || "",
      status: campaign.status,
      managerId: campaign.managerId,
      isActive: campaign.isActive,
    });
    setIsCreateCampaignModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    leadForm.reset({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      position: lead.position || "",
      address: lead.address || "",
      source: lead.source || "",
      campaignId: lead.campaignId || "",
      leadStatus: lead.leadStatus,
      leadScore: lead.leadScore,
      assignedTo: lead.assignedTo || "",
      notes: lead.notes || "",
      estimatedValue: lead.estimatedValue,
      currency: lead.currency,
      isActive: lead.isActive,
    });
    setIsCreateLeadModalOpen(true);
  };

  // Filter functions
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(campaignSearchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(campaignSearchTerm.toLowerCase());
    const matchesStatus = selectedCampaignStatus === "" || campaign.status === selectedCampaignStatus;
    const matchesType = selectedCampaignType === "" || campaign.campaignType === selectedCampaignType;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = lead.firstName.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(leadSearchTerm.toLowerCase());
    const matchesStatus = selectedLeadStatus === "" || lead.leadStatus === selectedLeadStatus;
    const matchesSource = selectedLeadSource === "" || lead.source === selectedLeadSource;
    return matchesSearch && matchesStatus && matchesSource;
  }) || [];

  const filteredCommunications = communications?.filter(communication => {
    const matchesSearch = communication.subject?.toLowerCase().includes(communicationSearchTerm.toLowerCase()) ||
      communication.content?.toLowerCase().includes(communicationSearchTerm.toLowerCase());
    const matchesType = selectedCommunicationType === "" || communication.communicationType === selectedCommunicationType;
    return matchesSearch && matchesType;
  }) || [];

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

  if (!hasMarketingAccess) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Marketing"
            subtitle="Manage campaigns, leads, and customer communications"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Access Denied</h3>
                  <p className="text-muted-foreground text-sm">You don't have permission to access marketing features</p>
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
          title="Marketing"
          subtitle="Manage campaigns, leads, and customer communications"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-marketing">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="campaigns" data-testid="tab-campaigns">
                <Target className="w-4 h-4 mr-2" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="leads" data-testid="tab-leads">
                <Users className="w-4 h-4 mr-2" />
                Leads
              </TabsTrigger>
              <TabsTrigger value="communications" data-testid="tab-communications">
                <MessageSquare className="w-4 h-4 mr-2" />
                Communications
              </TabsTrigger>
            </TabsList>

            {/* Campaign Management Section */}
            <TabsContent value="campaigns" className="space-y-6">
              {/* Campaign Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                        <p className="text-2xl font-bold" data-testid="metric-total-campaigns">
                          {campaigns?.length || 0}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                        <p className="text-2xl font-bold" data-testid="metric-active-campaigns">
                          {campaigns?.filter(c => c.status === 'active').length || 0}
                        </p>
                      </div>
                      <Play className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                        <p className="text-2xl font-bold" data-testid="metric-total-budget">
                          {formatCurrency(campaigns?.reduce((sum, c) => sum + parseFloat(c.budget), 0) || 0)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
                        <p className="text-2xl font-bold" data-testid="metric-total-spend">
                          {formatCurrency(campaigns?.reduce((sum, c) => sum + parseFloat(c.actualSpend), 0) || 0)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Filters and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search campaigns..."
                      value={campaignSearchTerm}
                      onChange={(e) => setCampaignSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                      data-testid="input-search-campaigns"
                    />
                  </div>
                  
                  <Select value={selectedCampaignStatus} onValueChange={setSelectedCampaignStatus}>
                    <SelectTrigger className="w-40" data-testid="select-campaign-status">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedCampaignType} onValueChange={setSelectedCampaignType}>
                    <SelectTrigger className="w-40" data-testid="select-campaign-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                      <SelectItem value="loyalty">Loyalty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isCreateCampaignModalOpen} onOpenChange={setIsCreateCampaignModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground" data-testid="button-add-campaign">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...campaignForm}>
                      <form onSubmit={campaignForm.handleSubmit(onCampaignSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={campaignForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Campaign Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-campaign-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={campaignForm.control}
                            name="campaignType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Campaign Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-campaign-type-form">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                    <SelectItem value="promotional">Promotional</SelectItem>
                                    <SelectItem value="educational">Educational</SelectItem>
                                    <SelectItem value="seasonal">Seasonal</SelectItem>
                                    <SelectItem value="loyalty">Loyalty</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={campaignForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} data-testid="textarea-campaign-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={campaignForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-campaign-start-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={campaignForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} value={field.value || ""} data-testid="input-campaign-end-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={campaignForm.control}
                            name="budget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Budget</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} value={field.value || ""} data-testid="input-campaign-budget" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={campaignForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-campaign-status-form">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="paused">Paused</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={campaignForm.control}
                          name="targetAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Audience</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} data-testid="textarea-campaign-target-audience" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={campaignForm.control}
                          name="objectives"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Objectives</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} data-testid="textarea-campaign-objectives" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsCreateCampaignModalOpen(false);
                              setEditingCampaign(null);
                              campaignForm.reset();
                            }}
                            data-testid="button-cancel-campaign"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
                            data-testid="button-save-campaign"
                          >
                            {createCampaignMutation.isPending || updateCampaignMutation.isPending ? "Saving..." : "Save Campaign"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Campaigns Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Marketing Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaignsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredCampaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {campaigns?.length === 0 
                          ? "Get started by creating your first marketing campaign"
                          : "Try adjusting your search or filter criteria"
                        }
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Spent</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.map((campaign) => {
                          const budgetProgress = (parseFloat(campaign.actualSpend) / parseFloat(campaign.budget)) * 100;
                          return (
                            <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium" data-testid={`text-campaign-name-${campaign.id}`}>
                                    {campaign.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                                    {campaign.description}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {campaign.campaignType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getCampaignStatusColor(campaign.status)}>
                                  {campaign.status}
                                </Badge>
                              </TableCell>
                              <TableCell data-testid={`text-campaign-budget-${campaign.id}`}>
                                {formatCurrency(campaign.budget)}
                              </TableCell>
                              <TableCell data-testid={`text-campaign-spent-${campaign.id}`}>
                                {formatCurrency(campaign.actualSpend)}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <Progress value={Math.min(budgetProgress, 100)} className="h-2" />
                                  <div className="text-xs text-muted-foreground">
                                    {budgetProgress.toFixed(1)}% of budget
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{new Date(campaign.startDate).toLocaleDateString()}</div>
                                  {campaign.endDate && (
                                    <div className="text-muted-foreground">
                                      to {new Date(campaign.endDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCampaign(campaign)}
                                  data-testid={`button-edit-campaign-${campaign.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lead Management Section */}
            <TabsContent value="leads" className="space-y-6">
              {/* Lead Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                        <p className="text-2xl font-bold" data-testid="metric-total-leads">
                          {leads?.length || 0}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Qualified Leads</p>
                        <p className="text-2xl font-bold" data-testid="metric-qualified-leads">
                          {leads?.filter(l => l.leadStatus === 'qualified').length || 0}
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Converted Leads</p>
                        <p className="text-2xl font-bold" data-testid="metric-converted-leads">
                          {leads?.filter(l => l.leadStatus === 'converted').length || 0}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                        <p className="text-2xl font-bold" data-testid="metric-conversion-rate">
                          {leads?.length 
                            ? ((leads.filter(l => l.leadStatus === 'converted').length / leads.length) * 100).toFixed(1)
                            : 0
                          }%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lead Filters and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search leads..."
                      value={leadSearchTerm}
                      onChange={(e) => setLeadSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                      data-testid="input-search-leads"
                    />
                  </div>
                  
                  <Select value={selectedLeadStatus} onValueChange={setSelectedLeadStatus}>
                    <SelectTrigger className="w-40" data-testid="select-lead-status">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="nurturing">Nurturing</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedLeadSource} onValueChange={setSelectedLeadSource}>
                    <SelectTrigger className="w-40" data-testid="select-lead-source">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sources</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="trade_show">Trade Show</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isCreateLeadModalOpen} onOpenChange={setIsCreateLeadModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground" data-testid="button-add-lead">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingLead ? "Edit Lead" : "Add New Lead"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...leadForm}>
                      <form onSubmit={leadForm.handleSubmit(onLeadSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={leadForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-lead-first-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={leadForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-lead-last-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={leadForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} value={field.value || ""} data-testid="input-lead-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={leadForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-lead-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={leadForm.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-lead-company" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={leadForm.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-lead-position" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={leadForm.control}
                            name="source"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Source</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-lead-source-form">
                                      <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="website">Website</SelectItem>
                                    <SelectItem value="referral">Referral</SelectItem>
                                    <SelectItem value="campaign">Campaign</SelectItem>
                                    <SelectItem value="trade_show">Trade Show</SelectItem>
                                    <SelectItem value="cold_call">Cold Call</SelectItem>
                                    <SelectItem value="social_media">Social Media</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={leadForm.control}
                            name="leadStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-lead-status-form">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="qualified">Qualified</SelectItem>
                                    <SelectItem value="converted">Converted</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                    <SelectItem value="nurturing">Nurturing</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={leadForm.control}
                            name="leadScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lead Score (0-100)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    {...field} 
                                    value={field.value?.toString() || "0"}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    data-testid="input-lead-score"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={leadForm.control}
                            name="assignedTo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assigned To</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-lead-assigned-to">
                                      <SelectValue placeholder="Select sales rep" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="">Unassigned</SelectItem>
                                    {users?.filter(u => u.role === 'sales' || u.role === 'admin').map((user) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={leadForm.control}
                            name="estimatedValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estimated Value</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} value={field.value || ""} data-testid="input-lead-estimated-value" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={leadForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} data-testid="textarea-lead-address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={leadForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} data-testid="textarea-lead-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsCreateLeadModalOpen(false);
                              setEditingLead(null);
                              leadForm.reset();
                            }}
                            data-testid="button-cancel-lead"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createLeadMutation.isPending || updateLeadMutation.isPending}
                            data-testid="button-save-lead"
                          >
                            {createLeadMutation.isPending || updateLeadMutation.isPending ? "Saving..." : "Save Lead"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Leads Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No leads found</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {leads?.length === 0 
                          ? "Start building your sales pipeline by adding your first lead"
                          : "Try adjusting your search or filter criteria"
                        }
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Estimated Value</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeads.map((lead) => {
                          const assignedUser = users?.find(u => u.id === lead.assignedTo);
                          return (
                            <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium" data-testid={`text-lead-name-${lead.id}`}>
                                    {lead.firstName} {lead.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {lead.email && (
                                      <div className="flex items-center">
                                        <Mail className="w-3 h-3 mr-1" />
                                        {lead.email}
                                      </div>
                                    )}
                                    {lead.phone && (
                                      <div className="flex items-center">
                                        <Phone className="w-3 h-3 mr-1" />
                                        {lead.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{lead.company}</div>
                                  <div className="text-sm text-muted-foreground">{lead.position}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getLeadStatusColor(lead.leadStatus)}>
                                  {lead.leadStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className={`font-medium ${getLeadScoreColor(lead.leadScore)}`}>
                                    {lead.leadScore}/100
                                  </div>
                                  <Progress value={lead.leadScore} className="h-2 w-16" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {lead.source?.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell data-testid={`text-lead-value-${lead.id}`}>
                                {formatCurrency(lead.estimatedValue)}
                              </TableCell>
                              <TableCell>
                                {assignedUser ? (
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4" />
                                    <span className="text-sm">
                                      {assignedUser.firstName} {assignedUser.lastName}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Unassigned</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditLead(lead)}
                                  data-testid={`button-edit-lead-${lead.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customer Communications Section */}
            <TabsContent value="communications" className="space-y-6">
              {/* Communication Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Communications</p>
                        <p className="text-2xl font-bold" data-testid="metric-total-communications">
                          {communications?.length || 0}
                        </p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Emails Sent</p>
                        <p className="text-2xl font-bold" data-testid="metric-emails-sent">
                          {communications?.filter(c => c.communicationType === 'email').length || 0}
                        </p>
                      </div>
                      <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone Calls</p>
                        <p className="text-2xl font-bold" data-testid="metric-phone-calls">
                          {communications?.filter(c => c.communicationType === 'phone').length || 0}
                        </p>
                      </div>
                      <Phone className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Meetings</p>
                        <p className="text-2xl font-bold" data-testid="metric-meetings">
                          {communications?.filter(c => c.communicationType === 'meeting').length || 0}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Communication Filters and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search communications..."
                      value={communicationSearchTerm}
                      onChange={(e) => setCommunicationSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                      data-testid="input-search-communications"
                    />
                  </div>
                  
                  <Select value={selectedCommunicationType} onValueChange={setSelectedCommunicationType}>
                    <SelectTrigger className="w-40" data-testid="select-communication-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="visit">Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isCreateCommunicationModalOpen} onOpenChange={setIsCreateCommunicationModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground" data-testid="button-add-communication">
                      <Plus className="w-4 h-4 mr-2" />
                      Log Communication
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Log Communication</DialogTitle>
                    </DialogHeader>
                    <Form {...communicationForm}>
                      <form onSubmit={communicationForm.handleSubmit(onCommunicationSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={communicationForm.control}
                            name="communicationType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Communication Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-communication-type-form">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                    <SelectItem value="letter">Letter</SelectItem>
                                    <SelectItem value="visit">Visit</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={communicationForm.control}
                            name="direction"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Direction</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-communication-direction">
                                      <SelectValue placeholder="Select direction" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="inbound">Inbound</SelectItem>
                                    <SelectItem value="outbound">Outbound</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={communicationForm.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} data-testid="input-communication-subject" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={communicationForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} rows={4} data-testid="textarea-communication-content" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={communicationForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-communication-status">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="opened">Opened</SelectItem>
                                    <SelectItem value="clicked">Clicked</SelectItem>
                                    <SelectItem value="replied">Replied</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={communicationForm.control}
                            name="scheduledAt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Scheduled At</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="datetime-local" 
                                    {...field} 
                                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""} 
                                    data-testid="input-communication-scheduled-at" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsCreateCommunicationModalOpen(false);
                              communicationForm.reset();
                            }}
                            data-testid="button-cancel-communication"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createCommunicationMutation.isPending}
                            data-testid="button-save-communication"
                          >
                            {createCommunicationMutation.isPending ? "Logging..." : "Log Communication"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Communications Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Communication History</CardTitle>
                </CardHeader>
                <CardContent>
                  {communicationsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredCommunications.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No communications found</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {communications?.length === 0 
                          ? "Start tracking your customer interactions by logging your first communication"
                          : "Try adjusting your search or filter criteria"
                        }
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Direction</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCommunications.map((communication) => {
                          const IconComponent = getCommunicationTypeIcon(communication.communicationType);
                          return (
                            <TableRow key={communication.id} data-testid={`row-communication-${communication.id}`}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <IconComponent className="w-4 h-4" />
                                  <span className="capitalize">{communication.communicationType}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium" data-testid={`text-communication-subject-${communication.id}`}>
                                    {communication.subject}
                                  </div>
                                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                                    {communication.content}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={communication.direction === 'inbound' ? 'default' : 'secondary'}>
                                  {communication.direction}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getCommunicationStatusColor(communication.status)}>
                                  {communication.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {communication.customerId && "Customer"}
                                  {communication.leadId && "Lead"}
                                  {communication.campaignId && "Campaign"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{new Date(communication.createdAt).toLocaleDateString()}</div>
                                  <div className="text-muted-foreground">
                                    {new Date(communication.createdAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-view-communication-${communication.id}`}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}