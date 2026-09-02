import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/server/db';
import { getSessionUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && user.role !== 'owner' && document.uploadedById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.document.delete({ where: { id } });

    // Best-effort file removal - the DB record is the source of truth,
    // so a failure here shouldn't fail the request.
    try {
      const filePath = join(process.cwd(), 'public', document.fileUrl);
      await unlink(filePath);
    } catch (fileError) {
      console.error('Failed to remove document file from disk:', fileError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
