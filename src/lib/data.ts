
import { PlaceHolderImages } from "@/lib/placeholder-images";

export type Property = {
  id: string;
  title: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  imageUrl: string;
  imageHint: string;
  assignedWorkerId: string | null;
};

export const properties: Property[] = [
  {
    id: "prop-1",
    title: "Modern Downtown Apartment",
    address: "123 Main St, Anytown, USA",
    price: 2200,
    beds: 2,
    baths: 2,
    sqft: 1100,
    type: "Apartment",
    imageUrl:
      PlaceHolderImages.find((img) => img.id === "property-1")?.imageUrl || "",
    imageHint:
      PlaceHolderImages.find((img) => img.id === "property-1")?.imageHint || "",
    assignedWorkerId: "user-worker-1",
  },
  {
    id: "prop-2",
    title: "Cozy Suburban House",
    address: "456 Oak Ave, Suburbia, USA",
    price: 3500,
    beds: 4,
    baths: 3,
    sqft: 2400,
    type: "House",
    imageUrl:
      PlaceHolderImages.find((img) => img.id === "property-2")?.imageUrl || "",
    imageHint:
      PlaceHolderImages.find((img) => img.id === "property-2")?.imageHint || "",
    assignedWorkerId: "user-worker-1",
  },
  {
    id: "prop-3",
    title: "Stylish City Condo",
    address: "789 Pine Ln, Metropolia, USA",
    price: 1850,
    beds: 1,
    baths: 1,
    sqft: 750,
    type: "Condo",
    imageUrl:
      PlaceHolderImages.find((img) => img.id === "property-3")?.imageUrl || "",
    imageHint:
      PlaceHolderImages.find((img) => img.id === "property-3")?.imageHint || "",
    assignedWorkerId: "user-worker-2",
  },
  {
    id: "prop-4",
    title: "Quaint Studio Loft",
    address: "101 River Rd, Old Town, USA",
    price: 1500,
    beds: 0,
    baths: 1,
    sqft: 500,
    type: "Studio",
    imageUrl:
      PlaceHolderImages.find((img) => img.id === "property-4")?.imageUrl || "",
    imageHint:
      PlaceHolderImages.find((img) => img.id === "property-4")?.imageHint || "",
    assignedWorkerId: null,
  },
  {
    id: "prop-5",
    title: "Spacious Family Home",
    address: "212 Maple Dr, Greenfield, USA",
    price: 4200,
    beds: 5,
    baths: 4,
    sqft: 3200,
    type: "House",
    imageUrl:
      PlaceHolderImages.find((img) => img.id === "property-5")?.imageUrl || "",
    imageHint:
      PlaceHolderImages.find((img) => img.id === "property-5")?.imageHint || "",
    assignedWorkerId: null,
  },
  {
    id: "prop-6",
    title: "Luxury Penthouse",
    address: "99 Skyview Ct, Topcity, USA",
    price: 6800,
    beds: 3,
    baths: 3,
    sqft: 2800,
    type: "Penthouse",
    imageUrl:
      PlaceHolderImages.find((img) => img.id === "property-6")?.imageUrl || "",
    imageHint:
      PlaceHolderImages.find((img) => img.id === "property-6")?.imageHint || "",
    assignedWorkerId: "user-worker-2",
  },
];

export const tenants = [
  {
    id: "ten-1",
    name: "Alice Johnson",
    propertyId: "prop-1",
    leaseEndDate: "2024-12-31",
    status: "Active",
    rent: 2200,
    email: "alice.j@example.com",
    phone: "(555) 123-4567",
  },
  {
    id: "ten-2",
    name: "Bob Williams",
    propertyId: "prop-2",
    leaseEndDate: "2025-06-30",
    status: "Active",
    rent: 3500,
    email: "bob.w@example.com",
    phone: "(555) 234-5678",
  },
  {
    id: "ten-3",
    name: "Charlie Brown",
    propertyId: "prop-3",
    leaseEndDate: "2024-08-31",
    status: "Active",
    rent: 1850,
    email: "charlie.b@example.com",
    phone: "(555) 345-6789",
  },
  {
    id: "ten-4",
    name: "Diana Miller",
    propertyId: "prop-4",
    leaseEndDate: "2024-09-30",
    status: "Moving Out",
    rent: 1500,
    email: "diana.m@example.com",
    phone: "(555) 456-7890",
  },
  {
    id: "ten-5",
    name: "Ethan Davis",
    propertyId: "prop-5",
    leaseEndDate: "2026-01-31",
    status: "Active",
    rent: 4200,
    email: "ethan.d@example.com",
    phone: "(555) 567-8901",
  },
  {
    id: "ten-6",
    name: "Fiona Garcia",
    propertyId: "prop-1",
    leaseEndDate: "2025-03-31",
    status: "New",
    rent: 2150,
    email: "fiona.g@example.com",
    phone: "(555) 678-9012",
  },
];

