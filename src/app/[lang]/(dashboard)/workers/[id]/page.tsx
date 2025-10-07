'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/page-header';

export default function WorkerDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const workerId = params.id as string;
  const lang = pathname.split('/')[1];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Worker Profile"
        description={`Viewing worker ${workerId}`}
      >
        <Button asChild variant="outline">
          <Link href={`/${lang}/workers`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workers
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Worker #{workerId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Worker detail page is working! ID: {workerId}</p>
          <p className="text-muted-foreground">This page will show detailed worker information, assigned tasks, and performance metrics.</p>
        </CardContent>
      </Card>
    </div>
  );
}
