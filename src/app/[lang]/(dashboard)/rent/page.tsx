

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { rentPayments, tenants as allTenants } from "@/lib/data";
import { DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import SendMessageDialog from "@/components/tenants/send-message-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTranslation } from "@/hooks/use-translation";

function getStatusVariant(status: string) {
  switch (status) {
    case "Paid":
      return "default";
    case "Overdue":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function RentPage() {
  const { user } = useCurrentUser();
  const { dict } = useTranslation();

  const rentStats = [
    {
      title: dict?.rent?.totalCollectedLabel || "Total Collected (July)",
      value: "$64,350",
      icon: <CheckCircle2 className="size-5 text-accent" />,
    },
    {
      title: dict?.rent?.overdueLabel || "Overdue",
      value: "$2,050",
      icon: <AlertTriangle className="size-5 text-destructive" />,
    },
    {
      title: dict?.rent?.upcomingLabel || "Upcoming (August)",
      value: "$68,500",
      icon: <DollarSign className="size-5 text-muted-foreground" />,
    },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Paid":
        return dict?.rent?.statusPaid || "Paid";
      case "Overdue":
        return dict?.rent?.statusOverdue || "Overdue";
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={dict?.rent?.title || "Rent Collection"}
        description={dict?.rent?.description || "Track rent payments across your properties."}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {rentStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict?.rent?.paymentHistory || "Payment History"}</CardTitle>
          <CardDescription>
            {dict?.rent?.paymentHistoryDescription || "A log of recent rent payment transactions for this month."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict?.properties?.table?.tenant || "Tenant"}</TableHead>
                  <TableHead className="hidden sm:table-cell">{dict?.common?.date || "Date"}</TableHead>
                  <TableHead className="hidden sm:table-cell">{dict?.common?.status || "Status"}</TableHead>
                  <TableHead>{dict?.common?.amount || "Amount"}</TableHead>
                  <TableHead className="text-right">{dict?.common?.actions || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentPayments.map((payment) => {
                  // Correctly find the tenant from the allTenants array
                  const tenant = allTenants.find(t => t.id === payment.tenantId);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.tenantName}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(payment.date).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={getStatusVariant(payment.status)}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`font-medium ${
                          payment.status === "Overdue" ? "text-destructive" : ""
                        }`}
                      >
                        ${payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {user?.role === 'admin' && payment.status === 'Overdue' && tenant && (
                           <SendMessageDialog tenant={tenant} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
