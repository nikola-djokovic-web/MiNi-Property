
import { Locale } from '@/i18n-config';
import { getSessionUser } from '@/lib/auth';
import {
  listMaintenanceRequestsForUser,
  listPropertiesForUser,
  listTenantsForUser,
} from '@/server/queries';
import { prisma } from '@/server/db';
import DashboardPageContent from './dashboard-page-content';
import {
  ChartConfig,
} from '@/components/ui/chart';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

  const user = await getSessionUser();

  // Fetch data directly from the database (no self HTTP round-trip).
  // The (dashboard) layout already redirects unauthenticated users to /login.
  const [allMaintenanceRequests, properties, tenantsResult, news] = user
    ? await Promise.all([
        listMaintenanceRequestsForUser(user),
        listPropertiesForUser(user),
        listTenantsForUser(user),
        prisma.newsPost.findMany({
          where: { tenantId: user.tenantId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ])
    : [[], [], { data: [] as any[] }, []];

  const tenants = tenantsResult.data;

  const newCount = allMaintenanceRequests.filter(
    (r: any) => r.status === 'New'
  ).length;
  const inProgressCount = allMaintenanceRequests.filter(
    (r: any) => r.status === 'In Progress'
  ).length;
  const completedCount = allMaintenanceRequests.filter(
    (r: any) => r.status === 'Completed'
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

  // Mock financial data for now (can be replaced with real data later)
  const finChart = [
    {
      name: 'Paid',
      amount: 15000,
      fill: 'var(--color-paid)',
    },
    {
      name: 'Overdue',
      amount: 2500,
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
        overdueTenantsInit={[]} // Mock empty array for now
        propertiesInit={properties}
        tenantsInit={tenants}
        newsInit={news}
        rentPaymentsInit={[]} // Mock empty array for now
    />
  );
}
