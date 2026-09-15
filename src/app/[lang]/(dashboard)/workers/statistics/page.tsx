'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Star, Wrench, CheckCircle2, Clock, Timer as TimerIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/page-header';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTranslation } from '@/hooks/use-translation';

type WorkerStat = {
  worker: { id: string; name: string | null; email: string; profileImage: string | null };
  completedRequests: number;
  activeRequests: number;
  avgRating: number | null;
  avgCloseTimeHours: number | null;
  totalTimeLoggedSeconds: number;
  workLogCount: number;
};

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0 && minutes === 0) return '0m';
  return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
}

function formatCloseTime(hours: number | null) {
  if (hours == null) return '—';
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function WorkerStatisticsPage() {
  const pathname = usePathname();
  const lang = pathname.split('/')[1];
  const { user } = useCurrentUser();
  const { dict } = useTranslation();

  const [stats, setStats] = useState<WorkerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof Pick<WorkerStat, 'completedRequests' | 'activeRequests' | 'avgRating' | 'avgCloseTimeHours' | 'totalTimeLoggedSeconds'>>('completedRequests');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/workers/stats', { cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load worker statistics');
        if (!cancelled) setStats(body.data || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load worker statistics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isWorker = user?.role === 'worker';

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return (bv as number) - (av as number);
    });
  }, [stats, sortKey]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={dict?.workers?.statistics?.title || 'Worker Statistics'}
          description={error}
        />
      </div>
    );
  }

  // A worker only ever gets their own row back from the API - render it as a card set,
  // matching the layout already used on the individual worker profile page.
  if (isWorker) {
    const mine = sorted[0];
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={dict?.workers?.statistics?.title || 'Worker Statistics'}
          description={dict?.workers?.statistics?.myDescription || 'Your performance across completed maintenance requests.'}
        />
        {!mine ? (
          <p className="text-muted-foreground">{dict?.workers?.statistics?.noData || 'No data yet.'}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict?.workers?.profile?.completedRequests || 'Completed Requests'}</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mine.completedRequests}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict?.workers?.profile?.activeRequests || 'Active Requests'}</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mine.activeRequests}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict?.workers?.statistics?.avgRating || 'Average Rating'}</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><RatingStars rating={mine.avgRating} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict?.workers?.profile?.timeLogged || 'Time Logged'}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(mine.totalTimeLoggedSeconds)}</div>
                <p className="text-xs text-muted-foreground">{mine.workLogCount} {dict?.workers?.profile?.workLogs || 'work logs'}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Admin/owner: leaderboard across all workers.
  const sortableColumns: { key: typeof sortKey; label: string }[] = [
    { key: 'completedRequests', label: dict?.workers?.profile?.completedRequests || 'Completed' },
    { key: 'activeRequests', label: dict?.workers?.profile?.activeRequests || 'Active' },
    { key: 'avgRating', label: dict?.workers?.statistics?.avgRating || 'Avg Rating' },
    { key: 'avgCloseTimeHours', label: dict?.workers?.statistics?.avgCloseTime || 'Avg Close Time' },
    { key: 'totalTimeLoggedSeconds', label: dict?.workers?.profile?.timeLogged || 'Time Logged' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={dict?.workers?.statistics?.title || 'Worker Statistics'}
        description={dict?.workers?.statistics?.description || 'Compare performance and workload across your team.'}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict?.workers?.table?.name || 'Worker'}</TableHead>
                {sortableColumns.map((col) => (
                  <TableHead
                    key={col.key}
                    className="cursor-pointer select-none"
                    onClick={() => setSortKey(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && ' ▾'}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={sortableColumns.length + 1} className="text-center text-muted-foreground py-8">
                    {dict?.workers?.statistics?.noWorkers || 'No workers yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((row) => (
                  <TableRow key={row.worker.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${row.worker.id}`} alt={row.worker.name || ''} />
                          <AvatarFallback>{row.worker.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{row.worker.name || row.worker.email}</p>
                          <p className="text-muted-foreground text-xs">{row.worker.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{row.completedRequests}</TableCell>
                    <TableCell>{row.activeRequests}</TableCell>
                    <TableCell><RatingStars rating={row.avgRating} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <TimerIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatCloseTime(row.avgCloseTimeHours)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(row.totalTimeLoggedSeconds)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
