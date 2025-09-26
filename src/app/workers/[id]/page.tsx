
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { workers, properties, maintenanceRequests } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

export default function WorkerDetailPage() {
  const params = useParams();
  const workerId = params.id as string;
  
  const worker = workers.find((w) => w.id === workerId);

  if (!worker) {
    notFound();
  }

  const assignedProperties = properties.filter(p => worker.assignedPropertyIds?.includes(p.id));
  const workerMaintenanceRequests = maintenanceRequests.filter(req => req.assignedWorkerId === worker.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/workers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${worker.id}`} alt={worker.name} />
                <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-2xl font-bold md:text-3xl">
                {worker.name}
                </h1>
                <Badge variant={getStatusVariant(worker.status)}>{worker.status}</Badge>
            </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Worker Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">{worker.email}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">{worker.phone}</p>
                    </div>
                  </div>
               </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assigned Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
                {workerMaintenanceRequests.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Issue</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className='text-right'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workerMaintenanceRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.issue}</TableCell>
                                    <TableCell><Badge>{req.status}</Badge></TableCell>
                                    <TableCell>{req.dateSubmitted}</TableCell>
                                    <TableCell className='text-right'>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/maintenance/${req.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-muted-foreground text-sm">No maintenance requests assigned.</p>
                )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                {assignedProperties.length > 0 ? assignedProperties.map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                        <p className="font-medium">{p.title}</p>
                        <p className="text-muted-foreground">{p.address}</p>
                        </div>
                    </div>
                )) : (
                     <p className="text-muted-foreground text-sm">No primary properties assigned.</p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
