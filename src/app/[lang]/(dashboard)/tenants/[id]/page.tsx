"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Home, Mail, Pencil, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EditTenantDialog from "@/components/tenants/edit-tenant-dialog";
import SendMessageDialog from "@/components/tenants/send-message-dialog";
import DeleteUserDialog from "@/components/workers/delete-user-dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

export default function TenantDetailPage() {
  const { user: currentUser } = useCurrentUser();
  const { dict } = useTranslation();
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split("/")[1] || "en";
  const [tenant, setTenant] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/tenants/${params.id}`, { headers: { "x-tenant-id": TENANT_ID }, cache: "no-store" }),
      fetch("/api/properties?page=1&pageSize=100", { headers: { "x-tenant-id": TENANT_ID }, cache: "no-store" }),
    ]).then(async ([tenantResponse, propertiesResponse]) => {
      if (!tenantResponse.ok) throw new Error("Tenant not found");
      const tenantResult = await tenantResponse.json();
      const propertiesResult = await propertiesResponse.json();
      if (active) {
        setTenant(tenantResult.data);
        setProperties((propertiesResult.data ?? []).map((property: any) => ({
          ...property,
          title: property.title ?? property.name ?? "Untitled",
        })));
      }
    }).catch((error) => {
      console.error(error);
      if (active) setTenant(null);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [params.id]);

  const handleUpdate = (updated: any) => setTenant((current: any) => ({ ...current, ...updated }));
  const handleDelete = async () => {
    const response = await fetch(`/api/tenants?id=${params.id}`, {
      method: "DELETE",
      headers: { "x-tenant-id": TENANT_ID },
    });
    if (response.ok) router.push(`/${lang}/tenants`);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">{dict?.common?.loading || "Loading..."}</div>;
  if (!tenant) return <div className="p-8 text-center text-muted-foreground">{dict?.common?.pageNotFound || "Tenant not found."}</div>;

  const canManage = currentUser?.role === "admin" || currentUser?.role === "owner";
  const property = tenant.property ?? properties.find((item) => item.id === tenant.propertyId);
  const initials = tenant.name?.split(" ").map((part: string) => part[0]).join("").slice(0, 2) || "T";

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/${lang}/tenants`} className={cn(buttonVariants({ variant: "ghost" }), "w-fit -ml-3")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> {dict?.common?.backTo || "Back to tenants"}
      </Link>

      <Card className="overflow-hidden border-primary/20">
        <div className="h-24 bg-primary/10" />
        <CardContent className="relative px-5 pb-5 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={tenant.profileImage || undefined} alt={tenant.name || "Tenant"} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-2xl font-semibold tracking-tight">{tenant.name || "Unnamed tenant"}</h1>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {tenant.email}</p>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              <TooltipProvider>
                {canManage && <EditTenantDialog tenant={tenant} properties={properties} onUpdateTenant={handleUpdate} />}
                <SendMessageDialog tenant={tenant} />
                {canManage && <DeleteUserDialog user={tenant} userType="tenant" onDelete={handleDelete} />}
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Tenant information</CardTitle><CardDescription>Contact and account details.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <InfoItem icon={<UserRound />} label="Full name" value={tenant.name || "Not provided"} />
            <InfoItem icon={<Mail />} label="Email address" value={tenant.email} />
            <InfoItem icon={<CheckCircle2 />} label="Account status" value={tenant.registered ? "Active" : "Invitation pending"} />
            <InfoItem icon={<Calendar />} label="Joined" value={new Date(tenant.createdAt).toLocaleDateString()} />
            <InfoItem icon={<Calendar />} label="Last updated" value={new Date(tenant.updatedAt).toLocaleDateString()} />
            {tenant.companyName && <InfoItem icon={<Home />} label="Company" value={tenant.companyName} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assigned property</CardTitle><CardDescription>Current building assignment.</CardDescription></CardHeader>
          <CardContent>
            {property ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3"><div className="rounded-md bg-primary/10 p-2 text-primary"><Home className="h-5 w-5" /></div><div><p className="font-medium">{property.title || property.name}</p><p className="text-sm text-muted-foreground">{property.address}, {property.city}</p></div></div>
                <Badge variant="secondary">Assigned</Badge>
              </div>
            ) : <p className="text-sm text-muted-foreground">No property assigned.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3"><span className="mt-0.5 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span><div><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-medium break-words">{value}</p></div></div>;
}
