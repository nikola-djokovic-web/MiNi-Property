'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, Building, PlusCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import PageHeader from '@/components/page-header';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';

type Lease = {
  id: string;
  resident: string;
  startDate: string;
  endDate: string | null;
  monthlyRent: string | number;
};

type Unit = {
  id: string;
  label: string;
  bedrooms: number;
  rent: string | number;
  leases: Lease[];
};

type Property = {
  id: string;
  title: string;
  name: string;
  address: string;
  city: string;
  type: string;
};

function UnitDialog({
  propertyId,
  unit,
  onSaved,
}: {
  propertyId: string;
  unit?: Unit;
  onSaved: (unit: Unit) => void;
}) {
  const { dict } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(unit?.label || '');
  const [bedrooms, setBedrooms] = useState(String(unit?.bedrooms ?? 1));
  const [rent, setRent] = useState(String(unit?.rent ?? ''));
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(unit);

  useEffect(() => {
    if (open) {
      setLabel(unit?.label || '');
      setBedrooms(String(unit?.bedrooms ?? 1));
      setRent(String(unit?.rent ?? ''));
    }
  }, [open, unit]);

  const handleSave = async () => {
    if (!label.trim() || !rent.trim()) return;
    setSaving(true);
    try {
      const url = isEditing ? `/api/units/${unit!.id}` : `/api/properties/${propertyId}/units`;
      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          bedrooms: parseInt(bedrooms, 10) || 0,
          rent: parseFloat(rent) || 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to save unit');
      const result = await res.json();
      onSaved(result.data);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save unit:', error);
      toast({ title: dict?.units?.saveFailed || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">{dict?.units?.editUnit || 'Edit Unit'}</span>
          </Button>
        ) : (
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {dict?.units?.addUnit || 'Add Unit'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? (dict?.units?.editUnit || 'Edit Unit') : (dict?.units?.addUnit || 'Add Unit')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>{dict?.units?.label || 'Label'}</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={dict?.units?.labelPlaceholder || 'e.g. A-101'} />
          </div>
          <div className="grid gap-2">
            <Label>{dict?.units?.bedrooms || 'Bedrooms'}</Label>
            <Input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>{dict?.units?.rent || 'Monthly Rent'}</Label>
            <Input type="number" min={0} step="0.01" value={rent} onChange={(e) => setRent(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || !label.trim() || !rent.trim()}>
            {saving ? (dict?.common?.saving || 'Saving...') : (dict?.common?.save || 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaseDialog({
  unitId,
  lease,
  onSaved,
}: {
  unitId: string;
  lease?: Lease;
  onSaved: (lease: Lease) => void;
}) {
  const { dict } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [resident, setResident] = useState(lease?.resident || '');
  const [startDate, setStartDate] = useState(lease?.startDate ? lease.startDate.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(lease?.endDate ? lease.endDate.slice(0, 10) : '');
  const [monthlyRent, setMonthlyRent] = useState(String(lease?.monthlyRent ?? ''));
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(lease);

  useEffect(() => {
    if (open) {
      setResident(lease?.resident || '');
      setStartDate(lease?.startDate ? lease.startDate.slice(0, 10) : '');
      setEndDate(lease?.endDate ? lease.endDate.slice(0, 10) : '');
      setMonthlyRent(String(lease?.monthlyRent ?? ''));
    }
  }, [open, lease]);

  const handleSave = async () => {
    if (!resident.trim() || !startDate || !monthlyRent.trim()) return;
    setSaving(true);
    try {
      const url = isEditing ? `/api/leases/${lease!.id}` : `/api/units/${unitId}/leases`;
      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident: resident.trim(),
          startDate,
          endDate: endDate || null,
          monthlyRent: parseFloat(monthlyRent) || 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to save lease');
      const result = await res.json();
      onSaved(result.data);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save lease:', error);
      toast({ title: dict?.units?.saveFailed || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">{dict?.units?.editLease || 'Edit Lease'}</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {dict?.units?.addLease || 'Add Lease'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? (dict?.units?.editLease || 'Edit Lease') : (dict?.units?.addLease || 'Add Lease')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>{dict?.units?.resident || 'Resident'}</Label>
            <Input value={resident} onChange={(e) => setResident(e.target.value)} placeholder={dict?.units?.residentPlaceholder || 'Resident name'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{dict?.units?.startDate || 'Start Date'}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{dict?.units?.endDate || 'End Date'}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>{dict?.units?.rent || 'Monthly Rent'}</Label>
            <Input type="number" min={0} step="0.01" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || !resident.trim() || !startDate || !monthlyRent.trim()}>
            {saving ? (dict?.common?.saving || 'Saving...') : (dict?.common?.save || 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnitCard({ propertyId, unit, onUnitChanged, onUnitDeleted }: {
  propertyId: string;
  unit: Unit;
  onUnitChanged: (unit: Unit) => void;
  onUnitDeleted: (unitId: string) => void;
}) {
  const { dict } = useTranslation();
  const { toast } = useToast();

  const handleDeleteUnit = async () => {
    try {
      const res = await fetch(`/api/units/${unit.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete unit');
      onUnitDeleted(unit.id);
    } catch (error) {
      console.error('Failed to delete unit:', error);
      toast({ title: dict?.units?.deleteFailed || 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleDeleteLease = async (leaseId: string) => {
    try {
      const res = await fetch(`/api/leases/${leaseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lease');
      onUnitChanged({ ...unit, leases: unit.leases.filter((l) => l.id !== leaseId) });
    } catch (error) {
      console.error('Failed to delete lease:', error);
      toast({ title: dict?.units?.deleteFailed || 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleLeaseSaved = (lease: Lease) => {
    const exists = unit.leases.some((l) => l.id === lease.id);
    onUnitChanged({
      ...unit,
      leases: exists ? unit.leases.map((l) => (l.id === lease.id ? lease : l)) : [lease, ...unit.leases],
    });
  };

  const isActiveLease = (lease: Lease) => !lease.endDate || new Date(lease.endDate) >= new Date();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">{unit.label}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {unit.bedrooms} {dict?.units?.bedrooms || 'Bedrooms'} · ${Number(unit.rent).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <UnitDialog propertyId={propertyId} unit={unit} onSaved={onUnitChanged} />
          <ConfirmDeleteDialog
            itemName={unit.label}
            itemType={dict?.units?.deleteUnit || 'unit'}
            onConfirm={handleDeleteUnit}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">{dict?.units?.leases || 'Leases'}</h4>
          <LeaseDialog unitId={unit.id} onSaved={handleLeaseSaved} />
        </div>
        {unit.leases.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict?.units?.noLeasesYet || 'No leases yet.'}</p>
        ) : (
          <div className="space-y-2">
            {unit.leases.map((lease) => (
              <div key={lease.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium">
                    {lease.resident}
                    {isActiveLease(lease) && (
                      <Badge variant="secondary" className="text-[10px]">{dict?.units?.active || 'Active'}</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(lease.startDate).toLocaleDateString()} – {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : (dict?.units?.noEndDate || 'No end date')}
                    {' · '}${Number(lease.monthlyRent).toLocaleString()}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <LeaseDialog unitId={unit.id} lease={lease} onSaved={handleLeaseSaved} />
                  <ConfirmDeleteDialog
                    itemName={lease.resident}
                    itemType={dict?.units?.deleteLease || 'lease'}
                    onConfirm={() => handleDeleteLease(lease.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PropertyDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const propertyId = params.id as string;
  const lang = pathname.split('/')[1];
  const { user } = useCurrentUser();
  const { dict } = useTranslation();

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageUnits = user?.role === 'admin' || user?.role === 'owner';

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/properties/${propertyId}`, { cache: 'no-store' });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Failed to load property');
        if (alive) setProperty(body.data);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load property');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [propertyId]);

  useEffect(() => {
    if (!canManageUnits) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/units`, { cache: 'no-store' });
        if (!res.ok) return;
        const body = await res.json();
        if (alive) setUnits(body.data || []);
      } catch {
        // Units section is a non-critical add-on; a fetch failure here shouldn't block the rest of the page.
      }
    })();
    return () => {
      alive = false;
    };
  }, [propertyId, canManageUnits]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={dict?.propertyDetail?.notFound || 'Property not found'} description={error || (dict?.propertyDetail?.notFoundDescription || 'The requested property could not be found')}>
          <Button asChild variant="outline">
            <Link href={`/${lang}/properties`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {dict?.propertyDetail?.backToProperties || 'Back to Properties'}
            </Link>
          </Button>
        </PageHeader>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={property.title || property.name} description={`${property.address}, ${property.city}`}>
        <Button asChild variant="outline">
          <Link href={`/${lang}/properties`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {dict?.propertyDetail?.backToProperties || 'Back to Properties'}
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-5 w-5" />
            {property.title || property.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm text-muted-foreground">
          <p>{property.address}, {property.city}</p>
          <p>{property.type}</p>
        </CardContent>
      </Card>

      {canManageUnits && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{dict?.units?.title || 'Units & Leases'}</h2>
            <UnitDialog propertyId={propertyId} onSaved={(unit) => setUnits((prev) => [...prev, unit])} />
          </div>
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict?.units?.noUnitsYet || 'No units added yet.'}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {units.map((unit) => (
                <UnitCard
                  key={unit.id}
                  propertyId={propertyId}
                  unit={unit}
                  onUnitChanged={(updated) => setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))}
                  onUnitDeleted={(unitId) => setUnits((prev) => prev.filter((u) => u.id !== unitId))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
