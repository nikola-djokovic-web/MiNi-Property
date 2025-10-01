

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Check } from "lucide-react";

const roles = [
  {
    name: "Admin",
    description: "Full access to all features and settings.",
    permissions: [
      "Manage properties",
      "Manage tenants",
      "Process payments",
      "Manage user roles",
      "Access all reports",
    ],
  },
  {
    name: "Property Manager",
    description: "Access to manage assigned properties and tenants.",
    permissions: [
      "Manage assigned properties",
      "Manage assigned tenants",
      "Handle maintenance requests",
      "View property reports",
    ],
  },
  {
    name: "Tenant",
    description: "Access to their lease, payments, and requests.",
    permissions: [
      "View lease agreement",
      "Make rent payments",
      "Submit maintenance requests",
      "View payment history",
    ],
  },
];

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-headline">
            Roles &amp; Permissions
          </h2>
          <p className="text-muted-foreground">
            Define roles to control access levels across your team.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2" />
          Add Role
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <CardTitle className="font-headline">{role.name}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {role.permissions.map((permission) => (
                  <li key={permission} className="flex items-start">
                    <Check className="mr-2 mt-1 size-4 flex-shrink-0 text-primary" />
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
