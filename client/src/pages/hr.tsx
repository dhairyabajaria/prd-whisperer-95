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
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Play, 
  Square, 
  DollarSign, 
  FileText, 
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Building,
  Star,
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertEmployeeSchema, 
  insertTimeEntrySchema,
  insertPayrollRunSchema,
  insertPerformanceReviewSchema,
  type Employee, 
  type InsertEmployee,
  type TimeEntry,
  type InsertTimeEntry,
  type PayrollRun,
  type InsertPayrollRun,
  type PerformanceReview,
  type InsertPerformanceReview,
  type User as UserType
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function HRPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("employees");
  
  // Employee Management State
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Time Tracking State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [isCreateTimeEntryModalOpen, setIsCreateTimeEntryModalOpen] = useState(false);
  
  // Payroll State
  const [isCreatePayrollModalOpen, setIsCreatePayrollModalOpen] = useState(false);
  
  // Performance Review State
  const [isCreateReviewModalOpen, setIsCreateReviewModalOpen] = useState(false);

  // Check if user has HR access
  const hasHRAccess = user?.role === 'admin' || user?.role === 'hr';

  // Data queries - only enabled for authorized users
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
    enabled: isAuthenticated && !isLoading && hasHRAccess,
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && !isLoading && hasHRAccess,
  });

  const { data: timeEntries, isLoading: timeEntriesLoading, error: timeEntriesError } = useQuery<TimeEntry[]>({
    queryKey: ["/api/hr/time-entries"],
    enabled: isAuthenticated && !isLoading && hasHRAccess,
  });

  const { data: payrollRuns, isLoading: payrollRunsLoading, error: payrollRunsError } = useQuery<PayrollRun[]>({
    queryKey: ["/api/hr/payroll-runs"],
    enabled: isAuthenticated && !isLoading && hasHRAccess,
  });

  const { data: performanceReviews, isLoading: reviewsLoading, error: reviewsError } = useQuery<PerformanceReview[]>({
    queryKey: ["/api/hr/performance-reviews"],
    enabled: isAuthenticated && !isLoading && hasHRAccess,
  });

  // Form configurations
  const employeeForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      employeeNumber: "",
      department: "",
      position: "",
      hireDate: "",
      baseSalary: "0",
      currency: "AOA",
      employmentStatus: "active",
      workSchedule: "full_time",
      isActive: true,
    },
  });

  const timeEntryForm = useForm<InsertTimeEntry>({
    resolver: zodResolver(insertTimeEntrySchema),
    defaultValues: {
      employeeId: "",
      date: new Date().toISOString().split('T')[0],
      entryType: "regular",
    },
  });

  const payrollForm = useForm<InsertPayrollRun>({
    resolver: zodResolver(insertPayrollRunSchema),
    defaultValues: {
      payrollPeriod: "",
      startDate: "",
      endDate: "",
      status: "draft",
      currency: "AOA",
    },
  });

  const reviewForm = useForm<InsertPerformanceReview>({
    resolver: zodResolver(insertPerformanceReviewSchema),
    defaultValues: {
      employeeId: "",
      reviewerId: user?.id || "",
      reviewPeriod: "",
      startDate: "",
      endDate: "",
      overallRating: 1,
      status: "draft",
    },
  });

  // Mutations
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("POST", "/api/hr/employees", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      setIsCreateEmployeeModalOpen(false);
      employeeForm.reset();
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
    },
    onError: handleError,
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertEmployee> }) => {
      const response = await apiRequest("PATCH", `/api/hr/employees/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      setEditingEmployee(null);
      employeeForm.reset();
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
    },
    onError: handleError,
  });

  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: InsertTimeEntry) => {
      const response = await apiRequest("POST", "/api/hr/time-entries", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-entries"] });
      setIsCreateTimeEntryModalOpen(false);
      timeEntryForm.reset();
      toast({
        title: "Success",
        description: "Time entry created successfully",
      });
    },
    onError: handleError,
  });

  const createPayrollMutation = useMutation({
    mutationFn: async (data: InsertPayrollRun) => {
      const response = await apiRequest("POST", "/api/hr/payroll-runs", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/payroll-runs"] });
      setIsCreatePayrollModalOpen(false);
      payrollForm.reset();
      toast({
        title: "Success",
        description: "Payroll run created successfully",
      });
    },
    onError: handleError,
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: InsertPerformanceReview) => {
      const response = await apiRequest("POST", "/api/hr/performance-reviews", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/performance-reviews"] });
      setIsCreateReviewModalOpen(false);
      reviewForm.reset();
      toast({
        title: "Success",
        description: "Performance review created successfully",
      });
    },
    onError: handleError,
  });

  function handleError(error: any) {
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
    
    // Handle 403 Forbidden errors specifically
    if (error?.message?.includes('403') || error?.status === 403) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to perform this action.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Error",
      description: "Operation failed. Please try again.",
      variant: "destructive",
    });
  }

  // Helper functions
  const formatCurrency = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined) return 'AOA 0,00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'AOA 0,00';
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getEmploymentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'probation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPayrollStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter data
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = employee.position?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                         employee.department?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                         employee.employeeNumber?.toLowerCase().includes(employeeSearchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || selectedDepartment === 'all-departments' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  }) || [];

  const departments = Array.from(new Set(employees?.map(emp => emp.department).filter(Boolean))) || [];

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

  // Check if user has HR access
  if (!hasHRAccess) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Human Resources"
            subtitle="Access Denied"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center" data-testid="main-hr-access-denied">
            <Card className="w-full max-w-md mx-4" data-testid="card-access-denied">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" data-testid="icon-access-denied" />
                  <h3 className="text-lg font-medium mb-2" data-testid="text-access-denied-title">Access Denied</h3>
                  <p className="text-muted-foreground text-sm" data-testid="text-access-denied-message">
                    You need admin or HR role to access this page.
                  </p>
                  <p className="text-muted-foreground text-xs mt-2" data-testid="text-current-role">
                    Current role: {user?.role || 'None'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
        <AIChatModal 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Human Resources"
          subtitle="Manage employees, time tracking, payroll, and performance"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-hr">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4" data-testid="tabs-hr-main">
              <TabsTrigger value="employees" data-testid="tab-employees">
                <Users className="w-4 h-4 mr-2" />
                Employees
              </TabsTrigger>
              <TabsTrigger value="time-tracking" data-testid="tab-time-tracking">
                <Clock className="w-4 h-4 mr-2" />
                Time Tracking
              </TabsTrigger>
              <TabsTrigger value="payroll" data-testid="tab-payroll">
                <DollarSign className="w-4 h-4 mr-2" />
                Payroll
              </TabsTrigger>
              <TabsTrigger value="reviews" data-testid="tab-reviews">
                <Star className="w-4 h-4 mr-2" />
                Performance
              </TabsTrigger>
            </TabsList>

            {/* Employee Management Tab */}
            <TabsContent value="employees" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search employees..."
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                      data-testid="input-search-employees"
                    />
                  </div>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-48" data-testid="select-department-filter">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-departments">All Departments</SelectItem>
                      {departments.filter(dept => dept && dept.trim()).map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isCreateEmployeeModalOpen} onOpenChange={setIsCreateEmployeeModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground" data-testid="button-add-employee">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Employee</DialogTitle>
                    </DialogHeader>
                    <Form {...employeeForm}>
                      <form onSubmit={employeeForm.handleSubmit((data) => createEmployeeMutation.mutate(data))} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={employeeForm.control}
                            name="employeeNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee Number *</FormLabel>
                                <FormControl>
                                  <Input placeholder="EMP001" {...field} data-testid="input-employee-number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={employeeForm.control}
                            name="userId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>User Account *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-user-account">
                                      <SelectValue placeholder="Select user account" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {users?.map((user) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName} ({user.email})
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
                            control={employeeForm.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Sales, IT, Finance, etc." {...field} data-testid="input-department" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={employeeForm.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Job title" {...field} data-testid="input-position" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={employeeForm.control}
                            name="hireDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hire Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-hire-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={employeeForm.control}
                            name="baseSalary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Base Salary *</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="0.00" {...field} data-testid="input-base-salary" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={employeeForm.control}
                            name="employmentStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employment Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-employment-status">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="terminated">Terminated</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="probation">Probation</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={employeeForm.control}
                            name="workSchedule"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Work Schedule</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-work-schedule">
                                      <SelectValue placeholder="Select schedule" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="full_time">Full Time</SelectItem>
                                    <SelectItem value="part_time">Part Time</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end space-x-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCreateEmployeeModalOpen(false)}
                            data-testid="button-cancel-employee"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createEmployeeMutation.isPending}
                            data-testid="button-save-employee"
                            className="flex items-center space-x-2"
                          >
                            {createEmployeeMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Creating...</span>
                              </>
                            ) : (
                              "Create Employee"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Employee List */}
              <Card data-testid="card-employees-list">
                <CardHeader>
                  <CardTitle className="flex items-center" data-testid="title-employees">
                    <Users className="w-5 h-5 mr-2" data-testid="icon-employees" />
                    Employees ({filteredEmployees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employeesError ? (
                    <div className="text-center py-8" data-testid="error-employees">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" data-testid="icon-error-employees" />
                      <h3 className="text-lg font-medium mb-2" data-testid="text-error-title-employees">Error Loading Employees</h3>
                      <p className="text-muted-foreground text-sm" data-testid="text-error-message-employees">
                        {employeesError.message || 'Failed to load employees. Please try again.'}
                      </p>
                    </div>
                  ) : employeesLoading ? (
                    <div className="space-y-4" data-testid="skeleton-employees">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-4" data-testid={`skeleton-employee-row-${index}`}>
                          <Skeleton className="w-12 h-12 rounded-full" data-testid={`skeleton-employee-avatar-${index}`} />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-48 mb-2" data-testid={`skeleton-employee-name-${index}`} />
                            <Skeleton className="h-3 w-32" data-testid={`skeleton-employee-info-${index}`} />
                          </div>
                          <Skeleton className="h-6 w-20" data-testid={`skeleton-employee-status-${index}`} />
                        </div>
                      ))}
                    </div>
                  ) : filteredEmployees.length > 0 ? (
                    <Table data-testid="table-employees">
                      <TableHeader>
                        <TableRow data-testid="header-employees">
                          <TableHead data-testid="column-employee">Employee</TableHead>
                          <TableHead data-testid="column-department">Department</TableHead>
                          <TableHead data-testid="column-position">Position</TableHead>
                          <TableHead data-testid="column-hire-date">Hire Date</TableHead>
                          <TableHead data-testid="column-salary">Salary</TableHead>
                          <TableHead data-testid="column-status">Status</TableHead>
                          <TableHead data-testid="column-actions">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee) => (
                          <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium" data-testid={`text-employee-number-${employee.id}`}>
                                    {employee.employeeNumber}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    ID: {employee.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-department-${employee.id}`}>
                              {employee.department}
                            </TableCell>
                            <TableCell data-testid={`text-position-${employee.id}`}>
                              {employee.position}
                            </TableCell>
                            <TableCell data-testid={`text-hire-date-${employee.id}`}>
                              {formatDate(employee.hireDate)}
                            </TableCell>
                            <TableCell data-testid={`text-salary-${employee.id}`}>
                              {formatCurrency(employee.baseSalary)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={getEmploymentStatusColor(employee.employmentStatus || 'active')}
                                data-testid={`badge-status-${employee.id}`}
                              >
                                {employee.employmentStatus || 'active'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setEditingEmployee(employee)}
                                  data-testid={`button-edit-employee-${employee.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-delete-employee-${employee.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8" data-testid="empty-employees">
                      <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" data-testid="icon-empty-employees" />
                      <h3 className="text-lg font-medium mb-2" data-testid="text-empty-title-employees">No employees found</h3>
                      <p className="text-muted-foreground text-sm" data-testid="text-empty-message-employees">
                        {employeeSearchTerm || selectedDepartment ? 
                          "Try adjusting your search filters" : 
                          "Get started by adding your first employee"
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Time Tracking Tab */}
            <TabsContent value="time-tracking" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger className="w-64" data-testid="select-employee-filter">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-employees">All Employees</SelectItem>
                      {employees?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.employeeNumber} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isCreateTimeEntryModalOpen} onOpenChange={setIsCreateTimeEntryModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground" data-testid="button-add-time-entry">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Time Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Create Time Entry</DialogTitle>
                    </DialogHeader>
                    <Form {...timeEntryForm}>
                      <form onSubmit={timeEntryForm.handleSubmit((data) => createTimeEntryMutation.mutate(data))} className="space-y-6">
                        <FormField
                          control={timeEntryForm.control}
                          name="employeeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-time-entry-employee">
                                    <SelectValue placeholder="Select employee" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {employees?.map((employee) => (
                                    <SelectItem key={employee.id} value={employee.id}>
                                      {employee.employeeNumber} - {employee.position}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={timeEntryForm.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-time-entry-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={timeEntryForm.control}
                            name="entryType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Entry Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-entry-type">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="regular">Regular</SelectItem>
                                    <SelectItem value="overtime">Overtime</SelectItem>
                                    <SelectItem value="sick_leave">Sick Leave</SelectItem>
                                    <SelectItem value="vacation">Vacation</SelectItem>
                                    <SelectItem value="personal_leave">Personal Leave</SelectItem>
                                    <SelectItem value="training">Training</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={timeEntryForm.control}
                            name="clockIn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clock In</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} value={field.value ? (field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value) : ''} data-testid="input-clock-in" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={timeEntryForm.control}
                            name="clockOut"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clock Out</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} value={field.value ? (field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value) : ''} data-testid="input-clock-out" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={timeEntryForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Additional notes..." 
                                  {...field} 
                                  value={field.value || ''}
                                  data-testid="textarea-time-entry-notes"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCreateTimeEntryModalOpen(false)}
                            data-testid="button-cancel-time-entry"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createTimeEntryMutation.isPending}
                            data-testid="button-save-time-entry"
                          >
                            {createTimeEntryMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Creating...</span>
                              </>
                            ) : (
                              "Create Entry"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Time Entries List */}
              <Card data-testid="card-time-entries-list">
                <CardHeader>
                  <CardTitle className="flex items-center" data-testid="title-time-entries">
                    <Clock className="w-5 h-5 mr-2" data-testid="icon-time-entries" />
                    Time Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeEntriesError ? (
                    <div className="text-center py-8" data-testid="error-time-entries">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" data-testid="icon-error-time-entries" />
                      <h3 className="text-lg font-medium mb-2" data-testid="text-error-title-time-entries">Error Loading Time Entries</h3>
                      <p className="text-muted-foreground text-sm" data-testid="text-error-message-time-entries">
                        {timeEntriesError.message || 'Failed to load time entries. Please try again.'}
                      </p>
                    </div>
                  ) : timeEntriesLoading ? (
                    <div className="space-y-4" data-testid="skeleton-time-entries">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 w-full" data-testid={`skeleton-time-entry-${index}`} />
                      ))}
                    </div>
                  ) : timeEntries && timeEntries.length > 0 ? (
                    <Table data-testid="table-time-entries">
                      <TableHeader>
                        <TableRow data-testid="header-time-entries">
                          <TableHead data-testid="column-time-employee">Employee</TableHead>
                          <TableHead data-testid="column-time-date">Date</TableHead>
                          <TableHead data-testid="column-clock-in">Clock In</TableHead>
                          <TableHead data-testid="column-clock-out">Clock Out</TableHead>
                          <TableHead data-testid="column-time-hours">Total Hours</TableHead>
                          <TableHead data-testid="column-entry-type">Type</TableHead>
                          <TableHead data-testid="column-approval-status">Status</TableHead>
                          <TableHead data-testid="column-time-actions">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeEntries
                          .filter(entry => !selectedEmployeeId || entry.employeeId === selectedEmployeeId)
                          .map((entry) => {
                            const employee = employees?.find(emp => emp.id === entry.employeeId);
                            return (
                              <TableRow key={entry.id} data-testid={`row-time-entry-${entry.id}`}>
                                <TableCell data-testid={`text-time-entry-employee-${entry.id}`}>
                                  {employee?.employeeNumber} - {employee?.position}
                                </TableCell>
                                <TableCell data-testid={`text-time-entry-date-${entry.id}`}>
                                  {formatDate(entry.date)}
                                </TableCell>
                                <TableCell data-testid={`text-clock-in-${entry.id}`}>
                                  {entry.clockIn ? new Date(entry.clockIn).toLocaleTimeString() : '-'}
                                </TableCell>
                                <TableCell data-testid={`text-clock-out-${entry.id}`}>
                                  {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : '-'}
                                </TableCell>
                                <TableCell data-testid={`text-total-hours-${entry.id}`}>
                                  {entry.totalHours ? `${entry.totalHours}h` : '-'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" data-testid={`badge-entry-type-${entry.id}`}>
                                    {entry.entryType}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    className={entry.approvedBy ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                                    data-testid={`badge-approval-status-${entry.id}`}
                                  >
                                    {entry.approvedBy ? 'Approved' : 'Pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    {!entry.approvedBy && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-green-600 hover:text-green-700"
                                        data-testid={`button-approve-${entry.id}`}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      data-testid={`button-edit-time-entry-${entry.id}`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8" data-testid="empty-time-entries">
                      <Clock className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" data-testid="icon-empty-time-entries" />
                      <h3 className="text-lg font-medium mb-2" data-testid="text-empty-title-time-entries">No time entries found</h3>
                      <p className="text-muted-foreground text-sm" data-testid="text-empty-message-time-entries">
                        Get started by adding time entries for employees
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payroll Tab */}
            <TabsContent value="payroll" className="space-y-6">
              <div className="flex items-center justify-end">
                <Dialog open={isCreatePayrollModalOpen} onOpenChange={setIsCreatePayrollModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground" data-testid="button-create-payroll">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Payroll Run
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Create Payroll Run</DialogTitle>
                    </DialogHeader>
                    <Form {...payrollForm}>
                      <form onSubmit={payrollForm.handleSubmit((data) => createPayrollMutation.mutate(data))} className="space-y-6">
                        <FormField
                          control={payrollForm.control}
                          name="payrollPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payroll Period *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 2024-01" {...field} data-testid="input-payroll-period" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={payrollForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-payroll-start-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={payrollForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-payroll-end-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end space-x-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCreatePayrollModalOpen(false)}
                            data-testid="button-cancel-payroll"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createPayrollMutation.isPending}
                            data-testid="button-save-payroll"
                          >
                            {createPayrollMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Creating...</span>
                              </>
                            ) : (
                              "Create Payroll Run"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Payroll Runs List */}
              <Card data-testid="card-payroll-runs">
                <CardHeader>
                  <CardTitle className="flex items-center" data-testid="title-payroll-runs">
                    <DollarSign className="w-5 h-5 mr-2" data-testid="icon-payroll-runs" />
                    Payroll Runs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {payrollRunsError ? (
                    <div className="text-center py-8" data-testid="error-payroll-runs">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" data-testid="icon-error-payroll-runs" />
                      <h3 className="text-lg font-medium mb-2" data-testid="text-error-title-payroll-runs">Error Loading Payroll Runs</h3>
                      <p className="text-muted-foreground text-sm" data-testid="text-error-message-payroll-runs">
                        {payrollRunsError.message || 'Failed to load payroll runs. Please try again.'}
                      </p>
                    </div>
                  ) : payrollRunsLoading ? (
                    <div className="space-y-4" data-testid="skeleton-payroll-runs">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-20 w-full" data-testid={`skeleton-payroll-run-${index}`} />
                      ))}
                    </div>
                  ) : payrollRuns && payrollRuns.length > 0 ? (
                    <Table data-testid="table-payroll-runs">
                      <TableHeader>
                        <TableRow data-testid="header-payroll-runs">
                          <TableHead data-testid="column-payroll-period">Period</TableHead>
                          <TableHead data-testid="column-payroll-start">Start Date</TableHead>
                          <TableHead data-testid="column-payroll-end">End Date</TableHead>
                          <TableHead data-testid="column-gross-pay">Gross Pay</TableHead>
                          <TableHead data-testid="column-net-pay">Net Pay</TableHead>
                          <TableHead data-testid="column-payroll-status">Status</TableHead>
                          <TableHead data-testid="column-payroll-actions">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollRuns.map((payroll) => (
                          <TableRow key={payroll.id} data-testid={`row-payroll-${payroll.id}`}>
                            <TableCell className="font-medium" data-testid={`text-payroll-period-${payroll.id}`}>
                              {payroll.payrollPeriod}
                            </TableCell>
                            <TableCell data-testid={`text-payroll-start-${payroll.id}`}>
                              {formatDate(payroll.startDate)}
                            </TableCell>
                            <TableCell data-testid={`text-payroll-end-${payroll.id}`}>
                              {formatDate(payroll.endDate)}
                            </TableCell>
                            <TableCell data-testid={`text-gross-pay-${payroll.id}`}>
                              {formatCurrency(payroll.totalGrossPay || 0)}
                            </TableCell>
                            <TableCell data-testid={`text-net-pay-${payroll.id}`}>
                              {formatCurrency(payroll.totalNetPay || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={getPayrollStatusColor(payroll.status || 'draft')}
                                data-testid={`badge-payroll-status-${payroll.id}`}
                              >
                                {payroll.status || 'draft'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-view-payroll-${payroll.id}`}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                                {payroll.status === 'draft' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-green-600 hover:text-green-700"
                                    data-testid={`button-process-payroll-${payroll.id}`}
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8" data-testid="empty-payroll-runs">
                      <DollarSign className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" data-testid="icon-empty-payroll-runs" />
                      <h3 className="text-lg font-medium mb-2" data-testid="text-empty-title-payroll-runs">No payroll runs found</h3>
                      <p className="text-muted-foreground text-sm" data-testid="text-empty-message-payroll-runs">
                        Create your first payroll run to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <div className="flex items-center justify-end">
                <Dialog open={isCreateReviewModalOpen} onOpenChange={setIsCreateReviewModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground" data-testid="button-create-review">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Performance Review</DialogTitle>
                    </DialogHeader>
                    <Form {...reviewForm}>
                      <form onSubmit={reviewForm.handleSubmit((data) => createReviewMutation.mutate(data))} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={reviewForm.control}
                            name="employeeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-review-employee">
                                      <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {employees?.map((employee) => (
                                      <SelectItem key={employee.id} value={employee.id}>
                                        {employee.employeeNumber} - {employee.position}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={reviewForm.control}
                            name="reviewPeriod"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Review Period *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 2024-Q1, 2024-Annual" {...field} data-testid="input-review-period" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={reviewForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Review Start Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-review-start-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={reviewForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Review End Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-review-end-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={reviewForm.control}
                          name="overallRating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Overall Rating (1-5)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-overall-rating">
                                    <SelectValue placeholder="Select rating" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">1 - Poor</SelectItem>
                                  <SelectItem value="2">2 - Below Average</SelectItem>
                                  <SelectItem value="3">3 - Average</SelectItem>
                                  <SelectItem value="4">4 - Good</SelectItem>
                                  <SelectItem value="5">5 - Excellent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={reviewForm.control}
                          name="goals"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Goals</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Employee goals for the review period..." 
                                  {...field} 
                                  value={field.value || ''}
                                  data-testid="textarea-review-goals"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={reviewForm.control}
                          name="achievements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Achievements</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Key achievements and accomplishments..." 
                                  {...field} 
                                  value={field.value || ''}
                                  data-testid="textarea-review-achievements"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={reviewForm.control}
                          name="areasForImprovement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Areas for Improvement</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Areas where the employee can improve..." 
                                  {...field} 
                                  value={field.value || ''}
                                  data-testid="textarea-areas-improvement"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={reviewForm.control}
                          name="reviewerComments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reviewer Comments</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Additional comments from the reviewer..." 
                                  {...field} 
                                  value={field.value || ''}
                                  data-testid="textarea-reviewer-comments"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCreateReviewModalOpen(false)}
                            data-testid="button-cancel-review"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createReviewMutation.isPending}
                            data-testid="button-save-review"
                          >
                            {createReviewMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Creating...</span>
                              </>
                            ) : (
                              "Create Review"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Performance Reviews List */}
              <Card data-testid="card-performance-reviews">
                <CardHeader>
                  <CardTitle className="flex items-center" data-testid="title-performance-reviews">
                    <Star className="w-5 h-5 mr-2" data-testid="icon-performance-reviews" />
                    Performance Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviewsError ? (
                    <div className="text-center py-8" data-testid="error-performance-reviews">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" data-testid="icon-error-performance-reviews" />
                      <h3 className="text-lg font-medium mb-2" data-testid="text-error-title-performance-reviews">Error Loading Performance Reviews</h3>
                      <p className="text-muted-foreground text-sm" data-testid="text-error-message-performance-reviews">
                        {reviewsError.message || 'Failed to load performance reviews. Please try again.'}
                      </p>
                    </div>
                  ) : reviewsLoading ? (
                    <div className="space-y-4" data-testid="skeleton-performance-reviews">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-20 w-full" data-testid={`skeleton-performance-review-${index}`} />
                      ))}
                    </div>
                  ) : performanceReviews && performanceReviews.length > 0 ? (
                    <Table data-testid="table-performance-reviews">
                      <TableHeader>
                        <TableRow data-testid="header-performance-reviews">
                          <TableHead data-testid="column-review-employee">Employee</TableHead>
                          <TableHead data-testid="column-review-period">Period</TableHead>
                          <TableHead data-testid="column-review-dates">Review Dates</TableHead>
                          <TableHead data-testid="column-review-rating">Rating</TableHead>
                          <TableHead data-testid="column-review-status">Status</TableHead>
                          <TableHead data-testid="column-review-actions">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceReviews.map((review) => {
                          const employee = employees?.find(emp => emp.id === review.employeeId);
                          return (
                            <TableRow key={review.id} data-testid={`row-review-${review.id}`}>
                              <TableCell data-testid={`text-review-employee-${review.id}`}>
                                {employee?.employeeNumber} - {employee?.position}
                              </TableCell>
                              <TableCell data-testid={`text-review-period-${review.id}`}>
                                {review.reviewPeriod}
                              </TableCell>
                              <TableCell data-testid={`text-review-dates-${review.id}`}>
                                {formatDate(review.startDate)} - {formatDate(review.endDate)}
                              </TableCell>
                              <TableCell data-testid={`text-review-rating-${review.id}`}>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-4 h-4 ${i < (review.overallRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    {review.overallRating || 'N/A'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={getReviewStatusColor(review.status || 'draft')}
                                  data-testid={`badge-review-status-${review.id}`}
                                >
                                  {review.status || 'draft'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-view-review-${review.id}`}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-edit-review-${review.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8" data-testid="empty-performance-reviews">
                      <Star className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" data-testid="icon-empty-performance-reviews" />
                      <h3 className="text-lg font-medium mb-2" data-testid="text-empty-title-performance-reviews">No performance reviews found</h3>
                      <p className="text-muted-foreground text-sm" data-testid="text-empty-message-performance-reviews">
                        Create your first performance review to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AIChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
