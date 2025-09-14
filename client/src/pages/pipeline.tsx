import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Phone, 
  Mail, 
  Building2, 
  Target, 
  Clock, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  User,
  Activity,
  Star,
  Briefcase,
  MoreVertical,
  Eye,
  UserPlus
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertLeadSchema, 
  insertCommunicationSchema,
  type Lead, 
  type InsertLead,
  type InsertCommunication,
  type User as UserType 
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";

// Pipeline stage configuration
const PIPELINE_STAGES = [
  { id: 'new_lead', label: 'New Leads', color: 'bg-gray-500' },
  { id: 'initial_contact', label: 'Initial Contact', color: 'bg-blue-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { id: 'needs_analysis', label: 'Needs Analysis', color: 'bg-orange-500' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'bg-yellow-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-indigo-500' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
  { id: 'on_hold', label: 'On Hold', color: 'bg-gray-400' }
];

interface LeadWithRelations extends Lead {
  assignedToUser?: UserType;
}

interface SortableLeadCardProps {
  lead: LeadWithRelations;
  onEdit: (lead: LeadWithRelations) => void;
  onViewActivities: (lead: LeadWithRelations) => void;
  onConvert: (lead: LeadWithRelations) => void;
}

function SortableLeadCard({ lead, onEdit, onViewActivities, onConvert }: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard 
        lead={lead} 
        onEdit={onEdit} 
        onViewActivities={onViewActivities}
        onConvert={onConvert}
        isDragging={isDragging}
      />
    </div>
  );
}

interface LeadCardProps {
  lead: LeadWithRelations;
  onEdit: (lead: LeadWithRelations) => void;
  onViewActivities: (lead: LeadWithRelations) => void;
  onConvert: (lead: LeadWithRelations) => void;
  isDragging?: boolean;
}

