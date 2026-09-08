import { prisma } from "@/server/db";

export async function loadRequestForChatUser(
  requestId: string,
  user: { tenantId: string; role: string; id: string }
) {
  const request = await prisma.maintenanceRequest.findFirst({
    where: { id: requestId, tenantId: user.tenantId },
  });
  if (!request) return null;
  if (user.role === "worker" && request.assignedWorkerId !== user.id) return null;
  if (user.role === "tenant" && request.submittedByUserId !== user.id) return null;
  return request;
}
