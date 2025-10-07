"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddRequestDialog from "./add-request-dialog";

const TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "";

async function apiSend<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: any
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-tenant-id": TENANT_ID },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(
      res.status === 404
        ? `API route not found: ${url}`
        : msg || `Request failed: ${res.status}`
    );
  }
  return res.json();
}

export default function CreateMaintenanceRequestButton() {
  const handleAddRequest = async (newRequestData: any) => {
    try {
      // Use AI triage with fallback
      let triageResult = { priority: "Medium", category: "Other" };
      try {
        const { triageMaintenanceRequest } = await import("@/ai/flows/triage-maintenance-request");
        triageResult = await triageMaintenanceRequest({
          title: newRequestData.issue,
          details: newRequestData.details,
        });
      } catch (error) {
        console.warn("AI triage not available, using defaults:", error);
      }

      const fullRequest = {
        ...newRequestData,
        priority: triageResult.priority,
        category: triageResult.category,
        status: newRequestData.assignedWorkerId ? "In Progress" : "New",
      };

      const { data: created } = await apiSend<{ data: any }>(
        "/api/maintenance-requests",
        "POST",
        fullRequest
      );

      // Emit event for real-time updates
      if (typeof window !== 'undefined') {
        const eventBus = (await import("@/lib/events")).default;
        eventBus.emit("maintenance-request-added", created);
      }

      // Create notification for admins
      try {
        const propertyName = created.property?.name || created.property?.title || 'Unknown Property';
        const tenantName = created.tenant?.name || created.tenant?.email || 'Unknown Tenant';
        
        console.log('✅ Maintenance request created successfully:', {
          propertyName,
          tenantName,
          requestId: created.id,
          issue: created.issue
        });
        
        // Note: Notification is automatically created by the API
        console.log('✅ Notification will be handled by API');
      } catch (notifError) {
        console.warn('❌ API notification may have failed:', notifError);
      }

      console.log("Maintenance request created:", created);
    } catch (error) {
      console.error("Failed to create maintenance request:", error);
      throw error;
    }
  };

  return (
    <AddRequestDialog
      onAddRequest={handleAddRequest}
      triggerButton={
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Request
        </Button>
      }
    />
  );
}