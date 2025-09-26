
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { workers as allWorkers, properties } from '@/lib/data';
import { Eye, Mail } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import DeleteUserDialog from '@/components/workers/delete-user-dialog';
import EditWorkerDialog from '@/components/workers/edit-worker-dialog';
import AddWorkerDialog from '@/components/workers/add-worker-dialog';

function getStatusVariant(status: string) {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Inactive':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState(allWorkers);

  const handleAddWorker = (newWorker: any) => {
    setWorkers([
      ...workers,
      {
        id: `user-worker-${workers.length + 1}`,
        ...newWorker,
      }
    ]);
  }

  const handleUpdateWorker = (updatedWorker: any) => {
    setWorkers(workers.map(w => w.id === updatedWorker.id ? updatedWorker : w));
  }

  const handleDeleteWorker = (workerId: string) => {
    // Soft delete: filter out the worker from the list
    setWorkers(workers.filter(w => w.id !== workerId));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Workers" description="View and manage your maintenance workers.">
        <AddWorkerDialog properties={properties} onAddWorker={handleAddWorker} />
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">
                  Assigned Properties
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => {
                const assignedProperties = properties.filter(p => worker.assignedPropertyIds?.includes(p.id));
                return (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                          <AvatarImage
                            src={`https://i.pravatar.cc/150?u=${worker.id}`}
                            alt={worker.name}
                          />
                          <AvatarFallback>
                            {worker.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                          <span className="font-medium">{worker.name}</span>
                           <span className="text-muted-foreground text-sm">{worker.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {assignedProperties.length > 0 ? assignedProperties.map(p => p.title).join(', ') : 'None'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(worker.status)}>
                        {worker.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/workers/${worker.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Details</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <EditWorkerDialog 
                            worker={worker}
                            properties={properties}
                            onUpdateWorker={handleUpdateWorker}
                           />
                          
                           <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Mail className="h-4 w-4" />
                                    <span className="sr-only">Send Message</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Send Message</p>
                            </TooltipContent>
                          </Tooltip>

                          <DeleteUserDialog user={worker} userType="worker" onDelete={() => handleDeleteWorker(worker.id)} />

                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
