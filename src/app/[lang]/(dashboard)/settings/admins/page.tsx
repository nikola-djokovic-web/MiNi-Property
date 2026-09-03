"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimatedTableRow } from "@/components/ui/animated-table-row";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Trash2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiSend } from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePathname } from "next/navigation";
import AddAdminDialog from "@/components/admins/add-admin-dialog";
import DeleteUserDialog from "@/components/workers/delete-user-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

console.log("TENANT_ID in admin page:", TENANT_ID); // Debug log

export default function AdminsPage() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const { toast } = useToast();
  const { dict } = useTranslation();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Redirect non-admin users to theme settings
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const lang = pathname.split('/')[1];
      window.location.href = `/${lang}/settings/theme`;
    }
  }, [user, pathname]);
  
  // Don't render anything for non-admin users
  if (user && user.role !== 'admin') {
    return null;
  }

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      console.log("Fetching admins with TENANT_ID:", TENANT_ID);
      const response = await fetch(`/api/admins`, {
        headers: { "x-tenant-id": TENANT_ID },
        cache: "no-store",
      });
      console.log("Admin API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Admin API error:", errorText);
        throw new Error(`Failed to fetch admins: ${response.status}`);
      }
      const data = await response.json();
      console.log("Admin API data:", data);
      setAdmins(data.data || []);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast({
        title: dict?.common?.error || "Error",
        description: dict?.settings?.admins?.loadFailed || "Failed to load administrators",
        variant: "destructive",
      });
      // Set empty array on error so we show "no administrators" instead of infinite loading
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (adminData: any) => {
    await fetchAdmins(); // Refresh the list
    toast({
      title: dict?.settings?.admins?.adminInvited || "Admin Invited",
      description: (dict?.settings?.admins?.adminInvitedDescription || "Invitation sent to {email}").replace("{email}", adminData.email),
      variant: "default",
      className: "bg-green-50 border-green-200 text-green-900",
    });
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await apiSend(`/api/admins?id=${adminId}`, "DELETE", {}, TENANT_ID);
      await fetchAdmins(); // Refresh the list
      toast({
        title: dict?.settings?.admins?.adminRemoved || "Admin Removed",
        description: dict?.settings?.admins?.adminRemovedDescription || "Administrator has been removed successfully",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    } catch (error) {
      toast({
        title: dict?.common?.error || "Error",
        description: dict?.settings?.admins?.removeFailed || "Failed to remove administrator",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (admin: any) => {
    const hasPassword = admin.passwordHash;
    if (hasPassword) {
      return <Badge className="bg-green-100 text-green-800">{dict?.common?.active || "Active"}</Badge>;
    } else {
      return <Badge variant="secondary">{dict?.common?.pending || "Pending"}</Badge>;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={dict?.settings?.admins?.title || "Administrators"}
          description={dict?.settings?.admins?.description || "Manage administrator accounts for your organization."}
        >
          <AddAdminDialog onAddAdmin={handleAddAdmin} />
        </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict?.common?.name || "Name"}</TableHead>
                <TableHead>{dict?.common?.email || "Email"}</TableHead>
                <TableHead>{dict?.common?.status || "Status"}</TableHead>
                <TableHead className="text-right">{dict?.common?.actions || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {dict?.settings?.admins?.loading || "Loading administrators…"}
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {dict?.settings?.admins?.noAdminsYet || "No administrators yet."}
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                          <AvatarFallback>
                            {admin.name?.charAt(0) || admin.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                          <span className="font-medium">
                            {admin.name || "—"}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {dict?.settings?.admins?.administratorRole || "Administrator"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {admin.email}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(admin)}</TableCell>
                    <TableCell className="text-right">
                      <DeleteUserDialog
                        user={admin}
                        userType="admin"
                        onDelete={() => handleDeleteAdmin(admin.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}