
import { Locale } from '@/i18n-config';
import DashboardPageContent from './dashboard-page-content';
import {
  ChartConfig,
} from '@/components/ui/chart';

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "x-tenant-id": TENANT_ID },
    // Remove cache: "no-store" to avoid static generation issues
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(
      res.status === 404
        ? `Not found: ${url}`
        : `API error ${res.status}: ${msg}`
    );
  }
  return res.json();
}

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

  console.log('🔧 Dashboard server-side - starting API fetches...');

  // Use full URLs for server-side fetching
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:9002';
  
  // Fetch real data from APIs with better error handling
  const [
    maintenanceRequestsResult,
    propertiesResult,
    tenantsResult,
  ] = await Promise.all([
    apiGet<{ data: any[] }>(`${baseUrl}/api/maintenance-requests`).catch((error) => {
      console.error('❌ Failed to fetch maintenance requests:', error.message);
      return { data: [] };
    }),
    apiGet<{ data: any[] }>(`${baseUrl}/api/properties`).catch((error) => {
      console.error('❌ Failed to fetch properties:', error.message);
      return { data: [] };
    }),
    apiGet<{ data: any[] }>(`${baseUrl}/api/tenants`).catch((error) => {
      console.error('❌ Failed to fetch tenants:', error.message);
      return { data: [] };
    }),
  ]);

  const allMaintenanceRequests = maintenanceRequestsResult.data || [];
  const properties = propertiesResult.data || [];
  const tenants = tenantsResult.data || [];

  console.log('📊 Dashboard server-side data fetched:', {
    maintenanceRequests: allMaintenanceRequests.length,
    properties: properties.length,
    tenants: tenants.length
  });

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
        rentPaymentsInit={[]} // Mock empty array for now
    />
  );
}