function LeadCard({ lead, onEdit, onViewActivities, onConvert, isDragging = false }: LeadCardProps) {
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const daysInStage = lead.daysInStage || 0;
  const stageDaysColor = daysInStage > 30 ? 'text-red-600' : daysInStage > 14 ? 'text-yellow-600' : 'text-green-600';

  return (
    <Card 
      className={`mb-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${isDragging ? 'shadow-lg' : ''}`}
      data-testid={`card-lead-${lead.id}`}
    >
      <CardContent className="p-4">
        {/* Header with lead name and score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate" data-testid={`text-lead-name-${lead.id}`}>
              {lead.firstName} {lead.lastName}
            </h4>
            {lead.company && (
              <p className="text-xs text-muted-foreground truncate" data-testid={`text-company-${lead.id}`}>
                <Building2 className="w-3 h-3 inline mr-1" />
                {lead.company}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Badge 
              className={`text-xs px-2 py-1 ${getScoreColor(lead.leadScore || 0)}`}
              data-testid={`badge-score-${lead.id}`}
            >
              <Star className="w-3 h-3 mr-1" />
              {lead.leadScore || 0}
            </Badge>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-1 mb-3">
          {lead.email && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate" data-testid={`text-email-${lead.id}`}>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
              <span data-testid={`text-phone-${lead.id}`}>{lead.phone}</span>
            </div>
          )}
        </div>

        {/* Value and time in stage */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs">
            <span className="text-muted-foreground">Value: </span>
            <span className="font-medium" data-testid={`text-value-${lead.id}`}>
              {formatCurrency(lead.estimatedValue || 0)}
            </span>
          </div>
          <div className={`text-xs ${stageDaysColor}`} data-testid={`text-days-in-stage-${lead.id}`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {daysInStage}d
          </div>
        </div>

        {/* Assigned to */}
        {lead.assignedToUser && (
          <div className="flex items-center mb-3">
            <Avatar className="w-5 h-5 mr-2">
              <AvatarFallback className="text-xs">
                {lead.assignedToUser.firstName?.[0] || lead.assignedToUser.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate" data-testid={`text-assigned-to-${lead.id}`}>
              {lead.assignedToUser.firstName && lead.assignedToUser.lastName 
                ? `${lead.assignedToUser.firstName} ${lead.assignedToUser.lastName}`
                : lead.assignedToUser.email?.split('@')[0] || 'Unknown'
              }
            </span>
          </div>
        )}

        {/* Last activity */}
        {lead.lastActivityAt && (
          <div className="text-xs text-muted-foreground mb-3">
            <Activity className="w-3 h-3 inline mr-1" />
            Last activity: {formatDistanceToNow(new Date(lead.lastActivityAt), { addSuffix: true })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              data-testid={`button-edit-${lead.id}`}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onViewActivities(lead);
              }}
              data-testid={`button-activities-${lead.id}`}
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>
          {(lead.pipelineStage === 'qualified' || lead.pipelineStage === 'negotiation') && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onConvert(lead);
              }}
              data-testid={`button-convert-${lead.id}`}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Convert
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PipelineColumnProps {
  stage: typeof PIPELINE_STAGES[0];
  leads: LeadWithRelations[];
  onEdit: (lead: LeadWithRelations) => void;
  onViewActivities: (lead: LeadWithRelations) => void;
  onConvert: (lead: LeadWithRelations) => void;
}

function PipelineColumn({ stage, leads, onEdit, onViewActivities, onConvert }: PipelineColumnProps) {
  const stageLeads = leads.filter(lead => lead.pipelineStage === stage.id);
  const totalValue = stageLeads.reduce((sum, lead) => sum + parseFloat(lead.estimatedValue || '0'), 0);

  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 bg-muted/30 rounded-lg p-4 transition-colors ${
        isOver ? 'bg-muted/50 ring-2 ring-primary/20' : ''
      }`} 
      data-testid={`column-${stage.id}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
          <h3 className="font-semibold text-sm" data-testid={`text-stage-title-${stage.id}`}>
            {stage.label}
          </h3>
          <Badge variant="secondary" className="text-xs" data-testid={`badge-count-${stage.id}`}>
            {stageLeads.length}
          </Badge>
        </div>
      </div>

      {/* Column value */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">
          Total Value: <span className="font-medium" data-testid={`text-stage-value-${stage.id}`}>
            {formatCurrency(totalValue)}
          </span>
        </p>
      </div>

      {/* Leads list */}
      <SortableContext items={stageLeads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[400px]" data-testid={`leads-container-${stage.id}`}>
          {stageLeads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onViewActivities={onViewActivities}
              onConvert={onConvert}
            />
          ))}
          {stageLeads.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No leads in this stage
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Pipeline() {
  const { user } = useAuth() as { user: UserType | null };
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadWithRelations | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // Fetch leads
  const { data: leads, isLoading } = useQuery<LeadWithRelations[]>({
    queryKey: ["/api/crm/leads"],
  });

  // Fetch users for assignment
  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/auth/users"],
  });

  // Create lead form
  const createForm = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      source: "",
      assignedTo: "",
      notes: "",
      estimatedValue: "0",
      currency: "USD",
      pipelineStage: "new_lead",
      leadStatus: "new",
      leadScore: 0,
    },
  });

  // Edit lead form
  const editForm = useForm<Partial<InsertLead>>({
    resolver: zodResolver(insertLeadSchema.partial()),
    defaultValues: {
      email: "",
      phone: "",
      company: "",
      position: "",
      source: "",
      notes: "",
      assignedTo: "",
    },
  });

  // Activity form
  const activityForm = useForm<InsertCommunication>({
    resolver: zodResolver(insertCommunicationSchema),
    defaultValues: {
      communicationType: "phone",
      direction: "outbound",
      content: "",
      userId: user?.id || "",
    },
  });

  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      const response = await apiRequest("POST", "/api/crm/leads", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      setIsCreateModalOpen(false);
      createForm.reset();
      toast({ title: "Success", description: "Lead created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create lead", variant: "destructive" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLead> }) => {
      const response = await apiRequest("PATCH", `/api/crm/leads/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      setIsEditModalOpen(false);
      setSelectedLead(null);
      editForm.reset();
      toast({ title: "Success", description: "Lead updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update lead", variant: "destructive" });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      console.log(`Updating lead ${id} to stage ${stage}`);
      const response = await apiRequest("PATCH", `/api/crm/leads/${id}`, { pipelineStage: stage });
      const updatedLead = await response.json();
      console.log(`Successfully updated lead:`, updatedLead);
      return updatedLead;
    },
    onMutate: async ({ id, stage }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["/api/crm/leads"] });

      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData<LeadWithRelations[]>(["/api/crm/leads"]);

      // Optimistically update to the new value
      if (previousLeads) {
        const optimisticLeads = previousLeads.map(lead => 
          lead.id === id 
            ? { ...lead, pipelineStage: stage } 
            : lead
        );
        queryClient.setQueryData(["/api/crm/leads"], optimisticLeads);
        console.log(`Optimistically updated lead ${id} to stage ${stage}`);
      }

      // Return a context object with the snapshotted value
      return { previousLeads };
    },
    onSuccess: (updatedLead, { id, stage }) => {
      console.log(`Mutation succeeded for lead ${id}:`, updatedLead);
      // Invalidate and refetch to ensure we have the latest server data
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      
      // Find the stage name for the toast
      const stageName = PIPELINE_STAGES.find(s => s.id === stage)?.label || stage;
      toast({ 
        title: "Success", 
        description: `Lead moved to ${stageName}` 
      });
    },
    onError: (error, { id, stage }, context) => {
      console.error(`Mutation failed for lead ${id} to stage ${stage}:`, error);
      
      // If we had previous data, rollback to it
      if (context?.previousLeads) {
        queryClient.setQueryData(["/api/crm/leads"], context.previousLeads);
        console.log(`Rolled back optimistic update for lead ${id}`);
      }
      
      toast({ 
        title: "Error", 
        description: `Failed to update lead stage: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        variant: "destructive" 
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have correct data
      console.log("Mutation settled, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: InsertCommunication }) => {
      const response = await apiRequest("POST", `/api/crm/leads/${leadId}/activities`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      setIsActivitiesModalOpen(false);
      setSelectedLead(null);
      activityForm.reset();
      toast({ title: "Success", description: "Activity added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add activity", variant: "destructive" });
    },
  });

  // Filter leads
  const filteredLeads = useMemo(() => {
    if (!leads) return [];

    return leads.filter(lead => {
      const matchesSearch = 
        lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAssignedTo = assignedToFilter === "all" || 
        (assignedToFilter === "unassigned" && !lead.assignedTo) ||
        lead.assignedTo === assignedToFilter;

      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

      const matchesScore = scoreFilter === "all" || 
        (scoreFilter === "high" && (lead.leadScore || 0) >= 80) ||
        (scoreFilter === "medium" && (lead.leadScore || 0) >= 40 && (lead.leadScore || 0) < 80) ||
        (scoreFilter === "low" && (lead.leadScore || 0) < 40);

      return matchesSearch && matchesAssignedTo && matchesSource && matchesScore;
    });
  }, [leads, searchTerm, assignedToFilter, sourceFilter, scoreFilter]);

  // Pipeline analytics
  const pipelineAnalytics = useMemo(() => {
    if (!filteredLeads) return null;

    const totalValue = filteredLeads.reduce((sum, lead) => sum + parseFloat(lead.estimatedValue || '0'), 0);
    const stageMetrics = PIPELINE_STAGES.map(stage => {
      const stageLeads = filteredLeads.filter(lead => lead.pipelineStage === stage.id);
      const stageValue = stageLeads.reduce((sum, lead) => sum + parseFloat(lead.estimatedValue || '0'), 0);
      const avgDaysInStage = stageLeads.length > 0 
        ? stageLeads.reduce((sum, lead) => sum + (lead.daysInStage || 0), 0) / stageLeads.length 
        : 0;

      return {
        stage: stage.id,
        count: stageLeads.length,
        value: stageValue,
        avgDays: Math.round(avgDaysInStage)
      };
    });

    const conversionRate = filteredLeads.length > 0 
      ? (filteredLeads.filter(lead => lead.pipelineStage === 'closed_won').length / filteredLeads.length) * 100 
      : 0;

    return {
      totalLeads: filteredLeads.length,
      totalValue,
      conversionRate,
      stageMetrics
    };
  }, [filteredLeads]);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const leadId = active.id as string;
    const dropTargetId = over.id as string;

    // Determine the target stage
    let targetStage = dropTargetId;
    
    // Check if dropped over a pipeline stage column
    const isStageTarget = PIPELINE_STAGES.find(stage => stage.id === dropTargetId);
    
    if (!isStageTarget) {
      // Dropped over a lead within a sortable context, find the stage of that lead
      const targetLead = filteredLeads.find(lead => lead.id === dropTargetId);
      if (targetLead) {
        targetStage = targetLead.pipelineStage || 'new_lead';
      } else {
        // Unknown drop target, abort
        setActiveId(null);
        return;
      }
    }

    const lead = filteredLeads.find(l => l.id === leadId);
    if (lead && lead.pipelineStage !== targetStage) {
      updateStageMutation.mutate({ id: leadId, stage: targetStage });
    }

    setActiveId(null);
  };

  // Form handlers
  const handleCreateLead = (data: InsertLead) => {
    const cleanedData = {
      ...data,
      assignedTo: data.assignedTo === "unassigned" || !data.assignedTo ? null : data.assignedTo,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      position: data.position || null,
      source: data.source || null,
      notes: data.notes || null,
    };
    createLeadMutation.mutate(cleanedData);
  };

  const handleEditLead = (data: Partial<InsertLead>) => {
    if (!selectedLead) return;
    
    const cleanedData = {
      ...data,
      assignedTo: data.assignedTo === "unassigned" || !data.assignedTo ? null : data.assignedTo,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      position: data.position || null,
      source: data.source || null,
      notes: data.notes || null,
    };
    updateLeadMutation.mutate({ id: selectedLead.id, data: cleanedData });
  };

  const handleAddActivity = (data: InsertCommunication) => {
    if (!selectedLead) return;
    
    const activityData = {
      ...data,
      leadId: selectedLead.id,
      scheduledAt: new Date(),
      userId: user?.id || "",
    };
    addActivityMutation.mutate({ leadId: selectedLead.id, data: activityData });
  };

  const handleEditClick = (lead: LeadWithRelations) => {
    setSelectedLead(lead);
    editForm.reset({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      company: lead.company || undefined,
      position: lead.position || undefined,
      source: lead.source || undefined,
      assignedTo: lead.assignedTo || undefined,
      notes: lead.notes || undefined,
      estimatedValue: lead.estimatedValue || "0",
      currency: lead.currency || "USD",
      pipelineStage: lead.pipelineStage || "new_lead",
      leadScore: lead.leadScore || 0,
    });
    setIsEditModalOpen(true);
  };

  const handleActivitiesClick = (lead: LeadWithRelations) => {
    setSelectedLead(lead);
    activityForm.reset({
      communicationType: "phone",
      direction: "outbound",
      content: "",
      userId: user?.id || "",
    });
    setIsActivitiesModalOpen(true);
  };

  const handleConvertClick = (lead: LeadWithRelations) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getUniqueValues = (field: keyof LeadWithRelations) => {
    if (!leads) return [];
    return Array.from(new Set(leads.map(lead => lead[field]).filter(Boolean)));
  };

  const activeLead = activeId ? filteredLeads.find(lead => lead.id === activeId) : null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Lead Pipeline"
          subtitle="Manage leads through your sales pipeline stages"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden" data-testid="main-pipeline">
          {/* Analytics Summary */}
          {pipelineAnalytics && (
            <div className="p-6 border-b bg-background">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Total Leads</p>
                        <h3 className="text-2xl font-bold" data-testid="text-total-leads">
                          {pipelineAnalytics.totalLeads}
                        </h3>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Pipeline Value</p>
                        <h3 className="text-2xl font-bold" data-testid="text-pipeline-value">
                          {formatCurrency(pipelineAnalytics.totalValue)}
                        </h3>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Conversion Rate</p>
                        <h3 className="text-2xl font-bold" data-testid="text-conversion-rate">
                          {pipelineAnalytics.conversionRate.toFixed(1)}%
                        </h3>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Avg Days in Pipeline</p>
                        <h3 className="text-2xl font-bold" data-testid="text-avg-days">
                          {pipelineAnalytics.stageMetrics.reduce((avg, stage) => avg + stage.avgDays, 0)}
                        </h3>
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                      data-testid="input-search-leads"
                    />
                  </div>
                  
                  <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                    <SelectTrigger className="w-48" data-testid="select-assigned-filter">
                      <SelectValue placeholder="All Assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assigned</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.email?.split('@')[0] || 'Unknown'
                          }
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger className="w-36" data-testid="select-score-filter">
                      <SelectValue placeholder="All Scores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="high">High (80+)</SelectItem>
                      <SelectItem value="medium">Medium (40-79)</SelectItem>
                      <SelectItem value="low">Low (&lt;40)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-36" data-testid="select-source-filter">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {getUniqueValues('source')
                        .filter(source => source && (source as string).trim() !== '')
                        .map(source => (
                          <SelectItem key={source as string} value={source as string}>
                            {(source as string).charAt(0).toUpperCase() + (source as string).slice(1)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground" data-testid="button-create-lead">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Lead</DialogTitle>
                    </DialogHeader>
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(handleCreateLead)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-first-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-last-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} value={field.value ?? ""} data-testid="input-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ""} data-testid="input-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ""} data-testid="input-company" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ""} data-testid="input-position" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="source"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Source</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ""} placeholder="e.g., Website, Referral, Trade Show" data-testid="input-source" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="estimatedValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estimated Value</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-estimated-value" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={createForm.control}
                          name="assignedTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assigned To</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-assigned-to">
                                    <SelectValue placeholder="Select sales rep" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {users?.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.firstName && user.lastName 
                                        ? `${user.firstName} ${user.lastName}`
                                        : user.email?.split('@')[0] || 'Unknown'
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
                          control={createForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value ?? ""} data-testid="input-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createLeadMutation.isPending} data-testid="button-save-lead">
                            {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* Pipeline Board */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex space-x-6 min-w-max h-full" data-testid="pipeline-board">
                {PIPELINE_STAGES.map((stage) => (
                  <PipelineColumn
                    key={stage.id}
                    stage={stage}
                    leads={filteredLeads}
                    onEdit={handleEditClick}
                    onViewActivities={handleActivitiesClick}
                    onConvert={handleConvertClick}
                  />
                ))}
              </div>
              
              <DragOverlay>
                {activeLead ? (
                  <LeadCard
                    lead={activeLead}
                    onEdit={() => {}}
                    onViewActivities={() => {}}
                    onConvert={() => {}}
                    isDragging={true}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>
      </div>

      {/* Edit Lead Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditLead)} className="space-y-4">
              {/* Similar form fields as create, but pre-populated */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional fields similar to create form... */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateLeadMutation.isPending} data-testid="button-update-lead">
                  {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Activities Modal */}
      <Dialog open={isActivitiesModalOpen} onOpenChange={setIsActivitiesModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
          </DialogHeader>
          <Form {...activityForm}>
            <form onSubmit={activityForm.handleSubmit(handleAddActivity)} className="space-y-4">
              <FormField
                control={activityForm.control}
                name="communicationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-activity-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="visit">Visit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={activityForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} data-testid="input-activity-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsActivitiesModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addActivityMutation.isPending} data-testid="button-add-activity">
                  {addActivityMutation.isPending ? "Adding..." : "Add Activity"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Convert Lead Modal */}
      <Dialog open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Converting this lead will create a new customer record and mark the lead as converted.
            </p>
            {selectedLead && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedLead.firstName} {selectedLead.lastName}</h4>
                <p className="text-sm text-muted-foreground">{selectedLead.company}</p>
                <p className="text-sm text-muted-foreground">{selectedLead.email}</p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button data-testid="button-confirm-convert">
                Convert to Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}