export const workers = [
    {
        id: "user-worker-1",
        name: "Bob the Builder",
        email: "bob@example.com",
        phone: "(555) 876-5432",
        status: "Active",
        assignedPropertyIds: ["prop-1", "prop-2", "prop-8"],
    },
    {
        id: "user-worker-2",
        name: "Handy Mandy",
        email: "mandy@example.com",
        phone: "(555) 876-5433",
        status: "Active",
        assignedPropertyIds: ["prop-3", "prop-6"],
    }
];

export const maintenanceRequests = [
  {
    id: "maint-1",
    tenantId: "ten-1",
    propertyId: "prop-1",
    issue: "Leaky faucet in kitchen",
    dateSubmitted: "2024-07-20",
    status: "New",
    priority: "High",
    assignedWorkerId: null,
  },
  {
    id: "maint-2",
    tenantId: "ten-2",
    propertyId: "prop-2",
    issue: "A/C unit not cooling",
    dateSubmitted: "2024-07-19",
    status: "Completed",
    priority: "High",
    assignedWorkerId: "user-worker-1",
  },
  {
    id: "maint-3",
    tenantId: "ten-3",
    propertyId: "prop-3",
    issue: "Broken garbage disposal",
    dateSubmitted: "2024-07-21",
    status: "New",
    priority: "Medium",
    assignedWorkerId: "user-worker-2",
  },
  {
    id: "maint-4",
    tenantId: "ten-4",
    propertyId: "prop-4",
    issue: "Cracked window pane",
    dateSubmitted: "2024-07-15",
    status: "Completed",
    priority: "Low",
    assignedWorkerId: "user-worker-2",
  },
  {
    id: "maint-5",
    tenantId: "ten-5",
    propertyId: "prop-5",
    issue: "Garage door opener is stuck",
    dateSubmitted: "2024-07-22",
    status: "New",
    priority: "Medium",
    assignedWorkerId: null,
  },
];

export const recentMaintenanceRequests = maintenanceRequests
  .filter((r) => r.status === "New" || r.status === "In Progress")
  .slice(0, 3);

export const overdueTenants = [
  {
    id: "ten-7",
    name: "George Harris",
    property: "321 Elm St, Unit 5",
    amount: "$1,200.00",
    dueDate: "Overdue by 15 days",
  },
  {
    id: "ten-8",
    name: "Hannah Lewis",
    property: "654 Pine St, Apt 1C",
    amount: "$850.00",
    dueDate: "Overdue by 5 days",
  },
];

export const rentPayments = [
  {
    id: "rent-1",
    tenantName: "Alice Johnson",
    amount: 2200,
    date: "2024-07-01",
    status: "Paid",
  },
  {
    id: "rent-2",
    tenantName: "Bob Williams",
    amount: 3500,
    date: "2024-07-01",
    status: "Paid",
  },
  {
    id: "rent-3",
    tenantName: "George Harris",
    amount: 1200,
    date: "2024-07-01",
    status: "Overdue",
  },
  {
    id: "rent-4",
    tenantName: "Hannah Lewis",
    amount: 850,
    date: "2024-07-01",
    status: "Overdue",
  },
  {
    id: "rent-5",
    tenantName: "Charlie Brown",
    amount: 1850,
    date: "2024-07-02",
    status: "Paid",
  },
];

export const documents = [
  {
    id: "doc-1",
    name: "Lease_Johnson_A.pdf",
    type: "Lease Agreement",
    uploadDate: "2023-12-15",
    size: "2.3 MB",
  },
  {
    id: "doc-2",
    name: "Application_Williams_B.pdf",
    type: "Rental Application",
    uploadDate: "2023-06-01",
    size: "1.1 MB",
  },
  {
    id: "doc-3",
    name: "Inspection_456_Oak_Ave.docx",
    type: "Inspection Report",
    uploadDate: "2024-06-15",
    size: "5.6 MB",
  },
  {
    id: "doc-4",
    name: "Notice_of_Entry_July2024.pdf",
    type: "Notice",
    uploadDate: "2024-07-10",
    size: "0.5 MB",
  },
  {
    id: "doc-5",
    name: "Rental_Rules_and_Regs.pdf",
    type: "Community Rules",
    uploadDate: "2023-01-01",
    size: "0.8 MB",
  },
];
