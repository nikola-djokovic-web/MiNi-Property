

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tenants, properties, maintenanceRequests } from '@/lib/data';
import { notFound, useParams, usePathname } from 'next/navigation';
import { ArrowLeft, User, Home, Calendar, Mail, Phone, DollarSign, Wrench, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function getStatusVariant(status: string) {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Moving Out':
      return 'destructive';
    case 'New':
      return 'secondary';
    default:
      return 'outline';
  }
}

export default function TenantDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const tenantId = params.id as string;
  const lang = pathname.split('/')[1];
  
  const tenant = tenants.find((t) => t.id === tenantId);

  if (!tenant) {
    notFound();
  }

  const property = properties.find((p) => p.id === tenant.propertyId);
  const tenantMaintenanceRequests = maintenanceRequests.filter(req => req.tenantId === tenant.id);
  // @ts-ignore
  const onboardingChecklist = tenant.onboardingStatus || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/${lang}/tenants`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${tenant.id}`} alt={tenant.name} />
                <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-2xl font-bold md:text-3xl">
                {tenant.name}
                </h1>
                <Badge variant={getStatusVariant(tenant.status)}>{tenant.status}</Badge>
            </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">{tenant.email}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">{tenant.phone}</p>
                    </div>
                  </div>
               </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <CardDescription>
                A log of maintenance requests submitted by this tenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
                {tenantMaintenanceRequests.length > 0 ? (
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
                            {tenantMaintenanceRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.issue}</TableCell>
                                    <TableCell><Badge>{req.status}</Badge></TableCell>
                                    <TableCell>{req.dateSubmitted}</TableCell>
                                    <TableCell className='text-right'>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/${lang}/maintenance/${req.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-muted-foreground text-sm">No maintenance requests found.</p>
                )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lease Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Property</p>
                  <p className="text-muted-foreground">{property?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Lease End Date</p>
                  <p className="text-muted-foreground">{tenant.leaseEndDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Monthly Rent</p>
                  <p className="text-muted-foreground">${tenant.rent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
           {tenant.status === 'New' && (
            <Card>
                <CardHeader>
                    <CardTitle>Onboarding Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {onboardingChecklist.map((item: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                           <Checkbox id={`onboard-${index}`} checked={item.completed} />
                           <Label htmlFor={`onboard-${index}`} className={item.completed ? 'line-through text-muted-foreground' : ''}>
                               {item.text}
                           </Label>
                        </div>
                    ))}
                </CardContent>
            </Card>
           )}
        </div>
      </div>
    </div>
  );
}
