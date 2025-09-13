import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Search, Plus, Edit, Trash2, Clock, DollarSign, Calendar, 
  Phone, Mail, MapPin, User, Building, Briefcase, UserCheck,
  CheckCircle, XCircle, Timer, PlayCircle, PauseCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertEmployeeSchema, insertTimeEntrySchema, insertPayrollRunSchema, insertPayrollItemSchema,
  type Employee, type InsertEmployee, type TimeEntry, type InsertTimeEntry,
  type PayrollRun, type InsertPayrollRun, type PayrollItem, type User as UserType
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function HR() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("employees");
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isCreateTimeEntryOpen, setIsCreateTimeEntryOpen] = useState(false);
  const [isCreatePayrollOpen, setIsCreatePayrollOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth() as { user: UserType | null };

  // Employee queries
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useQuery<(Employee & { user: UserType; manager?: UserType })[]>({
    queryKey: ["/api/hr/employees", selectedDepartment],
    queryFn: async () => {
      const url = selectedDepartment ? `/api/hr/employees?department=${selectedDepartment}` : "/api/hr/employees";
      const response = await apiRequest("GET", url);
      return await response.json();
    },
  });

  // Time entries queries
  const { data: timeEntries, isLoading: timeEntriesLoading } = useQuery<(TimeEntry & { employee: Employee & { user: UserType }; approver?: UserType })[]>({
    queryKey: ["/api/hr/time-entries"],
    enabled: activeTab === "time-tracking",
  });

  // Payroll queries
  const { data: payrollRuns, isLoading: payrollLoading } = useQuery<(PayrollRun & { processedByUser?: UserType })[]>({
    queryKey: ["/api/hr/payroll-runs"],
    enabled: activeTab === "payroll",
  });

  // Employee form
  const employeeForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      userId: "",
      employeeNumber: "",
      department: "",
      position: "",
      hireDate: "",
      baseSalary: "0",
      currency: "AOA",
      employmentStatus: "active",
      workSchedule: "full_time",
      emergencyContactName: "",
      emergencyContactPhone: "",
      isActive: true,
    },
  });

  // Time entry form  
  const timeEntryForm = useForm<InsertTimeEntry>({
    resolver: zodResolver(insertTimeEntrySchema),
    defaultValues: {
      employeeId: "",
      date: "",
      entryType: "regular",
      totalHours: "0",
      overtimeHours: "0",
      notes: "",
    },
  });

  // Payroll form
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

  // Employee mutations
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("POST", "/api/hr/employees", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      setIsCreateEmployeeOpen(false);
      employeeForm.reset();
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: isUnauthorizedError(error) 
          ? "You don't have permission to create employees"
          : "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  // Time entry mutations
  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: InsertTimeEntry) => {
      const response = await apiRequest("POST", "/api/hr/time-entries", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-entries"] });
      setIsCreateTimeEntryOpen(false);
      timeEntryForm.reset();
      toast({
        title: "Success",
        description: "Time entry created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "You don't have permission to create time entries"
          : "Failed to create time entry",
        variant: "destructive",
      });
    },
  });

  // Payroll mutations
  const createPayrollMutation = useMutation({
    mutationFn: async (data: InsertPayrollRun) => {
      const response = await apiRequest("POST", "/api/hr/payroll-runs", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/payroll-runs"] });
      setIsCreatePayrollOpen(false);
      payrollForm.reset();
      toast({
        title: "Success",
        description: "Payroll run created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "You don't have permission to create payroll runs"
          : "Failed to create payroll run",
        variant: "destructive",
      });
    },
  });

  const approveTimeEntryMutation = useMutation({
    mutationFn: async (timeEntryId: string) => {
      const response = await apiRequest("PATCH", `/api/hr/time-entries/${timeEntryId}/approve`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/time-entries"] });
      toast({
        title: "Success",
        description: "Time entry approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to approve time entry",
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = employees?.filter(employee => 
    employee.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const canManageEmployees = user?.role === 'admin' || user?.role === 'hr';
  const canManagePayroll = user?.role === 'admin' || user?.role === 'hr';
  const canApproveTime = user?.role === 'admin' || user?.role === 'hr';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Human Resources" subtitle="Manage employees, time tracking, and payroll" onOpenAIChat={() => setIsChatOpen(true)} />
        
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Human Resources</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage employees, time tracking, and payroll
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
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
              </TabsList>

              {/* Employees Tab */}
              <TabsContent value="employees" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                        data-testid="input-search-employees"
                      />
                    </div>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-48" data-testid="select-department">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Departments</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Inventory">Inventory</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {canManageEmployees && (
                    <Dialog open={isCreateEmployeeOpen} onOpenChange={setIsCreateEmployeeOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-create-employee">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Employee
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Create New Employee</DialogTitle>
                        </DialogHeader>
                        <Form {...employeeForm}>
                          <form onSubmit={employeeForm.handleSubmit((data) => createEmployeeMutation.mutate(data))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={employeeForm.control}
                                name="userId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>User ID</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-user-id" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={employeeForm.control}
                                name="employeeNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Employee Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-employee-number" />
                                    </FormControl>
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
                                    <FormLabel>Department</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "regular"}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-employee-department">
                                          <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="HR">HR</SelectItem>
                                        <SelectItem value="Sales">Sales</SelectItem>
                                        <SelectItem value="Inventory">Inventory</SelectItem>
                                        <SelectItem value="Finance">Finance</SelectItem>
                                        <SelectItem value="IT">IT</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={employeeForm.control}
                                name="position"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-position" />
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
                                    <FormLabel>Hire Date</FormLabel>
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
                                    <FormLabel>Base Salary (AOA)</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} data-testid="input-base-salary" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end space-x-3">
                              <Button type="button" variant="outline" onClick={() => setIsCreateEmployeeOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={createEmployeeMutation.isPending} data-testid="button-submit-employee">
                                {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Employees Grid */}
                {employeesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
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
                ) : employeesError ? (
                  <div className="text-center py-12">
                    <XCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Error loading employees</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {isUnauthorizedError(employeesError) 
                        ? "You don't have permission to view employees"
                        : "Please try again later"}
                    </p>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No employees found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new employee.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map((employee) => (
                      <Card key={employee.id} className="hover:shadow-md transition-shadow" data-testid={`card-employee-${employee.id}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{employee.user.firstName} {employee.user.lastName}</span>
                            <Badge variant={employee.employmentStatus === 'active' ? 'default' : 'secondary'}>
                              {employee.employmentStatus}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">#{employee.employeeNumber}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center text-sm">
                            <Building className="w-4 h-4 mr-2 text-gray-400" />
                            {employee.department}
                          </div>
                          <div className="flex items-center text-sm">
                            <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                            {employee.position}
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            Hired: {format(new Date(employee.hireDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center text-sm">
                            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                            {parseFloat(employee.baseSalary).toLocaleString()} {employee.currency}
                          </div>
                          {employee.user.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {employee.user.email}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Time Tracking Tab */}
              <TabsContent value="time-tracking" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Time Tracking</h2>
                  <Dialog open={isCreateTimeEntryOpen} onOpenChange={setIsCreateTimeEntryOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-time-entry">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Time Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create Time Entry</DialogTitle>
                      </DialogHeader>
                      <Form {...timeEntryForm}>
                        <form onSubmit={timeEntryForm.handleSubmit((data) => createTimeEntryMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={timeEntryForm.control}
                            name="employeeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-time-employee">
                                      <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {employees?.map((employee) => (
                                      <SelectItem key={employee.id} value={employee.id}>
                                        {employee.user.firstName} {employee.user.lastName} - {employee.department}
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
                                  <FormLabel>Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} data-testid="input-time-date" />
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
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-entry-type">
                                        <SelectValue placeholder="Select entry type" />
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
                              name="totalHours"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Total Hours</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.25" {...field} value={field.value || ''} data-testid="input-total-hours" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={timeEntryForm.control}
                              name="overtimeHours"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Overtime Hours</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.25" {...field} value={field.value || ''} data-testid="input-overtime-hours" />
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
                                  <Textarea {...field} value={field.value || ''} placeholder="Optional notes..." data-testid="input-time-notes" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-3">
                            <Button type="button" variant="outline" onClick={() => setIsCreateTimeEntryOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createTimeEntryMutation.isPending} data-testid="button-submit-time-entry">
                              {createTimeEntryMutation.isPending ? "Creating..." : "Create Entry"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Time Entries List */}
                {timeEntriesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeEntries?.map((entry) => (
                      <Card key={entry.id} data-testid={`card-time-entry-${entry.id}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h3 className="font-semibold">
                                  {entry.employee.user.firstName} {entry.employee.user.lastName}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {entry.employee.department} • {format(new Date(entry.date), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge variant={entry.entryType === 'regular' ? 'default' : 'secondary'}>
                                {entry.entryType?.replace('_', ' ') || 'N/A'}
                              </Badge>
                              {entry.approvedAt ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : canApproveTime ? (
                                <Button
                                  size="sm"
                                  onClick={() => approveTimeEntryMutation.mutate(entry.id)}
                                  disabled={approveTimeEntryMutation.isPending}
                                  data-testid={`button-approve-${entry.id}`}
                                >
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                              ) : (
                                <Badge variant="outline">Pending</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Total Hours:</span>
                              <p className="font-semibold">{entry.totalHours || 0}h</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Overtime:</span>
                              <p className="font-semibold">{entry.overtimeHours || 0}h</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Clock In:</span>
                              <p>{entry.clockIn ? format(new Date(entry.clockIn), 'HH:mm') : 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Clock Out:</span>
                              <p>{entry.clockOut ? format(new Date(entry.clockOut), 'HH:mm') : 'N/A'}</p>
                            </div>
                          </div>
                          {entry.notes && (
                            <div className="mt-3 text-sm">
                              <span className="text-gray-500">Notes:</span>
                              <p className="mt-1">{entry.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Payroll Tab */}
              <TabsContent value="payroll" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Payroll Management</h2>
                  {canManagePayroll && (
                    <Dialog open={isCreatePayrollOpen} onOpenChange={setIsCreatePayrollOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-create-payroll">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Payroll Run
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Create Payroll Run</DialogTitle>
                        </DialogHeader>
                        <Form {...payrollForm}>
                          <form onSubmit={payrollForm.handleSubmit((data) => createPayrollMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={payrollForm.control}
                              name="payrollPeriod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payroll Period</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., 2024-01" data-testid="input-payroll-period" />
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
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} data-testid="input-payroll-start" />
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
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} data-testid="input-payroll-end" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end space-x-3">
                              <Button type="button" variant="outline" onClick={() => setIsCreatePayrollOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={createPayrollMutation.isPending} data-testid="button-submit-payroll">
                                {createPayrollMutation.isPending ? "Creating..." : "Create Payroll"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Payroll Runs List */}
                {payrollLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payrollRuns?.map((payroll) => (
                      <Card key={payroll.id} data-testid={`card-payroll-${payroll.id}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">Payroll Period: {payroll.payrollPeriod}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {format(new Date(payroll.startDate), 'MMM dd')} - {format(new Date(payroll.endDate), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <Badge variant={payroll.status === 'completed' ? 'default' : 'secondary'}>
                              {payroll.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Gross Pay:</span>
                              <p className="font-semibold">
                                {parseFloat(payroll.totalGrossPay || '0').toLocaleString()} {payroll.currency}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Deductions:</span>
                              <p className="font-semibold">
                                {parseFloat(payroll.totalDeductions || '0').toLocaleString()} {payroll.currency}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Net Pay:</span>
                              <p className="font-semibold">
                                {parseFloat(payroll.totalNetPay || '0').toLocaleString()} {payroll.currency}
                              </p>
                            </div>
                          </div>
                          {payroll.processedAt && (
                            <div className="mt-3 text-sm text-gray-500">
                              Processed on {format(new Date(payroll.processedAt), 'MMM dd, yyyy HH:mm')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}