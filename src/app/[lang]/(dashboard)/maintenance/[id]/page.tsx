'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notFound, useParams, usePathname } from 'next/navigation';
import { ArrowLeft, User, Home, Calendar, AlertTriangle, Play, Square, Timer as TimerIcon, Bell, Wrench, CheckCircle, Phone, Send, Pencil, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo, useRef } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import PageHeader from '@/components/page-header';

function getStatusClasses(status: string) {
  switch (status) {
    case 'New':
      return 'bg-gray-500 text-gray-foreground hover:bg-gray-500/80';
    case 'In Progress':
      return 'bg-yellow-500 text-yellow-foreground hover:bg-yellow-500/80';
    case 'Completed':
      return 'bg-green-600 text-green-foreground hover:bg-green-600/80';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}

function getPriorityClasses(priority: string) {
  switch (priority) {
    case 'High':
      return 'bg-destructive text-destructive-foreground';
    case 'Medium':
      return 'bg-yellow-500 text-yellow-foreground hover:bg-yellow-500/80';
    case 'Low':
      return 'bg-green-600 text-green-foreground hover:bg-green-600/80';
    default:
      return 'bg-gray-500 text-gray-foreground';
  }
}

export default function MaintenanceDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { addNotification } = useNotifications();
  const requestId = params.id as string;
  const lang = pathname.split('/')[1];
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [messages, setMessages] = useState([
    { id: 1, senderId: 'user-admin', text: 'Hey, any updates on the faucet leak?', timestamp: '10:30 AM' },
    { id: 2, senderId: 'user-worker-1', text: 'Just got to the property. I\'m taking a look now.', timestamp: '10:32 AM' },
    { id: 3, senderId: 'user-admin', text: 'Great, let me know what you find.', timestamp: '10:33 AM' },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const chatViewportRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editableIssue, setEditableIssue] = useState("");
  const [editableDetails, setEditableDetails] = useState("");
  const [editablePriority, setEditablePriority] = useState("Low");
  const [workers, setWorkers] = useState<any[]>([]);
  const [workNotes, setWorkNotes] = useState('');
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  // Fetch workers for assignment dropdown
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await fetch('/api/workers', {
          headers: {
            'x-tenant-id': user?.tenantId || 'default-tenant',
          },
        });
        if (response.ok) {
          const result = await response.json();
          setWorkers(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching workers:', error);
      }
    };

    if (user?.tenantId) {
      fetchWorkers();
    }
  }, [user?.tenantId]);

  // Fetch existing work logs
  useEffect(() => {
    const fetchWorkLogs = async () => {
      try {
        const response = await fetch(`/api/maintenance-requests/${requestId}/work-logs`, {
          headers: {
            'x-tenant-id': user?.tenantId || 'default-tenant',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          setWorkLogs(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching work logs:', error);
      }
    };

    if (user?.tenantId && requestId) {
      fetchWorkLogs();
    }
  }, [requestId, user?.tenantId]);

  // Load timer state from localStorage on component mount
  useEffect(() => {
    const savedTimerState = localStorage.getItem(`timer-${requestId}`);
    if (savedTimerState) {
      const { startTime, totalTime, isRunning } = JSON.parse(savedTimerState);
      setTotalTimeSpent(totalTime || 0);
      
      if (isRunning && startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTimer(totalTime + elapsed);
        setTimerStartTime(startTime);
        setIsTimerRunning(true);
      } else {
        setTimer(totalTime || 0);
      }
    }
  }, [requestId]);

  // Save timer state to localStorage
  useEffect(() => {
    const timerState = {
      startTime: timerStartTime,
      totalTime: totalTimeSpent,
      isRunning: isTimerRunning
    };
    localStorage.setItem(`timer-${requestId}`, JSON.stringify(timerState));
  }, [requestId, timerStartTime, totalTimeSpent, isTimerRunning]);

  // Fetch maintenance request data
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/maintenance-requests/${requestId}`, {
          headers: {
            'x-tenant-id': user?.tenantId || 'default-tenant',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch request: ${response.status}`);
        }
        
        const result = await response.json();
        const data = result.data || result; // Handle both formats
        setRequest(data);
        setEditableIssue(data.issue || "");
        setEditableDetails(data.details || "");
        setEditablePriority(data.priority || "Low");
      } catch (err) {
        console.error('Error fetching maintenance request:', err);
        setError(err instanceof Error ? err.message : 'Failed to load request');
      } finally {
        setLoading(false);
      }
    };

    if (user?.tenantId) {
      fetchRequest();
    }
  }, [requestId, user?.tenantId]);

  // Timer logic with persistence
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        setTimer(totalTimeSpent + elapsed);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timerStartTime, totalTimeSpent]);

  // Chat viewport auto-scroll - scroll to bottom when messages change
  useEffect(() => {
    if (chatViewportRef.current) {
      const scrollElement = chatViewportRef.current.querySelector('[data-radix-scroll-area-viewport]') || chatViewportRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const updateRequest = async (updates: any) => {
    try {
      const response = await fetch(`/api/maintenance-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || 'default-tenant',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update request');
      }

      const result = await response.json();
      const updatedRequest = result.data || result; // Handle both formats
      setRequest(updatedRequest);
      return updatedRequest;
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  };

  const handleStatusChange = async (newStatus: "New" | "In Progress" | "Completed") => {
    if (!request) return;
    
    try {
      await updateRequest({ status: newStatus });
      
      if (newStatus !== 'In Progress') {
        setIsTimerRunning(false);
      }
      
      if (newStatus === 'Completed') {
        addNotification({
          role: 'tenant',
          icon: 'CheckCircle',
          title: "Request Completed",
          description: `Your maintenance request "${request.issue}" has been completed.`
        });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAssignRequest = async (workerId: string) => {
    if (!request) return;
    
    // Handle unassign case
    const actualWorkerId = workerId === 'unassign' ? null : workerId;
    
    try {
      await updateRequest({ 
        assignedWorkerId: actualWorkerId, 
        status: actualWorkerId ? 'In Progress' : 'New' 
      });

      addNotification({
        role: 'tenant',
        icon: 'Bell',
        title: actualWorkerId ? "Request Assigned" : "Request Unassigned",
        description: actualWorkerId 
          ? `Your request "${request.issue}" has been assigned to a worker.`
          : `Your request "${request.issue}" has been unassigned.`
      });

      if (actualWorkerId) {
        const worker = workers.find(w => w.id === actualWorkerId);
        if (worker) {
          addNotification({
            role: 'worker',
            icon: 'Wrench',
            title: "New Assignment",
            description: `You've been assigned a new task: "${request.issue}".`
          });
        }
      }
    } catch (error) {
      console.error('Failed to assign worker:', error);
    }
  };
  
  const handleAssignToSelf = async () => {
    if (!request || !user) return;
    
    try {
      await updateRequest({ 
        assignedWorkerId: user.id, 
        status: 'In Progress' 
      });
      
      addNotification({
        role: 'tenant',
        icon: 'Bell',
        title: "Request Assigned",
        description: `Your request "${request.issue}" has been assigned to a worker.`
      });
      
      addNotification({
        role: 'worker',
        icon: 'Wrench',
        title: "New Assignment",
        description: `You've assigned yourself a new task: "${request.issue}".`
      });
    } catch (error) {
      console.error('Failed to assign to self:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!workNotes.trim()) return;
    
    try {
      // Create work log entry
      const workLogData = {
        notes: workNotes,
        requestId: request.id,
        userId: user?.id,
        userName: user?.name || 'Unknown User'
      };
      
      // In a real implementation, save to database via API
      const response = await fetch(`/api/maintenance-requests/${requestId}/work-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user?.tenantId || 'default-tenant',
        },
        body: JSON.stringify(workLogData),
      });
      
      if (response.ok) {
        // Add to local state for immediate UI update
        const newLog = {
          id: Date.now().toString(),
          notes: workNotes,
          timestamp: new Date().toLocaleString(),
          userId: user?.id,
          userName: user?.name || 'Unknown User'
        };
        
        setWorkLogs(prev => [...prev, newLog]);
        setWorkNotes('');
        
        addNotification({
          role: 'worker',
          icon: 'CheckCircle',
          title: 'Work Log Saved',
          description: 'Your work notes have been recorded successfully.'
        });
      } else {
        // Fallback: just add to local state if API fails
        const newLog = {
          id: Date.now().toString(),
          notes: workNotes,
          timestamp: new Date().toLocaleString(),
          userId: user?.id,
          userName: user?.name || 'Unknown User'
        };
        
        setWorkLogs(prev => [...prev, newLog]);
        setWorkNotes('');
        console.warn('Work log API failed, saved locally only');
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      // Fallback: add to local state anyway
      const newLog = {
        id: Date.now().toString(),
        notes: workNotes,
        timestamp: new Date().toLocaleString(),
        userId: user?.id,
        userName: user?.name || 'Unknown User'
      };
      
      setWorkLogs(prev => [...prev, newLog]);
      setWorkNotes('');
    }
  };

  const handleStartTimer = async () => {
    if (!request || !user) return;
    
    try {
      // If not assigned to anyone, assign to current user and start timer
      if (!request.assignedWorkerId) {
        await updateRequest({ 
          assignedWorkerId: user.id, 
          status: 'In Progress' 
        });
      } else if (request.status !== 'In Progress') {
        await updateRequest({ status: 'In Progress' });
      }
      
      const startTime = Date.now();
      setTimerStartTime(startTime);
      setIsTimerRunning(true);
      
      addNotification({
        role: 'tenant',
        icon: 'Play',
        title: 'Work Started',
        description: `Work has started on your request "${request.issue}".`
      });
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handleStopTimer = async () => {
    if (!timerStartTime) return;
    
    const sessionTime = Math.floor((Date.now() - timerStartTime) / 1000);
    const newTotalTime = totalTimeSpent + sessionTime;
    
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setTotalTimeSpent(newTotalTime);
    setTimer(newTotalTime);
    
    try {
      // Save time log when stopping timer
      if (sessionTime > 0) {
        const timeLog = {
          notes: `Worked for ${formatTime(sessionTime)} on this request`,
          requestId: request.id,
          userId: user?.id,
          userName: user?.name || 'Unknown User',
          timeSpent: sessionTime
        };
        
        // Save time log to work logs
        const response = await fetch(`/api/maintenance-requests/${requestId}/work-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': user?.tenantId || 'default-tenant',
          },
          body: JSON.stringify(timeLog),
        });
        
        if (response.ok) {
          const newLog = {
            id: Date.now().toString(),
            notes: timeLog.notes,
            timestamp: new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: user?.id,
            userName: user?.name || 'Unknown User',
            timeSpent: sessionTime
          };
          
          setWorkLogs(prev => [...prev, newLog]);
        }
      }
      
      addNotification({
        role: 'tenant',
        icon: 'Square',
        title: 'Work Paused',
        description: `Work has been paused on your request "${request.issue}".`
      });
    } catch (error) {
      console.error('Failed to log time:', error);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "" || !user) return;
    const msg = {
      id: messages.length + 1,
      senderId: user.id,
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, msg]);
    setNewMessage("");
    
    // Force scroll to bottom after a short delay to ensure message is rendered
    setTimeout(() => {
      if (chatViewportRef.current) {
        const scrollElement = chatViewportRef.current.querySelector('[data-radix-scroll-area-viewport]') || chatViewportRef.current;
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleSaveChanges = async () => {
    try {
      await updateRequest({
        issue: editableIssue,
        details: editableDetails,
        priority: editablePriority,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const getSeconds = `0${seconds % 60}`.slice(-2);
    const minutes = `${Math.floor(seconds / 60)}`;
    const getMinutes = `0${parseInt(minutes, 10) % 60}`.slice(-2);
    const getHours = `0${Math.floor(seconds / 3600)}`.slice(-2);
    return `${getHours} : ${getMinutes} : ${getSeconds}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Loading..."
          description="Fetching maintenance request details"
        >
          <Button asChild variant="outline">
            <Link href={`/${lang}/maintenance`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Maintenance
            </Link>
          </Button>
        </PageHeader>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Request Not Found"
          description={error || "The requested maintenance request could not be found"}
        >
          <Button asChild variant="outline">
            <Link href={`/${lang}/maintenance`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Maintenance
            </Link>
          </Button>
        </PageHeader>
      </div>
    );
  }

  // Role-based access control
  if (user && user.role === 'tenant' && request.tenantId !== user.tenantId) {
    notFound();
  }

  const isAdmin = user?.role === 'admin';
  const isWorker = user?.role === 'worker';
  const isTenant = user?.role === 'tenant';
  const isAssignedToMe = request.assignedWorkerId === user?.id;

  const canTakeAction = isAssignedToMe || (isAdmin && !request.assignedWorkerId) || (isAdmin && isAssignedToMe);
  const canClaimRequest = !request.assignedWorkerId && (isAdmin || isWorker);
  const canManageUnassigned = !request.assignedWorkerId && isAdmin;
  const canChangeAssignment = isAdmin; // Only admins can reassign requests
  const showTimerAndStatus = !!request.assignedWorkerId && canTakeAction;
  const showChat = isAdmin || isWorker;
  const canTenantEdit = isTenant && !request.assignedWorkerId;

  return (
    <div className="min-h-screen p-6">
      {/* Header with back button and title */}
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/${lang}/maintenance`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Maintenance Request Details</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Title and Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {isEditing ? (
                  <Input 
                    value={editableIssue} 
                    onChange={(e) => setEditableIssue(e.target.value)} 
                    className="text-2xl font-bold" 
                  />
                ) : (
                  request.issue
                )}
              </h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Description provided by tenant</h3>
                {isEditing ? (
                  <Textarea 
                    value={editableDetails} 
                    onChange={(e) => setEditableDetails(e.target.value)} 
                    rows={3}
                    className="resize-none"
                  />
                ) : (
                  <p className="text-muted-foreground leading-relaxed">
                    {request.details || 'No description provided'}
                  </p>
                )}
              </div>
              {/* Action Buttons */}
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveChanges}>
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    {canTenantEdit && (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Request
                      </Button>
                    )}
                    {/* Timer Display for Active Workers */}
                    {showTimerAndStatus && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded">
                          <TimerIcon className="h-5 w-5 text-primary"/>
                          <span className="font-mono text-lg">{formatTime(timer)}</span>
                          {!isTimerRunning ? (
                            <Button variant="outline" size="icon" onClick={handleStartTimer} disabled={!canTakeAction} className="ml-2">
                              <Play className="h-4 w-4"/>
                            </Button>
                          ) : (
                            <Button variant="destructive" size="icon" onClick={handleStopTimer} disabled={!canTakeAction} className="ml-2">
                              <Square className="h-4 w-4"/>
                            </Button>
                          )}
                        </div>
                        <Select value={request.status} onValueChange={(val) => handleStatusChange(val as any)} disabled={!canTakeAction}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  {/* Take Request and Assign Buttons */}
                  {canClaimRequest && (
                    <>
                      {/* Workers can only take unassigned requests */}
                      {isWorker && !request.assignedWorkerId && (
                        <Button onClick={handleAssignToSelf}>
                          Take Request
                        </Button>
                      )}
                      {/* Admins can take requests and assign to others */}
                      {isAdmin && (
                        <>
                          {!request.assignedWorkerId && (
                            <Button onClick={handleAssignToSelf}>
                              Take Request
                            </Button>
                          )}
                          <Select onValueChange={handleAssignRequest}>
                            <SelectTrigger className="w-auto px-4 h-10">
                              <SelectValue placeholder="Assign to Worker" />
                            </SelectTrigger>
                            <SelectContent>
                              {workers.map((worker) => (
                                <SelectItem key={worker.id} value={worker.id}>
                                  {worker.name} ({worker.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            </CardContent>
          </Card>

          {/* Work Logs Section */}
          {(showTimerAndStatus || isAdmin) && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-2">Work Logs</h2>
                <p className="text-muted-foreground text-sm mb-6">Document the work performed to resolve this issue.</p>
                
                {/* Existing Work Logs */}
                {workLogs.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {workLogs.map((log) => (
                      <div key={log.id} className="bg-muted rounded p-4 border">
                        <p className="text-sm mb-2">{log.notes}</p>
                        <p className="text-muted-foreground text-xs">
                          {log.timestamp} - {log.userName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Notes Input - Only for assigned worker or admin */}
                {(isAssignedToMe || (isAdmin && request.assignedWorkerId === user?.id)) && (
                  <div className="space-y-4">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="e.g., Replaced the washer in the kitchen faucet. Tested for leaks, none found."
                      value={workNotes}
                      onChange={(e) => setWorkNotes(e.target.value)}
                      rows={4}
                      className="resize-none"
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveNotes} 
                      disabled={!workNotes.trim()}
                      className="bg-teal-600 text-white hover:bg-teal-700"
                    >
                    </Button>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Request Details Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-6">Request Details</h3>
              
              {/* Tenant Info */}
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-orange-500 text-white">
                    {request.tenant?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Tenant</p>
                  <p className="font-medium">
                    {request.tenant?.name || 'Alice Johnson'}
                  </p>
                </div>
              </div>
              
              {/* Property & Date Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-muted-foreground mb-1">Property</p>
                  <p className="font-medium">
                    {request.property?.name || request.propertyName || 'Modern Downtown Apartment'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Submitted</p>
                <p className="font-medium">
                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString('de-DE') : '20.07.2024'}
                </p>
              </div>
            </div>
            
            {/* AI Category */}
            <div className="mb-6">
              <p className="text-muted-foreground text-sm mb-1">AI Category</p>
              <p className="font-medium">
                {request.issue?.toLowerCase().includes('leak') || request.issue?.toLowerCase().includes('faucet') || request.issue?.toLowerCase().includes('pipe') ? 'Plumbing' :
                 request.issue?.toLowerCase().includes('electric') || request.issue?.toLowerCase().includes('light') || request.issue?.toLowerCase().includes('outlet') ? 'Electrical' :
                 request.issue?.toLowerCase().includes('heat') || request.issue?.toLowerCase().includes('ac') || request.issue?.toLowerCase().includes('air') ? 'HVAC' :
                 request.issue?.toLowerCase().includes('door') || request.issue?.toLowerCase().includes('window') || request.issue?.toLowerCase().includes('lock') ? 'Hardware' :
                 'General Maintenance'}
              </p>
            </div>
            
            {/* Assigned To */}
            <div className="mb-6">
              <p className="text-muted-foreground text-sm mb-2">Assigned To</p>
              {request.assignedWorkerId ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {(() => {
                        // First try to find in workers array
                        const worker = workers.find(w => w.id === request.assignedWorkerId);
                        if (worker) return worker.name?.charAt(0) || 'W';
                        
                        // If not found in workers, check if it's the current user (could be admin)
                        if (user?.id === request.assignedWorkerId) {
                          return user?.name?.charAt(0) || 'A';
                        }
                        
                        return 'U';
                      })()} 
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {(() => {
                        // First try to find in workers array
                        const worker = workers.find(w => w.id === request.assignedWorkerId);
                        if (worker) return worker.name;
                        
                        // If not found in workers, check if it's the current user (could be admin)
                        if (user?.id === request.assignedWorkerId) {
                          return `${user?.name || 'Admin'} (Admin)`;
                        }
                        
                        return 'Unknown User';
                      })()} 
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {(() => {
                        // First try to find in workers array
                        const worker = workers.find(w => w.id === request.assignedWorkerId);
                        if (worker) return worker.email;
                        
                        // If not found in workers, check if it's the current user (could be admin)
                        if (user?.id === request.assignedWorkerId) {
                          return user?.email || '';
                        }
                        
                        return '';
                      })()} 
                    </p>
                  </div>
                </div>
              ) : (
                <p className="font-medium">Unassigned</p>
              )}
              
              {/* Reassignment for admins */}
              {canChangeAssignment && request.assignedWorkerId && (
                <div className="mt-3">
                  <Select value={request.assignedWorkerId || undefined} onValueChange={handleAssignRequest}>
                    <SelectTrigger>
                      <SelectValue placeholder="Reassign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassign">Unassign</SelectItem>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name} ({worker.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {/* Status & Priority Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={cn(
                "border-0 text-white",
                request.priority === 'High' ? 'bg-red-600' : 
                request.priority === 'Medium' ? 'bg-yellow-600' : 'bg-green-600'
              )}>
                {request.priority === 'High' && '⚠ '}{request.priority || 'Low'} Priority
              </Badge>
              <Badge className={cn(
                "border-0 text-white",
                request.status === 'New' ? 'bg-gray-600' :
                request.status === 'In Progress' ? 'bg-blue-600' : 'bg-green-600'
              )}>
              </Badge>
            </div>
            </CardContent>
          </Card>

          {/* Chat Section */}
          {showChat && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Chat</h3>
                
                <ScrollArea className="h-40 w-full mb-4" ref={chatViewportRef}>
                  <div className="space-y-3 pr-4">
                    {messages.length > 0 ? (
                      messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div key={msg.id} className={cn("flex items-end gap-2", isMe && "justify-end")}>
                            {!isMe && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{msg.senderId.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn(
                              "max-w-[75%] rounded-lg p-2 text-xs",
                              isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                              <p>{msg.text}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {msg.timestamp}
                              </p>
                            </div>
                            {isMe && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-primary text-primary-foreground rounded-lg p-3 text-sm">
                        <p>faucet leak?</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">10:30 AM</span>
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs bg-orange-500 text-white">A</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex w-full items-center gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                className="min-h-[36px] resize-none"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim()}
                size="sm"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
