
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Users,
  FileText,
  Search as SearchIcon,
  Wrench,
  UserCog,
  Home,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { usePathname } from 'next/navigation';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResults {
  properties: any[];
  tenants: any[];
  workers: any[];
  maintenance: any[];
  units: any[];
  leases: any[];
}

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

async function searchData(query: string): Promise<SearchResults> {
  if (!query || query.length < 2) {
    return {
      properties: [],
      tenants: [],
      workers: [],
      maintenance: [],
      units: [],
      leases: []
    };
  }

  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    headers: { "x-tenant-id": TENANT_ID },
    cache: "no-store",
  });
  
  if (!res.ok) {
    throw new Error('Search failed');
  }
  
  const result = await res.json();
  return result.data;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    properties: [],
    tenants: [],
    workers: [],
    maintenance: [],
    units: [],
    leases: []
  });
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'en';

  // Reset query when dialog is closed
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({
        properties: [],
        tenants: [],
        workers: [],
        maintenance: [],
        units: [],
        leases: []
      });
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const searchResults = await searchData(query);
          setResults(searchResults);
        } catch (error) {
          console.error('Search error:', error);
          setResults({
            properties: [],
            tenants: [],
            workers: [],
            maintenance: [],
            units: [],
            leases: []
          });
        } finally {
          setLoading(false);
        }
      } else {
        setResults({
          properties: [],
          tenants: [],
          workers: [],
          maintenance: [],
          units: [],
          leases: []
        });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const totalResults = useMemo(() => {
    return results.properties.length +
           results.tenants.length +
           results.workers.length +
           results.maintenance.length +
           results.units.length +
           results.leases.length;
  }, [results]);

  const hasResults = totalResults > 0;
  const hasQuery = query.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties, tenants, workers, maintenance..."
            value={query}
            onChange={handleQueryChange}
            className="pl-10"
          />
        </div>
        <ScrollArea className="h-[50vh] pr-4">
          {!hasQuery && (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
              <SearchIcon className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-xl font-bold">Search the application</h2>
              <p className="text-muted-foreground">
                Find properties, tenants, workers, maintenance requests, units, leases, and more.
              </p>
            </div>
          )}

          {loading && hasQuery && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {hasQuery && !loading && !hasResults && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No results found.</p>
            </div>
          )}

          {hasQuery && !loading && hasResults && (
            <div className="space-y-6">
              {/* Properties */}
              {results.properties.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Building2 className="h-5 w-5" />
                    Properties ({results.properties.length})
                  </h3>
                  <div className="grid gap-2">
                    {results.properties.map((property: any) => (
                      <Link
                        href={`/${lang}/properties`}
                        key={property.id}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border hover:bg-muted"
                      >
                        <div className="font-semibold">{property.title || property.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {property.address}, {property.city} • {property.type}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tenants */}
              {results.tenants.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Users className="h-5 w-5" />
                    Tenants ({results.tenants.length})
                  </h3>
                  <div className="grid gap-2">
                    {results.tenants.map((tenant: any) => (
                      <Link
                        href={`/${lang}/tenants/${tenant.id}`}
                        key={tenant.id}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border hover:bg-muted"
                      >
                        <div className="font-semibold">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {tenant.email}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Workers */}
              {results.workers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <UserCog className="h-5 w-5" />
                    Workers ({results.workers.length})
                  </h3>
                  <div className="grid gap-2">
                    {results.workers.map((worker: any) => (
                      <Link
                        href={`/${lang}/workers/${worker.id}`}
                        key={worker.id}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border hover:bg-muted"
                      >
                        <div className="font-semibold">{worker.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {worker.email} • {worker.role}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance Requests */}
              {results.maintenance.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Wrench className="h-5 w-5" />
                    Maintenance ({results.maintenance.length})
                  </h3>
                  <div className="grid gap-2">
                    {results.maintenance.map((req: any) => (
                      <Link
                        href={`/${lang}/properties`}
                        key={req.id}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border hover:bg-muted"
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-semibold">{req.issue}</div>
                          <Badge
                            variant={
                              req.priority === 'High'
                                ? 'destructive'
                                : req.priority === 'Medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {req.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {req.property?.title || req.property?.name} • {req.status}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Units */}
              {results.units.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Home className="h-5 w-5" />
                    Units ({results.units.length})
                  </h3>
                  <div className="grid gap-2">
                    {results.units.map((unit: any) => (
                      <Link
                        href={`/${lang}/properties`}
                        key={unit.id}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border hover:bg-muted"
                      >
                        <div className="font-semibold">Unit {unit.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {unit.property?.title || unit.property?.name} • {unit.bedrooms} bed(s) • ${unit.rent}/month
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Leases */}
              {results.leases.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Calendar className="h-5 w-5" />
                    Leases ({results.leases.length})
                  </h3>
                  <div className="grid gap-2">
                    {results.leases.map((lease: any) => (
                      <Link
                        href={`/${lang}/properties`}
                        key={lease.id}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border hover:bg-muted"
                      >
                        <div className="font-semibold">{lease.resident}</div>
                        <div className="text-sm text-muted-foreground">
                          {lease.unit?.property?.title || lease.unit?.property?.name} - Unit {lease.unit?.label} • ${lease.monthlyRent}/month
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
