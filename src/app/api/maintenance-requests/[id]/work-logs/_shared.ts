import { prisma } from '@/server/db';

export async function loadRequestForUser(
  requestId: string,
  user: { tenantId: string; role: string; id: string }
) {
  const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
    where: { id: requestId, tenantId: user.tenantId },
  });
  if (!maintenanceRequest) return null;
  if (user.role === 'worker' && maintenanceRequest.assignedWorkerId !== user.id) {
    return null;
  }
  return maintenanceRequest;
}
