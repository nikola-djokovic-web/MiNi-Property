import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'node:crypto';
import { prisma } from '@/server/db';
import { getSessionUser } from '@/lib/auth';

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      data: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: doc.fileUrl,
        uploadDate: doc.createdAt.toISOString().split('T')[0],
        size: `${(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB`,
      })),
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const docType = (formData.get('type') as string | null)?.trim();

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!docType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${user.tenantId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;
    await writeFile(join(uploadsDir, filename), buffer);
    const fileUrl = `/uploads/documents/${filename}`;

    const document = await prisma.document.create({
      data: {
        tenantId: user.tenantId,
        name: file.name,
        type: docType,
        fileUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedById: user.id,
      },
    });

    return NextResponse.json({
      data: {
        id: document.id,
        name: document.name,
        type: document.type,
        url: document.fileUrl,
        uploadDate: document.createdAt.toISOString().split('T')[0],
        size: `${(document.sizeBytes / 1024 / 1024).toFixed(2)} MB`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
