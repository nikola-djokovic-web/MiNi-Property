'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, CheckCircle2, Clock, Mail, User, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TooltipProvider } from '@/components/ui/tooltip';
import PageHeader from '@/components/page-header';
import EditWorkerDialog from '@/components/workers/edit-worker-dialog';
import DeleteUserDialog from '@/components/workers/delete-user-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

type WorkerDetail = {
  worker: { id: string; name: string; email: string; profileImage: string | null; createdAt: string };
  properties: { id: string; name: string; title: string; address: string; city: string; imageUrl: string }[];
  maintenanceRequests: {
    id: string;
    issue: string;
    status: string;
    priority: string;
    dateSubmitted: string;
    property: { id: string; name: string; title: string } | null;
  }[];
  stats: {
    assignedProperties: number;
    activeRequests: number;
    completedRequests: number;
    totalTimeLoggedSeconds: number;
    workLogCount: number;
  };
};

function getStatusClasses(status: string) {
  switch (status) {
    case 'New':
      return 'bg-gray-500 text-white hover:bg-gray-500/80';
    case 'In Progress':
      return 'bg-yellow-500 text-white hover:bg-yellow-500/80';
    case 'Completed':
      return 'bg-green-600 text-white hover:bg-green-600/80';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}

function getPriorityClasses(priority: string) {
  switch (priority) {
    case 'High':
      return 'bg-destructive text-destructive-foreground';
    case 'Medium':
      return 'bg-yellow-500 text-white hover:bg-yellow-500/80';
    case 'Low':
      return 'bg-green-600 text-white hover:bg-green-600/80';
    default:
      return 'bg-gray-500 text-white';
  }
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0 && minutes === 0) return '0m';
  return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
}

export default function WorkerDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const workerId = params.id as string;
  const lang = pathname.split('/')[1];
  const { toast } = useToast();
  const { dict } = useTranslation();

  const [data, setData] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allProperties, setAllProperties] = useState<any[]>([]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workers/${workerId}`, { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to load worker');
      setData(body.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load worker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetch('/api/properties', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((body) => setAllProperties(body.data || []))
      .catch(() => setAllProperties([]));
  }, [workerId]);

  const handleUpdateWorker = () => {
    fetchDetail();
  };

  const handleDeleteWorker = async () => {
    try {
      const res = await fetch(`/api/workers/${workerId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete worker');
      }
      toast({ title: dict?.workers?.deleted || 'Worker deleted' });
      router.push(`/${lang}/workers`);
    } catch (e: any) {
      toast({ title: dict?.workers?.deleteFailed || 'Failed to delete worker', description: e?.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={dict?.common?.pageNotFound || "Worker Not Found"} description={error || (dict?.workers?.profile?.notFound || 'This worker could not be found.')}>
          <Button asChild variant="outline">
            <Link href={`/${lang}/workers`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {dict?.workers?.profile?.backToWorkers || "Back to Workers"}
            </Link>
          </Button>
        </PageHeader>
      </div>
    );
  }

  const { worker, properties, maintenanceRequests, stats } = data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={dict?.workers?.profile?.title || "Worker Profile"} description={(dict?.workers?.profile?.description || "Details, assignments, and activity for {name}").replace("{name}", worker.name)}>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/${lang}/workers`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {dict?.workers?.profile?.backToWorkers || "Back to Workers"}
            </Link>
          </Button>
          <TooltipProvider>
            <EditWorkerDialog worker={worker as any} properties={allProperties} onUpdateWorker={handleUpdateWorker} />
            <DeleteUserDialog user={worker} userType="worker" onDelete={handleDeleteWorker} />
          </TooltipProvider>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${worker.id}`} alt={worker.name} />
            <AvatarFallback>{worker.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <User className="h-4 w-4 text-muted-foreground" />
              {worker.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {worker.email}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict?.workers?.profile?.assignedProperties || "Assigned Properties"}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedProperties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict?.workers?.profile?.activeRequests || "Active Requests"}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict?.workers?.profile?.completedRequests || "Completed Requests"}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict?.workers?.profile?.timeLogged || "Time Logged"}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalTimeLoggedSeconds)}</div>
            <p className="text-xs text-muted-foreground">{stats.workLogCount} {dict?.workers?.profile?.workLogs || "work logs"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict?.workers?.profile?.assignedProperties || "Assigned Properties"}</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict?.workers?.profile?.noPropertiesAssigned || "No properties assigned yet."}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => (
                <Link
                  key={p.id}
                  href={`/${lang}/properties/${p.id}`}
                  className="rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{p.title || p.name}</div>
                  <div className="text-muted-foreground">{p.address}{p.city ? `, ${p.city}` : ''}</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict?.workers?.profile?.maintenanceRequests || "Maintenance Requests"}</CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict?.workers?.profile?.noRequestsAssigned || "No maintenance requests assigned yet."}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {maintenanceRequests.map((r) => (
                <Link
                  key={r.id}
                  href={`/${lang}/maintenance/${r.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.issue}</div>
                    <div className="text-muted-foreground truncate">
                      {r.property?.title || r.property?.name || 'Unknown property'} · {new Date(r.dateSubmitted).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge className={cn('border-0', getPriorityClasses(r.priority))}>{r.priority}</Badge>
                    <Badge className={cn('border-0', getStatusClasses(r.status))}>{r.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
