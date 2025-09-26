
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  properties,
  tenants,
  documents,
  maintenanceRequests,
  workers,
} from '@/lib/data';
import {
  Building2,
  Users,
  FileText,
  Search as SearchIcon,
  Wrench,
  UserCog,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');

  // Reset query when dialog is closed
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const lowercasedQuery = query.toLowerCase();

  const filteredProperties = query
    ? properties.filter(
        (p) =>
          p.title.toLowerCase().includes(lowercasedQuery) ||
          p.address.toLowerCase().includes(lowercasedQuery) ||
          p.type.toLowerCase().includes(lowercasedQuery)
      )
    : [];

  const filteredTenants = query
    ? tenants.filter((t) => {
        const property = properties.find((p) => p.id === t.propertyId);
        return (
          t.name.toLowerCase().includes(lowercasedQuery) ||
          (property &&
            property.title.toLowerCase().includes(lowercasedQuery)) ||
          t.email.toLowerCase().includes(lowercasedQuery)
        );
      })
    : [];
  
  const filteredWorkers = query
    ? workers.filter(
        (w) =>
          w.name.toLowerCase().includes(lowercasedQuery) ||
          w.email.toLowerCase().includes(lowercasedQuery)
      )
    : [];

  const filteredDocuments = query
    ? documents.filter(
        (d) =>
          d.name.toLowerCase().includes(lowercasedQuery) ||
          d.type.toLowerCase().includes(lowercasedQuery)
      )
    : [];

  const filteredMaintenance = query
    ? maintenanceRequests.filter((m) => {
        const property = properties.find((p) => p.id === m.propertyId);
        const tenant = tenants.find((t) => t.id === m.tenantId);
        return (
          (tenant && tenant.name.toLowerCase().includes(lowercasedQuery)) ||
          (property &&
            property.title.toLowerCase().includes(lowercasedQuery)) ||
          (m.issue || '').toLowerCase().includes(lowercasedQuery) ||
          (m.status || '').toLowerCase().includes(lowercasedQuery) ||
          (m.priority || '').toLowerCase().includes(lowercasedQuery)
        );
      })
    : [];

  const totalResults =
    filteredProperties.length +
    filteredTenants.length +
    filteredWorkers.length +
    filteredDocuments.length +
    filteredMaintenance.length;
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
            placeholder="Search properties, tenants, workers..."
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
                Find properties, tenants, workers, documents, and more.
              </p>
            </div>
          )}

          {hasQuery && !hasResults && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No results found.</p>
            </div>
          )}

          {hasQuery && hasResults && (
            <div className="space-y-6">
              {filteredProperties.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Building2 className="h-5 w-5" />
                    Properties ({filteredProperties.length})
                  </h3>
                  <div className="grid gap-2">
                    {filteredProperties.map((property) => (
                      <Link
                        href="/properties"
                        key={property.id}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border hover:bg-muted"
                      >
                        <div className="font-semibold">{property.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {property.address}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {filteredTenants.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Users className="h-5 w-5" />
                    Tenants ({filteredTenants.length})
                  </h3>
                  <div className="grid gap-2">
                    {filteredTenants.map((tenant) => {
                      const property = properties.find(
                        (p) => p.id === tenant.propertyId
                      );
                      return (
                        <Link
                          href={`/tenants/${tenant.id}`}
                          key={tenant.id}
                          onClick={() => onOpenChange(false)}
                          className="block p-3 rounded-lg border hover:bg-muted"
                        >
                          <div className="font-semibold">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {property?.title}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

               {filteredWorkers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <UserCog className="h-5 w-5" />
                    Workers ({filteredWorkers.length})
                  </h3>
                  <div className="grid gap-2">
                    {filteredWorkers.map((worker) => (
                      <Link
                        href={`/workers/${worker.id}`}
                        key={worker.id}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border hover:bg-muted"
                      >
                        <div className="font-semibold">{worker.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {worker.email}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {filteredDocuments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <FileText className="h-5 w-5" />
                    Documents ({filteredDocuments.length})
                  </h3>
                  <div className="grid gap-2">
                    {filteredDocuments.map((doc) => (
                      <Link
                        href="/documents"
                        key={doc.id}
                        onClick={() => onOpenChange(false)}
                        className="block p-3 rounded-lg border hover:bg-muted"
                      >
                        <div className="font-semibold">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {doc.type}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {filteredMaintenance.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Wrench className="h-5 w-5" />
                    Maintenance ({filteredMaintenance.length})
                  </h3>
                  <div className="grid gap-2">
                    {filteredMaintenance.map((req) => {
                      const property = properties.find(
                        (p) => p.id === req.propertyId
                      );
                      const tenant = tenants.find((t) => t.id === req.tenantId);
                      return (
                        <Link
                          href={`/maintenance/${req.id}`}
                          key={req.id}
                          onClick={() => onOpenChange(false)}
                          className="block p-3 rounded-lg border hover:bg-muted"
                        >
                          <div className="flex justify-between">
                            <div className="font-semibold">{req.issue}</div>
                            <Badge
                              variant={
                                req.priority === 'High'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {req.priority}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {property?.title} - {tenant?.name}
                          </div>
                        </Link>
                      );
                    })}
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
