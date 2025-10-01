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
import { maintenanceRequests as allMaintenanceRequests, tenants, properties, workers } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, User, Home, Calendar, AlertTriangle, Play, Square, Timer as TimerIcon, Bell, Wrench, CheckCircle, Phone, Send, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser, adminUser } from '@/hooks/use-current-user';
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
import { useState, useEffect, useMemo } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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
  const { user } = useCurrentUser();
  const { addNotification } = useNotifications();
  const requestId = params.id as string;
  
  const [maintenanceRequests, setMaintenanceRequests] = useState(allMaintenanceRequests);
  const initialRequest = useMemo(() => maintenanceRequests.find((r) => r.id === requestId), [maintenanceRequests, requestId]);
  
  const [request, setRequest] = useState(initialRequest);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [messages, setMessages] = useState([
    { id: 1, senderId: 'user-admin', text: 'Hey, any updates on the faucet leak?', timestamp: '10:30 AM' },
    { id: 2, senderId: 'user-worker-1', text: 'Just got to the property. I\'m taking a look now.', timestamp: '10:32 AM' },
    { id: 3, senderId: 'user-admin', text: 'Great, let me know what you find.', timestamp: '10:33 AM' },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editableIssue, setEditableIssue] = useState(request?.issue || "");
  const [editableDetails, setEditableDetails] = useState(request?.details || "");
  const [editablePriority, setEditablePriority] = useState(request?.priority || "Low");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else if (!isTimerRunning && timer !== 0 && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timer]);
  
  useEffect(() => {
    setRequest(maintenanceRequests.find((r) => r.id === requestId));
  }, [maintenanceRequests, requestId]);
  
  useEffect(() => {
    if (request) {
        setEditableIssue(request.issue);
        setEditableDetails(request.details || "");
        setEditablePriority(request.priority);
    }
  }, [request]);


  if (!request) {
    notFound();
  }
  
  const updateGlobalRequestState = (updatedRequest: any) => {
    const newRequests = maintenanceRequests.map(r => r.id === updatedRequest.id ? updatedRequest : r);
    const reqIndex = allMaintenanceRequests.findIndex(r => r.id === updatedRequest.id);
    if (reqIndex !== -1) {
        // @ts-ignore
        allMaintenanceRequests[reqIndex] = updatedRequest;
    }
    setMaintenanceRequests(newRequests);
  }

  // Role-based access control
  if (user && user.role === 'tenant' && request.tenantId !== user.id) {
     notFound();
  }
  
  if (user && user.role === 'worker') {
    const isAssignedToMe = request.assignedWorkerId === user.id;
    const canSeeUnassigned = !request.assignedWorkerId && user.assignedPropertyIds?.includes(request.propertyId);
    if (!isAssignedToMe && !canSeeUnassigned) {
      notFound();
    }
  }


  const handleStatusChange = (newStatus: "New" | "In Progress" | "Completed") => {
    if (request) {
        const updatedRequest = { ...request, status: newStatus };
        setRequest(updatedRequest);
        updateGlobalRequestState(updatedRequest);
        if (newStatus !== 'In Progress') {
            setIsTimerRunning(false);
        }
        if (newStatus === 'Completed') {
            addNotification({
                role: 'tenant',
                icon: CheckCircle,
                title: "Request Completed",
                description: `Your maintenance request "${request.issue}" has been completed.`
            })
        }
    }
  }

  const handleAssignRequest = (workerId: string | null) => {
    if (request) {
      const updatedRequest = { ...request, assignedWorkerId: workerId, status: workerId ? 'In Progress' : 'New' };
      setRequest(updatedRequest);
      updateGlobalRequestState(updatedRequest);

      addNotification({
        role: 'tenant',
        icon: Bell,
        title: "Request Assigned",
        description: `Your request "${request.issue}" has been assigned to a worker.`
      });

      if (workerId) {
         const worker = workers.find(w => w.id === workerId);
         if (worker) {
            addNotification({
                role: 'worker',
                icon: Wrench,
                title: "New Assignment",
                description: `You've been assigned a new task: "${request.issue}".`
            });
         }
      }
    }
  }
  
  const handleAssignToSelf = () => {
    if (request && user) {
      const updatedRequest = { ...request, assignedWorkerId: user.id, status: 'In Progress' };
      setRequest(updatedRequest);
      updateGlobalRequestState(updatedRequest);
      addNotification({
        role: 'tenant',
        icon: Bell,
        title: "Request Assigned",
        description: `Your request "${request.issue}" has been assigned to a worker.`
      });
      addNotification({
        role: 'worker',
        icon: Wrench,
        title: "New Assignment",
        description: `You've assigned yourself a new task: "${request.issue}".`
    });
    }
  }

  const handleStartTimer = () => {
    if (request && request.status !== 'In Progress') {
        const updatedRequest = { ...request, status: 'In Progress' };
        setRequest(updatedRequest);
        updateGlobalRequestState(updatedRequest);
    }
    setIsTimerRunning(true);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
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
  }
  
  const handleSaveChanges = () => {
    const updatedRequest = {
        ...request,
        issue: editableIssue,
        details: editableDetails,
        priority: editablePriority,
    };
    updateGlobalRequestState(updatedRequest);
    setIsEditing(false);
  }

  const formatTime = (seconds: number) => {
    const getSeconds = `0${seconds % 60}`.slice(-2);
    const minutes = `${Math.floor(seconds / 60)}`;
    const getMinutes = `0${parseInt(minutes, 10) % 60}`.slice(-2);
    const getHours = `0${Math.floor(seconds / 3600)}`.slice(-2);
    return `${getHours} : ${getMinutes} : ${getSeconds}`;
  };


  const tenant = tenants.find((t) => t.id === request.tenantId);
  const property = properties.find((p) => p.id === request.propertyId);
  
  const allUsers = [...tenants, ...workers, adminUser];
  const assignedToUser = request.assignedWorkerId ? allUsers.find(u => u.id === request.assignedWorkerId) : null;
  
  if (!user) {
    return null;
  }

  const isAssignedToMe = request.assignedWorkerId === user.id;
  const isAdmin = user.role === 'admin';
  const isWorker = user.role === 'worker';
  const isTenant = user.role === 'tenant';

  const canTakeAction = isAssignedToMe || (isAdmin && !request.assignedWorkerId) || (isAdmin && isAssignedToMe);

  const canClaimRequest = 
    !request.assignedWorkerId &&
    (isAdmin ||
     (user.role === 'worker' && !!user.assignedPropertyIds?.includes(request.propertyId)));
  
  const canManageUnassigned = !request.assignedWorkerId && isAdmin;
  
  const canChangeAssignment = !!request.assignedWorkerId && (isAssignedToMe || isAdmin);
  
  const showTimerAndStatus = !!request.assignedWorkerId && canTakeAction;
  
  const showChat = isAdmin || isWorker;

  const canTenantEdit = isTenant && !request.assignedWorkerId;
  
  const getMessageSender = (senderId: string) => {
    if (senderId === adminUser.id) return adminUser;
    return workers.find(w => w.id === senderId);
  }
  
  const workerForTenantView = request.assignedWorkerId ? workers.find(w => w.id === request.assignedWorkerId) : null;


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/maintenance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold md:text-3xl">
          Maintenance Request Details
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              {isEditing ? (
                 <Input value={editableIssue} onChange={(e) => setEditableIssue(e.target.value)} className="text-2xl font-bold" />
              ) : (
                <CardTitle>{request.issue}</CardTitle>
              )}
               {canTenantEdit && !isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Request
                  </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Description provided by tenant</h3>
                {isEditing ? (
                    <Textarea value={editableDetails} onChange={(e) => setEditableDetails(e.target.value)} rows={5}/>
                ) : (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {request.details}
                    </p>
                )}
              </div>
                <div className="flex justify-end gap-4 items-center">
                   {isEditing ? (
                        <>
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSaveChanges}>Save Changes</Button>
                        </>
                   ) : (
                     <>
                      {canClaimRequest && !isAdmin && (
                        <Button onClick={handleAssignToSelf}>Take Request</Button>
                      )}
                      
                       {canManageUnassigned && (
                         <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleAssignToSelf}>Take Request</Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button>Assign to Worker</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Available Workers</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {workers.map(worker => (
                                  <DropdownMenuItem key={worker.id} onSelect={() => handleAssignRequest(worker.id)}>
                                      {worker.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                      )}
                      
                       {showTimerAndStatus && (
                        <>
                          <div className="flex items-center gap-2">
                              <TimerIcon className="h-5 w-5 text-muted-foreground"/>
                              <span className="font-mono text-lg">{formatTime(timer)}</span>
                              {!isTimerRunning ? (
                                  <Button variant="outline" size="icon" onClick={handleStartTimer} disabled={!canTakeAction}>
                                      <Play className="h-4 w-4"/>
                                  </Button>
                              ) : (
                                  <Button variant="destructive" size="icon" onClick={handleStopTimer} disabled={!canTakeAction}>
                                      <Square className="h-4 w-4"/>
                                  </Button>
                              )}
                          </div>
                          <Select value={request.status} onValueChange={(val) => handleStatusChange(val as any)} disabled={!canTakeAction}>
                              <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="New">New</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                          </Select>
                        </>
                       )}
                     </>
                   )}
                </div>
            </CardContent>
          </Card>

          {(user.role === 'admin' || user.role === 'worker') && (
            <Card>
              <CardHeader>
                <CardTitle>Work Logs</CardTitle>
                <CardDescription>
                  Document the work performed to resolve this issue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid w-full gap-2">
                    <Label htmlFor="work-notes">Notes</Label>
                    <Textarea id="work-notes" placeholder="e.g., Replaced the washer in the kitchen faucet. Tested for leaks, none found." rows={4} disabled={!canTakeAction}/>
                  </div>
                </div>
              </CardContent>
              <CardFooter className='justify-end'>
                  <Button disabled={!canTakeAction}>Save Notes</Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
                <CardTitle>{isTenant && workerForTenantView ? "Assigned Worker Details" : "Request Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {!isTenant || !workerForTenantView ? (
                    <>
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                            <p className="font-medium">Tenant</p>
                            <p className="text-muted-foreground">{tenant?.name}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Tenant Phone</p>
                                <p className="text-muted-foreground">{tenant?.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Home className="h-5 w-5 text-muted-foreground" />
                            <div>
                            <p className="font-medium">Property</p>
                            <p className="text-muted-foreground">{property?.title}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Worker Name</p>
                                <p className="text-muted-foreground">{workerForTenantView.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Worker Phone</p>
                                <p className="text-muted-foreground">{workerForTenantView.phone}</p>
                            </div>
                        </div>
                    </>
                )}
             
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Submitted</p>
                  <p className="text-muted-foreground">{request.dateSubmitted}</p>
                </div>
              </div>
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="font-medium">Assigned To</p>
                  <p className="text-muted-foreground">
                      {assignedToUser ? assignedToUser.name : 'Unassigned'}
                  </p>
                </div>
                {canChangeAssignment && (
                  <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="outline" size="sm">Change</Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuLabel>Re-assign Request</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                         {workers.map(worker => (
                          <DropdownMenuItem key={worker.id} onSelect={() => handleAssignRequest(worker.id)}>
                              {worker.name}
                          </DropdownMenuItem>
                         ))}
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onSelect={() => handleAssignRequest(null)}>
                            Set to Unassigned
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                )}
               </div>
              <div className="flex items-center gap-3">
                  {isEditing ? (
                     <Select value={editablePriority} onValueChange={(val) => setEditablePriority(val as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Change priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getPriorityClasses(request.priority)}>
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {request.priority}
                    </Badge>
                  )}
              </div>
               <div className="flex items-center gap-3">
                 <Badge className={getStatusClasses(request.status)}>{request.status}</Badge>
              </div>
            </CardContent>
          </Card>
          
          {showChat && (
            <Card>
                <CardHeader>
                    <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4 h-64 overflow-y-auto pr-4">
                        {messages.map((msg) => {
                            const sender = getMessageSender(msg.senderId);
                            const isMe = msg.senderId === user.id;
                            return (
                                <div key={msg.id} className={cn("flex items-end gap-2", isMe && "justify-end")}>
                                   {!isMe && (
                                     <Avatar className="h-8 w-8">
                                       <AvatarImage src={`https://i.pravatar.cc/150?u=${sender?.id}`} alt={sender?.name} />
                                       <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                                     </Avatar>
                                   )}
                                   <div className={cn(
                                       "max-w-[75%] rounded-lg p-3 text-sm",
                                       isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                                   )}>
                                       <p>{msg.text}</p>
                                       <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground/70")}>{msg.timestamp}</p>
                                   </div>
                                    {isMe && (
                                     <Avatar className="h-8 w-8">
                                        <AvatarImage src={`https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                     </Avatar>
                                   )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
                <CardFooter>
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
                            className="min-h-[40px] resize-none"
                        />
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}