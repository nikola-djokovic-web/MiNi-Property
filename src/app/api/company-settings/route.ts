import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      companyName: user.companyName ?? null,
      companyLogo: user.companyLogo ?? null,
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { companyName, companyLogo } = await request.json();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        companyName: typeof companyName === 'string' ? companyName : undefined,
        companyLogo: typeof companyLogo === 'string' ? companyLogo : undefined,
      },
      select: { companyName: true, companyLogo: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { companyLogo: null },
    });

    return NextResponse.json({ companyName: user.companyName ?? null, companyLogo: null });
  } catch (error) {
    console.error('Error deleting company logo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
