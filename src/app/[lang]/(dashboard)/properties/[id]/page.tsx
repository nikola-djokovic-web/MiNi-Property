'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/page-header';

export default function PropertyDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const propertyId = params.id as string;
  const lang = pathname.split('/')[1];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Property Details"
        description={`Viewing property ${propertyId}`}
      >
        <Button asChild variant="outline">
          <Link href={`/${lang}/properties`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Property #{propertyId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Property detail page is working! ID: {propertyId}</p>
          <p className="text-muted-foreground">This page will show detailed property information, tenants, and maintenance history.</p>
        </CardContent>
      </Card>
    </div>
  );
}
