
import {
  maintenanceRequests as allMaintenanceRequests,
  overdueTenants,
  properties,
  rentPayments,
  tenants,
} from '@/lib/data';
import {
  ChartConfig,
} from '@/components/ui/chart';
import { Locale } from '@/i18n-config';
import DashboardPageContent from './dashboard-page-content';


const maintenanceChartConfig = {
  requests: {
    label: 'Requests',
  },
  new: {
    label: 'New',
    color: 'hsl(var(--chart-1))',
  },
  inProgress: {
    label: 'In Progress',
    color: 'hsl(var(--chart-2))',
  },
  completed: {
    label: 'Completed',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

const financialChartConfig = {
  amount: {
    label: 'Amount',
  },
  paid: {
    label: 'Paid',
    color: 'hsl(var(--chart-2))',
  },
  overdue: {
    label: 'Overdue',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

export default async function Dashboard({ params }: { params: Promise<{ lang: Locale }>}) {
  const { lang } = await params;

  const newCount = allMaintenanceRequests.filter(
    (r) => r.status === 'New'
  ).length;
  const inProgressCount = allMaintenanceRequests.filter(
    (r) => r.status === 'In Progress'
  ).length;
  const completedCount = allMaintenanceRequests.filter(
    (r) => r.status === 'Completed'
  ).length;

  const maintChart = [
    {
      status: 'New',
      requests: newCount,
      fill: 'var(--color-new)',
    },
    {
      status: 'In Progress',
      requests: inProgressCount,
      fill: 'var(--color-inProgress)',
    },
    {
      status: 'Completed',
      requests: completedCount,
      fill: 'var(--color-completed)',
    },
  ];

  const totalPaid = rentPayments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = rentPayments
    .filter((p) => p.status === 'Overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const finChart = [
    {
      name: 'Paid',
      amount: totalPaid,
      fill: 'var(--color-paid)',
    },
    {
      name: 'Overdue',
      amount: totalOverdue,
      fill: 'var(--color-overdue)',
    },
  ];

  const chartData = {
    maintenance: maintChart,
    financial: finChart,
  };

  return (
    <DashboardPageContent 
        lang={lang}
        chartData={chartData}
        maintenanceChartConfig={maintenanceChartConfig}
        financialChartConfig={financialChartConfig}
        maintenanceRequestsInit={allMaintenanceRequests}
        overdueTenantsInit={overdueTenants}
        propertiesInit={properties}
        tenantsInit={tenants}
        rentPaymentsInit={rentPayments}
    />
  );
}
